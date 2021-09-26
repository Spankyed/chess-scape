const Responses = require("../common/API_Responses");
const Dynamo = require("../common/Dynamo");

const { withHooks } = require("../common/hooks");

const clientsTable = process.env.clientsTableName;

const handler = async (event) => {
	if (!event.pathParameters.room) {
		// failed without a room
		return Responses._400({ message: "missing the room from the path" });
	}
	const { room } = event.pathParameters;
	const roomClients = await Dynamo.query({
		tableName: clientsTable,
		index: "room-index",
		queryKey: "room",
		queryValue: room,
	});

	return Responses._200(roomClients);
};

exports.handler = withHooks(["log", "parse"])(handler);
