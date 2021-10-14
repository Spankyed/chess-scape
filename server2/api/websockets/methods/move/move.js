const Responses = require("../../../common/HTTP_Responses");
const Dynamo = require("../../../common/Dynamo");
const update = require("./update");
const {
	sendMessageToRoom,
	// sendMessageToRoomExcept,
} = require("../../../common/websocket/message");
const { Chess } = require("chess.js");

const matchesTable = process.env.matchesTableName;
const roomsTable = process.env.roomsTableName;
const engine = new Chess();

module.exports = async function (
	{ clientID, roomID, move },
	client,
	connection
) {
	const match = await Dynamo.get(roomID, matchesTable);

	if (!match) return Responses._400({ message: "Match not found" });

	if (match.finished) {
		return Responses._400({ message: "Match already ended" }); // prob should msg client to show end ui
	}

	const { players, started, lastMove, colorToMove } = match;

	const player = players[colorToMove];

	const isPlayersTurn = player.clientID === clientID;

	if (!isPlayersTurn || !started) {
		// await syncPlayer(connection, match.moves)
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
		const endMethod = gameOver && mated ? "checkmate" : gameOver && "draw";
		const info = gameOver && {
			winningColor: colorToMove,
			endMethod,
			mated,
		};
		// todo if time controlled game, get stepFN task token and send to machine to end prev exec,
		// todo then exec new state machine
		const changes = update(move, match);
		const commit = !player.committed;
		await Promise.all([
			Dynamo.update({
				TableName: matchesTable,
				primaryKey: "ID",
				primaryKeyValue: roomID,
				updates: {
					"lastMove.fen": engine.fen(),
					...changes.state,
					colorToMove: !gameOver && nextColor(colorToMove),
					...(commit
						? { [`players.${colorToMove}.committed`]: true }
						: {}),
					...(gameOver ? info : {}),
				},
			}),
			Dynamo.append({
				TableName: matchesTable,
				primaryKey: "ID",
				primaryKeyValue: roomID,
				data: {
					moves: [
						{
							...changes.move,
							piece: move.piece,
							san: move.san,
							color: move.color,
							fen: engine.fen(),
						},
					],
				},
				// select: "clients",
			}),
			sendMessageToRoom(roomID, {
				method: "move",
				move: validMove,
				clientID,
				gameOver,
				info,
			}),
		]);

		console.log(`Player[${clientID}][${colorToMove}] moved`, {
			move,
			info,
		});
	}

	return Responses._200({});
};

async function syncPlayer(connection, moves) {
	return sendMessage(connection, { method: "sync", moveChanges: moves });
}

function nextColor(color) {
	return color == "white" ? "black" : "white";
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