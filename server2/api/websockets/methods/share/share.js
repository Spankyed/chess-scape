const Responses = require("../../../common/HTTP_Responses");
// const Dynamo = require("../../../common/Dynamo");
const video = require("./video");
const { music } = require("./music");
const {
	sendMessageToRoom,
	sendMessageToRoomExcept,
} = require("../../../common/websocket/message");

// const matchesTable = process.env.matchesTableName;
// const roomsTable = process.env.roomsTableName;

module.exports = async function (
	message,
	client,
	connection
) {
	const { clientID, roomID, type } = message
	// const match = await Dynamo.get(roomID, matchesTable);

	if (client.room != roomID) return Responses._400({ message: "Not in room" });

	const mediaHandlers = { video, music };
	
	try {
		const response = mediaHandlers[type](message);

		sendMessageToRoom(roomID, response);
		// sendMessageToRoomExcept(roomID, response);

		console.log(`Client[${clientID}] shared ${type}`);
		return Responses._200({});
	} catch (err) {
		console.error(err);
		return Responses._400({ error: err.message });
	}
};
