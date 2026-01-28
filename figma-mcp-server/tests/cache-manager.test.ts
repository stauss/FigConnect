/**
 * Tests for cache/manager.ts
 */

import {
  InMemoryCacheManager,
  type CacheManager,
  CacheKeys,
} from "../src/cache/manager.js";

describe("CacheManager", () => {
  let cache: CacheManager;

  beforeEach(() => {
    cache = new InMemoryCacheManager();
  });

  describe("get and set", () => {
    it("should get and set cache entries", async () => {
      await cache.set("test-key", { data: "test-value" });

      const value = await cache.get("test-key");
      expect(value).toEqual({ data: "test-value" });
    });

    it("should return null for non-existent key", async () => {
      const value = await cache.get("non-existent");
      expect(value).toBeNull();
    });

    it("should expire entries after TTL", async () => {
      await cache.set("test-key", { data: "test" }, 10); // 10ms TTL

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 20));

      const value = await cache.get("test-key");
      expect(value).toBeNull();
    });

    it("should use default TTL when not specified", async () => {
      await cache.set("test-key", { data: "test" });

      // Entry should still exist (default TTL is 5 minutes)
      const value = await cache.get("test-key");
      expect(value).not.toBeNull();
    });
  });

  describe("invalidate", () => {
    beforeEach(async () => {
      await cache.set("file:abc:structure", {});
      await cache.set("file:abc:tokens", {});
      await cache.set("file:xyz:structure", {});
    });

    it("should invalidate by exact key", async () => {
      await cache.invalidate("file:abc:structure");

      expect(await cache.get("file:abc:structure")).toBeNull();
      expect(await cache.get("file:abc:tokens")).not.toBeNull();
    });

    it("should invalidate by pattern (wildcard)", async () => {
      await cache.invalidate("file:abc:*");

      expect(await cache.get("file:abc:structure")).toBeNull();
      expect(await cache.get("file:abc:tokens")).toBeNull();
      expect(await cache.get("file:xyz:structure")).not.toBeNull();
    });

    it("should handle pattern with question mark", async () => {
      await cache.set("file:abc:node:1", {});
      await cache.set("file:abc:node:2", {});

      await cache.invalidate("file:abc:node:?");

      // Question mark matches single character
      expect(await cache.get("file:abc:node:1")).toBeNull();
      expect(await cache.get("file:abc:node:2")).toBeNull();
    });
  });

  describe("event-based invalidation", () => {
    it("should register event invalidation", () => {
      const manager = cache as InMemoryCacheManager;
      manager.registerEventInvalidation("file.modified", "file:abc:*");

      // Event handler should be registered
      const handlers = (manager as any).eventHandlers;
      expect(handlers.has("file.modified")).toBe(true);
    });

    it("should invalidate on event", async () => {
      const manager = cache as InMemoryCacheManager;

      await cache.set("file:abc:structure", {});
      manager.registerEventInvalidation("file.modified", "file:abc:*");

      await manager.handleEvent("file.modified");

      expect(await cache.get("file:abc:structure")).toBeNull();
    });

    it("should not invalidate on unregistered event", async () => {
      const manager = cache as InMemoryCacheManager;

      await cache.set("file:abc:structure", {});
      await manager.handleEvent("unregistered.event");

      expect(await cache.get("file:abc:structure")).not.toBeNull();
    });
  });

  describe("getStats", () => {
    it("should return cache statistics", async () => {
      await cache.set("key-1", {});
      await cache.set("key-2", {});

      const stats = cache.getStats();

      expect(stats.size).toBe(2);
      expect(stats.entries).toContain("key-1");
      expect(stats.entries).toContain("key-2");
    });

    it("should track hit rate", async () => {
      await cache.set("key-1", { data: "test" });

      await cache.get("key-1"); // Hit
      await cache.get("key-1"); // Hit
      await cache.get("non-existent"); // Miss

      const stats = cache.getStats();
      expect(stats.hitRate).toBeDefined();
      expect(stats.hitRate).toBeGreaterThan(0);
    });
  });

  describe("clear", () => {
    it("should clear all cache entries", async () => {
      await cache.set("key-1", {});
      await cache.set("key-2", {});

      await cache.clear();

      expect(await cache.get("key-1")).toBeNull();
      expect(await cache.get("key-2")).toBeNull();
      expect(cache.getStats().size).toBe(0);
    });
  });

  describe("CacheKeys helpers", () => {
    it("should generate file structure cache key", () => {
      const key = CacheKeys.fileStructure("file-123", 3);
      expect(key).toBe("file:file-123:structure:3");
    });

    it("should generate tokens cache key", () => {
      const key = CacheKeys.tokens("file-123");
      expect(key).toBe("file:file-123:tokens");
    });

    it("should generate components cache key", () => {
      const key = CacheKeys.components("file-123");
      expect(key).toBe("file:file-123:components");
    });
  });
});
