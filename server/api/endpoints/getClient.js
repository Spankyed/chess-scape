const Responses = require("../common/HTTP_Responses");
const Dynamo = require("../common/Dynamo");

const { withHooks } = require("../common/hooks");

const clientsTable = process.env.clientsTableName;

const schema = {
	// path: { ID: "string" },
};

/** 
 * ! THIS ENDPOINT MUST NEVER BE PUBLICLY ACCESSIBLE
 * ! EXPOSES USER CREDENTIALS (TOKEN)
 * ! currently disabled in function.yml
*/
const handler = async (event) => {
	// if (!event.pathParameters.ID) {
	// 	// failed without an ID
	// 	return Responses._400({ message: "missing the ID from the path" });
	// }

	let ID = event.pathParameters.ID;

	const client = await Dynamo.get(ID, clientsTable);

	return Responses._200({ client });
};

exports.handler = withHooks(["log", "parse"])(handler);
