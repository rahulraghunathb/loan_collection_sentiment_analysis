const { createLogger, format, transports } = require('winston')
const config = require('../../config')

const { combine, timestamp, errors, json, colorize, printf } = format

const devFormat = combine(
    colorize(),
    timestamp({ format: 'HH:mm:ss' }),
    errors({ stack: true }),
    printf(({ level, message, timestamp: ts, requestId, stack, ...meta }) => {
        const rid = requestId ? ` [${requestId}]` : ''
        const extra = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : ''
        return `${ts}${rid} ${level}: ${stack || message}${extra}`
    })
)

const prodFormat = combine(
    timestamp(),
    errors({ stack: true }),
    json()
)

const logger = createLogger({
    level: config.NODE_ENV === 'production' ? 'info' : 'debug',
    format: config.NODE_ENV === 'production' ? prodFormat : devFormat,
    transports: [new transports.Console()],
    exitOnError: false,
})

/**
 * Returns a child logger bound to a specific request ID.
 * Use this inside request handlers for correlated log lines.
 */
logger.withRequest = (requestId) => logger.child({ requestId })

module.exports = logger
