import { CommentTask } from "../queue/comment-task-types.js";
import { logger } from "../logger.js";

/**
 * Permission scope for a task
 */
export interface PermissionScope {
  readOnly: boolean; // If true, task can only read, not modify
  allowedNodes?: string[]; // Can only touch these nodes
  allowedFrames?: string[]; // Can only touch nodes in these frames
  allowedWorkspaces?: string[]; // Can only access these workspaces
  deniedActions?: string[]; // Actions that are explicitly denied
}

/**
 * Permission manager for scoped access control
 * Enables restricting what tasks can do based on context
 */
export interface PermissionManager {
  checkPermission(task: CommentTask, action: string): Promise<boolean>;
  getScope(task: CommentTask): Promise<PermissionScope>;
}

/**
 * Basic permission manager implementation
 * For MVP: No restrictions (all tasks can do anything)
 * Future: Configurable scopes, workspace-level permissions
 */
export class BasicPermissionManager implements PermissionManager {
  /**
   * Check if a task has permission for an action
   */
  async checkPermission(task: CommentTask, action: string): Promise<boolean> {
    const scope = await this.getScope(task);

    // Check if read-only and action is write
    if (scope.readOnly && this.isWriteAction(action)) {
      logger.warn(
        `Permission denied: Task ${task.id} is read-only but attempted ${action}`,
      );
      return false;
    }

    // Check denied actions
    if (scope.deniedActions?.includes(action)) {
      logger.warn(
        `Permission denied: Action ${action} is denied for task ${task.id}`,
      );
      return false;
    }

    // MVP: All other actions allowed
    return true;
  }

  /**
   * Get permission scope for a task
   */
  async getScope(task: CommentTask): Promise<PermissionScope> {
    // MVP: No restrictions
    // Future: Load scope from config, workspace settings, etc.
    return {
      readOnly: false,
    };
  }

  /**
   * Check if an action is a write action
   */
  private isWriteAction(action: string): boolean {
    const writeActions = [
      "create",
      "update",
      "delete",
      "move",
      "duplicate",
      "set_properties",
    ];
    return writeActions.some((writeAction) =>
      action.toLowerCase().includes(writeAction),
    );
  }
}

// Default instance
export const permissionManager: PermissionManager =
  new BasicPermissionManager();
