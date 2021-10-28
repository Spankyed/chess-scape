const Responses = require("../common/HTTP_Responses");
const Dynamo = require("../common/Dynamo");

const { withHooks } = require("../common/hooks");

const roomsTable = process.env.roomsTableName;

const handler = async (event) => {
	const rooms = await Dynamo.getAll(roomsTable);

	return Responses._200({ rooms: rooms.map(sanitizeRoom) });
};

// exports.handler = withHooks(["log", "parse"])(handler);
exports.handler = withHooks(["parse"])(handler);

function sanitizeRoom(room) {
	return {
		...room,
		gameOptions: {
			...room.gameOptions,
			pin: undefined,
		},
	};
}