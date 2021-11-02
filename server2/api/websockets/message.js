const Responses = require("../common/HTTP_Responses");
const Dynamo = require("../common/Dynamo");
const { sendMessage } = require("../common/websocket/message");
const { withHooks } = require("../common/hooks");
const { authorize } = require("../common/authorize");
const methods = require("./methods");
const connect = require("./connect");

const clientsTable = process.env.clientsTableName;

const handler = async (event) => {
	const {
		connectionId: connectionID,
		domainName,
		stage,
	} = event.requestContext;
	const connection = {
		connectionID,
		domainName,
		stage,
	};
	const message = event.body;
	const { clientID, TOKEN, method } = message;

	const [isAuthorized, client] = await authorize(
		clientID,
		TOKEN,
		connectionID
	);

	const sameConnection = client.connectionID === connectionID;
	const shouldUpdate = !sameConnection || !client.connection.connected;
	if (shouldUpdate) connect.handler({ ...event, client });

	console.log(`Message [${method}] from [${clientID}]`, {
		message,
		isAuthorized,
		client,
	});

	if (!isAuthorized) {
		console.warn(
			`Unauthorized message[${method}] from [${clientID}] token[${TOKEN}]`
		);
		await sendMessage(connection, { method: "unauthorize" });
		return Responses._401({ message: "Unauthorized connection" });
	}

	await Dynamo.update({
		TableName: clientsTable,
		primaryKey: "ID",
		primaryKeyValue: clientID,
		updates: {
			lastMessage: message,
		},
	});

	const messageHandler = methods[method];

	if (messageHandler) await messageHandler(message, client, connection);

	// if (messageHandler) return await messageHandler(message);
	// else return Responses._400({ error: "Message not understood" });

	return Responses._200({
		message: `Message[${method}] from[${clientID}] received and responded`,
	});
};

exports.handler = withHooks(["parse"])(handler);

// const { deserialize } = require('bson');

// const parseMessage = (state) => {
//     const { body } = state.event
//     let isBinary = Buffer.isBuffer(body)
//     let message = isBinary ? deserialize(body, {  promoteBuffers: true }) : JSON.parse(body)
//     if (!message) {
//         state.response = Responses._400({ error: 'No message found' })
//     }
//     if (isBinary && !isValidFileType(message.rawData)) {
//         state.response = Responses._400({ error: 'Invalid file type' })
//     }
//     state.event.message = message
//     return state
// }