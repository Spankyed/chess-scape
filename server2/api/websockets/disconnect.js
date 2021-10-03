const Responses = require("../common/API_Responses");
const Dynamo = require("../common/Dynamo");
const { withHooks } = require("../common/hooks");

const clientsTable = process.env.clientsTableName;

async function findClient(connectionID) {
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
	// ! could find/update wrong client if user has multiple client records with same connectionID
	if (!client) {
		return Responses._400({ message: "Disconnect encountered problems" });
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

	console.log(`Disconnected client [${client.ID}]`);
	return Responses._200({ message: "disconnected" });
};

exports.handler = withHooks(["parse"])(handler);
