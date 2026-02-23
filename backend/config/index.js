const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '.env'), override: true })

const corsOrigins = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean)

module.exports = {
    PORT: process.env.PORT || 3000,
    NODE_ENV: process.env.NODE_ENV || 'development',
    DEMO_MODE: process.env.DEMO_MODE === 'true',
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || '',
    OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
    API_PREFIX: process.env.API_PREFIX || '/api',
    API_V1_PREFIX: process.env.API_V1_PREFIX || '/api/v1',
    CORS_ORIGINS: corsOrigins,
    DB_PATH: path.join(__dirname, '..', 'data', 'database.sqlite'),
    UPLOAD_DIR: path.join(__dirname, '..', 'uploads'),
}
