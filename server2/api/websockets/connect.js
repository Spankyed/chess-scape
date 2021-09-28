const Response = require("../common/API_Responses");
const Dynamo = require("../common/Dynamo");
const WebSocket = require("../common/Websocket");
const { withHooks } = require("../common/hooks");

const clientsTable = process.env.clientsTableName;

async function findClient(TOKEN) {
	return await Dynamo.queryOn({
		TableName: clientsTable,
		index: "token-index",
		queryKey: "TOKEN",
		queryValue: TOKEN,
	});
}

const handler = async (event) => {
	const {
		connectionId: connectionID,
		domainName,
		stage,
	} = event.requestContext;
	// todo wrap everything in try catch, if err close websocket
	// !parse token, and compare to DB clients before updating client connection
	const TOKEN = event.headers["Sec-WebSocket-Protocol"];

	const [client] = await findClient(TOKEN);

	if (!client || !client.ID) {

		return Response._400({ method: "Unauthorized connection" });
	}

	const connection = {
		// IP,
		ID: connectionID,
		created: Date.now(),
		domainName,
		stage,
		messages: [],
		connected: true,
	};

	const clientConn = await Dynamo.update({
		TableName: clientsTable,
		primaryKey: "ID",
		primaryKeyValue: client.ID,
		updates: {
			connection,
			connectionID,
		},
	});

	console.log(`Connected client [${client.ID}]`, {clientConn});

	return Response._200({ message: "connected" });
};

exports.handler = withHooks(["parse"])(handler);
// exports.handler = withHooks(["log", "parse"])(handler);
