const Responses = require("../common/HTTP_Responses");
const Dynamo = require("../common/Dynamo");
const { hooksWithSchema } = require("../common/hooks");
const join = require("../websockets/methods/join");

const roomsTable = process.env.roomsTableName;

const schema = {
	body: { clientID: "string", roomID: "string", pin: "string" },
};

const handler = async (event) => {
	const { clientID, roomID, pin, client } = event.body;
	try {
		const room = await Dynamo.get(roomID, roomsTable);

		if (!room) {
			// todo force client back to lobby
			return Responses._400({ error: "Room not found" });
		}

		if (!room.gameOptions.pin) {
			return Responses._400({ error: "Room is not private" });
		}

		if (room.gameOptions.pin !== pin) {
			return Responses._400({
				error: "Invalid pin",
				valid: false,
				roomID,
			});
		}
		
		const response = await join({ clientID, roomID }, client, null, true)

		// console.log(`Joined private room[${roomID}] client[${clientID}]`);

		// todo append 'valid' bool to join response and return it instead
		return Responses._200({ valid: true, roomID });

	} catch (err) {
		console.error(err);
		return Responses._400({ error: err.message });
	}
};

// exports.handler = hooksWithSchema(schema, ["log", "parse"])(handler);
exports.handler = hooksWithSchema(schema, ["parse", "authorize"])(handler);
