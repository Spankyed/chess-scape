const WebSocket = require("./Websocket");
const Dynamo = require("../Dynamo");

const clientsTable = process.env.clientsTableName;

async function sendMessage({ domainName, stage, connectionID }, message) {
	return WebSocket.send({
		domainName,
		stage,
		connectionID,
		message,
	}).catch((_) => removeConnection(ID));
}

async function sendMessageToLobby(message) {
	const clients = await getClientsInLobby();
	return Promise.all(
		clients.map(({ ID, connection, connectionID }) => {
			if (!connection || !connectionID) return;
			return sendMessage(connection, message)
		})
	);
}

async function removeConnection(ID) {
	return await Dynamo.update({
		TableName: clientsTable,
		primaryKey: "ID",
		primaryKeyValue: ID,
		updates: {
			connection: false,
			connectionID: "0",
		},
	});
}

async function getClientsInLobby() {
	return await Dynamo.queryOn({
		TableName: clientsTable,
		index: "room-index",
		queryKey: "room",
		queryValue: "lobby",
		// select: "connection",
	});
}

module.exports = {
    sendMessage,
	sendMessageToLobby
};
