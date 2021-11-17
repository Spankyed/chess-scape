const Responses = require("../common/HTTP_Responses");
const Dynamo = require("../common/Dynamo");
const S3 = require("../common/S3");
const { archiveChat } = require("../common/archive");
const { hooksWithSchema } = require("../common/hooks");
const {
	sendMessageToLobby,
	sendMessageToRoom,
	sendMessageToRoomExcept,
} = require("../common/websocket/message");

const roomsTable = process.env.roomsTableName;
const matchesTable = process.env.matchesTableName;
const mediaTable = process.env.mediaTableName;
const bucket = process.env.bucketName;

const schema = {
	body: { ID: "string" },
};

async function removeMedia(roomID) {
	const roomMedia = await Dynamo.queryOn({
		TableName: mediaTable,
		index: "room-index",
		queryKey: "roomID",
		queryValue: roomID,
	});
	if (!roomMedia) return true;
	const [removedMedia] = await Promise.all([
		...roomMedia.map((media) => Dynamo.delete(media.ID, mediaTable)),
		...roomMedia.map((media) => S3.delete(media.ID, bucket)),
	]);

	return removedMedia;
}

function deleteRoomEvents(room) {
	return [
		removeMedia(room.ID),
		Dynamo.delete(room.ID, roomsTable),
		Dynamo.delete(room.ID, matchesTable),
		archiveChat(room),
		sendMessageToLobby({ method: "delete", roomID: room.ID }),
		sendMessageToRoom(room.ID, { method: "disband" }),
	];
}

const handler = async (event) => {
	const { clientID, ID } = event.body;

	const [room, match] = await Promise.all([
		Dynamo.get(ID, roomsTable),
		Dynamo.get(ID, matchesTable),
	]);

	const isAdmin = clientID === 'angel'

	if (match.host != clientID && !isAdmin) {
		return Responses._400({
			message: "User doesn't have permssion to delete this room",
		});
	}

	if (match.started && match.moves.length > 1 && !isAdmin) {
		return Responses._400({
			message: "Can't delete room when match in progress",
		});
	}

	const [removedMedia, deletedRoom] = await Promise.all([
		...deleteRoomEvents(room),
	]);

	if (!deletedRoom) {
		return Responses._400({ message: "Failed to delete room" });
	} else if (!removedMedia) {
		return Responses._400({
			message: "Failed to remove media files from S3",
		});
	}

	console.log(`Client[${clientID}] deleted room[${ID}]`);

	return Responses._200({
		message: `Room successfully deleted [${ID}]`,
		roomID: ID,
	});
};

module.exports = {
	handler: hooksWithSchema(schema, ["parse", "authorize"])(handler),
	deleteRoomEvents,
};