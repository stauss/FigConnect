# MCP Server Development Reference

Detailed API reference for Model Context Protocol server development. See [SKILL.md](SKILL.md) for patterns and [examples.md](examples.md) for practical examples.

## Server API

### Server Class

```typescript
import { Server } from "@modelcontextprotocol/sdk/server/index.js";

const server = new Server(
  {
    name: string,        // Server name
    version: string      // Server version
  },
  {
    capabilities?: {
      tools?: {},
      resources?: {},
      prompts?: {}
    }
  }
);
```

### Transport

#### Stdio Transport

```typescript
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const transport = new StdioServerTransport();
await server.connect(transport);
```

#### HTTP/SSE Transport

```typescript
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";

const transport = new SSEServerTransport({
  server: httpServer,
  path: "/sse",
});
await server.connect(transport);
```

## Request Handlers

### List Tools

```typescript
import { ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: Array<{
    name: string;
    description: string;
    inputSchema: JSONSchema;
  }>,
}));
```

### Call Tool

```typescript
import { CallToolRequestSchema, CallToolResult } from "@modelcontextprotocol/sdk/types.js";

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  return {
    content: Array<{
      type: "text" | "image" | "resource";
      text?: string;
      data?: string;        // base64 for images
      mimeType?: string;    // for images/resources
      uri?: string;          // for resources
    }>;
    isError?: boolean;
  } as CallToolResult;
});
```

### List Resources

```typescript
import { ListResourcesRequestSchema } from "@modelcontextprotocol/sdk/types.js";

server.setRequestHandler(ListResourcesRequestSchema, async () => ({
  resources: Array<{
    uri: string;
    name: string;
    description?: string;
    mimeType?: string;
  }>,
}));
```

### Read Resource

```typescript
import { ReadResourceRequestSchema } from "@modelcontextprotocol/sdk/types.js";

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;

  return {
    contents: Array<{
      uri: string;
      mimeType?: string;
      text?: string;
      blob?: string; // base64 encoded
    }>,
  };
});
```

### List Prompts

```typescript
import { ListPromptsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

server.setRequestHandler(ListPromptsRequestSchema, async () => ({
  prompts: Array<{
    name: string;
    description: string;
    arguments?: Array<{
      name: string;
      description?: string;
      required?: boolean;
    }>;
  }>,
}));
```

### Get Prompt

```typescript
import { GetPromptRequestSchema } from "@modelcontextprotocol/sdk/types.js";

server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  return {
    messages?: Array<{
      role: "user" | "assistant";
      content: {
        type: "text";
        text: string;
      };
    }>;
    description?: string;
  };
});
```

## JSON Schema Types

### Tool Input Schema

```typescript
type JSONSchema = {
  type: "object" | "string" | "number" | "boolean" | "array";
  properties?: Record<string, JSONSchema>;
  required?: string[];
  items?: JSONSchema; // for arrays
  enum?: any[];
  description?: string;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
};
```

### Example Schema

```typescript
const ToolInputSchema: JSONSchema = {
  type: "object",
  properties: {
    fileKey: {
      type: "string",
      description: "Figma file key",
      pattern: "^[a-zA-Z0-9]+$",
    },
    depth: {
      type: "number",
      description: "Maximum depth",
      minimum: 1,
      maximum: 10,
      default: 5,
    },
    includeStyles: {
      type: "boolean",
      description: "Include style information",
      default: false,
    },
  },
  required: ["fileKey"],
};
```

## Content Types

### Text Content

```typescript
{
  type: "text",
  text: string
}
```

### Image Content

```typescript
{
  type: "image",
  data: string,      // base64 encoded image
  mimeType: string    // "image/png", "image/jpeg", etc.
}
```

### Resource Content

```typescript
{
  type: "resource",
  resource: {
    uri: string,
    text?: string,
    mimeType?: string
  }
}
```

## Error Handling

### Tool Error Response

```typescript
{
  content: [{
    type: "text",
    text: "Error message describing what went wrong"
  }],
  isError: true
}
```

### Validation Error

```typescript
import { z } from "zod";

try {
  const validated = schema.parse(input);
} catch (error) {
  if (error instanceof z.ZodError) {
    const message = error.errors
      .map((e) => `${e.path.join(".")}: ${e.message}`)
      .join(", ");
    return {
      content: [{ type: "text", text: `Validation error: ${message}` }],
      isError: true,
    };
  }
}
```

## Server Capabilities

### Capabilities Declaration

```typescript
const server = new Server(
  { name: "my-server", version: "1.0.0" },
  {
    capabilities: {
      tools: {
        listChanged: true, // Notify when tools change
      },
      resources: {
        subscribe: true, // Support resource subscriptions
        listChanged: true,
      },
      prompts: {
        listChanged: true,
      },
    },
  },
);
```

## Events

### Tool List Changed

```typescript
server.notify("tools/list_changed", {});
```

### Resource List Changed

```typescript
server.notify("resources/list_changed", {});
```

## Type Definitions

### CallToolRequest

```typescript
interface CallToolRequest {
  method: "tools/call";
  params: {
    name: string;
    arguments?: Record<string, any>;
  };
}
```

### CallToolResult

```typescript
interface CallToolResult {
  content: Array<{
    type: "text" | "image" | "resource";
    text?: string;
    data?: string;
    mimeType?: string;
    uri?: string;
    resource?: {
      uri: string;
      text?: string;
      mimeType?: string;
    };
  }>;
  isError?: boolean;
}
```

### ListToolsResult

```typescript
interface ListToolsResult {
  tools: Array<{
    name: string;
    description: string;
    inputSchema: JSONSchema;
  }>;
}
```

## Zod Integration

### Schema to JSON Schema

```typescript
import { zodToJsonSchema } from "zod-to-json-schema";

const zodSchema = z.object({
  fileKey: z.string(),
  depth: z.number().min(1).max(10).optional(),
});

const jsonSchema = zodToJsonSchema(zodSchema, "ToolInput");
```

### Validate and Transform

```typescript
import { z } from "zod";

const schema = z.object({
  fileKey: z.string().transform((s) => s.trim()),
  depth: z.coerce.number().min(1).max(10).default(5),
});

const validated = schema.parse(input);
```

## Logging Configuration

### Winston Logger Setup

```typescript
import winston from "winston";

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  ),
  transports: [
    // File transport
    new winston.transports.File({
      filename: "error.log",
      level: "error",
    }),
    new winston.transports.File({
      filename: "combined.log",
    }),
  ],
});

// For stdio, add stderr transport
if (process.env.MCP_TRANSPORT === "stdio") {
  logger.add(
    new winston.transports.Stream({
      stream: process.stderr,
      format: winston.format.simple(),
    }),
  );
}
```

## Performance Patterns

### Async Batch Operations

```typescript
async function batchProcess(items: string[]): Promise<Result[]> {
  const batchSize = 10;
  const results: Result[] = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map((item) => processItem(item)),
    );
    results.push(...batchResults);
  }

  return results;
}
```

### Request Deduplication

```typescript
class RequestDeduplicator {
  private pending = new Map<string, Promise<any>>();

  async execute<T>(key: string, fn: () => Promise<T>): Promise<T> {
    if (this.pending.has(key)) {
      return this.pending.get(key)!;
    }

    const promise = fn().finally(() => {
      this.pending.delete(key);
    });

    this.pending.set(key, promise);
    return promise;
  }
}
```

## Security Patterns

### Input Sanitization

```typescript
import { z } from "zod";

const SafeStringSchema = z
  .string()
  .min(1)
  .max(1000)
  .regex(/^[a-zA-Z0-9_-]+$/, "Invalid characters");

const validated = SafeStringSchema.parse(input);
```

### Authentication

```typescript
interface AuthenticatedRequest {
  token?: string;
}

function validateAuth(request: AuthenticatedRequest): boolean {
  const token = process.env.API_TOKEN;
  return request.token === token;
}

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (!validateAuth(request as any)) {
    return {
      content: [{ type: "text", text: "Authentication required" }],
      isError: true,
    };
  }
  // Process request
});
```
