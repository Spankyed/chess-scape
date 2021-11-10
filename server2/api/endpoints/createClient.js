const Responses = require("../common/HTTP_Responses");
const Dynamo = require("../common/Dynamo");
const { hooksWithSchema } = require("../common/hooks");
const { customAlphabet } = require("nanoid");
const nanoid = customAlphabet("1234567890abcdef", 20);

const clientsTable = process.env.clientsTableName;

const schema = {
	body: { username: "string", rating: "string" },
};

const handler = async (event) => {
	const form = event.body;
	const uuids = [nanoid(), nanoid()];
	client = {
		...form,
		ID: uuids[0],
		TOKEN: uuids[1],
		connectionID: "0",
		connection: false,
		room: "lobby",
		created: Date.now(),
		ip: event.requestContext.identity.sourceIp,
	};

	const newClient = await Dynamo.write(client, clientsTable);

	if (!newClient) {
		return Responses._400({ message: "Failed to create new client" });
	}

	return Responses._200({ newClient });
};

// exports.handler = hooksWithSchema(schema, ["log", "parse"])(handler);
exports.handler = hooksWithSchema(schema, ["parse"])(handler);
