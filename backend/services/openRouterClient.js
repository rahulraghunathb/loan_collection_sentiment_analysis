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
		description: 'High-capacity MoE model, strong reasoning and multilingual'
	},
	{
		id: 'stepfun/step-3.5-flash:free',
		label: 'Step 3.5 Flash (Free)',
		provider: 'StepFun',
		description: 'Fast, efficient model from StepFun'
	},
	{
		id: 'arcee-ai/trinity-large-preview:free',
		label: 'Trinity Large Preview (Free)',
		provider: 'Arcee AI',
		description: 'Large preview model from Arcee AI'
	},
	{
		id: 'upstage/solar-pro-3:free',
		label: 'Solar Pro 3 (Free)',
		provider: 'Upstage',
		description: 'Solar Pro 3 from Upstage, strong instruction following'
	},
	{
		id: 'z-ai/glm-4.7-flash',
		label: 'GLM-4.7 Flash',
		provider: 'Z-AI',
		description: 'Fast GLM model from Z-AI / Zhipu'
	}
]

const DEFAULT_MODEL = AVAILABLE_MODELS[1].id

/**
 * Extract the first valid JSON object or array from a raw string.
 * Handles: plain JSON, markdown code fences, <think>...</think> tags,
 * and models that wrap JSON in prose.
 */
function extractJSON(raw) {
	if (!raw || typeof raw !== 'string') return null

	// Strip <think>...</think> reasoning blocks (some models emit these)
	let text = raw.replace(/<think>[\s\S]*?<\/think>/gi, '').trim()

	// Strip markdown code fences  ```json ... ``` or ``` ... ```
	const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/)
	if (fenceMatch) text = fenceMatch[1].trim()

	// Try direct parse first
	try {
		return JSON.parse(text)
	} catch {
		/* fall through */
	}

	// Find the outermost { } or [ ] block
	const objStart = text.indexOf('{')
	const arrStart = text.indexOf('[')

	let start = -1
	let closing = ''
	if (objStart !== -1 && (arrStart === -1 || objStart < arrStart)) {
		start = objStart
		closing = '}'
	} else if (arrStart !== -1) {
		start = arrStart
		closing = ']'
	}

	if (start === -1) return null

	const end = text.lastIndexOf(closing)
	if (end <= start) return null

	try {
		return JSON.parse(text.slice(start, end + 1))
	} catch {
		return null
	}
}

/**
 * Call OpenRouter API with the given model.
 *
 * Notes:
 * - response_format:json_object is NOT sent — many free models reject it.
 *   Instead the system prompt already instructs JSON output.
 * - Retries once on 429 (rate limit) after a short back-off.
 *
 * @param {string} model        OpenRouter model ID
 * @param {string} systemPrompt
 * @param {string} userPrompt
 * @returns {Promise<object|null>}  Parsed JSON, or null on demo/error
 */
async function callModel(model, systemPrompt, userPrompt) {
    if (!config.OPENROUTER_API_KEY) {
        throw new Error(`[LLM] OPENROUTER_API_KEY is not set`)
    }

	const resolvedModel = model || DEFAULT_MODEL

	// Append a hard reminder to always reply with raw JSON (no prose, no fences)
	const augmentedSystem =
		systemPrompt.trimEnd() +
		'\n\nIMPORTANT: Reply with ONLY the raw JSON object/array described above. ' +
		'No markdown, no code fences, no explanation text — just the JSON.'

	const body = JSON.stringify({
		model: resolvedModel,
		messages: [
			{ role: 'system', content: augmentedSystem },
			{ role: 'user', content: userPrompt }
		],
		temperature: 0.1
	})

	const headers = {
		Authorization: `Bearer ${config.OPENROUTER_API_KEY}`,
		'Content-Type': 'application/json',
		'HTTP-Referer': 'http://localhost:3000',
		'X-Title': 'CollectIQ - Loan Collection Intelligence'
	}

	for (let attempt = 1; attempt <= 2; attempt++) {
		try {
			const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
				method: 'POST',
				headers,
				body
			})

			// Rate limited — wait and retry once
			if (response.status === 429 && attempt === 1) {
				const retryAfter = parseInt(response.headers.get('retry-after') || '5', 10)
				logger.warn(`[LLM] Rate limited (${resolvedModel}), retrying in ${retryAfter}s`)
				await new Promise((r) => setTimeout(r, retryAfter * 1000))
				continue
			}

			const data = await response.json()

			if (data.error) {
				logger.error(`[LLM] OpenRouter error (${resolvedModel})`, { error: data.error })
				return null
			}

			const content = data.choices?.[0]?.message?.content
			if (!content) {
				logger.warn(`[LLM] Empty content from ${resolvedModel}`, { data })
				return null
			}

			const parsed = extractJSON(content)
			if (!parsed) {
				logger.warn(`[LLM] Could not extract JSON from ${resolvedModel} response`, {
					preview: content.slice(0, 300)
				})
				return null
			}

			logger.debug(`[LLM] ${resolvedModel} OK`, { keys: Object.keys(parsed) })
			return parsed
		} catch (err) {
			logger.error(`[LLM] OpenRouter call failed (${resolvedModel})`, { message: err.message })
			return null
		}
	}

	return null
}

module.exports = { callModel, AVAILABLE_MODELS, DEFAULT_MODEL }
