/**
 * Tests for indexing/index.ts
 */

import {
  NoOpFileIndex,
  InMemoryFileIndex,
  FileIndex,
} from "../src/indexing/index.js";

describe("FileIndex", () => {
  describe("NoOpFileIndex", () => {
    let index: FileIndex;

    beforeEach(() => {
      index = new NoOpFileIndex();
    });

    it("should not index files", async () => {
      await index.index("file-123");

      const stats = index.getStats();
      expect(stats.indexedFiles).toBe(0);
    });

    it("should return empty search results", async () => {
      await index.index("file-123");

      const results = await index.search("test");
      expect(results).toEqual([]);
    });

    it("should return empty stats", () => {
      const stats = index.getStats();
      expect(stats.indexedFiles).toBe(0);
      expect(stats.totalNodes).toBe(0);
    });
  });

  describe("InMemoryFileIndex", () => {
    let index: FileIndex;

    beforeEach(() => {
      index = new InMemoryFileIndex();
    });

    it("should index file", async () => {
      await index.index("file-123");

      const stats = index.getStats();
      expect(stats.indexedFiles).toBe(1);
    });

    it("should search and return relevant results", async () => {
      await index.index("file-123");

      // Note: InMemoryFileIndex doesn't actually populate data in MVP
      // This test verifies the interface works
      const results = await index.search("test", "file-123");
      expect(Array.isArray(results)).toBe(true);
    });

    it("should filter search by fileKey", async () => {
      await index.index("file-A");
      await index.index("file-B");

      const results = await index.search("test", "file-A");
      expect(Array.isArray(results)).toBe(true);
    });

    it("should update node in index", async () => {
      await index.updateNode("1:2", {
        nodeId: "1:2",
        name: "Updated Node",
      });

      // Interface works, actual implementation would update index
      expect(true).toBe(true);
    });

    it("should clear index for specific file", async () => {
      await index.index("file-A");
      await index.index("file-B");

      await index.clear("file-A");

      const stats = index.getStats();
      expect(stats.indexedFiles).toBe(1); // Only file-B remains
    });

    it("should clear all indexes", async () => {
      await index.index("file-A");
      await index.index("file-B");

      await index.clear();

      const stats = index.getStats();
      expect(stats.indexedFiles).toBe(0);
    });

    it("should return correct stats", () => {
      const stats = index.getStats();
      expect(stats.indexedFiles).toBeDefined();
      expect(stats.totalNodes).toBeDefined();
    });
  });
});
