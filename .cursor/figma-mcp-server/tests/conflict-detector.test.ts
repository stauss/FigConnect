/**
 * Tests for conflicts/detector.ts
 */

import {
  BasicConflictDetector,
  ConflictDetector,
} from "../src/conflicts/detector.js";
import { CommentTask } from "../src/queue/comment-task-types.js";
import {
  createMockTask,
  createMockTaskWithTarget,
} from "./helpers/command-helpers.js";
import { createMockCommand } from "./helpers/command-helpers.js";

describe("ConflictDetector", () => {
  let detector: ConflictDetector;

  beforeEach(() => {
    detector = new BasicConflictDetector();
  });

  describe("checkConflicts", () => {
    it("should detect node overlap conflicts", async () => {
      const task1 = createMockTaskWithTarget("task-1", "1:2");
      const task2 = createMockTaskWithTarget("task-2", "1:2"); // Same target

      const conflicts = await detector.checkConflicts(task1, [task2]);

      // May detect conflict multiple ways (targetNodeId and command nodeIds)
      expect(conflicts.length).toBeGreaterThanOrEqual(1);
      const conflict = conflicts.find((c) => c.type === "node_overlap");
      expect(conflict).toBeDefined();
      expect(conflict?.taskId).toBe("task-1");
      expect(conflict?.conflictingTaskId).toBe("task-2");
      expect(conflicts[0].nodes).toContain("1:2");
    });

    it("should not detect conflicts when tasks target different nodes", async () => {
      const task1 = createMockTaskWithTarget("task-1", "1:2");
      const task2 = createMockTaskWithTarget("task-2", "3:4"); // Different target

      const conflicts = await detector.checkConflicts(task1, [task2]);

      expect(conflicts).toHaveLength(0);
    });

    it("should detect conflicts in command params", async () => {
      const task1: CommentTask = {
        ...createMockTask("task-1"),
        targetNodeId: "1:2", // Set target node
        commands: [
          createMockCommand("cmd-1", "move_node", {
            nodeId: "1:2",
            x: 10,
            y: 20,
          }),
        ],
      };

      const task2: CommentTask = {
        ...createMockTask("task-2"),
        targetNodeId: "1:2", // Same target node
        state: "in_progress", // Active task
        commands: [
          createMockCommand("cmd-2", "delete_node", { nodeIds: ["1:2"] }),
        ],
      };

      const conflicts = await detector.checkConflicts(task1, [task2]);

      expect(conflicts.length).toBeGreaterThan(0);
      expect(conflicts[0].nodes).toContain("1:2");
    });

    it("should skip completed tasks", async () => {
      const task1 = createMockTaskWithTarget("task-1", "1:2");
      const task2: CommentTask = {
        ...createMockTaskWithTarget("task-2", "1:2"),
        state: "done", // Completed task
      };

      const conflicts = await detector.checkConflicts(task1, [task2]);

      expect(conflicts).toHaveLength(0);
    });

    it("should skip self", async () => {
      const task1 = createMockTaskWithTarget("task-1", "1:2");

      const conflicts = await detector.checkConflicts(task1, [task1]);

      expect(conflicts).toHaveLength(0);
    });

    it("should return empty array when no target node", async () => {
      const task1 = createMockTask("task-1"); // No targetNodeId
      const task2 = createMockTask("task-2");

      const conflicts = await detector.checkConflicts(task1, [task2]);

      expect(conflicts).toHaveLength(0);
    });
  });

  describe("resolveConflicts", () => {
    it("should resolve with sequence strategy", async () => {
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

      const resolution = await detector.resolveConflicts(conflicts, "sequence");

      expect(resolution.strategy).toBe("sequence");
      expect(resolution.resolved).toBe(true);
      expect(resolution.actions).toContain(
        "Tasks will be executed in sequence to avoid conflicts",
      );
    });

    it("should resolve with warn strategy", async () => {
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

      const resolution = await detector.resolveConflicts(conflicts, "warn");

      expect(resolution.strategy).toBe("warn");
      expect(resolution.resolved).toBe(true);
      expect(resolution.warnings).toBeDefined();
      expect(resolution.warnings?.length).toBeGreaterThan(0);
    });

    it("should return false for branch strategy (not implemented)", async () => {
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

      const resolution = await detector.resolveConflicts(conflicts, "branch");

      expect(resolution.strategy).toBe("branch");
      expect(resolution.resolved).toBe(false);
      expect(resolution.warnings).toBeDefined();
    });

    it("should return false for merge strategy (not implemented)", async () => {
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

      const resolution = await detector.resolveConflicts(conflicts, "merge");

      expect(resolution.strategy).toBe("merge");
      expect(resolution.resolved).toBe(false);
    });
  });
});
