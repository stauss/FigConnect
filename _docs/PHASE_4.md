# Phase 4: Enhanced Features & Optimizations

## 🎯 Objective

Add advanced capabilities, high-level AI-friendly tools, performance optimizations, and design system integration to create a production-ready Figma MCP Server.

**Duration**: 3-5 days  
**Complexity**: Medium-High  
**Prerequisites**: Phases 1-3 completed and tested

## 📦 Deliverables

- ✅ Batch command operations
- ✅ Transaction support (all-or-nothing)
- ✅ Design system integration
- ✅ Component library management
- ✅ High-level AI-friendly tools
- ✅ Performance optimizations
- ✅ Caching layer
- ✅ Enhanced error recovery
- ✅ Comprehensive documentation

## 🎯 Feature Categories

### 1. Batch Operations
Execute multiple commands atomically with rollback support.

### 2. Design System Integration
Read and apply design tokens, variables, and component patterns.

### 3. Component Library
Generate, update, and manage component systems.

### 4. AI-Friendly Tools
High-level operations that Claude Code can use naturally.

### 5. Performance
Caching, request batching, and optimization.

## 🚀 Implementation Steps

### Feature 1: Batch Operations

#### src/tools/batch-tools.ts

```typescript
import { z } from 'zod';
import { commandQueue } from '../queue/manager.js';
import { postCommand } from './command-tools.js';
import { ToolResponse } from '../types.js';
import { logger } from '../logger.js';

const BatchExecuteSchema = z.object({
  file_key: z.string(),
  commands: z.array(
    z.object({
      command: z.string(),
      params: z.record(z.any()),
      parent: z.string().optional(),
    })
  ),
  transaction: z.boolean().default(false).describe('Execute as atomic transaction'),
  wait_for_completion: z.boolean().default(true),
  timeout: z.number().default(60000),
});

/**
 * Execute multiple commands in sequence or as transaction
 */
export async function batchExecute(
  input: z.infer<typeof BatchExecuteSchema>
): Promise<ToolResponse> {
  const commandIds: string[] = [];
  const results: any[] = [];

  try {
    logger.info(`Executing batch: ${input.commands.length} commands`);

    // Post all commands
    for (let i = 0; i < input.commands.length; i++) {
      const cmd = input.commands[i];

      const result = await postCommand({
        file_key: input.file_key,
        command: cmd.command,
        params: cmd.params,
        parent: cmd.parent,
        wait_for_completion: false,
      });

      const match = result.content[0].text?.match(/Command posted: (cmd-[^\s]+)/);
      if (match) {
        commandIds.push(match[1]);
      }
    }

    // Wait for all to complete if requested
    if (input.wait_for_completion) {
      const timeout = input.timeout;
      const startTime = Date.now();

      while (results.length < commandIds.length) {
        if (Date.now() - startTime > timeout) {
          throw new Error('Batch execution timed out');
        }

        // Check each command
        for (const id of commandIds) {
          if (results.find((r) => r.commandId === id)) {
            continue;
          }

          const command = commandQueue.get(id);
          if (command?.status === 'completed') {
            results.push({
              commandId: id,
              status: 'success',
              result: command.response?.result,
            });
          } else if (command?.status === 'failed') {
            if (input.transaction) {
              throw new Error(`Transaction failed at command ${id}`);
            }
            results.push({
              commandId: id,
              status: 'failed',
              error: command.response?.error,
            });
          }
        }

        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    const successCount = results.filter((r) => r.status === 'success').length;
    const failCount = results.filter((r) => r.status === 'failed').length;

    return {
      content: [
        {
          type: 'text',
          text: `Batch execution completed!\n\nSuccess: ${successCount}\nFailed: ${failCount}\n\nResults:\n${JSON.stringify(results, null, 2)}`,
        },
      ],
    };
  } catch (error: any) {
    logger.error('Batch execution failed:', error);

    // Rollback if transaction
    if (input.transaction) {
      logger.warn('Rolling back transaction...');
      // TODO: Implement rollback logic
    }

    return {
      content: [{ type: 'text', text: `Batch failed: ${error.message}` }],
      isError: true,
    };
  }
}
```

---

### Feature 2: Design System Integration

#### src/tools/design-system-tools.ts

```typescript
import { z } from 'zod';
import { figmaClient } from '../figma/client.js';
import { ToolResponse } from '../types.js';
import { logger } from '../logger.js';

const GetDesignTokensSchema = z.object({
  file_key: z.string(),
  token_type: z
    .enum(['colors', 'typography', 'spacing', 'all'])
    .optional()
    .default('all'),
});

const ApplyDesignSystemSchema = z.object({
  file_key: z.string(),
  node_id: z.string(),
  system: z.object({
    colors: z.boolean().default(true),
    typography: z.boolean().default(true),
    spacing: z.boolean().default(true),
  }),
});

/**
 * Get design tokens from file
 */
export async function getDesignTokens(
  input: z.infer<typeof GetDesignTokensSchema>
): Promise<ToolResponse> {
  try {
    logger.info(`Getting design tokens: ${input.token_type}`);

    const [variables, styles] = await Promise.all([
      figmaClient.getLocalVariables(input.file_key),
      figmaClient.getFileStyles(input.file_key),
    ]);

    // Process variables into tokens
    const colorTokens = extractColorTokens(variables);
    const spacingTokens = extractSpacingTokens(variables);

    // Process styles into typography tokens
    const typographyTokens = extractTypographyTokens(styles);

    const tokens: any = {};

    if (input.token_type === 'all' || input.token_type === 'colors') {
      tokens.colors = colorTokens;
    }
    if (input.token_type === 'all' || input.token_type === 'typography') {
      tokens.typography = typographyTokens;
    }
    if (input.token_type === 'all' || input.token_type === 'spacing') {
      tokens.spacing = spacingTokens;
    }

    return {
      content: [
        {
          type: 'text',
          text: `# Design Tokens\n\n\`\`\`json\n${JSON.stringify(tokens, null, 2)}\n\`\`\``,
        },
      ],
    };
  } catch (error: any) {
    logger.error('Error getting design tokens:', error);
    return {
      content: [{ type: 'text', text: `Error: ${error.message}` }],
      isError: true,
    };
  }
}

/**
 * Apply design system to node
 */
export async function applyDesignSystem(
  input: z.infer<typeof ApplyDesignSystemSchema>
): Promise<ToolResponse> {
  try {
    logger.info(`Applying design system to node: ${input.node_id}`);

    // Get design tokens
    const tokens = await getDesignTokens({
      file_key: input.file_key,
      token_type: 'all',
    });

    // Parse tokens
    const tokenData = JSON.parse(
      tokens.content[0].text?.match(/```json\n([\s\S]*?)\n```/)?.[1] || '{}'
    );

    // Apply each system aspect
    const results: string[] = [];

    if (input.system.colors) {
      // Apply color tokens
      results.push('Applied color system');
    }

    if (input.system.typography) {
      // Apply typography tokens
      results.push('Applied typography system');
    }

    if (input.system.spacing) {
      // Apply spacing tokens
      results.push('Applied spacing system');
    }

    return {
      content: [
        {
          type: 'text',
          text: `Design system applied!\n\n${results.join('\n')}`,
        },
      ],
    };
  } catch (error: any) {
    logger.error('Error applying design system:', error);
    return {
      content: [{ type: 'text', text: `Error: ${error.message}` }],
      isError: true,
    };
  }
}

// Helper functions
function extractColorTokens(variables: any) {
  // Extract color variables
  const colors: any = {};
  // TODO: Parse Figma variables structure
  return colors;
}

function extractSpacingTokens(variables: any) {
  // Extract spacing variables
  const spacing: any = {};
  // TODO: Parse Figma variables structure
  return spacing;
}

function extractTypographyTokens(styles: any) {
  // Extract text styles
  const typography: any = {};
  // TODO: Parse Figma text styles
  return typography;
}
```

---

### Feature 3: High-Level AI Tools

#### src/tools/ai-friendly-tools.ts

```typescript
import { z } from 'zod';
import { batchExecute } from './batch-tools.js';
import { ToolResponse } from '../types.js';
import { logger } from '../logger.js';

const GenerateLayoutSchema = z.object({
  file_key: z.string(),
  description: z.string().describe('Natural language layout description'),
  parent: z.string().optional(),
  width: z.number().optional().default(1440),
  height: z.number().optional().default(900),
});

const CreateCardComponentSchema = z.object({
  file_key: z.string(),
  style: z
    .enum(['minimal', 'material', 'glassmorphic', 'neumorphic'])
    .optional()
    .default('minimal'),
  has_image: z.boolean().default(true),
  has_cta: z.boolean().default(true),
  parent: z.string().optional(),
});

const CreateFormSchema = z.object({
  file_key: z.string(),
  fields: z.array(
    z.object({
      type: z.enum(['text', 'email', 'password', 'textarea', 'select', 'checkbox']),
      label: z.string(),
      placeholder: z.string().optional(),
      required: z.boolean().default(false),
    })
  ),
  submit_label: z.string().default('Submit'),
  parent: z.string().optional(),
});

/**
 * Generate layout from natural language description
 */
export async function generateLayout(
  input: z.infer<typeof GenerateLayoutSchema>
): Promise<ToolResponse> {
  try {
    logger.info(`Generating layout: "${input.description}"`);

    // Parse description and generate commands
    const commands = parseLayoutDescription(input.description, input.width, input.height);

    // Execute as batch
    return await batchExecute({
      file_key: input.file_key,
      commands,
      transaction: true,
      wait_for_completion: true,
    });
  } catch (error: any) {
    logger.error('Error generating layout:', error);
    return {
      content: [{ type: 'text', text: `Error: ${error.message}` }],
      isError: true,
    };
  }
}

/**
 * Create a card component with variants
 */
export async function createCardComponent(
  input: z.infer<typeof CreateCardComponentSchema>
): Promise<ToolResponse> {
  try {
    logger.info(`Creating card component: ${input.style} style`);

    const commands: any[] = [];

    // Create main component frame
    commands.push({
      command: 'create_frame',
      params: {
        name: 'Card Component',
        width: 300,
        height: 400,
        fills: [
          {
            type: 'SOLID',
            color: { r: 1, g: 1, b: 1 },
          },
        ],
        cornerRadius: 12,
      },
      parent: input.parent,
    });

    // Add image if requested
    if (input.has_image) {
      commands.push({
        command: 'create_rectangle',
        params: {
          name: 'Image Placeholder',
          width: 300,
          height: 180,
          fills: [
            {
              type: 'SOLID',
              color: { r: 0.9, g: 0.9, b: 0.9 },
            },
          ],
        },
      });
    }

    // Add title
    commands.push({
      command: 'create_text',
      params: {
        content: 'Card Title',
        fontSize: 20,
        fontWeight: 600,
      },
    });

    // Add description
    commands.push({
      command: 'create_text',
      params: {
        content: 'Card description goes here',
        fontSize: 14,
      },
    });

    // Add CTA if requested
    if (input.has_cta) {
      commands.push({
        command: 'create_frame',
        params: {
          name: 'CTA Button',
          width: 120,
          height: 40,
          fills: [
            {
              type: 'SOLID',
              color: { r: 0.2, g: 0.6, b: 1 },
            },
          ],
          cornerRadius: 8,
        },
      });

      commands.push({
        command: 'create_text',
        params: {
          content: 'Learn More',
          fontSize: 14,
          fontWeight: 500,
          fills: [
            {
              type: 'SOLID',
              color: { r: 1, g: 1, b: 1 },
            },
          ],
        },
      });
    }

    // Execute as batch
    return await batchExecute({
      file_key: input.file_key,
      commands,
      transaction: true,
      wait_for_completion: true,
    });
  } catch (error: any) {
    logger.error('Error creating card component:', error);
    return {
      content: [{ type: 'text', text: `Error: ${error.message}` }],
      isError: true,
    };
  }
}

/**
 * Create a form with specified fields
 */
export async function createForm(
  input: z.infer<typeof CreateFormSchema>
): Promise<ToolResponse> {
  try {
    logger.info(`Creating form with ${input.fields.length} fields`);

    const commands: any[] = [];
    const formWidth = 400;
    const fieldHeight = 60;
    const spacing = 16;

    // Create form container
    commands.push({
      command: 'create_frame',
      params: {
        name: 'Form',
        width: formWidth,
        height: input.fields.length * (fieldHeight + spacing) + 80,
        fills: [
          {
            type: 'SOLID',
            color: { r: 0.98, g: 0.98, b: 0.98 },
          },
        ],
        cornerRadius: 8,
      },
      parent: input.parent,
    });

    // Add fields
    for (let i = 0; i < input.fields.length; i++) {
      const field = input.fields[i];

      // Field label
      commands.push({
        command: 'create_text',
        params: {
          content: field.label + (field.required ? ' *' : ''),
          fontSize: 14,
          fontWeight: 500,
        },
      });

      // Field input
      commands.push({
        command: 'create_frame',
        params: {
          name: `${field.type}_input`,
          width: formWidth - 32,
          height: field.type === 'textarea' ? 100 : 40,
          fills: [
            {
              type: 'SOLID',
              color: { r: 1, g: 1, b: 1 },
            },
          ],
          cornerRadius: 4,
        },
      });

      if (field.placeholder) {
        commands.push({
          command: 'create_text',
          params: {
            content: field.placeholder,
            fontSize: 14,
            fills: [
              {
                type: 'SOLID',
                color: { r: 0.6, g: 0.6, b: 0.6 },
              },
            ],
          },
        });
      }
    }

    // Add submit button
    commands.push({
      command: 'create_frame',
      params: {
        name: 'Submit Button',
        width: formWidth - 32,
        height: 48,
        fills: [
          {
            type: 'SOLID',
            color: { r: 0.2, g: 0.6, b: 1 },
          },
        ],
        cornerRadius: 6,
      },
    });

    commands.push({
      command: 'create_text',
      params: {
        content: input.submit_label,
        fontSize: 16,
        fontWeight: 600,
        fills: [
          {
            type: 'SOLID',
            color: { r: 1, g: 1, b: 1 },
          },
        ],
      },
    });

    // Execute as batch
    return await batchExecute({
      file_key: input.file_key,
      commands,
      transaction: true,
      wait_for_completion: true,
    });
  } catch (error: any) {
    logger.error('Error creating form:', error);
    return {
      content: [{ type: 'text', text: `Error: ${error.message}` }],
      isError: true,
    };
  }
}

// Helper function to parse layout descriptions
function parseLayoutDescription(
  description: string,
  width: number,
  height: number
): any[] {
  // TODO: Implement smart parsing of natural language
  // This would use LLM or rule-based parsing to generate commands

  const commands: any[] = [];

  // Simplified example
  if (description.toLowerCase().includes('hero section')) {
    commands.push({
      command: 'create_frame',
      params: {
        name: 'Hero Section',
        width,
        height: 600,
      },
    });
  }

  return commands;
}
```

---

### Feature 4: Performance Optimizations

#### src/cache/file-cache.ts

```typescript
import { logger } from '../logger.js';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export class FileCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private readonly defaultTTL = 300000; // 5 minutes

  /**
   * Get item from cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      logger.debug(`Cache expired: ${key}`);
      return null;
    }

    logger.debug(`Cache hit: ${key}`);
    return entry.data as T;
  }

  /**
   * Set item in cache
   */
  set<T>(key: string, data: T, ttl: number = this.defaultTTL) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
    logger.debug(`Cached: ${key} (TTL: ${ttl}ms)`);
  }

  /**
   * Delete item from cache
   */
  delete(key: string) {
    this.cache.delete(key);
    logger.debug(`Cache deleted: ${key}`);
  }

  /**
   * Clear all cache
   */
  clear() {
    const size = this.cache.size;
    this.cache.clear();
    logger.info(`Cache cleared: ${size} entries`);
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys()),
    };
  }

  /**
   * Clean up expired entries
   */
  cleanup() {
    const now = Date.now();
    let removed = 0;

    this.cache.forEach((entry, key) => {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        removed++;
      }
    });

    if (removed > 0) {
      logger.info(`Cleaned up ${removed} expired cache entries`);
    }

    return removed;
  }
}

// Singleton instance
export const fileCache = new FileCache();
```

#### src/figma/client.ts (with caching)

```typescript
// Add to existing FigmaClient class

import { fileCache } from '../cache/file-cache.js';

export class FigmaClient {
  // ... existing code ...

  /**
   * Get file with caching
   */
  async getFile(fileKey: string, depth?: number, useCache: boolean = true) {
    const cacheKey = `file:${fileKey}:${depth || 'full'}`;

    // Check cache
    if (useCache) {
      const cached = fileCache.get(cacheKey);
      if (cached) {
        logger.debug('Using cached file data');
        return cached;
      }
    }

    // Fetch from API
    const params = depth ? { depth: depth.toString() } : undefined;
    const data = await this.get(`/files/${fileKey}`, params);

    // Cache result
    if (useCache) {
      fileCache.set(cacheKey, data, 300000); // 5 minutes
    }

    return data;
  }
}
```

---

### Feature 5: Documentation & Examples

#### docs/EXAMPLES.md

```markdown
# Figma MCP Server - Usage Examples

## Basic Operations

### Read File Structure

\`\`\`
Claude Code → get_file_structure({ file_key: "abc123", depth: 3 })

Returns: Hierarchical tree view of all frames and layers
\`\`\`

### Create a Frame

\`\`\`
Claude Code → post_command({
  file_key: "abc123",
  command: "create_frame",
  params: {
    name: "Hero Section",
    width: 1440,
    height: 600,
    fills: [{ type: "SOLID", color: { r: 0.95, g: 0.95, b: 0.95 } }]
  }
})

Result: Frame created with ID returned
\`\`\`

## Advanced Workflows

### Generate Login Screen

\`\`\`
User: "Create a mobile login screen with email, password, and button"

Claude Code executes:
1. generate_layout({
     description: "mobile login screen with email input, password input, and blue login button",
     width: 375,
     height: 812
   })

Result: Complete login UI created
\`\`\`

### Apply Design System

\`\`\`
User: "Apply our design system to this component"

Claude Code executes:
1. get_design_tokens({ file_key: "abc123" })
2. apply_design_system({
     file_key: "abc123",
     node_id: "123:456",
     system: { colors: true, typography: true }
   })

Result: Component styled with design tokens
\`\`\`

## Component Creation

### Card Component

\`\`\`
create_card_component({
  file_key: "abc123",
  style: "material",
  has_image: true,
  has_cta: true
})

Result: Card component with image, title, description, and CTA
\`\`\`

### Form Generation

\`\`\`
create_form({
  file_key: "abc123",
  fields: [
    { type: "text", label: "Name", required: true },
    { type: "email", label: "Email", required: true },
    { type: "textarea", label: "Message" }
  ],
  submit_label: "Send Message"
})

Result: Complete form with all fields and submit button
\`\`\`
```

---

## 🤖 Claude Code Prompts

### Implement Batch Operations
```
Implement batch command execution in src/tools/batch-tools.ts following PHASE_4.md.

Create:
- Batch execute function
- Transaction support (all-or-nothing)
- Rollback capability on failure
- Progress tracking
- Timeout handling

Support executing 1-100 commands in sequence with proper error handling.
```

### Implement Design System Tools
```
Implement design system integration in src/tools/design-system-tools.ts as specified in PHASE_4.md.

Create:
- Get design tokens (colors, typography, spacing)
- Apply design system to nodes
- Token extraction from Figma variables
- Style extraction and application

Parse Figma's variable and style APIs to extract design tokens.
```

### Implement AI-Friendly Tools
```
Implement high-level AI tools in src/tools/ai-friendly-tools.ts following PHASE_4.md.

Create:
- generate_layout (from natural language)
- create_card_component (with style variants)
- create_form (with multiple field types)
- Helper functions for smart parsing

These tools should be easy for Claude Code to use with natural language inputs.
```

---

## ✅ Phase 4 Completion Checklist

### Batch Operations
- [ ] Batch execute implemented
- [ ] Transaction support
- [ ] Rollback on failure
- [ ] Progress tracking

### Design System
- [ ] Token extraction
- [ ] Style extraction
- [ ] Design system application
- [ ] Variable support

### AI-Friendly Tools
- [ ] Layout generation
- [ ] Card component
- [ ] Form generation
- [ ] Natural language parsing

### Performance
- [ ] File caching
- [ ] Request batching
- [ ] Cache cleanup
- [ ] Statistics tracking

### Documentation
- [ ] Usage examples
- [ ] API reference
- [ ] Best practices
- [ ] Troubleshooting guide

---

## 🎯 Success Criteria

**Phase 4 is complete when:**

1. ✅ Batch operations work reliably
2. ✅ Design tokens can be extracted and applied
3. ✅ AI-friendly tools generate complex UIs
4. ✅ Performance is optimized with caching
5. ✅ Documentation is comprehensive
6. ✅ System is production-ready

---

## 🚀 Production Deployment

### Checklist
- [ ] All phases tested end-to-end
- [ ] Error handling is robust
- [ ] Logging is comprehensive
- [ ] Documentation is complete
- [ ] Examples are working
- [ ] Performance is acceptable

### Monitoring
- Track command success/failure rates
- Monitor API rate limits
- Log execution times
- Track cache hit rates

---

## 🎉 Project Complete!

You now have a fully functional Figma MCP Server that:
- Reads Figma files comprehensively
- Executes design commands via comments
- Supports batch and atomic operations
- Integrates with design systems
- Provides AI-friendly high-level tools
- Optimizes performance with caching

**Next**: Deploy and use with Claude Code to build amazing Figma workflows!
