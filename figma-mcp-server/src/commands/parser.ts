import {
  BaseCommandSchema,
  CommandResponseSchema,
  BaseCommand,
  CommandResponse,
} from "./types.js";
import { logger } from "../logger.js";

/**
 * Parse command from JSON string
 */
export function parseCommand(jsonString: string): BaseCommand {
  try {
    const data = JSON.parse(jsonString);
    const result = BaseCommandSchema.safeParse(data);

    if (!result.success) {
      logger.error("Invalid command format:", result.error);
      throw new Error(`Invalid command format: ${result.error.message}`);
    }

    return result.data;
  } catch (error: any) {
    if (error.message.startsWith("Invalid command format:")) {
      throw error;
    }
    logger.error("Failed to parse command:", error);
    throw new Error(`Failed to parse command: ${error.message}`);
  }
}

/**
 * Parse response from JSON string
 */
export function parseResponse(jsonString: string): CommandResponse | null {
  try {
    const data = JSON.parse(jsonString);
    const result = CommandResponseSchema.safeParse(data);

    if (!result.success) {
      logger.error("Invalid response format:", result.error);
      return null;
    }

    return result.data;
  } catch (error) {
    logger.error("Failed to parse response:", error);
    return null;
  }
}

/**
 * Extract command from comment message
 * Looks for JSON block in comment
 */
export function extractCommandFromComment(message: string): BaseCommand | null {
  // Try to find JSON block in markdown code fence
  const jsonMatch = message.match(/```json\s*([\s\S]*?)\s*```/);
  if (jsonMatch) {
    try {
      return parseCommand(jsonMatch[1]);
    } catch {
      // Fall through to try direct JSON
    }
  }

  // Try direct JSON
  const trimmed = message.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    try {
      return parseCommand(trimmed);
    } catch {
      return null;
    }
  }

  return null;
}

/**
 * Extract response from comment message
 */
export function extractResponseFromComment(
  message: string,
): CommandResponse | null {
  // Try to find JSON block in markdown code fence
  const jsonMatch = message.match(/```json\s*([\s\S]*?)\s*```/);
  if (jsonMatch) {
    const response = parseResponse(jsonMatch[1]);
    if (response) {
      return response;
    }
  }

  // Try direct JSON
  const trimmed = message.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    return parseResponse(trimmed);
  }

  return null;
}

/**
 * Format command as comment message
 */
export function formatCommandMessage(command: BaseCommand): string {
  return `MCP Command

\`\`\`json
${JSON.stringify(command, null, 2)}
\`\`\`

*This command will be executed by the Figma MCP Plugin*`;
}
