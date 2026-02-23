const fs = require('fs')
const path = require('path')
const { callModel } = require('../../services/openRouterClient')

const SYSTEM_PROMPT = fs.readFileSync(path.join(__dirname, '..', 'prompts', 'ptp.txt'), 'utf-8')

function demoAnalyze(transcript) {
    const text = transcript.toLowerCase()

    const amountMatch = text.match(/(?:pay|arrange|transfer|commit)\s*(?:rs\.?|₹|rupees?)?\s*([\d,]+(?:\.\d+)?)\s*(?:thousand|lakh|k)?/i)
    const dateMatch = text.match(/(?:by|before|on)\s+(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})/i)

    let amount = null
    if (amountMatch) {
        amount = parseFloat(amountMatch[1].replace(/,/g, ''))
        if (text.includes('thousand') || text.includes('k')) amount *= 1000
        if (text.includes('lakh')) amount *= 100000
    }

    const hasPromise = text.includes('i will pay') || text.includes('i can pay') || text.includes('promise') || text.includes('commit') || amount !== null

    return {
        detected: hasPromise,
        amount,
        date: dateMatch ? `${dateMatch[1]} ${dateMatch[2]}` : null,
        installment: text.includes('installment') || text.includes('emi') || text.includes('monthly'),
        confidence: hasPromise ? (amount ? 60 : 30) : 0,
        details: hasPromise ? 'Payment commitment detected from transcript analysis' : 'No payment commitment detected',
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
