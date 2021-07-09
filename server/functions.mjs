import ChessLib  from 'chess.js';
const { Chess } = ChessLib;

const clients = {};
const gameRooms = {};

function handleRoomWebSocket(connection /* SocketStream */, req /* FastifyRequest */) {
    // connection.socket.on('open', _ => console.log('~opened!'))
    // connection.socket.on('close', _ => console.log('~closed!'))
	connection.socket.on('message', request => { // handle incoming messages from connected client 
		// console.log('incoming request', request)
		const message = JSON.parse(request)
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
        "clients": [{ clientId, isPlayer: true }],
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
    const clientId = message.clientId;
    // const matchParams = message.matchParams;
    const gameId = generateNewGameRoom(clientId)
    const response = {
        "method": "create",
        "gameId" : gameId
    }
    const clientConn = clients[clientId].connection;
    if (clientConn) clientConn.socket.send(JSON.stringify(response));
}

function join(message){ //a client want to join
    const clientId = message.clientId;
    const gameId = message.gameId;
    const gameRoom = gameRooms[gameId];
    if (gameRoom.clients.length >= 2) return; // max players reached
    // const color =  {"0": "white", "1": "black"}[gameRoom.clients.length]
    gameRoom.clients.push({ clientId, isPlayer: true })
    if (gameRoom.clients.length === 2) gameRoom.matchStarted = true; // start the game
    const response = { "method": "join", clientId, matchStarted: gameRoom.matchStarted }
    // notify all clients new client has joined
    gameRoom.clients.forEach( ({clientId}) => clients[clientId].connection.socket.send(JSON.stringify(response)) )
}

function move(message) { // a user plays
    const gameId = message.gameId;
    const match = gameRooms[gameId].match
    if (!match || match.game_over()) return
    const move = match.move(message.move, { verbose: true })
    // todo: if not valid move, send game state to sync client
    const response = { "method": "move", move }
    gameRoom.clients.forEach( ({clientId}) => clients[clientId].connection.socket.send(JSON.stringify(response)) )
}

function chat(message) {
    const text = message.text;
    const gameId = message.gameId;
    const gameRoom = gameRooms[gameId]
    if (!gameRoom) return
    const response = { "method": "chat", text }
    gameRoom.clients.forEach( ({clientId}) => clients[clientId].connection.socket.send(JSON.stringify(response)) )
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
    handleRoomWebSocket,
    getGameRooms,
    getClients
}
