// The Api module is designed to handle all interactions with the server
// import ReconnectingWebSocket from 'reconnecting-websocket';
import { nanoid } from 'nanoid/non-secure'
import { serialize, deserialize } from 'bson';
import { Buffer } from 'buffer';

// const baseHttpUrl = 'http://localhost:5000/api'
// const baseWSUrl = "ws://localhost:5000/api";
const baseHttpUrl = "http://localhost:9001/local";
const baseWSUrl = 'ws://localhost:3001'
const client = JSON.parse(localStorage.getItem("client") || '""');
// let clientID = nanoid()
// let TOKEN = null; // client.TOKEN || null
let clientID = client.clientID || null
let TOKEN = client.TOKEN || null
let roomID = null;
let connection,
	// Message Received handlers
	handlers = {
		// connect: msg => console.log(msg.clientID), // already setting clientID onentrance
		// connect: msg => clientID = msg.clientID, // can't set const
		// join: msg => roomID ??= msg.roomID,
		create: (_) => _,
		join: (_) => _,
		move: (_) => _,
		chat: (_) => _,
		share: (msg) => handlers[msg.type]?.(msg),
		video: (_) => _,
		music: (_) => _,
	};

function setMessageHandlers(newHandlers) {
	Object.assign(handlers, newHandlers);
}

function createConnection() {
	// const protocol = { automaticOpen: false, debug: true }
	// connection = new ReconnectingWebSocket('ws://localhost:5000/room', protocol);
	connection = new ReconnectingWebSocket(baseWSUrl + "/rooms", TOKEN);
	if (connection)
		console.log(`%c Connected [${clientID}]`, "color:white;", {
			connection,
		});
	connection.addEventListener("message", ({ data }) => {
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
	});
	// setTimeout(_=> connection.reconnect(), 4000)
}

// ** --------------------------------------------------------------------------
// **  Send Message Wrappers
// ** --------------------------------------------------------------------------
function joinGame(id) {
	roomID ??= id;
	sendMessage({ method: "join", roomID });
}

function leaveGame(id) {
	sendMessage({ method: "leave", roomID });
	roomID = null;
}

function sendMove(move) {
	sendMessage({ method: "move", move });
}

function sendChat(text) {
	sendMessage({ method: "chat", text });
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
		clientID, // ! send TOKEN instead
	};
	connection.send(JSON.stringify(body));
	console.log(`%c Message sent [${message.method}]`, "color:orange;", body);
}

function restartConnection() {
	if (connection) return;
	else createConnection();
}

// ** --------------------------------------------------------------------------
// **  Http Request Wrappers
// ** --------------------------------------------------------------------------
// todo: wrap below in try-catches?
async function joinLobby() {
	const method = "POST";
	const headers = { "Content-Type": "application/json; charset=utf-8" };
	const body = JSON.stringify({ clientID });
	const url = `${baseHttpUrl}/join-lobby`;
	const response = await fetch(url, { method, headers, body });
	if (response.ok) {
		const rooms = await response.json();
		console.log("%c Room List", "color:blue;", { rooms });
		return rooms;
	}
}

async function createGameRoom(options) {
	const method = "POST";
	const headers = { "Content-Type": "application/json; charset=utf-8" };
	const body = JSON.stringify({ ...options, host: clientID});
	const url = `${baseHttpUrl}/create-room`;
	const response = await fetch(url, { method, headers, body });
	if (response.ok) {
		const room = await response.json();
		console.log("%c New Room", "color:blue;", { room });
		// dont do anything with response, websocket message should be sent to update room list in lobby
		return room;
	} else if (response.status === 401) {
		clearSession();
	}
	function clearSession() {
		localStorage.removeItem("client");
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
	} else if (response.status === 401) {
		clearSession();
	}
	function clearSession() {
		localStorage.removeItem("client");
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
	searchSongImage,
	createClient,
	joinLobby,
	createConnection,
	restartConnection,
	setMessageHandlers,
	createGameRoom,
	joinGame,
	sendMove,
	sendChat,
	shareVideo,
	shareMusic,
};

function eraseCookie(name) {   
    document.cookie = name+'=; Max-Age=-99999999;';  
}