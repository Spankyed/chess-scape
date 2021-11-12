const AWS = require("aws-sdk");

let options = {}
if (process.env.IS_OFFLINE) {
	options = {
		s3ForcePathStyle: true,
		accessKeyId: "S3RVER", // This specific key is required when working offline
		secretAccessKey: "S3RVER",
		endpoint: new AWS.Endpoint("http://localhost:4569"),
	};
}
const s3Client = new AWS.S3(options);

const S3 = {
	// async getJSON(fileName, bucket) {
	// 	const params = {
	// 		Bucket: bucket,
	// 		Key: fileName,
	// 	};
	// 	let data = await s3Client.getObject(params).promise();
	// 	if (!data) {
	// 		throw Error(`Failed to get file ${fileName}, from ${bucket}`);
	// 	}
	// 	return data;
	// },
	// async writeJSON(data, fileName, bucket) {
	// 	const params = {
	// 		Bucket: bucket,
	// 		Body: JSON.stringify(data),
	// 		Key: fileName,
	// 	};
	// 	const newData = await s3Client.putObject(params).promise();
	// 	if (!newData) {
	// 		throw Error("there was an error writing the file");
	// 	}
	// 	return newData;
	// },
	async upload(file, Key, bucket) {
		const params = {
			Bucket: bucket,
			Key,
			Body: file.content,
			ContentType: file.contentType,
		};
		const s3Data = await s3Client.upload(params).promise();
		if (!s3Data) {
			throw Error("there was an error uploading the file");
		}
		console.log(`File uploaded successfully`, { s3Data });
		return s3Data;
	},
	async delete(Key, bucket) {
		const params = {
			Bucket: bucket,
			Key,
		};
		const s3Data = await s3Client.deleteObject(params).promise();
		if (!s3Data) {
			throw Error("there was an error deleting the file");
		}
		console.log(`File deleted successfully`, { s3Data });
		return s3Data;
	}
};

module.exports = S3;
