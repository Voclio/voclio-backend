import 'dotenv/config';
import { Worker } from 'bullmq';
import redisClient from '../src/config/redis.js';
import { QUEUE_NAMES } from '../src/config/queue.js';
import { processTranscription } from '../src/jobs/transcription.job.js';
import { processExtraction } from '../src/jobs/extraction.job.js';
import logger from '../src/utils/logger.js';

const WORKER_CONCURRENCY = parseInt(process.env.QUEUE_WORKER_CONCURRENCY) || 2;

let transcriptionWorker;
let extractionWorker;

const getConnection = () => {
  const redis = redisClient.getClient();
  if (!redis) {
    throw new Error('Redis client not available');
  }

  return {
    host: redis.options.host,
    port: redis.options.port,
    password: redis.options.password
  };
};

const attachWorkerEvents = (worker, queueName) => {
  worker.on('completed', job => {
    logger.info(`[${queueName}] Job ${job.id} completed`, {
      jobName: job.name,
      recordingId: job.data?.recordingId
    });
  });

  worker.on('failed', (job, error) => {
    logger.error(`[${queueName}] Job ${job?.id} failed`, {
      jobName: job?.name,
      recordingId: job?.data?.recordingId,
      error: error.message
    });
  });

  worker.on('error', error => {
    logger.error(`[${queueName}] Worker error`, { error: error.message });
  });
};

const startWorkers = () => {
  const connection = getConnection();

  transcriptionWorker = new Worker(QUEUE_NAMES.TRANSCRIPTION, processTranscription, {
    connection,
    concurrency: WORKER_CONCURRENCY
  });

  extractionWorker = new Worker(QUEUE_NAMES.EXTRACTION, processExtraction, {
    connection,
    concurrency: WORKER_CONCURRENCY
  });

  attachWorkerEvents(transcriptionWorker, QUEUE_NAMES.TRANSCRIPTION);
  attachWorkerEvents(extractionWorker, QUEUE_NAMES.EXTRACTION);

  logger.info('Queue workers started', {
    queues: [QUEUE_NAMES.TRANSCRIPTION, QUEUE_NAMES.EXTRACTION],
    concurrency: WORKER_CONCURRENCY
  });
};

const shutdown = async signal => {
  logger.info(`${signal} received: shutting down workers`);

  await Promise.all([
    transcriptionWorker?.close(),
    extractionWorker?.close()
  ]).catch(() => {});

  await redisClient.disconnect().catch(() => {});
  process.exit(0);
};

redisClient.connect();

setTimeout(() => {
  try {
    startWorkers();
  } catch (error) {
    logger.error('Failed to start queue workers', { error: error.message });
    process.exit(1);
  }
}, 1000);

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('uncaughtException', error => {
  logger.error('Uncaught exception in worker', { error: error.message, stack: error.stack });
  process.exit(1);
});

process.on('unhandledRejection', reason => {
  logger.error('Unhandled rejection in worker', { reason });
  process.exit(1);
});
