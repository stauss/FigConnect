import { commandQueue } from "../queue/manager.js";
import { commandPoller } from "../queue/polling.js";
import { formatCommandMessage } from "../commands/parser.js";
import {
  validateCommandParams,
  isSupportedCommand,
} from "../commands/validator.js";
import {
  createFrameCommand,
  createTextCommand,
  createRectangleCommand,
  applyAutoLayoutCommand,
  createComponentCommand,
  setPropertiesCommand,
  moveNodeCommand,
  duplicateNodeCommand,
  deleteNodeCommand,
  resizeNodeCommand,
  groupNodesCommand,
  ungroupNodesCommand,
} from "../commands/templates.js";
import {
  ToolResponse,
  PostCommandInput,
  GetCommandStatusInput,
  BatchCommandInput,
  GetCurrentFileInput,
} from "../types.js";
import { logger } from "../logger.js";
import { getFileKey } from "./file-detection.js";
import { retryWithBackoff } from "../utils/retry.js";
import { backupService } from "../backup/service.js";
import { historyStore } from "../storage/history-store.js";
import { figmaClient } from "../figma/client.js";

/**
 * Post a command to be executed by the Figma plugin
 */
export async function postCommand(
  input: PostCommandInput,
): Promise<ToolResponse> {
  try {
    // Auto-detect file key if not provided
    const fileKey = await getFileKey(input.file_key);

    // Check if command type is supported
    if (!isSupportedCommand(input.command)) {
      return {
        content: [
          {
            type: "text",
            text: `Unknown command: ${input.command}. Supported commands: create_frame, create_text, create_rectangle, apply_auto_layout, create_component, set_properties, move_node, duplicate_node, delete_node, resize_node, group_nodes, ungroup_nodes`,
          },
        ],
        isError: true,
      };
    }

    // Validate params
    const validatedParams = validateCommandParams(input.command, input.params);

    // Create command based on type
    let command;
    switch (input.command) {
      case "create_frame":
        command = createFrameCommand({
          ...validatedParams,
          parent: input.parent,
        });
        break;
      case "create_text":
        command = createTextCommand({
          ...validatedParams,
          parent: input.parent,
        });
        break;
      case "create_rectangle":
        command = createRectangleCommand({
          ...validatedParams,
          parent: input.parent,
        });
        break;
      case "apply_auto_layout":
        if (!input.parent) {
          throw new Error("apply_auto_layout requires a parent node ID");
        }
        command = applyAutoLayoutCommand({
          nodeId: input.parent,
          direction: validatedParams.mode,
          spacing: validatedParams.itemSpacing,
          padding: validatedParams.paddingTop,
        });
        break;
      case "create_component":
        command = createComponentCommand({
          ...validatedParams,
          parent: input.parent,
        });
        break;
      case "set_properties":
        if (!input.parent) {
          throw new Error("set_properties requires a parent node ID");
        }
        command = setPropertiesCommand({
          nodeId: input.parent,
          properties: validatedParams.properties,
        });
        break;
      case "move_node":
        command = moveNodeCommand({
          nodeId: validatedParams.nodeId,
          x: validatedParams.x,
          y: validatedParams.y,
          relative: validatedParams.relative,
        });
        break;
      case "duplicate_node":
        command = duplicateNodeCommand({
          nodeId: validatedParams.nodeId,
        });
        break;
      case "delete_node":
        command = deleteNodeCommand({
          nodeId: validatedParams.nodeId,
        });
        break;
      case "resize_node":
        if (!validatedParams.nodeId) {
          throw new Error("resize_node requires a nodeId parameter");
        }
        command = resizeNodeCommand({
          nodeId: validatedParams.nodeId,
          width: validatedParams.width,
          height: validatedParams.height,
          relative: validatedParams.relative,
          maintainAspectRatio: validatedParams.maintainAspectRatio,
        });
        break;
      case "group_nodes":
        command = groupNodesCommand({
          nodeIds: validatedParams.nodeIds,
          name: validatedParams.name,
        });
        break;
      case "ungroup_nodes":
        if (!validatedParams.nodeId) {
          throw new Error("ungroup_nodes requires a nodeId parameter");
        }
        command = ungroupNodesCommand({
          nodeId: validatedParams.nodeId,
        });
        break;
      default:
        throw new Error(`Unsupported command: ${input.command}`);
    }

    // Create backup before command execution (for destructive/modifying commands)
    const modifyingCommands = [
      "delete_node",
      "move_node",
      "resize_node",
      "set_properties",
      "duplicate_node",
      "group_nodes",
      "ungroup_nodes",
    ];
    let backupId: string | undefined;
    if (modifyingCommands.includes(input.command)) {
      try {
        // Get file name for backup
        const fileData = await figmaClient
          .getFile(fileKey, 1)
          .catch(() => null);
        const fileName = (fileData as any)?.name || `file-${fileKey}`;

        const backup = await backupService.createBackup(fileKey, fileName);
        backupId = backup.id;
        logger.info(`Backup created before command: ${backupId}`);
      } catch (error: any) {
        logger.warn(
          `Failed to create backup (continuing anyway): ${error.message}`,
        );
      }
    }

    // Add to queue
    const commandId = commandQueue.add(command, fileKey, input.timeout);

    // Add to history
    await historyStore.addCommand({
      commandId,
      fileKey,
      command: input.command,
      params: validatedParams,
      status: "pending",
      backupId,
    });

    // Format the command message (for display/debugging)
    const message = formatCommandMessage(command);

    logger.info(`Command ${commandId} created for file ${fileKey}`);

    // Note: In a real implementation, this would post to Figma as a comment
    // For now, we mark it as posted (simulated) since Figma REST API doesn't support posting comments
    commandQueue.markPosted(commandId, `simulated-${commandId}`);

    // Wait for completion if requested
    if (input.wait_for_completion) {
      try {
        const response = await commandPoller.waitForCompletion(
          commandId,
          fileKey,
          input.timeout,
        );

        return {
          content: [
            {
              type: "text",
              text: `Command executed successfully!\n\nCommand ID: ${commandId}\nResult: ${JSON.stringify(response.result, null, 2)}`,
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [{ type: "text", text: `Command failed: ${error.message}` }],
          isError: true,
        };
      }
    }

    // Return immediately with command details
    return {
      content: [
        {
          type: "text",
          text: `Command posted: ${commandId}

**Command:** ${command.command}
**File:** ${fileKey}
**Parent:** ${input.parent || "None (root level)"}

Use \`get_command_status\` to check progress.

**Command Message:**
${message}`,
        },
      ],
    };
  } catch (error: any) {
    logger.error("Error posting command:", error);
    return {
      content: [{ type: "text", text: `Error: ${error.message}` }],
      isError: true,
    };
  }
}

/**
 * Get status of a command
 */
export async function getCommandStatus(
  input: GetCommandStatusInput,
): Promise<ToolResponse> {
  try {
    const command = commandQueue.get(input.command_id);

    if (!command) {
      return {
        content: [
          { type: "text", text: `Command not found: ${input.command_id}` },
        ],
        isError: true,
      };
    }

    const statusEmoji = {
      pending: "⏳",
      posted: "📤",
      completed: "✅",
      failed: "❌",
      timeout: "⏰",
    };

    let statusText = `# Command Status: ${statusEmoji[command.status]} ${command.status.toUpperCase()}

**Command ID:** ${command.command.id}
**Command Type:** ${command.command.command}
**File Key:** ${command.fileKey}

**Created:** ${new Date(command.createdAt).toLocaleString()}
**Updated:** ${new Date(command.updatedAt).toLocaleString()}
**Timeout At:** ${new Date(command.timeoutAt).toLocaleString()}`;

    if (command.response) {
      statusText += `\n\n## Response
\`\`\`json
${JSON.stringify(command.response, null, 2)}
\`\`\``;
    }

    return {
      content: [{ type: "text", text: statusText }],
    };
  } catch (error: any) {
    logger.error("Error getting command status:", error);
    return {
      content: [{ type: "text", text: `Error: ${error.message}` }],
      isError: true,
    };
  }
}

/**
 * Post multiple commands as a batch
 */
export async function postBatchCommands(
  input: BatchCommandInput,
): Promise<ToolResponse> {
  try {
    // Auto-detect file key if not provided
    const fileKey = await getFileKey(input.file_key);

    const commandIds: string[] = [];
    const errors: string[] = [];

    // Post each command
    for (let i = 0; i < input.commands.length; i++) {
      const cmd = input.commands[i];
      try {
        const result = await postCommand({
          file_key: fileKey,
          command: cmd.command,
          params: cmd.params,
          parent: cmd.parent,
          wait_for_completion: false,
          timeout: 30000,
        });

        // Extract command ID from result
        const match = result.content[0].text?.match(
          /Command posted: (cmd-[^\s]+)/,
        );
        if (match) {
          commandIds.push(match[1]);
        } else if (result.isError) {
          errors.push(`Command ${i + 1}: ${result.content[0].text}`);
        }
      } catch (error: any) {
        errors.push(`Command ${i + 1}: ${error.message}`);
      }
    }

    let resultText = `# Batch Commands Posted

**Total:** ${input.commands.length}
**Successful:** ${commandIds.length}
**Failed:** ${errors.length}

## Command IDs
${commandIds.map((id, i) => `${i + 1}. ${id}`).join("\n")}`;

    if (errors.length > 0) {
      resultText += `\n\n## Errors\n${errors.join("\n")}`;
    }

    // Wait for all if requested (in parallel for better performance)
    if (input.wait_for_completion && commandIds.length > 0) {
      resultText += "\n\n## Waiting for completion...\n";

      // Wait for all commands in parallel instead of sequentially
      const completionPromises = commandIds.map(async (commandId) => {
        try {
          const response = await commandPoller.waitForCompletion(
            commandId,
            fileKey,
            30000,
          );
          return { commandId, status: "success", response };
        } catch (error: any) {
          return { commandId, status: "error", error: error.message };
        }
      });

      const results = await Promise.all(completionPromises);
      const resultLines = results.map((r) => {
        if (r.status === "success" && r.response) {
          return `✅ ${r.commandId}: ${r.response.status}`;
        } else {
          return `❌ ${r.commandId}: ${r.error || "Unknown error"}`;
        }
      });

      resultText += resultLines.join("\n");
    }

    return {
      content: [{ type: "text", text: resultText }],
      isError: errors.length > 0 && commandIds.length === 0,
    };
  } catch (error: any) {
    logger.error("Error posting batch commands:", error);
    return {
      content: [{ type: "text", text: `Error: ${error.message}` }],
      isError: true,
    };
  }
}

/**
 * Get current file from bridge server
 */
export async function getCurrentFile(
  _input: GetCurrentFileInput,
): Promise<ToolResponse> {
  try {
    const { bridgeServer } = await import("../bridge/server.js");
    const currentFile = bridgeServer.getCurrentFile();

    if (!currentFile) {
      return {
        content: [
          {
            type: "text",
            text: "No current file detected. Please ensure the Figma plugin is running.",
          },
        ],
      };
    }

    return {
      content: [
        {
          type: "text",
          text: `# Current File

**File Name:** ${currentFile.fileName}
**File Key:** ${currentFile.fileKey}

This file was automatically detected from the running Figma plugin.`,
        },
      ],
    };
  } catch (error: any) {
    logger.error("Error getting current file:", error);
    return {
      content: [{ type: "text", text: `Error: ${error.message}` }],
      isError: true,
    };
  }
}

/**
 * Get queue statistics
 */
export async function getQueueStats(): Promise<ToolResponse> {
  try {
    const stats = commandQueue.getStats();

    const statusText = `# Command Queue Statistics

| Status | Count |
|--------|-------|
| ⏳ Pending | ${stats.pending} |
| 📤 Posted | ${stats.posted} |
| ✅ Completed | ${stats.completed} |
| ❌ Failed | ${stats.failed} |
| ⏰ Timeout | ${stats.timeout} |
| **Total** | **${stats.total}** |`;

    return {
      content: [{ type: "text", text: statusText }],
    };
  } catch (error: any) {
    logger.error("Error getting queue stats:", error);
    return {
      content: [{ type: "text", text: `Error: ${error.message}` }],
      isError: true,
    };
  }
}
