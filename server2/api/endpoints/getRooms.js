const Responses = require("../common/API_Responses");
const Dynamo = require("../common/Dynamo");

const { withHooks } = require("../common/hooks");

const roomsTable = process.env.roomsTableName;

const handler = async (event) => {
	const rooms = await Dynamo.getAll(roomsTable);

	return Responses._200({ rooms });
};

exports.handler = withHooks(["log", "parse"])(handler);
