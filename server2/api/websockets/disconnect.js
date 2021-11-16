const Responses = require("../common/HTTP_Responses");
const Dynamo = require("../common/Dynamo");
const { withHooks } = require("../common/hooks");

const clientsTable = process.env.clientsTableName;

async function findClient(connectionID) {
	if (!connectionID) return [false];
	return Dynamo.queryOn({
		TableName: clientsTable,
		index: "connection-index",
		queryKey: "connectionID",
		queryValue: connectionID,
	});
}

const handler = async (event) => {
	const { connectionId: connectionID } = event.requestContext;

	const [client] = await findClient(connectionID);

	// ! can/will find & update wrong client if user has multiple client records with same connectionID

	if (!client) {
		return Responses._400({ message: "Unable to find client to disconnect" });
	}

	await Dynamo.update({
		TableName: clientsTable,
		primaryKey: "ID",
		primaryKeyValue: client.ID,
		updates: {
			connection: false,
			connectionID: "0",
		},
	});

	console.log(`Disconnected client [${client.username}]`);
	return Responses._200({ message: "disconnected" });
};

exports.handler = withHooks(["parse"])(handler);
