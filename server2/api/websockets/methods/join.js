const Responses = require("../../common/HTTP_Responses");
const Dynamo = require("../../common/Dynamo");
const { hooksWithSchema } = require("../../common/hooks");
const { sendMessageToLobby, sendMessageToRoom } = require("../../common/websocket/message");

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

		// ! only message lobby if player joined, not spectator
		const messageRecipients = [
			sendMessageToRoom(roomID, { method: "join", room: Attributes, group }),
			...(group == "players"
				? [sendMessageToLobby({ method: "join", room: Attributes })]
				: []),
		];
		Promise.all(messageRecipients);
		// await sendMessageToHost({ method: "join", room: Attributes })

	} catch (err) {
		return Responses._400({ error: error.message });
	}

	console.log(`Joined room[${roomID}] client[${clientID}]`);

	return Responses._200({});
};

// module.exports = method;
// exports = hooksWithSchema(schema, ["parse"])(handler);
