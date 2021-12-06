// The Api module is designed to handle all interactions with the server
// import { nanoid } from 'nanoid/non-secure'
import Sockette from "sockette";
import { fromEvent, merge } from "rxjs";
import { take } from "rxjs/operators";

let baseHttpUrl =
	"https://zat0cu0vz6.execute-api.us-east-1.amazonaws.com/production/";
let baseWSUrl =
	"wss://0ct4bslf0g.execute-api.us-east-1.amazonaws.com/production";

if (process.env.NODE_ENV === "development") {
	console.log("process.env.NODE_ENV: ", process.env.NODE_ENV);
	baseHttpUrl = "http://localhost:9001/local";
	baseWSUrl = "ws://localhost:3001";
}

let clientID = null,
	TOKEN = null,
	username = null,
	roomID = null,
	connection,
	connected = false,
	pinger = null,
	// Message Received handlers
	handlers = {
		// connect: msg => clientID = msg.clientID, // already setting clientID in entrance
		create: () => {},
		delete: () => {},
		disband: () => {},
		join: () => {},
		start: () => {},
		rematch: () => {},
		offer: () => {},
		sync: () => {},
		move: () => {},
		chat: () => {},
		share: (msg) => handlers[msg.type]?.(msg),
		video: () => {},
		music: () => {},
		unauthorize: () => {},
		idleReconnect: () => {},
		reconnect: () => {},
	};

setClient(JSON.parse(localStorage.getItem("client") || '""'));

function setClient(client) {
	clientID = client.clientID;
	TOKEN = client.TOKEN;
	username = client.username;
}

function setMessageHandlers(newHandlers) {
	Object.assign(handlers, newHandlers);
}

async function createConnection() {
	const notConnected = !connected &&
		connection?.ws?.readyState != 0 && connection?.ws?.readyState != 1;
	const connectionURL = baseWSUrl + "/?TOKEN=" + TOKEN;
	connection = notConnected
		? new Sockette(connectionURL, {
				timeout: 5e3,
				maxAttempts: 6,
				onopen,
				onclose,
				onmessage,
				onreconnect, // todo refresh room list here instead on idleReconnect
				onmaximum: (e) => console.log("Stop Attempting!", e),
				onerror: (e) => console.log("WS Error:", e),
		  })
		: connection;

	function onopen(e) {
		connected = true;
		e.target.binaryType = "arraybuffer";
		connection.ws = e.target;
		// handlers.connect();
		console.log(`%c Connected [${clientID}]`, "color:white;")
	}
	function onreconnect() {
		console.log("Reconnecting...")
		handlers.reconnect();
	}
	function onclose(e) {
		connected = false;
		if (e.code == 1001) {
			awaitActivity(handlers.idleReconnect);
		}
		console.log(`%c Disconnected [${e.code}][${clientID}]`, "color:red;");
	}
	function onmessage({ data }) {
		// handle incoming messages from connected client
		let message = JSON.parse(data);
		if (!message) return;
		console.log(`%c Message received [${message.method}]`, "color:green;", {
			message,
		});
		const messageHandler = handlers[message.method];
		if (messageHandler) messageHandler(message);
	}
}

function reconnect() {
	if (!connected && connection) connection.reconnect();
	else console.error("unable to reconnect", { connected, connection });
}

function closeConnection() {
	connection.close()
}


function ping() {
	pinger = setInterval(() => sendMessage({ method: "ping" }), 1500);
}
function stopPinging() {
	pinger && clearInterval(pinger)
}

// ** --------------------------------------------------------------------------
// **  Send Message Wrappers
// ** --------------------------------------------------------------------------
function joinRoom(id) {
	roomID ??= id;
	sendMessage({ method: "join", roomID });
}

function sync() {
	sendMessage({ method: "sync" });
}

function ready(color) {
	sendMessage({ method: "ready", color });
}

function leaveRoom() {
	sendMessage({ method: "leave"});
	roomID = null;
}

function sendMove(move) {
	sendMessage({ method: "move", move });
}

function sendChat(text) {
	sendMessage({ method: "chat", text });
}

function offer(type) {
	sendMessage({ method: "offer", type });
}

function draw(accepted) {
	sendMessage({ method: "draw", accepted });
}

function rematch(accepted) {
	sendMessage({ method: "rematch", accepted });
}

function end(endMethod) {
	sendMessage({ method: "end", endMethod });
}


function shareVideo(videoId) {
	sendMessage({ method: "share", type: "video", videoId });
}

function sendMessage(message, isBson) {
	const body = {
		...message,
		...(roomID && { roomID }),
		action: "message",
		clientID, 
		TOKEN // ! MUST SEND TOKEN FOR AUTH
	};
	connection.send(JSON.stringify(body));
	console.log(`%c Message sent [${message.method}]`, "color:orange;", { body });
}

// ** --------------------------------------------------------------------------
// **  Http Request Wrappers
// ** --------------------------------------------------------------------------
// todo: wrap api calls in try-catch blocks?
async function getRoom(roomID) {
	const method = "POST";
	const headers = { "Content-Type": "application/json; charset=utf-8" };
	const body = JSON.stringify({ clientID, TOKEN, roomID });
	const url = `${baseHttpUrl}/get-room`;
	const response = await fetch(url, { method, headers, body });
	if (response.ok) {
		const {room, match} = await response.json();
		console.log("%c Room ", "color:blue;", { room, match });
		return {room, match};
	}
}
async function getRooms() {
	const method = "GET";
	const headers = { "Content-Type": "application/json; charset=utf-8" };
	const url = `${baseHttpUrl}/get-rooms`;
	const response = await fetch(url, { method, headers });
	if (response.ok) {
		const rooms = await response.json();
		console.log("%c Fetch Rooms", "color:blue;", rooms);
		return rooms;
	}
}
async function joinLobby() {
	const method = "POST";
	const headers = { "Content-Type": "application/json; charset=utf-8" };
	const body = JSON.stringify({ clientID, TOKEN });
	const url = `${baseHttpUrl}/join-lobby`;
	const response = await fetch(url, { method, headers, body });
	if (response.ok) {
		const rooms = await response.json();
		console.log("%c Initial Lobby Rooms", "color:blue;", { rooms });
		return rooms;
	} else if (response.status === 401) { // res is not defined
		handlers.unauthorize();
        throw Error("Unauthorized");
	}
}

async function joinPrivate({roomID: roomdId, pin}) {
	const method = "POST";
	const headers = { "Content-Type": "application/json; charset=utf-8" };
	const body = JSON.stringify({ roomID: roomdId, pin, clientID, TOKEN });
	const url = `${baseHttpUrl}/join-private`;
	const response = await fetch(url, { method, headers, body });
	if (response.ok) {
		const res = await response.json();
		if (res.valid) roomID ??= roomdId;
		console.log("%c Attempted join private", "color:blue;", { valid: res?.valid });
		return res;
	} else if (response.status === 401) {
		handlers.unauthorize();
		throw Error("Unauthorized");
	}
}
async function createRoom(gameOptions) {
	const method = "POST";
	const headers = { "Content-Type": "application/json; charset=utf-8" };
	const body = JSON.stringify({ gameOptions, clientID, TOKEN });
	const url = `${baseHttpUrl}/create-room`;
	const response = await fetch(url, { method, headers, body });
	if (response.ok) {
		const res = await response.json();
		console.log("%c New Room", "color:blue;", res);
		handlers.create(res);
		return res;
	} else if (response.status === 401) { // res is not defined
		handlers.unauthorize();
		throw Error("Unauthorized");
	}
}
async function deleteRoom(ID) {
	const method = "POST";
	const headers = { "Content-Type": "application/json; charset=utf-8" };
	const body = JSON.stringify({ ID, clientID, TOKEN});
	const url = `${baseHttpUrl}/delete-room`;
	const response = await fetch(url, { method, headers, body });
	if (response.ok) {
		const res = await response.json();
		console.log(`%c ${res?.message}`, "color:orange;");
		handlers.delete(res); // manually calling handler on client instead of server because...idk
	} else if (response.status === 401) {
		// res is not defined
		handlers.unauthorize();
		throw Error("Unauthorized");
	}
}

async function createClient(userInfo) {
	const method = "POST";
	const headers = { "Content-Type": "application/json; charset=utf-8" };
	const body = JSON.stringify(userInfo);
	const url = `${baseHttpUrl}/create-client`;
	// todo: wrap below in try catch?
	const response = await fetch(url, { method, headers, body });
	if (response.ok) {
		const { newClient } = await response.json();
		console.log("%c User Data", "color:blue;", { newClient });
		clientID = newClient.ID;
		TOKEN = newClient.TOKEN;
		username = newClient.username;
		localStorage.setItem(
			"client",
			JSON.stringify({ clientID, TOKEN, username })
		);
		return newClient;
	}
}

async function shareSong(songForm) {
	const method = "POST";
	const url = `${baseHttpUrl}/share-song`;
	// todo: wrap below in try catch?
	songForm.append("clientID", clientID);
	songForm.append('TOKEN', TOKEN)
	songForm.append('roomID', roomID)
	// const body = JSON.stringify({ songForm, roomID, clientID, TOKEN });
	const response = await fetch(url, { method, body: songForm });
	if (response.ok) {
		const res = await response.json();
		console.log("%c Song created", "color:blue;", { res });
		return res;
	}
}

async function searchSongImage(title) {
	const method = "POST";
	const headers = { "Content-Type": "application/json; charset=utf-8" };
	const body = JSON.stringify({ title, clientID });
	const url = `${baseHttpUrl}/search-song-image`;
	const response = await fetch(url, { method, headers, body });
	if (response.ok) {
		const res = await response.json();
		console.log("%c Song image", "color:blue;", { image: res?.image });
		return res &&  JSON.parse(res?.image);
	}
}

async function pushSubscribe(subscription) {
	const method = "POST";
	const headers = { "Content-Type": "application/json; charset=utf-8" };
	const body = JSON.stringify({ clientID, TOKEN, subscription });
	const url = `${baseHttpUrl}/push-subscribe`;
	const response = await fetch(url, { method, headers, body });
	if (response.ok) {
		const res = await response.json();
		console.log("%c Device subscribed push notifications", "color:blue;", { res });
		return res;
	} else if (response.status === 401) {
		// res is not defined
		handlers.unauthorize();
		throw Error("Unauthorized");
	}
}

async function adminSetUser(client) {
	if (!client) throw Error("Unable to set user");
	const method = "GET";
	const headers = { "Content-Type": "application/json; charset=utf-8" };
	const url = `${baseHttpUrl}/get-client/${client?.clientID}`;
	const response = await fetch(url, { method, headers });
	if (response.ok) {
		const { username } = await response.json();
		const clientInfo = { ...client, username };
		setClient(clientInfo);
		console.log("%c Admin set client ", "color:blue;", { clientInfo });
		return username;
	} else if (response.status === 400) {
		throw Error("Unable to set user");
	}
}
async function getPushKey() {
	const method = "GET";
	const headers = { "Content-Type": "application/json; charset=utf-8" };
	const url = `${baseHttpUrl}/get-push-key`;
	const response = await fetch(url, { method, headers });
	if (response.ok) {
		const { publicKey } = await response.json();
		console.log("%c Push Key retrieved", "color:blue;", { publicKey });
		return publicKey;
	}
}

export default {
	adminSetUser,
	getPushKey,
	createClient,
	getRoom,
	getRooms,
	joinLobby,
	searchSongImage,
	setMessageHandlers,
	createConnection,
	reconnect,
	closeConnection,
	createRoom,
	deleteRoom,
	joinRoom,
	joinPrivate,
	pushSubscribe,
	sync,
	ready,
	leaveRoom,
	end,
	offer,
	draw,
	rematch,
	sendMove,
	sendChat,
	shareVideo,
	// shareMusic,
	shareSong,
	ping,
	stopPinging,
	isConnected: () => connected,
	getClientID: () => clientID,
	getUsername: () => username,
};

function eraseCookie(name) {   
    document.cookie = name+'=; Max-Age=-99999999;';  
}

function awaitActivity(callback) {
	console.log("idling");
	const activities$ = merge(
		...[
			"mousemove",
			"mousedown",
			"touchstart",
			"keydown",
			"click",
			"scroll",
		].map((ev) => fromEvent(document, ev)),
		fromEvent(window, "focus")
	);
	return activities$.pipe(take(1)).subscribe(() => {
		reconnect()
		callback()
	});
}