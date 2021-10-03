const Responses = require("../common/API_Responses");
const Dynamo = require("../common/Dynamo");
const { hooksWithSchema } = require("../common/hooks");

const roomsTable = process.env.roomsTableName;
const clientsTable = process.env.clientsTableName;

const schema = {
	body: { clientID: "string" },
};

const handler = async (event) => {
	const { clientID } = event.body;

	const [_,rooms] = await Promise.all([
		Dynamo.update({
		TableName: clientsTable,
		primaryKey: "ID",
		primaryKeyValue: clientID,
		updates: {
			room: 'lobby'
		},
		}),
		Dynamo.getAll(roomsTable)
	]);
	
	return Responses._200({ rooms });
};

// exports.handler = hooksWithSchema(schema, ["log", "parse"])(handler);
exports.handler = hooksWithSchema(schema, ["parse"])(handler);

