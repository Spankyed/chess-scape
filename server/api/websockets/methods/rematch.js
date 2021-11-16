const Responses = require("../../common/HTTP_Responses");
const Dynamo = require("../../common/Dynamo");
const { sendMessageToRoom } = require("../../common/websocket/message");
const initialState = require("./move/state");

const roomsTable = process.env.roomsTableName;
const matchesTable = process.env.matchesTableName;

module.exports = async function ({ clientID, roomID, accepted }, connection) {

	const [room, match] = await Promise.all([
		Dynamo.get(roomID, roomsTable),
		Dynamo.get(roomID, matchesTable),
	]);

	if (!room) {
		await sendMessageToRoom(roomID, { method: "disband" });
		return Responses._400({ message: "Room not found" });
	}

	if (!match) return Responses._400({ message: "Match not found" });

	if (!match.finished) {
		return Responses._400({ message: "Match not finished" }); // prob should msg client to show end ui
	}

	if (
		!match.offer ||
		match.offer.type != "rematch" ||
		match.offer.to != clientID
	) {
		return Responses._400({ message: "Bad offer or recipient" });
	}

	if (!accepted) {
		// handle reject response
		await removeOffer(roomID);
		return Responses._400({ message: "Opponent rejected rematch" }); 
	}

	const now = Date.now();
	const newMatch = {
		ID: match.ID,
		host: match.host,
		players: {
			white: { clientID: match.players.white.clientID, committed: false },
			black: { clientID: match.players.black.clientID, committed: false },
		},
		lastMove: {
			fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
		},
		colorToMove: "white",
		created: now,
		started: now,
		state: initialState,
		matchStarted: true,
		moves: [],
	};

	await Promise.all([
		sendMessageToRoom(roomID, {
			method: "rematch", // todo rename restart
			newMatch,
		}),
		Dynamo.write(newMatch, matchesTable),
	]);

	console.log(`Game Rematched[${roomID}]`);

	return Responses._200({});
};

function removeOffer(roomID) {
	return Dynamo.update({
		TableName: matchesTable,
		primaryKey: "ID",
		primaryKeyValue: roomID,
		updates: {
			offer: null,
		},
	});
}