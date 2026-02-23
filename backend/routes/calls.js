const express = require('express')
const router = express.Router()
const multer = require('multer')
const path = require('path')
const { v4: uuidv4 } = require('uuid')
const config = require('../config')
const db = require('../db/setup')

// Multer setup for audio uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, config.UPLOAD_DIR),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname)
        cb(null, `call_${Date.now()}${ext}`)
    },
})
const upload = multer({ storage, limits: { fileSize: 100 * 1024 * 1024 } }) // 100MB

// GET /api/calls — list all calls
router.get('/', async (req, res) => {
    try {
        const { customerId, status, outcome, limit = 50, offset = 0 } = req.query
        const where = {}
        if (customerId) where.customerId = customerId
        if (status) where.status = status

        const calls = await db.Call.findAll({
            where,
            include: [
                { model: db.Customer, as: 'customer', attributes: ['name', 'phone', 'loanId', 'riskLevel'] },
                { model: db.AnalysisResult, as: 'analysis', attributes: ['repaymentIntent', 'outcome', 'riskScore', 'summary', 'complianceFlags', 'promiseToPay'] },
            ],
            order: [['callDate', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset),
        })

        // Filter by outcome if provided (outcome is in AnalysisResult)
        let result = calls
        if (outcome) {
            result = calls.filter(c => c.analysis && c.analysis.outcome === outcome)
        }

        res.json({ success: true, data: result, total: result.length })
    } catch (err) {
        console.error('GET /api/calls error:', err)
        res.status(500).json({ success: false, error: err.message })
    }
})

// GET /api/calls/:id — single call with full details
router.get('/:id', async (req, res) => {
    try {
        const call = await db.Call.findByPk(req.params.id, {
            include: [
                { model: db.Customer, as: 'customer' },
                { model: db.TranscriptSegment, as: 'segments', order: [['startTime', 'ASC']] },
                { model: db.AnalysisResult, as: 'analysis' },
            ],
        })

        if (!call) {
            return res.status(404).json({ success: false, error: 'Call not found' })
        }

        res.json({ success: true, data: call })
    } catch (err) {
        console.error('GET /api/calls/:id error:', err)
        res.status(500).json({ success: false, error: err.message })
    }
})

// POST /api/calls/upload — upload audio and create call record
router.post('/upload', upload.single('audio'), async (req, res) => {
    try {
        const { customerId, agentName } = req.body

        if (!customerId) {
            return res.status(400).json({ success: false, error: 'customerId is required' })
        }

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

        // In a real system, this would trigger async STT processing
        // For demo, we'll just return the call record
        res.json({ success: true, data: call, message: 'Call uploaded. Use POST /api/calls/:id/analyze to process.' })
    } catch (err) {
        console.error('POST /api/calls/upload error:', err)
        res.status(500).json({ success: false, error: err.message })
    }
})

// POST /api/calls/:id/analyze — trigger AI analysis
router.post('/:id/analyze', async (req, res) => {
    try {
        const call = await db.Call.findByPk(req.params.id, {
            include: [
                { model: db.TranscriptSegment, as: 'segments', order: [['startTime', 'ASC']] },
            ],
        })

        if (!call) {
            return res.status(404).json({ success: false, error: 'Call not found' })
        }

        if (!call.segments || call.segments.length === 0) {
            return res.status(400).json({ success: false, error: 'No transcript segments found. Upload and transcribe audio first.' })
        }

        // Run AI pipeline
        const pipeline = require('../ai/pipeline')
        const result = await pipeline.analyze(call)

        res.json({ success: true, data: result })
    } catch (err) {
        console.error('POST /api/calls/:id/analyze error:', err)
        res.status(500).json({ success: false, error: err.message })
    }
})

module.exports = router
