/**
 * Wraps an async Express route handler and forwards any thrown error
 * to the next() error-handling middleware, eliminating try/catch boilerplate.
 *
 * @param {Function} fn  Async (req, res, next) handler
 * @returns {Function}   Express-compatible route handler
 */
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next)
}

module.exports = asyncHandler
