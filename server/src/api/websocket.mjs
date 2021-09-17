import BSON from 'bson';
import utils from './utils.mjs'

const { 
    setClientConnection, isValidFileType,
    create, join, leave, move, chat, share
 } = utils;

function handleRoomsWebSocket(connection, req) {
    let clientId = req.headers['sec-websocket-protocol']
    if (clientId) setClientConnection(clientId, connection)
    let response = { method: 'connect', clientId }
	connection.socket.send(JSON.stringify(response))
    // todo: notify lobby player has joined a gameroom
    // console.log('client connected', {client:clients[clientId]})
    connection.socket.on('message', request => { // handle incoming messages from connected client 
		// console.log('incoming request ', request)
        let isBinary = Buffer.isBuffer(request)
        let message = isBinary ? BSON.deserialize(request, {promoteBuffers: true}) : JSON.parse(request)
        if (!message) return
        if(isBinary && !isValidFileType(message.rawData)) return
        // if (isBinary) console.log("bson", message)
        console.log(`%c Incoming message [${message.method}] from [${clientId}]`,"color:green;", message)
        const methods = { create, join, move, chat, share} // set message handlers
        const messageHandler = methods[message.method]
        if (messageHandler) messageHandler({message, clientId})
	})
    // connection.socket.on('open', _ => console.log('~opened: ', i++))
    // connection.socket.on('close', _ => delete clients[clientId])
}

export default {
    handleRoomsWebSocket
}
