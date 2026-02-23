const fs = require('fs')
const path = require('path')
const { callModel } = require('../../services/openRouterClient')

const SYSTEM_PROMPT = fs.readFileSync(path.join(__dirname, '..', 'prompts', 'summary.txt'), 'utf-8')

/**
 * @param {string} transcriptText
 * @param {string} model  OpenRouter model ID
 * @returns {Promise<object>}
 */
async function analyze(transcriptText, model) {
    const result = await callModel(model, SYSTEM_PROMPT, transcriptText)
    if (!result) throw new Error('Summary chain: LLM returned no result')
    return result
}

module.exports = { analyze }
