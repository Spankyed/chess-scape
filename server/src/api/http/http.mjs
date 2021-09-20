import operations from './operations.mjs'
const { getGoogleImage, mapRooms, addNewClient } = operations;

export default function(state){
    let { gameRooms, clients } = state

    async function handleSearchHttp(req, reply) {
        const { title } = req.body
        const image = await getGoogleImage(title);
        reply.send(JSON.stringify(image)) // get rooms list
    }
    function handleRoomsHttp(req, reply) {
        reply.send(JSON.stringify(mapRooms(gameRooms()))) // get rooms list
    }
    function handleUsersHttp({ip, body}, reply) {
        const { username } = body
        let clientId = addNewClient({ username, ip }, clients())
        let response = JSON.stringify({ action: 'client-added', clientId })
        reply.send(response)
    }
    return {
        handleRoomsHttp,
        handleUsersHttp,
        handleSearchHttp
    }
}
