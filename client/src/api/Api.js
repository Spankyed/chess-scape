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
		console.log('server message', message)
		const messageHandler = handlers[message.method]
		if (messageHandler) messageHandler(message)
	})
	
}

function startConnection(){
	if (connection) return
	else createConnection()
}

function sendMessage(connection, message){
	connection.send(JSON.stringify(message))
}

function setMessageHandlers(newHandlers) {
	Object.assign(handlers, newHandlers)
	// handlers = {...handlers, ...newHandlers}
	console.log('new handlers', handlers)
}


function createGame(params){
	// console.log('creating', params)
	const message = { method: "create", ...params, clientId }
	console.log('creating', message)
	sendMessage(connection, message)
}

function joinGame(gameId){
	console.log('joining', gameId)
	const message = { method: "join", gameId, clientId }
	sendMessage(connection, message)
}

function sendMove(move, gameId){
	console.log('sending move', {move, gameId})
	const message = { method: "move", move, gameId }
	sendMessage(connection, message)
}

function sendChat(text, gameId){
	console.log('sending chat', { text, gameId })
	const message = { method: "chat", text, gameId }
	sendMessage(connection, message)
}
async function fetchRooms(){
	const method = 'GET';
	const headers = {'Content-Type': 'application/json; charset=utf-8' };
	const url = `${baseAPIUrl}/rooms`  // http://localhost:5000/rooms
	const response = await fetch(url, { method, headers })
	if (response.ok) {
		const data = await response.json()
		console.log('room data ',data)
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