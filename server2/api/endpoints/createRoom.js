const Responses = require("../common/API_Responses");
const Dynamo = require("../common/Dynamo");
const { hooksWithSchema } = require("../common/hooks");
const nanoid = require("nanoid/async");

const roomsTable = process.env.roomsTableName;

const schema = {
	// body: { name: "string" },
	// path: { ID: "string" },
};

const handler = async (event) => {
	const room = event.body;
	room.ID = await nanoid();
	console.log("room: ", room);

	const newRoom = await Dynamo.write(room, roomsTable);

	if (!newRoom) {
		return Responses._400({ message: "Failed to add room" });
	}

	return Responses._200({ newRoom });
};

exports.handler = hooksWithSchema(schema, ["log", "parse"])(handler);
