const Responses = require("../../common/HTTP_Responses");
const Dynamo = require("../../common/Dynamo");
const {
	sendMessageToRoomExcept,
	sendMessageToRoom,
} = require("../../common/websocket/message");

const roomsTable = process.env.roomsTableName;

module.exports = async function ({ clientID, roomID, text }, { username }) {
	try {
		const room = await Dynamo.get(roomID, roomsTable);

		if (!room) {
			await sendMessageToRoom(roomID, { method: "disband" });
			return Responses._400({ error: "Room not found" });
		}

		const chat = {
			clientID,
			username,
			text, // ! todo sanitize text
			time: Date.now(),
		};

		Promise.all([
			sendMessageToRoomExcept(roomID, clientID, {
				method: "chat",
				...chat,
			}),
			Dynamo.append({
				TableName: roomsTable,
				primaryKey: "ID",
				primaryKeyValue: roomID,
				data: {
					chat: [chat],
				},
			}),
		]);

		console.log(`Chat from client[${clientID}] in room[${roomID}]`, { chat });

	} catch (err) {
		console.error(err);
		return Responses._400({ error: err.message });
	}

	return Responses._200({});
};