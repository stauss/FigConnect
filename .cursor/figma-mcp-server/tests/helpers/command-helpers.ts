/**
 * Test helpers for creating mock commands, responses, and tasks
 */

import { BaseCommand, CommandResponse } from "../../src/commands/types.js";
import { CommentTask } from "../../src/queue/comment-task-types.js";

/**
 * Create a mock command for testing
 */
export function createMockCommand(
  id: string = "cmd-test-123",
  command: string = "create_frame",
  params: Record<string, any> = { name: "Test", width: 100, height: 100 },
  parent?: string,
): BaseCommand {
  return {
    type: "mcp-command",
    version: "1.0",
    id,
    command,
    params,
    parent,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Create a mock command with idempotency key
 */
export function createMockCommandWithIdempotency(
  id: string = "cmd-test-123",
  idempotencyKey: string = "idemp-key-123",
): BaseCommand {
  return {
    ...createMockCommand(id),
    idempotencyKey,
  };
}

/**
 * Create a mock command response
 */
export function createMockResponse(
  commandId: string,
  status: "success" | "error" | "pending" = "success",
): CommandResponse {
  return {
    type: "mcp-response",
    commandId,
    status,
    result: status === "success" ? { nodeId: "1:2" } : undefined,
    error:
      status === "error"
        ? { code: "ERROR", message: "Failed", details: "Test error" }
        : undefined,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Create a mock comment task
 */
export function createMockTask(
  id: string = "task-123",
  state: CommentTask["state"] = "queued",
): CommentTask {
  return {
    id,
    commentId: `comment-${id}`,
    fileKey: "file-123",
    userId: "user-123",
    state,
    message: "Claude: test command",
    commands: [createMockCommand(`cmd-${id}`)],
    commandIds: [`cmd-${id}`],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

/**
 * Create a mock task with target node
 */
export function createMockTaskWithTarget(
  id: string = "task-123",
  targetNodeId: string = "1:2",
): CommentTask {
  return {
    ...createMockTask(id),
    targetNodeId,
  };
}
