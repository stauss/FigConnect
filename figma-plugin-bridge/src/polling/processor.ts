import { executeCommand } from "../commands/executor";
import { Logger } from "../utils/logger";
import type {
  Command,
  CommandResponse,
  CommandResult,
} from "../commands/types";

const logger = new Logger("Processor");

// Bridge server configuration
const BRIDGE_URL = "http://localhost:3030";

// UI message types
interface UIMessage {
  type: string;
  data?: unknown;
}

interface FetchCommandsResponse {
  commands: Command[];
}

/**
 * Command Processor
 * Handles polling the bridge server and executing commands
 */
export class CommandProcessor {
  private processedCommands: Set<string> = new Set();
  private currentFileKey: string | null = null;
  private onUIReadyCallback: (() => void) | null = null;

  constructor(onUIReady?: () => void) {
    this.onUIReadyCallback = onUIReady || null;
    // Listen for messages from UI
    figma.ui.onmessage = this.handleUIMessage.bind(this);
  }

  /**
   * Set the current file key for filtering commands
   */
  setFileKey(fileKey: string): void {
    this.currentFileKey = fileKey;
  }

  /**
   * Request commands from the bridge server via UI
   */
  requestCommands(): void {
    const url = this.currentFileKey
      ? `${BRIDGE_URL}/api/commands?file_key=${this.currentFileKey}`
      : `${BRIDGE_URL}/api/commands`;

    figma.ui.postMessage({
      type: "fetch",
      url,
      method: "GET",
    });
  }

  /**
   * Post a response to the bridge server via UI
   */
  postResponse(commandId: string, result: CommandResult): void {
    const response: CommandResponse = {
      type: "mcp-response",
      commandId,
      status: result.success ? "success" : "error",
      result: result.success ? result.result : undefined,
      error: result.success ? undefined : result.error,
      timestamp: new Date().toISOString(),
    };

    figma.ui.postMessage({
      type: "fetch",
      url: `${BRIDGE_URL}/api/commands/${commandId}/response`,
      method: "POST",
      body: JSON.stringify(response),
    });
  }

  /**
   * Handle messages from UI
   */
  private async handleUIMessage(msg: UIMessage): Promise<void> {
    logger.debug("UI message received:", msg.type);

    switch (msg.type) {
      case "fetch-response":
        await this.handleFetchResponse(msg.data as FetchCommandsResponse);
        break;

      case "fetch-error":
        logger.error("Fetch error:", msg.data);
        break;

      case "post-response":
        logger.debug("Response posted:", msg.data);
        break;

      case "post-error":
        logger.error("Post error:", msg.data);
        break;

      case "ui-ready":
        logger.info("UI ready signal received");
        if (this.onUIReadyCallback) {
          this.onUIReadyCallback();
        }
        break;

      default:
        logger.debug("Unknown message type:", msg.type);
    }
  }

  /**
   * Handle fetch response with commands
   */
  private async handleFetchResponse(
    data: FetchCommandsResponse,
  ): Promise<void> {
    if (!data || !data.commands) {
      return;
    }

    const commands = data.commands;
    logger.debug(`Received ${commands.length} commands`);

    // Process each command
    for (const command of commands) {
      // Skip if already processed
      if (this.processedCommands.has(command.id)) {
        continue;
      }

      logger.info(`Processing command: ${command.id} (${command.command})`);

      try {
        // Execute command
        const result = await executeCommand(command);

        // Post response
        this.postResponse(command.id, result);

        // Mark as processed
        this.processedCommands.add(command.id);

        // Show notification
        if (result.success) {
          figma.notify(`Command executed: ${command.command}`, {
            timeout: 2000,
          });
        } else {
          figma.notify(`Command failed: ${result.error?.message}`, {
            error: true,
            timeout: 3000,
          });
        }
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        logger.error(`Command ${command.id} failed:`, error);

        // Post error response
        this.postResponse(command.id, {
          success: false,
          error: {
            code: "EXECUTION_ERROR",
            message,
          },
        });

        // Mark as processed to avoid retrying
        this.processedCommands.add(command.id);
      }
    }
  }

  /**
   * Clear processed commands cache
   */
  clearProcessedCommands(): void {
    this.processedCommands.clear();
  }

  /**
   * Get number of processed commands
   */
  getProcessedCount(): number {
    return this.processedCommands.size;
  }
}
