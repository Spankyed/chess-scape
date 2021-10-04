const Response = require('../common/HTTP_Responses')

exports.handler = async event => {
    console.log('defaulted', event)
    return Response._200({ message: 'default' })
}