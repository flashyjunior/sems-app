class AnalyticsCache {
  private cache: Map<string, any>;
  constructor() {
    this.cache = new Map();
  }

  get(key: string) {
    return this.cache.get(key);
  }

  set(key: string, a: any, b?: any, ttlSeconds?: number) {
    // Support two call patterns:
    // 1) set(key, value)
    // 2) set(key, meta, value, ttlSeconds)
    let meta: any = undefined;
    let value: any = undefined;
    if (b === undefined) {
      value = a;
    } else {
      meta = a;
      value = b;
    }

    const entry: any = { value, meta };
    if (ttlSeconds && typeof ttlSeconds === 'number') {
      entry.expiry = Date.now() + ttlSeconds * 1000;
    }

    this.cache.set(key, entry);
  }

  has(key: string) {
    return this.cache.has(key);
  }

  delete(key: string) {
    return this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }
}

const analyticsCache = new AnalyticsCache();
export default analyticsCache;
