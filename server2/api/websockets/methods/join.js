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

		const [group, Attributes] = await updateRoom(room, clientID)

		if (room.host != clientID) {
			const messageRecipients = [
				sendMessageToRoom(roomID, {
					method: "join",
					room: Attributes,
					group,
				}),
				// only message lobby if player joined, not spectator
				// ...(group == "players"
				...(true
					? [
							sendMessageToLobby({
								method: "join",
								room: Attributes,
							}),
					  ]
					: []),
			];
			Promise.all(messageRecipients);
		}

	} catch (err) {
		console.error(err)
		return Responses._400({ error: err.message });
	}

	console.log(`Joined room[${roomID}] client[${clientID}]`);

	return Responses._200({});
};

// module.exports = method;
// exports = hooksWithSchema(schema, ["parse"])(handler);


async function updateRoom(room, clientID){
	const playerColors = Object.keys(room.players)
	const group = playerColors.length < 2 ? 'players' : 'spectators'
	
	if (group === "players") {
		const joinedColor = playerColors[0] == "white" ? "black" : "white";
		const { Attributes } = await Dynamo.update({
			TableName: roomsTable,
			primaryKey: "ID",
			primaryKeyValue: room.ID,
			updates: {
				[`players.${joinedColor}`]: { clientID, ready: false },
			},
		});
		return [group, Attributes];
	} else {
		const { Attributes } = await Dynamo.append({
			TableName: roomsTable,
			primaryKey: "ID",
			primaryKeyValue: room.ID,
			data: { spectators: [clientID] },
			// select: "clients",
		});
		return [group, Attributes];
	}
}