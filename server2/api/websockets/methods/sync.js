const Responses = require("../../common/HTTP_Responses");
const Dynamo = require("../../common/Dynamo");
const { sendMessage } = require("../../common/websocket/message");

const matchesTable = process.env.matchesTableName;

module.exports = async function ({ clientID, roomID }, client, connection) {
	const match = await Dynamo.get(roomID, matchesTable);

	if (match.moves.length < 1) {
		return Responses._400({ message: 'No moves found for sync '});
	};

	sendMessage(connection, { method: "sync", moves: match.moves , lastMove: match.lastMove });

	console.log(`Client[${clientID}] synced`);

	return Responses._200({});
};