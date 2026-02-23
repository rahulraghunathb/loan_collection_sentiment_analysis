/**
 * Domain error codes used across the application.
 * Each code maps to a stable HTTP status and a human-readable message.
 */
const ERROR_CODES = {
    VALIDATION_ERROR:       { status: 400, message: 'Validation failed' },
    BAD_REQUEST:            { status: 400, message: 'Bad request' },
    NOT_FOUND:              { status: 404, message: 'Resource not found' },
    CONFLICT:               { status: 409, message: 'Resource already exists' },
    UNPROCESSABLE:          { status: 422, message: 'Unable to process request' },
    INTERNAL_ERROR:         { status: 500, message: 'Internal server error' },
    ANALYSIS_FAILED:        { status: 500, message: 'AI analysis pipeline failed' },
    TRANSCRIPT_MISSING:     { status: 400, message: 'No transcript segments found for this call' },
    CUSTOMER_NOT_FOUND:     { status: 404, message: 'Customer not found' },
    CALL_NOT_FOUND:         { status: 404, message: 'Call not found' },
    UPLOAD_FAILED:          { status: 500, message: 'File upload failed' },
}

class AppError extends Error {
    /**
     * @param {keyof typeof ERROR_CODES} code
     * @param {string} [detail]   Optional extra context appended to the message
     * @param {object} [meta]     Optional structured metadata included in the response
     */
    constructor(code, detail, meta) {
        const def = ERROR_CODES[code] || ERROR_CODES.INTERNAL_ERROR
        super(detail ? `${def.message}: ${detail}` : def.message)
        this.name = 'AppError'
        this.code = code
        this.status = def.status
        this.meta = meta || null
    }

    toJSON() {
        return {
            success: false,
            error: {
                code: this.code,
                message: this.message,
                ...(this.meta ? { meta: this.meta } : {}),
            },
        }
    }
}

module.exports = { AppError, ERROR_CODES }
