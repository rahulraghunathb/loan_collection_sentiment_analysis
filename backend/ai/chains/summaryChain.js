const fs = require('fs')
const path = require('path')
const { callModel } = require('../../services/openRouterClient')

const SYSTEM_PROMPT = fs.readFileSync(path.join(__dirname, '..', 'prompts', 'summary.txt'), 'utf-8')

function demoAnalyze(transcript) {
    const text = transcript.toLowerCase()

    let outcome = 'no_commitment'
    if (text.includes('i will pay') || text.includes('promise')) outcome = 'payment_committed'
    else if (text.includes('try') || text.includes('maybe')) outcome = 'partial_commitment'
    else if (text.includes('dispute') || text.includes('court')) outcome = 'dispute_raised'
    else if (text.includes('escalat') || text.includes('legal')) outcome = 'escalation_required'

    return {
        summary: 'Collection call completed. Borrower engagement analyzed.',
        keyPoints: ['Call conducted with borrower', 'Payment discussed', 'Follow-up required'],
        nextActions: ['Schedule follow-up call', 'Update account status'],
        riskFlags: text.includes('cannot') || text.includes('refuse') ? ['Non-cooperative borrower'] : [],
        outcome,
    }
}

/**
 * @param {string} transcriptText
 * @param {string} model  OpenRouter model ID
 */
async function analyze(transcriptText, model) {
    const result = await callModel(model, SYSTEM_PROMPT, transcriptText)
    if (result) return result
    return demoAnalyze(transcriptText)
}

module.exports = { analyze }
