const Responses = require("../common/API_Responses");
const Dynamo = require("../common/Dynamo");
const { hooksWithSchema } = require("../common/hooks");

const playerTable = process.env.TableName;

const schema = {
	body: { score: "number" },
	path: { ID: "string" },
};

const handler = async (event) => {
	let ID = event.pathParameters.ID;
	const { score } = event.body;

	const res = await Dynamo.update({
		TableName: playerTable,
		primaryKey: "ID",
		primaryKeyValue: ID,
		updateKey: "score",
		updateValue: score,
	});
	console.log("_______res", { res });
	return Responses._200({});
};

exports.handler = hooksWithSchema(schema, ["log", "parse"])(handler);
