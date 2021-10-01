const WebSocket = require("./Websocket");
const Dynamo = require("../Dynamo");

const clientsTable = process.env.clientsTableName;

async function sendMessage({ domainName, stage, connectionID }, message) {
	return WebSocket.send({
		domainName,
		stage,
		connectionID,
		message,
	});
}

async function sendMessageToLobby(message) {
	const clients = await getClientsInLobby();
	return Promise.all(clients.map(({ connection }) => {
        if (!connection || !connectionID) return;
        return sendMessage(connection, message);
	}));
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
