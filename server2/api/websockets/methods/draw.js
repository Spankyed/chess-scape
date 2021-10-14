const Responses = require("../../common/HTTP_Responses");
const Dynamo = require("../../common/Dynamo");
const { sendMessageToRoom } = require("../../common/websocket/message");

const matchesTable = process.env.matchesTableName;

module.exports = async function ({ clientID, roomID, accepted }, connection) {

	const match = await Dynamo.get(roomID, matchesTable);

	if (!match) return Responses._400({ message: "Match not found" });

	if (match.finished) {
		return Responses._400({ message: "Match already ended" }); // prob should msg client to show end ui
	}

	if (!match.offer || match.offer.type != "draw" || match.offer.to != clientID) {
		return Responses._400({ message: "Bad offer or recipient" });
	}

	if (!accepted) {
		// handle reject response
		await removeOffer(roomID);
		return Responses._400({ message: "Opponent rejected draw" }); 
	}

	const endMethod = 'draw';
	await Promise.all([
		// todo when game over store match in completeMatchesTable
		Dynamo.update({
			TableName: matchesTable,
			primaryKey: "ID",
			primaryKeyValue: roomID,
			updates: {
				finished: true,
				endTime: Date.now(),
				winningColor: null,
				endMethod,
			},
		}),
		sendMessageToRoom(roomID, {
			method: "end",
			winningColor: null,
			endMethod,
		}),
	]);

	console.log(`Game drawn[${roomID}]`);

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