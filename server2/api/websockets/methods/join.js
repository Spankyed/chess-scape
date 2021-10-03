const Responses = require("../../common/API_Responses");
const Dynamo = require("../../common/Dynamo");
const { withHooks, hooksWithSchema } = require("../../common/hooks");
const { sendMessageToLobby } = require("../../common/websocket/message");

const clientsTable = process.env.clientsTableName;
const roomsTable = process.env.roomsTableName;

// const schema = {
// 	body: { roomID: "string", clientID: "number"  },
// };

module.exports = async function ({ clientID, roomID }) {
	try {
		const [_,room] = await Promise.all([
			Dynamo.update({
				TableName: clientsTable,
				primaryKey: "ID",
				primaryKeyValue: clientID,
				updates: { room: roomID },
			}),
			Dynamo.get(roomID, roomsTable)
		])

		const group = room.players.length < 2 ? 'players' : 'spectators' 
		const { Attributes } = await Dynamo.append({
			TableName: roomsTable,
			primaryKey: "ID",
			primaryKeyValue: roomID,
			data: { [group]: [clientID] },
			// select: "clients",
		});

		await sendMessageToLobby({ method: "join", room: Attributes });

	} catch (err) {
		return Responses._400({ error: error.message });
	}

	console.log(`Joined room[${roomID}] client[${clientID}]`);

	return Responses._200({});
};

// module.exports = method;
// exports = withHooks(["parse"])(handler);
