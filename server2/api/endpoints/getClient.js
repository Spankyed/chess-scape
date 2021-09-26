const Responses = require("../common/API_Responses");
const Dynamo = require("../common/Dynamo");

const { withHooks } = require("../common/hooks");

const clientsTable = process.env.clientsTableName;

const handler = async (event) => {
	if (!event.pathParameters.ID) {
		// failed without an ID
		return Responses._400({ message: "missing the ID from the path" });
	}

	let ID = event.pathParameters.ID;

	const client = await Dynamo.get(ID, clientsTable);

	return Responses._200({ client });
};

exports.handler = withHooks(["log", "parse"])(handler);
