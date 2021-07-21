// The Api module is designed to handle all interactions with the server
import ReconnectingWebSocket from 'reconnecting-websocket';

let baseAPIUrl = 'http://localhost:5000'
let connection, clientId,
handlers = {
	connect: msg => clientId = msg.clientId,
	create: _=>_, join: _=>_, move: _=>_, chat: _=>_
}

function createConnection(){
	// const protocol = { automaticOpen: false, debug: true }
	// connection = new ReconnectingWebSocket('ws://localhost:5000/room', protocol);
	connection = new ReconnectingWebSocket('ws://localhost:5000/rooms');
	connection.addEventListener('message', event => { // handle incoming messages from connected client 
		// console.log('incoming request', request)
		const message = JSON.parse(event.data)
		if (!message) return
		console.log('%c Message received ',"color:orange;", {message})
		const messageHandler = handlers[message.method]
		if (messageHandler) messageHandler(message)
	})
	
}

function startConnection(){
	if (connection) return
	else createConnection()
}

function sendMessage(connection, message){
	console.log(`%c ${message.method}`,"color:green;", {message})
	connection.send(JSON.stringify(message))
}

function setMessageHandlers(newHandlers) {
	Object.assign(handlers, newHandlers)
	// handlers = {...handlers, ...newHandlers}
	// console.log('new handlers', handlers)
}

function createGame(params){ sendMessage(connection, { method: "create", ...params, clientId }) }

function joinGame(gameId){ sendMessage(connection, { method: "join", gameId, clientId }) }

function sendMove(move, gameId){ sendMessage(connection, { method: "move", move, gameId }) }

function sendChat(text, gameId){ sendMessage(connection, { method: "chat", text, gameId }) }

async function fetchRooms(){
	const method = 'GET';
	const headers = {'Content-Type': 'application/json; charset=utf-8' };
	const url = `${baseAPIUrl}/rooms`  // http://localhost:5000/rooms
	const response = await fetch(url, { method, headers })
	if (response.ok) {
		const data = await response.json()
		console.log('%c Room List',"color:orange;",data)
		return data
	}
}

export default {
	fetchRooms,
	createConnection,
	startConnection,
	setMessageHandlers,
	createGame,
	joinGame,
	sendMove,
	sendChat
};