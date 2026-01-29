import { logger } from "../logger.js";

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

/**
 * Simple in-memory cache with TTL support
 */
export class CacheManager {
  private cache: Map<string, CacheEntry<any>> = new Map();

  /**
   * Get cached value if not expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    const age = Date.now() - entry.timestamp;
    if (age > entry.ttl) {
      // Expired, remove it
      this.cache.delete(key);
      logger.debug(`Cache expired for key: ${key}`);
      return null;
    }

    logger.debug(`Cache hit for key: ${key} (age: ${age}ms)`);
    return entry.data as T;
  }

  /**
   * Set cached value with TTL
   */
  set<T>(key: string, data: T, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
    logger.debug(`Cache set for key: ${key} (TTL: ${ttl}ms)`);
  }

  /**
   * Invalidate cache entry
   */
  invalidate(key: string): void {
    if (this.cache.delete(key)) {
      logger.debug(`Cache invalidated for key: ${key}`);
    }
  }

  /**
   * Invalidate all cache entries matching a pattern
   */
  invalidatePattern(pattern: string): void {
    let count = 0;
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
        count++;
      }
    }
    if (count > 0) {
      logger.debug(
        `Cache invalidated ${count} entries matching pattern: ${pattern}`,
      );
    }
  }

  /**
   * Clear all cache
   */
  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    logger.debug(`Cache cleared (${size} entries)`);
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Singleton instance
export const cacheManager = new CacheManager();
