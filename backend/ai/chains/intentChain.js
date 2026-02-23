const fs = require('fs')
const path = require('path')
const { callModel } = require('../../services/openRouterClient')

const SYSTEM_PROMPT = fs.readFileSync(path.join(__dirname, '..', 'prompts', 'intent.txt'), 'utf-8')

function demoAnalyze(transcript) {
    const text = transcript.toLowerCase()

    const positiveSignals = ['i will pay', 'i can pay', 'i promise', 'transferred', 'commitment', 'arrange', 'auto-debit', 'already paid', 'yes']
    const negativeSignals = ['cannot pay', 'no money', 'do whatever', 'stop calling', 'harassment', 'cannot', 'refuse', 'not possible', 'no']
    const evasiveSignals = ['maybe', 'i will try', 'let me check', 'next month', 'call back', 'meeting']

    let score = 50
    const evidence = []
    const signals = []

    positiveSignals.forEach(s => { if (text.includes(s)) { score += 8; evidence.push(s); signals.push('positive_signal') } })
    negativeSignals.forEach(s => { if (text.includes(s)) { score -= 10; evidence.push(s); signals.push('negative_signal') } })
    evasiveSignals.forEach(s => { if (text.includes(s)) { score -= 3; evidence.push(s); signals.push('evasive') } })

    score = Math.max(0, Math.min(100, score))
    const level = score >= 70 ? 'high' : score >= 40 ? 'medium' : score >= 15 ? 'low' : 'none'

    return { score, level, evidence: evidence.slice(0, 5), signals: [...new Set(signals)] }
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
