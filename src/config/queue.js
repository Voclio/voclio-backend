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
    this.isEnabled = false;
  }

  initialize() {
    // Get Redis connection for BullMQ
    const redis = redisClient.getClient();

    if (!redis) {
      logger.warn('⚠️  Queue manager disabled - Redis not available');
      this.isEnabled = false;
      return;
    }

    try {
      this.connection = {
        host: redis.options.host,
        port: redis.options.port,
        password: redis.options.password
      };

      // Create queues
      Object.values(QUEUE_NAMES).forEach(queueName => {
        this.createQueue(queueName);
      });

      this.isEnabled = true;
      logger.info('✅ Queue manager initialized');
    } catch (error) {
      logger.warn('⚠️  Queue manager initialization failed - running without queue support');
      this.isEnabled = false;
    }
  }

  createQueue(name) {
    if (!this.isEnabled) {
      return null;
    }

    if (this.queues.has(name)) {
      return this.queues.get(name);
    }

    try {
      const queue = new Queue(name, {
        connection: this.connection,
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000
          },
          removeOnComplete: {
            count: 100,
            age: 24 * 3600
          },
          removeOnFail: {
            count: 500,
            age: 7 * 24 * 3600
          }
        }
      });

      queue.on('error', error => {
        logger.error(`Queue ${name} error:`, error);
      });

      this.queues.set(name, queue);
      logger.info(`Queue created: ${name}`);

      return queue;
    } catch (error) {
      logger.warn(`Failed to create queue ${name}:`, error.message);
      return null;
    }
  }

  getQueue(name) {
    if (!this.isEnabled) {
      return null;
    }
    if (!this.queues.has(name)) {
      return this.createQueue(name);
    }
    return this.queues.get(name);
  }

  async addJob(queueName, jobName, data, options = {}) {
    if (!this.isEnabled) {
      logger.warn(`Queue disabled - skipping job: ${jobName}`);
      return null;
    }

    const queue = this.getQueue(queueName);
    if (!queue) {
      logger.warn(`Queue ${queueName} not available - skipping job: ${jobName}`);
      return null;
    }

    const job = await queue.add(jobName, data, {
      priority: options.priority || JOB_PRIORITY.MEDIUM,
      delay: options.delay || 0,
      ...options
    });

    logger.info(`Job added to ${queueName}: ${job.id}`);
    return job;
  }

  async getJob(queueName, jobId) {
    if (!this.isEnabled) return null;
    const queue = this.getQueue(queueName);
    if (!queue) return null;
    return await queue.getJob(jobId);
  }

  async getJobState(queueName, jobId) {
    if (!this.isEnabled) return null;
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
    if (!this.isEnabled) return;
    const job = await this.getJob(queueName, jobId);
    if (job) {
      await job.remove();
      logger.info(`Job removed: ${jobId}`);
    }
  }

  async pauseQueue(queueName) {
    if (!this.isEnabled) return;
    const queue = this.getQueue(queueName);
    if (!queue) return;
    await queue.pause();
    logger.info(`Queue paused: ${queueName}`);
  }

  async resumeQueue(queueName) {
    if (!this.isEnabled) return;
    const queue = this.getQueue(queueName);
    if (!queue) return;
    await queue.resume();
    logger.info(`Queue resumed: ${queueName}`);
  }

  async getQueueStats(queueName) {
    if (!this.isEnabled) {
      return {
        name: queueName,
        waiting: 0,
        active: 0,
        completed: 0,
        failed: 0,
        delayed: 0,
        total: 0,
        disabled: true
      };
    }

    const queue = this.getQueue(queueName);
    if (!queue) {
      return {
        name: queueName,
        waiting: 0,
        active: 0,
        completed: 0,
        failed: 0,
        delayed: 0,
        total: 0,
        disabled: true
      };
    }

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
    if (!this.isEnabled) return;
    const closePromises = Array.from(this.queues.values()).map(queue => queue.close());
    await Promise.all(closePromises);
    this.queues.clear();
    logger.info('All queues closed');
  }
}

export default new QueueManager();
