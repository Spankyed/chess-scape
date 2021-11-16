const Responses = require("../../common/HTTP_Responses");
const Dynamo = require("../../common/Dynamo");
const { sendMessage } = require("../../common/websocket/message");

const matchesTable = process.env.matchesTableName;

module.exports = async function ({ clientID, roomID }, client, connection) {
	const match = await Dynamo.get(roomID, matchesTable);

	if (!match) return Responses._400({ message: "Match not found" });
	
	if (match.moves.length < 1) {
		// todo: prob should still send moveless board
		// todo: incase players first move wasn't received
		return Responses._400({ message: "No moves found for sync " });
	};

	sendMessage(connection, {
		method: "sync",
		moves: match.moves,
		lastMove: match.lastMove,
		colorToMove: match.colorToMove,
	});

	console.log(`Client[${clientID}] synced`);

	return Responses._200({});
};