const Responses = require("../../common/API_Responses");
const Dynamo = require("../../common/Dynamo");
const { withHooks, hooksWithSchema } = require("../../common/hooks");

const clientsTable = process.env.clientsTableName;

// const schema = {
// 	body: { room: "number", clientID: "number"  },
// };

const method = async ({ clientID, room }) => {
	await Dynamo.append({
		TableName: clientsTable,
		primaryKey: "ID",
		primaryKeyValue: clientID,
		data: { room },
	});

	console.log(`Joined room[${room}] client[${clientID}]`);

	return Responses._200({});
};

exports = method;
// exports = withHooks(["parse"])(handler);
