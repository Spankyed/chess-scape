const Responses = require("../common/HTTP_Responses");
const Dynamo = require("../common/Dynamo");
const { hooksWithSchema } = require("../common/hooks");
const { sendMessage } = require("../common/websocket/message");

const roomsTable = process.env.roomsTableName;
const matchesTable = process.env.matchesTableName;

const schema = {
	body: { clientID: "string", roomID: "string" },
};

const handler = async (event) => {
	const { client, roomID } = event.body;

	const [room, match] = await Promise.all([
		Dynamo.get(roomID, roomsTable),
		Dynamo.get(roomID, matchesTable)
	]);

	if (!room) {
		return Responses._400({ error: "Room not found" });
	}

	// todo if private, verify user is in room, b/c chat is included in the response
	// todo ^ must do so carefully as client.room may not be updated when req is made
	return Responses._200({ room: sanitizeRoom(room), match });
};

exports.handler = hooksWithSchema(schema, ["parse", "authorize"])(handler);
// exports.handler = hooksWithSchema(schema, ["log"])(handler);

function sanitizeRoom(room) {
	if (!room) return null;
	return {
		...room,
		gameOptions: {
			...room.gameOptions,
			pin: undefined,
		},
	};
}