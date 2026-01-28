import { executeCreateFrame } from "./frame";
import { executeCreateText } from "./text";
import { executeCreateRectangle } from "./rectangle";
import { executeApplyAutoLayout } from "./layout";
import { executeCreateComponent } from "./component";
import { executeApplyStyle } from "./styles";
import { executeSetProperties } from "./properties";
import { Logger } from "../utils/logger";
import { getParentNode } from "../utils/nodes";
import type { Command, CommandResult } from "./types";

const logger = new Logger("Executor");

/**
 * Execute a command and return the result
 */
export async function executeCommand(command: Command): Promise<CommandResult> {
  const startTime = Date.now();
  logger.info(`Executing command: ${command.command} (${command.id})`);

  try {
    // Get parent node if specified
    const parent = await getParentNode(command.parent);

    // Route to appropriate executor
    let result: CommandResult;

    switch (command.command) {
      case "create_frame":
        result = await executeCreateFrame(command.params, parent);
        break;

      case "create_text":
        result = await executeCreateText(command.params, parent);
        break;

      case "create_rectangle":
        result = await executeCreateRectangle(command.params, parent);
        break;

      case "apply_auto_layout":
        result = await executeApplyAutoLayout(command.params, command.parent);
        break;

      case "create_component":
        result = await executeCreateComponent(command.params, parent);
        break;

      case "apply_style":
        result = await executeApplyStyle(command.params, command.parent);
        break;

      case "set_properties":
        result = await executeSetProperties(command.params, command.parent);
        break;

      default:
        throw new Error(`Unknown command: ${command.command}`);
    }

    const executionTime = Date.now() - startTime;
    logger.info(
      `Command ${command.id} completed in ${executionTime}ms: ${result.success ? "success" : "failed"}`,
    );

    return result;
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : undefined;

    logger.error(`Command ${command.id} failed: ${errorMessage}`, error);

    return {
      success: false,
      error: {
        code: "EXECUTION_ERROR",
        message: errorMessage,
        details: errorStack,
      },
    };
  }
}
