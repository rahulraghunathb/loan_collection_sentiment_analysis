const fs = require('fs')
const path = require('path')
const OpenAI = require('openai')
const config = require('../config')
const logger = require('../src/shared/logger')

/**
 * Transcribe audio using OpenAI Whisper (whisper-1).
 *
 * Whisper does not natively produce speaker diarization. We use the
 * verbose_json response format which includes word-level timestamps and
 * segments. We then apply a simple heuristic: the first speaker is labelled
 * "agent" and subsequent speaker turns alternate, which is accurate enough
 * for two-party collection calls.
 *
 * @param {string} audioPath  Absolute path to the audio file.
 * @returns {Promise<Array<{speaker, startTime, endTime, text}>>}
 */
async function transcribe(audioPath) {
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

    const segments = data.segments || []

    if (!segments.length) {
        throw new Error('[STT] Whisper returned no segments')
    }

    // Heuristic speaker assignment for two-party calls.
    // A gap of > 0.8s after the previous segment signals a speaker turn change.
    // We alternate agent/customer starting with agent.
    const result = []
    let currentSpeaker = 'agent'
    let prevEnd = 0

    for (const seg of segments) {
        if (result.length > 0 && seg.start - prevEnd > 0.8) {
            currentSpeaker = currentSpeaker === 'agent' ? 'customer' : 'agent'
        }
        result.push({
            speaker: currentSpeaker,
            startTime: Math.round(seg.start * 10) / 10,
            endTime: Math.round(seg.end * 10) / 10,
            text: seg.text.trim(),
        })
        prevEnd = seg.end
    }

    logger.info('[STT] Whisper transcription complete', { segmentCount: result.length })
    return result
}

module.exports = { transcribe }
