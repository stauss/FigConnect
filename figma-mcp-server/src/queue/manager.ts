import { QueuedCommand, QueueStats, CommandStatus } from "./types.js";
import { BaseCommand, CommandResponse } from "../commands/types.js";
import { logger } from "../logger.js";

export class CommandQueue {
  private queue: Map<string, QueuedCommand> = new Map();
  private readonly defaultTimeout = 30000; // 30 seconds

  /**
   * Add command to queue
   */
  add(command: BaseCommand, fileKey: string, timeout?: number): string {
    const queued: QueuedCommand = {
      command,
      fileKey,
      status: "pending",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      timeoutAt: Date.now() + (timeout ?? this.defaultTimeout),
    };

    this.queue.set(command.id, queued);
    logger.info(`Command ${command.id} added to queue`);

    return command.id;
  }

  /**
   * Update command status
   */
  updateStatus(
    commandId: string,
    status: CommandStatus,
    data?: Partial<QueuedCommand>,
  ): boolean {
    const command = this.queue.get(commandId);
    if (!command) {
      logger.warn(`Command ${commandId} not found in queue`);
      return false;
    }

    command.status = status;
    command.updatedAt = Date.now();

    if (data) {
      Object.assign(command, data);
    }

    logger.info(`Command ${commandId} status: ${status}`);
    return true;
  }

  /**
   * Mark command as posted
   */
  markPosted(commandId: string, commentId: string): boolean {
    return this.updateStatus(commandId, "posted", { commentId });
  }

  /**
   * Mark command as completed
   */
  markCompleted(commandId: string, response: CommandResponse): boolean {
    return this.updateStatus(commandId, "completed", { response });
  }

  /**
   * Mark command as failed
   */
  markFailed(commandId: string, response: CommandResponse): boolean {
    return this.updateStatus(commandId, "failed", { response });
  }

  /**
   * Get command by ID
   */
  get(commandId: string): QueuedCommand | undefined {
    return this.queue.get(commandId);
  }

  /**
   * Get all commands with specific status
   */
  getByStatus(status: CommandStatus): QueuedCommand[] {
    return Array.from(this.queue.values()).filter(
      (cmd) => cmd.status === status,
    );
  }

  /**
   * Get all commands for a specific file
   */
  getByFileKey(fileKey: string): QueuedCommand[] {
    return Array.from(this.queue.values()).filter(
      (cmd) => cmd.fileKey === fileKey,
    );
  }

  /**
   * Check for timed out commands
   */
  checkTimeouts(): string[] {
    const now = Date.now();
    const timedOut: string[] = [];

    this.queue.forEach((command, id) => {
      if (command.status === "posted" && now > command.timeoutAt) {
        this.updateStatus(id, "timeout");
        timedOut.push(id);
      }
    });

    if (timedOut.length > 0) {
      logger.warn(`${timedOut.length} commands timed out`);
    }

    return timedOut;
  }

  /**
   * Get queue statistics
   */
  getStats(): QueueStats {
    const stats: QueueStats = {
      pending: 0,
      posted: 0,
      completed: 0,
      failed: 0,
      timeout: 0,
      total: this.queue.size,
    };

    this.queue.forEach((command) => {
      stats[command.status]++;
    });

    return stats;
  }

  /**
   * Clear completed commands older than threshold
   */
  cleanup(maxAge: number = 3600000): number {
    // 1 hour default
    const now = Date.now();
    let removed = 0;

    this.queue.forEach((command, id) => {
      if (
        (command.status === "completed" ||
          command.status === "failed" ||
          command.status === "timeout") &&
        now - command.updatedAt > maxAge
      ) {
        this.queue.delete(id);
        removed++;
      }
    });

    if (removed > 0) {
      logger.info(`Cleaned up ${removed} old commands`);
    }

    return removed;
  }

  /**
   * Clear all commands
   */
  clear(): void {
    const size = this.queue.size;
    this.queue.clear();
    logger.info(`Cleared ${size} commands from queue`);
  }

  /**
   * Get the number of commands in the queue
   */
  get size(): number {
    return this.queue.size;
  }
}

// Singleton instance
export const commandQueue = new CommandQueue();
