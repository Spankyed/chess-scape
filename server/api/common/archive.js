const Dynamo = require("./Dynamo");
const { customAlphabet } = require("nanoid");
const nanoid = customAlphabet("1234567890abcdef", 20);

const savedChatsTable = process.env.savedChatsTableName;
const savedMatchesTable = process.env.savedMatchesTableName;

async function archiveChat(room) {
	if (room.chat.length > 0)
		return Dynamo.write(
			{ ID: nanoid(), roomID: room.ID, log: room.chat },
			savedChatsTable
		);
}

async function archiveMatch(match) {
	// todo add fen headings to archive record
	const {ID, ...matchData} = match
	return Dynamo.write(
		{ ID: nanoid(), roomID: ID, ...matchData },
		savedMatchesTable
	);
}

module.exports = {
	archiveChat,
	archiveMatch,
};

// function constructHeadings() {
// 	return {
// 		Site: "Chess-Scape",
// 		White: "Angel (2037)",
// 		Black: "Kathie (1300)",
// 		Round: "",
// 		Result: "1/2-1/2",
// 		finished: getDate(),
// 		TimeControl: "1 in 3 days",
// 		Termination: "Kathie won by resignation",
// 	};
// }
// function getDate() {
// 	var date = new Date();
// 	return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
// 		.toISOString()
// 		.split("T")[0];
// }