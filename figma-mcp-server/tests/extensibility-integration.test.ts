/**
 * Integration tests for extensibility features
 * Tests how all extensibility modules work together
 */

import { CommandQueue } from "../src/queue/manager.js";
import { artifactStorage } from "../src/artifacts/storage.js";
import { conflictDetector } from "../src/conflicts/detector.js";
import { previewService } from "../src/preview/service.js";
import { auditLogger } from "../src/audit/logger.js";
import { cacheManager } from "../src/cache/manager.js";
import { pluginRegistry } from "../src/plugins/registry.js";
import { resourceRegistry } from "../src/resources/registry.js";
import { aiRouter } from "../src/ai/router.js";
import {
  createMockCommand,
  createMockCommandWithIdempotency,
  createMockTaskWithTarget,
} from "./helpers/command-helpers.js";
import {
  createMockAIProvider,
  createMockToolPlugin,
} from "./helpers/mock-providers.js";

describe("Extensibility Integration", () => {
  describe("Command with idempotency key", () => {
    it("should store idempotency key in command", () => {
      const command = createMockCommandWithIdempotency(
        "cmd-1",
        "idemp-key-123",
      );

      expect(command.idempotencyKey).toBe("idemp-key-123");
    });
  });

  describe("Command with priority enqueued correctly", () => {
    it("should enqueue command with priority and link to task", () => {
      const queue = new CommandQueue();
      const command = createMockCommand("cmd-1");
      const taskId = "task-123";

      const commandId = queue.enqueueWithPriority(
        command,
        "file-123",
        "interactive",
      );

      queue.updateStatus(commandId, "pending", { taskId });

      const queued = queue.get(commandId);
      expect(queued?.priority).toBe("interactive");
      expect(queued?.taskId).toBe(taskId);
    });
  });

  describe("Artifact created and linked to command result", () => {
    it("should create artifact and reference in command response", async () => {
      const artifact = {
        id: "art-123",
        taskId: "task-123",
        type: "node_ids" as const,
        data: { nodeIds: ["1:2", "3:4"] },
        metadata: {
          timestamp: new Date().toISOString(),
          fileKey: "file-123",
        },
      };

      const artifactId = await artifactStorage.save(artifact);

      // Command response can reference artifact
      const response = {
        type: "mcp-response" as const,
        commandId: "cmd-123",
        status: "success" as const,
        result: { nodeId: "1:2" },
        timestamp: new Date().toISOString(),
        artifacts: [artifactId],
      };

      expect(response.artifacts).toContain("art-123");
    });
  });

  describe("Conflict detection prevents overlapping tasks", () => {
    it("should detect conflicts before task execution", async () => {
      const task1 = createMockTaskWithTarget("task-1", "1:2");
      const task2 = createMockTaskWithTarget("task-2", "1:2"); // Same target

      const conflicts = await conflictDetector.checkConflicts(task1, [task2]);

      expect(conflicts.length).toBeGreaterThan(0);
      expect(conflicts[0].type).toBe("node_overlap");
    });

    it("should resolve conflicts with sequence strategy", async () => {
      const conflicts = [
        {
          type: "node_overlap" as const,
          taskId: "task-1",
          conflictingTaskId: "task-2",
          nodes: ["1:2"],
          severity: "warning" as const,
          description: "Test conflict",
        },
      ];

      const resolution = await conflictDetector.resolveConflicts(
        conflicts,
        "sequence",
      );

      expect(resolution.resolved).toBe(true);
      expect(resolution.strategy).toBe("sequence");
    });
  });

  describe("Preview before execution shows changes", () => {
    it("should preview commands and show affected nodes", async () => {
      const commands = [
        createMockCommand("cmd-1", "create_frame", {}, "1:2"),
        createMockCommand("cmd-2", "move_node", {
          nodeId: "3:4",
          x: 10,
          y: 20,
        }),
      ];

      const preview = await previewService.preview(commands);

      expect(preview.changes.length).toBe(2);
      expect(preview.affectedNodes.length).toBeGreaterThan(0);
      // create_frame uses parent as nodeId, move_node uses params.nodeId
      expect(preview.affectedNodes).toContain("3:4");
      // Parent node is included in affected nodes
      expect(
        preview.affectedNodes.some((id) => id === "1:2" || id === "root"),
      ).toBe(true);
    });
  });

  describe("Audit log captures all actions", () => {
    it("should log command execution", async () => {
      await auditLogger.log({
        type: "command_executed",
        userId: "user-123",
        taskId: "task-123",
        commandId: "cmd-123",
        fileKey: "file-123",
        details: { command: "create_frame" },
        timestamp: new Date().toISOString(),
      });

      const entries = await auditLogger.query({ commandId: "cmd-123" });
      expect(entries.length).toBe(1);
      expect(entries[0].type).toBe("command_executed");
    });

    it("should log task creation", async () => {
      await auditLogger.log({
        type: "task_created",
        userId: "user-123",
        fileKey: "file-123",
        details: {},
        timestamp: new Date().toISOString(),
      });

      const entries = await auditLogger.query({ type: "task_created" });
      expect(entries.length).toBeGreaterThan(0);
    });
  });

  describe("Cache invalidation on file changes", () => {
    it("should invalidate cache when file modified event occurs", async () => {
      const manager = cacheManager as any;

      await cacheManager.set("file:abc:structure", { data: "test" });
      manager.registerEventInvalidation("file.modified", "file:abc:*");

      await manager.handleEvent("file.modified");

      const cached = await cacheManager.get("file:abc:structure");
      expect(cached).toBeNull();
    });
  });

  describe("Plugin executes command via registry", () => {
    it("should route command to registered plugin", async () => {
      const plugin = createMockToolPlugin("test-plugin", ["create_frame"]);
      pluginRegistry.register(plugin);

      const command = createMockCommand("cmd-1", "create_frame");
      const result = await pluginRegistry.execute(command);

      expect(result.success).toBe(true);
      expect(result.result).toBeDefined();
    });
  });

  describe("Resource registry enables resource sharing", () => {
    it("should register and retrieve resources", async () => {
      const resource = {
        uri: "figma://file/abc/tokens",
        type: "tokens" as const,
        data: { colors: { primary: "#0000FF" } },
        metadata: {
          name: "Design Tokens",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      };

      resourceRegistry.register(resource);

      const retrieved = await resourceRegistry.get("figma://file/abc/tokens");
      expect(retrieved).toEqual(resource);
    });
  });

  describe("AI router uses provider-agnostic interface", () => {
    it("should route through registered AI provider", async () => {
      const provider = createMockAIProvider("test-provider");
      aiRouter.registerProvider("test-provider", provider);

      const context = {
        fileKey: "file-123",
        userMessage: "create a frame",
      };

      const commands = await aiRouter.route("create a frame", context);

      expect(commands.length).toBeGreaterThan(0);
      expect(commands[0].command).toBe("create_frame");
    });
  });

  describe("End-to-end workflow", () => {
    it("should handle complete workflow: preview → conflict check → execute → audit", async () => {
      const commands = [
        createMockCommand("cmd-1", "create_frame", { parent: "1:2" }),
      ];

      // 1. Preview
      const preview = await previewService.preview(commands);
      expect(preview.canExecute).toBe(true);

      // 2. Check conflicts
      const task1 = createMockTaskWithTarget("task-1", "1:2");
      const conflicts = await conflictDetector.checkConflicts(task1, []);
      expect(conflicts.length).toBe(0);

      // 3. Execute (via plugin registry)
      const plugin = createMockToolPlugin("test-plugin", ["create_frame"]);
      pluginRegistry.register(plugin);
      const result = await pluginRegistry.execute(commands[0]);
      expect(result.success).toBe(true);

      // 4. Audit
      await auditLogger.log({
        type: "command_executed",
        userId: "user-123",
        commandId: commands[0].id,
        fileKey: "file-123",
        details: { command: "create_frame" },
        timestamp: new Date().toISOString(),
      });

      const auditEntries = await auditLogger.query({
        commandId: commands[0].id,
      });
      expect(auditEntries.length).toBe(1);
    });
  });
});
