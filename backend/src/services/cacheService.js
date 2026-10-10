/**
 * AeroMate Shared Server-Side 120-Second Cache Service
 * 
 * Requirements:
 * - 120-second TTL for frequently refreshed external data (flight status, positions, news/alerts, search)
 * - In-flight promise deduplication: Simultaneous requests share one upstream API call
 * - Resilient fallback: Returns last cached entry with `isStale: true` if an external refresh fails
 * - Parametric keying: Distinct queries maintain separate cache entries
 * - In-memory implementation: Resets on server restart and scoped to this backend instance
 */

class CacheService {
  constructor(defaultTtlMs = 120 * 1000) {
    this.defaultTtlMs = defaultTtlMs; // 120 seconds
    this.store = new Map();
    this.inFlight = new Map();
  }

  /**
   * Retrieve cached item or execute fetchFn with deduplication and stale fallback
   * @param {string} key - Unique cache key including parameters
   * @param {Function} fetchFn - Async function to fetch fresh data from upstream provider
   * @param {number} [ttlMs] - Custom TTL in milliseconds (defaults to 120,000ms / 2 minutes)
   */
  async getOrFetch(key, fetchFn, ttlMs = this.defaultTtlMs) {
    const now = Date.now();
    const existing = this.store.get(key);

    // 1. Fresh cache hit: Return immediately without upstream call
    if (existing && now < existing.expiresAt) {
      return {
        ...existing.data,
        _cache: {
          cached: true,
          isStale: false,
          lastUpdated: existing.lastUpdated,
          expiresInSec: Math.max(0, Math.round((existing.expiresAt - now) / 1000))
        }
      };
    }

    // 2. In-flight request deduplication: Reuse active upstream promise
    if (this.inFlight.has(key)) {
      return this.inFlight.get(key);
    }

    // 3. Launch single upstream request
    const promise = (async () => {
      try {
        const freshData = await fetchFn();
        const updatedAt = new Date().toISOString();

        // Store successful response in cache
        this.store.set(key, {
          data: freshData,
          lastUpdated: updatedAt,
          expiresAt: Date.now() + ttlMs
        });

        return {
          ...freshData,
          _cache: {
            cached: false,
            isStale: false,
            lastUpdated: updatedAt,
            expiresInSec: Math.round(ttlMs / 1000)
          }
        };
      } catch (err) {
        // 4. Upstream failure: If stale cache exists, return it with isStale: true
        if (existing) {
          console.warn(`⚠️ [Cache] Upstream refresh failed for "${key}". Returning last cached response (stale):`, err.message);
          return {
            ...existing.data,
            _cache: {
              cached: true,
              isStale: true,
              lastUpdated: existing.lastUpdated,
              staleReason: err.message,
              expiresInSec: 0
            }
          };
        }
        // No cached fallback available: rethrow error
        throw err;
      } finally {
        this.inFlight.delete(key);
      }
    })();

    this.inFlight.set(key, promise);
    return promise;
  }

  /**
   * Direct cache read (without fetching)
   */
  get(key) {
    const entry = this.store.get(key);
    if (!entry) return null;
    const isExpired = Date.now() >= entry.expiresAt;
    return {
      data: entry.data,
      lastUpdated: entry.lastUpdated,
      isExpired
    };
  }

  /**
   * Direct cache write
   */
  set(key, data, ttlMs = this.defaultTtlMs) {
    const updatedAt = new Date().toISOString();
    this.store.set(key, {
      data,
      lastUpdated: updatedAt,
      expiresAt: Date.now() + ttlMs
    });
  }

  /**
   * Invalidate specific key or prefix pattern
   */
  invalidate(keyOrPrefix) {
    if (this.store.has(keyOrPrefix)) {
      this.store.delete(keyOrPrefix);
      return;
    }
    for (const k of this.store.keys()) {
      if (k.startsWith(keyOrPrefix)) {
        this.store.delete(k);
      }
    }
  }

  /**
   * Diagnostic summary
   */
  getStats() {
    return {
      entriesCount: this.store.size,
      activeInFlight: this.inFlight.size,
      defaultTtlSeconds: this.defaultTtlMs / 1000
    };
  }
}

module.exports = new CacheService(120 * 1000);
