
const myDomain = "*";


function generateError(code, err) {
    return {
        statusCode: code,
        headers: {
            'Access-Control-Allow-Origin': myDomain,
            'Access-Control-Allow-Headers': 'x-requested-with',
            'Access-Control-Allow-Credentials': true
        },
        body: JSON.stringify(err)
    }
}
function generateResponse(code, payload) {
    return {
        statusCode: code,
        headers: {
            'Access-Control-Allow-Origin': myDomain,
            'Access-Control-Allow-Headers': 'x-requested-with',
            'Access-Control-Allow-Credentials': true
        },
        body: JSON.stringify(payload)
    }
}

module.exports = {
    generateError,
    generateResponse
}
