import { CommentTask } from "../queue/comment-task-types.js";

/**
 * Types of conflicts that can occur between tasks
 */
export type ConflictType =
  | "node_overlap" // Tasks target same nodes
  | "style_conflict" // Conflicting style changes
  | "delete_conflict"; // One task deletes what another modifies

/**
 * Conflict severity levels
 */
export type ConflictSeverity = "warning" | "error";

/**
 * Conflict information
 */
export interface Conflict {
  type: ConflictType;
  taskId: string;
  conflictingTaskId: string;
  nodes: string[]; // Affected node IDs
  severity: ConflictSeverity;
  description: string; // Human-readable description
}

/**
 * Conflict resolution strategies
 */
export type ConflictStrategy =
  | "sequence" // Execute tasks in sequence
  | "branch" // Create branch copy before executing
  | "warn" // Warn user but proceed
  | "merge"; // Attempt to merge changes

/**
 * Conflict resolution result
 */
export interface ConflictResolution {
  strategy: ConflictStrategy;
  resolved: boolean;
  actions: string[]; // Actions taken to resolve
  warnings?: string[]; // Warnings about resolution
}
