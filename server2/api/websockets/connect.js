const Response = require("../common/HTTP_Responses");
const Dynamo = require("../common/Dynamo");
const { sendMessage } = require("../common/websocket/message");
const { withHooks } = require("../common/hooks");

const clientsTable = process.env.clientsTableName;

async function findClient(TOKEN) {
	return Dynamo.queryOn({
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

	const CLIENT = event.client; // ! input when called from ./message.js, srs problem if user can smuggle this param into event

	const { TOKEN } = event.queryStringParameters;
	const [client] = CLIENT ? [CLIENT] : await findClient(TOKEN);
	if (!client || !client.ID) {
		await sendMessage(
			{ connectionID, domainName, stage },
			{ method: "unauthorize" }
		);
		return Response._401({ message: "Unauthorized connection" });
	}

	const connection = {
		// IP,
		connectionID: connectionID || 0,
		created: Date.now(),
		domainName,
		stage,
		// messages: [],
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

	console.log(`Connected client [${client.ID}]`, { clientConn });

	return Response._200({ message: "connected" });
};

exports.handler = withHooks(["parse"])(handler);
// exports.handler = withHooks(["log", "parse"])(handler);
