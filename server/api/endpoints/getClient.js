const Responses = require("../common/HTTP_Responses");
const Dynamo = require("../common/Dynamo");

const { hooksWithSchema } = require("../common/hooks");

const clientsTable = process.env.clientsTableName;

const schema = {
	path: { ID: "string" },
};

const handler = async (event) => {
	let ID = event.pathParameters.ID;

	const client = await Dynamo.get(ID, clientsTable);

	if (!client) {
		return Responses._400({ error: "Client not found" });
	}

	return Responses._200({ username: client.username });
};
exports.handler = hooksWithSchema(schema, [])(handler);
