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

	//get room if match started return	const room
	const match = await Dynamo.get(ID, matchesTable);

	if (match.host != clientID && clientID != 'angel') {
		return Responses._400({ message: "Client doesn't have permssion to delete this room" });
	}

	if (match.started && match.moves.length > 1) {
		return Responses._400({ message: "Can't delete room when match in progress" });
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

	// notify anyone who may be in room, room was deleted
	// and anyone in lobby except person deleting
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

	if (!roomMedia) return
	
	const s3Removals = roomMedia && roomMedia.map(async (media) =>
		S3.delete(media.ID, bucket)
	);;

	return s3Removals;
}

module.exports = {
	handler: hooksWithSchema(schema, ["parse", "authorize"])(handler),
	removeMediaFiles,
}