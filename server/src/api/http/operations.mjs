import fetch  from 'node-fetch';
import HTMLParser from 'node-html-parser';

function mapRooms(gameRooms){
    return Object.values(gameRooms).map( room => {
        const { match, whitePlayerId, blackPlayerId, // omitted properties
            ...roomModel } = room;
        return roomModel
    })
}
function addNewClient({ username, ip }, clients) {
    const clientId = guid()
    clients[clientId] = { clientId, username, ip }
    return clientId
}

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

export default {
    addNewClient, mapRooms, getGoogleImage
}
