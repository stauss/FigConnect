# Phase 1: Foundation & Read-Only MCP Server

## 🎯 Objective

Build a working MCP server that connects to Claude Code and provides read-only access to Figma files. This phase establishes the foundation for all future functionality.

**Duration**: 1-2 days  
**Complexity**: Medium  
**Prerequisites**: Node.js 18+, Figma access token

## 📦 Deliverables

- ✅ MCP server initialization and registration
- ✅ Figma API client with authentication
- ✅ 9 read-only tools implemented
- ✅ Error handling and logging
- ✅ TypeScript types and interfaces
- ✅ Basic test suite
- ✅ Configuration management

## 🗂️ File Structure

```
figma-mcp-server/
├── src/
│   ├── index.ts                 # MCP server entry point
│   ├── types.ts                 # Shared TypeScript types
│   ├── config.ts                # Configuration management
│   ├── logger.ts                # Logging utility
│   │
│   ├── tools/
│   │   ├── registry.ts          # Tool registration
│   │   ├── read-tools.ts        # Read operations
│   │   └── export-tools.ts      # Export operations
│   │
│   └── figma/
│       ├── client.ts            # Figma API wrapper
│       ├── utils.ts             # Helper functions
│       └── types.ts             # Figma-specific types
│
├── tests/
│   ├── setup.ts
│   ├── client.test.ts
│   ├── read-tools.test.ts
│   └── export-tools.test.ts
│
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
├── jest.config.js
└── README.md
```

## 🚀 Implementation Steps

### Step 1: Project Initialization

#### Create Directory Structure
```bash
mkdir figma-mcp-server
cd figma-mcp-server
mkdir -p src/{tools,figma} tests
```

#### Initialize Package
```bash
npm init -y
```

#### Install Dependencies
```json
{
  "name": "figma-mcp-server",
  "version": "1.0.0",
  "type": "module",
  "main": "dist/index.js",
  "bin": {
    "figma-mcp": "./dist/index.js"
  },
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "test": "jest",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^0.5.0",
    "dotenv": "^16.3.1",
    "node-fetch": "^3.3.2",
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "@types/jest": "^29.5.0",
    "jest": "^29.7.0",
    "ts-jest": "^29.1.0",
    "typescript": "^5.3.0",
    "tsx": "^4.7.0"
  }
}
```

```bash
npm install
```

#### Configure TypeScript
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "node",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

#### Create .env.example
```bash
# Figma API Configuration
FIGMA_ACCESS_TOKEN=figd_your_token_here
FIGMA_FILE_KEY=your_test_file_key_here

# Server Configuration
LOG_LEVEL=info
API_TIMEOUT_MS=10000

# Rate Limiting
MAX_REQUESTS_PER_MINUTE=60
```

#### Create .gitignore
```
node_modules/
dist/
.env
*.log
.DS_Store
coverage/
```

---

### Step 2: Core Types & Configuration

#### src/types.ts
```typescript
import { z } from 'zod';

// MCP Tool Response Type
export interface ToolResponse {
  content: Array<{
    type: 'text' | 'image' | 'resource';
    text?: string;
    data?: string;
    mimeType?: string;
  }>;
  isError?: boolean;
}

// Figma API Types
export interface FigmaFile {
  name: string;
  lastModified: string;
  thumbnailUrl: string;
  version: string;
  document: FigmaNode;
}

export interface FigmaNode {
  id: string;
  name: string;
  type: NodeType;
  children?: FigmaNode[];
  [key: string]: any;
}

export type NodeType = 
  | 'DOCUMENT'
  | 'CANVAS'
  | 'FRAME'
  | 'GROUP'
  | 'VECTOR'
  | 'BOOLEAN_OPERATION'
  | 'STAR'
  | 'LINE'
  | 'ELLIPSE'
  | 'REGULAR_POLYGON'
  | 'RECTANGLE'
  | 'TEXT'
  | 'SLICE'
  | 'COMPONENT'
  | 'COMPONENT_SET'
  | 'INSTANCE';

// Input Schemas using Zod
export const GetFileStructureSchema = z.object({
  file_key: z.string().describe('The Figma file key (from URL)'),
  depth: z.number().optional().describe('Maximum depth to traverse (default: 5)'),
});

export const GetNodeDetailsSchema = z.object({
  file_key: z.string(),
  node_ids: z.array(z.string()).describe('Array of node IDs to fetch'),
});

export const ExportNodeSchema = z.object({
  file_key: z.string(),
  node_ids: z.array(z.string()),
  format: z.enum(['png', 'svg', 'pdf', 'jpg']).default('png'),
  scale: z.number().min(0.01).max(4).default(1),
});

export const SearchNodesSchema = z.object({
  file_key: z.string(),
  query: z.string().describe('Search term for node names'),
  node_type: z.string().optional().describe('Filter by node type'),
});

export const GetComponentsSchema = z.object({
  file_key: z.string(),
});

export const GetStylesSchema = z.object({
  file_key: z.string(),
});

export const GetVariablesSchema = z.object({
  file_key: z.string(),
});

export const GetCommentsSchema = z.object({
  file_key: z.string(),
});

export const GetFileVersionsSchema = z.object({
  file_key: z.string(),
  page_size: z.number().optional().default(10),
});

export type GetFileStructureInput = z.infer<typeof GetFileStructureSchema>;
export type GetNodeDetailsInput = z.infer<typeof GetNodeDetailsSchema>;
export type ExportNodeInput = z.infer<typeof ExportNodeSchema>;
export type SearchNodesInput = z.infer<typeof SearchNodesSchema>;
export type GetComponentsInput = z.infer<typeof GetComponentsSchema>;
export type GetStylesInput = z.infer<typeof GetStylesSchema>;
export type GetVariablesInput = z.infer<typeof GetVariablesSchema>;
export type GetCommentsInput = z.infer<typeof GetCommentsSchema>;
export type GetFileVersionsInput = z.infer<typeof GetFileVersionsSchema>;
```

#### src/config.ts
```typescript
import { config } from 'dotenv';

config();

export const CONFIG = {
  figma: {
    accessToken: process.env.FIGMA_ACCESS_TOKEN || '',
    apiBase: 'https://api.figma.com/v1',
    timeout: parseInt(process.env.API_TIMEOUT_MS || '10000', 10),
  },
  server: {
    logLevel: process.env.LOG_LEVEL || 'info',
  },
  rateLimit: {
    maxRequestsPerMinute: parseInt(process.env.MAX_REQUESTS_PER_MINUTE || '60', 10),
  },
} as const;

// Validate required configuration
if (!CONFIG.figma.accessToken) {
  throw new Error('FIGMA_ACCESS_TOKEN is required in environment variables');
}
```

#### src/logger.ts
```typescript
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  private level: LogLevel;

  constructor(level: LogLevel = 'info') {
    this.level = level;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    return levels.indexOf(level) >= levels.indexOf(this.level);
  }

  debug(message: string, ...args: any[]) {
    if (this.shouldLog('debug')) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  }

  info(message: string, ...args: any[]) {
    if (this.shouldLog('info')) {
      console.info(`[INFO] ${message}`, ...args);
    }
  }

  warn(message: string, ...args: any[]) {
    if (this.shouldLog('warn')) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  }

  error(message: string, error?: any) {
    if (this.shouldLog('error')) {
      console.error(`[ERROR] ${message}`, error);
    }
  }
}

export const logger = new Logger(process.env.LOG_LEVEL as LogLevel);
```

---

### Step 3: Figma API Client

#### src/figma/client.ts
```typescript
import fetch from 'node-fetch';
import { CONFIG } from '../config.js';
import { logger } from '../logger.js';

export class FigmaAPIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string
  ) {
    super(message);
    this.name = 'FigmaAPIError';
  }
}

export class FigmaClient {
  private baseUrl = CONFIG.figma.apiBase;
  private token = CONFIG.figma.accessToken;
  private requestCount = 0;
  private requestWindowStart = Date.now();

  /**
   * Make GET request to Figma API
   */
  async get<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    await this.checkRateLimit();

    const url = new URL(`${this.baseUrl}${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    logger.debug(`Figma API GET: ${url.toString()}`);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'X-Figma-Token': this.token,
      },
      signal: AbortSignal.timeout(CONFIG.figma.timeout),
    });

    this.requestCount++;

    if (!response.ok) {
      const errorText = await response.text();
      logger.error(`Figma API error: ${response.status}`, errorText);

      // Handle specific error codes
      if (response.status === 404) {
        throw new FigmaAPIError('File or resource not found', 404, 'NOT_FOUND');
      }
      if (response.status === 403) {
        throw new FigmaAPIError(
          'Access denied. Check your Figma token permissions',
          403,
          'FORBIDDEN'
        );
      }
      if (response.status === 429) {
        throw new FigmaAPIError('Rate limit exceeded', 429, 'RATE_LIMITED');
      }

      throw new FigmaAPIError(
        `Figma API error: ${response.statusText}`,
        response.status
      );
    }

    const data = await response.json();
    return data as T;
  }

  /**
   * Simple rate limiting
   */
  private async checkRateLimit() {
    const now = Date.now();
    const windowDuration = 60000; // 1 minute

    // Reset counter if window expired
    if (now - this.requestWindowStart > windowDuration) {
      this.requestCount = 0;
      this.requestWindowStart = now;
    }

    // Wait if at limit
    if (this.requestCount >= CONFIG.rateLimit.maxRequestsPerMinute) {
      const waitTime = windowDuration - (now - this.requestWindowStart);
      logger.warn(`Rate limit reached, waiting ${waitTime}ms`);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
      this.requestCount = 0;
      this.requestWindowStart = Date.now();
    }
  }

  /**
   * Get file structure
   */
  async getFile(fileKey: string, depth?: number) {
    const params = depth ? { depth: depth.toString() } : undefined;
    return this.get(`/files/${fileKey}`, params);
  }

  /**
   * Get specific nodes
   */
  async getNodes(fileKey: string, nodeIds: string[]) {
    return this.get(`/files/${fileKey}/nodes`, {
      ids: nodeIds.join(','),
    });
  }

  /**
   * Get image exports
   */
  async getImages(
    fileKey: string,
    nodeIds: string[],
    format: string = 'png',
    scale: number = 1
  ) {
    return this.get(`/images/${fileKey}`, {
      ids: nodeIds.join(','),
      format,
      scale: scale.toString(),
    });
  }

  /**
   * Get file components
   */
  async getFileComponents(fileKey: string) {
    return this.get(`/files/${fileKey}/components`);
  }

  /**
   * Get file styles
   */
  async getFileStyles(fileKey: string) {
    return this.get(`/files/${fileKey}/styles`);
  }

  /**
   * Get file comments
   */
  async getComments(fileKey: string) {
    return this.get(`/files/${fileKey}/comments`);
  }

  /**
   * Get file versions
   */
  async getVersions(fileKey: string, pageSize: number = 10) {
    return this.get(`/files/${fileKey}/versions`, {
      page_size: pageSize.toString(),
    });
  }

  /**
   * Get local variables
   */
  async getLocalVariables(fileKey: string) {
    return this.get(`/files/${fileKey}/variables/local`);
  }
}

// Singleton instance
export const figmaClient = new FigmaClient();
```

#### src/figma/utils.ts
```typescript
import { FigmaNode } from '../types.js';

/**
 * Traverse node tree and collect nodes matching predicate
 */
export function findNodes(
  node: FigmaNode,
  predicate: (node: FigmaNode) => boolean,
  maxDepth: number = 10,
  currentDepth: number = 0
): FigmaNode[] {
  const results: FigmaNode[] = [];

  if (currentDepth > maxDepth) {
    return results;
  }

  if (predicate(node)) {
    results.push(node);
  }

  if (node.children) {
    for (const child of node.children) {
      results.push(...findNodes(child, predicate, maxDepth, currentDepth + 1));
    }
  }

  return results;
}

/**
 * Flatten node tree to specified depth
 */
export function flattenNodes(
  node: FigmaNode,
  maxDepth: number = 5,
  currentDepth: number = 0
): FigmaNode[] {
  const nodes: FigmaNode[] = [node];

  if (currentDepth >= maxDepth || !node.children) {
    return nodes;
  }

  for (const child of node.children) {
    nodes.push(...flattenNodes(child, maxDepth, currentDepth + 1));
  }

  return nodes;
}

/**
 * Format node tree as indented text
 */
export function formatNodeTree(
  node: FigmaNode,
  indent: number = 0,
  maxDepth: number = 5
): string {
  if (indent > maxDepth) {
    return '';
  }

  const prefix = '  '.repeat(indent);
  let output = `${prefix}[${node.type}] ${node.name} (${node.id})\n`;

  if (node.children) {
    for (const child of node.children) {
      output += formatNodeTree(child, indent + 1, maxDepth);
    }
  }

  return output;
}

/**
 * Extract summary info from node
 */
export function getNodeSummary(node: FigmaNode) {
  return {
    id: node.id,
    name: node.name,
    type: node.type,
    childCount: node.children?.length || 0,
  };
}
```

---

### Step 4: Read-Only Tools Implementation

#### src/tools/read-tools.ts
```typescript
import { figmaClient } from '../figma/client.js';
import { findNodes, formatNodeTree, flattenNodes } from '../figma/utils.js';
import {
  GetFileStructureInput,
  GetNodeDetailsInput,
  SearchNodesInput,
  GetComponentsInput,
  GetStylesInput,
  GetVariablesInput,
  GetCommentsInput,
  GetFileVersionsInput,
  ToolResponse,
} from '../types.js';
import { logger } from '../logger.js';

export async function getFileStructure(
  input: GetFileStructureInput
): Promise<ToolResponse> {
  try {
    logger.info(`Getting file structure: ${input.file_key}`);

    const file = await figmaClient.getFile(input.file_key, input.depth);

    const treeView = formatNodeTree(file.document, 0, input.depth || 5);

    return {
      content: [
        {
          type: 'text',
          text: `# File: ${file.name}\n\nLast Modified: ${file.lastModified}\n\n## Structure:\n\n${treeView}`,
        },
      ],
    };
  } catch (error: any) {
    logger.error('Error getting file structure:', error);
    return {
      content: [{ type: 'text', text: `Error: ${error.message}` }],
      isError: true,
    };
  }
}

export async function getNodeDetails(
  input: GetNodeDetailsInput
): Promise<ToolResponse> {
  try {
    logger.info(
      `Getting node details: ${input.node_ids.length} nodes from ${input.file_key}`
    );

    const response = await figmaClient.getNodes(input.file_key, input.node_ids);

    const details = Object.entries(response.nodes || {})
      .map(([id, data]: [string, any]) => {
        const node = data.document;
        return `### Node: ${node.name} (${node.id})

**Type:** ${node.type}
**Visible:** ${node.visible !== false}
${node.children ? `**Children:** ${node.children.length}` : ''}

**Properties:**
\`\`\`json
${JSON.stringify(node, null, 2)}
\`\`\`
`;
      })
      .join('\n\n---\n\n');

    return {
      content: [
        {
          type: 'text',
          text: details || 'No nodes found',
        },
      ],
    };
  } catch (error: any) {
    logger.error('Error getting node details:', error);
    return {
      content: [{ type: 'text', text: `Error: ${error.message}` }],
      isError: true,
    };
  }
}

export async function searchNodes(
  input: SearchNodesInput
): Promise<ToolResponse> {
  try {
    logger.info(`Searching nodes: "${input.query}" in ${input.file_key}`);

    const file = await figmaClient.getFile(input.file_key);
    const allNodes = flattenNodes(file.document);

    const matches = allNodes.filter((node) => {
      const nameMatch = node.name
        .toLowerCase()
        .includes(input.query.toLowerCase());
      const typeMatch = input.node_type
        ? node.type === input.node_type.toUpperCase()
        : true;
      return nameMatch && typeMatch;
    });

    const results = matches
      .map((node) => `- [${node.type}] ${node.name} (ID: ${node.id})`)
      .join('\n');

    return {
      content: [
        {
          type: 'text',
          text: `# Search Results: "${input.query}"\n\nFound ${matches.length} nodes:\n\n${results || 'No matches found'}`,
        },
      ],
    };
  } catch (error: any) {
    logger.error('Error searching nodes:', error);
    return {
      content: [{ type: 'text', text: `Error: ${error.message}` }],
      isError: true,
    };
  }
}

export async function getComponents(
  input: GetComponentsInput
): Promise<ToolResponse> {
  try {
    logger.info(`Getting components from ${input.file_key}`);

    const response = await figmaClient.getFileComponents(input.file_key);

    const components = (response.meta?.components || [])
      .map(
        (comp: any) =>
          `- **${comp.name}**\n  - ID: ${comp.node_id}\n  - Key: ${comp.key}\n  - Description: ${comp.description || 'None'}`
      )
      .join('\n\n');

    return {
      content: [
        {
          type: 'text',
          text: `# Components\n\nTotal: ${response.meta?.components?.length || 0}\n\n${components || 'No components found'}`,
        },
      ],
    };
  } catch (error: any) {
    logger.error('Error getting components:', error);
    return {
      content: [{ type: 'text', text: `Error: ${error.message}` }],
      isError: true,
    };
  }
}

export async function getStyles(
  input: GetStylesInput
): Promise<ToolResponse> {
  try {
    logger.info(`Getting styles from ${input.file_key}`);

    const response = await figmaClient.getFileStyles(input.file_key);

    const styles = Object.entries(response.meta?.styles || {})
      .map(([id, style]: [string, any]) => {
        return `- **${style.name}** (${style.style_type})\n  - ID: ${id}\n  - Key: ${style.key}\n  - Description: ${style.description || 'None'}`;
      })
      .join('\n\n');

    return {
      content: [
        {
          type: 'text',
          text: `# Styles\n\nTotal: ${Object.keys(response.meta?.styles || {}).length}\n\n${styles || 'No styles found'}`,
        },
      ],
    };
  } catch (error: any) {
    logger.error('Error getting styles:', error);
    return {
      content: [{ type: 'text', text: `Error: ${error.message}` }],
      isError: true,
    };
  }
}

export async function getVariables(
  input: GetVariablesInput
): Promise<ToolResponse> {
  try {
    logger.info(`Getting variables from ${input.file_key}`);

    const response = await figmaClient.getLocalVariables(input.file_key);

    const collections = Object.entries(
      response.meta?.variableCollections || {}
    )
      .map(([id, collection]: [string, any]) => {
        return `## ${collection.name}\n\nID: ${id}\nModes: ${collection.modes?.map((m: any) => m.name).join(', ') || 'None'}`;
      })
      .join('\n\n');

    return {
      content: [
        {
          type: 'text',
          text: `# Variables\n\n${collections || 'No variable collections found'}`,
        },
      ],
    };
  } catch (error: any) {
    logger.error('Error getting variables:', error);
    return {
      content: [{ type: 'text', text: `Error: ${error.message}` }],
      isError: true,
    };
  }
}

export async function getComments(
  input: GetCommentsInput
): Promise<ToolResponse> {
  try {
    logger.info(`Getting comments from ${input.file_key}`);

    const response = await figmaClient.getComments(input.file_key);

    const comments = (response.comments || [])
      .map((comment: any) => {
        return `**${comment.user.handle}** (${new Date(comment.created_at).toLocaleString()})\n\n${comment.message}\n\nNode: ${comment.client_meta?.node_id || 'N/A'}`;
      })
      .join('\n\n---\n\n');

    return {
      content: [
        {
          type: 'text',
          text: `# Comments\n\nTotal: ${response.comments?.length || 0}\n\n${comments || 'No comments found'}`,
        },
      ],
    };
  } catch (error: any) {
    logger.error('Error getting comments:', error);
    return {
      content: [{ type: 'text', text: `Error: ${error.message}` }],
      isError: true,
    };
  }
}

export async function getFileVersions(
  input: GetFileVersionsInput
): Promise<ToolResponse> {
  try {
    logger.info(`Getting versions from ${input.file_key}`);

    const response = await figmaClient.getVersions(
      input.file_key,
      input.page_size
    );

    const versions = (response.versions || [])
      .map((version: any) => {
        return `- **${version.label || 'Unlabeled'}**\n  - Created: ${new Date(version.created_at).toLocaleString()}\n  - User: ${version.user.handle}\n  - Description: ${version.description || 'None'}`;
      })
      .join('\n\n');

    return {
      content: [
        {
          type: 'text',
          text: `# Version History\n\nShowing ${response.versions?.length || 0} versions:\n\n${versions || 'No versions found'}`,
        },
      ],
    };
  } catch (error: any) {
    logger.error('Error getting versions:', error);
    return {
      content: [{ type: 'text', text: `Error: ${error.message}` }],
      isError: true,
    };
  }
}
```

#### src/tools/export-tools.ts
```typescript
import { figmaClient } from '../figma/client.js';
import { ExportNodeInput, ToolResponse } from '../types.js';
import { logger } from '../logger.js';

export async function exportNode(
  input: ExportNodeInput
): Promise<ToolResponse> {
  try {
    logger.info(
      `Exporting ${input.node_ids.length} nodes as ${input.format} from ${input.file_key}`
    );

    const response = await figmaClient.getImages(
      input.file_key,
      input.node_ids,
      input.format,
      input.scale
    );

    if (response.err) {
      throw new Error(response.err);
    }

    const images = Object.entries(response.images || {})
      .map(([id, url]: [string, any]) => {
        return `- Node ${id}: ${url}`;
      })
      .join('\n');

    return {
      content: [
        {
          type: 'text',
          text: `# Exported ${input.format.toUpperCase()} Images\n\nScale: ${input.scale}x\n\n${images}`,
        },
      ],
    };
  } catch (error: any) {
    logger.error('Error exporting nodes:', error);
    return {
      content: [{ type: 'text', text: `Error: ${error.message}` }],
      isError: true,
    };
  }
}
```

---

### Step 5: Tool Registry & MCP Server

#### src/tools/registry.ts
```typescript
import {
  GetFileStructureSchema,
  GetNodeDetailsSchema,
  SearchNodesSchema,
  GetComponentsSchema,
  GetStylesSchema,
  GetVariablesSchema,
  GetCommentsSchema,
  GetFileVersionsSchema,
  ExportNodeSchema,
} from '../types.js';

export const TOOLS = [
  {
    name: 'get_file_structure',
    description:
      'Get the complete node tree structure of a Figma file. Returns hierarchical view of all frames, components, and layers.',
    inputSchema: GetFileStructureSchema,
  },
  {
    name: 'get_node_details',
    description:
      'Get detailed properties of specific nodes by their IDs. Returns full node data including styles, constraints, and effects.',
    inputSchema: GetNodeDetailsSchema,
  },
  {
    name: 'search_nodes',
    description:
      'Search for nodes by name or type within a Figma file. Useful for finding specific layers or components.',
    inputSchema: SearchNodesSchema,
  },
  {
    name: 'get_components',
    description:
      'List all components in a Figma file with their properties and metadata.',
    inputSchema: GetComponentsSchema,
  },
  {
    name: 'get_styles',
    description:
      'Get all color, text, and effect styles defined in the Figma file.',
    inputSchema: GetStylesSchema,
  },
  {
    name: 'get_variables',
    description:
      'Get all design variables (tokens) including colors, numbers, strings, and booleans.',
    inputSchema: GetVariablesSchema,
  },
  {
    name: 'export_node',
    description:
      'Export nodes as PNG, SVG, PDF, or JPG images. Supports custom scale and format options.',
    inputSchema: ExportNodeSchema,
  },
  {
    name: 'get_comments',
    description:
      'Get all comments in the Figma file with author, timestamp, and location.',
    inputSchema: GetCommentsSchema,
  },
  {
    name: 'get_file_versions',
    description:
      'Get version history of the Figma file including labels, timestamps, and authors.',
    inputSchema: GetFileVersionsSchema,
  },
] as const;
```

#### src/index.ts
```typescript
#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { TOOLS } from './tools/registry.js';
import {
  getFileStructure,
  getNodeDetails,
  searchNodes,
  getComponents,
  getStyles,
  getVariables,
  getComments,
  getFileVersions,
} from './tools/read-tools.js';
import { exportNode } from './tools/export-tools.js';
import { logger } from './logger.js';
import { CONFIG } from './config.js';

// Create MCP server
const server = new Server(
  {
    name: 'figma-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Register tool listing handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  logger.info('Listing available tools');
  return {
    tools: TOOLS.map((tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
    })),
  };
});

// Register tool execution handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  logger.info(`Executing tool: ${name}`);

  try {
    switch (name) {
      case 'get_file_structure':
        return await getFileStructure(args as any);

      case 'get_node_details':
        return await getNodeDetails(args as any);

      case 'search_nodes':
        return await searchNodes(args as any);

      case 'get_components':
        return await getComponents(args as any);

      case 'get_styles':
        return await getStyles(args as any);

      case 'get_variables':
        return await getVariables(args as any);

      case 'export_node':
        return await exportNode(args as any);

      case 'get_comments':
        return await getComments(args as any);

      case 'get_file_versions':
        return await getFileVersions(args as any);

      default:
        return {
          content: [{ type: 'text', text: `Unknown tool: ${name}` }],
          isError: true,
        };
    }
  } catch (error: any) {
    logger.error(`Error executing tool ${name}:`, error);
    return {
      content: [{ type: 'text', text: `Error: ${error.message}` }],
      isError: true,
    };
  }
});

// Start server
async function main() {
  logger.info('Starting Figma MCP Server...');
  logger.info(`Figma API Base: ${CONFIG.figma.apiBase}`);
  logger.info(`Log Level: ${CONFIG.server.logLevel}`);

  const transport = new StdioServerTransport();
  await server.connect(transport);

  logger.info('Figma MCP Server running');
}

main().catch((error) => {
  logger.error('Fatal error:', error);
  process.exit(1);
});
```

---

### Step 6: Testing

#### tests/setup.ts
```typescript
import { config } from 'dotenv';

config({ path: '.env.test' });
```

#### tests/client.test.ts
```typescript
import { FigmaClient } from '../src/figma/client';

describe('FigmaClient', () => {
  let client: FigmaClient;

  beforeEach(() => {
    client = new FigmaClient();
  });

  it('should create client instance', () => {
    expect(client).toBeInstanceOf(FigmaClient);
  });

  // Add more tests with mocked fetch
});
```

---

## 🤖 Claude Code Prompts

### Initial Setup Prompt
```
Set up the Figma MCP Server project for Phase 1. Follow PHASE_1.md exactly:

1. Create the complete directory structure
2. Initialize package.json with all dependencies specified
3. Configure TypeScript with strict mode
4. Create all configuration files (.env.example, .gitignore, tsconfig.json)
5. Implement src/types.ts with all Zod schemas
6. Implement src/config.ts and src/logger.ts

Use TypeScript strict mode and follow the exact file structure shown in the documentation.
```

### Implement Figma Client Prompt
```
Implement the Figma API client in src/figma/client.ts and src/figma/utils.ts as specified in PHASE_1.md.

The client should:
- Use node-fetch for HTTP requests
- Include authentication with Figma token
- Implement rate limiting (60 requests/minute)
- Handle all Figma API errors with proper error classes
- Include methods for: getFile, getNodes, getImages, getFileComponents, getFileStyles, getComments, getVersions, getLocalVariables
- Use TypeScript strict mode with proper types

Also implement utility functions in utils.ts for node tree traversal and formatting.
```

### Implement Tools Prompt
```
Implement all 9 read-only tools in src/tools/read-tools.ts and src/tools/export-tools.ts as specified in PHASE_1.md.

Tools to implement:
1. get_file_structure - Get file node tree
2. get_node_details - Get specific node properties
3. search_nodes - Search by name/type
4. get_components - List components
5. get_styles - Get design styles
6. get_variables - Get design variables
7. export_node - Export as image
8. get_comments - Get file comments
9. get_file_versions - Get version history

Each tool should:
- Validate input using Zod schemas
- Call appropriate FigmaClient methods
- Format responses for readability
- Handle errors gracefully
- Return MCP-compatible ToolResponse
```

### Build MCP Server Prompt
```
Implement the MCP server in src/index.ts following PHASE_1.md.

The server should:
- Use @modelcontextprotocol/sdk Server and StdioServerTransport
- Register all 9 tools from the registry
- Implement ListToolsRequestSchema handler
- Implement CallToolRequestSchema handler with switch statement
- Include proper error handling and logging
- Start server with stdio transport

Also create src/tools/registry.ts with tool definitions.
```

---

## ✅ Phase 1 Completion Checklist

### Setup
- [ ] Directory structure created
- [ ] Dependencies installed
- [ ] TypeScript configured
- [ ] Environment variables set
- [ ] .gitignore created

### Core Implementation
- [ ] Types and schemas defined (types.ts)
- [ ] Configuration loaded (config.ts)
- [ ] Logger implemented (logger.ts)
- [ ] Figma client created (figma/client.ts)
- [ ] Utility functions added (figma/utils.ts)

### Tools
- [ ] get_file_structure implemented
- [ ] get_node_details implemented
- [ ] search_nodes implemented
- [ ] get_components implemented
- [ ] get_styles implemented
- [ ] get_variables implemented
- [ ] export_node implemented
- [ ] get_comments implemented
- [ ] get_file_versions implemented

### Server
- [ ] Tool registry created
- [ ] MCP server initialized
- [ ] ListTools handler registered
- [ ] CallTool handler registered
- [ ] Server starts successfully

### Testing
- [ ] Unit tests for client
- [ ] Unit tests for tools
- [ ] Integration test with real file
- [ ] Error handling tested

### Documentation
- [ ] README.md written
- [ ] Code documented with JSDoc
- [ ] Example usage documented

---

## 🎯 Success Criteria

**Phase 1 is complete when:**

1. ✅ Server builds without errors: `npm run build`
2. ✅ Server starts successfully: `npm start`
3. ✅ MCP client can connect and list tools
4. ✅ All 9 tools return data from test Figma file
5. ✅ Error handling works for invalid inputs
6. ✅ Rate limiting prevents API overuse
7. ✅ Tests pass: `npm test`

---

## 🐛 Common Issues & Solutions

### Issue: "FIGMA_ACCESS_TOKEN is required"
**Solution**: Copy `.env.example` to `.env` and add your Figma token

### Issue: "File not found" error
**Solution**: Verify file_key is correct and you have access to the file

### Issue: Rate limit errors
**Solution**: Reduce MAX_REQUESTS_PER_MINUTE in .env

### Issue: TypeScript errors
**Solution**: Run `npm install` and ensure tsconfig.json is correct

---

## 📚 Next Steps

Once Phase 1 is complete:

1. **Test thoroughly** with real Figma files
2. **Review PHASE_2.md** for command system
3. **Consider enhancements** like caching or batch requests

**Ready?** Start with the "Initial Setup Prompt" above in Claude Code!
