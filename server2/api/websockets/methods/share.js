const Responses = require("../../common/HTTP_Responses");
// const Dynamo = require("../../../common/Dynamo");
// const video = require("./video");
// const { music } = require("./music");
const {
	sendMessageToRoom,
	sendMessageToRoomExcept,
} = require("../../common/websocket/message");

// const mediaTable = process.env.mediaTableName;

/** 
 * Share Song moved to http endpoints due to 
 * 1mb payload limit on AWS API Gateway Websockets frames
 * Previously songs were sent directly to room
 * Now songs are uploaded to S3 bucket and 
 * room clients can access the audio with a
 * file location URL returned from S3 bucket upload.
 * ! Files must be removed from bucket when room deleted
 */

module.exports = async function (
	message,
	client,
	connection
) {
	const { clientID, roomID, type } = message

	if (client.room != roomID) return Responses._400({ message: "Not in room" });

	const mediaHandlers = { video: handleVideo };
	
	try {
		const response = mediaHandlers[type](message);

		// sendMessageToRoom(roomID, response);
		sendMessageToRoomExcept(roomID, clientID, response);

		console.log(`Client[${clientID}] shared ${type}`);
		return Responses._200({});
	} catch (err) {
		console.error(err);
		return Responses._400({ error: err.message });
	}
};

function handleVideo({ videoId }) {
	if (typeof videoId != "string") throw new Error("Invalid viedoId");
	return { method: "share", type: "video", videoId };
};