const { query, param } = require('express-validator')

const VALID_RISK_LEVELS = ['low', 'medium', 'high', 'critical']

const listCustomersValidator = [
    query('riskLevel').optional().isIn(VALID_RISK_LEVELS).withMessage(`riskLevel must be one of: ${VALID_RISK_LEVELS.join(', ')}`),
]

const getCustomerTimelineValidator = [
    param('id').isString().trim().notEmpty().withMessage('Customer ID is required'),
]

module.exports = { listCustomersValidator, getCustomerTimelineValidator }
