import { CommandProcessor } from "./polling/processor";
import { Logger } from "./utils/logger";

const logger = new Logger("MCP Bridge");

// Configuration
const POLL_INTERVAL = 3000; // 3 seconds
const BRIDGE_URL = "http://localhost:3030";
let processor: CommandProcessor;
let pollInterval: ReturnType<typeof setInterval> | null = null;
let isRunning = false;
let uiReady = false;

/**
 * Announce current file to bridge server
 */
function announceCurrentFile(fileKey: string, fileName: string): void {
  figma.ui.postMessage({
    type: "fetch",
    url: `${BRIDGE_URL}/api/current-file`,
    method: "POST",
    body: JSON.stringify({ fileKey, fileName }),
  });
  logger.info(`Announcing file: ${fileName} (${fileKey})`);
}

/**
 * Initialize the plugin
 */
async function initialize(): Promise<void> {
  logger.info("Figma MCP Bridge starting...");

  try {
    // Show hidden UI for network access (Figma plugins need UI to make network requests)
    figma.showUI(__html__, {
      visible: false,
      width: 1,
      height: 1,
    });

    // Create command processor
    processor = new CommandProcessor(onUIReady);

    // Get current file key
    // Note: figma.fileKey is available in the plugin API
    const fileKey = figma.fileKey;
    const fileName = figma.root.name;

    if (fileKey) {
      processor.setFileKey(fileKey);
      logger.info("File key: " + fileKey);

      // Announce current file to bridge server
      announceCurrentFile(fileKey, fileName);
    } else {
      // If no file key available, don't filter - get all commands
      logger.info("No file key available, will fetch all commands");
    }

    isRunning = true;
    logger.info("Plugin initialized, waiting for UI...");
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error("Initialization failed:", error);
    figma.notify(`MCP Bridge failed to start: ${message}`, { error: true });
  }
}

/**
 * Called when UI signals it's ready
 */
function onUIReady(): void {
  if (uiReady) return;
  uiReady = true;
  logger.info("UI ready, starting polling...");

  // Start polling now that UI is ready
  startPolling();

  // Notify user
  figma.notify("MCP Bridge running - monitoring for commands", {
    timeout: 3000,
  });
}

/**
 * Start polling for commands
 */
function startPolling(): void {
  if (pollInterval) {
    logger.warn("Polling already started");
    return;
  }

  logger.info(`Starting polling (${POLL_INTERVAL}ms interval)`);

  // Initial poll
  processor.requestCommands();

  // Set up interval
  pollInterval = setInterval(() => {
    if (isRunning) {
      processor.requestCommands();
    }
  }, POLL_INTERVAL);
}

/**
 * Stop polling for commands
 */
function stopPolling(): void {
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
    logger.info("Polling stopped");
  }
}

/**
 * Handle plugin close
 */
figma.on("close", () => {
  stopPolling();
  isRunning = false;
  logger.info("Plugin closing");
});

/**
 * Handle selection change (optional - for debugging)
 */
figma.on("selectionchange", () => {
  const selection = figma.currentPage.selection;
  if (selection.length > 0) {
    logger.debug(
      `Selection changed: ${selection.map((n) => `${n.name} (${n.id})`).join(", ")}`,
    );
  }
});

// Initialize on load
initialize();
