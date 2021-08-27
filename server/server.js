'use strict'
// require('dotenv').config()
// let cfenv = require('cfenv')
import fastify from 'fastify'
import fastifyCors from 'fastify-cors'
import fastifyWebsocket from 'fastify-websocket'
import functions from './functions.mjs'
const {    
	handleUsersHttp,
	handleRoomsHttp,
	handleSearchHttp,
	handleRoomsWebSocket
} = functions

let server = fastify()
// fastify.register(require('fastify-sensible'))
server.register(fastifyCors, { origin: '*' })
server.register(fastifyWebsocket,{ options: {
	// verifyClient: _=>{}, 
	clientTracking: true, 
	// maxPayload: 128 * 1024 * 1024, // 128 MB
}})
server.post('/api/user', handleUsersHttp)
server.post('/api/search', handleSearchHttp)
server.route({ 
	method: 'GET', 
	// prefix: '/api',
	url: '/api/rooms',
	handler: handleRoomsHttp,
	wsHandler: handleRoomsWebSocket
})

const port = 5000
server.listen(port, '0.0.0.0', err => {
	console.log('server listening on port', port)
	if (err) {
		console.log(err)
		server.log.error(err)
		process.exit(1) // remove this line in production
	}
})

// module.exports = fastify


