const Responses = require("../common/HTTP_Responses");
const Dynamo = require("../common/Dynamo");
const S3 = require("../common/S3");
const { hooksWithSchema } = require("../common/hooks");
const {
	sendMessageToRoom, sendMessageToRoomExcept,
} = require("../common/websocket/message");

const roomsTable = process.env.roomsTableName;
const matchesTable = process.env.matchesTableName;
const mediaTable = process.env.mediaTableName;
const bucket = process.env.bucketName;

const schema = {
	body: { ID: "string" },
};

const handler = async (event) => {
	const { clientID, ID } = event.body;

	const match = await Dynamo.get(ID, matchesTable);

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
		removeMediaFiles(ID),
		Dynamo.delete(ID, roomsTable),
	]);

	if (!deletedRoom) {
		return Responses._400({ message: "Failed to delete room" });
	} else if (!removedMedia) {
		return Responses._400({
			message: "Failed to remove media files from S3",
		});
	}

	// notify anyone who may be in room that the room was deleted
	// and everyone in lobby, except person deleting
	Promise.all([
		sendMessageToRoom(ID, { method: "disband" }),
		sendMessageToRoomExcept("lobby", clientID, {
			method: "delete",
			roomID: ID,
		}),
	]);

	console.log(`Client[${clientID}] deleted room[${ID}]`);

	return Responses._200({
		message: `Room successfully deleted [${ID}]`,
		roomID: ID,
	});
};

// exports.handler = hooksWithSchema(schema, ["log", "parse"])(handler);
// exports.handler = hooksWithSchema(schema, ["parse", "authorize"])(handler);

async function removeMediaFiles(roomID) {
	const roomMedia = await Dynamo.queryOn({
		TableName: mediaTable,
		index: "room-index",
		queryKey: "roomID",
		queryValue: roomID,
	});

	if (!roomMedia) return true
	
	const s3Removals = roomMedia && roomMedia.map(async (media) =>
		S3.delete(media.ID, bucket)
	);;

	return s3Removals;
}

module.exports = {
	handler: hooksWithSchema(schema, ["parse", "authorize"])(handler),
	removeMediaFiles,
}