// const BSON = require("bson");
// const fileType = require("file-type");

module.exports = {
	music({ song, rawData }) {
		// todo check if song has image, otherwise scrape google?
		// todo sometype of validation
		// if (typeof videoId != "string") throw new Error("Invalid viedoId");
		return BSON.serialize({
			method: "share",
			type: "music",
			song,
			rawData,
		});
	},
	parseMessage(request) {
		return request;
	}
	// parseMessage(request) {
	// 	let isBinary = Buffer.isBuffer(request);
	// 	let message = isBinary
	// 		? BSON.deserialize(request, { promoteBuffers: true })
	// 		: JSON.parse(request);
	// 	if (!message) return null; // todo: response_400
	// 	if (isBinary && !isValidFileType(message.rawData)) return null;
	// 	return message;
	// }
};

async function isValidFileType(buffer) {
	// fileType.mime === 'image/jpeg'
	// if (stream2.fileType && stream2.fileType.mime === 'image/jpeg') if (stream2.fileType && stream2.fileType.mime === 'image/jpeg')
	let { mime } = await fileType.fromBuffer(buffer); // todo: test/ensure that audio is on all audio mime types
	return mime.indexOf("audio") > -1;
}