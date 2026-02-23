const fs = require('fs')
const path = require('path')
const { callModel } = require('../../services/openRouterClient')

const SYSTEM_PROMPT = fs.readFileSync(path.join(__dirname, '..', 'prompts', 'compliance.txt'), 'utf-8')

/**
 * @param {string} transcriptText
 * @param {string} model  OpenRouter model ID
 * @returns {Promise<Array>}
 */
async function analyze(transcriptText, model) {
    const result = await callModel(model, SYSTEM_PROMPT, transcriptText)
    if (!result) throw new Error('Compliance chain: LLM returned no result')
    if (Array.isArray(result)) return result
    if (result.violations && Array.isArray(result.violations)) return result.violations
    return []
}

module.exports = { analyze }
