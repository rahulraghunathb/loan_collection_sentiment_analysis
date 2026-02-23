const { validationResult } = require('express-validator')
const { AppError } = require('../../shared/errors')

/**
 * Runs after express-validator chains.
 * Collects all validation errors and throws a structured AppError if any exist.
 * Attach this middleware after your validator arrays in route definitions.
 */
const validate = (req, _res, next) => {
    const result = validationResult(req)
    if (!result.isEmpty()) {
        const fields = result.array().map(e => ({ field: e.path, message: e.msg }))
        throw new AppError('VALIDATION_ERROR', undefined, { fields })
    }
    next()
}

module.exports = validate
