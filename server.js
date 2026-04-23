import 'dotenv/config';
import app from './src/app.js';
import config from './src/config/index.js';
import { syncDatabase } from './src/models/orm/index.js';
import cronService from './src/services/cron.service.js';
import emailService from './src/services/email.service.js';
import redisClient from './src/config/redis.js';
import queueManager from './src/config/queue.js';
import cacheService from './src/services/cache.service.js';
import logger from './src/utils/logger.js';
import fs from 'fs';

const PORT = config.port;

// Ensure required directories exist
['logs', 'temp'].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Initialize Redis
redisClient.connect();

// Initialize Queue Manager (after Redis)
setTimeout(() => {
  try {
    queueManager.initialize();
    cacheService.initialize();
    logger.info('✅ Queue and cache services initialized');
  } catch (err) {
    logger.warn('⚠️  Queue/cache init failed (Redis may not be available):', err.message);
  }
}, 1000);

// Sync database with ORM
syncDatabase(false).then(() => {
  logger.info('✅ Database models synchronized');
}).catch(err => {
  logger.error('❌ Database sync error:', { error: err.message });
  logger.info('💡 Server will continue running. Fix database credentials in .env');
});

// Verify email service
emailService.verifyConnection();

// Start cron jobs
cronService.start();

const server = app.listen(PORT, () => {
  logger.info('\n🚀 Voclio API Server v2.0');
  logger.info('━'.repeat(50));
  logger.info(`📡 Server running on: http://localhost:${PORT}`);
  logger.info(`🌍 Environment: ${config.nodeEnv}`);
  logger.info(`📚 API Docs (Swagger): http://localhost:${PORT}/api-docs`);
  logger.info(`💚 Health Check: http://localhost:${PORT}/api/health`);
  logger.info('━'.repeat(50));
  logger.info('\n✨ Server is ready to accept requests\n');
});

// Graceful shutdown
const shutdown = async (signal) => {
  logger.info(`\n⚠️  ${signal} received: shutting down gracefully`);
  cronService.stop();
  await queueManager.closeAll().catch(() => {});
  await redisClient.disconnect().catch(() => {});
  server.close(() => {
    logger.info('✅ HTTP server closed');
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

process.on('uncaughtException', (error) => {
  logger.error('❌ Uncaught Exception:', { error: error.message, stack: error.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('❌ Unhandled Rejection:', { reason, promise });
  process.exit(1);
});

