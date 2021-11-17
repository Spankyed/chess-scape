const Responses = require("../common/HTTP_Responses");
const Dynamo = require("../common/Dynamo");

const { withHooks } = require("../common/hooks");

const serviceTable = process.env.serviceTableName;

const handler = async () => {

	const { publicKey } = await Dynamo.get("vapidKeys", serviceTable) || {};

	if (!publicKey) {
		return Responses._400({ error: "Push Key not found" });
	}

	return Responses._200({ publicKey });
};

exports.handler = withHooks([])(handler);
