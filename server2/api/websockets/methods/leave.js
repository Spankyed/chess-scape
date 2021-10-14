const Responses = require("../../common/HTTP_Responses");
const Dynamo = require("../../common/Dynamo");
const { sendMessageToRoom } = require("../../common/websocket/message");

// const roomsTable = process.env.roomsTableName;

module.exports = async function ({ clientID, roomID }) {
	try {
		// ! verify token
		await sendMessageToRoom(roomID, { method: "leave", clientID });

	} catch (err) {
		return Responses._400({ error: error.message });
	}

	console.log(`Client[${clientID}] left room[${roomID}]`);

	return Responses._200({});
};