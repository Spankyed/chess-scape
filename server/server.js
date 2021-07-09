'use strict'
// require('dotenv').config()
// let cfenv = require('cfenv')
import fastify from 'fastify'
import fastifyWebsocket from 'fastify-websocket'
import functions from './functions.mjs'

let server = fastify()
server.register(fastifyWebsocket,{ options: { clientTracking: true }})
// fastify.register(require('fastify-sensible'))

// server.websocketServer.clients.forEach((client)=>{
//   if(client.readyState == 1){ 
//     console.log('client',client)
//     // check client id, and only send move to opponent
//     client.send()
//   }
// })

const {    
    handleRoomWebSocket,
    getGameRooms,
    getClients
} = functions


server.get('/room', { websocket: true }, handleRoomWebSocket)

const port = 5000
server.listen(port, err => {
	console.log('server listening on dort', port)
	if (err) {
		console.log(err)
		server.log.error(err)
		process.exit(1)
	}
})

// module.exports = fastify


