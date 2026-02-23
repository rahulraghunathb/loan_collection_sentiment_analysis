const express = require('express')
const router = express.Router()
const { AVAILABLE_MODELS, DEFAULT_MODEL } = require('../../../../services/openRouterClient')

/**
 * GET /api/v1/models
 * Returns the list of selectable LLM models and which one is the default.
 */
router.get('/', (_req, res) => {
    res.json({
        success: true,
        data: {
            models: AVAILABLE_MODELS,
            default: DEFAULT_MODEL,
        },
    })
})

module.exports = router
