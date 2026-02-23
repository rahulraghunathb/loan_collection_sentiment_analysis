const { v4: uuidv4 } = require('uuid')

/**
 * Assigns a unique request ID to every incoming request.
 * Reads X-Request-ID from the client if present, otherwise generates one.
 * The ID is attached to req.requestId and echoed back in the response header.
 */
const requestId = (req, res, next) => {
    req.requestId = req.headers['x-request-id'] || uuidv4()
    res.setHeader('X-Request-ID', req.requestId)
    next()
}

module.exports = requestId
