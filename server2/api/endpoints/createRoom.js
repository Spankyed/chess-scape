const Responses = require("../common/API_Responses");
const Dynamo = require("../common/Dynamo");
const { hooksWithSchema } = require("../common/hooks");
const nanoid = require("nanoid/async");
const { sendMessageToLobby } = require("../common/websocket/message");

const roomsTable = process.env.roomsTableName;
const clientsTable = process.env.clientsTableName;

const schema = {
	// body: { name: "string" },
};

const handler = async (event) => {
	const {selectedColor, host, ...form} = event.body;

	const room = {
		...form,
		ID: await nanoid(),
		host,
		players: [{clientID:host, color:selectedColor}],
		spectators: [],
		created: Date.now(),
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

