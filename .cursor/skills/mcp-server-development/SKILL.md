---
name: mcp-server-development
description: Provides patterns and best practices for building Model Context Protocol (MCP) servers. Use when implementing MCP servers, registering tools and resources, handling protocol communication, working with MCP SDK, or integrating AI applications with external systems via MCP.
---

# MCP Server Development

## Quick Start

MCP servers expose capabilities to AI applications through three main interfaces: **Tools**, **Resources**, and **Prompts**. Use the `@modelcontextprotocol/sdk` for TypeScript implementations.

```typescript
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// Create server instance
const server = new Server({
  name: "my-server",
  version: "1.0.0",
});

// Register a tool
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "my_tool",
      description: "Does something useful",
      inputSchema: {
        type: "object",
        properties: {
          param: { type: "string", description: "A parameter" },
        },
        required: ["param"],
      },
    },
  ],
}));

// Connect and run
const transport = new StdioServerTransport();
await server.connect(transport);
```

## Core Concepts

### Three Capability Types

1. **Tools**: Executable functions the AI can call
2. **Resources**: Readable data sources (files, API responses)
3. **Prompts**: Pre-defined interaction templates

### Transport Options

- **stdio**: Best for local, per-user integrations (most common)
- **HTTP/SSE**: Best for remote, shared services

## Tool Implementation

### Basic Tool Registration

```typescript
import {
  CallToolRequestSchema,
  CallToolResult,
} from "@modelcontextprotocol/sdk/types.js";

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case "my_tool":
      const result = await executeMyTool(args);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result),
          },
        ],
      } as CallToolResult;

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});
```

### Tool with Zod Schema Validation

```typescript
import { z } from "zod";

const ToolInputSchema = z.object({
  fileKey: z.string().describe("Figma file key"),
  depth: z.number().min(1).max(10).optional().default(5),
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "get_file_structure") {
    // Validate input
    const validated = ToolInputSchema.parse(args);

    // Execute tool
    const result = await getFileStructure(validated.fileKey, validated.depth);

    return {
      content: [{ type: "text", text: JSON.stringify(result) }],
    } as CallToolResult;
  }
});
```

### Tool List Registration

```typescript
import { ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

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
  ],
}));
```

## Resource Implementation

### List Resources

```typescript
import { ListResourcesRequestSchema } from "@modelcontextprotocol/sdk/types.js";

server.setRequestHandler(ListResourcesRequestSchema, async () => ({
  resources: [
    {
      uri: "figma://file/abc123",
      name: "Figma File: abc123",
      description: "Design file structure",
      mimeType: "application/json",
    },
  ],
}));
```

### Read Resource

```typescript
import { ReadResourceRequestSchema } from "@modelcontextprotocol/sdk/types.js";

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;

  if (uri.startsWith("figma://file/")) {
    const fileKey = uri.replace("figma://file/", "");
    const data = await fetchFileData(fileKey);

    return {
      contents: [
        {
          uri,
          mimeType: "application/json",
          text: JSON.stringify(data),
        },
      ],
    };
  }

  throw new Error(`Unknown resource: ${uri}`);
});
```

## Prompt Templates

### List Prompts

```typescript
import { ListPromptsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

server.setRequestHandler(ListPromptsRequestSchema, async () => ({
  prompts: [
    {
      name: "analyze_design",
      description: "Analyze a Figma design file",
      arguments: [
        {
          name: "fileKey",
          description: "Figma file key",
          required: true,
        },
      ],
    },
  ],
}));
```

### Get Prompt

```typescript
import { GetPromptRequestSchema } from "@modelcontextprotocol/sdk/types.js";

server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "analyze_design") {
    const fileKey = args?.fileKey as string;
    const structure = await getFileStructure(fileKey);

    return {
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Analyze this Figma design structure:\n\n${JSON.stringify(structure, null, 2)}`,
          },
        },
      ],
    };
  }

  throw new Error(`Unknown prompt: ${name}`);
});
```

## Error Handling

### Tool Execution Errors

```typescript
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const { name, arguments: args } = request.params;

    // Validate input
    const validated = ToolInputSchema.parse(args);

    // Execute
    const result = await executeTool(name, validated);

    return {
      content: [{ type: "text", text: JSON.stringify(result) }],
    } as CallToolResult;
  } catch (error) {
    // Return error in result, don't throw
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    } as CallToolResult;
  }
});
```

### Validation Errors

```typescript
import { z } from "zod";

function validateToolInput<T>(schema: z.ZodSchema<T>, input: unknown): T {
  try {
    return schema.parse(input);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues.map(
        (i) => `${i.path.join(".")}: ${i.message}`,
      );
      throw new Error(`Validation failed: ${issues.join(", ")}`);
    }
    throw error;
  }
}
```

## Logging Best Practices

### Critical: Never Log to stdout

**For stdio transport, stdout is used for JSON-RPC messages. Logging to stdout will break the protocol.**

```typescript
// ❌ BAD - Breaks stdio transport
console.log("Server started");
console.log("Processing request");

// ✅ GOOD - Use stderr for logging
console.error("Server started");
console.error("Processing request");

// ✅ BETTER - Use a proper logging library
import { createLogger, format, transports } from "winston";

const logger = createLogger({
  level: "info",
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.json(),
  ),
  transports: [
    new transports.File({ filename: "error.log", level: "error" }),
    new transports.File({ filename: "combined.log" }),
  ],
});

// For stdio, also log to stderr
if (process.env.MCP_TRANSPORT === "stdio") {
  logger.add(
    new transports.Stream({
      stream: process.stderr,
      format: format.simple(),
    }),
  );
}
```

### Logging Levels

```typescript
logger.error("Critical error occurred", { error, context });
logger.warn("Warning condition", { data });
logger.info("Informational message", { data });
logger.debug("Debug information", { details });
```

## Server Initialization

### Complete Server Setup

```typescript
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

async function main() {
  // Create server
  const server = new Server(
    {
      name: "figma-mcp-server",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},
        resources: {},
        prompts: {},
      },
    },
  );

  // Register handlers
  registerToolHandlers(server);
  registerResourceHandlers(server);
  registerPromptHandlers(server);

  // Connect transport
  const transport = new StdioServerTransport();
  await server.connect(transport);

  // Log to stderr only
  console.error("Figma MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
```

## TypeScript Patterns

### Type-Safe Tool Handlers

```typescript
type ToolHandler<T> = (args: T) => Promise<CallToolResult>;

interface GetFileStructureArgs {
  fileKey: string;
  depth?: number;
}

const getFileStructureHandler: ToolHandler<GetFileStructureArgs> = async (
  args,
) => {
  const result = await fetchFileStructure(args.fileKey, args.depth ?? 5);
  return {
    content: [{ type: "text", text: JSON.stringify(result) }],
  };
};

// Register with type safety
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "get_file_structure") {
    return await getFileStructureHandler(args as GetFileStructureArgs);
  }

  throw new Error(`Unknown tool: ${name}`);
});
```

### Schema Validation Helper

```typescript
import { z } from "zod";

function createToolHandler<T extends z.ZodTypeAny>(
  schema: T,
  handler: (args: z.infer<T>) => Promise<CallToolResult>,
): (args: unknown) => Promise<CallToolResult> {
  return async (args: unknown) => {
    try {
      const validated = schema.parse(args);
      return await handler(validated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          content: [
            {
              type: "text",
              text: `Validation error: ${error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ")}`,
            },
          ],
          isError: true,
        } as CallToolResult;
      }
      throw error;
    }
  };
}

// Usage
const handler = createToolHandler(
  z.object({ fileKey: z.string() }),
  async (args) => {
    // args is typed as { fileKey: string }
    return { content: [{ type: "text", text: "Success" }] };
  },
);
```

## Best Practices

### 1. Single Responsibility

Each MCP server should focus on one domain:

```typescript
// ✅ Good - Focused server
const server = new Server({ name: "figma-mcp-server" });

// ❌ Bad - Kitchen sink server
const server = new Server({ name: "everything-server" });
```

### 2. Contracts First

Define strict input/output schemas:

```typescript
// ✅ Good - Explicit schema
const ToolInputSchema = z.object({
  fileKey: z.string().min(1).describe("Figma file key"),
  depth: z.number().int().min(1).max(10).optional(),
});

// ❌ Bad - Loose typing
const ToolInputSchema = z.record(z.any());
```

### 3. Stateless by Default

Keep tools stateless for scalability:

```typescript
// ✅ Good - Stateless
async function getFileStructure(fileKey: string) {
  return await fetchFromAPI(fileKey);
}

// ❌ Bad - Stateful
let cache: Map<string, any> = new Map();
async function getFileStructure(fileKey: string) {
  if (cache.has(fileKey)) return cache.get(fileKey);
  // ...
}
```

### 4. Error Messages

Provide clear, actionable error messages:

```typescript
// ✅ Good
throw new Error(`File key '${fileKey}' not found. Verify the key is correct.`);

// ❌ Bad
throw new Error("Error");
```

### 5. Async Operations

Always handle async operations properly:

```typescript
// ✅ Good
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const result = await asyncOperation();
  return { content: [{ type: "text", text: result }] };
});

// ❌ Bad - Missing await
server.setRequestHandler(CallToolRequestSchema, (request) => {
  const result = asyncOperation(); // Returns Promise, not value
  return { content: [{ type: "text", text: result }] };
});
```

## Common Patterns

### Rate Limiting

```typescript
class RateLimiter {
  private requests: number[] = [];
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests: number, windowMs: number) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  async checkLimit(): Promise<void> {
    const now = Date.now();
    this.requests = this.requests.filter((t) => now - t < this.windowMs);

    if (this.requests.length >= this.maxRequests) {
      const oldest = this.requests[0];
      const waitTime = this.windowMs - (now - oldest);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
      return this.checkLimit();
    }

    this.requests.push(now);
  }
}

const limiter = new RateLimiter(60, 60000); // 60 requests per minute

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  await limiter.checkLimit();
  // Execute tool
});
```

### Request Timeout

```typescript
async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(
        () => reject(new Error(`Operation timed out after ${timeoutMs}ms`)),
        timeoutMs,
      ),
    ),
  ]);
}

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const result = await withTimeout(
      executeLongRunningOperation(),
      30000, // 30 second timeout
    );
    return { content: [{ type: "text", text: JSON.stringify(result) }] };
  } catch (error) {
    return {
      content: [{ type: "text", text: `Error: ${error.message}` }],
      isError: true,
    };
  }
});
```

### Caching

```typescript
class SimpleCache<T> {
  private cache = new Map<string, { value: T; expires: number }>();

  set(key: string, value: T, ttlMs: number): void {
    this.cache.set(key, {
      value,
      expires: Date.now() + ttlMs,
    });
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

  clear(): void {
    this.cache.clear();
  }
}

const cache = new SimpleCache<any>();

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const cacheKey = JSON.stringify(request.params);
  const cached = cache.get(cacheKey);

  if (cached) {
    return cached;
  }

  const result = await executeTool(request);
  cache.set(cacheKey, result, 60000); // Cache for 1 minute
  return result;
});
```

## Testing

### Unit Testing Tools

```typescript
import { describe, it, expect } from "vitest";

describe("getFileStructure tool", () => {
  it("should return file structure", async () => {
    const result = await getFileStructureHandler({
      fileKey: "test-key",
      depth: 3,
    });

    expect(result.content).toBeDefined();
    expect(result.content[0].type).toBe("text");
  });

  it("should handle invalid file key", async () => {
    const result = await getFileStructureHandler({
      fileKey: "invalid",
    });

    expect(result.isError).toBe(true);
  });
});
```

## Additional Resources

- [MCP Specification](https://modelcontextprotocol.io/specification)
- [TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [MCP Best Practices](https://modelcontextprotocol.io/docs/learn/server-concepts)
- [Example Servers](https://github.com/modelcontextprotocol/servers)
