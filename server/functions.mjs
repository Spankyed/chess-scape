// nodemon --inspect ./server.js

import ChessLib  from 'chess.js';
import fetch  from 'node-fetch';
import HTMLParser from 'node-html-parser';
import BSON from 'bson';
import fileType from 'file-type';

const { Chess } = ChessLib;

let clients = {}; // todo: change or copy to lobby.clients, move clients in/out of lobby when join/leave gameRooms
let gameRooms = {};
async function getGoogleImage(search){
    // console.time('fetch')
    const url = 'https://www.google.com/search?tbm=isch&q=' + encodeURIComponent(search + ' song')
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
        let isBinary = Buffer.isBuffer(request)
        let message = isBinary ? BSON.deserialize(request, {promoteBuffers: true}) : JSON.parse(request)
        if (!message) return
        if(isBinary && !isValidFileType(message.rawData)) return
        // if (isBinary) console.log("bson", message)
        console.log(`%c Incoming message [${message.method}] from [${clientId}]`,"color:green;", message)
        const methods = { create, join, move, chat, share}
        const messageHandler = methods[message.method]
        if (messageHandler) messageHandler({message, clientId})

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
function create({message, clientId}){
    // console.log('creating')
    // const clientId = message.clientId;
    if (!clients[clientId]) return
    // const matchParams = message.matchParams;
    const gameId = addNewGameRoom(clientId)
    const response = {
        "method": "create",
        "gameId" : gameId,
        "gameRooms" : mapRooms(),
    }
    sendMessageAll(response)

}
function join({message, clientId}){ // client wants to join a game
    // const {gameId, clientId} = message;
    const {gameId} = message;
    const gameRoom = gameRooms[gameId];
    if(!gameRoom) return
    // const color =  {"0": "white", "1": "black"}[gameRoom.clients.length]
    if (!gameRoom.clients.includes(clientId)) gameRoom.clients.push(clientId) 
    // else // todo: reject client from joining - security
    if (gameRoom.clients.length === 2) gameRoom.matchStarted = true; // todo: check max players instead of clients
    const response = { "method": "join", gameId, clientId, matchStarted: gameRoom.matchStarted }
    // todo: notify all clients in lobby a player has joined a gameRoom to update their room list 
    gameRoom.clients.forEach( (clientId) => sendMessage(clientId, response) )
}
function leave({message, clientId}){ //a client want to leave
    const {gameId} = message;
    const gameRoom = gameRooms[gameId];
    // if (arr.includes(val)) arr.splice(arr.indexOf(val), 1)
    const response = { "method": "join", clientId, matchStarted: gameRoom.matchStarted }
    // notify all clients that a player has left
    gameRoom.clients.forEach( (clientId) => sendMessage(clientId, response) )
}
function move({message, clientId}) { // a user plays
    // todo: verify player is actually same color as move made
    const gameId = message.gameId;
    const gameRoom = gameRooms[gameId];
    if (!gameRoom) return   // todo: if gameroom not found send user error message to leave game
    const match = gameRoom.match
    if (!match) return  
    if (match.game_over()){
        const response = { "method": "endGame", move }
        gameRoom.clients.forEach( (clientId) => sendMessage(clientId, response) )
        // socket.emit('gameOver', roomId)
    }
    else {
        const validMove = match.move(message.move)
        // const move = match.move(message.move, { verbose: true })
        if(!validMove) return // todo: if not valid move, send game state to sync client, and alert user board was synced
        const response = { "method": "move", move: validMove, clientId }
        messageOtherClients(gameRoom, clientId, response)
        // gameRoom.clients.forEach( (clientId) => sendMessage(clientId, response) )
    }
}
function chat({message, clientId}) {
    const {text, gameId} = message;
    const gameRoom = gameRooms[gameId]
    if (!gameRoom) return
    const response = { "method": "chat", text }
    messageOtherClients(gameRoom, clientId, response)
}
function share(params){
    let mediaHandlers = { 'video': shareVideo, 'music': shareMusic  } 
    mediaHandlers[params.message.type](params)
}
function shareVideo({message, clientId}) {
    const {videoId, gameId} = message;
    const gameRoom = gameRooms[gameId]
    if (!gameRoom) return   
    const response = { method: "share", type:'video', videoId }
    messageOtherClients(gameRoom, clientId, response)
}
function shareMusic({message, clientId}) { // todo: check if song has image, otherwise scrap google?
    const {gameId, song, rawData} = message;
    const gameRoom = gameRooms[gameId]
    if (!gameRoom) return
    const response = BSON.serialize({ "method": "share", type:'music', song, rawData })
    // messageOtherClients(gameRoom, clientId, response)
    // gameRoom.clients.forEach( (clientId) => sendMessage(clientId, response) )
    console.log(`%c Sent message [${message.method}] to [${clientId}]`,"color:orange;", {response})
    gameRoom.clients.forEach( (clientId) => {
        clients[clientId].connection.socket.send(response)
    } )
}

function addNewClient(username, ip) {
    const clientId = guid()
    clients[clientId] = { clientId, username, ip }
    return clientId
}
function setClientConnection(clientId, connection) {
    clients[clientId] = {...clients[clientId], connection}
}

function sendMessageAll(message, clientId){
    Object.values(clients).forEach( client => {
        const clientConn = client.connection;
        if (clientConn) clientConn.socket.send(JSON.stringify(message));
    })
}
function sendMessage(clientId, message){
    // todo: check if client is still connected before trying to send messages
    clients[clientId].connection.socket.send(JSON.stringify(message))
    console.log(`%c Sent message [${message.method}] to [${clientId}]`,"color:orange;", {message})
}
function messageOtherClients(gameRoom, sender, message){
    gameRoom.clients.forEach(clientId => { 
        if (clientId != sender) sendMessage(clientId, message)
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


async function isValidFileType(buffer){
    // fileType.mime === 'image/jpeg'
    // if (stream2.fileType && stream2.fileType.mime === 'image/jpeg') if (stream2.fileType && stream2.fileType.mime === 'image/jpeg') 
    let {mime} = await fileType.fromBuffer(buffer) // todo: test/ensure that audio is on all audio mime types
    return (mime.indexOf('audio') > -1)
}


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
