// nodemon --inspect ./server.js

import ChessLib  from 'chess.js';
import fetch  from 'node-fetch';
import HTMLParser from 'node-html-parser';

const { Chess } = ChessLib;

const clients = {}; // todo: change or copy to lobby.clients, move clients in/out of lobby when join/leave gameRooms
const gameRooms = {};
    
async function getGoogleImage(search){
    // console.time('fetch')
    const url = 'https://www.google.com/search?tbm=isch&q=' + encodeURIComponent(search)
    let page = await fetch(url)
    // console.timeEnd('fetch')
    let html = await page.text()
    let parsedPage = HTMLParser.parse(html)
    let img = parsedPage.querySelectorAll('img')[1].attributes.src
    return img
}

async function handleSearchHttp(req, reply) {
    const { title } = req.body
    const image = await getGoogleImage(title);
    reply.send(JSON.stringify(image)) // get rooms list
}

function handleRoomsHttp(req, reply) {
    reply.send(JSON.stringify(mapRooms())) // get rooms list
}
function handleUsersHttp(req, reply) {
    const { username } = req.body
    let clientId = addNewClient(username, req.ip)
    let response = JSON.stringify({ action: 'client-added', clientId })
    reply.send(response)
}
function handleRoomsWebSocket(connection, req) {
    let clientId = req.headers['sec-websocket-protocol']
    if (clientId) setClientConnection(clientId, connection)
    let response = { method: 'connect', clientId }
	connection.socket.send(JSON.stringify(response))
    // todo: notify lobby player has joined 
    // console.log('client connected', {client:clients[clientId]})
    // set message handlers
    connection.socket.on('message', request => { // handle incoming messages from connected client 
		// console.log('incoming request ', request)
		// const message = request
		const message = JSON.parse(request)
		console.log('incoming message', message)
        if (!message) return
        const methods = { create, join, move, chat, share}
        const messageHandler = methods[message.method]
        if (messageHandler) messageHandler(message)
	})
    // connection.socket.on('open', _ => console.log('~opened: ', i++))
    // connection.socket.on('close', _ => delete clients[clientId])
}
function addNewGameRoom(clientId) {
    const gameId = guid()
    gameRooms[gameId] = {
        "id": gameId,
        // "matchParams": { "color_player_1": 'whites' },
        // "state": {},
        "host": clientId,
        "clients": [clientId],
        "match": new Chess(),
        "whitePlayerId":'',
        "blackPlayerId":'',
        "matchStarted": false
    }
    return gameId
}
// {
//     "method": "create",
//     "clientId" : "<guid>"
// }
function create(message){
    // console.log('creating')
    const clientId = message.clientId;
    if (!clients[clientId]) return
    // const matchParams = message.matchParams;
    const gameId = addNewGameRoom(clientId)
    const response = {
        "method": "create",
        "gameId" : gameId,
        "gameRooms" : mapRooms(),
    }
    Object.values(clients).forEach( client => {
        const clientConn = client.connection;
        if (clientConn) clientConn.socket.send(JSON.stringify(response));
    })
}
function join(message){ //a client want to join
    const {gameId, clientId} = message;
    const gameRoom = gameRooms[gameId];
    if(!gameRoom) return
    // if (gameRoom.clients.length >= 2) return; // todo: max players instead of clients
    // const color =  {"0": "white", "1": "black"}[gameRoom.clients.length]
    gameRoom.clients.push(clientId)
    if (gameRoom.clients.length === 2) gameRoom.matchStarted = true; // start the game
    const response = { "method": "join", clientId, matchStarted: gameRoom.matchStarted }
    // todo: notify all clients in lobby a player has joined a gameRoom to update their room list 
    // todo: check if client is still connected before trying to send message
    gameRoom.clients.forEach( (clientId) => clients[clientId].connection.socket.send(JSON.stringify(response)) )
}
function leave(message){ //a client want to leave
    const {gameId, clientId} = message;
    const gameRoom = gameRooms[gameId];
    // if (arr.includes(val)) arr.splice(arr.indexOf(val), 1)
    const response = { "method": "join", clientId, matchStarted: gameRoom.matchStarted }
    // notify all clients that a player has left
    gameRoom.clients.forEach( (clientId) => clients[clientId].connection.socket.send(JSON.stringify(response)) )
}
function move(message) { // a user plays
    // todo: verify player is actually same color as move made
    const gameId = message.gameId;
    const gameRoom = gameRooms[gameId];
    if (!gameRoom) return   // todo: if gameroom not found send user error message to leave game
    const match = gameRoom.match
    if (!match) return  
    if (match.game_over()){
        const response = { "method": "endGame", move }
        gameRoom.clients.forEach( (clientId) => clients[clientId].connection.socket.send(JSON.stringify(response)) )
        // socket.emit('gameOver', roomId)
    }
    else {
        const move = match.move(message.move)
        // const move = match.move(message.move, { verbose: true })
        // todo: if not valid move, send game state to sync client
        if(!move) return
        const response = { "method": "move", move }
        // messageOtherClients(gameRoom, clientId, JSON.stringify(response))
        gameRoom.clients.forEach( (clientId) => clients[clientId].connection.socket.send(JSON.stringify(response)) )
    }
}
function chat(message) {
    const {text, gameId, clientId} = message;
    const gameRoom = gameRooms[gameId]
    if (!gameRoom) return
    const response = { "method": "chat", text }
    messageOtherClients(gameRoom, clientId, JSON.stringify(response))
}
function share(message){
    let mediaHandlers = { 'video': shareVideo, 'music': shareMusic  } 
    mediaHandlers[message.type](message)
}
function shareVideo(message) {
    const {videoId, gameId, clientId} = message;
    const gameRoom = gameRooms[gameId]
    if (!gameRoom) return   // todo: if gameroom not found send user error message to leave game
    const response = { method: "share", type:'video', videoId }
    messageOtherClients(gameRoom, clientId, JSON.stringify(response))
}
function shareMusic(message) {
    const {song, gameId, clientId} = message;
    const gameRoom = gameRooms[gameId]
    if (!gameRoom) return

    // todo: check if song has image, otherwise scrap google
    const response = { "method": "share", text }
    messageOtherClients(gameRoom, clientId, JSON.stringify(response))
    // gameRoom.clients.forEach( (clientId) => clients[clientId].connection.socket.send(JSON.stringify(response)) )
}

function addNewClient(username, ip) {
    const clientId = guid()
    clients[clientId] = { clientId, username, ip }
    return clientId
}
function setClientConnection(clientId, connection) {
    clients[clientId] = {...clients[clientId], connection}
}

function messageOtherClients(gameRoom, sender, message){
    gameRoom.clients.forEach(clientId => { 
        if (clientId != sender) clients[clientId].connection.socket.send(message)
    })
}
function mapRooms(){
    return Object.values(gameRooms).map( room => {
        const { match, whitePlayerId, blackPlayerId, // omitted properties
            ...roomModel } = room;
        return roomModel
    })
}
function guid() {
	// Convert it to base 36 (numbers + letters), and grab the first 9 characters
	return '_' + Math.random().toString(36).substr(2, 9);
};


// function guid() {
//   return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
//     var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
//     return v.toString(16);
//   });
// }

export default {
    handleRoomsHttp,
    handleUsersHttp,
    handleSearchHttp,
    handleRoomsWebSocket
}
