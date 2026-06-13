const INSIGHT_CACHE_TTL_MS = 15 * 60 * 1000;
const insightCache = new Map();

export function getInsightCache(cacheKey) {
  const hit = insightCache.get(String(cacheKey));
  if (!hit || Date.now() > hit.expiresAt) {
    insightCache.delete(String(cacheKey));
    return null;
  }
  return hit.payload;
}

export function setInsightCache(cacheKey, payload) {
  insightCache.set(String(cacheKey), {
    payload,
    expiresAt: Date.now() + INSIGHT_CACHE_TTL_MS
  });
}

export function withTimeout(promise, ms, label = 'operation') {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`${label} timed out after ${ms}ms`));
    }, ms);

    Promise.resolve(promise)
      .then(value => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch(error => {
        clearTimeout(timer);
        reject(error);
      });
  });
}
