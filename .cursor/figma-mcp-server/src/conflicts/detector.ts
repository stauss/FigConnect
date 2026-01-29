import { CommentTask } from "../queue/comment-task-types.js";
import { Conflict, ConflictStrategy, ConflictResolution } from "./types.js";
import { logger } from "../logger.js";

/**
 * Conflict detection service
 * Detects conflicts between tasks before execution
 */
export interface ConflictDetector {
  checkConflicts(
    task: CommentTask,
    activeTasks: CommentTask[],
  ): Promise<Conflict[]>;
  resolveConflicts(
    conflicts: Conflict[],
    strategy: ConflictStrategy,
  ): Promise<ConflictResolution>;
}

/**
 * Basic conflict detector implementation
 * For MVP: Simple node overlap detection
 * Future: More sophisticated conflict detection (style conflicts, etc.)
 */
export class BasicConflictDetector implements ConflictDetector {
  /**
   * Check for conflicts between a task and active tasks
   */
  async checkConflicts(
    task: CommentTask,
    activeTasks: CommentTask[],
  ): Promise<Conflict[]> {
    const conflicts: Conflict[] = [];

    if (!task.targetNodeId) {
      // No target node - no conflicts possible
      return conflicts;
    }

    // Check for node overlap with active tasks
    for (const activeTask of activeTasks) {
      if (activeTask.id === task.id) {
        continue; // Skip self
      }

      if (
        activeTask.state === "done" ||
        activeTask.state === "failed" ||
        activeTask.state === "canceled"
      ) {
        continue; // Skip completed tasks
      }

      // Check if tasks target same node
      if (
        activeTask.targetNodeId &&
        activeTask.targetNodeId === task.targetNodeId
      ) {
        conflicts.push({
          type: "node_overlap",
          taskId: task.id,
          conflictingTaskId: activeTask.id,
          nodes: [task.targetNodeId],
          severity: "warning", // Warning for MVP, can be error in future
          description: `Task ${activeTask.id} also targets node ${task.targetNodeId}`,
        });
      }

      // Check for node overlap in commands
      const taskNodeIds = this.extractNodeIds(task);
      const activeNodeIds = this.extractNodeIds(activeTask);

      const overlappingNodes = taskNodeIds.filter((id) =>
        activeNodeIds.includes(id),
      );

      if (overlappingNodes.length > 0) {
        conflicts.push({
          type: "node_overlap",
          taskId: task.id,
          conflictingTaskId: activeTask.id,
          nodes: overlappingNodes,
          severity: "warning",
          description: `Tasks target overlapping nodes: ${overlappingNodes.join(", ")}`,
        });
      }
    }

    if (conflicts.length > 0) {
      logger.warn(`Found ${conflicts.length} conflicts for task ${task.id}`);
    }

    return conflicts;
  }

  /**
   * Resolve conflicts using specified strategy
   */
  async resolveConflicts(
    conflicts: Conflict[],
    strategy: ConflictStrategy,
  ): Promise<ConflictResolution> {
    const resolution: ConflictResolution = {
      strategy,
      resolved: false,
      actions: [],
      warnings: [],
    };

    switch (strategy) {
      case "sequence":
        resolution.actions.push(
          "Tasks will be executed in sequence to avoid conflicts",
        );
        resolution.resolved = true;
        break;

      case "branch":
        resolution.actions.push(
          "Creating branch copy before executing conflicting tasks",
        );
        resolution.warnings?.push(
          "Branch strategy requires plugin support (not implemented in MVP)",
        );
        resolution.resolved = false; // Not implemented yet
        break;

      case "warn":
        resolution.actions.push(
          "Proceeding with warnings - conflicts may occur",
        );
        resolution.warnings?.push(
          `${conflicts.length} conflicts detected but proceeding`,
        );
        resolution.resolved = true;
        break;

      case "merge":
        resolution.actions.push(
          "Attempting to merge changes (not implemented in MVP)",
        );
        resolution.warnings?.push(
          "Merge strategy requires advanced conflict resolution (not implemented)",
        );
        resolution.resolved = false; // Not implemented yet
        break;
    }

    return resolution;
  }

  /**
   * Extract node IDs from task commands
   */
  private extractNodeIds(task: CommentTask): string[] {
    const nodeIds: string[] = [];

    if (task.targetNodeId) {
      nodeIds.push(task.targetNodeId);
    }

    // Extract node IDs from command params (e.g., parent, nodeId fields)
    for (const command of task.commands) {
      if (command.parent) {
        nodeIds.push(command.parent);
      }
      if (command.params.nodeId) {
        nodeIds.push(command.params.nodeId);
      }
      if (command.params.nodeIds && Array.isArray(command.params.nodeIds)) {
        nodeIds.push(...command.params.nodeIds);
      }
    }

    return [...new Set(nodeIds)]; // Remove duplicates
  }
}

// Default instance
export const conflictDetector: ConflictDetector = new BasicConflictDetector();
