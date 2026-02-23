const express = require('express')
const path = require('path')
const fs = require('fs')
const helmet = require('helmet')
const cors = require('cors')
const morgan = require('morgan')

const config = require('../config')
const logger = require('./shared/logger')
const requestId = require('./api/middlewares/requestId')
const { apiLimiter } = require('./api/middlewares/rateLimiter')
const notFound = require('./api/middlewares/notFound')
const errorHandler = require('./api/middlewares/errorHandler')

function createApp() {
    const app = express()

    // ── Security headers ───────────────────────────────────────────────────
    app.use(helmet({
        // Allow inline scripts/styles for the vanilla JS frontend
        contentSecurityPolicy: false,
    }))

    // ── CORS ───────────────────────────────────────────────────────────────
    const corsOptions = config.CORS_ORIGINS.length > 0
        ? {
            origin: config.CORS_ORIGINS,
            methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
            credentials: true,
        }
        : { origin: true } // dev: allow all

    app.use(cors(corsOptions))

    // ── Request ID ─────────────────────────────────────────────────────────
    app.use(requestId)

    // ── HTTP access logging ────────────────────────────────────────────────
    const morganFormat = config.NODE_ENV === 'production' ? 'combined' : 'dev'
    app.use(morgan(morganFormat, {
        stream: { write: (msg) => logger.http(msg.trim()) },
        skip: (req) => req.path.startsWith('/health'),
    }))

    // ── Body parsers ───────────────────────────────────────────────────────
    app.use(express.json({ limit: '10mb' }))
    app.use(express.urlencoded({ extended: true, limit: '10mb' }))

    // ── Static: uploads ────────────────────────────────────────────────────
    const uploadDir = config.UPLOAD_DIR
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })
    app.use('/uploads', express.static(uploadDir))

    // ── Static: frontend ───────────────────────────────────────────────────
    const frontendDir = path.join(__dirname, '..', '..', 'frontend')
    app.use(express.static(frontendDir))

    // ── Health probes (no rate limiting) ──────────────────────────────────
    app.use('/health', require('./api/routes/health'))

    // ── Versioned API (rate-limited) ───────────────────────────────────────
    app.use('/api/v1', apiLimiter, require('./api/routes/v1'))

    // ── Legacy API aliases (backward compat with existing frontend) ────────
    app.use('/api/calls', apiLimiter, require('./api/routes/v1/calls.routes'))
    app.use('/api/customers', apiLimiter, require('./api/routes/v1/customers.routes'))
    app.use('/api/dashboard', apiLimiter, require('./api/routes/v1/dashboard.routes'))
    app.use('/api/models', apiLimiter, require('./api/routes/v1/models.routes'))

    // ── SPA fallback ───────────────────────────────────────────────────────
    app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api') || req.path.startsWith('/health')) return next()
        res.sendFile(path.join(frontendDir, 'index.html'))
    })

    // ── 404 for unmatched API routes ───────────────────────────────────────
    app.use('/api', notFound)

    // ── Global error handler (must be last) ───────────────────────────────
    app.use(errorHandler)

    return app
}

module.exports = createApp
