const rateLimit = require('express-rate-limit')

/**
 * General API rate limiter — applied to all /api routes.
 * 200 requests per IP per 15-minute window.
 */
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        error: { code: 'RATE_LIMITED', message: 'Too many requests, please try again later' },
    },
})

/**
 * Stricter limiter for the upload endpoint.
 * 20 uploads per IP per 15-minute window.
 */
const uploadLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        error: { code: 'RATE_LIMITED', message: 'Upload rate limit exceeded, please wait before uploading again' },
    },
})

/**
 * Stricter limiter for the AI analysis endpoint.
 * 30 analysis requests per IP per 15-minute window.
 */
const analysisLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        error: { code: 'RATE_LIMITED', message: 'Analysis rate limit exceeded, please wait before retrying' },
    },
})

module.exports = { apiLimiter, uploadLimiter, analysisLimiter }
