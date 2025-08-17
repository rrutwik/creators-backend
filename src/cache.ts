import { LRUCache } from 'lru-cache';

// Basic in-memory cache singleton using lru-cache
// TTL is in milliseconds
const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes
const DEFAULT_MAX_ITEMS = 1000;

export type CacheKey = string;

export interface CacheOptions {
  ttl?: number; // ms
  max?: number; // number of items
}

class InMemoryCache {
  private cache: LRUCache<CacheKey, unknown>;

  constructor(options?: CacheOptions) {
    this.cache = new LRUCache<CacheKey, unknown>({
      ttl: options?.ttl ?? DEFAULT_TTL_MS,
      max: options?.max ?? DEFAULT_MAX_ITEMS,
      allowStale: false,
      updateAgeOnGet: false,
      updateAgeOnHas: false,
    });
  }

  public get<T = unknown>(key: CacheKey): T | undefined {
    return this.cache.get(key) as T | undefined;
  }

  public set<T = unknown>(key: CacheKey, value: T, ttlMs?: number): void {
    if (ttlMs && ttlMs > 0) {
      this.cache.set(key, value as unknown, { ttl: ttlMs });
    } else {
      this.cache.set(key, value as unknown);
    }
  }

  public del(key: CacheKey): void {
    this.cache.delete(key);
  }

  public clear(): void {
    this.cache.clear();
  }

  // Helper: cache a promise-producing function ("wrap")
  // Example:
  //   const data = await cache.wrap(`user:${id}`, () => fetchUser(id), 60_000)
  public async wrap<T>(key: CacheKey, factory: () => Promise<T>, ttlMs?: number): Promise<T> {
    const hit = this.get<T>(key);
    if (hit !== undefined) return hit;
    const value = await factory();
    this.set<T>(key, value, ttlMs);
    return value;
  }
}

// Export a default singleton instance
export const cache = new InMemoryCache();

// Also export the class in case a custom instance is needed
export default InMemoryCache;
