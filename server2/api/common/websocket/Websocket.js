const AWS = require("aws-sdk");

const openGateway = (domainName, stage) => {
	return new AWS.ApiGatewayManagementApi({
		apiVersion: "2018-11-29",
		endpoint: process.env.IS_OFFLINE
			? "http://localhost:3001"
			: `${domainName}/${stage}`,
	});
};

const send = ({ domainName, stage, connectionID, message }) => {
	const gateway = openGateway(domainName, stage);
	const postParams = {
		Data: JSON.stringify(message),
		ConnectionId: connectionID,
	};
	return gateway.postToConnection(postParams).promise();
};

const close = ({ domainName, stage, connectionID }) => {
	const gateway = openGateway(domainName, stage);
	return gateway
		.deleteConnection({
			ConnectionId: connectionID,
		})
		.promise();

	// var callbackUrl = util.format(
	// 	util.format(
	// 		"https://%s/%s/@connections/%s",
	// 		domain,
	// 		stage,
	// 		connectionId
	// 	)
	// );
};

module.exports = {
	send,
	close,
};
