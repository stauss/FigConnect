/**
 * Tests for queue/manager.ts
 */

import { CommandQueue } from "../src/queue/manager.js";
import { BaseCommand, CommandResponse } from "../src/commands/types.js";

// Helper to create mock command
function createMockCommand(id: string = "cmd-test-123"): BaseCommand {
  return {
    type: "mcp-command",
    version: "1.0",
    id,
    command: "create_frame",
    params: { name: "Test", width: 100, height: 100 },
    timestamp: new Date().toISOString(),
  };
}

// Helper to create mock response
function createMockResponse(
  commandId: string,
  status: "success" | "error" = "success",
): CommandResponse {
  return {
    type: "mcp-response",
    commandId,
    status,
    result: status === "success" ? { nodeId: "1:2" } : undefined,
    error:
      status === "error" ? { code: "ERROR", message: "Failed" } : undefined,
    timestamp: new Date().toISOString(),
  };
}

describe("CommandQueue", () => {
  let queue: CommandQueue;

  beforeEach(() => {
    queue = new CommandQueue();
  });

  describe("add", () => {
    it("should add command to queue", () => {
      const command = createMockCommand();
      const id = queue.add(command, "file-123");

      expect(id).toBe(command.id);
      expect(queue.size).toBe(1);
    });

    it("should set initial status to pending", () => {
      const command = createMockCommand();
      queue.add(command, "file-123");

      const queued = queue.get(command.id);
      expect(queued?.status).toBe("pending");
    });

    it("should set timestamps", () => {
      const command = createMockCommand();
      const before = Date.now();
      queue.add(command, "file-123");
      const after = Date.now();

      const queued = queue.get(command.id);
      expect(queued?.createdAt).toBeGreaterThanOrEqual(before);
      expect(queued?.createdAt).toBeLessThanOrEqual(after);
      expect(queued?.updatedAt).toBeGreaterThanOrEqual(before);
    });

    it("should set timeout based on provided value", () => {
      const command = createMockCommand();
      const before = Date.now();
      queue.add(command, "file-123", 5000);

      const queued = queue.get(command.id);
      expect(queued?.timeoutAt).toBeGreaterThanOrEqual(before + 5000);
      expect(queued?.timeoutAt).toBeLessThanOrEqual(before + 5100);
    });

    it("should use default timeout when not provided", () => {
      const command = createMockCommand();
      const before = Date.now();
      queue.add(command, "file-123");

      const queued = queue.get(command.id);
      // Default is 30000ms
      expect(queued?.timeoutAt).toBeGreaterThanOrEqual(before + 30000);
    });
  });

  describe("updateStatus", () => {
    it("should update command status", () => {
      const command = createMockCommand();
      queue.add(command, "file-123");

      const result = queue.updateStatus(command.id, "posted");

      expect(result).toBe(true);
      expect(queue.get(command.id)?.status).toBe("posted");
    });

    it("should update updatedAt timestamp", () => {
      const command = createMockCommand();
      queue.add(command, "file-123");
      const before = queue.get(command.id)?.updatedAt;

      // Small delay
      queue.updateStatus(command.id, "posted");

      expect(queue.get(command.id)?.updatedAt).toBeGreaterThanOrEqual(before!);
    });

    it("should return false for non-existent command", () => {
      const result = queue.updateStatus("non-existent", "posted");
      expect(result).toBe(false);
    });

    it("should merge additional data", () => {
      const command = createMockCommand();
      queue.add(command, "file-123");

      queue.updateStatus(command.id, "posted", { commentId: "comment-456" });

      expect(queue.get(command.id)?.commentId).toBe("comment-456");
    });
  });

  describe("markPosted", () => {
    it("should mark command as posted with comment ID", () => {
      const command = createMockCommand();
      queue.add(command, "file-123");

      const result = queue.markPosted(command.id, "comment-789");

      expect(result).toBe(true);
      expect(queue.get(command.id)?.status).toBe("posted");
      expect(queue.get(command.id)?.commentId).toBe("comment-789");
    });
  });

  describe("markCompleted", () => {
    it("should mark command as completed with response", () => {
      const command = createMockCommand();
      queue.add(command, "file-123");
      const response = createMockResponse(command.id);

      const result = queue.markCompleted(command.id, response);

      expect(result).toBe(true);
      expect(queue.get(command.id)?.status).toBe("completed");
      expect(queue.get(command.id)?.response).toEqual(response);
    });
  });

  describe("markFailed", () => {
    it("should mark command as failed with response", () => {
      const command = createMockCommand();
      queue.add(command, "file-123");
      const response = createMockResponse(command.id, "error");

      const result = queue.markFailed(command.id, response);

      expect(result).toBe(true);
      expect(queue.get(command.id)?.status).toBe("failed");
      expect(queue.get(command.id)?.response?.error).toBeDefined();
    });
  });

  describe("get", () => {
    it("should return command by ID", () => {
      const command = createMockCommand();
      queue.add(command, "file-123");

      const queued = queue.get(command.id);

      expect(queued?.command.id).toBe(command.id);
      expect(queued?.fileKey).toBe("file-123");
    });

    it("should return undefined for non-existent command", () => {
      const queued = queue.get("non-existent");
      expect(queued).toBeUndefined();
    });
  });

  describe("getByStatus", () => {
    it("should return commands with matching status", () => {
      const cmd1 = createMockCommand("cmd-1");
      const cmd2 = createMockCommand("cmd-2");
      const cmd3 = createMockCommand("cmd-3");

      queue.add(cmd1, "file-123");
      queue.add(cmd2, "file-123");
      queue.add(cmd3, "file-123");

      queue.markPosted("cmd-1", "c1");
      queue.markPosted("cmd-2", "c2");

      const pending = queue.getByStatus("pending");
      const posted = queue.getByStatus("posted");

      expect(pending).toHaveLength(1);
      expect(posted).toHaveLength(2);
    });

    it("should return empty array when no matches", () => {
      const result = queue.getByStatus("completed");
      expect(result).toEqual([]);
    });
  });

  describe("getByFileKey", () => {
    it("should return commands for specific file", () => {
      const cmd1 = createMockCommand("cmd-1");
      const cmd2 = createMockCommand("cmd-2");
      const cmd3 = createMockCommand("cmd-3");

      queue.add(cmd1, "file-A");
      queue.add(cmd2, "file-A");
      queue.add(cmd3, "file-B");

      const fileA = queue.getByFileKey("file-A");
      const fileB = queue.getByFileKey("file-B");

      expect(fileA).toHaveLength(2);
      expect(fileB).toHaveLength(1);
    });
  });

  describe("checkTimeouts", () => {
    it("should mark posted commands as timed out after deadline", () => {
      const command = createMockCommand();
      queue.add(command, "file-123", 1); // 1ms timeout
      queue.markPosted(command.id, "comment-1");

      // Wait for timeout
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          const timedOut = queue.checkTimeouts();

          expect(timedOut).toContain(command.id);
          expect(queue.get(command.id)?.status).toBe("timeout");
          resolve();
        }, 10);
      });
    });

    it("should not affect pending commands", () => {
      const command = createMockCommand();
      queue.add(command, "file-123", 1); // 1ms timeout
      // Not marking as posted

      return new Promise<void>((resolve) => {
        setTimeout(() => {
          const timedOut = queue.checkTimeouts();

          expect(timedOut).not.toContain(command.id);
          expect(queue.get(command.id)?.status).toBe("pending");
          resolve();
        }, 10);
      });
    });
  });

  describe("getStats", () => {
    it("should return correct statistics", () => {
      const cmd1 = createMockCommand("cmd-1");
      const cmd2 = createMockCommand("cmd-2");
      const cmd3 = createMockCommand("cmd-3");
      const cmd4 = createMockCommand("cmd-4");

      queue.add(cmd1, "file-123");
      queue.add(cmd2, "file-123");
      queue.add(cmd3, "file-123");
      queue.add(cmd4, "file-123");

      queue.markPosted("cmd-1", "c1");
      queue.markCompleted("cmd-2", createMockResponse("cmd-2"));
      queue.markFailed("cmd-3", createMockResponse("cmd-3", "error"));

      const stats = queue.getStats();

      expect(stats.pending).toBe(1);
      expect(stats.posted).toBe(1);
      expect(stats.completed).toBe(1);
      expect(stats.failed).toBe(1);
      expect(stats.timeout).toBe(0);
      expect(stats.total).toBe(4);
    });
  });

  describe("cleanup", () => {
    it("should remove old completed commands", async () => {
      const command = createMockCommand();
      queue.add(command, "file-123");
      queue.markCompleted(command.id, createMockResponse(command.id));

      // Wait a bit so the command is "old"
      await new Promise((resolve) => setTimeout(resolve, 5));

      // Use 1ms maxAge - any command older than 1ms will be cleaned
      const removed = queue.cleanup(1);

      expect(removed).toBe(1);
      expect(queue.size).toBe(0);
    });

    it("should not remove pending or posted commands", () => {
      const cmd1 = createMockCommand("cmd-1");
      const cmd2 = createMockCommand("cmd-2");

      queue.add(cmd1, "file-123");
      queue.add(cmd2, "file-123");
      queue.markPosted("cmd-2", "c2");

      const removed = queue.cleanup(0);

      expect(removed).toBe(0);
      expect(queue.size).toBe(2);
    });

    it("should not remove recently completed commands", () => {
      const command = createMockCommand();
      queue.add(command, "file-123");
      queue.markCompleted(command.id, createMockResponse(command.id));

      // Use large maxAge
      const removed = queue.cleanup(3600000);

      expect(removed).toBe(0);
      expect(queue.size).toBe(1);
    });
  });

  describe("clear", () => {
    it("should remove all commands", () => {
      queue.add(createMockCommand("cmd-1"), "file-123");
      queue.add(createMockCommand("cmd-2"), "file-123");
      queue.add(createMockCommand("cmd-3"), "file-123");

      queue.clear();

      expect(queue.size).toBe(0);
    });
  });
});
