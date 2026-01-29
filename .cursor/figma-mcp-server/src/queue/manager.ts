import { QueuedCommand, QueueStats, CommandStatus, Priority } from "./types.js";
import { BaseCommand, CommandResponse } from "../commands/types.js";
import { logger } from "../logger.js";

export class CommandQueue {
  private queue: Map<string, QueuedCommand> = new Map();
  private readonly defaultTimeout = 30000; // 30 seconds

  /**
   * Priority order (higher priority first)
   */
  private readonly priorityOrder: Priority[] = [
    "interactive",
    "batch",
    "refactor",
    "low",
  ];

  /**
   * Add command to queue
   */
  add(
    command: BaseCommand,
    fileKey: string,
    timeout?: number,
    priority?: Priority,
  ): string {
    const queued: QueuedCommand = {
      command,
      fileKey,
      status: "pending",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      timeoutAt: Date.now() + (timeout ?? this.defaultTimeout),
      priority: priority || "batch", // Default to batch priority
    };

    this.queue.set(command.id, queued);
    logger.info(
      `Command ${command.id} added to queue (priority: ${queued.priority})`,
    );

    return command.id;
  }

  /**
   * Add command with explicit priority
   */
  enqueueWithPriority(
    command: BaseCommand,
    fileKey: string,
    priority: Priority,
    timeout?: number,
  ): string {
    return this.add(command, fileKey, timeout, priority);
  }

  /**
   * Get next command based on priority
   * Returns highest priority pending command
   */
  getNext(priorities?: Priority[]): QueuedCommand | null {
    const allowedPriorities = priorities || this.priorityOrder;
    const pending = this.getByStatus("pending");

    if (pending.length === 0) {
      return null;
    }

    // Filter to only allowed priorities if specified
    const filtered = priorities
      ? pending.filter((cmd) => {
          const priority = cmd.priority || "batch";
          return allowedPriorities.includes(priority);
        })
      : pending;

    if (filtered.length === 0) {
      return null;
    }

    // Sort by priority (using priority order)
    const sorted = filtered.sort((a, b) => {
      const aPriority = a.priority || "batch";
      const bPriority = b.priority || "batch";

      const aIndex = allowedPriorities.indexOf(aPriority);
      const bIndex = allowedPriorities.indexOf(bPriority);

      // Lower index = higher priority
      if (aIndex !== bIndex) {
        return aIndex - bIndex;
      }

      // Same priority: FIFO
      return a.createdAt - b.createdAt;
    });

    return sorted[0] || null;
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
      byPriority: {
        interactive: 0,
        batch: 0,
        refactor: 0,
        low: 0,
      },
    };

    this.queue.forEach((command) => {
      stats[command.status]++;
      const priority = command.priority || "batch";
      if (stats.byPriority && priority in stats.byPriority) {
        stats.byPriority[priority as Priority]++;
      }
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
