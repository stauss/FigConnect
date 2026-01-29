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
} as const;

// Validate required configuration
if (!CONFIG.figma.accessToken) {
  throw new Error("FIGMA_ACCESS_TOKEN is required in environment variables");
}
