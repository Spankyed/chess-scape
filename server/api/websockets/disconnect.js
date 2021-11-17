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

const handler = async (event) => {
	const { connectionId: connectionID } = event.requestContext;
	// ! TOKEN ISNT SENT WITH REQUEST SO CANNOT AUTHENTICATE USER

	const [client] = await findClient(connectionID);

	if (!client) {
		return Responses._400({
			message: "Unable to find client to disconnect",
		});
	}

	const rooms = await getRoomsToDelete(client);

	const deleteEvents = rooms.map((room) => deleteRoomEvents(room)).flat();

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
		...deleteEvents
	]);

	console.log(`Disconnected client [${client.username}]`);
	return Responses._200({ message: "disconnected" });
};

exports.handler = withHooks(["parse"])(handler);

async function getRoomsToDelete(client) {
	const isInLobby = client.room == "lobby";
	const [hostedRoom] = (await findHostedRoom(client.ID)) || [];
	const rooms = dedupe([
		...(hostedRoom ? [hostedRoom] : []),
		...(!isInLobby ? [await Dynamo.get(client.room, roomsTable)] : []),
	])
	const isPlayer = (room) =>
		room &&
		Object.values(room.players).find((p) => p.clientID == client.ID);
	const canDelete = async (room) => room && (await checkCanDelete(room));
	const roomsToDelete = await Promise.all(
		rooms.filter(isPlayer).map(canDelete)
	);
	return roomsToDelete.filter((r) => r);
}

async function checkCanDelete(room) {
	if (!room) return false
	const match = room && (await Dynamo.get(room.ID, matchesTable));
	const abandonded = Object.values(room.players).length < 2 && !room.matchStarted;
	return (abandonded || !!match.finished) && room;
}

function dedupe(array) {
	const seen = {};
	return array.filter(({ ID }) => {
		if (seen[ID]) return false;
		seen[ID] = true;
		return true;
	});
}