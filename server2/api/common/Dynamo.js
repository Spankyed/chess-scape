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
		// if (!data || !data.Item) {
		// 	throw Error(
		// 		`There was an error fetching the data for ID of ${ID} from ${TableName}`
		// 	);
		// }
		// console.log(data);
		return data.Item;
	},
	async delete(ID, TableName) {
		const params = {
			TableName,
			Key: {
				ID,
			},
		};
		const data = await documentClient.delete(params).promise();
		// console.log(data);
		return data;
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
	async append({ TableName, primaryKey, primaryKeyValue, data, select }) {
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
			// ConditionExpression: `attribute_exists(${key})`,
			UpdateExpression,
			ReturnValues: "ALL_NEW",
		};
		if (select) {
			const projExpr = `#${select}`;
			params.ExpressionAttributeNames[projExpr] = select;
			params.ProjectionExpression = projExpr;
		}
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
	// REMOVES AN ATTRIBUTE, DOESN'T DELETE
	remove: async ({
		TableName,
		primaryKey,
		primaryKeyValue,
		attributeName,
	}) => {
		const keyExpr = `#${attributeName}`;
		const params = {
			TableName,
			Key: { [primaryKey]: primaryKeyValue },
			UpdateExpression: `REMOVE ${keyExpr}`,
			ExpressionAttributeNames: {
				[keyExpr]: attributeName,
			},
		};
		return documentClient.update(params).promise();
	},
	// When we do updates we need express to DynamoDB what attributes we want updated.
	// If that's not annoying enough, we also need to be careful as some attribute names
	// might conflict with reserved words - so DynamoDB won't like them in the UpdateExpression.
	update: async ({ TableName, primaryKey, primaryKeyValue, updates }) => {
		const attrLineage = Object.keys(updates);
		const paramsMap = attrLineage.reduce((prev, lineageExpr) => {
			const lineage = lineageExpr.split(".");
			const attrValueExpr = `:${lineage.join("")}`;
			const UpdateExpression = `${lineage
				.map((key) => `#${key}`)
				.join(".")} = ${attrValueExpr}`;
			return {
				UpdateExpression: [
					...(prev.UpdateExpression || []),
					UpdateExpression,
				],
				ExpressionAttributeNames: {
					...prev.ExpressionAttributeNames,
					...lineage.reduce(
						(exprs, key) => ({ ...exprs, [`#${key}`]: key }),
						{}
					),
				},
				ExpressionAttributeValues: {
					...prev.ExpressionAttributeValues,
					[attrValueExpr]: updates[lineageExpr],
				},
			};
		}, {});

		const UpdateExpression = "SET " + paramsMap.UpdateExpression.join(", ");

		const params = {
			TableName,
			Key: { [primaryKey]: primaryKeyValue },
			...paramsMap,
			UpdateExpression,
			ReturnValues: "ALL_NEW",
		};
		return documentClient.update(params).promise().catch((err) => {
			console.log('Update Error')
			console.error(err)
		});
	},

	query: async ({ TableName, queryKey, queryValue }) => {
		const keyExpr = `#${queryKey}`;
		const params = {
			TableName,
			KeyConditionExpression: `${keyExpr} = :hkey`,
			ExpressionAttributeNames: {
				[keyExpr]: queryKey
			},
			ExpressionAttributeValues: {
				":hkey": queryValue,
			},
		};
		const res = await documentClient.query(params).promise();
		return res.Items || [];
	},

	queryOn: async ({ TableName, index, queryKey, queryValue, select }) => {
		const keyExpr = `#${queryKey}`;
		const params = {
			TableName,
			IndexName: index,
			KeyConditionExpression: `${keyExpr} = :hkey`,
			ExpressionAttributeNames: {
				[keyExpr]: queryKey,
			},
			ExpressionAttributeValues: {
				":hkey": queryValue,
			},
		};
		if (select) {
			const projExpr = `#${select}`
			params.ExpressionAttributeNames[projExpr] = select;
			params.ProjectionExpression = projExpr;
		}
		const res = await documentClient.query(params).promise();
		return res.Items || [];
	},
};

module.exports = Dynamo;

// const scanTable = async (TableName) => {
//     const params = { TableName: TableName, };
//     const scanResults = [];
//     const items;
//     do {
//         items =  await documentClient.scan(params).promise();
//         items.Items.forEach((item) => scanResults.push(item));
//         params.ExclusiveStartKey  = items.LastEvaluatedKey;
//     } while (typeof items.LastEvaluatedKey !== "undefined");
//     return scanResults;
// };

