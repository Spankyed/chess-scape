import fetch  from 'node-fetch';
import HTMLParser from 'node-html-parser';
import utils from './utils.mjs'
const { mapRooms, addNewClient } = utils;

async function getGoogleImage(search){
    // console.time('fetch')
    const url = 'https://www.google.com/search?tbm=isch&q=' + encodeURIComponent(search + ' song')
    let page = await fetch(url)
    // console.timeEnd('fetch')
    let html = await page.text()
    let parsedPage = HTMLParser.parse(html)
    let img = parsedPage.querySelectorAll('img')[1].attributes.src
    return img
}
async function handleSearchHttp(req, reply) {
    const { title } = req.body
    const image = await getGoogleImage(title);
    reply.send(JSON.stringify(image)) // get rooms list
}
function handleRoomsHttp(req, reply) {
    reply.send(JSON.stringify(mapRooms())) // get rooms list
}
function handleUsersHttp(req, reply) {
    const { username } = req.body
    let clientId = addNewClient(username, req.ip)
    let response = JSON.stringify({ action: 'client-added', clientId })
    reply.send(response)
}

export default {
    handleRoomsHttp,
    handleUsersHttp,
    handleSearchHttp
}
