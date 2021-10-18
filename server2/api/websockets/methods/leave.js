const Responses = require("../../common/HTTP_Responses");
const Dynamo = require("../../common/Dynamo");
const {
	sendMessageToRoom,
	sendMessageToLobby,
} = require("../../common/websocket/message");

const roomsTable = process.env.roomsTableName;
const matchesTable = process.env.matchesTableName;

module.exports = async function ({ clientID, roomID }, {username}) {
	try {
		const match = await Dynamo.get(roomID, matchesTable);

		if (!match) return Responses._400({ message: "Match not found" });

		const players = Object.entries(match.players)
		const [color, player] = players.filter(
			([_, player]) => player.clientID == clientID
		)[0];

		const tasks = [
			sendMessageToRoom(roomID, {
				method: "leave",
				clientID, // todo add username to leave message
				group: player ? "players" : "spectators",
				username,
			}),
		];

		if (!player) {
			tasks.push(
				Dynamo.update({
					TableName: matchesTable,
					primaryKey: "ID",
					primaryKeyValue: roomID,
					updates: {
						[`spectators.${clientID}`]: {
							clientID,
							watching: false,
						},
					},
				})
			);
		} else if (match.finished || (players.length == 2 && !match.started)) {
			// todo user shouldn't be able to leave if !matchFinished & match is time controlled
			tasks.push(
				Dynamo.update({
					// ! probably shouldn't be deleting player from match record
					TableName: matchesTable,
					primaryKey: "ID",
					primaryKeyValue: roomID,
					updates: {
						[`players.${color}`]: null,
					},
				}),
				Dynamo.delete(roomID, roomsTable), // if player leaves after game ends, delete room
				sendMessageToLobby({ method: "delete", roomID }),
				sendMessageToRoom(roomID, { method: "disband" }),
			);
			Promise.all([tasks]);
		}

		console.log(`Client[${clientID}] left room[${roomID}]`);

		return Responses._200({});

	} catch (err) {
		console.error(err)
		return Responses._400({ error: err.message });
	}
};