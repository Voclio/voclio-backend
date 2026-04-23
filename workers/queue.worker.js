import { Worker } from 'bullmq';
import 'dotenv/config';
import redisClient from '../src/config/redis.js';
import { QUEUE_NAMES } from '../src/config/queue.js';
import { jobProcessors } from '../src/jobs/index.js';
import { syncDatabase } from '../src/models/orm/index.js';
import logger from '../src/utils/logger.js';

class QueueWorker {
  constructor() {
    this.workers = [];
    this.connection = null;
  }

  async initialize() {
    try {
      // Initialize Redis connection
      redisClient.connect();
      
      // Wait for Redis to be ready
      await new Promise((resolve) => {
        const checkConnection = setInterval(() => {
          if (redisClient.isConnected) {
            clearInterval(checkConnection);
            resolve();
          }
        }, 100);
      });

      // Sync database
      await syncDatabase(false);
      logger.info('✅ Database models synchronized');

      // Get Redis connection config
      const redis = redisClient.getClient();
      this.connection = {
        host: redis.options.host,
        port: redis.options.port,
        password: redis.options.password
      };

      // Start workers for each queue
      this.startWorkers();

      logger.info('✅ Queue workers initialized');

    } catch (error) {
      logger.error('❌ Worker initialization failed:', error);
      process.exit(1);
    }
  }

  startWorkers() {
    // Transcription worker
    this.createWorker(
      QUEUE_NAMES.TRANSCRIPTION,
      jobProcessors.transcription.processor,
      {
        concurrency: 2, // Process 2 transcriptions at a time
        ...jobProcessors.transcription.options
      }
    );

    // Extraction worker
    this.createWorker(
      QUEUE_NAMES.EXTRACTION,
      jobProcessors.extraction.processor,
      {
        concurrency: 3, // Process 3 extractions at a time
        ...jobProcessors.extraction.options
      }
    );

    logger.info(`Started ${this.workers.length} workers`);
  }

  createWorker(queueName, processor, options = {}) {
    const worker = new Worker(queueName, processor, {
      connection: this.connection,
      ...options
    });

    // Event handlers
    worker.on('completed', (job, result) => {
      logger.info(`✅ Job ${job.id} in ${queueName} completed`, {
        jobId: job.id,
        queue: queueName,
        duration: Date.now() - job.timestamp
      });
    });

    worker.on('failed', (job, error) => {
      logger.error(`❌ Job ${job?.id} in ${queueName} failed`, {
        jobId: job?.id,
        queue: queueName,
        error: error.message,
        attempts: job?.attemptsMade
      });
    });

    worker.on('progress', (job, progress) => {
      logger.debug(`⏳ Job ${job.id} in ${queueName} progress: ${progress}%`);
    });

    worker.on('error', (error) => {
      logger.error(`Worker error in ${queueName}:`, error);
    });

    worker.on('stalled', (jobId) => {
      logger.warn(`⚠️ Job ${jobId} in ${queueName} stalled`);
    });

    this.workers.push(worker);
    logger.info(`Worker created for queue: ${queueName}`);

    return worker;
  }

  async shutdown() {
    logger.info('Shutting down workers...');

    // Close all workers
    await Promise.all(this.workers.map(worker => worker.close()));
    
    // Disconnect Redis
    await redisClient.disconnect();

    logger.info('✅ Workers shut down gracefully');
  }
}

// Create worker instance
const queueWorker = new QueueWorker();

// Initialize
queueWorker.initialize();

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down...');
  await queueWorker.shutdown();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down...');
  await queueWorker.shutdown();
  process.exit(0);
});

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection:', { reason, promise });
  process.exit(1);
});

export default queueWorker;
