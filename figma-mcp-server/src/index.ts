#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  CallToolResult,
} from "@modelcontextprotocol/sdk/types.js";
import type { Server as HttpServer } from "http";

import { TOOLS } from "./tools/registry.js";
import {
  getFileStructure,
  getNodeDetails,
  searchNodes,
  getComponents,
  getStyles,
  getVariables,
  getComments,
  getFileVersions,
} from "./tools/read-tools.js";
import { exportNode } from "./tools/export-tools.js";
import {
  postCommand,
  getCommandStatus,
  postBatchCommands,
  getQueueStats,
  getCurrentFile,
} from "./tools/command-tools.js";
import { logger } from "./logger.js";
import { CONFIG } from "./config.js";
import { bridgeServer } from "./bridge/server.js";
import { createSSETransport, stopSSEServer } from "./transport/sse.js";

// Create MCP server
const server = new Server(
  {
    name: "figma-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

// Register tool listing handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  logger.info("Listing available tools");
  return {
    tools: TOOLS.map((tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
    })),
  };
});

// Register tool execution handler
server.setRequestHandler(
  CallToolRequestSchema,
  async (request): Promise<CallToolResult> => {
    const { name, arguments: args } = request.params;

    logger.info(`Executing tool: ${name}`);

    try {
      let result;
      switch (name) {
        case "get_file_structure":
          result = await getFileStructure(args as any);
          break;

        case "get_node_details":
          result = await getNodeDetails(args as any);
          break;

        case "search_nodes":
          result = await searchNodes(args as any);
          break;

        case "get_components":
          result = await getComponents(args as any);
          break;

        case "get_styles":
          result = await getStyles(args as any);
          break;

        case "get_variables":
          result = await getVariables(args as any);
          break;

        case "export_node":
          result = await exportNode(args as any);
          break;

        case "get_comments":
          result = await getComments(args as any);
          break;

        case "get_file_versions":
          result = await getFileVersions(args as any);
          break;

        // Phase 2: Command tools
        case "post_command":
          result = await postCommand(args as any);
          break;

        case "get_command_status":
          result = await getCommandStatus(args as any);
          break;

        case "post_batch_commands":
          result = await postBatchCommands(args as any);
          break;

        case "get_queue_stats":
          result = await getQueueStats();
          break;

        case "get_current_file":
          result = await getCurrentFile(args as any);
          break;

        default:
          return {
            content: [{ type: "text", text: `Unknown tool: ${name}` }],
            isError: true,
          } as CallToolResult;
      }
      return result as CallToolResult;
    } catch (error: any) {
      logger.error(`Error executing tool ${name}:`, error);
      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
        isError: true,
      } as CallToolResult;
    }
  },
);

// Start server
async function main() {
  logger.info("Starting Figma MCP Server...");
  logger.info(`Figma API Base: ${CONFIG.figma.apiBase}`);
  logger.info(`Log Level: ${CONFIG.server.logLevel}`);
  logger.info(`Transport: ${CONFIG.mcp.transport}`);

  // Start bridge server for plugin communication
  if (CONFIG.bridge.enabled) {
    try {
      await bridgeServer.start();
      logger.info(`Bridge server enabled on port ${CONFIG.bridge.port}`);
    } catch (error) {
      logger.error("Failed to start bridge server:", error);
      // Continue without bridge - MCP server can still work
    }
  }

  let transport: StdioServerTransport | any;
  let sseHttpServer: HttpServer | null = null;

  // Select transport based on configuration
  if (CONFIG.mcp.transport === "sse") {
    // SSE transport: HTTP server handles connections, server.connect() called per-connection
    const sseSetup = await createSSETransport(server);
    sseHttpServer = sseSetup.httpServer;
    logger.info("Using SSE transport - waiting for client connections on /sse");
    logger.info(
      "Note: SSE transport creates connections on-demand when clients connect",
    );
  } else {
    transport = new StdioServerTransport();
    await server.connect(transport);
    logger.info("Using stdio transport");
  }

  logger.info("Figma MCP Server running");

  // Store SSE server reference for graceful shutdown
  if (sseHttpServer) {
    (global as any).__sseHttpServer = sseHttpServer;
  }
}

// Graceful shutdown
async function shutdown() {
  logger.info("Shutting down...");

  // Stop bridge server
  await bridgeServer.stop();

  // Stop SSE server if running
  const sseHttpServer = (global as any).__sseHttpServer;
  if (sseHttpServer) {
    await stopSSEServer(sseHttpServer);
  }

  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

main().catch((error) => {
  logger.error("Fatal error:", error);
  process.exit(1);
});
