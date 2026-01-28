# MCP Server Development Examples

Practical examples for building MCP servers. See [SKILL.md](SKILL.md) for patterns and [reference.md](reference.md) for API details.

## Example 1: Complete Figma MCP Server

```typescript
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  CallToolResult,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

// Input schemas
const GetFileStructureSchema = z.object({
  fileKey: z.string().min(1).describe("Figma file key"),
  depth: z.number().int().min(1).max(10).optional().default(5),
});

const GetNodeDetailsSchema = z.object({
  fileKey: z.string(),
  nodeIds: z.array(z.string().regex(/^\d+:\d+$/)),
});

// Create server
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

// List tools
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "get_file_structure",
      description: "Get hierarchical structure of a Figma file",
      inputSchema: {
        type: "object",
        properties: {
          fileKey: {
            type: "string",
            description: "Figma file key from URL",
          },
          depth: {
            type: "number",
            description: "Maximum depth to traverse",
            minimum: 1,
            maximum: 10,
          },
        },
        required: ["fileKey"],
      },
    },
    {
      name: "get_node_details",
      description: "Get detailed properties of specific nodes",
      inputSchema: {
        type: "object",
        properties: {
          fileKey: { type: "string" },
          nodeIds: {
            type: "array",
            items: { type: "string", pattern: "^\\d+:\\d+$" },
          },
        },
        required: ["fileKey", "nodeIds"],
      },
    },
  ],
}));

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "get_file_structure": {
        const validated = GetFileStructureSchema.parse(args);
        const structure = await fetchFileStructure(
          validated.fileKey,
          validated.depth,
        );
        return {
          content: [{ type: "text", text: JSON.stringify(structure, null, 2) }],
        } as CallToolResult;
      }

      case "get_node_details": {
        const validated = GetNodeDetailsSchema.parse(args);
        const details = await fetchNodeDetails(
          validated.fileKey,
          validated.nodeIds,
        );
        return {
          content: [{ type: "text", text: JSON.stringify(details, null, 2) }],
        } as CallToolResult;
      }

      default:
        return {
          content: [{ type: "text", text: `Unknown tool: ${name}` }],
          isError: true,
        } as CallToolResult;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      content: [{ type: "text", text: `Error: ${message}` }],
      isError: true,
    } as CallToolResult;
  }
});

// Run server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Figma MCP Server running");
}

main().catch(console.error);
```

## Example 2: Resource-Based Server

```typescript
import {
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

// List available resources
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  const files = await listFigmaFiles();

  return {
    resources: files.map((file) => ({
      uri: `figma://file/${file.key}`,
      name: file.name,
      description: `Figma file: ${file.name}`,
      mimeType: "application/json",
    })),
  };
});

// Read resource content
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;

  if (uri.startsWith("figma://file/")) {
    const fileKey = uri.replace("figma://file/", "");
    const structure = await fetchFileStructure(fileKey);

    return {
      contents: [
        {
          uri,
          mimeType: "application/json",
          text: JSON.stringify(structure, null, 2),
        },
      ],
    };
  }

  throw new Error(`Unknown resource: ${uri}`);
});
```

## Example 3: Prompt Template Server

```typescript
import {
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

// List prompts
server.setRequestHandler(ListPromptsRequestSchema, async () => ({
  prompts: [
    {
      name: "analyze_design",
      description: "Analyze a Figma design file and provide insights",
      arguments: [
        {
          name: "fileKey",
          description: "Figma file key to analyze",
          required: true,
        },
        {
          name: "focus",
          description: "Focus area: layout, colors, typography, or all",
          required: false,
        },
      ],
    },
  ],
}));

// Get prompt
server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "analyze_design") {
    const fileKey = args?.fileKey as string;
    const focus = (args?.focus as string) || "all";
    const structure = await fetchFileStructure(fileKey);

    const promptText = `Analyze this Figma design file and provide insights.

File Structure:
${JSON.stringify(structure, null, 2)}

Focus Area: ${focus}

Please analyze:
${focus === "all" ? "- Layout and structure\n- Color usage\n- Typography\n- Component organization" : `- ${focus}`}`;

    return {
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: promptText,
          },
        },
      ],
    };
  }

  throw new Error(`Unknown prompt: ${name}`);
});
```

## Example 4: Error Handling with Retry

```typescript
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000,
): Promise<T> {
  let lastError: Error;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (i < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delayMs * (i + 1)));
      }
    }
  }

  throw lastError!;
}

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    const result = await withRetry(() => executeTool(name, args), 3, 1000);

    return {
      content: [{ type: "text", text: JSON.stringify(result) }],
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Failed after retries: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});
```

## Example 5: Rate-Limited API Client

```typescript
class RateLimitedClient {
  private queue: Array<() => Promise<any>> = [];
  private processing = false;
  private lastRequest = 0;
  private minDelay: number;

  constructor(minDelayMs: number = 100) {
    this.minDelay = minDelayMs;
  }

  async request<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;

    while (this.queue.length > 0) {
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequest;

      if (timeSinceLastRequest < this.minDelay) {
        await new Promise((resolve) =>
          setTimeout(resolve, this.minDelay - timeSinceLastRequest),
        );
      }

      const fn = this.queue.shift()!;
      await fn();
      this.lastRequest = Date.now();
    }

    this.processing = false;
  }
}

const apiClient = new RateLimitedClient(100); // 100ms between requests

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const result = await apiClient.request(async () => {
    return await fetchFromFigmaAPI(request.params);
  });

  return {
    content: [{ type: "text", text: JSON.stringify(result) }],
  };
});
```

## Example 6: Caching Layer

```typescript
interface CacheEntry<T> {
  value: T;
  expires: number;
}

class TTLCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private defaultTTL: number;

  constructor(defaultTTLMs: number = 60000) {
    this.defaultTTL = defaultTTLMs;
  }

  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      return undefined;
    }

    return entry.value;
  }

  set(key: string, value: T, ttlMs?: number): void {
    this.cache.set(key, {
      value,
      expires: Date.now() + (ttlMs ?? this.defaultTTL),
    });
  }

  clear(): void {
    this.cache.clear();
  }

  // Clean expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expires) {
        this.cache.delete(key);
      }
    }
  }
}

const cache = new TTLCache<any>(60000); // 1 minute TTL

// Cleanup every 5 minutes
setInterval(() => cache.cleanup(), 5 * 60 * 1000);

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const cacheKey = `${request.params.name}:${JSON.stringify(request.params.arguments)}`;

  // Check cache
  const cached = cache.get(cacheKey);
  if (cached) {
    return cached;
  }

  // Execute and cache
  const result = await executeTool(request.params);
  cache.set(cacheKey, result);

  return result;
});
```

## Example 7: Structured Logging

```typescript
interface LogContext {
  tool?: string;
  fileKey?: string;
  duration?: number;
  error?: Error;
  [key: string]: any;
}

class Logger {
  private log(level: string, message: string, context?: LogContext) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...context,
    };

    // Write to stderr (safe for stdio transport)
    console.error(JSON.stringify(logEntry));
  }

  error(message: string, context?: LogContext) {
    this.log("error", message, context);
  }

  warn(message: string, context?: LogContext) {
    this.log("warn", message, context);
  }

  info(message: string, context?: LogContext) {
    this.log("info", message, context);
  }

  debug(message: string, context?: LogContext) {
    this.log("debug", message, context);
  }
}

const logger = new Logger();

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const startTime = Date.now();
  const { name, arguments: args } = request.params;

  logger.info("Tool call started", { tool: name });

  try {
    const result = await executeTool(name, args);
    const duration = Date.now() - startTime;

    logger.info("Tool call completed", {
      tool: name,
      duration,
    });

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;

    logger.error("Tool call failed", {
      tool: name,
      duration,
      error: error instanceof Error ? error : new Error(String(error)),
    });

    return {
      content: [{ type: "text", text: `Error: ${error.message}` }],
      isError: true,
    };
  }
});
```

## Example 8: Validation Middleware

```typescript
type ToolHandler = (args: any) => Promise<CallToolResult>;

function withValidation<T extends z.ZodTypeAny>(
  schema: T,
  handler: (args: z.infer<T>) => Promise<CallToolResult>,
): ToolHandler {
  return async (args: unknown) => {
    try {
      const validated = schema.parse(args);
      return await handler(validated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const issues = error.errors
          .map((e) => `${e.path.join(".")}: ${e.message}`)
          .join(", ");

        return {
          content: [
            {
              type: "text",
              text: `Validation error: ${issues}`,
            },
          ],
          isError: true,
        };
      }
      throw error;
    }
  };
}

// Usage
const getFileStructureHandler = withValidation(
  GetFileStructureSchema,
  async (args) => {
    const structure = await fetchFileStructure(args.fileKey, args.depth);
    return {
      content: [{ type: "text", text: JSON.stringify(structure) }],
    };
  },
);

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "get_file_structure") {
    return await getFileStructureHandler(request.params.arguments);
  }
  // ...
});
```

## Example 9: Health Check Tool

```typescript
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    // ... other tools
    {
      name: "health_check",
      description: "Check server health and connectivity",
      inputSchema: {
        type: "object",
        properties: {},
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "health_check") {
    const checks = {
      server: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      },
    };

    // Test external API
    try {
      await testFigmaAPIConnection();
      checks.figmaAPI = "ok";
    } catch (error) {
      checks.figmaAPI = "error";
      checks.figmaAPIError = error.message;
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(checks, null, 2),
        },
      ],
    };
  }
  // ...
});
```

## Example 10: Batch Tool Execution

```typescript
const BatchExecuteSchema = z.object({
  tools: z.array(
    z.object({
      name: z.string(),
      arguments: z.record(z.any()).optional(),
    }),
  ),
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "batch_execute") {
    const validated = BatchExecuteSchema.parse(request.params.arguments);
    const results = [];

    for (const tool of validated.tools) {
      try {
        const result = await executeTool(tool.name, tool.arguments);
        results.push({
          tool: tool.name,
          success: true,
          result,
        });
      } catch (error) {
        results.push({
          tool: tool.name,
          success: false,
          error: error.message,
        });
      }
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ results }, null, 2),
        },
      ],
    };
  }
  // ...
});
```
