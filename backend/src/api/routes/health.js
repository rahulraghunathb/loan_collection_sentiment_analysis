const express = require('express')
const router = express.Router()
const db = require('../../../db/setup')
const config = require('../../../config')

const startTime = Date.now()

/**
 * GET /health/live
 * Liveness probe — confirms the process is running.
 * Returns 200 immediately; no dependency checks.
 */
router.get('/live', (_req, res) => {
    res.json({ status: 'ok', uptime: Math.floor((Date.now() - startTime) / 1000) })
})

/**
 * GET /health/ready
 * Readiness probe — confirms the app can serve traffic.
 * Checks database connectivity before returning 200.
 * Also exposes safe runtime flags (demoMode, env) for the frontend.
 */
router.get('/ready', async (_req, res) => {
    try {
        await db.sequelize.authenticate()
        res.json({
            status: 'ok',
            checks: { database: 'ok' },
            uptime: Math.floor((Date.now() - startTime) / 1000),
            app: {
                demoMode: config.DEMO_MODE,
                env: config.NODE_ENV,
            },
        })
    } catch (err) {
        res.status(503).json({
            status: 'degraded',
            checks: { database: `error: ${err.message}` },
            app: {
                demoMode: config.DEMO_MODE,
                env: config.NODE_ENV,
            },
        })
    }
})

module.exports = router
