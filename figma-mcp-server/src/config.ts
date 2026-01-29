import { config } from "dotenv";

config();

export const CONFIG = {
  figma: {
    accessToken: process.env.FIGMA_ACCESS_TOKEN || "",
    apiBase: "https://api.figma.com/v1",
    timeout: parseInt(process.env.API_TIMEOUT_MS || "10000", 10),
  },
  server: {
    logLevel: process.env.LOG_LEVEL || "info",
  },
  rateLimit: {
    maxRequestsPerMinute: parseInt(
      process.env.MAX_REQUESTS_PER_MINUTE || "60",
      10,
    ),
  },
  bridge: {
    port: parseInt(process.env.BRIDGE_PORT || "3030", 10),
    enabled: process.env.BRIDGE_ENABLED !== "false",
  },
  cache: {
    ttlFileStructure: parseInt(
      process.env.CACHE_TTL_FILE_STRUCTURE || "300000",
      10,
    ), // 5 minutes default
    ttlNodeDetails: parseInt(process.env.CACHE_TTL_NODE_DETAILS || "30000", 10), // 30 seconds default
  },
  performance: {
    pluginPollInterval: parseInt(
      process.env.PLUGIN_POLL_INTERVAL || "1000",
      10,
    ), // 1 second default
    commandCheckInterval: parseInt(
      process.env.COMMAND_CHECK_INTERVAL || "200",
      10,
    ), // 200ms default
  },
  mcp: {
    transport: (process.env.MCP_TRANSPORT || "stdio") as "stdio" | "sse",
    httpPort: parseInt(process.env.MCP_HTTP_PORT || "3031", 10),
    httpHost: process.env.MCP_HTTP_HOST || "localhost",
  },
} as const;

// Validate required configuration
if (!CONFIG.figma.accessToken) {
  throw new Error("FIGMA_ACCESS_TOKEN is required in environment variables");
}
