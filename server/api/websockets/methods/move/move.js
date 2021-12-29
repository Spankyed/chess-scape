const Responses = require("../../../common/HTTP_Responses");
const Dynamo = require("../../../common/Dynamo");
const { archiveMatch } = require("../../../common/archive");
const update = require("./update");
const {
	sendMessage,
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

	const { players, started, lastMove, colorToMove, moves } = match;

	const player = players[colorToMove];

	const isPlayersTurn = player && player.clientID === clientID;

	engine.load(lastMove.fen);
	const validMove = appendIfChecked(engine.move(move));

	if (!validMove || !isPlayersTurn || !started) {
		await syncPlayer(connection, { moves, lastMove, colorToMove });
		return Responses._400({ message: "Out of sync" });
	} else {
		const gameOver = engine.game_over();
		const mated = gameOver && engine.in_checkmate();
		const endMethod = gameOver && mated ? "checkmate" : gameOver && "draw";
		const info = gameOver && {
			finished: true,
			endTime: Date.now(),
			winningColor: colorToMove,
			endMethod,
			mated,
		};

		await sendMessageToRoom(roomID, {
			method: "move",
			move: validMove,
			clientID,
			gameOver,
			info,
			colorToMove: nextColor(colorToMove),
		});

		// todo if time controlled game, get stepFN task token and send to machine to end prev execution,
		// todo then execute new clock state machine
		const changes = update(move, match);
		const commit = !player.committed;

		const [{ Attributes: matchUpdates }] = await Promise.all([
			Dynamo.update({
				TableName: matchesTable,
				primaryKey: "ID",
				primaryKeyValue: roomID,
				updates: {
					"lastMove.fen": engine.fen(),
					"lastMove.info": validMove,
					...changes.state,
					colorToMove: !gameOver && nextColor(colorToMove),
					...(commit
						? { [`players.${colorToMove}.committed`]: true }
						: {}),
					...(gameOver ? info : {}),
					offer: null,
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
							info: { ...validMove },
							fen: engine.fen(),
						},
					],
				},
				// select: "clients",
			}),
			...(gameOver ? [] : []),
		]);

		if (gameOver) {
			await archiveMatch({ ...matchUpdates, endMethod });
		}

		console.log(`Player[${colorToMove}][${clientID}] moved`, {
			move,
			info,
			gameOver,
		});
	}

	return Responses._200({});
};

async function syncPlayer(connection, board) {
	return sendMessage(connection, { method: "sync", ...board });
}

function appendIfChecked(validMove) {
	if (!validMove || !engine.in_check()) return validMove;
	return { ...validMove, inCheck: true };
}

function nextColor(color) {
	return color == "white" ? "black" : "white";
}