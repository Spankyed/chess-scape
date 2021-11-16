const Response = require('../common/HTTP_Responses')
const message = require("./message");
// const { parseMessage } = require("./methods/share/music");

exports.handler = async event => {
    console.log('defaulted', event)
    message.handler(event);
    return Response._200({ message: 'default' })
}