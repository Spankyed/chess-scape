const webpush = require("web-push");
const Responses = require("../common/HTTP_Responses");
const Dynamo = require("../common/Dynamo");
const { hooksWithSchema } = require("../common/hooks");
const { sendMessageToRoomExcept } = require("../common/websocket/message");
const { customAlphabet } = require("nanoid");
const nanoid = customAlphabet("1234567890abcdef", 20);
const initialState = require("../websockets/methods/move/state");

const roomsTable = process.env.roomsTableName;
const matchesTable = process.env.matchesTableName;
const clientsTable = process.env.clientsTableName;
const serviceTable = process.env.serviceTableName;

// todo validate schema
const schema = {
	// body: { name: "string" },
};

// filter: currently only 'forever' game type is allowed/enabled
function allowedOptions(gameOptions) {
	const { pin, selectedOpp, selectedColor } = gameOptions;
	return {
		name: "forever",
		time: { minutes: "—", increment: "—" },
		selectedOpp: selectedOpp == "computer" ? "anyone" : selectedOpp,
		pin,
		selectedColor,
	};
}

const handler = async (event) => {
	// todo do not allow to create room if already hosting room 
	const { client, clientID, gameOptions: opts } = event.body;
	const { selectedColor } = opts

	const rooms = await Dynamo.getAll(roomsTable);

	// check if cient is already hosting a room
	const isHost = rooms.find((room) => room.host === clientID);
	if (isHost) {
		return Responses._409({
			message: "User is already hosting a room",
		});
	}

	const room = {
		gameOptions: allowedOptions(opts),
		ID: nanoid(),
		host: clientID,
		hostName: client.username,
		players: { [selectedColor]: { clientID, username: client.username } },
		selectedColor,
		spectators: {},
		chat: [],
		created: Date.now(),
		matchStarted: false,
	};

	try {
		const newRoom = await Dynamo.write(room, roomsTable);
		if (!newRoom) {
			console.log("Failed to create room");
			return Responses._400({ message: "Failed to create room" });
		} else {
			const match = {
				ID: room.ID,
				host: room.host,
				players: {
					[selectedColor]: {
						clientID: room.host,
						ready: false,
						committed: false,
					},
				},
				selectedColor,
				lastMove: {
					fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
				},
				colorToMove: "white",
				created: room.created,
				started: false,
				state: initialState,
				moves: [],
			};
			await Promise.all([
				// sendMessageToLobby({ method: "create", newRoom }),
				sendMessageToRoomExcept("lobby", clientID, {
					method: "create",
					newRoom,
				}),
				Dynamo.write(match, matchesTable),
			]);

			if (room.gameOptions.selectedOpp == "angel") {
				await notifyAngel(room.ID, client.username);
			}
		}

		console.log(`Player[${clientID}] created room[${newRoom.ID}]`);
		return Responses._200({ newRoom });

	} catch (err) {
		console.error(err);
		return Responses._400({ error: err.message });
	}
};

// exports.handler = hooksWithSchema(schema, ["log", "parse"])(handler);
exports.handler = hooksWithSchema(schema, ["parse", "authorize"])(handler);


async function notifyAngel(roomID, oppName) {
	/**
	 * Subscriptions may get out of sync between FCM and server.
	 * Make sure server parses the response body of the webpush
	 * sendNotification, looking for error:NotRegistered and canonical_id results,
	 * as explained in the FCM documentation.
	 * https://developers.google.com/web/updates/2015/03/push-notifications-on-the-open-web
	 */
	const [vapidKeys, angel] = await Promise.all([
		Dynamo.get("vapidKeys", serviceTable),
		Dynamo.get("angel", clientsTable),
	]);

	webpush.setVapidDetails(
		"mailto:angel.santiago@tutanota.com",
		vapidKeys.publicKey,
		vapidKeys.privateKey
	);

	const payload = { roomID, oppName };

	angel.subscriptions.forEach((subscription) => {
		webpush
			.sendNotification(subscription, JSON.stringify(payload))
			.then((response) => {
				console.log("Notification sent", {
					payload,
					response,
					subscription,
				});
			})
			.catch((err) => {
				console.error(err);
				removeSubscriptions(angel.ID);
			});
	});

	async function removeSubscriptions(clientID) {
		await Dynamo.update({
			TableName: clientsTable,
			primaryKey: "ID",
			primaryKeyValue: clientID,
			updates: {
				subscriptions: [],
			},
		});
	}
}
