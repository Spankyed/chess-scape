const Responses = require("../common/HTTP_Responses");
const Dynamo = require("../common/Dynamo");
const { hooksWithSchema } = require("../common/hooks");
const nanoid = require("nanoid/async");
const { sendMessageToLobby } = require("../common/websocket/message");
const initialState = require("../websockets/methods/move/state");

const roomsTable = process.env.roomsTableName;
const matchesTable = process.env.matchesTableName;
const clientsTable = process.env.clientsTableName;

// todo validate schema
const schema = {
	// body: { name: "string" },
};

const handler = async (event) => {
	const {client, clientID, selectedColor, ...form} = event.body;

	const room = {
		...form,
		ID: await nanoid(),
		host: clientID,
		hostName: client.username,
		players: { [selectedColor]: { clientID } },
		spectators: {},
		chat: [],
		created: Date.now(),
		matchStarted: false,
	};
	
	const newRoom = await Dynamo.write(room, roomsTable);
	if (!newRoom) {
		console.log("Failed to create room");
		return Responses._400({ message: "Failed to create room" });
	} else {
		const match = {
			ID: room.ID,
			host: room.host,
			players: {
				[selectedColor]: {
					clientID: room.host,
					ready: false,
					committed: false,
				},
			},
			lastMove: {
				fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
			},
			colorToMove: "white",
			created: room.created,
			started: false,
			state: initialState,
			moves: [],
		};
		await Promise.all([
			sendMessageToLobby({ method: "create", newRoom }),
			Dynamo.write(match, matchesTable)
		])
	}

	console.log(`Player[${clientID}] created room[${newRoom.ID}]`);

	return Responses._200({ newRoom });
};

// exports.handler = hooksWithSchema(schema, ["log", "parse"])(handler);
exports.handler = hooksWithSchema(schema, ["parse", "authorize"])(handler);

