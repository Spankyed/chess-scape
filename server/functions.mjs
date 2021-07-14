import ChessLib  from 'chess.js';
const { Chess } = ChessLib;

const clients = {};
const gameRooms = {};

function mapRooms(){
    return Object.values(gameRooms).map( room => {
        const { match, whitePlayerId, blackPlayerId, // omitted properties
            ...roomModel } = room;
        return roomModel
    })
}

function handleRoomsHttp(req, reply) {
    reply.send(JSON.stringify(mapRooms()))
}

function handleRoomWebSocket(connection /* SocketStream */, req /* FastifyRequest */) {
    // connection.socket.on('open', _ => console.log('~opened!'))
    // connection.socket.on('close', _ => console.log('~closed!'))
	connection.socket.on('message', request => { // handle incoming messages from connected client 
		console.log('incoming requests', request)
		const message = JSON.parse(request)
		console.log('incoming message', message)
		// const message = request
        if (!message) return
		// console.log('message', message)
        const methods = { create, join, move, chat }
        const messageHandler = methods[message.method]
        if (messageHandler) messageHandler(message)
	})
	const clientId = generateNewClient(connection)
	const response = { method: 'connect', clientId }
	connection.socket.send(JSON.stringify(response))
}

function generateNewClient(connection) {
    const clientId = guid()
    clients[clientId] = { clientId, connection }
    return clientId
}

function generateNewGameRoom(clientId) {
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
    const gameId = generateNewGameRoom(clientId)
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
    if (gameRoom.clients.length >= 2) return; // max players reached
    // const color =  {"0": "white", "1": "black"}[gameRoom.clients.length]
    gameRoom.clients.push(clientId)
    if (gameRoom.clients.length === 2) gameRoom.matchStarted = true; // start the game
    const response = { "method": "join", clientId, matchStarted: gameRoom.matchStarted }
    // notify all clients new client has joined
    gameRoom.clients.forEach( (clientId) => clients[clientId].connection.socket.send(JSON.stringify(response)) )
}

function leave(message){ //a client want to leave
    const clientId = message.clientId;
    const gameId = message.gameId;
    const gameRoom = gameRooms[gameId];

    arr.includes(val) && arr.splice(arr.indexOf(val), 1)

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
        socket.emit('gameOver', roomId)
    }
    else {
        const move = match.move(message.move)
        // const move = match.move(message.move, { verbose: true })
        // todo: if not valid move, send game state to sync client
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

function getGameRooms() { return gameRooms }

function getClients() { return clients }

function guid() {
	// Math.random should be unique because of its seeding algorithm.
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
    handleRoomWebSocket,
    getGameRooms,
    getClients
}
