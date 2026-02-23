const { Sequelize } = require('sequelize')
const path = require('path')
const fs = require('fs')
const config = require('../config')

// Ensure data directory exists
const dataDir = path.dirname(config.DB_PATH)
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
}

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: config.DB_PATH,
    logging: false,
})

// Load models
const Customer = require('./models/Customer')(sequelize)
const Call = require('./models/Call')(sequelize)
const TranscriptSegment = require('./models/TranscriptSegment')(sequelize)
const AnalysisResult = require('./models/AnalysisResult')(sequelize)

// Associations
Customer.hasMany(Call, { foreignKey: 'customerId', as: 'calls' })
Call.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' })

Call.hasMany(TranscriptSegment, { foreignKey: 'callId', as: 'segments' })
TranscriptSegment.belongsTo(Call, { foreignKey: 'callId', as: 'call' })

Call.hasOne(AnalysisResult, { foreignKey: 'callId', as: 'analysis' })
AnalysisResult.belongsTo(Call, { foreignKey: 'callId', as: 'call' })

const db = {
    sequelize,
    Sequelize,
    Customer,
    Call,
    TranscriptSegment,
    AnalysisResult,
}

db.initialize = async () => {
    // Safe sync: creates tables that don't exist, never modifies existing schema.
    // Use `npm run reseed` to wipe and rebuild from scratch during development.
    await sequelize.sync({ alter: false })
    console.log('✅ Database synced')
}

module.exports = db
