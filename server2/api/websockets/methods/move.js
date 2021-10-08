const Responses = require("../../common/HTTP_Responses");
const Dynamo = require("../../common/Dynamo");
// const { withHooks, hooksWithSchema } = require("../../common/hooks");
const {
	sendMessageToRoom,
	// sendMessageToRoomExcept,
} = require("../../common/websocket/message");
const { Chess } = require("chess.js");

const matchesTable = process.env.matchesTableName;
const engine = new Chess();

// const schema = {
// 	body: { room: "number", clientID: "number"  },
// };

module.exports = async function ({ clientID, TOKEN, roomID, move }) {
	// todo when game over store match in completeMatchesTable
	// ! ensure matchStarted first
	const match = await Dynamo.get(roomID, matchesTable);

	engine.load(match.lastMove.fen);
	// ! validate client TOKEN and make sure its players turn/color to move
	const validMove = engine.move(move);

	if (!validMove) {
		// todo: if not valid move, send game state to sync client, and alert user board was synced
		// const client = await Dynamo.get(clientID, clientsTable);
		// sendMessage(client.connection, { method: "sync" })
	} else {
		const gameOver = engine.game_over();
		// todo if time controlled game, get stepFN task token and send to machine to end prev exec,
		// todo then exec new state machine
		// await sendMessageToRoom(roomID, {
		await Promise.all([
			Dynamo.update({
				TableName: matchesTable,
				primaryKey: "ID",
				primaryKeyValue: roomID,
				updates: { "lastMove.fen": engine.fen() },
			}),
			sendMessageToRoom(roomID, {
				method: "move",
				move: validMove,
				clientID,
				gameOver,
			}),
		]);
	}

	console.log(`Player[${clientID}][color] moved`, { move }); // todo add playerColor to log

	return Responses._200({});
};

// exports = withHooks(["parse"])(handler);

async function findClient(TOKEN) {
	return Dynamo.queryOn({
		TableName: clientsTable,
		index: "token-index",
		queryKey: "TOKEN",
		queryValue: TOKEN,
	});
}

function constructHeadings() {
	return {
		Site: "Chess-Scape",
		White: "Angel (2037)",
		Black: "Kathie (1300)",
		Round: "",
		Result: "1/2-1/2",
		finished: getDate(),
		TimeControl: "1 in 3 days",
		Termination: "ACEChess won by resignation",
	};
}

function getDate() {
	var date = new Date();
	return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
		.toISOString()
		.split("T")[0];
}
