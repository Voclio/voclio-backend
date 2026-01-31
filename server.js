import 'dotenv/config';
import app from './src/app.js';
import config from './src/config/index.js';
import { syncDatabase } from './src/models/orm/index.js';
import cronService from './src/services/cron.service.js';
import emailService from './src/services/email.service.js';

const PORT = config.port;

// Sync database with ORM
syncDatabase(false).then(() => {
  console.log('✅ Database models synchronized');
}).catch(err => {
  console.error('❌ Database sync error:', err.message);
  console.log('💡 Server will continue running. Fix database credentials in .env');
});

// Verify email service
emailService.verifyConnection();

// Start cron jobs
cronService.start();

const server = app.listen(PORT, () => {
  console.log('\n🚀 Voclio API Server');
  console.log('━'.repeat(50));
  console.log(`📡 Server running on: http://localhost:${PORT}`);
  console.log(`🌍 Environment: ${config.nodeEnv}`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/api`);
  console.log(`💚 Health Check: http://localhost:${PORT}/api/health`);
  console.log('━'.repeat(50));
  console.log('\n✨ Server is ready to accept requests\n');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n⚠️  SIGTERM signal received: closing HTTP server');
  cronService.stop();
  server.close(() => {
    console.log('✅ HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\n⚠️  SIGINT signal received: closing HTTP server');
  cronService.stop();
  server.close(() => {
    console.log('✅ HTTP server closed');
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

