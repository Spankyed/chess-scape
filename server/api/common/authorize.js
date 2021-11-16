const Dynamo = require("./Dynamo");
// const { sendMessage } = require("./websocket/Message");

const clientsTable = process.env.clientsTableName;

async function authorize(clientID, TOKEN, connectionID) {
	const client = await Dynamo.get(clientID, clientsTable);
	let isAuthorized = client && client.TOKEN === TOKEN;
    // if (connectionID) {
	// 	isAuthorized = isAuthorized && client.connectionID === connectionID;
    // }
	return [isAuthorized, client];
}

module.exports = {
	authorize,
};
