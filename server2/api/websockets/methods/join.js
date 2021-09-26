const Responses = require("../../common/API_Responses");
const Dynamo = require("../../common/Dynamo");
const { withHooks, hooksWithSchema } = require("../../common/hooks");

const clientsTable = process.env.clientsTableName;

// const schema = {
// 	body: { room: "number", clientID: "number"  },
// };

module.exports = async function ({ clientID, message }) {
	try {
		await Dynamo.update({
			tableName: clientsTable,
			primaryKey: "ID",
			primaryKeyValue: clientID,
			updates: { room: message.room },
		});
	} catch (err) {
		console.log("grr", err);
	}

	console.log(`Joined room[${message.room}] client[${clientID}]`);

	return;
	// return Responses._200({});
};

// module.exports = method;
// exports = withHooks(["parse"])(handler);
