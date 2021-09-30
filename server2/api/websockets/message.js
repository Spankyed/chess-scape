const Responses = require("../common/API_Responses");
const Dynamo = require("../common/Dynamo");
const WebSocket = require("../common/websocket/Websocket");
const { withHooks } = require("../common/hooks");
const { join } = require("./methods");

const clientsTable = process.env.clientsTableName;

const handler = async (event) => {
	const { connectionId: connectionID } = event.requestContext;
	const message = event.body;
	const { clientID, TOKEN, method } = message;

	console.log(`Message [${method}] from [${clientID}]`, message);

	const client = await Dynamo.get(clientID, clientsTable);
	const { domainName, stage } = client.connection;

	if (validate(connectionID, TOKEN, client)) {
		WebSocket.close({ domainName, stage, connectionID }); // ! dont do this, send unauthorize msg instead
		return Responses._400({ message: "Unauthorized connection" });
	} // todo move validation to hooks, return 403, and disconnect client

	await Dynamo.update({
		TableName: clientsTable,
		primaryKey: "ID",
		primaryKeyValue: clientID,
		updates: {
			lastMessage: message,
		},
	});

	const methods = { join }; // set message handlers
	const messageHandler = methods[method];

	if (messageHandler) await messageHandler(message);

	// await WebSocket.send({
	// 	domainName,
	// 	stage,
	// 	connectionID,
	// 	message
	// });

	return Responses._200({ message: "Message received and responded" });
};

exports.handler = withHooks(["parse"])(handler);

// async function sendMessageAll(clients, message) {
// 	const messages = clients.map(({ connectionID }) =>
// 		WebSocket.send({ domainName, stage, connectionID, message })
// 	);
// 	return await Promise.all(messages);
// }


function validate(connectionID, TOKEN, client) {
	return (connectionID != client.connectionID || TOKEN != client.TOKEN  ) 
}