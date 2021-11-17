const Responses = require("../common/HTTP_Responses");
const Dynamo = require("../common/Dynamo");

const { withHooks } = require("../common/hooks");

const clientsTable = process.env.clientsTableName;

const schema = {
	path: { ID: "string" },
};

const handler = async (event) => {
	let ID = event.pathParameters.ID;

	const client = await Dynamo.get(ID, clientsTable);

	return Responses._200({ username: client.username });
};

exports.handler = withHooks(["log", "parse"])(handler);
