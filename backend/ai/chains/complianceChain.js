const fs = require('fs')
const path = require('path')
const { callModel } = require('../../services/openRouterClient')

const SYSTEM_PROMPT = fs.readFileSync(path.join(__dirname, '..', 'prompts', 'compliance.txt'), 'utf-8')

function demoAnalyze(transcript) {
    const text = transcript.toLowerCase()
    const flags = []

    const threats = ['legal action', 'send people', 'come to your house', 'police', 'arrest']
    const harassment = ['family will know', 'reputation', 'tell everyone', 'your neighbors']
    const coercion = ['you must pay now', 'no choice', 'force']

    threats.forEach(t => {
        if (text.includes(t)) flags.push({ type: 'threatening_language', severity: 'high', evidence: t, timestamp: 'N/A' })
    })
    harassment.forEach(h => {
        if (text.includes(h)) flags.push({ type: 'intimidation', severity: 'high', evidence: h, timestamp: 'N/A' })
    })
    coercion.forEach(c => {
        if (text.includes(c)) flags.push({ type: 'coercion', severity: 'medium', evidence: c, timestamp: 'N/A' })
    })

    return flags
}

/**
 * @param {string} transcriptText
 * @param {string} model  OpenRouter model ID
 */
async function analyze(transcriptText, model) {
    const result = await callModel(model, SYSTEM_PROMPT, transcriptText)

    if (result && Array.isArray(result)) return result
    if (result && result.violations) return result.violations
    return demoAnalyze(transcriptText)
}

module.exports = { analyze }
