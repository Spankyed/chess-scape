const Responses = require("../common/API_Responses");
const Dynamo = require("../common/Dynamo");
const { hooksWithSchema } = require("../common/hooks");
const nanoid = require("nanoid/async");
const WebSocket = require("../common/Websocket");

const roomsTable = process.env.roomsTableName;
const clientsTable = process.env.clientsTableName;

const schema = {
	// body: { name: "string" },
	// path: { ID: "string" },
};

const handler = async (event) => {
	const form = event.body;

	const room = {
		...form,
		ID: await nanoid(),
		created: Date.now(),
		clients: [],
	};
	console.log("room: ", room);
	
	const newRoom = await Dynamo.write(room, roomsTable);

	await sendMessageToLobby({method:'create', newRoom})

	if (!newRoom) {
		return Responses._400({ message: "Failed to add room" });
	}

	return Responses._200({ newRoom });
};

// exports.handler = hooksWithSchema(schema, ["log", "parse"])(handler);
exports.handler = hooksWithSchema(schema, ["parse"])(handler);

async function sendMessageToLobby(message) {
	const connections = await getConnectionsInLobby();
	const msgPromises = connections.map(({ connection }) => {
		if (!connection) return
		let { domainName, stage, ID } = connection;
		return WebSocket.send({
			domainName,
			stage,
			connectionID: ID,
			message,
		});
	});
	return Promise.all(msgPromises);
}

async function getConnectionsInLobby() {
	return await Dynamo.queryOn({
		TableName: clientsTable,
		index: "room-index",
		queryKey: "room",
		queryValue: "lobby",
		// select: "connection",
	});
}