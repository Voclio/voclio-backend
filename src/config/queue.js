import { Queue } from 'bullmq';
import redisClient from './redis.js';
import logger from '../utils/logger.js';

// Queue names
export const QUEUE_NAMES = {
  TRANSCRIPTION: 'transcription',
  EXTRACTION: 'extraction',
  EMAIL: 'email',
  NOTIFICATION: 'notification'
};

// Job priorities
export const JOB_PRIORITY = {
  HIGH: 1,
  MEDIUM: 5,
  LOW: 10
};

class QueueManager {
  constructor() {
    this.queues = new Map();
    this.connection = null;
  }

  initialize() {
    // Get Redis connection for BullMQ
    const redis = redisClient.getClient();
    
    this.connection = {
      host: redis.options.host,
      port: redis.options.port,
      password: redis.options.password
    };

    // Create queues
    Object.values(QUEUE_NAMES).forEach(queueName => {
      this.createQueue(queueName);
    });

    logger.info('✅ Queue manager initialized');
  }

  createQueue(name) {
    if (this.queues.has(name)) {
      return this.queues.get(name);
    }

    const queue = new Queue(name, {
      connection: this.connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000
        },
        removeOnComplete: {
          count: 100, // Keep last 100 completed jobs
          age: 24 * 3600 // Keep for 24 hours
        },
        removeOnFail: {
          count: 500, // Keep last 500 failed jobs
          age: 7 * 24 * 3600 // Keep for 7 days
        }
      }
    });

    queue.on('error', (error) => {
      logger.error(`Queue ${name} error:`, error);
    });

    this.queues.set(name, queue);
    logger.info(`Queue created: ${name}`);
    
    return queue;
  }

  getQueue(name) {
    if (!this.queues.has(name)) {
      return this.createQueue(name);
    }
    return this.queues.get(name);
  }

  async addJob(queueName, jobName, data, options = {}) {
    const queue = this.getQueue(queueName);
    
    const job = await queue.add(jobName, data, {
      priority: options.priority || JOB_PRIORITY.MEDIUM,
      delay: options.delay || 0,
      ...options
    });

    logger.info(`Job added to ${queueName}: ${job.id}`);
    return job;
  }

  async getJob(queueName, jobId) {
    const queue = this.getQueue(queueName);
    return await queue.getJob(jobId);
  }

  async getJobState(queueName, jobId) {
    const job = await this.getJob(queueName, jobId);
    if (!job) {
      return null;
    }

    const state = await job.getState();
    const progress = job.progress;
    const returnvalue = job.returnvalue;
    const failedReason = job.failedReason;

    return {
      id: job.id,
      name: job.name,
      state,
      progress,
      data: job.data,
      result: returnvalue,
      error: failedReason,
      attemptsMade: job.attemptsMade,
      timestamp: job.timestamp,
      processedOn: job.processedOn,
      finishedOn: job.finishedOn
    };
  }

  async removeJob(queueName, jobId) {
    const job = await this.getJob(queueName, jobId);
    if (job) {
      await job.remove();
      logger.info(`Job removed: ${jobId}`);
    }
  }

  async pauseQueue(queueName) {
    const queue = this.getQueue(queueName);
    await queue.pause();
    logger.info(`Queue paused: ${queueName}`);
  }

  async resumeQueue(queueName) {
    const queue = this.getQueue(queueName);
    await queue.resume();
    logger.info(`Queue resumed: ${queueName}`);
  }

  async getQueueStats(queueName) {
    const queue = this.getQueue(queueName);
    
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount()
    ]);

    return {
      name: queueName,
      waiting,
      active,
      completed,
      failed,
      delayed,
      total: waiting + active + completed + failed + delayed
    };
  }

  async closeAll() {
    const closePromises = Array.from(this.queues.values()).map(queue => queue.close());
    await Promise.all(closePromises);
    this.queues.clear();
    logger.info('All queues closed');
  }
}

export default new QueueManager();
