const config = require('../config')
const logger = require('../src/shared/logger')

/**
 * Available LLM models selectable from the frontend.
 * All route through OpenRouter using OPENROUTER_API_KEY.
 */
const AVAILABLE_MODELS = [
    {
        id: 'qwen/qwen3-235b-a22b',
        label: 'Qwen 3 235B',
        provider: 'Qwen',
        description: 'High-capacity MoE model, strong reasoning and multilingual',
    },
    {
        id: 'stepfun/step-3.5-flash:free',
        label: 'Step 3.5 Flash (Free)',
        provider: 'StepFun',
        description: 'Fast, efficient model from StepFun',
    },
    {
        id: 'arcee-ai/trinity-large-preview:free',
        label: 'Trinity Large Preview (Free)',
        provider: 'Arcee AI',
        description: 'Large preview model from Arcee AI',
    },
    {
        id: 'upstage/solar-pro-3:free',
        label: 'Solar Pro 3 (Free)',
        provider: 'Upstage',
        description: 'Solar Pro 3 from Upstage, strong instruction following',
    },
    {
        id: 'z-ai/glm-4.7-flash',
        label: 'GLM-4.7 Flash',
        provider: 'Z-AI',
        description: 'Fast GLM model from Z-AI / Zhipu',
    },
]

const DEFAULT_MODEL = AVAILABLE_MODELS[0].id

/**
 * Call OpenRouter API with the given model.
 *
 * @param {string} model       OpenRouter model ID (e.g. "qwen/qwen3-235b-a22b")
 * @param {string} systemPrompt
 * @param {string} userPrompt
 * @returns {Promise<object|null>}  Parsed JSON response, or null on demo/error
 */
async function callModel(model, systemPrompt, userPrompt) {
    if (config.DEMO_MODE || !config.OPENROUTER_API_KEY) {
        logger.debug(`[LLM] Demo mode — skipping ${model}`)
        return null
    }

    const resolvedModel = model || DEFAULT_MODEL

    try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${config.OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'http://localhost:3000',
                'X-Title': 'CollectIQ — Loan Collection Intelligence',
            },
            body: JSON.stringify({
                model: resolvedModel,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt },
                ],
                temperature: 0.2,
                response_format: { type: 'json_object' },
            }),
        })

        const data = await response.json()

        if (data.error) {
            logger.error(`[LLM] OpenRouter error (${resolvedModel})`, { error: data.error })
            return null
        }

        const content = data.choices?.[0]?.message?.content
        if (!content) return null

        try {
            return JSON.parse(content)
        } catch {
            return { raw: content }
        }
    } catch (err) {
        logger.error(`[LLM] OpenRouter call failed (${resolvedModel})`, { message: err.message })
        return null
    }
}

module.exports = { callModel, AVAILABLE_MODELS, DEFAULT_MODEL }
