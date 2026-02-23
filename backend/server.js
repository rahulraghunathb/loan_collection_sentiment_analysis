const config = require('./config')
const db = require('./db/setup')
const { seed } = require('./db/seed')
const createApp = require('./src/app')
const logger = require('./src/shared/logger')

async function start() {
    try {
        await db.initialize()
        logger.info('Database initialized')

        if (config.DEMO_MODE) {
            await seed()
            logger.info('Demo mode: seed data loaded')
        }

        const app = createApp()

        app.listen(config.PORT, () => {
            logger.info(`CollectIQ server started`, {
                port: config.PORT,
                env: config.NODE_ENV,
                mode: config.DEMO_MODE ? 'DEMO' : 'PRODUCTION',
                api: `http://localhost:${config.PORT}/api/v1`,
                health: `http://localhost:${config.PORT}/health/ready`,
            })
        })
    } catch (err) {
        logger.error('Failed to start server', { message: err.message, stack: err.stack })
        process.exit(1)
    }
}

start()
