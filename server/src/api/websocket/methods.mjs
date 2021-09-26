// nodemon --inspect ./server.js

import ChessLib  from 'chess.js';
import fileType from 'file-type';
import BSON from 'bson';

const { Chess } = ChessLib;


// function getDate(){
// 	var date = new Date();
// 	return new Date(date.getTime() - (date.getTimezoneOffset() * 60000 ))
//                     .toISOString()
//                     .split("T")[0];
// }

// function instantiateNewEngine(){
//     let engine = new Chess()
//     let headings = {
//         Site: 'Chess-Scape',
//         White: 'Angel (2037)',
//         Black: 'Kathie (1300)',
//         Round: '',
//         Result: "1/2-1/2",
//         Date: getDate(),
//         TimeControl: "1 in 3 days",
//         Termination: "ACEChess won by resignation"
//     }
//     engine.header(Object.entries(headings).reduce((all, single)=>([...all, ...single]),[]))
//     return engine
// }

// function resign({message, clientId}, gameRooms) { 
//     // todo: verify player is actually same color as move made
//     const gameId = message.gameId;
//     const gameRoom = gameRooms[gameId];
//     if (!gameRoom) return   // todo: if gameroom not found send user error message to leave game
//     const match = gameRoom.match
//     if (!match) return  
//     if (match.game_over()){
//         const response = { "method": "endGame", move }
//         gameRoom.clients.forEach( (clientId) => sendMessage(clientId, response) )
//         // socket.emit('gameOver', roomId)
//     }
//     else {
//         const validMove = match.move(message.move)
//         // const move = match.move(message.move, { verbose: true })
//         if(!validMove) return // todo: if not valid move, send game state to sync client, and alert user board was synced
//         const response = { "method": "move", move: validMove, clientId }
//         sendMessageOthers(gameRoom, clientId, response)
//         // gameRoom.clients.forEach( (clientId) => sendMessage(clientId, response) )
//     }
// }


export default function(state){
    let gameRooms = state.gameRooms()
    let clients = state.clients()

    function addNewGameRoom(clientId) {
        const gameId = guid()
        gameRooms[gameId] = {
            "id": gameId,
            // "matchParams": { "color_player_1": 'whites' },
            // "state": {},
            "host": clientId,
            "clients": [clientId],
            // "match": instantiateNewEngine(),
            "match": new Chess(),
            "whitePlayerId":'',
            "blackPlayerId":'',
            "matchStarted": false
        }
        return gameId
    }
    function create({message, clientId}){ // { "method": "create", "clientId" : "<guid>"  }
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
    function join({ message, clientId }) {
		// todo only send to users who are in room==lobby to update their list
		// const {gameId, clientId} = message;
		const { gameId } = message;
		const gameRoom = gameRooms[gameId];
		if (!gameRoom) return;
		// const color =  {"0": "white", "1": "black"}[gameRoom.clients.length]
		if (!gameRoom.clients.includes(clientId))
			gameRoom.clients.push(clientId);
		// else // todo: reject client from joining - security
		if (gameRoom.clients.length === 2) gameRoom.matchStarted = true; // todo: check max players instead of clients
		const response = {
			method: "join",
			gameId,
			clientId,
			matchStarted: gameRoom.matchStarted,
		};
		// todo: notify all clients in lobby a player has joined a gameRoom to update their room list
		gameRoom.clients.forEach((clientId) => sendMessage(clientId, response));
	}
    function leave({message, clientId}){ 
        const {gameId} = message;
        const gameRoom = gameRooms[gameId];
        // if (arr.includes(val)) arr.splice(arr.indexOf(val), 1)
        const response = { "method": "join", clientId, matchStarted: gameRoom.matchStarted }
        // notify all clients that a player has left
        gameRoom.clients.forEach( (clientId) => sendMessage(clientId, response) )
    }
    function move({message, clientId}) { 
        // todo: verify player is actually same color as move made
        const gameId = message.gameId;
        const gameRoom = gameRooms[gameId];
        if (!gameRoom) return   // todo: if gameroom not found send user error message to leave game
        const match = gameRoom.match
        if (!match) return  
        if (match.game_over()){
            const response = { "method": "endGame", move: message.move }
            gameRoom.clients.forEach( (clientId) => sendMessage(clientId, response) )
            // socket.emit('gameOver', roomId)
        }
        else {
            const validMove = match.move(message.move)
            // const move = match.move(message.move, { verbose: true })
            if(!validMove) return // todo: if not valid move, send game state to sync client, and alert user board was synced
            const response = { "method": "move", move: validMove, clientId }
            sendMessageOthers(gameRoom, clientId, response)
            // gameRoom.clients.forEach( (clientId) => sendMessage(clientId, response) )
        }
    }
    function chat({message, clientId}) {
        const {text, gameId} = message;
        const gameRoom = gameRooms[gameId]
        if (!gameRoom) return
        const response = { "method": "chat", text }
        sendMessageOthers(gameRoom, clientId, response)
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
        sendMessageOthers(gameRoom, clientId, response)
    }
    function shareMusic({message, clientId}) { // todo: check if song has image, otherwise scrap google?
        const {gameId, song, rawData} = message;
        const gameRoom = gameRooms[gameId]
        if (!gameRoom) return
        const response = BSON.serialize({ "method": "share", type:'music', song, rawData })
        // sendMessageOthers(gameRoom, clientId, response)
        // gameRoom.clients.forEach( (clientId) => sendMessage(clientId, response) )
        console.log(`%c Sent message [${message.method}] to [${clientId}]`,"color:orange;", {response})
        gameRoom.clients.forEach( (clientId) => {
            clients[clientId].connection.socket.send(response)
        } )
    }
    
    function sendMessage(clientId, message){
        // todo: check if client is still connected before trying to send messages
        clients[clientId].connection.socket.send(JSON.stringify(message))
        console.log(`%c Sent message [${message.method}] to [${clientId}]`,"color:orange;", {message})
    }
    function sendMessageOthers(gameRoom, sender, message){
        gameRoom.clients.forEach(clientId => { 
            if (clientId != sender) sendMessage(clientId, message)
        })
    }
    function sendMessageAll(message, clientId){
        Object.values(clients).forEach( client => {
            const clientConn = client.connection;
            if (clientConn) clientConn.socket.send(JSON.stringify(message));
        })
    }
    function addNewClient(username, ip) {
        const clientId = guid()
        clients[clientId] = { clientId, username, ip }
        return clientId
    }
    function setClientConnection(clientId, connection) {
        clients[clientId] = {...clients[clientId], connection}
    }
    // ___________________________________________________________
    function mapRooms(){
        return Object.values(gameRooms).map( room => {
            const { match, whitePlayerId, blackPlayerId, // omitted properties
                ...roomModel } = room;
            return roomModel
        })
    }
    async function isValidFileType(buffer){
        // fileType.mime === 'image/jpeg'
        // if (stream2.fileType && stream2.fileType.mime === 'image/jpeg') if (stream2.fileType && stream2.fileType.mime === 'image/jpeg') 
        let {mime} = await fileType.fromBuffer(buffer) // todo: test/ensure that audio is on all audio mime types
        return (mime.indexOf('audio') > -1)
    }
    function guid() {
        // use nanoId instead
        return '_' + Math.random().toString(36).substr(2, 9);
    }
    
    return {
        addNewClient, mapRooms, isValidFileType,
        create, join, leave, move, chat, share,
    }

    return {
        handleRoomsHttp,
        handleUsersHttp,
        handleSearchHttp
    }
}

