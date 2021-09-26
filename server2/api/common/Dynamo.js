const AWS = require("aws-sdk");

let options = { convertEmptyValues: true };
if (process.env.IS_OFFLINE) {
	options = {
		...options,
		region: "localhost",
		endpoint: "http://localhost:8000",
	};
}

const documentClient = new AWS.DynamoDB.DocumentClient(options);

const Dynamo = {
	async get(ID, TableName) {
		const params = {
			TableName,
			Key: {
				ID,
			},
		};
		const data = await documentClient.get(params).promise();
		if (!data || !data.Item) {
			throw Error(
				`There was an error fetching the data for ID of ${ID} from ${TableName}`
			);
		}
		console.log(data);
		return data.Item;
	},

	async getAll(TableName) {
		const params = { TableName };
		const data = await documentClient.scan(params).promise();
		return data.Items;
	},

	async write(data, TableName) {
		if (!data.ID) {
			throw Error("no ID on the data");
		}
		const params = {
			TableName,
			Item: data,
		};
		const res = await documentClient.put(params).promise();
		if (!res) {
			throw Error(
				`There was an error inserting ID of ${data.ID} in table ${TableName}`
			);
		}
		return data;
	},
	// https://stackoverflow.com/a/35051660/8723748 -- https://stackoverflow.com/questions/47415522/append-to-list-if-exist-or-add-list-in-dynamodb
	async append({ TableName, primaryKey, primaryKeyValue, data }) {
		const key = Object.keys(data)[0];
		const keyNameExpr = `#${key}`;
		const ExpressionAttributeNames = { [keyNameExpr]: key };
		const keyValueExpr = `:${key}`;
		const ExpressionAttributeValues = { [keyValueExpr]: data[key] };
		const UpdateExpression = `SET ${keyNameExpr} = list_append(${keyNameExpr}, ${keyValueExpr})`;
		const params = {
			TableName,
			Key: { [primaryKey]: primaryKeyValue },
			ExpressionAttributeNames,
			ExpressionAttributeValues,
			ConditionExpression: `attribute_exists(${key})`,
			UpdateExpression,
		};
		return documentClient.update(params).promise();
	},

	async delete(ID, TableName) {
		const params = {
			TableName,
			Key: {
				ID,
			},
		};

		return documentClient.delete(params).promise();
	},

	remove: async ({
		tableName,
		primaryKey,
		primaryKeyValue,
		attributeName,
	}) => {
		const keyExpr = `#${attributeName}`;
		const params = {
			TableName: tableName,
			Key: { [primaryKey]: primaryKeyValue },
			UpdateExpression: `REMOVE ${keyExpr}`,
			ExpressionAttributeNames: {
				[keyExpr]: attributeName,
			},
		};
		return documentClient.update(params).promise();
	},
	// When we do updates we need to tell DynamoDB what fields we want updated.
	// If that's not annoying enough, we also need to be careful as some field names
	// are reserved - so DynamoDB won't like them in the UpdateExpressions list.
	// To avoid passing reserved words we prefix each field with "#field" and provide the correct
	// field key mapping in ExpressionAttributeNames. The same has to be done with the actual
	// update value as well. They are prefixed with ":value" and mapped in ExpressionAttributeValues
	// with their actual value
	update: async ({ tableName, primaryKey, primaryKeyValue, updates }) => {
		const keys = Object.keys(updates);
		const keyNameExpressions = keys.map((key) => `#${key}`);
		const keyValueExpressions = keys.map((key) => `:${key}`);
		const UpdateExpression =
			"SET " +
			keyNameExpressions
				.map(
					(keyExpr, idx) => `${keyExpr} = ${keyValueExpressions[idx]}`
				)
				.join(", ");
		const ExpressionAttributeNames = keyNameExpressions.reduce(
			(exprs, nameExpr, idx) => ({ ...exprs, [nameExpr]: keys[idx] }),
			{}
		);
		const ExpressionAttributeValues = keyValueExpressions.reduce(
			(exprs, valueExpr, idx) => ({
				...exprs,
				[valueExpr]: updates[keys[idx]],
			}),
			{}
		);

		const params = {
			TableName: tableName,
			Key: { [primaryKey]: primaryKeyValue },
			UpdateExpression,
			ExpressionAttributeNames,
			ExpressionAttributeValues,
		};
		return documentClient.update(params).promise();
	},

	query: async ({ tableName, queryKey, queryValue }) => {
		const keyExpr = `#${queryKey}`;
		const params = {
			TableName: tableName,
			KeyConditionExpression: `${keyExpr}.#connected = :hkey`,
			ExpressionAttributeNames: {
				[keyExpr]: queryKey,
				"#connected": "connected",
			},
			ExpressionAttributeValues: {
				":hkey": queryValue,
			},
		};
		const res = await documentClient.query(params).promise();
		return res.Items || [];
	},

	queryOn: async ({ tableName, index, queryKey, queryValue }) => {
		const keyExpr = `#${queryKey}`;
		const params = {
			TableName: tableName,
			IndexName: index,
			KeyConditionExpression: `${keyExpr} = :hkey`,
			ExpressionAttributeNames: {
				[keyExpr]: queryKey,
			},
			ExpressionAttributeValues: {
				":hkey": queryValue,
			},
		};
		const res = await documentClient.query(params).promise();
		return res.Items || [];
	},
};

module.exports = Dynamo;

// const scanTable = async (tableName) => {
//     const params = { TableName: tableName, };
//     const scanResults = [];
//     const items;
//     do {
//         items =  await documentClient.scan(params).promise();
//         items.Items.forEach((item) => scanResults.push(item));
//         params.ExclusiveStartKey  = items.LastEvaluatedKey;
//     } while (typeof items.LastEvaluatedKey !== "undefined");
//     return scanResults;
// };
