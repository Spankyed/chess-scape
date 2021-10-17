const Responses = require("../../common/HTTP_Responses");
const Dynamo = require("../../common/Dynamo");
const { sendMessageToRoom } = require("../../common/websocket/message");

// const roomsTable = process.env.roomsTableName;
const matchesTable = process.env.matchesTableName;

module.exports = async function ({ clientID, roomID }) {
	try {
		const match = await Dynamo.get(roomID, matchesTable);

		if (!match) return Responses._400({ message: "Match not found" });

		const [color, player] = Object.entries(match.players).filter(
			([_, player]) => player.clientID == clientID
		)[0];

		Promise.all([
			...[
				player
					? Dynamo.update({
							TableName: matchesTable,
							primaryKey: "ID",
							primaryKeyValue: roomID,
							updates: {
								[`players.${color}`]: null,
							},
					  })
					: Dynamo.update({
							TableName: matchesTable,
							primaryKey: "ID",
							primaryKeyValue: roomID,
							updates: {
								[`spectators.${clientID}`]: {
									clientID,
									watching: false,
								},
							},
					  }),
			],
			sendMessageToRoom(roomID, {
				method: "leave",
				clientID, // todo add username to leave message
				group: player ? "players" : "spectators",
			}),
		]);

		console.log(`Client[${clientID}] left room[${roomID}]`);

		return Responses._200({});

	} catch (err) {
		console.error(err)
		return Responses._400({ error: err.message });
	}
};