// The Api module is designed to handle all interactions with the server
import ReconnectingWebSocket from 'reconnecting-websocket';

let clientId,
handlers = {
	create: _=>_, join: _=>_, move: _=>_, chat: _=>_,
	connect = msg => clientId = msg.clientId
}

const rws = new ReconnectingWebSocket('ws://my.site.com', {
	startClosed: true,
	debug: true
});

rws.addEventListener('message', msg => { // handle incoming messages from connected client 
	// console.log('incoming request', request)
	const message = JSON.parse(msg)
	if (!message) return
	// console.log('message', message)
	const messageHandler = handlers[message.method]
	if (messageHandler) messageHandler(message)
})

function setMessageHandlers(newHandlers) {
	Object.assign(handlers, newHandlers)
	console.log('new handlers', handlers)
}

function startConnection(){
	return rws.reconnect()
}

function joinGame(gameId){
	const message = { gameId, clientId }
	rws.send(message)
}

function sendMove(move, gameId){
	const message = { move, gameId }
	rws.send(message)
}

function sendChat(text, gameId){
	const message = { text, gameId }
	rws.send(message)
}

export default {
	startConnection,
	joinGame,
	sendMove,
	sendChat,
	setMessageHandlers
};