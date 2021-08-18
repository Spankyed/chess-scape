'use strict'
// require('dotenv').config()
// let cfenv = require('cfenv')
import fastify from 'fastify'
import fastifyCors from 'fastify-cors'
import fastifyCookie from 'fastify-cookie'
import fastifyWebsocket from 'fastify-websocket'
import functions from './functions.mjs'

let server = fastify()

// fastify.register(require('fastify-sensible'))
server.register(fastifyCors, { origin: '*' })
server.register(fastifyWebsocket,{ options: {
	// verifyClient: _=>{}, 
	clientTracking: true, 
	// maxPayload: 1048576 
	// maxPayload: 128 * 1024, // 128 KB
}})
server.register(fastifyCookie, {
	secret: "my-secret", // for cookies signature
	parseOptions: {}     // options for parsing cookies
})


const {    
	handleUsersHttp,
	handleRoomsHttp,
	handleSearchHttp,
	handleRoomsWebSocket
} = functions


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


