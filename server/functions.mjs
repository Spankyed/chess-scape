// nodemon --inspect ./server.js

import ChessLib  from 'chess.js';
const { Chess } = ChessLib;

const clients = {}; // todo: change or copy to lobby.clients, move clients in/out of lobby when join/leave gameRooms
const gameRooms = {};
    

function handleRoomsHttp(req, reply) {
    reply.send(JSON.stringify(mapRooms())) // get rooms list
}
function handleUsersHttp(req, reply) {
    const { username } = req.body
    const clientCookie = req.cookies.clientId
    console.log({clientCookie})
    // const bCookie = req.unsignCookie(req.cookies.cookieSigned);
    // console.log('bcookie', bCookie)
    if (!clientCookie) { // todo: check for client in clients[] instead, if found user is reconnecting
        let clientId = addNewClient(username, req.ip)
        console.log('bicchh',clients)
        let response = JSON.stringify({ action: 'client-added', clientId })
        reply
        .setCookie('clientId', clientId, {
            path: '/',
            // domain: '127.0.0.1',
            // secure: this.config.NODE_ENV === 'production',
            // sameSite: 'false',
            // httpOnly: true,
            // signed: true,
            // maxAge: 60 * 60 * 24 * 7, // 1 week
            // expires: new Date(Date.now() + 604800 * 1000)
        })
        .send(response)
    }
}
function handleRoomsWebSocket(connection, req) {
    console.log('trying to connect')
    const clientId = req.cookies.clientId
    // if (clientCookie)  
    console.log('client connected', { clientId })
    if (clientId) setClientConnection(clientId, connection)
    response = { method: 'connect', clientId }
	connection.socket.send(JSON.stringify(response))

    // set message handler
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
    console.log('creating')
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
    const clientId = message.clientId;
    const gameId = message.gameId;
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
    const clientId = message.clientId;
    const gameId = message.gameId;
    const gameRoom = gameRooms[gameId];
    if (arr.includes(val)) arr.splice(arr.indexOf(val), 1)
    const response = { "method": "join", clientId, matchStarted: gameRoom.matchStarted }
    // notify all clients new client has joined
    gameRoom.clients.forEach( (clientId) => clients[clientId].connection.socket.send(JSON.stringify(response)) )
}
function move(message) { // a user plays
    // todo: verify player is same color as move made
    const gameId = message.gameId;
    const gameRoom = gameRooms[gameId];
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
        gameRoom.clients.forEach( (clientId) => clients[clientId].connection.socket.send(JSON.stringify(response)) )
    }
}
function chat(message) {
    const text = message.text;
    const gameId = message.gameId;
    const gameRoom = gameRooms[gameId]
    if (!gameRoom) return
    const response = { "method": "chat", text }
    gameRoom.clients.forEach( (clientId) => clients[clientId].connection.socket.send(JSON.stringify(response)) )
}
function share(message){
    let mediaHandlers = { 'video': shareVideo, 'music': shareMusic  } 
    mediaHandlers[message.type](message)
}
function shareVideo(message) {
    const videoId = message.videoId;
    const gameId = message.gameId;
    const sharedById = message.clientId;
    const gameRoom = gameRooms[gameId]
    if (!gameRoom) return
    const response = { method: "share", type:'video', videoId }
    messageOtherClients(gameRoom, sharedById, JSON.stringify(response))
}
function shareMusic(message) {
    const text = message.text;
    const gameId = message.gameId;
    const gameRoom = gameRooms[gameId]
    if (!gameRoom) return
    const response = { "method": "share", text }
    gameRoom.clients.forEach( (clientId) => clients[clientId].connection.socket.send(JSON.stringify(response)) )
}

function addNewClient(username, ip) {
    const clientId = guid()
    clients[clientId] = { clientId, username, ip }
    return clientId
}
function setClientConnection(clientId, connection) {
    clients[clientId].connection = connection
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
    handleRoomsWebSocket
}
