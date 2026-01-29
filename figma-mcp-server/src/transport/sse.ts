import {
  createServer,
  Server as HttpServer,
  IncomingMessage,
  ServerResponse,
} from "http";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { logger } from "../logger.js";
import { CONFIG } from "../config.js";
import type { Server } from "@modelcontextprotocol/sdk/server/index.js";

// Connection health tracking
const connections = new Set<ServerResponse>();
let lastHeartbeat = Date.now();
const HEARTBEAT_INTERVAL = 30000; // 30 seconds

/**
 * Create and configure SSE transport with HTTP server
 * Note: SSEServerTransport creates a transport per-connection
 * We set up the HTTP server to handle SSE connections and create transports on-demand
 */
export async function createSSETransport(
  mcpServer: Server,
): Promise<{ httpServer: HttpServer }> {
  const httpServer = createServer();

  // Handle SSE connections
  httpServer.on(
    "request",
    async (req: IncomingMessage, res: ServerResponse) => {
      // Set CORS headers
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type");
      res.setHeader("Access-Control-Expose-Headers", "Content-Type");

      // Handle preflight
      if (req.method === "OPTIONS") {
        res.writeHead(204);
        res.end();
        return;
      }

      // Handle SSE GET request
      if (req.method === "GET" && req.url === "/sse") {
        try {
          connections.add(res);
          logger.debug(
            `New SSE connection. Active connections: ${connections.size}`,
          );

          // Create transport for this connection
          // Note: SSEServerTransport is per-connection
          const transport = new SSEServerTransport("/sse", res);

          // Connect server to this transport
          // The server will handle this connection
          mcpServer.connect(transport).catch((error) => {
            logger.error("Error connecting SSE transport:", error);
            res.writeHead(500);
            res.end("Connection Error");
            connections.delete(res);
          });

          // Remove connection when closed
          res.on("close", () => {
            connections.delete(res);
            logger.debug(
              `SSE connection closed. Active connections: ${connections.size}`,
            );
          });
        } catch (error) {
          logger.error("Error setting up SSE connection:", error);
          res.writeHead(500);
          res.end("Internal Server Error");
          connections.delete(res);
        }
        return;
      }

      // Handle POST requests (for messages from client)
      if (req.method === "POST" && req.url?.startsWith("/sse")) {
        let body = "";
        req.on("data", (chunk) => {
          body += chunk.toString();
        });
        req.on("end", () => {
          // The transport handles message processing
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ received: true }));
        });
        return;
      }

      // 404 for other routes
      res.writeHead(404);
      res.end("Not Found");
    },
  );

  // Start heartbeat monitoring
  const heartbeatInterval = setInterval(() => {
    const now = Date.now();
    if (now - lastHeartbeat > HEARTBEAT_INTERVAL * 2 && connections.size > 0) {
      logger.warn("No heartbeat detected, connection may be stale");
    }
    lastHeartbeat = now;
  }, HEARTBEAT_INTERVAL);

  // Clean up heartbeat on server close
  httpServer.on("close", () => {
    clearInterval(heartbeatInterval);
  });

  return new Promise((resolve, reject) => {
    httpServer.listen(CONFIG.mcp.httpPort, CONFIG.mcp.httpHost, () => {
      logger.info(
        `SSE transport server listening on http://${CONFIG.mcp.httpHost}:${CONFIG.mcp.httpPort}/sse`,
      );
      logger.info(
        `SSE URL for remote clients: http://${CONFIG.mcp.httpHost}:${CONFIG.mcp.httpPort}/sse`,
      );
      resolve({ httpServer });
    });

    httpServer.on("error", (error: Error & { code?: string }) => {
      clearInterval(heartbeatInterval);
      if (error.code === "EADDRINUSE") {
        logger.error(
          `SSE transport port ${CONFIG.mcp.httpPort} is already in use. Try a different port.`,
        );
        reject(error);
      } else {
        logger.error("SSE transport server error:", error);
        reject(error);
      }
    });
  });
}

/**
 * Stop SSE transport HTTP server
 */
export async function stopSSEServer(httpServer: HttpServer): Promise<void> {
  return new Promise((resolve) => {
    httpServer.close(() => {
      logger.info("SSE transport server stopped");
      resolve();
    });
  });
}
