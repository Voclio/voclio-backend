import Redis from 'ioredis';
import config from './index.js';
import logger from '../utils/logger.js';

class RedisClient {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }

  connect() {
    if (this.client) {
      return this.client;
    }

    const redisConfig = {
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      reconnectOnError: (err) => {
        logger.error('Redis reconnect on error:', err);
        return true;
      }
    };

    this.client = new Redis(redisConfig);

    this.client.on('connect', () => {
      this.isConnected = true;
      logger.info('✅ Redis connected successfully');
    });

    this.client.on('error', (err) => {
      this.isConnected = false;
      logger.error('❌ Redis connection error:', err);
    });

    this.client.on('close', () => {
      this.isConnected = false;
      logger.warn('⚠️ Redis connection closed');
    });

    return this.client;
  }

  getClient() {
    if (!this.client) {
      return this.connect();
    }
    return this.client;
  }

  async disconnect() {
    if (this.client) {
      await this.client.quit();
      this.client = null;
      this.isConnected = false;
      logger.info('Redis disconnected');
    }
  }

  async healthCheck() {
    try {
      const result = await this.client.ping();
      return result === 'PONG';
    } catch (error) {
      logger.error('Redis health check failed:', error);
      return false;
    }
  }
}

export default new RedisClient();
