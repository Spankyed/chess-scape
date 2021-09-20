import BSON from 'bson';
import methods from './methods.mjs'

export default function(state){
    let { clients } = state
    const {  
        isValidFileType, // move these two fns out of methods
        create, join, leave, move, chat, share
     } = methods(state);
    
    const parseMessage = (request) => {
        let isBinary = Buffer.isBuffer(request)
        let message = isBinary ? BSON.deserialize(request, {  promoteBuffers: true }) : JSON.parse(request)
        if (!message) return null // todo: response_400
        if (isBinary && !isValidFileType(message.rawData)) return null
        return message
    }
    function setClientConnection(clientId, connection) {
        clients()[clientId] = {...clients()[clientId], connection}
    }
    function handleRoomsWebSocket(connection, req) {
        let clientId = req.headers['sec-websocket-protocol']
        if (clientId) setClientConnection(clientId, connection)
        let response = { method: 'connect', clientId }
        connection.socket.send(JSON.stringify(response))
        // todo: notify lobby player has joined a gameroom
        // console.log('client connected', {client:clients[clientId]})
        connection.socket.on('message', request => { // handle incoming messages from connected client 
            // console.log('incoming request ', request)
            let message = parseMessage(request)
            if (!message) return
            // if (isBinary) console.log("bson", message)
            console.log(`%c Incoming message [${message.method}] from [${clientId}]`,"color:green;", message)
            const methods = { create, join, move, chat, share} // set message handlers
            const messageHandler = methods[message.method]
            if (messageHandler) messageHandler({message, clientId})
        })
        // connection.socket.on('open', _ => console.log('~opened: ', i++))
        // connection.socket.on('close', _ => delete clients[clientId])
    }
    return {
        handleRoomsWebSocket
    }
}
