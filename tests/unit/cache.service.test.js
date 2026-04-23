/**
 * Cache service unit tests — Redis is mocked via jest.unstable_mockModule (ESM)
 */
import { jest } from '@jest/globals';

// In-memory store
const store = new Map();
const expiries = new Map();

jest.unstable_mockModule('ioredis', () => {
  const instance = {
    on:      () => {},
    setex:   async (key, ttl, value) => { store.set(key, value); expiries.set(key, ttl); return 'OK'; },
    set:     async (key, value)      => { store.set(key, value); return 'OK'; },
    get:     async (key)             => store.get(key) ?? null,
    del:     async (...keys)         => { keys.forEach(k => store.delete(k)); return keys.length; },
    keys:    async (pattern)         => {
      const prefix = pattern.replace(/\*/g, '');
      return [...store.keys()].filter(k => k.startsWith(prefix));
    },
    exists:  async (key)        => store.has(key) ? 1 : 0,
    expire:  async (key, ttl)   => { expiries.set(key, ttl); return 1; },
    ttl:     async (key)        => expiries.get(key) ?? -1,
    incrby:  async (key, n)     => {
      const v = parseInt(store.get(key) ?? '0') + n;
      store.set(key, String(v));
      return v;
    },
    info:    async () => 'mock info',
    dbsize:  async () => store.size,
    flushdb: async () => { store.clear(); expiries.clear(); return 'OK'; },
    ping:    async () => 'PONG',
    quit:    async () => 'OK',
    options: { host: 'localhost', port: 6379 }
  };
  return { default: () => instance };
});

jest.unstable_mockModule('../../src/config/redis.js', () => {
  const instance = {
    on:      () => {},
    setex:   async (key, ttl, value) => { store.set(key, value); expiries.set(key, ttl); return 'OK'; },
    set:     async (key, value)      => { store.set(key, value); return 'OK'; },
    get:     async (key)             => store.get(key) ?? null,
    del:     async (...keys)         => { keys.forEach(k => store.delete(k)); return keys.length; },
    keys:    async (pattern)         => {
      const prefix = pattern.replace(/\*/g, '');
      return [...store.keys()].filter(k => k.startsWith(prefix));
    },
    exists:  async (key)        => store.has(key) ? 1 : 0,
    expire:  async (key, ttl)   => { expiries.set(key, ttl); return 1; },
    ttl:     async (key)        => expiries.get(key) ?? -1,
    incrby:  async (key, n)     => {
      const v = parseInt(store.get(key) ?? '0') + n;
      store.set(key, String(v));
      return v;
    },
    info:    async () => 'mock info',
    dbsize:  async () => store.size,
    flushdb: async () => { store.clear(); expiries.clear(); return 'OK'; },
    ping:    async () => 'PONG',
    quit:    async () => 'OK',
    options: { host: 'localhost', port: 6379 }
  };
  return {
    default: {
      connect:     () => {},
      getClient:   () => instance,
      isConnected: true,
      disconnect:  async () => {}
    }
  };
});

const { default: cacheService } = await import('../../src/services/cache.service.js');

// Inject the mock redis directly
cacheService.redis = {
  on:      () => {},
  setex:   async (key, ttl, value) => { store.set(key, value); expiries.set(key, ttl); return 'OK'; },
  set:     async (key, value)      => { store.set(key, value); return 'OK'; },
  get:     async (key)             => store.get(key) ?? null,
  del:     async (...keys)         => { keys.forEach(k => store.delete(k)); return keys.length; },
  keys:    async (pattern)         => {
    const prefix = pattern.replace(/\*/g, '');
    return [...store.keys()].filter(k => k.startsWith(prefix));
  },
  exists:  async (key)        => store.has(key) ? 1 : 0,
  expire:  async (key, ttl)   => { expiries.set(key, ttl); return 1; },
  ttl:     async (key)        => expiries.get(key) ?? -1,
  incrby:  async (key, n)     => {
    const v = parseInt(store.get(key) ?? '0') + n;
    store.set(key, String(v));
    return v;
  },
  info:    async () => 'mock info',
  dbsize:  async () => store.size,
  flushdb: async () => { store.clear(); expiries.clear(); return 'OK'; }
};

describe('CacheService', () => {
  beforeEach(() => {
    store.clear();
    expiries.clear();
  });

  describe('set / get', () => {
    it('should store and retrieve a value', async () => {
      await cacheService.set('test:key', { foo: 'bar' }, 60);
      expect(await cacheService.get('test:key')).toEqual({ foo: 'bar' });
    });

    it('should return null for missing key', async () => {
      expect(await cacheService.get('test:missing')).toBeNull();
    });

    it('should store arrays', async () => {
      await cacheService.set('test:arr', [1, 2, 3], 60);
      expect(await cacheService.get('test:arr')).toEqual([1, 2, 3]);
    });
  });

  describe('del', () => {
    it('should delete a key', async () => {
      await cacheService.set('test:del', 'value', 60);
      await cacheService.del('test:del');
      expect(await cacheService.get('test:del')).toBeNull();
    });
  });

  describe('exists', () => {
    it('should return true for existing key', async () => {
      await cacheService.set('test:exists', 'yes', 60);
      expect(await cacheService.exists('test:exists')).toBe(true);
    });

    it('should return false for missing key', async () => {
      expect(await cacheService.exists('test:nope')).toBe(false);
    });
  });

  describe('getOrSet', () => {
    it('should call fetchFunction on cache miss', async () => {
      let called = 0;
      const fetchFn = async () => { called++; return { data: 'fresh' }; };
      const result = await cacheService.getOrSet('test:getOrSet', fetchFn, 60);
      expect(called).toBe(1);
      expect(result).toEqual({ data: 'fresh' });
    });

    it('should NOT call fetchFunction on cache hit', async () => {
      await cacheService.set('test:hit', { data: 'cached' }, 60);
      let called = 0;
      const result = await cacheService.getOrSet('test:hit', async () => { called++; return {}; }, 60);
      expect(called).toBe(0);
      expect(result).toEqual({ data: 'cached' });
    });
  });

  describe('user session helpers', () => {
    it('should cache and retrieve user session', async () => {
      const session = { user_id: 1, email: 'test@example.com' };
      await cacheService.cacheUserSession(1, session);
      expect(await cacheService.getUserSession(1)).toEqual(session);
    });

    it('should delete user session', async () => {
      await cacheService.cacheUserSession(2, { user_id: 2 });
      await cacheService.deleteUserSession(2);
      expect(await cacheService.getUserSession(2)).toBeNull();
    });
  });

  describe('task cache helpers', () => {
    it('should cache and retrieve user tasks', async () => {
      const tasks = [{ task_id: 1, title: 'Task 1' }];
      await cacheService.cacheUserTasks(1, tasks);
      expect(await cacheService.getUserTasks(1)).toEqual(tasks);
    });

    it('should invalidate user tasks', async () => {
      await cacheService.cacheUserTasks(3, [{ task_id: 1 }]);
      await cacheService.invalidateUserTasks(3);
      expect(await cacheService.getUserTasks(3)).toBeNull();
    });
  });

  describe('dashboard stats helpers', () => {
    it('should cache and retrieve dashboard stats', async () => {
      const stats = { total: 10, completed: 5 };
      await cacheService.cacheDashboardStats(1, stats);
      expect(await cacheService.getDashboardStats(1)).toEqual(stats);
    });
  });

  describe('incr', () => {
    it('should increment counter', async () => {
      // Store raw string (not JSON) directly in the mock store
      // because incr bypasses JSON serialization
      store.set('voclio:test:counter', '0');
      expect(await cacheService.incr('test:counter')).toBe(1);
      expect(await cacheService.incr('test:counter')).toBe(2);
    });
  });
});
