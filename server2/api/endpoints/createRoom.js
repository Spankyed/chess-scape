const Responses = require("../common/HTTP_Responses");
const Dynamo = require("../common/Dynamo");
const { hooksWithSchema } = require("../common/hooks");
const { sendMessageToLobby } = require("../common/websocket/message");
const { customAlphabet } = require("nanoid");
const nanoid = customAlphabet("1234567890abcdef", 20);
const initialState = require("../websockets/methods/move/state");

const roomsTable = process.env.roomsTableName;
const matchesTable = process.env.matchesTableName;
const clientsTable = process.env.clientsTableName;

// todo validate schema
const schema = {
	// body: { name: "string" },
};

function allowEnabledOptions(gameOptions) {
	const { pin, selectedOpp, selectedColor } = gameOptions;
	return {
		name: "forever",
		time: { minutes: "—", increment: "—" },
		selectedOpp: selectedOpp == "computer" ? "anyone" : selectedOpp,
		pin,
		selectedColor,
	};
}

const handler = async (event) => {
	// todo do not allow to create room if already hosting room 
	const { client, clientID, gameOptions: opts } = event.body;
	const { selectedColor } = opts

	const rooms = await Dynamo.getAll(roomsTable);
	// check if cient is host in any rooms
	const isHost = rooms.find((room) => room.host === clientID);

	if (isHost) {
		return Responses._409({
			message: "You are already hosting a room",
		});
	}

	const room = {
		gameOptions: allowEnabledOptions(opts),
		ID: nanoid(),
		host: clientID,
		hostName: client.username,
		players: { [selectedColor]: { clientID, username: client.username } },
		selectedColor,
		spectators: {},
		chat: [],
		created: Date.now(),
		matchStarted: false,
	};

	try {
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
				selectedColor,
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
				Dynamo.write(match, matchesTable),
			]);
		}

		console.log(`Player[${clientID}] created room[${newRoom.ID}]`);
		return Responses._200({ newRoom });

	} catch (err) {
		console.error(err);
		return Responses._400({ error: err.message });
	}
};

// exports.handler = hooksWithSchema(schema, ["log", "parse"])(handler);
exports.handler = hooksWithSchema(schema, ["parse", "authorize"])(handler);

