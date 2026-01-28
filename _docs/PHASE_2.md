# Phase 2: Comment-Based Command System

## 🎯 Objective

Build a command posting system that allows the MCP server to post structured commands as Figma comments. These commands will be executed by the Figma plugin (Phase 3). This phase bridges the read-only limitations of Figma's REST API.

**Duration**: 2-3 days  
**Complexity**: Medium-High  
**Prerequisites**: Phase 1 completed

## 📦 Deliverables

- ✅ Command syntax specification
- ✅ Command parser and validator
- ✅ Command posting tools
- ✅ Command queue management
- ✅ Result polling system
- ✅ Command templates for common operations
- ✅ Timeout and error handling

## 🗂️ File Structure Additions

```
figma-mcp-server/
├── src/
│   ├── tools/
│   │   └── command-tools.ts     # NEW: Command posting tools
│   │
│   ├── commands/
│   │   ├── parser.ts            # NEW: Parse command JSON
│   │   ├── validator.ts         # NEW: Validate commands
│   │   ├── templates.ts         # NEW: Command templates
│   │   └── types.ts             # NEW: Command types
│   │
│   └── queue/
│       ├── manager.ts           # NEW: Command queue
│       ├── polling.ts           # NEW: Poll for results
│       └── types.ts             # NEW: Queue types
│
├── tests/
│   ├── command-parser.test.ts   # NEW
│   ├── command-validator.test.ts # NEW
│   └── queue-manager.test.ts    # NEW
```

## 📋 Command Format Specification

### Command Structure

All commands are posted as Figma comments in JSON format with a special prefix.

```json
{
  "type": "mcp-command",
  "version": "1.0",
  "id": "cmd-1706371800000-abc123",
  "command": "create_frame",
  "params": {
    "name": "Hero Section",
    "width": 1440,
    "height": 600,
    "x": 0,
    "y": 0,
    "fills": [
      {
        "type": "SOLID",
        "color": { "r": 0.95, "g": 0.95, "b": 0.95 },
        "opacity": 1
      }
    ],
    "cornerRadius": 0
  },
  "parent": "0:1",
  "timestamp": "2025-01-27T10:30:00Z"
}
```

### Response Structure

The plugin posts responses as replies to command comments:

```json
{
  "type": "mcp-response",
  "commandId": "cmd-1706371800000-abc123",
  "status": "success",
  "result": {
    "nodeId": "123:456",
    "name": "Hero Section",
    "type": "FRAME"
  },
  "timestamp": "2025-01-27T10:30:05Z",
  "executionTime": 234
}
```

### Error Response

```json
{
  "type": "mcp-response",
  "commandId": "cmd-1706371800000-abc123",
  "status": "error",
  "error": {
    "code": "INVALID_PARENT",
    "message": "Parent node not found: 0:999",
    "details": "The specified parent node does not exist in the document"
  },
  "timestamp": "2025-01-27T10:30:05Z"
}
```

## 🚀 Implementation Steps

### Step 1: Command Types & Schemas

#### src/commands/types.ts

```typescript
import { z } from 'zod';

// Base command schema
export const BaseCommandSchema = z.object({
  type: z.literal('mcp-command'),
  version: z.string().default('1.0'),
  id: z.string(),
  command: z.string(),
  params: z.record(z.any()),
  parent: z.string().optional(),
  timestamp: z.string().datetime(),
});

export type BaseCommand = z.infer<typeof BaseCommandSchema>;

// Frame creation
export const CreateFrameParamsSchema = z.object({
  name: z.string(),
  width: z.number().positive(),
  height: z.number().positive(),
  x: z.number().default(0),
  y: z.number().default(0),
  fills: z
    .array(
      z.object({
        type: z.enum(['SOLID', 'GRADIENT_LINEAR', 'GRADIENT_RADIAL', 'IMAGE']),
        color: z
          .object({
            r: z.number().min(0).max(1),
            g: z.number().min(0).max(1),
            b: z.number().min(0).max(1),
          })
          .optional(),
        opacity: z.number().min(0).max(1).default(1),
      })
    )
    .optional(),
  cornerRadius: z.number().min(0).default(0),
});

// Text creation
export const CreateTextParamsSchema = z.object({
  content: z.string(),
  x: z.number().default(0),
  y: z.number().default(0),
  fontSize: z.number().positive().default(16),
  fontFamily: z.string().default('Inter'),
  fontWeight: z.number().default(400),
  fills: z
    .array(
      z.object({
        type: z.literal('SOLID'),
        color: z.object({
          r: z.number().min(0).max(1),
          g: z.number().min(0).max(1),
          b: z.number().min(0).max(1),
        }),
      })
    )
    .optional(),
  textAlignHorizontal: z.enum(['LEFT', 'CENTER', 'RIGHT', 'JUSTIFIED']).optional(),
  textAlignVertical: z.enum(['TOP', 'CENTER', 'BOTTOM']).optional(),
});

// Rectangle creation
export const CreateRectangleParamsSchema = z.object({
  name: z.string().optional(),
  width: z.number().positive(),
  height: z.number().positive(),
  x: z.number().default(0),
  y: z.number().default(0),
  fills: z.array(z.any()).optional(),
  strokes: z.array(z.any()).optional(),
  cornerRadius: z.number().min(0).default(0),
});

// Auto-layout application
export const ApplyAutoLayoutParamsSchema = z.object({
  mode: z.enum(['HORIZONTAL', 'VERTICAL']),
  paddingTop: z.number().min(0).default(0),
  paddingRight: z.number().min(0).default(0),
  paddingBottom: z.number().min(0).default(0),
  paddingLeft: z.number().min(0).default(0),
  itemSpacing: z.number().min(0).default(0),
  primaryAxisAlignItems: z.enum(['MIN', 'CENTER', 'MAX', 'SPACE_BETWEEN']).optional(),
  counterAxisAlignItems: z.enum(['MIN', 'CENTER', 'MAX']).optional(),
});

// Component creation
export const CreateComponentParamsSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
});

// Style application
export const ApplyStyleParamsSchema = z.object({
  styleId: z.string(),
  styleType: z.enum(['FILL', 'STROKE', 'TEXT', 'EFFECT', 'GRID']),
});

// Property updates
export const SetPropertiesParamsSchema = z.object({
  properties: z.record(z.any()),
});

// Response schema
export const CommandResponseSchema = z.object({
  type: z.literal('mcp-response'),
  commandId: z.string(),
  status: z.enum(['success', 'error', 'pending']),
  result: z.any().optional(),
  error: z
    .object({
      code: z.string(),
      message: z.string(),
      details: z.string().optional(),
    })
    .optional(),
  timestamp: z.string().datetime(),
  executionTime: z.number().optional(),
});

export type CommandResponse = z.infer<typeof CommandResponseSchema>;

// Command queue item
export interface QueuedCommand {
  command: BaseCommand;
  fileKey: string;
  status: 'pending' | 'posted' | 'completed' | 'failed' | 'timeout';
  commentId?: string;
  response?: CommandResponse;
  createdAt: number;
  updatedAt: number;
  timeoutAt: number;
}
```

---

### Step 2: Command Parser & Validator

#### src/commands/parser.ts

```typescript
import { BaseCommandSchema, CommandResponseSchema } from './types.js';
import { logger } from '../logger.js';

/**
 * Parse command from JSON string
 */
export function parseCommand(jsonString: string) {
  try {
    const data = JSON.parse(jsonString);
    const result = BaseCommandSchema.safeParse(data);

    if (!result.success) {
      logger.error('Invalid command format:', result.error);
      throw new Error(`Invalid command format: ${result.error.message}`);
    }

    return result.data;
  } catch (error: any) {
    logger.error('Failed to parse command:', error);
    throw new Error(`Failed to parse command: ${error.message}`);
  }
}

/**
 * Parse response from JSON string
 */
export function parseResponse(jsonString: string) {
  try {
    const data = JSON.parse(jsonString);
    const result = CommandResponseSchema.safeParse(data);

    if (!result.success) {
      logger.error('Invalid response format:', result.error);
      return null;
    }

    return result.data;
  } catch (error) {
    logger.error('Failed to parse response:', error);
    return null;
  }
}

/**
 * Extract command from comment message
 * Looks for JSON block in comment
 */
export function extractCommandFromComment(message: string) {
  // Try to find JSON block
  const jsonMatch = message.match(/```json\s*([\s\S]*?)\s*```/);
  if (jsonMatch) {
    return parseCommand(jsonMatch[1]);
  }

  // Try direct JSON
  const trimmed = message.trim();
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    return parseCommand(trimmed);
  }

  return null;
}

/**
 * Extract response from comment message
 */
export function extractResponseFromComment(message: string) {
  const jsonMatch = message.match(/```json\s*([\s\S]*?)\s*```/);
  if (jsonMatch) {
    return parseResponse(jsonMatch[1]);
  }

  const trimmed = message.trim();
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    return parseResponse(trimmed);
  }

  return null;
}

/**
 * Format command as comment message
 */
export function formatCommandMessage(command: any): string {
  return `MCP Command

\`\`\`json
${JSON.stringify(command, null, 2)}
\`\`\`

*This command will be executed by the Figma MCP Plugin*`;
}
```

#### src/commands/validator.ts

```typescript
import {
  CreateFrameParamsSchema,
  CreateTextParamsSchema,
  CreateRectangleParamsSchema,
  ApplyAutoLayoutParamsSchema,
  CreateComponentParamsSchema,
  ApplyStyleParamsSchema,
  SetPropertiesParamsSchema,
} from './types.js';
import { logger } from '../logger.js';

/**
 * Validate command parameters based on command type
 */
export function validateCommandParams(command: string, params: any) {
  try {
    switch (command) {
      case 'create_frame':
        return CreateFrameParamsSchema.parse(params);

      case 'create_text':
        return CreateTextParamsSchema.parse(params);

      case 'create_rectangle':
        return CreateRectangleParamsSchema.parse(params);

      case 'apply_auto_layout':
        return ApplyAutoLayoutParamsSchema.parse(params);

      case 'create_component':
        return CreateComponentParamsSchema.parse(params);

      case 'apply_style':
        return ApplyStyleParamsSchema.parse(params);

      case 'set_properties':
        return SetPropertiesParamsSchema.parse(params);

      default:
        logger.warn(`Unknown command type: ${command}`);
        return params; // Pass through for unknown commands
    }
  } catch (error: any) {
    logger.error(`Validation failed for ${command}:`, error);
    throw new Error(`Invalid parameters for ${command}: ${error.message}`);
  }
}

/**
 * Validate parent node ID format
 */
export function validateNodeId(nodeId: string): boolean {
  // Figma node IDs are in format "123:456"
  return /^\d+:\d+$/.test(nodeId);
}

/**
 * Validate color object
 */
export function validateColor(color: any): boolean {
  return (
    typeof color === 'object' &&
    typeof color.r === 'number' &&
    color.r >= 0 &&
    color.r <= 1 &&
    typeof color.g === 'number' &&
    color.g >= 0 &&
    color.g <= 1 &&
    typeof color.b === 'number' &&
    color.b >= 0 &&
    color.b <= 1
  );
}
```

---

### Step 3: Command Templates

#### src/commands/templates.ts

```typescript
import { v4 as uuidv4 } from 'uuid';

/**
 * Generate unique command ID
 */
export function generateCommandId(): string {
  return `cmd-${Date.now()}-${uuidv4().slice(0, 8)}`;
}

/**
 * Create frame command template
 */
export function createFrameCommand(params: {
  name: string;
  width: number;
  height: number;
  x?: number;
  y?: number;
  backgroundColor?: string;
  parent?: string;
}) {
  return {
    type: 'mcp-command' as const,
    version: '1.0',
    id: generateCommandId(),
    command: 'create_frame',
    params: {
      name: params.name,
      width: params.width,
      height: params.height,
      x: params.x || 0,
      y: params.y || 0,
      fills: params.backgroundColor
        ? [
            {
              type: 'SOLID' as const,
              color: hexToRgb(params.backgroundColor),
              opacity: 1,
            },
          ]
        : [],
    },
    parent: params.parent,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Create text command template
 */
export function createTextCommand(params: {
  content: string;
  x?: number;
  y?: number;
  fontSize?: number;
  color?: string;
  parent?: string;
}) {
  return {
    type: 'mcp-command' as const,
    version: '1.0',
    id: generateCommandId(),
    command: 'create_text',
    params: {
      content: params.content,
      x: params.x || 0,
      y: params.y || 0,
      fontSize: params.fontSize || 16,
      fills: params.color
        ? [
            {
              type: 'SOLID' as const,
              color: hexToRgb(params.color),
            },
          ]
        : undefined,
    },
    parent: params.parent,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Create rectangle command template
 */
export function createRectangleCommand(params: {
  width: number;
  height: number;
  x?: number;
  y?: number;
  fillColor?: string;
  cornerRadius?: number;
  parent?: string;
}) {
  return {
    type: 'mcp-command' as const,
    version: '1.0',
    id: generateCommandId(),
    command: 'create_rectangle',
    params: {
      width: params.width,
      height: params.height,
      x: params.x || 0,
      y: params.y || 0,
      fills: params.fillColor
        ? [
            {
              type: 'SOLID' as const,
              color: hexToRgb(params.fillColor),
            },
          ]
        : [],
      cornerRadius: params.cornerRadius || 0,
    },
    parent: params.parent,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Apply auto-layout command template
 */
export function applyAutoLayoutCommand(params: {
  nodeId: string;
  direction: 'HORIZONTAL' | 'VERTICAL';
  spacing?: number;
  padding?: number;
}) {
  return {
    type: 'mcp-command' as const,
    version: '1.0',
    id: generateCommandId(),
    command: 'apply_auto_layout',
    params: {
      mode: params.direction,
      itemSpacing: params.spacing || 0,
      paddingTop: params.padding || 0,
      paddingRight: params.padding || 0,
      paddingBottom: params.padding || 0,
      paddingLeft: params.padding || 0,
    },
    parent: params.nodeId,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Create component command template
 */
export function createComponentCommand(params: {
  name: string;
  description?: string;
  parent?: string;
}) {
  return {
    type: 'mcp-command' as const,
    version: '1.0',
    id: generateCommandId(),
    command: 'create_component',
    params: {
      name: params.name,
      description: params.description,
    },
    parent: params.parent,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Helper: Convert hex color to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    throw new Error(`Invalid hex color: ${hex}`);
  }
  return {
    r: parseInt(result[1], 16) / 255,
    g: parseInt(result[2], 16) / 255,
    b: parseInt(result[3], 16) / 255,
  };
}
```

---

### Step 4: Command Queue Manager

#### src/queue/types.ts

```typescript
import { BaseCommand, CommandResponse } from '../commands/types.js';

export interface QueuedCommand {
  command: BaseCommand;
  fileKey: string;
  status: 'pending' | 'posted' | 'completed' | 'failed' | 'timeout';
  commentId?: string;
  response?: CommandResponse;
  createdAt: number;
  updatedAt: number;
  timeoutAt: number;
}

export interface QueueStats {
  pending: number;
  posted: number;
  completed: number;
  failed: number;
  timeout: number;
  total: number;
}
```

#### src/queue/manager.ts

```typescript
import { QueuedCommand, QueueStats } from './types.js';
import { logger } from '../logger.js';

export class CommandQueue {
  private queue: Map<string, QueuedCommand> = new Map();
  private readonly defaultTimeout = 30000; // 30 seconds

  /**
   * Add command to queue
   */
  add(command: any, fileKey: string, timeout?: number): string {
    const queued: QueuedCommand = {
      command,
      fileKey,
      status: 'pending',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      timeoutAt: Date.now() + (timeout || this.defaultTimeout),
    };

    this.queue.set(command.id, queued);
    logger.info(`Command ${command.id} added to queue`);

    return command.id;
  }

  /**
   * Update command status
   */
  updateStatus(
    commandId: string,
    status: QueuedCommand['status'],
    data?: Partial<QueuedCommand>
  ) {
    const command = this.queue.get(commandId);
    if (!command) {
      logger.warn(`Command ${commandId} not found in queue`);
      return false;
    }

    command.status = status;
    command.updatedAt = Date.now();

    if (data) {
      Object.assign(command, data);
    }

    logger.info(`Command ${commandId} status: ${status}`);
    return true;
  }

  /**
   * Mark command as posted
   */
  markPosted(commandId: string, commentId: string) {
    return this.updateStatus(commandId, 'posted', { commentId });
  }

  /**
   * Mark command as completed
   */
  markCompleted(commandId: string, response: any) {
    return this.updateStatus(commandId, 'completed', { response });
  }

  /**
   * Mark command as failed
   */
  markFailed(commandId: string, response: any) {
    return this.updateStatus(commandId, 'failed', { response });
  }

  /**
   * Get command by ID
   */
  get(commandId: string): QueuedCommand | undefined {
    return this.queue.get(commandId);
  }

  /**
   * Get all commands with specific status
   */
  getByStatus(status: QueuedCommand['status']): QueuedCommand[] {
    return Array.from(this.queue.values()).filter((cmd) => cmd.status === status);
  }

  /**
   * Check for timed out commands
   */
  checkTimeouts(): string[] {
    const now = Date.now();
    const timedOut: string[] = [];

    this.queue.forEach((command, id) => {
      if (command.status === 'posted' && now > command.timeoutAt) {
        this.updateStatus(id, 'timeout');
        timedOut.push(id);
      }
    });

    if (timedOut.length > 0) {
      logger.warn(`${timedOut.length} commands timed out`);
    }

    return timedOut;
  }

  /**
   * Get queue statistics
   */
  getStats(): QueueStats {
    const stats: QueueStats = {
      pending: 0,
      posted: 0,
      completed: 0,
      failed: 0,
      timeout: 0,
      total: this.queue.size,
    };

    this.queue.forEach((command) => {
      stats[command.status]++;
    });

    return stats;
  }

  /**
   * Clear completed commands older than threshold
   */
  cleanup(maxAge: number = 3600000) {
    // 1 hour default
    const now = Date.now();
    let removed = 0;

    this.queue.forEach((command, id) => {
      if (
        (command.status === 'completed' ||
          command.status === 'failed' ||
          command.status === 'timeout') &&
        now - command.updatedAt > maxAge
      ) {
        this.queue.delete(id);
        removed++;
      }
    });

    if (removed > 0) {
      logger.info(`Cleaned up ${removed} old commands`);
    }

    return removed;
  }

  /**
   * Clear all commands
   */
  clear() {
    const size = this.queue.size;
    this.queue.clear();
    logger.info(`Cleared ${size} commands from queue`);
  }
}

// Singleton instance
export const commandQueue = new CommandQueue();
```

---

### Step 5: Result Polling System

#### src/queue/polling.ts

```typescript
import { figmaClient } from '../figma/client.js';
import { commandQueue } from './manager.js';
import { extractResponseFromComment } from '../commands/parser.js';
import { logger } from '../logger.js';

export class CommandPoller {
  private intervalId?: NodeJS.Timeout;
  private isPolling = false;
  private pollInterval = 5000; // 5 seconds

  /**
   * Start polling for command results
   */
  start(fileKey: string, interval: number = 5000) {
    if (this.isPolling) {
      logger.warn('Polling already started');
      return;
    }

    this.pollInterval = interval;
    this.isPolling = true;

    logger.info(`Starting command polling (${interval}ms interval)`);

    this.intervalId = setInterval(() => {
      this.poll(fileKey).catch((error) => {
        logger.error('Polling error:', error);
      });
    }, interval);
  }

  /**
   * Stop polling
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
      this.isPolling = false;
      logger.info('Stopped command polling');
    }
  }

  /**
   * Poll for results once
   */
  async poll(fileKey: string) {
    // Check for timeouts
    commandQueue.checkTimeouts();

    // Get all posted commands
    const postedCommands = commandQueue.getByStatus('posted');

    if (postedCommands.length === 0) {
      return;
    }

    logger.debug(`Polling ${postedCommands.length} posted commands`);

    try {
      // Get all comments from file
      const response = await figmaClient.getComments(fileKey);
      const comments = response.comments || [];

      // Check each posted command for responses
      for (const queuedCommand of postedCommands) {
        if (!queuedCommand.commentId) {
          continue;
        }

        // Find replies to this command comment
        const replies = comments.filter(
          (c: any) => c.parent_id === queuedCommand.commentId
        );

        // Look for response in replies
        for (const reply of replies) {
          const response = extractResponseFromComment(reply.message);

          if (response && response.commandId === queuedCommand.command.id) {
            logger.info(
              `Found response for command ${queuedCommand.command.id}: ${response.status}`
            );

            if (response.status === 'success') {
              commandQueue.markCompleted(queuedCommand.command.id, response);
            } else if (response.status === 'error') {
              commandQueue.markFailed(queuedCommand.command.id, response);
            }

            break;
          }
        }
      }
    } catch (error) {
      logger.error('Error polling for results:', error);
    }
  }

  /**
   * Wait for command to complete
   */
  async waitForCompletion(
    commandId: string,
    fileKey: string,
    timeout: number = 30000
  ): Promise<any> {
    const startTime = Date.now();

    return new Promise((resolve, reject) => {
      const checkInterval = setInterval(async () => {
        const command = commandQueue.get(commandId);

        if (!command) {
          clearInterval(checkInterval);
          reject(new Error('Command not found in queue'));
          return;
        }

        if (command.status === 'completed') {
          clearInterval(checkInterval);
          resolve(command.response);
          return;
        }

        if (command.status === 'failed') {
          clearInterval(checkInterval);
          reject(new Error(`Command failed: ${command.response?.error?.message}`));
          return;
        }

        if (command.status === 'timeout' || Date.now() - startTime > timeout) {
          clearInterval(checkInterval);
          reject(new Error('Command timed out'));
          return;
        }

        // Poll for updates
        await this.poll(fileKey).catch(() => {});
      }, 1000); // Check every second
    });
  }
}

// Singleton instance
export const commandPoller = new CommandPoller();
```

---

### Step 6: Command Posting Tools

#### src/tools/command-tools.ts

```typescript
import { z } from 'zod';
import { figmaClient } from '../figma/client.js';
import { commandQueue } from '../queue/manager.js';
import { commandPoller } from '../queue/polling.js';
import { formatCommandMessage } from '../commands/parser.js';
import { validateCommandParams } from '../commands/validator.js';
import {
  createFrameCommand,
  createTextCommand,
  createRectangleCommand,
  applyAutoLayoutCommand,
  createComponentCommand,
} from '../commands/templates.js';
import { ToolResponse } from '../types.js';
import { logger } from '../logger.js';

// Tool input schemas
const PostCommandSchema = z.object({
  file_key: z.string(),
  command: z.string(),
  params: z.record(z.any()),
  parent: z.string().optional(),
  wait_for_completion: z.boolean().default(false),
  timeout: z.number().default(30000),
});

const GetCommandStatusSchema = z.object({
  command_id: z.string(),
});

const BatchCommandSchema = z.object({
  file_key: z.string(),
  commands: z.array(
    z.object({
      command: z.string(),
      params: z.record(z.any()),
      parent: z.string().optional(),
    })
  ),
  wait_for_completion: z.boolean().default(false),
});

/**
 * Post a command to Figma as a comment
 */
export async function postCommand(
  input: z.infer<typeof PostCommandSchema>
): Promise<ToolResponse> {
  try {
    // Validate params
    const validatedParams = validateCommandParams(input.command, input.params);

    // Create command based on type
    let command;
    switch (input.command) {
      case 'create_frame':
        command = createFrameCommand({ ...validatedParams, parent: input.parent });
        break;
      case 'create_text':
        command = createTextCommand({ ...validatedParams, parent: input.parent });
        break;
      case 'create_rectangle':
        command = createRectangleCommand({
          ...validatedParams,
          parent: input.parent,
        });
        break;
      case 'apply_auto_layout':
        command = applyAutoLayoutCommand({
          ...validatedParams,
          nodeId: input.parent!,
        });
        break;
      case 'create_component':
        command = createComponentCommand({
          ...validatedParams,
          parent: input.parent,
        });
        break;
      default:
        throw new Error(`Unknown command: ${input.command}`);
    }

    // Add to queue
    const commandId = commandQueue.add(command, input.file_key, input.timeout);

    // Post as Figma comment
    const message = formatCommandMessage(command);

    // Note: Figma API doesn't support posting comments via REST API
    // We need to use a different approach or the plugin itself must post commands
    // For now, we'll simulate this
    logger.warn('Comment posting not yet implemented in Figma REST API');

    // Mark as posted (simulated)
    commandQueue.markPosted(commandId, 'simulated-comment-id');

    // Wait for completion if requested
    if (input.wait_for_completion) {
      try {
        const response = await commandPoller.waitForCompletion(
          commandId,
          input.file_key,
          input.timeout
        );

        return {
          content: [
            {
              type: 'text',
              text: `Command executed successfully!\n\nResult: ${JSON.stringify(response.result, null, 2)}`,
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [{ type: 'text', text: `Command failed: ${error.message}` }],
          isError: true,
        };
      }
    }

    // Return immediately
    return {
      content: [
        {
          type: 'text',
          text: `Command posted: ${commandId}\n\nUse get_command_status to check progress.`,
        },
      ],
    };
  } catch (error: any) {
    logger.error('Error posting command:', error);
    return {
      content: [{ type: 'text', text: `Error: ${error.message}` }],
      isError: true,
    };
  }
}

/**
 * Get status of a command
 */
export async function getCommandStatus(
  input: z.infer<typeof GetCommandStatusSchema>
): Promise<ToolResponse> {
  try {
    const command = commandQueue.get(input.command_id);

    if (!command) {
      return {
        content: [{ type: 'text', text: 'Command not found in queue' }],
        isError: true,
      };
    }

    const statusText = `Command Status: ${command.status}

Created: ${new Date(command.createdAt).toLocaleString()}
Updated: ${new Date(command.updatedAt).toLocaleString()}

${command.response ? `Response:\n${JSON.stringify(command.response, null, 2)}` : ''}`;

    return {
      content: [{ type: 'text', text: statusText }],
    };
  } catch (error: any) {
    logger.error('Error getting command status:', error);
    return {
      content: [{ type: 'text', text: `Error: ${error.message}` }],
      isError: true,
    };
  }
}

/**
 * Post multiple commands as a batch
 */
export async function postBatchCommands(
  input: z.infer<typeof BatchCommandSchema>
): Promise<ToolResponse> {
  try {
    const commandIds: string[] = [];

    // Post each command
    for (const cmd of input.commands) {
      const result = await postCommand({
        file_key: input.file_key,
        command: cmd.command,
        params: cmd.params,
        parent: cmd.parent,
        wait_for_completion: false,
      });

      // Extract command ID from result
      const match = result.content[0].text?.match(/Command posted: (cmd-[^\s]+)/);
      if (match) {
        commandIds.push(match[1]);
      }
    }

    // Wait for all if requested
    if (input.wait_for_completion) {
      // Implementation for waiting on batch
      // Simplified for now
    }

    return {
      content: [
        {
          type: 'text',
          text: `Batch posted: ${commandIds.length} commands\n\nIDs:\n${commandIds.join('\n')}`,
        },
      ],
    };
  } catch (error: any) {
    logger.error('Error posting batch commands:', error);
    return {
      content: [{ type: 'text', text: `Error: ${error.message}` }],
      isError: true,
    };
  }
}
```

---

## 🤖 Claude Code Prompts

### Implement Command Types Prompt
```
Implement the command type system in src/commands/types.ts as specified in PHASE_2.md.

Create Zod schemas for:
- Base command structure
- Frame creation parameters
- Text creation parameters  
- Rectangle creation parameters
- Auto-layout application
- Component creation
- Style application
- Property updates
- Command responses
- Queue types

Use TypeScript strict mode and follow the exact schemas shown in the documentation.
```

### Implement Parser & Validator Prompt
```
Implement command parsing and validation in src/commands/parser.ts and src/commands/validator.ts following PHASE_2.md.

Parser should:
- Parse command JSON with error handling
- Extract commands from Figma comments
- Extract responses from comment replies
- Format commands for posting

Validator should:
- Validate params for each command type using Zod
- Validate node ID formats
- Validate color objects
- Provide clear error messages
```

### Implement Queue Manager Prompt
```
Implement the command queue system in src/queue/manager.ts and src/queue/polling.ts as specified in PHASE_2.md.

Queue manager should:
- Add commands to queue with timeout
- Track command status (pending/posted/completed/failed/timeout)
- Update command status and metadata
- Check for timeouts
- Provide queue statistics
- Clean up old commands

Polling system should:
- Poll Figma comments for responses
- Match responses to queued commands
- Update queue with results
- Support waiting for completion
```

---

## ✅ Phase 2 Completion Checklist

### Types & Schemas
- [ ] Command types defined
- [ ] Parameter schemas created
- [ ] Response schema defined
- [ ] Queue types defined

### Parsing & Validation
- [ ] Command parser implemented
- [ ] Response parser implemented
- [ ] Parameter validator implemented
- [ ] Comment extraction working

### Templates
- [ ] Command ID generation
- [ ] Frame command template
- [ ] Text command template
- [ ] Rectangle command template
- [ ] Auto-layout command template
- [ ] Component command template

### Queue System
- [ ] Queue manager implemented
- [ ] Command status tracking
- [ ] Timeout detection
- [ ] Statistics collection
- [ ] Cleanup functionality

### Polling
- [ ] Polling system implemented
- [ ] Response detection
- [ ] Status updates
- [ ] Wait for completion

### Tools
- [ ] post_command tool
- [ ] get_command_status tool
- [ ] post_batch_commands tool
- [ ] Tools registered in MCP

### Testing
- [ ] Parser tests
- [ ] Validator tests
- [ ] Queue tests
- [ ] Integration tests

---

## 🎯 Success Criteria

**Phase 2 is complete when:**

1. ✅ Commands can be created and validated
2. ✅ Queue manages command lifecycle
3. ✅ Polling detects responses (simulated)
4. ✅ All command tools work
5. ✅ Tests pass
6. ✅ Ready for Phase 3 (plugin integration)

---

## 📚 Next Steps

Once Phase 2 is complete, proceed to **PHASE_3.md** to build the Figma plugin that executes these commands!
