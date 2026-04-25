import redisClient from '../config/redis.js';
import logger from '../utils/logger.js';

class CacheService {
  constructor() {
    this.redis = null;
    this.isEnabled = false;
    this.defaultTTL = 3600; // 1 hour
    this.keyPrefix = 'voclio:';
  }

  initialize() {
    this.redis = redisClient.getClient();
    this.isEnabled = this.redis !== null && redisClient.isEnabled;
    
    if (this.isEnabled) {
      logger.info('✅ Cache service initialized');
    } else {
      logger.warn('⚠️  Cache service disabled - Redis not available');
    }
  }

  /**
   * Generate cache key with prefix
   */
  getKey(key) {
    return `${this.keyPrefix}${key}`;
  }

  /**
   * Set cache value
   */
  async set(key, value, ttl = this.defaultTTL) {
    if (!this.isEnabled) return false;
    
    try {
      const cacheKey = this.getKey(key);
      const serialized = JSON.stringify(value);
      
      if (ttl) {
        await this.redis.setex(cacheKey, ttl, serialized);
      } else {
        await this.redis.set(cacheKey, serialized);
      }
      
      logger.debug(`Cache set: ${key}`);
      return true;
    } catch (error) {
      logger.error('Cache set error:', error);
      return false;
    }
  }

  /**
   * Get cache value
   */
  async get(key) {
    if (!this.isEnabled) return null;
    
    try {
      const cacheKey = this.getKey(key);
      const cached = await this.redis.get(cacheKey);
      
      if (!cached) {
        logger.debug(`Cache miss: ${key}`);
        return null;
      }
      
      logger.debug(`Cache hit: ${key}`);
      return JSON.parse(cached);
    } catch (error) {
      logger.error('Cache get error:', error);
      return null;
    }
  }

  /**
   * Delete cache value
   */
  async del(key) {
    if (!this.isEnabled) return false;
    
    try {
      const cacheKey = this.getKey(key);
      await this.redis.del(cacheKey);
      logger.debug(`Cache deleted: ${key}`);
      return true;
    } catch (error) {
      logger.error('Cache delete error:', error);
      return false;
    }
  }

  /**
   * Delete multiple keys by pattern
   */
  async delPattern(pattern) {
    if (!this.isEnabled) return 0;
    
    try {
      const cachePattern = this.getKey(pattern);
      const keys = await this.redis.keys(cachePattern);
      
      if (keys.length > 0) {
        await this.redis.del(...keys);
        logger.debug(`Cache deleted pattern: ${pattern} (${keys.length} keys)`);
      }
      
      return keys.length;
    } catch (error) {
      logger.error('Cache delete pattern error:', error);
      return 0;
    }
  }

  /**
   * Check if key exists
   */
  async exists(key) {
    if (!this.isEnabled) return false;
    
    try {
      const cacheKey = this.getKey(key);
      const exists = await this.redis.exists(cacheKey);
      return exists === 1;
    } catch (error) {
      logger.error('Cache exists error:', error);
      return false;
    }
  }

  /**
   * Get or set cache (cache-aside pattern)
   */
  async getOrSet(key, fetchFunction, ttl = this.defaultTTL) {
    try {
      // Try to get from cache if enabled
      if (this.isEnabled) {
        const cached = await this.get(key);
        if (cached !== null) {
          return cached;
        }
      }

      // Fetch fresh data
      const freshData = await fetchFunction();
      
      // Store in cache if enabled
      if (this.isEnabled) {
        await this.set(key, freshData, ttl);
      }
      
      return freshData;
    } catch (error) {
      logger.error('Cache getOrSet error:', error);
      // Return fresh data even if caching fails
      return await fetchFunction();
    }
  }

  /**
   * Increment counter
   */
  async incr(key, amount = 1) {
    if (!this.isEnabled) return null;
    
    try {
      const cacheKey = this.getKey(key);
      return await this.redis.incrby(cacheKey, amount);
    } catch (error) {
      logger.error('Cache incr error:', error);
      return null;
    }
  }

  /**
   * Set expiration time
   */
  async expire(key, ttl) {
    if (!this.isEnabled) return false;
    
    try {
      const cacheKey = this.getKey(key);
      await this.redis.expire(cacheKey, ttl);
      return true;
    } catch (error) {
      logger.error('Cache expire error:', error);
      return false;
    }
  }

  /**
   * Get TTL
   */
  async ttl(key) {
    if (!this.isEnabled) return -1;
    
    try {
      const cacheKey = this.getKey(key);
      return await this.redis.ttl(cacheKey);
    } catch (error) {
      logger.error('Cache TTL error:', error);
      return -1;
    }
  }

  /**
   * Cache user session
   */
  async cacheUserSession(userId, sessionData, ttl = 86400) {
    return await this.set(`session:${userId}`, sessionData, ttl);
  }

  /**
   * Get user session
   */
  async getUserSession(userId) {
    return await this.get(`session:${userId}`);
  }

  /**
   * Delete user session
   */
  async deleteUserSession(userId) {
    return await this.del(`session:${userId}`);
  }

  /**
   * Cache user tasks
   */
  async cacheUserTasks(userId, tasks, ttl = 300) {
    return await this.set(`tasks:${userId}`, tasks, ttl);
  }

  /**
   * Get user tasks
   */
  async getUserTasks(userId) {
    return await this.get(`tasks:${userId}`);
  }

  /**
   * Invalidate user tasks cache
   */
  async invalidateUserTasks(userId) {
    return await this.del(`tasks:${userId}`);
  }

  /**
   * Cache dashboard stats
   */
  async cacheDashboardStats(userId, stats, ttl = 600) {
    return await this.set(`dashboard:${userId}`, stats, ttl);
  }

  /**
   * Get dashboard stats
   */
  async getDashboardStats(userId) {
    return await this.get(`dashboard:${userId}`);
  }

  /**
   * Cache AI response
   */
  async cacheAIResponse(hash, response, ttl = 3600) {
    return await this.set(`ai:${hash}`, response, ttl);
  }

  /**
   * Get AI response
   */
  async getAIResponse(hash) {
    return await this.get(`ai:${hash}`);
  }

  /**
   * Flush all cache
   */
  async flushAll() {
    if (!this.isEnabled) return false;
    
    try {
      await this.redis.flushdb();
      logger.warn('⚠️ All cache flushed');
      return true;
    } catch (error) {
      logger.error('Cache flush error:', error);
      return false;
    }
  }

  /**
   * Get cache stats
   */
  async getStats() {
    if (!this.isEnabled) {
      return {
        enabled: false,
        message: 'Cache is disabled'
      };
    }
    
    try {
      const info = await this.redis.info('stats');
      const dbSize = await this.redis.dbsize();
      
      return {
        enabled: true,
        dbSize,
        info
      };
    } catch (error) {
      logger.error('Cache stats error:', error);
      return null;
    }
  }
}

export default new CacheService();
