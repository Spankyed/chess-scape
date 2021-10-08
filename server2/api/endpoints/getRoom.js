const Responses = require("../common/HTTP_Responses");
const Dynamo = require("../common/Dynamo");
const { hooksWithSchema } = require("../common/hooks");

const roomsTable = process.env.roomsTableName;

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

	return Responses._200({ room });
};

exports.handler = hooksWithSchema(schema, [])(handler);
// exports.handler = hooksWithSchema(schema, ["log"])(handler);
