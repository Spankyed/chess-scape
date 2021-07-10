// The Api module is designed to handle all interactions with the server
import ReconnectingWebSocket from 'reconnecting-websocket';

let webSocket, clientId,
handlers = {
	create: _=>_, join: _=>_, move: _=>_, chat: _=>_,
	connect: msg => clientId = msg.clientId
}

function createConnection(){
	const protocol = { automaticOpen: false, debug: true }
	webSocket = new ReconnectingWebSocket('ws://localhost:5000/room', protocol);
	webSocket.addEventListener('message', event => { // handle incoming messages from connected client 
		// console.log('incoming request', request)
		const message = JSON.parse(event.data)
		if (!message) return
		console.log('server message', message)
		const messageHandler = handlers[message.method]
		if (messageHandler) messageHandler(message)
	})
	
}

function setMessageHandlers(newHandlers) {
	Object.assign(handlers, newHandlers)
	console.log('new handlers', handlers)
}

function startConnection(){
	return webSocket.reconnect()
}

function joinGame(gameId){
	const message = { gameId, clientId }
	webSocket.send(message)
}

function sendMove(move, gameId){
	const message = { move, gameId }
	webSocket.send(message)
}

function sendChat(text, gameId){
	const message = { text, gameId }
	webSocket.send(message)
}

export default {
	startConnection,
	joinGame,
	sendMove,
	sendChat,
	setMessageHandlers
};