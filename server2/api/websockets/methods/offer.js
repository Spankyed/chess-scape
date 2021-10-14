const Responses = require("../../common/HTTP_Responses");
const Dynamo = require("../../common/Dynamo");
const { sendMessage } = require("../../common/websocket/message");

const matchesTable = process.env.matchesTableName;
const clientsTable = process.env.clientsTableName;

module.exports = async function ({ clientID, roomID, type }, client, connection) {
	const match = await Dynamo.get(roomID, matchesTable);

	if (!match) return Responses._400({ message: "Match not found" });

	let opponents = Object.values(match.players).filter(
		(player) => player.clientID != clientID
	);

	if (opponents.length > 1) {
		// todo punish naughty spectator
		return Responses._400({ message: "Client is not a player" }); 
	}
	if (opponents.length < 1) {
		// notify player opponent left room
		return Responses._400({ message: "Opponent not in room" }); 
	}

	let [opponent] = opponents;

	const offerType = ['rematch', 'draw'].find( t => t == type)
	
	if (!offerType) {
		return Responses._400({ message: "Offer not recognized" }); 
	}

	if (offerType == 'draw') {
		if (match.finished) {
			// todo sync player
			return Responses._400({ message: "Match already ended" }); 
		}
		// if (match.dontAskDraw[opponent.clientID]) {
		// 	return Responses._400({ message: "Draw offer not allowed by opponent" }); 
		// }
	}

	if (offerType == 'rematch' && !match.finished) {
		// todo sync player
		return Responses._400({ message: "Match not finish" }); 
	}

	const oppClient = await Dynamo.get(opponent.clientID, clientsTable);

	await Promise.all([
		sendMessage(oppClient.connection, { method: "offer", type: offerType, roomID }),
		Dynamo.update({
			TableName: matchesTable,
			primaryKey: "ID",
			primaryKeyValue: roomID,
			updates: {
				offer: {
					type: offerType,
					to: oppClient.ID,
				},
			},
		}),
	]);

	console.log(`Offer[${offerType}] sent by[${clientID}] in room[${roomID}]`);

	return Responses._200({});
};
