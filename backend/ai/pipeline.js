const { v4: uuidv4 } = require('uuid')
const db = require('../db/setup')
const intentChain = require('./chains/intentChain')
const complianceChain = require('./chains/complianceChain')
const ptpChain = require('./chains/ptpChain')
const crossCallChain = require('./chains/crossCallChain')
const summaryChain = require('./chains/summaryChain')
const { DEFAULT_MODEL } = require('../services/openRouterClient')
const logger = require('../src/shared/logger')

function buildTranscriptText(segments) {
    return segments
        .sort((a, b) => a.startTime - b.startTime)
        .map(s => `[${s.speaker.toUpperCase()}] ${s.text}`)
        .join('\n')
}

async function getHistoricalAnalyses(customerId, excludeCallId) {
    const previousCalls = await db.Call.findAll({
        where: { customerId },
        include: [{ model: db.AnalysisResult, as: 'analysis' }],
        order: [['callDate', 'ASC']],
    })

    return previousCalls
        .filter(c => c.id !== excludeCallId && c.analysis)
        .map(c => ({
            callId: c.id,
            date: c.callDate,
            summary: c.analysis.summary,
            keyPoints: c.analysis.keyPoints,
            outcome: c.analysis.outcome,
        }))
}

/**
 * Run the full analysis pipeline on a call.
 *
 * @param {object} call         Sequelize Call instance with segments loaded
 * @param {object} [options]
 * @param {string} [options.model]  OpenRouter model ID to use for all chains.
 *                                  Defaults to DEFAULT_MODEL if not provided.
 */
async function analyze(call, options = {}) {
    const segments = call.segments || []
    if (!segments.length) {
        throw new Error('No transcript segments to analyze')
    }

    const model = options.model || DEFAULT_MODEL
    const transcriptText = buildTranscriptText(segments)

    logger.info(`AI pipeline started`, { callId: call.id, model })

    // Run independent chains in parallel, all using the same selected model
    const [intent, compliance, ptp, summaryResult] = await Promise.all([
        intentChain.analyze(transcriptText, model),
        complianceChain.analyze(transcriptText, model),
        ptpChain.analyze(transcriptText, model),
        summaryChain.analyze(transcriptText, model),
    ])

    logger.debug('Intent, Compliance, PTP, Summary chains complete', { callId: call.id })

    // Cross-call analysis uses historical context — same model
    const historicalData = await getHistoricalAnalyses(call.customerId, call.id)
    const crossCallFlags = await crossCallChain.analyze(transcriptText, historicalData, model)

    logger.debug('Cross-call analysis complete', { callId: call.id, flagCount: crossCallFlags.length })

    const riskScore = computeRiskScore(intent, compliance, ptp, crossCallFlags)

    const analysisData = {
        id: `ANALYSIS-${uuidv4().slice(0, 8).toUpperCase()}`,
        callId: call.id,
        repaymentIntent: intent,
        complianceFlags: compliance,
        promiseToPay: ptp,
        crossCallFlags,
        outcome: summaryResult.outcome || 'no_commitment',
        summary: summaryResult.summary || '',
        keyPoints: summaryResult.keyPoints || [],
        nextActions: summaryResult.nextActions || [],
        riskFlags: summaryResult.riskFlags || [],
        riskScore,
    }

    const existing = await db.AnalysisResult.findOne({ where: { callId: call.id } })
    let savedResult
    if (existing) {
        await existing.update(analysisData)
        savedResult = existing
    } else {
        savedResult = await db.AnalysisResult.create(analysisData)
    }

    await db.Call.update({ status: 'analyzed' }, { where: { id: call.id } })

    logger.info('AI pipeline complete', { callId: call.id, riskScore, outcome: analysisData.outcome, model })
    return savedResult
}

function computeRiskScore(intent, compliance, ptp, crossCallFlags) {
    let score = 50

    if (intent?.score !== undefined) {
        score += (50 - intent.score) * 0.4
    }

    if (Array.isArray(compliance)) {
        compliance.forEach(f => {
            if (f.severity === 'high') score += 15
            else if (f.severity === 'medium') score += 8
            else score += 3
        })
    }

    if (!ptp?.detected) {
        score += 10
    } else if (ptp.confidence < 30) {
        score += 5
    }

    if (Array.isArray(crossCallFlags)) {
        score += crossCallFlags.length * 5
    }

    return Math.max(0, Math.min(100, Math.round(score)))
}

module.exports = { analyze, buildTranscriptText }
