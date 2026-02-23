const express = require('express')
const router = express.Router()
const db = require('../db/setup')

// GET /api/customers — list all customers
router.get('/', async (req, res) => {
    try {
        const { riskLevel } = req.query
        const where = {}
        if (riskLevel) where.riskLevel = riskLevel

        const customers = await db.Customer.findAll({
            where,
            order: [['daysPastDue', 'DESC']],
        })

        // Enrich with latest call info
        const enriched = await Promise.all(customers.map(async (cust) => {
            const latestCall = await db.Call.findOne({
                where: { customerId: cust.id },
                include: [{ model: db.AnalysisResult, as: 'analysis', attributes: ['outcome', 'riskScore', 'repaymentIntent'] }],
                order: [['callDate', 'DESC']],
            })
            return {
                ...cust.toJSON(),
                latestCall: latestCall ? {
                    id: latestCall.id,
                    callDate: latestCall.callDate,
                    outcome: latestCall.analysis?.outcome,
                    riskScore: latestCall.analysis?.riskScore,
                    intentScore: latestCall.analysis?.repaymentIntent?.score,
                } : null,
            }
        }))

        res.json({ success: true, data: enriched })
    } catch (err) {
        console.error('GET /api/customers error:', err)
        res.status(500).json({ success: false, error: err.message })
    }
})

// GET /api/customers/:id/timeline — cross-call history
router.get('/:id/timeline', async (req, res) => {
    try {
        const customer = await db.Customer.findByPk(req.params.id)
        if (!customer) {
            return res.status(404).json({ success: false, error: 'Customer not found' })
        }

        const calls = await db.Call.findAll({
            where: { customerId: req.params.id },
            include: [
                { model: db.AnalysisResult, as: 'analysis' },
                { model: db.TranscriptSegment, as: 'segments', attributes: ['speaker', 'text', 'startTime', 'endTime'] },
            ],
            order: [['callDate', 'ASC']],
        })

        // Build trend data
        const intentTrend = calls.map(c => ({
            date: c.callDate,
            score: c.analysis?.repaymentIntent?.score || 0,
            level: c.analysis?.repaymentIntent?.level || 'none',
        }))

        const commitmentHistory = calls.map(c => ({
            date: c.callDate,
            callId: c.id,
            promiseToPay: c.analysis?.promiseToPay || {},
            outcome: c.analysis?.outcome,
        }))

        const riskTrajectory = calls.map(c => ({
            date: c.callDate,
            riskScore: c.analysis?.riskScore || 50,
        }))

        const allCrossCallFlags = calls.reduce((acc, c) => {
            if (c.analysis?.crossCallFlags?.length) {
                acc.push(...c.analysis.crossCallFlags.map(f => ({ ...f, detectedInCall: c.id, date: c.callDate })))
            }
            return acc
        }, [])

        const allComplianceFlags = calls.reduce((acc, c) => {
            if (c.analysis?.complianceFlags?.length) {
                acc.push(...c.analysis.complianceFlags.map(f => ({ ...f, callId: c.id, date: c.callDate })))
            }
            return acc
        }, [])

        res.json({
            success: true,
            data: {
                customer,
                calls,
                trends: {
                    intent: intentTrend,
                    commitments: commitmentHistory,
                    risk: riskTrajectory,
                },
                crossCallFlags: allCrossCallFlags,
                complianceFlags: allComplianceFlags,
            },
        })
    } catch (err) {
        console.error('GET /api/customers/:id/timeline error:', err)
        res.status(500).json({ success: false, error: err.message })
    }
})

module.exports = router
