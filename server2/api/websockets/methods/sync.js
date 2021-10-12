const Responses = require("../../common/HTTP_Responses");
const Dynamo = require("../../common/Dynamo");
const { sendMessage } = require("../../common/websocket/message");

const matchesTable = process.env.matchesTableName;

module.exports = async function ({ clientID, roomID }, connection) {
	const match = await Dynamo.get(roomID, matchesTable);

	sendMessage(connection, { method: "sync", moves: match.moves });

	console.log(`Client[${clientID}] synced`);

	return Responses._200({});
};