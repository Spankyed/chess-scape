const Responses = require("../../common/HTTP_Responses");
const Dynamo = require("../../common/Dynamo");
const { sendMessageToRoom } = require("../../common/websocket/message");
const { archiveMatch } = require("../../common/archive");

const matchesTable = process.env.matchesTableName;
// const roomsTable = process.env.roomsTableName;

module.exports = async function ({ clientID, roomID, endMethod }) {
	const match = await Dynamo.get(roomID, matchesTable);
	
	if (!match) return Responses._400({ message: "Match not found" });
	
	const { players, started, finished } = match;

	if (finished) {
		return Responses._400({message: "Match already ended"}); // prob should msg client to show end ui
	}

	const [color, player] =
		Object.entries(players).find((p) => p[1].clientID == clientID) || [];

	if (!player) {
		// todo punish naughty spectator
		return Responses._400({
			message: "A spectator attempted to end match",
		});
	}
	if (endMethod == "abort" && player.committed) {
		// todo punish naughty player (or sync board)
		return Responses._400({
			message: "A player attempted to abort match after moves committed",
		});
	}
	// if (endMethod == "draw" && match.canDraw != clientID) {
	// 	// todo punish very naughty player
	// 	return Responses._400({
	// 		message: "A player attempted to draw match singlehandedly",
	// 	});
	// }

	// todo if time controlled game, get stepFN task token and end prev exec,
	// abort|abandon|resign|draw
	const opponentColor = color == "white" ? "black" : "white";
	const winningColor =  endMethod == "draw" || endMethod == "abort"
		? null
		: opponentColor
	await Promise.all([
		// todo when game over store match in completeMatchesTable
		archiveMatch({ ...match, endMethod }),
		Dynamo.update({
			TableName: matchesTable,
			primaryKey: "ID",
			primaryKeyValue: roomID,
			updates: {
				finished: true,
				endTime: Date.now(),
				winningColor,
				endMethod,
			},
		}),
		sendMessageToRoom(roomID, {
			method: "end",
			player,
			winningColor,
			endMethod,
		}),
	]);

	console.log(`Player[${clientID}][${color}] ended match [${endMethod}]`); // todo add playerColor to log

	return Responses._200({});
};