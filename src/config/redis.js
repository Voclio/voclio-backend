import Redis from 'ioredis';
import config from './index.js';
import logger from '../utils/logger.js';

class RedisClient {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.isEnabled = false;
  }

  connect() {
    // Check if Redis is configured
    if (!config.redis.host || config.redis.host === 'disabled') {
      logger.info('⚠️  Redis is disabled - running without cache/queue support');
      this.isEnabled = false;
      return null;
    }

    if (this.client) {
      return this.client;
    }

    try {
      const redisConfig = {
        host: config.redis.host,
        port: config.redis.port,
        password: config.redis.password,
        maxRetriesPerRequest: 1,
        retryStrategy: times => {
          if (times > 3) {
            logger.warn('⚠️  Redis connection failed after 3 attempts - disabling Redis');
            this.isEnabled = false;
            return null; // Stop retrying
          }
          return Math.min(times * 50, 2000);
        },
        reconnectOnError: () => false,
        lazyConnect: true, // Don't connect immediately
        enableOfflineQueue: false
      };

      this.client = new Redis(redisConfig);

      this.client.on('connect', () => {
        this.isConnected = true;
        this.isEnabled = true;
        logger.info('✅ Redis connected successfully');
      });

      this.client.on('error', err => {
        this.isConnected = false;
        // Only log once, not repeatedly
        if (this.isEnabled) {
          logger.warn('⚠️  Redis connection error - running without cache/queue support');
          this.isEnabled = false;
        }
      });

      this.client.on('close', () => {
        this.isConnected = false;
      });

      // Try to connect
      this.client.connect().catch(() => {
        logger.warn('⚠️  Redis not available - running without cache/queue support');
        this.isEnabled = false;
      });

      return this.client;
    } catch (error) {
      logger.warn('⚠️  Redis initialization failed - running without cache/queue support');
      this.isEnabled = false;
      return null;
    }
  }

  getClient() {
    if (!this.isEnabled) {
      return null;
    }
    if (!this.client) {
      return this.connect();
    }
    return this.client;
  }

  async disconnect() {
    if (this.client) {
      try {
        await this.client.quit();
      } catch (error) {
        // Ignore errors during disconnect
      }
      this.client = null;
      this.isConnected = false;
      this.isEnabled = false;
      logger.info('Redis disconnected');
    }
  }

  async healthCheck() {
    if (!this.isEnabled || !this.client) {
      return false;
    }
    try {
      const result = await this.client.ping();
      return result === 'PONG';
    } catch (error) {
      return false;
    }
  }
}

export default new RedisClient();
