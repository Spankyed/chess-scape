// The Api module is designed to handle all interactions with the server
import { nanoid } from 'nanoid/non-secure'
import { serialize, deserialize } from 'bson';
import { Buffer } from 'buffer';
import Sockette from "sockette";
import { fromEvent, merge } from "rxjs";
import { take } from "rxjs/operators";

const baseHttpUrl = "http://localhost:9001/local";
const baseWSUrl = 'ws://localhost:3001'
const client = JSON.parse(localStorage.getItem("client") || '""');
let clientID = client.clientID || null,
	TOKEN = client.TOKEN || null,
	roomID = null,
	connection,
	connected = false,
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
	};

function setMessageHandlers(newHandlers) {
	Object.assign(handlers, newHandlers);
}

async function createConnection() {
	const notConnected = !connected &&
		connection?.ws?.readyState != 0 && connection?.ws?.readyState != 1;

	connection = notConnected ? new Sockette(baseWSUrl, {
		timeout: 5e3,
		// maxAttempts: 4,
		onopen,
		onclose,
		onmessage,
		onreconnect: (e) => console.log("Reconnecting..."), // todo refresh room list here instead on idleReconnect
		onmaximum: (e) => console.log("Stop Attempting!", e),
		onerror: (e) => console.log("WS Error:", e),
		protocols: TOKEN,
	}) : connection;

	function onopen(e) {
		connected = true;
		e.target.binaryType = "arraybuffer";
		connection.ws = e.target;
		console.log(`%c Connected [${clientID}]`, "color:white;")
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
		let isBinary = data instanceof ArrayBuffer;
		// let isBinary = Buffer.isBuffer(data)
		let message = isBinary
			? deserialize(Buffer.from(data), { promoteBuffers: true })
			: JSON.parse(data);
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

// function shareMusic(rawData){ connection.send(rawData) }
// function shareMusic(rawData){ sendMessage(encode({ method: "share", type: "music", rawData })) }
function shareMusic(songData, rawData) {
	let { src, ...song } = songData;
	let BSON = serialize({
		method: "share",
		type: "music",
		roomID,
		song, // clientID, // add clientID to msg after testing/development
		rawData: Buffer.from(rawData),
		action: 'message'
	});
	// let bson = serialize({ method: "share", type: "music", blob: rawData }) // test when rawData is type blob fails, file converted to obj and binary data loss
	connection.send(BSON);
	console.log(
		`%c Song data sent`,
		"color:orange;",
		deserialize(BSON, { promoteBuffers: true })
	);
}

function shareVideo(videoId) {
	sendMessage({ method: "share", type: "video", videoId });
}

function sendMessage(message) {
	const body = {
		...message,
		...(roomID && { roomID }),
		action: "message",
		clientID, 
		TOKEN // ! MUST SEND TOKEN FOR AUTH
	};
	connection.send(JSON.stringify(body));
	console.log(`%c Message sent [${message.method}]`, "color:orange;", body);
}

// ** --------------------------------------------------------------------------
// **  Http Request Wrappers
// ** --------------------------------------------------------------------------
// todo: wrap api calls in try-catch blocks?
async function getRoom(ID) {
	const method = "GET";
	const headers = { "Content-Type": "application/json; charset=utf-8" };
	const url = `${baseHttpUrl}/get-room/${ID}`;
	const response = await fetch(url, { method, headers });
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
	} else if (response.status === 401) {
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
		console.log("%c Attempted join private", "color:blue;", { res });
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
		const room = await response.json();
		console.log("%c New Room", "color:blue;", { room });
		// dont do anything with response, websocket message should be sent to update room list in lobby
		return room;
	} else if (response.status === 401) {
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
		console.log(`%c ${res.message}`, "color:orange;");
		handlers.delete(res);
	} else if (res.status === 401) {
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
		localStorage.setItem("client", JSON.stringify({ clientID, TOKEN }));
		return newClient;
	}
}
async function searchSongImage(title) {
	const method = "POST";
	const headers = { "Content-Type": "application/json; charset=utf-8" };
	const body = JSON.stringify({ title });
	const url = `${baseHttpUrl}/search`;
	const response = await fetch(url, { method, headers, body });
	if (response.ok) {
		const imageSrc = await response.json();
		console.log("%c Song image", "color:blue;", { imageSrc });
		return imageSrc;
	}
}

export default {
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
	shareMusic,
	isConnected: () => connected,
	getClientID: () => clientID,
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