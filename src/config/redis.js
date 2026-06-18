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
    const { url, host, port, username, password } = config.redis;

    const isDisabled = !url && (!host || host === 'disabled');
    if (isDisabled) {
      logger.info('⚠️  Redis is disabled - running without cache/queue support');
      this.isEnabled = false;
      return null;
    }

    if (this.client) {
      return this.client;
    }

    try {
      const sharedOptions = {
        maxRetriesPerRequest: 1,
        retryStrategy: times => {
          if (times > 3) {
            logger.warn('⚠️  Redis connection failed after 3 attempts - disabling Redis');
            this.isEnabled = false;
            return null;
          }
          return Math.min(times * 50, 2000);
        },
        reconnectOnError: () => false,
        lazyConnect: true,
        enableOfflineQueue: false
      };

      if (url) {
        const parsed = new URL(url);
        // rediss:// scheme or rlwy.net proxy both require TLS
        if (parsed.protocol === 'rediss:' || parsed.hostname.includes('rlwy.net')) {
          sharedOptions.tls = { rejectUnauthorized: false };
        }
        this.client = new Redis(url, sharedOptions);
      } else {
        const redisConfig = {
          ...sharedOptions,
          host,
          port: Number(port),
          ...(username && { username }),
          ...(password && { password })
        };
        if (host.includes('rlwy.net')) {
          redisConfig.tls = { rejectUnauthorized: false };
        }
        this.client = new Redis(redisConfig);
      }

      this.client.on('connect', () => {
        this.isConnected = true;
        this.isEnabled = true;
        logger.info('✅ Redis connected successfully');
      });

      this.client.on('error', err => {
        console.error('REDIS EVENT ERROR:', err);

        this.isConnected = false;

        if (this.isEnabled) {
          logger.warn('⚠️ Redis connection error');
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
    if (this.client) {
      return this.client;
    }

    return this.connect();
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
