const fs = require('fs')
const path = require('path')
const { callModel } = require('../../services/openRouterClient')

const SYSTEM_PROMPT = fs.readFileSync(path.join(__dirname, '..', 'prompts', 'crossCall.txt'), 'utf-8')

function demoAnalyze() {
    return []
}

/**
 * Compare current transcript against historical call summaries.
 *
 * @param {string} currentTranscript
 * @param {Array}  historicalSummaries
 * @param {string} model  OpenRouter model ID
 */
async function analyze(currentTranscript, historicalSummaries = [], model) {
    if (!historicalSummaries.length) return []

    const historyText = historicalSummaries.map((h, i) =>
        `--- Call ${i + 1} (${h.date}) ---\nSummary: ${h.summary}\nKey Points: ${h.keyPoints?.join(', ') || 'N/A'}\nOutcome: ${h.outcome || 'N/A'}`
    ).join('\n\n')

    const userPrompt = `CURRENT CALL TRANSCRIPT:\n${currentTranscript}\n\nPREVIOUS CALL HISTORY:\n${historyText}`

    const result = await callModel(model, SYSTEM_PROMPT, userPrompt)

    if (result && Array.isArray(result)) return result
    if (result && result.flags) return result.flags
    return demoAnalyze()
}

module.exports = { analyze }
