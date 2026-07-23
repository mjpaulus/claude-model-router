// Async cache with TTL. get(key) dedupes concurrent calls for the same key
// and caches results for ttlMs.
export function createCache(fetcher, ttlMs) {
  const entries = new Map();

  return {
    get(key) {
      const now = Date.now();
      const entry = entries.get(key);
      if (entry && now - entry.time < ttlMs) {
        return entry.promise;
      }
      const promise = fetcher(key);
      const newEntry = { promise, time: now };
      entries.set(key, newEntry);
      promise.catch(() => {
        if (entries.get(key) === newEntry) entries.delete(key);
      });
      return promise;
    },
  };
}
