const Responses = require("../../common/HTTP_Responses");
const Dynamo = require("../../common/Dynamo");
const { hooksWithSchema } = require("../../common/hooks");
const { sendMessageToRoom } = require("../../common/websocket/message");

const roomsTable = process.env.roomsTableName;

// const schema = {
// 	body: { roomID: "string", clientID: "number"  },
// };

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

// module.exports = method;
// exports = withHooks(["parse"])(handler);
