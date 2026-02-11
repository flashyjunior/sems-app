/**
 * Analytics Caching Utilities
 * Provides in-memory caching for analytics queries
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // time-to-live in seconds
}

class AnalyticsCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    // Cleanup expired entries every 5 minutes
    this.startCleanupInterval();
  }

  /**
   * Generate cache key from parameters
   */
  private generateKey(prefix: string, params: Record<string, any>): string {
    const sorted = Object.keys(params)
      .sort()
      .map(k => `${k}=${params[k]}`)
      .join('&');
    return `${prefix}:${sorted}`;
  }

  /**
   * Set cache value
   */
  set<T>(prefix: string, params: Record<string, any>, data: T, ttlSeconds: number = 600): void {
    const key = this.generateKey(prefix, params);
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlSeconds,
    });
  }

  /**
   * Get cache value if not expired
   */
  get<T>(prefix: string, params: Record<string, any>): T | null {
    const key = this.generateKey(prefix, params);
    const entry = this.cache.get(key);

    if (!entry) return null;

    const age = (Date.now() - entry.timestamp) / 1000;
    if (age > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Clear all cache for a prefix
   */
  clearByPrefix(prefix: string): void {
    for (const [key] of this.cache) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): { entries: number; memoryUsage: number } {
    return {
      entries: this.cache.size,
      memoryUsage: Math.round(
        JSON.stringify(Array.from(this.cache.entries())).length / 1024
      ), // KB
    };
  }

  /**
   * Start cleanup interval
   */
  private startCleanupInterval(): void {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      let cleaned = 0;

      for (const [key, entry] of this.cache) {
        const age = (now - entry.timestamp) / 1000;
        if (age > entry.ttl) {
          this.cache.delete(key);
          cleaned++;
        }
      }

      if (cleaned > 0) {
        console.log(`[Analytics Cache] Cleaned ${cleaned} expired entries`);
      }
    }, 5 * 60 * 1000); // 5 minutes
  }

  /**
   * Stop cleanup interval
   */
  stopCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

// Singleton instance
export const analyticsCache = new AnalyticsCache();

/**
 * Decorator for caching API responses
 */
export function CacheAnalytics(prefix: string, ttlSeconds: number = 600) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function(...args: any[]) {
      // Extract params from first argument (usually the request object)
      const req = args[0];
      const params = {
        startDate: req.query?.startDate,
        endDate: req.query?.endDate,
        pharmacyId: req.query?.pharmacyId,
        severity: req.query?.severity,
      };

      // Check cache
      const cached = analyticsCache.get(prefix, params);
      if (cached) {
        console.log(`[Cache Hit] ${prefix}`);
        return cached;
      }

      // Execute original method
      const result = await originalMethod.apply(this, args);

      // Cache the result
      analyticsCache.set(prefix, params, result, ttlSeconds);
      console.log(`[Cache Set] ${prefix} (TTL: ${ttlSeconds}s)`);

      return result;
    };

    return descriptor;
  };
}

/**
 * Middleware for caching Next.js API responses
 */
export function withAnalyticsCache(
  handler: (req: any, res: any) => Promise<void>,
  prefix: string,
  ttlSeconds: number = 600
) {
  return async (req: any, res: any) => {
    // Extract query parameters
    const params = {
      startDate: req.query?.startDate,
      endDate: req.query?.endDate,
      pharmacyId: req.query?.pharmacyId,
      severity: req.query?.severity,
      limit: req.query?.limit,
    };

    // Check cache
    const cached = analyticsCache.get(prefix, params);
    if (cached) {
      console.log(`[Cache Hit] ${prefix}`);
      res.status(200).json(cached);
      return;
    }

    // Intercept response
    const originalJson = res.json;
    res.json = function(data: any) {
      // Cache the response
      analyticsCache.set(prefix, params, data, ttlSeconds);
      console.log(`[Cache Set] ${prefix} (TTL: ${ttlSeconds}s)`);

      return originalJson.call(this, data);
    };

    // Call original handler
    await handler(req, res);
  };
}

export default analyticsCache;
