const Responses = require("../../common/HTTP_Responses");
const Dynamo = require("../../common/Dynamo");
const { deleteRoomEvents } = require("../../endpoints/deleteRoom");

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

		const foundPlayer = players.find(
			([_, player]) => player.clientID == clientID
		);
		const [color, player] = foundPlayer || [];

		sendMessageToRoom(roomID, {
			method: "leave",
			group: player ? "players" : "spectators",
			clientID,
			username,
		});

		if (!player) {
			Dynamo.update({
				TableName: roomsTable,
				primaryKey: "ID",
				primaryKeyValue: roomID,
				updates: {
					[`spectators.${clientID}.watching`]: false,
				},
			});
		} else if (match.finished || (players.length == 2 && !match.started)) {
			// delete room if player leaves when match finished
			// todo user shouldn't be able to leave if match is time controlled & not finished
			// todo dont attempt to delete room if already deleted
			const room = await Dynamo.get(roomID, roomsTable);
			await Promise.all([
				Dynamo.update({
					// ! probably shouldn't be deleting player from match record
					// might be ok because match is saved once finished, ergo before reaching here
					TableName: matchesTable,
					primaryKey: "ID",
					primaryKeyValue: roomID,
					updates: {
						[`players.${color}`]: null,
					},
				}),
				...deleteRoomEvents(room),
			]);
		}

		console.log(`Client[${clientID}] left room[${roomID}]`);

		return Responses._200({});

	} catch (err) {
		// console.error(err)
		return Responses._400({ error: err.message });
	}
};