const Responses = require("../common/HTTP_Responses");
const Dynamo = require("../common/Dynamo");
const { hooksWithSchema } = require("../common/hooks");
const nanoid = require("nanoid/async");
const { sendMessageToLobby } = require("../common/websocket/message");

const roomsTable = process.env.roomsTableName;
const matchesTable = process.env.matchesTableName;
const clientsTable = process.env.clientsTableName;

// todo validate schema
const schema = {
	// body: { name: "string" },
};

const handler = async (event) => {
	const {selectedColor, host, ...form} = event.body;

	// todo authorize host

	const room = {
		...form,
		ID: await nanoid(),
		host,
		players: { [selectedColor]: { clientID: host, ready: false } },
		spectators: [],
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
			host,
			players: { [selectedColor]: host },
			lastMove: {
				fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
			},
			created: room.created,
			started: false,
		};
		await Promise.all([
			sendMessageToLobby({ method: "create", newRoom }),
			Dynamo.write(match, matchesTable)
		])
	}

	console.log(`Player[${host}] created room[${newRoom.ID}]`);

	return Responses._200({ newRoom });
};

// exports.handler = hooksWithSchema(schema, ["log", "parse"])(handler);
exports.handler = hooksWithSchema(schema, ["parse"])(handler);

