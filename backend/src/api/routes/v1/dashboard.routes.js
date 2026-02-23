const express = require('express')
const router = express.Router()
const ctrl = require('../../controllers/dashboard.controller')

// GET /api/v1/dashboard/stats
router.get('/stats', ctrl.getStats)

module.exports = router
