#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  CallToolResult,
} from "@modelcontextprotocol/sdk/types.js";

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
import { logger } from "./logger.js";
import { CONFIG } from "./config.js";

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

  const transport = new StdioServerTransport();
  await server.connect(transport);

  logger.info("Figma MCP Server running");
}

main().catch((error) => {
  logger.error("Fatal error:", error);
  process.exit(1);
});
