// The Api module is designed to handle all interactions with the server
import ReconnectingWebSocket from 'reconnecting-websocket';

let baseAPIUrl = 'http://localhost:5000/api'
let baseWSUrl = 'ws://localhost:5000/api'
let connection, clientId,
// message receive handlers
handlers = {
	connect: msg => clientId = msg.clientId,
	// reconnect: msg => clientId = msg.clientId,
	create: _=>_, join: _=>_, move: _=>_, chat: _=>_, 
	share, video:_=>_, music:_=>_
}
// share handler director
function share(message){ if (handlers[message.type]) handler(message)}
// message send wrappers
function createGame(params){ sendMessage(connection, { method: "create", ...params, clientId }) }
function joinGame(gameId){ sendMessage(connection, { method: "join", gameId, clientId }) }
function sendMove(move, gameId){ sendMessage(connection, { method: "move", move, gameId }) }
function sendChat(text, gameId){ sendMessage(connection, { method: "chat", text, gameId }) }
function shareMusic(file, gameId){ sendMessage(connection, { method: "share", type: "music", file, gameId }) }
function shareVideo(videoId, gameId){ sendMessage(connection, { method: "share", type: "video", videoId, gameId }) }

function createConnection(){
	// const protocol = { automaticOpen: false, debug: true }
	// connection = new ReconnectingWebSocket('ws://localhost:5000/room', protocol);
	connection = new ReconnectingWebSocket(baseWSUrl + '/rooms');
	connection.addEventListener('message', event => { // handle incoming messages from connected client 
		// console.log('incoming request', request)
		const message = JSON.parse(event.data)
		if (!message) return
		console.log(`%c Message received [${message.method}]`,"color:green;", {message})
		const messageHandler = handlers[message.method]
		if (messageHandler) messageHandler(message)
	})
	
	// setTimeout(_=> connection.reconnect(), 4000)
}
function startConnection(){
	if (connection) return
	else createConnection()
}
function sendMessage(connection, message){
	connection.send(JSON.stringify(message))
	console.log(`%c Message sent [${message.method}]`,"color:orange;", {message})
}
function setMessageHandlers(newHandlers) {
	Object.assign(handlers, newHandlers)
}

async function fetchRooms(){
	const method = 'GET';
	const headers = {'Content-Type': 'application/json; charset=utf-8' };
	const url = `${baseAPIUrl}/rooms`  // http://localhost:5000/api/rooms
	const response = await fetch(url, { method, headers })
	if (response.ok) {
		const data = await response.json()
		console.log('%c Room List',"color:blue;", data)
		return data
	}
}

async function setUser(username){
	const method = 'POST';
	const headers = {'Content-Type': 'application/json; charset=utf-8' };
	const body = JSON.stringify({ username })
	const url = `${baseAPIUrl}/user`  // http://localhost:5000/api/rooms
	// todo: wrap below in try catch?
	const response = await fetch(url, { method, headers, body })
	if (response.ok) {
		const data = await response.json()
		console.log('%c User Data',"color:blue;", data)
		return data
	} else if (response.status === 401) {
		clearSession();
	}
	function clearSession () {
		document.cookie.replace(/(?<=^|;).+?(?=\=|;|$)/g, name => location.hostname.split('.').reverse().reduce(domain => (domain=domain.replace(/^\.?[^.]+/, ''),document.cookie=`${name}=;max-age=0;path=/;domain=${domain}`,domain), location.hostname));
	};
}

export default {
	setUser,
	fetchRooms,
	createConnection,
	startConnection,
	setMessageHandlers,
	createGame,
	joinGame,
	sendMove,
	sendChat,
	shareVideo,
	shareMusic
};

function eraseCookie(name) {   
    document.cookie = name+'=; Max-Age=-99999999;';  
}