const express = require('express')
const router = express.Router()
const ctrl = require('../../controllers/calls.controller')
const { listCallsValidator, getCallValidator, uploadCallValidator, analyzeCallValidator } = require('../../validators/calls.validators')
const validate = require('../../middlewares/validate')
const { uploadLimiter, analysisLimiter } = require('../../middlewares/rateLimiter')

// GET /api/v1/calls
router.get('/', listCallsValidator, validate, ctrl.listCalls)

// GET /api/v1/calls/:id
router.get('/:id', getCallValidator, validate, ctrl.getCall)

// POST /api/v1/calls/upload
router.post(
    '/upload',
    uploadLimiter,
    ctrl.upload.single('audio'),
    uploadCallValidator,
    validate,
    ctrl.uploadCall
)

// POST /api/v1/calls/:id/transcribe
router.post('/:id/transcribe', getCallValidator, validate, ctrl.transcribeCall)

// POST /api/v1/calls/:id/analyze
router.post('/:id/analyze', analysisLimiter, analyzeCallValidator, validate, ctrl.analyzeCall)

module.exports = router
