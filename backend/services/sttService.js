const fs = require('fs')
const OpenAI = require('openai')
const config = require('../config')
const logger = require('../src/shared/logger')

/**
 * Transcribe audio using OpenAI Whisper (whisper-1) then re-label speakers
 * using LLM-based content analysis.
 *
 * Two-pass approach:
 *  1. Whisper produces segments with timestamps but no speaker info.
 *  2. We group consecutive segments by pause gaps (>0.8s) into "turns", then
 *     send the full numbered turn list to the LLM which assigns each turn to
 *     "agent" or "customer" based on content semantics (collection language,
 *     questions, objections, etc.).
 *
 * @param {string} audioPath  Absolute path to the audio file.
 * @param {string} [model]    OpenRouter model ID for diarization (optional).
 * @returns {Promise<Array<{speaker, startTime, endTime, text}>>}
 */
async function transcribe(audioPath, model) {
    if (!config.OPENAI_API_KEY) {
        throw new Error('[STT] OPENAI_API_KEY is not set')
    }
    if (!audioPath || !fs.existsSync(audioPath)) {
        throw new Error(`[STT] Audio file not found: ${audioPath}`)
    }

    const openai = new OpenAI({ apiKey: config.OPENAI_API_KEY })

    const data = await openai.audio.transcriptions.create({
        file: fs.createReadStream(audioPath),
        model: 'whisper-1',
        response_format: 'verbose_json',
        timestamp_granularities: ['segment'],
    })

    const rawSegments = data.segments || []
    if (!rawSegments.length) {
        throw new Error('[STT] Whisper returned no segments')
    }

    // Group raw Whisper segments into speaker turns based on pause gaps.
    // A gap > 0.8s between consecutive segments indicates a likely speaker change.
    const turns = []
    let currentTurn = null

    for (const seg of rawSegments) {
        const needsNewTurn = !currentTurn || (seg.start - currentTurn.endTime > 0.8)
        if (needsNewTurn) {
            if (currentTurn) turns.push(currentTurn)
            currentTurn = {
                startTime: Math.round(seg.start * 10) / 10,
                endTime: Math.round(seg.end * 10) / 10,
                text: seg.text.trim(),
            }
        } else {
            currentTurn.endTime = Math.round(seg.end * 10) / 10
            currentTurn.text += ' ' + seg.text.trim()
        }
    }
    if (currentTurn) turns.push(currentTurn)

    logger.info('[STT] Whisper transcription complete, running LLM diarization', {
        rawSegments: rawSegments.length,
        turns: turns.length,
    })

    // LLM diarization — assign agent/customer to each turn based on content
    const labelledTurns = await diarizeWithLLM(turns, model)

    logger.info('[STT] Diarization complete', { segmentCount: labelledTurns.length })
    return labelledTurns
}

/**
 * Use the LLM (via OpenRouter) to assign "agent" or "customer" to each turn.
 * Falls back to alternating heuristic if the LLM call fails.
 */
async function diarizeWithLLM(turns, model) {
    if (!config.OPENROUTER_API_KEY) {
        logger.warn('[STT] OPENROUTER_API_KEY not set, using heuristic diarization')
        return heuristicDiarize(turns)
    }

    const { callModel } = require('./openRouterClient')

    const systemPrompt = `You are a call transcript diarization expert for loan collection calls.
You will receive a numbered list of speech turns from a two-party phone call between a bank/NBFC collection agent and a loan customer.

Your task: assign each turn to either "agent" or "customer".

Agent characteristics:
- Identifies themselves or the bank
- States loan account details, outstanding amounts, due dates
- Threatens legal action, auction of collateral, or credit bureau reporting
- Asks when the customer will pay
- Provides contact numbers or helpline info
- Uses formal, scripted collection language

Customer characteristics:
- Asks questions about their loan, interest rates, or balance
- Makes objections, complaints, or excuses
- Confirms or denies payment intent
- Asks for more time or negotiates
- Expresses confusion or frustration

Reply with ONLY a JSON array of objects, one per turn, in the same order:
[{"turn": 1, "speaker": "agent"}, {"turn": 2, "speaker": "customer"}, ...]`

    const userPrompt = turns
        .map((t, i) => `Turn ${i + 1} [${t.startTime}s-${t.endTime}s]: ${t.text}`)
        .join('\n')

    try {
        const result = await callModel(model, systemPrompt, userPrompt)

        if (!Array.isArray(result) || result.length !== turns.length) {
            logger.warn('[STT] LLM diarization returned unexpected shape, falling back to heuristic', {
                expected: turns.length,
                got: Array.isArray(result) ? result.length : typeof result,
            })
            return heuristicDiarize(turns)
        }

        return turns.map((t, i) => ({
            speaker: result[i]?.speaker === 'customer' ? 'customer' : 'agent',
            startTime: t.startTime,
            endTime: t.endTime,
            text: t.text,
        }))
    } catch (err) {
        logger.warn('[STT] LLM diarization failed, falling back to heuristic', { error: err.message })
        return heuristicDiarize(turns)
    }
}

/**
 * Simple alternating heuristic — first turn is agent, then alternates.
 * Used as a fallback when the LLM is unavailable.
 */
function heuristicDiarize(turns) {
    return turns.map((t, i) => ({
        speaker: i % 2 === 0 ? 'agent' : 'customer',
        startTime: t.startTime,
        endTime: t.endTime,
        text: t.text,
    }))
}

module.exports = { transcribe }
