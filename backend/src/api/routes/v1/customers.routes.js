const express = require('express')
const router = express.Router()
const ctrl = require('../../controllers/customers.controller')
const { listCustomersValidator, getCustomerTimelineValidator } = require('../../validators/customers.validators')
const validate = require('../../middlewares/validate')

// GET /api/v1/customers
router.get('/', listCustomersValidator, validate, ctrl.listCustomers)

// POST /api/v1/customers
router.post('/', ctrl.createCustomer)

// GET /api/v1/customers/:id/timeline
router.get('/:id/timeline', getCustomerTimelineValidator, validate, ctrl.getCustomerTimeline)

module.exports = router
