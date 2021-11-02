const Responses = require("../common/HTTP_Responses");
const Dynamo = require("../common/Dynamo");
const { hooksWithSchema } = require("../common/hooks");

const roomsTable = process.env.roomsTableName;
const matchesTable = process.env.matchesTableName;

const schema = {
	path: { ID: "string" },
};

const handler = async (event) => {
	if (!event.pathParameters.ID) {
		// failed without an ID
		return Responses._400({ message: "missing the ID from the path" });
	}

	let ID = event.pathParameters.ID;

	const room = await Dynamo.get(ID, roomsTable);
	const match = await Dynamo.get(ID, matchesTable);

	// todo if private, verify user is in room, b/c chat is included in the response
	return Responses._200({ room: sanitizeRoom(room), match });
};

exports.handler = hooksWithSchema(schema, [])(handler);
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