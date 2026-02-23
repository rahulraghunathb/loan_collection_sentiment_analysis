const fs = require('fs')
const path = require('path')
const FormData = require('form-data')
const config = require('../config')
const logger = require('../src/shared/logger')

const MOCK_TRANSCRIPT = [
    { speaker: 'agent',    startTime: 0,  endTime: 12, text: 'Good morning, this is calling from the bank regarding your loan account.' },
    { speaker: 'customer', startTime: 13, endTime: 25, text: 'Yes, I know about the pending payment. I have been facing some difficulties.' },
    { speaker: 'agent',    startTime: 26, endTime: 40, text: 'We understand. Can you tell us when you plan to make the payment?' },
    { speaker: 'customer', startTime: 41, endTime: 55, text: 'I can try to pay by end of this month. I need to check my finances.' },
    { speaker: 'agent',    startTime: 56, endTime: 70, text: 'We appreciate your cooperation. We will note this commitment.' },
]

/**
 * Transcribe audio using OpenAI Whisper (whisper-1).
 *
 * Whisper does not natively produce speaker diarization. We use the
 * verbose_json response format which includes word-level timestamps and
 * segments. We then apply a simple heuristic: the first speaker is labelled
 * "agent" and subsequent speaker turns alternate, which is accurate enough
 * for two-party collection calls. For production-grade diarization a
 * post-processing step with pyannote or a diarization-enabled API can be
 * added later without changing this interface.
 *
 * @param {string|null} audioPath  Absolute path to the audio file, or null for demo.
 * @returns {Promise<Array<{speaker, startTime, endTime, text}>>}
 */
async function transcribe(audioPath) {
    if (config.DEMO_MODE || !config.OPENAI_API_KEY) {
        logger.debug('[STT] Demo mode — returning mock transcript')
        return MOCK_TRANSCRIPT
    }

    if (!audioPath || !fs.existsSync(audioPath)) {
        logger.warn('[STT] Audio file not found, falling back to mock', { audioPath })
        return MOCK_TRANSCRIPT
    }

    try {
        const form = new FormData()
        form.append('file', fs.createReadStream(audioPath), {
            filename: path.basename(audioPath),
            contentType: 'audio/mpeg',
        })
        form.append('model', 'whisper-1')
        form.append('response_format', 'verbose_json')
        form.append('timestamp_granularities[]', 'segment')

        const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${config.OPENAI_API_KEY}`,
                ...form.getHeaders(),
            },
            body: form,
        })

        if (!response.ok) {
            const errText = await response.text()
            throw new Error(`Whisper API error ${response.status}: ${errText}`)
        }

        const data = await response.json()
        const segments = data.segments || []

        if (!segments.length) {
            logger.warn('[STT] Whisper returned no segments, falling back to mock')
            return MOCK_TRANSCRIPT
        }

        // Heuristic speaker assignment for two-party calls.
        // Segments that start with a pause after the previous one are treated
        // as a speaker turn. We alternate agent/customer starting with agent.
        const result = []
        let currentSpeaker = 'agent'
        let prevEnd = 0

        for (const seg of segments) {
            // A gap of > 0.8s after the previous segment signals a turn change
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
    } catch (err) {
        logger.error('[STT] Whisper transcription failed, falling back to mock', { message: err.message })
        return MOCK_TRANSCRIPT
    }
}

module.exports = { transcribe }
