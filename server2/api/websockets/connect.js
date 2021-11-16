const Response = require("../common/HTTP_Responses");
const Dynamo = require("../common/Dynamo");
const { sendMessage } = require("../common/websocket/message");
const { withHooks } = require("../common/hooks");

const clientsTable = process.env.clientsTableName;

async function findClient(TOKEN) {
	if (!TOKEN) return [false]
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

	// ! CLIENT is passed in event if connect is called from ./message.js
	// ! srs problem if user can somehow smuggle this param into event
	// ! as it will bypass authorization
	const CLIENT = event.client;

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

	// todo append connection to a list to allow multiple browser windows
	// todo must also refactor sendMessage() in order to send message to all the clients connections
	const clientConn = await Dynamo.update({
		TableName: clientsTable,
		primaryKey: "ID",
		primaryKeyValue: client.ID,
		updates: {
			connection,
			connectionID,
		},
	});

	console.log(`Connected client [${client.username}]`, { clientConn });

	return Response._200({ message: "connected" });
};

exports.handler = withHooks(["parse"])(handler);
// exports.handler = withHooks(["log", "parse"])(handler);
