const express = require('express')
const router = express.Router()

router.use('/calls', require('./calls.routes'))
router.use('/customers', require('./customers.routes'))
router.use('/dashboard', require('./dashboard.routes'))
router.use('/models', require('./models.routes'))

module.exports = router
