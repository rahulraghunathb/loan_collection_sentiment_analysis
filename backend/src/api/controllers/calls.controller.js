const path = require('path')
const multer = require('multer')
const { v4: uuidv4 } = require('uuid')
const config = require('../../../config')
const db = require('../../../db/setup')
const asyncHandler = require('../../shared/asyncHandler')
const { AppError } = require('../../shared/errors')
const logger = require('../../shared/logger')

// ── Multer storage ──────────────────────────────────────────────────────────

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, config.UPLOAD_DIR),
    filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase()
        cb(null, `call_${Date.now()}_${uuidv4().slice(0, 6)}${ext}`)
    },
})

const ALLOWED_AUDIO_TYPES = ['audio/wav', 'audio/mpeg', 'audio/mp4', 'audio/ogg', 'audio/webm', 'audio/x-m4a']

const upload = multer({
    storage,
    limits: { fileSize: 100 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        if (ALLOWED_AUDIO_TYPES.includes(file.mimetype)) {
            cb(null, true)
        } else {
            cb(new AppError('BAD_REQUEST', `Unsupported audio type: ${file.mimetype}`))
        }
    },
})

// ── Controller methods ──────────────────────────────────────────────────────

/**
 * GET /api/v1/calls
 * List calls with optional filters and pagination.
 */
const listCalls = asyncHandler(async (req, res) => {
    const { customerId, status, outcome, limit = 50, offset = 0 } = req.query
    const where = {}
    if (customerId) where.customerId = customerId
    if (status) where.status = status

    const calls = await db.Call.findAll({
        where,
        include: [
            {
                model: db.Customer,
                as: 'customer',
                attributes: ['name', 'phone', 'loanId', 'riskLevel'],
            },
            {
                model: db.AnalysisResult,
                as: 'analysis',
                attributes: ['repaymentIntent', 'outcome', 'riskScore', 'summary', 'complianceFlags', 'promiseToPay'],
            },
        ],
        order: [['callDate', 'DESC']],
        limit: parseInt(limit, 10),
        offset: parseInt(offset, 10),
    })

    const data = outcome
        ? calls.filter(c => c.analysis && c.analysis.outcome === outcome)
        : calls

    res.json({ success: true, data, total: data.length })
})

/**
 * GET /api/v1/calls/:id
 * Single call with full transcript and analysis.
 */
const getCall = asyncHandler(async (req, res) => {
    const call = await db.Call.findByPk(req.params.id, {
        include: [
            { model: db.Customer, as: 'customer' },
            { model: db.TranscriptSegment, as: 'segments', order: [['startTime', 'ASC']] },
            { model: db.AnalysisResult, as: 'analysis' },
        ],
    })

    if (!call) throw new AppError('CALL_NOT_FOUND')
    res.json({ success: true, data: call })
})

/**
 * POST /api/v1/calls/upload
 * Upload an audio file and create a pending call record.
 * The multer middleware is exported separately so it can be applied in the route.
 */
const uploadCall = asyncHandler(async (req, res) => {
    const { customerId, agentName } = req.body
    const log = logger.withRequest(req.requestId)

    const customer = await db.Customer.findByPk(customerId)
    if (!customer) throw new AppError('CUSTOMER_NOT_FOUND', `id=${customerId}`)

    const callId = `CALL-${uuidv4().slice(0, 8).toUpperCase()}`
    const audioUrl = req.file ? `/uploads/${req.file.filename}` : null

    const call = await db.Call.create({
        id: callId,
        customerId,
        audioUrl,
        agentName: agentName || 'Unknown Agent',
        callDate: new Date(),
        status: 'pending',
        duration: 0,
    })

    log.info('Call uploaded', { callId, customerId, hasAudio: !!req.file })
    res.status(201).json({
        success: true,
        data: call,
        message: 'Call uploaded. Use POST /api/v1/calls/:id/analyze to process.',
    })
})

/**
 * POST /api/v1/calls/:id/transcribe
 * Run STT on the uploaded audio and store transcript segments.
 */
const transcribeCall = asyncHandler(async (req, res) => {
    const log = logger.withRequest(req.requestId)

    const call = await db.Call.findByPk(req.params.id)
    if (!call) throw new AppError('CALL_NOT_FOUND')

    if (call.status === 'analyzed') {
        return res.json({ success: true, message: 'Call already analyzed', data: call })
    }

    const sttService = require('../../../services/sttService')
    const audioPath = call.audioUrl
        ? require('path').join(config.UPLOAD_DIR, require('path').basename(call.audioUrl))
        : null

    const segments = await sttService.transcribe(audioPath)

    // Upsert transcript segments
    await db.TranscriptSegment.destroy({ where: { callId: call.id } })
    for (let i = 0; i < segments.length; i++) {
        const seg = segments[i]
        await db.TranscriptSegment.create({
            id: `${call.id}-SEG-${String(i + 1).padStart(3, '0')}`,
            callId: call.id,
            speaker: seg.speaker,
            startTime: seg.startTime ?? seg.start ?? 0,
            endTime: seg.endTime ?? seg.end ?? 0,
            text: seg.text,
        })
    }

    await call.update({ status: 'transcribed' })
    log.info('Call transcribed', { callId: call.id, segmentCount: segments.length })

    res.json({ success: true, message: `Transcribed ${segments.length} segments`, data: { callId: call.id, segmentCount: segments.length } })
})

/**
 * POST /api/v1/calls/:id/analyze
 * Run the full AI analysis pipeline on a transcribed call.
 *
 * Body (optional):
 *   { "model": "qwen/qwen3-235b-a22b" }
 *
 * If model is omitted the pipeline uses the configured DEFAULT_MODEL.
 */
const analyzeCall = asyncHandler(async (req, res) => {
    const log = logger.withRequest(req.requestId)
    const { AVAILABLE_MODELS, DEFAULT_MODEL } = require('../../../services/openRouterClient')

    // Validate model if provided
    const requestedModel = req.body?.model
    if (requestedModel) {
        const valid = AVAILABLE_MODELS.some(m => m.id === requestedModel)
        if (!valid) {
            throw new AppError('VALIDATION_ERROR', `Unknown model "${requestedModel}". Valid options: ${AVAILABLE_MODELS.map(m => m.id).join(', ')}`)
        }
    }
    const model = requestedModel || DEFAULT_MODEL

    const call = await db.Call.findByPk(req.params.id, {
        include: [{ model: db.TranscriptSegment, as: 'segments', order: [['startTime', 'ASC']] }],
    })

    if (!call) throw new AppError('CALL_NOT_FOUND')

    if (!call.segments || call.segments.length === 0) {
        throw new AppError('TRANSCRIPT_MISSING')
    }

    log.info('Starting AI analysis', { callId: call.id, segmentCount: call.segments.length, model })

    const pipeline = require('../../../ai/pipeline')
    const result = await pipeline.analyze(call, { model })

    log.info('AI analysis complete', { callId: call.id, riskScore: result.riskScore, outcome: result.outcome, model })
    res.json({ success: true, data: result, meta: { model } })
})

module.exports = { listCalls, getCall, uploadCall, transcribeCall, analyzeCall, upload }
