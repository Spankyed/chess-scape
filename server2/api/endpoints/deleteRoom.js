const Responses = require("../common/HTTP_Responses");
const Dynamo = require("../common/Dynamo");
const { hooksWithSchema } = require("../common/hooks");
const { sendMessageToRoomExcept } = require("../common/websocket/message");

const roomsTable = process.env.roomsTableName;

const schema = {
	body: { ID: "string" },
};

const handler = async (event) => {
	const { clientID, ID } = event.body;

	const deletedRoom = await Dynamo.delete(ID, roomsTable);

	if (!deletedRoom) {
		return Responses._400({ message: "Failed to delete room" });
	}

	// todo notify anyone who may be in room, room was deleted
	await sendMessageToRoomExcept("lobby", clientID, {
		method: "delete",
		roomID: ID,
	});

	console.log(`Player[${clientID}] deleted room[${ID}]`);

	return Responses._200({
		message: `Room successfully deleted [${ID}]`,
		roomID: ID,
	});
};

// exports.handler = hooksWithSchema(schema, ["log", "parse"])(handler);
exports.handler = hooksWithSchema(schema, ["parse", "authorize"])(handler);
