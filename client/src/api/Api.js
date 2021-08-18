// The Api module is designed to handle all interactions with the server
import ReconnectingWebSocket from 'reconnecting-websocket';
import { nanoid } from 'nanoid/non-secure'

const baseAPIUrl = 'http://localhost:5000/api'
const baseWSUrl = 'ws://localhost:5000/api'
const clientId = nanoid()//localStorage.getItem('clientId'),
let gameId = null
let connection,

// Message Received handlers
handlers = {
	connect: msg => console.log(msg.clientId), // already setting clientId onentrance
	// connect: msg => clientId = msg.clientId, // can't set const
	// join: msg => gameId ??= msg.gameId,
	create: _=>_, join: _=>_, move: _=>_, chat: _=>_, 
	share: msg => handlers[msg.type]?.(msg),
	video:_=>_, music:_=>_
}

// Send message wrappers
function createGame(params){ sendMessage({ method: "create", ...params }) }
function joinGame(id){ 
	gameId ??= id; 
	console.log('joining ', gameId)
	sendMessage({ method: "join", gameId }) 
}
function leaveGame(id){ 
	sendMessage({ method: "leave", gameId }) 
	gameId = null; 
}
function sendMove(move){ sendMessage({ method: "move", move }) }
function sendChat(text){ sendMessage({ method: "chat", text }) }
// function shareMusic(rawData){ sendMessage(encode({ method: "share", type: "music", rawData })) }
function shareMusic(rawData){ connection.send(rawData) }
function shareVideo(videoId){ sendMessage({ method: "share", type: "video", videoId }) }

function createConnection(){
	// const protocol = { automaticOpen: false, debug: true }
	// connection = new ReconnectingWebSocket('ws://localhost:5000/room', protocol);
	connection = new ReconnectingWebSocket(baseWSUrl + '/rooms', clientId);
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
function sendMessage(message){
	connection.send(JSON.stringify({ ...(gameId && {gameId}), ...message}))
	console.log(`%c Message sent [${message.method}]`,"color:orange;", {...message, clientId, gameId})
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
		const rooms = await response.json()
		console.log('%c Room List',"color:blue;", {rooms})
		return rooms
	}
}
async function setUser(username){
	const method = 'POST';
	const headers = {'Content-Type': 'application/json; charset=utf-8' };
	const body = JSON.stringify({ username })
	const url = `${baseAPIUrl}/user` 
	// todo: wrap below in try catch?
	const response = await fetch(url, { method, headers, body })
	if (response.ok) {
		const userData = await response.json()
		console.log('%c User Data',"color:blue;", {userData})
		localStorage.setItem('clientId', userData.clientId);
		clientId = userData.clientId
		return userData
	} else if (response.status === 401) {
		clearSession();
	}
	function clearSession () { localStorage.removeItem('clientId') }
}
async function searchSongImage(title){
	const method = 'POST';
	const headers = {'Content-Type': 'application/json; charset=utf-8' };
	const body = JSON.stringify({ title })
	const url = `${baseAPIUrl}/search`
	const response = await fetch(url, { method, headers, body })
	if (response.ok) {
		const imageSrc = await response.json()
		console.log('%c Song image',"color:blue;", {imageSrc})
		return imageSrc
	}
}

export default {
	searchSongImage,
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