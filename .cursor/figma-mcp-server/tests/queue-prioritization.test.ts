/**
 * Tests for queue prioritization features
 */

import { CommandQueue } from "../src/queue/manager.js";
import { Priority } from "../src/queue/types.js";
import { createMockCommand } from "./helpers/command-helpers.js";

describe("CommandQueue Prioritization", () => {
  let queue: CommandQueue;

  beforeEach(() => {
    queue = new CommandQueue();
  });

  describe("add with priority", () => {
    it("should add command with priority", () => {
      const command = createMockCommand("cmd-1");
      const id = queue.add(command, "file-123", undefined, "interactive");

      const queued = queue.get(id);
      expect(queued?.priority).toBe("interactive");
    });

    it("should default to batch priority when not specified", () => {
      const command = createMockCommand("cmd-1");
      const id = queue.add(command, "file-123");

      const queued = queue.get(id);
      expect(queued?.priority).toBe("batch");
    });
  });

  describe("enqueueWithPriority", () => {
    it("should add command with explicit priority", () => {
      const command = createMockCommand("cmd-1");
      const id = queue.enqueueWithPriority(command, "file-123", "interactive");

      const queued = queue.get(id);
      expect(queued?.priority).toBe("interactive");
    });
  });

  describe("getNext with priority", () => {
    it("should return highest priority command first", () => {
      const cmd1 = createMockCommand("cmd-1");
      const cmd2 = createMockCommand("cmd-2");
      const cmd3 = createMockCommand("cmd-3");

      // Add in different order
      queue.add(cmd3, "file-123", undefined, "low");
      queue.add(cmd1, "file-123", undefined, "interactive");
      queue.add(cmd2, "file-123", undefined, "batch");

      const next = queue.getNext();
      expect(next?.command.id).toBe("cmd-1"); // interactive first
    });

    it("should respect FIFO within same priority", () => {
      const cmd1 = createMockCommand("cmd-1");
      const cmd2 = createMockCommand("cmd-2");
      const cmd3 = createMockCommand("cmd-3");

      queue.add(cmd1, "file-123", undefined, "batch");
      queue.add(cmd2, "file-123", undefined, "batch");
      queue.add(cmd3, "file-123", undefined, "batch");

      const next1 = queue.getNext();
      expect(next1?.command.id).toBe("cmd-1");

      queue.updateStatus("cmd-1", "posted");
      const next2 = queue.getNext();
      expect(next2?.command.id).toBe("cmd-2");
    });

    it("should filter by allowed priorities", () => {
      const cmd1 = createMockCommand("cmd-1");
      const cmd2 = createMockCommand("cmd-2");

      queue.add(cmd1, "file-123", undefined, "interactive");
      queue.add(cmd2, "file-123", undefined, "low");

      // Only allow batch priority
      const next = queue.getNext(["batch"]);
      expect(next).toBeNull(); // No batch priority commands
    });

    it("should return null when no pending commands", () => {
      const next = queue.getNext();
      expect(next).toBeNull();
    });
  });

  describe("getStats with priority", () => {
    it("should include priority breakdown in stats", () => {
      const cmd1 = createMockCommand("cmd-1");
      const cmd2 = createMockCommand("cmd-2");
      const cmd3 = createMockCommand("cmd-3");

      queue.add(cmd1, "file-123", undefined, "interactive");
      queue.add(cmd2, "file-123", undefined, "batch");
      queue.add(cmd3, "file-123", undefined, "interactive");

      const stats = queue.getStats();

      expect(stats.byPriority).toBeDefined();
      expect(stats.byPriority?.interactive).toBe(2);
      expect(stats.byPriority?.batch).toBe(1);
      expect(stats.byPriority?.refactor).toBe(0);
      expect(stats.byPriority?.low).toBe(0);
    });

    it("should handle commands without priority in stats", () => {
      const cmd1 = createMockCommand("cmd-1");
      queue.add(cmd1, "file-123"); // No priority specified

      const stats = queue.getStats();
      expect(stats.byPriority?.batch).toBe(1);
    });
  });

  describe("backward compatibility", () => {
    it("should work with existing add() calls without priority", () => {
      const command = createMockCommand("cmd-1");
      const id = queue.add(command, "file-123", 30000);

      const queued = queue.get(id);
      expect(queued).toBeDefined();
      expect(queued?.priority).toBe("batch"); // Defaults to batch
    });
  });
});
