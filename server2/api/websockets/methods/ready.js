const Responses = require("../../common/HTTP_Responses");
const Dynamo = require("../../common/Dynamo");
const { hooksWithSchema } = require("../../common/hooks");
const { sendMessageToRoom } = require("../../common/websocket/message");

const roomsTable = process.env.roomsTableName;

// const schema = {
// 	body: { roomID: "string", clientID: "number"  },
// };

module.exports = async function ({ clientID, roomID, color }) {
	try {
		// ! verify token
		const { Attributes } = await Dynamo.update({
			TableName: roomsTable,
			primaryKey: "ID",
			primaryKeyValue: roomID,
			updates: { [`players.${color}.ready`]: true },
		});

		// todo if both players ready, send message to begin match

		await sendMessageToRoom(roomID, { method: "ready", player: color });

	} catch (err) {
		// console.error(err);
		return Responses._400({ error: err.message });
	}

	console.log(`Player[${color}] ready: client[${clientID}]`);

	return Responses._200({});
};

// module.exports = method;
// exports = withHooks(["parse"])(handler);
