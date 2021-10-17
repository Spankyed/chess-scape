const Responses = require("../../common/HTTP_Responses");
const Dynamo = require("../../common/Dynamo");
const { sendMessageToRoom } = require("../../common/websocket/message");

// const roomsTable = process.env.roomsTableName;
const matchesTable = process.env.matchesTableName;

module.exports = async function ({ clientID, roomID, color }) {
	try {
		const { Attributes } = await Dynamo.update({
			TableName: matchesTable,
			primaryKey: "ID",
			primaryKeyValue: roomID,
			updates: { [`players.${color}.ready`]: true },
		});

		const playersReady = Object.values(Attributes.players).filter(
			(player) => player.ready
		);
		if (playersReady.length == 2) {
			const startTime = Date.now();

			await Promise.all([
				sendMessageToRoom(roomID, {
					method: "start",
					startTime,
				}),
				// Dynamo.update({
				// 	TableName: roomsTable,
				// 	primaryKey: "ID",
				// 	primaryKeyValue: roomID,
				// 	updates: { matchStarted: true },
				// }),
				Dynamo.update({
					TableName: matchesTable,
					primaryKey: "ID",
					primaryKeyValue: roomID,
					updates: {
						matchStarted: true,
						started: startTime,
					},
				}),
			]);
		}
	} catch (err) {
		// console.error(err);
		return Responses._400({ error: err.message });
	}

	console.log(`Player[${color}] ready: client[${clientID}]`);

	return Responses._200({});
};