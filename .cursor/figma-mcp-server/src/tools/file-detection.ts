import { bridgeServer } from "../bridge/server.js";
import { logger } from "../logger.js";
import { CONFIG } from "../config.js";

/**
 * Auto-detect file key from bridge server or throw error
 */
export async function getFileKey(
  providedFileKey?: string | null,
): Promise<string> {
  // If provided, use it
  if (providedFileKey) {
    return providedFileKey;
  }

  // First try the singleton (for same-process bridge server)
  const currentFile = bridgeServer.getCurrentFile();
  if (currentFile) {
    logger.debug(`Using auto-detected file key: ${currentFile.fileKey}`);
    return currentFile.fileKey;
  }

  // If singleton doesn't have it, check the HTTP endpoint directly
  // This handles cases where multiple MCP server instances exist
  // but only one bridge server is running
  try {
    const bridgeUrl = `http://localhost:${CONFIG.bridge.port}/api/current-file`;
    const response = await fetch(bridgeUrl);

    if (response.ok) {
      const data = (await response.json()) as {
        fileKey: string | null;
        fileName: string | null;
      };

      if (data.fileKey) {
        logger.debug(
          `Using file key from bridge HTTP endpoint: ${data.fileKey}`,
        );
        return data.fileKey;
      }
    }
  } catch (error) {
    logger.debug(
      `Could not fetch from bridge HTTP endpoint: ${error instanceof Error ? error.message : String(error)}`,
    );
    // Continue to throw error below
  }

  // If no file key available, throw error
  throw new Error(
    "No file_key provided and no current file detected. Please provide a file_key parameter or ensure the Figma plugin is running and has announced the current file.",
  );
}
