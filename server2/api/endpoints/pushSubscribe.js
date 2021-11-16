const Responses = require("../common/HTTP_Responses");
const Dynamo = require("../common/Dynamo");
const { hooksWithSchema } = require("../common/hooks");

const clientsTable = process.env.clientsTableName;

const schema = {
	body: { clientID: "string" },
};

const handler = async (event) => {
	const { clientID, subscription } = event.body;

	if (clientID != 'angel') {
		return Responses._401({ message: "User is not an admin" });
	}

	if (!subscription) {
		return Responses._401({ message: "No subscription info found" });
	}

	try {
		await Dynamo.append({
			TableName: clientsTable,
			primaryKey: "ID",
			primaryKeyValue: clientID,
			data: {
				subscriptions: [subscription],
			},
		});
	} catch (err){
		console.error(err)
		return Responses._400({ message: "Issue adding subscription" });
	}

	console.log(`Admin[${clientID}] subscribed to push notifications`);
	return Responses._200({ subscription });
};

// exports.handler = hooksWithSchema(schema, ["log", "parse"])(handler);
exports.handler = hooksWithSchema(schema, ["parse", "authorize"])(handler);