const Responses = require("../../common/API_Responses");
const Dynamo = require("../../common/Dynamo");
const { withHooks, hooksWithSchema } = require("../../common/hooks");
const WebSocket = require("../../common/Websocket");

const clientsTable = process.env.clientsTableName;
const roomsTable = process.env.roomsTableName;

// const schema = {
// 	body: { roomID: "string", clientID: "number"  },
// };

async function getClientsInLobby() {
	return await Dynamo.queryOn({
		TableName: clientsTable,
		index: "room-index",
		queryKey: "room",
		queryValue: 'lobby',
		select: 'connection'
	});
}

module.exports = async function ({ clientID, roomID }) {
	try {
		await Dynamo.update({
			TableName: clientsTable,
			primaryKey: "ID",
			primaryKeyValue: clientID,
			updates: { room: roomID },
		});

		const { Attributes } = await Dynamo.append({
			TableName: roomsTable,
			primaryKey: "ID",
			primaryKeyValue: roomID,
			data: { clients: [clientID] },
			select: "clients",
		});

		const message = { method: "join", room: Attributes };
		// todo only send back room id and client count
		const connections = await getClientsInLobby();
		const msgPromises = connections.map(({ connection }) => {
			if (!connection) return
			let { domainName, stage, ID } = connection
			return WebSocket.send({
				domainName,
				stage,
				connectionID: ID,
				message,
			});
		});
		await Promise.all(msgPromises);
		
	} catch (err) {
		console.log("grr", err);
	}

	console.log(`Joined room[${roomID}] client[${clientID}]`);

	return;
	// return Responses._200({});
};

// module.exports = method;
// exports = withHooks(["parse"])(handler);

// async function sendMessageAll(clients, message) {
// 	const messages = clients.map(({ connectionID }) =>
// 		WebSocket.send({ domainName, stage, connectionID, message })
// 	);
// 	return await Promise.all(messages);
// }
