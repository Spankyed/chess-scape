const Responses = require("../../common/HTTP_Responses");
const Dynamo = require("../../common/Dynamo");
const { sendMessage } = require("../../common/websocket/message");
const draw = require("./draw");
const rematch = require("./rematch");

const offerHandlers = {draw, rematch}

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
		return Responses._400({ message: "User is not a player" }); 
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

	if (match.offer && match.offer.type == type) {
		if (match.offer.to != opponent.clientID) {
			// both players offered same thing so accept
			offerHandlers[type]({ clientID, roomID, accepted: true });
			return Responses._200({
				message: `Both players offered to ${type}`,
			});
		} else {
			return Responses._400({ message: "Duplicate offer" })
		}
	}

	if (offerType == 'draw') {
		if (match.finished) {
			// todo sync player!
			return Responses._400({ message: "Match already ended" }); 
		}
		// if (match.dontAskDraw[opponent.clientID]) { // todo needs to be reset on rematch
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
