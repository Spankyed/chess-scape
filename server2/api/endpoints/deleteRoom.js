const Responses = require("../common/HTTP_Responses");
const Dynamo = require("../common/Dynamo");
const { hooksWithSchema } = require("../common/hooks");
const { sendMessageToLobby } = require("../common/websocket/message");

const roomsTable = process.env.roomsTableName;

const schema = {
	body: { ID: "string" },
};

const handler = async (event) => {
	const {ID} = event.body;

	const deletedRoom = await Dynamo.delete(ID, roomsTable);

	if (!deletedRoom) {
		return Responses._400({ message: "Failed to delete room" });
	}

	// todo notify anyone who may be in room, room was deleted
	await sendMessageToLobby({ method: "delete", roomID: ID });

	return Responses._200({ message: `Room successfully deleted [${ID}]` });
};

// exports.handler = hooksWithSchema(schema, ["log", "parse"])(handler);
exports.handler = hooksWithSchema(schema, ["parse", "authorize"])(handler);
