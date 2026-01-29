import { createServer, IncomingMessage, ServerResponse } from "http";
import { exec } from "child_process";
import { promisify } from "util";
import { commandQueue } from "../queue/manager.js";
import { CommandResponse, CommandResponseSchema } from "../commands/types.js";
import { logger } from "../logger.js";
import { CONFIG } from "../config.js";
import { configStore } from "../storage/config-store.js";
import { database } from "../storage/database.js";
import { historyStore } from "../storage/history-store.js";
import { backupService } from "../backup/service.js";
import { figmaClient } from "../figma/client.js";

const execAsync = promisify(exec);

export class BridgeServer {
  private server: ReturnType<typeof createServer> | null = null;
  private port: number;
  private currentFile: { fileKey: string; fileName: string } | null = null;

  constructor(port: number = 3030) {
    this.port = port;
  }

  /**
   * Get the current file key
   */
  getCurrentFile(): { fileKey: string; fileName: string } | null {
    return this.currentFile;
  }

  /**
   * Set the current file key
   */
  setCurrentFile(fileKey: string, fileName: string): void {
    this.currentFile = { fileKey, fileName };
    logger.info(`Current file set: ${fileName} (${fileKey})`);
  }

  /**
   * Kill any existing process using the specified port
   */
  private async killExistingProcess(): Promise<void> {
    try {
      // Find process using the port (works on macOS/Linux)
      const { stdout } = await execAsync(
        `lsof -ti:${this.port} 2>/dev/null || true`,
      );

      const pids = stdout.trim().split("\n").filter(Boolean);

      if (pids.length > 0) {
        logger.info(
          `Found ${pids.length} existing process(es) on port ${this.port}: ${pids.join(", ")}`,
        );

        // Kill each process
        for (const pid of pids) {
          try {
            await execAsync(`kill -9 ${pid}`);
            logger.info(`Killed process ${pid}`);
          } catch (killError) {
            // Process may have already exited
            logger.debug(`Could not kill process ${pid}: ${killError}`);
          }
        }

        // Wait a moment for the port to be released
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    } catch (error) {
      // lsof might not be available, or other errors - continue anyway
      logger.debug(`Could not check for existing processes: ${error}`);
    }
  }

  /**
   * Start the HTTP bridge server
   */
  async start(): Promise<void> {
    // Kill any existing process on this port first
    await this.killExistingProcess();

    return new Promise((resolve, reject) => {
      this.server = createServer((req, res) => {
        this.handleRequest(req, res);
      });

      this.server.on("error", async (error: Error & { code?: string }) => {
        if (error.code === "EADDRINUSE") {
          logger.warn(
            `Port ${this.port} still in use after cleanup attempt. Retrying...`,
          );

          // Try one more time after a longer delay
          await this.killExistingProcess();
          await new Promise((resolve) => setTimeout(resolve, 1000));

          try {
            this.server?.listen(this.port, () => {
              logger.info(
                `Bridge server running on http://localhost:${this.port} (after retry)`,
              );
              resolve();
            });
          } catch (retryError) {
            logger.error(
              `Bridge server port ${this.port} is still in use after retry.`,
            );
            reject(error);
          }
        } else {
          logger.error("Bridge server error:", error);
          reject(error);
        }
      });

      this.server.listen(this.port, () => {
        logger.info(`Bridge server running on http://localhost:${this.port}`);
        resolve();
      });
    });
  }

  /**
   * Stop the HTTP bridge server
   */
  stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          logger.info("Bridge server stopped");
          this.server = null;
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  /**
   * Handle incoming HTTP requests
   */
  private handleRequest(req: IncomingMessage, res: ServerResponse): void {
    // Set CORS headers for Figma plugin iframe and browser UI
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS",
    );
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization",
    );

    // Handle preflight
    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    const url = new URL(req.url || "/", `http://localhost:${this.port}`);
    const path = url.pathname;

    logger.debug(`Bridge request: ${req.method} ${path}`);

    // Route requests
    if (req.method === "GET" && path === "/api/commands") {
      this.handleGetCommands(req, res, url);
    } else if (req.method === "POST" && path.startsWith("/api/commands/")) {
      const commandId = path.split("/")[3];
      if (path.endsWith("/response")) {
        this.handlePostResponse(req, res, commandId);
      } else {
        this.sendError(res, 404, "Not Found");
      }
    } else if (req.method === "GET" && path === "/api/health") {
      this.handleHealth(res);
    } else if (req.method === "GET" && path === "/api/stats") {
      this.handleGetStats(res);
    } else if (req.method === "POST" && path === "/api/capabilities") {
      this.handlePostCapabilities(req, res);
    } else if (req.method === "GET" && path === "/api/capabilities") {
      this.handleGetCapabilities(res);
    } else if (req.method === "POST" && path === "/api/current-file") {
      this.handlePostCurrentFile(req, res);
    } else if (req.method === "GET" && path === "/api/current-file") {
      this.handleGetCurrentFile(res);
    } else if (path.startsWith("/api/ui/")) {
      this.handleUIRequest(req, res, path);
    } else {
      this.sendError(res, 404, "Not Found");
    }
  }

  /**
   * GET /api/commands - Get pending commands for a file
   */
  private handleGetCommands(
    _req: IncomingMessage,
    res: ServerResponse,
    url: URL,
  ): void {
    try {
      const fileKey = url.searchParams.get("file_key");

      // Get pending and posted commands
      const pending = commandQueue.getByStatus("pending");
      const posted = commandQueue.getByStatus("posted");
      let commands = [...pending, ...posted];

      // Filter by file key if provided
      if (fileKey) {
        commands = commands.filter((cmd) => cmd.fileKey === fileKey);
      }

      // Return command data for the plugin
      const commandData = commands.map((qc) => ({
        id: qc.command.id,
        type: qc.command.type,
        version: qc.command.version,
        command: qc.command.command,
        params: qc.command.params,
        parent: qc.command.parent,
        fileKey: qc.fileKey,
        timestamp: qc.command.timestamp,
        createdAt: qc.createdAt,
      }));

      this.sendJson(res, 200, { commands: commandData });
    } catch (error) {
      logger.error("Error getting commands:", error);
      this.sendError(res, 500, "Internal Server Error");
    }
  }

  /**
   * POST /api/commands/:id/response - Post a command response
   */
  private handlePostResponse(
    req: IncomingMessage,
    res: ServerResponse,
    commandId: string,
  ): void {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", () => {
      try {
        const data = JSON.parse(body);

        // Validate response format
        const parseResult = CommandResponseSchema.safeParse(data);
        if (!parseResult.success) {
          this.sendError(res, 400, "Invalid response format");
          return;
        }

        const response = parseResult.data as CommandResponse;

        // Verify command exists
        const command = commandQueue.get(commandId);
        if (!command) {
          this.sendError(res, 404, "Command not found");
          return;
        }

        // Update command status
        if (response.status === "success") {
          commandQueue.markCompleted(commandId, response);
          logger.info(`Command ${commandId} completed successfully`);

          // Update history
          const queuedCommand = commandQueue.get(commandId);
          if (queuedCommand) {
            historyStore
              .updateCommandStatus(
                commandId,
                "completed",
                response.result,
                undefined,
                response.executionTime,
              )
              .catch((err) => logger.error("Failed to update history:", err));
          }
        } else if (response.status === "error") {
          commandQueue.markFailed(commandId, response);
          logger.info(
            `Command ${commandId} failed: ${response.error?.message}`,
          );

          // Update history
          const queuedCommand = commandQueue.get(commandId);
          if (queuedCommand) {
            historyStore
              .updateCommandStatus(
                commandId,
                "failed",
                undefined,
                response.error?.message || "Unknown error",
              )
              .catch((err) => logger.error("Failed to update history:", err));
          }
        }

        this.sendJson(res, 200, { success: true });
      } catch (error) {
        logger.error("Error processing response:", error);
        this.sendError(res, 400, "Invalid JSON");
      }
    });

    req.on("error", (error) => {
      logger.error("Request error:", error);
      this.sendError(res, 500, "Request Error");
    });
  }

  /**
   * GET /api/health - Health check endpoint
   */
  private handleHealth(res: ServerResponse): void {
    this.sendJson(res, 200, {
      status: "ok",
      version: "1.0.0",
      uptime: process.uptime(),
    });
  }

  /**
   * GET /api/stats - Get queue statistics
   */
  private handleGetStats(res: ServerResponse): void {
    const stats = commandQueue.getStats();
    this.sendJson(res, 200, stats);
  }

  /**
   * Send JSON response
   */
  private sendJson(res: ServerResponse, status: number, data: unknown): void {
    res.writeHead(status, { "Content-Type": "application/json" });
    res.end(JSON.stringify(data));
  }

  /**
   * POST /api/capabilities - Receive capability announcements from plugin
   */
  private handlePostCapabilities(
    req: IncomingMessage,
    res: ServerResponse,
  ): void {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", () => {
      try {
        const data = JSON.parse(body);
        const { pluginId, capabilities } = data;

        if (!pluginId || !capabilities) {
          this.sendError(res, 400, "Missing pluginId or capabilities");
          return;
        }

        logger.info(
          `Received capabilities from plugin ${pluginId}: ${capabilities.length} capabilities`,
        );

        // Store capabilities (future: use capability registry)
        // For MVP: Just log, future: register with plugin registry

        this.sendJson(res, 200, {
          success: true,
          registered: capabilities.length,
        });
      } catch (error) {
        logger.error("Error processing capabilities:", error);
        this.sendError(res, 400, "Invalid JSON");
      }
    });

    req.on("error", (error) => {
      logger.error("Request error:", error);
      this.sendError(res, 500, "Request Error");
    });
  }

  /**
   * GET /api/capabilities - Get registered capabilities
   */
  private handleGetCapabilities(res: ServerResponse): void {
    // Future: Return capabilities from registry
    // For MVP: Return empty or hardcoded list
    this.sendJson(res, 200, {
      capabilities: [],
      message: "Capability registry not yet implemented",
    });
  }

  /**
   * POST /api/current-file - Receive current file announcement from plugin
   */
  private handlePostCurrentFile(
    req: IncomingMessage,
    res: ServerResponse,
  ): void {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", () => {
      try {
        const data = JSON.parse(body);
        const { fileKey, fileName } = data;

        if (!fileKey) {
          this.sendError(res, 400, "Missing fileKey");
          return;
        }

        this.setCurrentFile(fileKey, fileName || "Unknown");
        logger.info(
          `Received current file: ${fileName || "Unknown"} (${fileKey})`,
        );

        this.sendJson(res, 200, {
          success: true,
          fileKey,
          fileName: fileName || "Unknown",
        });
      } catch (error) {
        logger.error("Error processing current file:", error);
        this.sendError(res, 400, "Invalid JSON");
      }
    });

    req.on("error", (error) => {
      logger.error("Request error:", error);
      this.sendError(res, 500, "Request Error");
    });
  }

  /**
   * GET /api/current-file - Get the current file key
   */
  private handleGetCurrentFile(res: ServerResponse): void {
    if (!this.currentFile) {
      this.sendJson(res, 200, {
        fileKey: null,
        fileName: null,
      });
      return;
    }

    this.sendJson(res, 200, {
      fileKey: this.currentFile.fileKey,
      fileName: this.currentFile.fileName,
    });
  }

  /**
   * Handle UI API requests
   */
  private handleUIRequest(
    req: IncomingMessage,
    res: ServerResponse,
    path: string,
  ): void {
    // Route UI endpoints
    if (req.method === "GET" && path === "/api/ui/config") {
      this.handleGetConfig(res);
    } else if (req.method === "POST" && path === "/api/ui/config") {
      this.handlePostConfig(req, res);
    } else if (req.method === "GET" && path === "/api/ui/projects") {
      this.handleGetProjects(res);
    } else if (req.method === "POST" && path === "/api/ui/projects/connect") {
      this.handleConnectProject(req, res);
    } else if (
      req.method === "POST" &&
      path === "/api/ui/projects/disconnect"
    ) {
      this.handleDisconnectProject(req, res);
    } else if (req.method === "GET" && path === "/api/ui/history") {
      this.handleGetHistory(req, res);
    } else if (req.method === "GET" && path === "/api/ui/conversations") {
      this.handleGetConversations(req, res);
    } else if (req.method === "GET" && path === "/api/ui/backups") {
      this.handleGetBackups(req, res);
    } else if (req.method === "POST" && path === "/api/ui/backups/restore") {
      this.handleRestoreBackup(req, res);
    } else if (req.method === "GET" && path === "/api/ui/status") {
      this.handleGetStatus(res);
    } else {
      this.sendError(res, 404, "Not Found");
    }
  }

  /**
   * GET /api/ui/config - Get configuration
   */
  private async handleGetConfig(res: ServerResponse): Promise<void> {
    try {
      const config = await configStore.getConfig();
      this.sendJson(res, 200, config);
    } catch (error: any) {
      logger.error("Error getting config:", error);
      this.sendError(res, 500, error.message);
    }
  }

  /**
   * POST /api/ui/config - Save configuration
   */
  private async handlePostConfig(
    req: IncomingMessage,
    res: ServerResponse,
  ): Promise<void> {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", async () => {
      try {
        const data = JSON.parse(body);
        await configStore.saveConfig(data);
        this.sendJson(res, 200, { success: true });
      } catch (error: any) {
        logger.error("Error saving config:", error);
        this.sendError(res, 400, error.message);
      }
    });
  }

  /**
   * GET /api/ui/projects - List projects/files
   */
  private async handleGetProjects(res: ServerResponse): Promise<void> {
    try {
      const connections = await database.getProjectConnections();
      const currentFile = this.getCurrentFile();

      // Add current file from plugin if not already in connections
      if (currentFile) {
        const exists = connections.find(
          (c) => c.fileKey === currentFile.fileKey,
        );
        if (!exists) {
          connections.push({
            fileKey: currentFile.fileKey,
            fileName: currentFile.fileName,
            enabled: true,
            connectedAt: new Date().toISOString(),
            lastSeenAt: new Date().toISOString(),
          });
        } else {
          // Update last seen
          exists.lastSeenAt = new Date().toISOString();
        }
      }

      this.sendJson(res, 200, { projects: connections });
    } catch (error: any) {
      logger.error("Error getting projects:", error);
      this.sendError(res, 500, error.message);
    }
  }

  /**
   * POST /api/ui/projects/connect - Connect project/file
   */
  private async handleConnectProject(
    req: IncomingMessage,
    res: ServerResponse,
  ): Promise<void> {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", async () => {
      try {
        const data = JSON.parse(body);
        const { fileKey, fileName, projectId, projectName, pages, enabled } =
          data;

        if (!fileKey) {
          this.sendError(res, 400, "fileKey is required");
          return;
        }

        // Validate file exists
        try {
          const fileData = await figmaClient.getFile(fileKey, 1);
          const actualFileName =
            (fileData as any)?.name || fileName || `file-${fileKey}`;

          const connection = {
            fileKey,
            fileName: actualFileName,
            projectId,
            projectName,
            pages: pages || [],
            enabled: enabled !== false,
            connectedAt: new Date().toISOString(),
            lastSeenAt: new Date().toISOString(),
          };

          await database.saveProjectConnection(connection);
          this.sendJson(res, 200, { success: true, connection });
        } catch (error: any) {
          this.sendError(res, 400, `Invalid file key: ${error.message}`);
        }
      } catch (error: any) {
        logger.error("Error connecting project:", error);
        this.sendError(res, 400, error.message);
      }
    });
  }

  /**
   * POST /api/ui/projects/disconnect - Disconnect project/file
   */
  private async handleDisconnectProject(
    req: IncomingMessage,
    res: ServerResponse,
  ): Promise<void> {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", async () => {
      try {
        const data = JSON.parse(body);
        const { fileKey } = data;

        if (!fileKey) {
          this.sendError(res, 400, "fileKey is required");
          return;
        }

        await database.removeProjectConnection(fileKey);
        this.sendJson(res, 200, { success: true });
      } catch (error: any) {
        logger.error("Error disconnecting project:", error);
        this.sendError(res, 400, error.message);
      }
    });
  }

  /**
   * GET /api/ui/history - Get command history
   */
  private async handleGetHistory(
    req: IncomingMessage,
    res: ServerResponse,
  ): Promise<void> {
    try {
      const url = new URL(req.url || "/", `http://localhost:${this.port}`);
      const fileKey = url.searchParams.get("fileKey") || undefined;
      const status = url.searchParams.get("status") as any;
      const after = url.searchParams.get("after") || undefined;
      const before = url.searchParams.get("before") || undefined;
      const limit = url.searchParams.get("limit")
        ? parseInt(url.searchParams.get("limit")!, 10)
        : undefined;

      const history = await historyStore.getCommandHistory({
        fileKey,
        status,
        after,
        before,
        limit,
      });

      this.sendJson(res, 200, { history });
    } catch (error: any) {
      logger.error("Error getting history:", error);
      this.sendError(res, 500, error.message);
    }
  }

  /**
   * GET /api/ui/conversations - Get conversation log
   */
  private async handleGetConversations(
    req: IncomingMessage,
    res: ServerResponse,
  ): Promise<void> {
    try {
      const url = new URL(req.url || "/", `http://localhost:${this.port}`);
      const fileKey = url.searchParams.get("fileKey") || undefined;
      const after = url.searchParams.get("after") || undefined;
      const before = url.searchParams.get("before") || undefined;
      const limit = url.searchParams.get("limit")
        ? parseInt(url.searchParams.get("limit")!, 10)
        : undefined;

      const conversations = await historyStore.getConversations({
        fileKey,
        after,
        before,
        limit,
      });

      this.sendJson(res, 200, { conversations });
    } catch (error: any) {
      logger.error("Error getting conversations:", error);
      this.sendError(res, 500, error.message);
    }
  }

  /**
   * GET /api/ui/backups - List backups
   */
  private async handleGetBackups(
    req: IncomingMessage,
    res: ServerResponse,
  ): Promise<void> {
    try {
      const url = new URL(req.url || "/", `http://localhost:${this.port}`);
      const fileKey = url.searchParams.get("fileKey");

      if (!fileKey) {
        this.sendError(res, 400, "fileKey is required");
        return;
      }

      const backups = await backupService.getBackups(fileKey);
      this.sendJson(res, 200, { backups });
    } catch (error: any) {
      logger.error("Error getting backups:", error);
      this.sendError(res, 500, error.message);
    }
  }

  /**
   * POST /api/ui/backups/restore - Restore from backup
   */
  private async handleRestoreBackup(
    req: IncomingMessage,
    res: ServerResponse,
  ): Promise<void> {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", async () => {
      try {
        const data = JSON.parse(body);
        const { backupId } = data;

        if (!backupId) {
          this.sendError(res, 400, "backupId is required");
          return;
        }

        const restoreData = await backupService.getBackupForRestore(backupId);
        this.sendJson(res, 200, restoreData);
      } catch (error: any) {
        logger.error("Error restoring backup:", error);
        this.sendError(res, 400, error.message);
      }
    });
  }

  /**
   * GET /api/ui/status - Get MCP connection status
   */
  private handleGetStatus(res: ServerResponse): void {
    const currentFile = this.getCurrentFile();
    const stats = commandQueue.getStats();

    this.sendJson(res, 200, {
      bridgeServer: {
        running: true,
        port: this.port,
      },
      currentFile: currentFile || null,
      queue: stats,
      mcpServer: {
        // Could add more MCP server status here
        connected: true,
      },
    });
  }

  /**
   * Send error response
   */
  private sendError(
    res: ServerResponse,
    status: number,
    message: string,
  ): void {
    res.writeHead(status, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: message }));
  }
}

// Singleton instance
export const bridgeServer = new BridgeServer(CONFIG.bridge?.port || 3030);
