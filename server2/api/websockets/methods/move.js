const Responses = require("../../common/HTTP_Responses");
const Dynamo = require("../../common/Dynamo");
// const { withHooks, hooksWithSchema } = require("../../common/hooks");
const {
	sendMessageToRoom,
	// sendMessageToRoomExcept,
} = require("../../common/websocket/message");
const { Chess } = require("chess.js");

const matchesTable = process.env.matchesTableName;
const roomsTable = process.env.roomsTableName;
const engine = new Chess();

// const schema = {
// 	body: { room: "number", clientID: "number"  },
// };

module.exports = async function ({ clientID, roomID, move }) {
	const match = await Dynamo.get(roomID, matchesTable);

	if (!match) return Responses._400({ message: 'Match not found' });
	
	if (match.finished) {
		return Responses._400({ message: "Match already ended" }); // prob should msg client to show end ui
	}
	
	const { players, started, lastMove, colorToMove } = match;

	const player = players[colorToMove];

	const isPlayersTurn = player.clientID === clientID;

	if (!isPlayersTurn || !started) {
		// await syncPlayer(clientID, match.moves)
		return Responses._400({ message: "Out of sync" });
	}

	engine.load(lastMove.fen);
	const validMove = engine.move(move);

	if (!validMove) {
		// await syncPlayer(clientID, match.moves)
		return Responses._400({ message: "Out of sync" });
	} else {
		// todo when game over store match in completeMatchesTable
		const gameOver = engine.game_over();
		const mated = gameOver && engine.in_checkmate();
		const endMethod = gameOver && mated ? 'checkmate' : gameOver && 'draw'
		const info = gameOver && {
			clientID,
			winningColor: colorToMove,
			endMethod,
			mated,
		};
		// todo if time controlled game, get stepFN task token and send to machine to end prev exec,
		// todo then exec new state machine
		
		const commit = !player.committed
		await Promise.all([
			Dynamo.update({
				TableName: matchesTable,
				primaryKey: "ID",
				primaryKeyValue: roomID,
				updates: {
					"lastMove.fen": engine.fen(),
					colorToMove: !gameOver && nextColor(colorToMove),
					...(
						commit ?
						{[`players.${colorToMove}.committed`]: true}
						: {}
					)
				},
			}),
			sendMessageToRoom(roomID, {
				method: "move",
				move: validMove,
				clientID,
				gameOver,
				info,
			}),
		]);

		console.log(`Player[${clientID}][${colorToMove}] moved`, { move, info }); // todo add playerColor to log
	}

	return Responses._200({});
};

// exports = withHooks(["parse"])(handler);

async function syncPlayer(clientID, {board}) {
	const {connection} = await Dynamo.get(clientID, clientsTable);
	return sendMessage(connection, { method: "sync", board });
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

function nextColor(color) {
	return color == "white" ? "black" : "white";
}
