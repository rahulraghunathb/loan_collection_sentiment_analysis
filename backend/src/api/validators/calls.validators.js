const { query, param, body } = require('express-validator')

const VALID_STATUSES = ['pending', 'transcribed', 'analyzed', 'failed']
const VALID_OUTCOMES = [
    'payment_committed', 'partial_commitment', 'no_commitment',
    'dispute_raised', 'escalation_required', 'callback_scheduled', 'not_reachable',
]

const listCallsValidator = [
    query('customerId').optional().isString().trim().notEmpty().withMessage('customerId must be a non-empty string'),
    query('status').optional().isIn(VALID_STATUSES).withMessage(`status must be one of: ${VALID_STATUSES.join(', ')}`),
    query('outcome').optional().isIn(VALID_OUTCOMES).withMessage(`outcome must be one of: ${VALID_OUTCOMES.join(', ')}`),
    query('limit').optional().isInt({ min: 1, max: 200 }).withMessage('limit must be an integer between 1 and 200').toInt(),
    query('offset').optional().isInt({ min: 0 }).withMessage('offset must be a non-negative integer').toInt(),
]

const getCallValidator = [
    param('id').isString().trim().notEmpty().withMessage('Call ID is required'),
]

const uploadCallValidator = [
    body('customerId').isString().trim().notEmpty().withMessage('customerId is required'),
    body('agentName').optional().isString().trim().isLength({ max: 100 }).withMessage('agentName must be a string up to 100 characters'),
]

const analyzeCallValidator = [
    param('id').isString().trim().notEmpty().withMessage('Call ID is required'),
]

module.exports = { listCallsValidator, getCallValidator, uploadCallValidator, analyzeCallValidator }
