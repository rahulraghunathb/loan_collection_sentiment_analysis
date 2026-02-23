const logger = require('../../shared/logger')
const { AppError } = require('../../shared/errors')
const config = require('../../../config')

/**
 * Centralised error-handling middleware.
 * Must be registered last in the Express middleware chain.
 *
 * - AppError instances are serialised with their defined HTTP status.
 * - Unexpected errors are logged with a stack trace and returned as 500.
 * - Stack traces are only included in non-production environments.
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
    const log = req.requestId ? logger.withRequest(req.requestId) : logger

    if (err instanceof AppError) {
        log.warn('Application error', {
            code: err.code,
            status: err.status,
            message: err.message,
            path: req.path,
            method: req.method,
        })
        return res.status(err.status).json(err.toJSON())
    }

    // Sequelize validation errors
    if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
        const messages = err.errors?.map(e => e.message) || [err.message]
        log.warn('Database validation error', { messages, path: req.path })
        return res.status(400).json({
            success: false,
            error: { code: 'VALIDATION_ERROR', message: messages.join(', ') },
        })
    }

    // Multer file size error
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
            success: false,
            error: { code: 'BAD_REQUEST', message: 'File size exceeds the allowed limit' },
        })
    }

    log.error('Unhandled error', {
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
        requestId: req.requestId,
    })

    const body = {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
    }
    if (config.NODE_ENV !== 'production') {
        body.error.detail = err.message
        body.error.stack = err.stack
    }

    return res.status(500).json(body)
}

module.exports = errorHandler
