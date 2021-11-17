const Responses = require("../common/HTTP_Responses");
const Dynamo = require("../common/Dynamo");
const { withHooks } = require("../common/hooks");
const { deleteRoomEvents } = require("../endpoints/deleteRoom");

const clientsTable = process.env.clientsTableName;
const matchesTable = process.env.matchesTableName;
const roomsTable = process.env.roomsTableName;

async function findClient(connectionID) {
	if (!connectionID) return [false];
	return Dynamo.queryOn({
		TableName: clientsTable,
		index: "connection-index",
		queryKey: "connectionID",
		queryValue: connectionID,
	});
}

async function findHostedRoom(clientID) {
	if (!clientID) return [false];
	return Dynamo.queryOn({
		TableName: roomsTable,
		index: "host-index",
		queryKey: "host",
		queryValue: clientID,
	});
}

async function checkMatchFinished(roomID) {
	const match = await Dynamo.get(roomID, matchesTable);
	return !!match.finished;
}

const handler = async (event) => {
	const { connectionId: connectionID } = event.requestContext;
	// ! TOKEN ISNT SENT WITH REQUEST SO CANNOT AUTHENTICATE USER

	const [client] = await findClient(connectionID);

	if (!client) {
		return Responses._400({
			message: "Unable to find client to disconnect",
		});
	}

	// todo move get request to deleteRoom.js
	const [room] = await findHostedRoom(client.ID);

	// const canDelete = room && (!room.matchStarted || await checkMatchFinished(room.ID));
	const canDelete = room && await checkMatchFinished(room.ID);

	await Promise.all([
		Dynamo.update({
			TableName: clientsTable,
			primaryKey: "ID",
			primaryKeyValue: client.ID,
			updates: {
				connection: false,
				connectionID: "0",
			},
		}),
		...(canDelete ? [...deleteRoomEvents(room)] : []),
	]);

	console.log(`Disconnected client [${client.username}]`);
	return Responses._200({ message: "disconnected" });
};

exports.handler = withHooks(["parse"])(handler);
