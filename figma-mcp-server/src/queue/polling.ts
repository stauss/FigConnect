import { figmaClient } from "../figma/client.js";
import { commandQueue } from "./manager.js";
import { extractResponseFromComment } from "../commands/parser.js";
import { CommandResponse } from "../commands/types.js";
import { logger } from "../logger.js";

export class CommandPoller {
  private intervalId?: ReturnType<typeof setInterval>;
  private isPolling = false;
  private pollInterval = 5000; // 5 seconds

  /**
   * Start polling for command results
   */
  start(fileKey: string, interval: number = 5000): void {
    if (this.isPolling) {
      logger.warn("Polling already started");
      return;
    }

    this.pollInterval = interval;
    this.isPolling = true;

    logger.info(`Starting command polling (${interval}ms interval)`);

    this.intervalId = setInterval(() => {
      this.poll(fileKey).catch((error) => {
        logger.error("Polling error:", error);
      });
    }, interval);
  }

  /**
   * Stop polling
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
      this.isPolling = false;
      logger.info("Stopped command polling");
    }
  }

  /**
   * Check if polling is active
   */
  get active(): boolean {
    return this.isPolling;
  }

  /**
   * Poll for results once
   */
  async poll(fileKey: string): Promise<void> {
    // Check for timeouts
    commandQueue.checkTimeouts();

    // Get all posted commands
    const postedCommands = commandQueue.getByStatus("posted");

    if (postedCommands.length === 0) {
      return;
    }

    logger.debug(`Polling ${postedCommands.length} posted commands`);

    try {
      // Get all comments from file
      const response = (await figmaClient.getComments(fileKey)) as any;
      const comments = response.comments || [];

      // Check each posted command for responses
      for (const queuedCommand of postedCommands) {
        if (!queuedCommand.commentId) {
          continue;
        }

        // Find replies to this command comment
        const replies = comments.filter(
          (c: any) => c.parent_id === queuedCommand.commentId,
        );

        // Look for response in replies
        for (const reply of replies) {
          const commandResponse = extractResponseFromComment(reply.message);

          if (
            commandResponse &&
            commandResponse.commandId === queuedCommand.command.id
          ) {
            logger.info(
              `Found response for command ${queuedCommand.command.id}: ${commandResponse.status}`,
            );

            if (commandResponse.status === "success") {
              commandQueue.markCompleted(
                queuedCommand.command.id,
                commandResponse,
              );
            } else if (commandResponse.status === "error") {
              commandQueue.markFailed(
                queuedCommand.command.id,
                commandResponse,
              );
            }

            break;
          }
        }
      }
    } catch (error) {
      logger.error("Error polling for results:", error);
    }
  }

  /**
   * Wait for command to complete
   */
  async waitForCompletion(
    commandId: string,
    fileKey: string,
    timeout: number = 30000,
  ): Promise<CommandResponse> {
    const startTime = Date.now();

    return new Promise((resolve, reject) => {
      const checkInterval = setInterval(async () => {
        const command = commandQueue.get(commandId);

        if (!command) {
          clearInterval(checkInterval);
          reject(new Error("Command not found in queue"));
          return;
        }

        if (command.status === "completed" && command.response) {
          clearInterval(checkInterval);
          resolve(command.response);
          return;
        }

        if (command.status === "failed") {
          clearInterval(checkInterval);
          reject(
            new Error(`Command failed: ${command.response?.error?.message}`),
          );
          return;
        }

        if (command.status === "timeout" || Date.now() - startTime > timeout) {
          clearInterval(checkInterval);
          reject(new Error("Command timed out"));
          return;
        }

        // Poll for updates
        await this.poll(fileKey).catch(() => {});
      }, 1000); // Check every second
    });
  }
}

// Singleton instance
export const commandPoller = new CommandPoller();
