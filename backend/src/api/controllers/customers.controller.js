const db = require('../../../db/setup')
const asyncHandler = require('../../shared/asyncHandler')
const { AppError } = require('../../shared/errors')

/**
 * GET /api/v1/customers
 * List all customers enriched with their latest call outcome and intent score.
 */
const listCustomers = asyncHandler(async (req, res) => {
    const { riskLevel } = req.query
    const where = {}
    if (riskLevel) where.riskLevel = riskLevel

    const customers = await db.Customer.findAll({
        where,
        order: [['daysPastDue', 'DESC']],
    })

    const enriched = await Promise.all(customers.map(async (cust) => {
        const latestCall = await db.Call.findOne({
            where: { customerId: cust.id },
            include: [{
                model: db.AnalysisResult,
                as: 'analysis',
                attributes: ['outcome', 'riskScore', 'repaymentIntent'],
            }],
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
})

/**
 * GET /api/v1/customers/:id/timeline
 * Full chronological call history for a customer with intent/risk trends
 * and cross-call inconsistency flags.
 */
const getCustomerTimeline = asyncHandler(async (req, res) => {
    const customer = await db.Customer.findByPk(req.params.id)
    if (!customer) throw new AppError('CUSTOMER_NOT_FOUND')

    const calls = await db.Call.findAll({
        where: { customerId: req.params.id },
        include: [
            { model: db.AnalysisResult, as: 'analysis' },
            {
                model: db.TranscriptSegment,
                as: 'segments',
                attributes: ['speaker', 'text', 'startTime', 'endTime'],
            },
        ],
        order: [['callDate', 'ASC']],
    })

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

    const crossCallFlags = calls.reduce((acc, c) => {
        if (c.analysis?.crossCallFlags?.length) {
            acc.push(...c.analysis.crossCallFlags.map(f => ({
                ...f,
                detectedInCall: c.id,
                date: c.callDate,
            })))
        }
        return acc
    }, [])

    const complianceFlags = calls.reduce((acc, c) => {
        if (c.analysis?.complianceFlags?.length) {
            acc.push(...c.analysis.complianceFlags.map(f => ({
                ...f,
                callId: c.id,
                date: c.callDate,
            })))
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
            crossCallFlags,
            complianceFlags,
        },
    })
})

/**
 * POST /api/v1/customers
 * Create a new customer record.
 */
const createCustomer = asyncHandler(async (req, res) => {
    const { name, phone, loanId, loanAmount, outstandingAmount, riskLevel, daysPastDue } = req.body

    const existing = await db.Customer.findOne({ where: { loanId } })
    if (existing) throw new AppError('CONFLICT', `Loan ID ${loanId} already exists`)

    const { v4: uuidv4 } = require('uuid')
    const customer = await db.Customer.create({
        id: `CUST-${uuidv4().slice(0, 8).toUpperCase()}`,
        name,
        phone,
        loanId,
        loanAmount: loanAmount || 0,
        outstandingAmount: outstandingAmount || 0,
        riskLevel: riskLevel || 'medium',
        daysPastDue: daysPastDue || 0,
        totalCalls: 0,
    })

    res.status(201).json({ success: true, data: customer })
})

module.exports = { listCustomers, getCustomerTimeline, createCustomer }
