const express = require('express')
const router = express.Router()
const { Op } = require('sequelize')
const db = require('../db/setup')

// GET /api/dashboard/stats — aggregate KPIs
router.get('/stats', async (req, res) => {
    try {
        const totalCalls = await db.Call.count()
        const totalCustomers = await db.Customer.count()
        const analyzedCalls = await db.Call.count({ where: { status: 'analyzed' } })

        // Get all analysis results for stats
        const analyses = await db.AnalysisResult.findAll()

        // Average intent score
        const intentScores = analyses
            .map(a => a.repaymentIntent?.score)
            .filter(s => typeof s === 'number')
        const avgIntentScore = intentScores.length
            ? Math.round(intentScores.reduce((a, b) => a + b, 0) / intentScores.length)
            : 0

        // Average risk score
        const riskScores = analyses.map(a => a.riskScore).filter(s => typeof s === 'number')
        const avgRiskScore = riskScores.length
            ? Math.round(riskScores.reduce((a, b) => a + b, 0) / riskScores.length)
            : 0

        // Outcome distribution
        const outcomeCounts = {}
        analyses.forEach(a => {
            const o = a.outcome || 'unknown'
            outcomeCounts[o] = (outcomeCounts[o] || 0) + 1
        })

        // Compliance flag count
        const totalComplianceFlags = analyses.reduce((sum, a) => {
            return sum + (Array.isArray(a.complianceFlags) ? a.complianceFlags.length : 0)
        }, 0)

        // High severity compliance flags
        const highSeverityFlags = analyses.reduce((sum, a) => {
            if (!Array.isArray(a.complianceFlags)) return sum
            return sum + a.complianceFlags.filter(f => f.severity === 'high').length
        }, 0)

        // Active PTPs (detected = true)
        const activePTPs = analyses.filter(a => a.promiseToPay?.detected).length

        // Broken promises (PTPs where confidence < 50 and there's a follow-up)
        const brokenPromises = analyses.filter(a => {
            const flags = a.crossCallFlags || []
            return flags.some(f => f.field === 'payment_promise')
        }).length

        // Risk distribution
        const riskDistribution = { low: 0, medium: 0, high: 0, critical: 0 }
        const customers = await db.Customer.findAll()
        customers.forEach(c => {
            riskDistribution[c.riskLevel] = (riskDistribution[c.riskLevel] || 0) + 1
        })

        // Recent calls (last 5)
        const recentCalls = await db.Call.findAll({
            include: [
                { model: db.Customer, as: 'customer', attributes: ['name', 'riskLevel'] },
                { model: db.AnalysisResult, as: 'analysis', attributes: ['outcome', 'riskScore', 'repaymentIntent', 'complianceFlags'] },
            ],
            order: [['callDate', 'DESC']],
            limit: 5,
        })

        // Cross-call inconsistencies total
        const totalInconsistencies = analyses.reduce((sum, a) => {
            return sum + (Array.isArray(a.crossCallFlags) ? a.crossCallFlags.length : 0)
        }, 0)

        // Calls over time (group by date)
        const calls = await db.Call.findAll({ attributes: ['callDate'], order: [['callDate', 'ASC']] })
        const callsByDate = {}
        calls.forEach(c => {
            const date = new Date(c.callDate).toISOString().split('T')[0]
            callsByDate[date] = (callsByDate[date] || 0) + 1
        })

        res.json({
            success: true,
            data: {
                kpis: {
                    totalCalls,
                    totalCustomers,
                    analyzedCalls,
                    avgIntentScore,
                    avgRiskScore,
                    totalComplianceFlags,
                    highSeverityFlags,
                    activePTPs,
                    brokenPromises,
                    totalInconsistencies,
                },
                outcomeDistribution: outcomeCounts,
                riskDistribution,
                recentCalls,
                callsByDate,
            },
        })
    } catch (err) {
        console.error('GET /api/dashboard/stats error:', err)
        res.status(500).json({ success: false, error: err.message })
    }
})

module.exports = router
