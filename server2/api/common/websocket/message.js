const WebSocket = require("./Websocket");
const Dynamo = require("../Dynamo");

const clientsTable = process.env.clientsTableName;

async function sendMessage(connections, message) {
	if (!(connections instanceof Array)) connections = [connections];
	return Promise.all(
		connections.map(({ connectionID, domainName, stage }) => {
			if (connectionID == '0' || !domainName || !stage) return;
			return WebSocket.send({
				domainName,
				stage,
				connectionID,
				message,
			}).catch(async (err) => {
				console.error(err)
				console.warn({ connectionID });
				if (connectionID) await removeConnection(connectionID);
			});
		})
	);
	async function removeConnection(ID) {
		const [client] = await Dynamo.queryOn({
			TableName: clientsTable,
			index: "connection-index",
			queryKey: "connectionID",
			queryValue: ID,
		});
		if (client) {
			return await Dynamo.update({
				TableName: clientsTable,
				primaryKey: "ID",
				primaryKeyValue: client.ID,
				updates: {
					connection: false,
					connectionID: "0",
				},
			});
		}
	}
}

async function sendMessageToRoom(roomID, message) {
	const clients = await getClientsInRoom(roomID);
	return sendMessage(
		clients.flatMap(c => c.connection ? [c.connection] : []),
		message
	);
}

async function sendMessageToRoomExcept(roomID, ignoreID, message) {
	const clients = await getClientsInRoom(roomID);
	return sendMessage(
		clients.flatMap(c => c.connection && c.ID != ignoreID ? [c.connection] : []),
		message
	);
}

async function sendMessageToLobby(message) {
	const clients = await getClientsInRoom("lobby");
	return sendMessage(
		clients.flatMap(c => c.connection ? [c.connection] : []),
		message
	);
}

async function getClientsInRoom(roomID) {
	return await Dynamo.queryOn({
		TableName: clientsTable,
		index: "room-index",
		queryKey: "room",
		queryValue: roomID,
		// select: "connection",
	});
}

module.exports = {
	sendMessage,
	sendMessageToRoom,
	sendMessageToRoomExcept,
	sendMessageToLobby,
};
