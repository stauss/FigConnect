import { BaseCommand } from "../commands/types.js";
import { ArtifactId } from "../artifacts/types.js";
import type { Conflict } from "../conflicts/types.js";

/**
 * Extended task state machine for comment-driven collaboration
 * Supports future states: needs_review, needs_input, blocked, etc.
 */
export type TaskState =
  | "queued"
  | "in_progress"
  | "needs_review" // NEW: Requires human review
  | "needs_input" // NEW: Waiting for user input
  | "blocked" // NEW: Blocked by dependency/conflict
  | "done"
  | "failed"
  | "canceled";

/**
 * Subtask for checklist functionality
 */
export interface Subtask {
  id: string;
  description: string;
  completed: boolean;
  completedAt?: string;
}

/**
 * Conflict information (re-exported from conflicts/types)
 * Use the Conflict type from conflicts/types.ts for full conflict information
 */

/**
 * Comment task with extended state machine
 * Links comment threads to execution tasks
 */
export interface CommentTask {
  id: string;
  commentId: string;
  fileKey: string;
  userId: string;
  state: TaskState;
  message: string; // Original comment message
  intent?: string; // Extracted intent
  targetNodeId?: string; // Resolved target node
  commands: BaseCommand[]; // Commands to execute
  commandIds: string[]; // IDs of queued commands
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
  duration?: number; // Execution duration in ms
  error?: {
    code: string;
    message: string;
    details?: string;
  };
  // Extended fields for future features
  owner?: string; // Assigned user/AI
  tags?: string[]; // Categorization tags
  subtasks?: Subtask[]; // Checklist items
  conflicts?: Conflict[]; // Conflict detection results
  threadSummary?: string; // Auto-generated thread summary
  artifacts?: ArtifactId[]; // References to result artifacts
}

/**
 * Filters for querying comment tasks
 */
export interface CommentTaskFilters {
  fileKey?: string;
  userId?: string;
  state?: TaskState | TaskState[];
  owner?: string;
  tags?: string[];
  createdAfter?: number;
  createdBefore?: number;
}
