const { AppError } = require('../../shared/errors')

/**
 * Catch-all for unmatched API routes.
 * Must be registered after all route definitions but before errorHandler.
 */
const notFound = (req, _res, next) => {
    next(new AppError('NOT_FOUND', `Route ${req.method} ${req.path} does not exist`))
}

module.exports = notFound
