import { createServer, IncomingMessage, ServerResponse } from "http";
import { exec } from "child_process";
import { promisify } from "util";
import { commandQueue } from "../queue/manager.js";
import { CommandResponse, CommandResponseSchema } from "../commands/types.js";
import { logger } from "../logger.js";
import { CONFIG } from "../config.js";

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
        `lsof -ti:${this.port} 2>/dev/null || true`
      );
      
      const pids = stdout.trim().split('\n').filter(Boolean);
      
      if (pids.length > 0) {
        logger.info(`Found ${pids.length} existing process(es) on port ${this.port}: ${pids.join(', ')}`);
        
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
        await new Promise(resolve => setTimeout(resolve, 500));
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
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          try {
            this.server?.listen(this.port, () => {
              logger.info(`Bridge server running on http://localhost:${this.port} (after retry)`);
              resolve();
            });
          } catch (retryError) {
            logger.error(`Bridge server port ${this.port} is still in use after retry.`);
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
    // Set CORS headers for Figma plugin iframe
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

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
        } else if (response.status === "error") {
          commandQueue.markFailed(commandId, response);
          logger.info(
            `Command ${commandId} failed: ${response.error?.message}`,
          );
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
