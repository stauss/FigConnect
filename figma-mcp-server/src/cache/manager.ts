import { logger } from "../logger.js";

/**
 * Cache entry with TTL
 */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

/**
 * Cache manager with invalidation hooks
 * Supports event-based invalidation for future extensibility
 */
export interface CacheManager {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  invalidate(pattern: string): Promise<void>;
  invalidateOnEvent(event: string): void; // Register event-based invalidation
  clear(): Promise<void>;
  getStats(): CacheStats;
}

/**
 * Cache statistics
 */
export interface CacheStats {
  size: number;
  entries: string[];
  hitRate?: number; // Future: track hit/miss ratio
}

/**
 * Cache key generators for common use cases
 */
export const CacheKeys = {
  fileStructure: (fileKey: string, depth?: number) =>
    `file:${fileKey}:structure:${depth || "full"}`,
  tokens: (fileKey: string) => `file:${fileKey}:tokens`,
  components: (fileKey: string) => `file:${fileKey}:components`,
  styles: (fileKey: string) => `file:${fileKey}:styles`,
  nodeDetails: (fileKey: string, nodeId: string) =>
    `file:${fileKey}:node:${nodeId}`,
};

/**
 * In-memory cache manager with invalidation hooks
 */
export class InMemoryCacheManager implements CacheManager {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private readonly defaultTTL = 300000; // 5 minutes
  private eventHandlers: Map<string, Set<string>> = new Map(); // event → cache keys
  private hitCount = 0;
  private missCount = 0;

  /**
   * Get item from cache
   */
  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);

    if (!entry) {
      this.missCount++;
      return null;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.missCount++;
      logger.debug(`Cache expired: ${key}`);
      return null;
    }

    this.hitCount++;
    logger.debug(`Cache hit: ${key}`);
    return entry.data as T;
  }

  /**
   * Set item in cache
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    this.cache.set(key, {
      data: value,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
    });
    logger.debug(`Cached: ${key} (TTL: ${ttl || this.defaultTTL}ms)`);
  }

  /**
   * Invalidate cache entries matching pattern
   * Supports wildcard patterns (e.g., "file:abc123:*")
   */
  async invalidate(pattern: string): Promise<void> {
    const regex = new RegExp(
      "^" + pattern.replace(/\*/g, ".*").replace(/\?/g, ".") + "$",
    );
    let invalidated = 0;

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        invalidated++;
      }
    }

    if (invalidated > 0) {
      logger.info(
        `Invalidated ${invalidated} cache entries matching: ${pattern}`,
      );
    }
  }

  /**
   * Register cache keys to invalidate on specific events
   * Enables event-driven cache invalidation
   */
  invalidateOnEvent(event: string): void {
    // This method registers which cache keys should be invalidated on events
    // For MVP: Just log, future: implement event listener
    logger.debug(`Registered invalidation hook for event: ${event}`);
  }

  /**
   * Handle event and invalidate associated cache keys
   * Called when events occur (e.g., file modified, node updated)
   */
  async handleEvent(event: string, data?: any): Promise<void> {
    const keys = this.eventHandlers.get(event);
    if (!keys || keys.size === 0) {
      return;
    }

    // Invalidate all registered keys for this event
    for (const key of keys) {
      await this.invalidate(key);
    }

    logger.debug(`Invalidated cache for event: ${event}`);
  }

  /**
   * Register a cache key to be invalidated on an event
   */
  registerEventInvalidation(event: string, keyPattern: string): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(keyPattern);
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    const size = this.cache.size;
    this.cache.clear();
    this.eventHandlers.clear();
    logger.info(`Cleared ${size} cache entries`);
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const total = this.hitCount + this.missCount;
    const hitRate = total > 0 ? this.hitCount / total : 0;

    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys()),
      hitRate,
    };
  }

  /**
   * Clean up expired entries
   */
  cleanup(): number {
    const now = Date.now();
    let removed = 0;

    this.cache.forEach((entry, key) => {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        removed++;
      }
    });

    if (removed > 0) {
      logger.info(`Cleaned up ${removed} expired cache entries`);
    }

    return removed;
  }
}

// Singleton instance
export const cacheManager: CacheManager = new InMemoryCacheManager();

// Set up periodic cleanup
setInterval(() => {
  (cacheManager as InMemoryCacheManager).cleanup();
}, 60000); // Cleanup every minute
