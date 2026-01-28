/**
 * Tests for artifacts/storage.ts
 */

import {
  NoOpArtifactStorage,
  InMemoryArtifactStorage,
  ArtifactStorage,
} from "../src/artifacts/storage.js";
import { Artifact, ArtifactType } from "../src/artifacts/types.js";

describe("ArtifactStorage", () => {
  describe("NoOpArtifactStorage", () => {
    let storage: ArtifactStorage;

    beforeEach(() => {
      storage = new NoOpArtifactStorage();
    });

    it("should return artifact ID on save without persisting", async () => {
      const artifact: Artifact = {
        id: "art-123",
        taskId: "task-123",
        type: "node_ids",
        data: { nodeIds: ["1:2"] },
        metadata: { timestamp: new Date().toISOString() },
      };

      const id = await storage.save(artifact);
      expect(id).toBe("art-123");

      // Verify not persisted
      const retrieved = await storage.get("art-123");
      expect(retrieved).toBeNull();
    });

    it("should return null for get", async () => {
      const result = await storage.get("art-123");
      expect(result).toBeNull();
    });

    it("should return empty array for findByTaskId", async () => {
      const result = await storage.findByTaskId("task-123");
      expect(result).toEqual([]);
    });

    it("should return empty array for query", async () => {
      const result = await storage.query({});
      expect(result).toEqual([]);
    });

    it("should return false for delete", async () => {
      const result = await storage.delete("art-123");
      expect(result).toBe(false);
    });
  });

  describe("InMemoryArtifactStorage", () => {
    let storage: ArtifactStorage;

    beforeEach(() => {
      storage = new InMemoryArtifactStorage();
    });

    it("should save and retrieve artifacts", async () => {
      const artifact: Artifact = {
        id: "art-123",
        taskId: "task-123",
        type: "node_ids",
        data: { nodeIds: ["1:2", "3:4"] },
        metadata: {
          timestamp: new Date().toISOString(),
          fileKey: "file-123",
        },
      };

      const id = await storage.save(artifact);
      expect(id).toBe("art-123");

      const retrieved = await storage.get("art-123");
      expect(retrieved).toEqual(artifact);
    });

    it("should find artifacts by task ID", async () => {
      const art1: Artifact = {
        id: "art-1",
        taskId: "task-123",
        type: "node_ids",
        data: {},
        metadata: { timestamp: new Date().toISOString() },
      };

      const art2: Artifact = {
        id: "art-2",
        taskId: "task-123",
        type: "diff",
        data: {},
        metadata: { timestamp: new Date().toISOString() },
      };

      const art3: Artifact = {
        id: "art-3",
        taskId: "task-456",
        type: "node_ids",
        data: {},
        metadata: { timestamp: new Date().toISOString() },
      };

      await storage.save(art1);
      await storage.save(art2);
      await storage.save(art3);

      const taskArtifacts = await storage.findByTaskId("task-123");
      expect(taskArtifacts).toHaveLength(2);
      expect(taskArtifacts.map((a) => a.id)).toContain("art-1");
      expect(taskArtifacts.map((a) => a.id)).toContain("art-2");
    });

    it("should query artifacts by type", async () => {
      const art1: Artifact = {
        id: "art-1",
        taskId: "task-123",
        type: "node_ids",
        data: {},
        metadata: { timestamp: new Date().toISOString() },
      };

      const art2: Artifact = {
        id: "art-2",
        taskId: "task-123",
        type: "diff",
        data: {},
        metadata: { timestamp: new Date().toISOString() },
      };

      await storage.save(art1);
      await storage.save(art2);

      const nodeIds = await storage.query({ type: "node_ids" });
      expect(nodeIds).toHaveLength(1);
      expect(nodeIds[0].id).toBe("art-1");
    });

    it("should query artifacts by fileKey", async () => {
      const art1: Artifact = {
        id: "art-1",
        taskId: "task-123",
        type: "node_ids",
        data: {},
        metadata: {
          timestamp: new Date().toISOString(),
          fileKey: "file-A",
        },
      };

      const art2: Artifact = {
        id: "art-2",
        taskId: "task-123",
        type: "node_ids",
        data: {},
        metadata: {
          timestamp: new Date().toISOString(),
          fileKey: "file-B",
        },
      };

      await storage.save(art1);
      await storage.save(art2);

      const fileA = await storage.query({ fileKey: "file-A" });
      expect(fileA).toHaveLength(1);
      expect(fileA[0].id).toBe("art-1");
    });

    it("should query artifacts by date range", async () => {
      const now = new Date();
      const art1: Artifact = {
        id: "art-1",
        taskId: "task-123",
        type: "node_ids",
        data: {},
        metadata: {
          timestamp: new Date(now.getTime() - 2000).toISOString(), // 2 seconds ago
        },
      };

      const art2: Artifact = {
        id: "art-2",
        taskId: "task-123",
        type: "node_ids",
        data: {},
        metadata: {
          timestamp: new Date(now.getTime() - 5000).toISOString(), // 5 seconds ago
        },
      };

      await storage.save(art1);
      await storage.save(art2);

      const recent = await storage.query({
        createdAfter: new Date(now.getTime() - 3000).toISOString(),
      });
      expect(recent).toHaveLength(1);
      expect(recent[0].id).toBe("art-1");
    });

    it("should delete artifacts", async () => {
      const artifact: Artifact = {
        id: "art-123",
        taskId: "task-123",
        type: "node_ids",
        data: {},
        metadata: { timestamp: new Date().toISOString() },
      };

      await storage.save(artifact);
      expect(await storage.get("art-123")).not.toBeNull();

      const deleted = await storage.delete("art-123");
      expect(deleted).toBe(true);
      expect(await storage.get("art-123")).toBeNull();
    });

    it("should return false when deleting non-existent artifact", async () => {
      const deleted = await storage.delete("non-existent");
      expect(deleted).toBe(false);
    });

    it("should remove artifact from task index on delete", async () => {
      const artifact: Artifact = {
        id: "art-123",
        taskId: "task-123",
        type: "node_ids",
        data: {},
        metadata: { timestamp: new Date().toISOString() },
      };

      await storage.save(artifact);
      expect(await storage.findByTaskId("task-123")).toHaveLength(1);

      await storage.delete("art-123");
      expect(await storage.findByTaskId("task-123")).toHaveLength(0);
    });
  });
});
