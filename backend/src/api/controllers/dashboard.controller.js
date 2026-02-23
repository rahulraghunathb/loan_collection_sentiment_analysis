const db = require('../../../db/setup')
const asyncHandler = require('../../shared/asyncHandler')

/**
 * GET /api/v1/dashboard/stats
 * Aggregate KPIs for the collections dashboard.
 */
const getStats = asyncHandler(async (_req, res) => {
    const [totalCalls, totalCustomers, analyzedCalls, analyses, customers] = await Promise.all([
        db.Call.count(),
        db.Customer.count(),
        db.Call.count({ where: { status: 'analyzed' } }),
        db.AnalysisResult.findAll(),
        db.Customer.findAll(),
    ])

    // Intent scores
    const intentScores = analyses
        .map(a => a.repaymentIntent?.score)
        .filter(s => typeof s === 'number')
    const avgIntentScore = intentScores.length
        ? Math.round(intentScores.reduce((a, b) => a + b, 0) / intentScores.length)
        : 0

    // Risk scores
    const riskScores = analyses.map(a => a.riskScore).filter(s => typeof s === 'number')
    const avgRiskScore = riskScores.length
        ? Math.round(riskScores.reduce((a, b) => a + b, 0) / riskScores.length)
        : 0

    // Outcome distribution
    const outcomeDistribution = {}
    analyses.forEach(a => {
        const o = a.outcome || 'unknown'
        outcomeDistribution[o] = (outcomeDistribution[o] || 0) + 1
    })

    // Compliance flags
    const totalComplianceFlags = analyses.reduce((sum, a) => {
        return sum + (Array.isArray(a.complianceFlags) ? a.complianceFlags.length : 0)
    }, 0)
    const highSeverityFlags = analyses.reduce((sum, a) => {
        if (!Array.isArray(a.complianceFlags)) return sum
        return sum + a.complianceFlags.filter(f => f.severity === 'high').length
    }, 0)

    // Promise-to-pay
    const activePTPs = analyses.filter(a => a.promiseToPay?.detected).length
    const brokenPromises = analyses.filter(a => {
        const flags = a.crossCallFlags || []
        return flags.some(f => f.field === 'payment_promise')
    }).length

    // Cross-call inconsistencies
    const totalInconsistencies = analyses.reduce((sum, a) => {
        return sum + (Array.isArray(a.crossCallFlags) ? a.crossCallFlags.length : 0)
    }, 0)

    // Risk distribution across customers
    const riskDistribution = { low: 0, medium: 0, high: 0, critical: 0 }
    customers.forEach(c => {
        riskDistribution[c.riskLevel] = (riskDistribution[c.riskLevel] || 0) + 1
    })

    // Recent calls (last 5)
    const recentCalls = await db.Call.findAll({
        include: [
            { model: db.Customer, as: 'customer', attributes: ['name', 'riskLevel'] },
            {
                model: db.AnalysisResult,
                as: 'analysis',
                attributes: ['outcome', 'riskScore', 'repaymentIntent', 'complianceFlags'],
            },
        ],
        order: [['callDate', 'DESC']],
        limit: 5,
    })

    // Calls grouped by date
    const allCalls = await db.Call.findAll({ attributes: ['callDate'], order: [['callDate', 'ASC']] })
    const callsByDate = {}
    allCalls.forEach(c => {
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
            outcomeDistribution,
            riskDistribution,
            recentCalls,
            callsByDate,
        },
    })
})

module.exports = { getStats }
