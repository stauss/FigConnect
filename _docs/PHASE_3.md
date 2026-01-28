# Phase 3: Figma Plugin Bridge

## 🎯 Objective

Build a Figma plugin that polls for MCP commands posted as comments and executes them using the Figma Plugin API. This plugin bridges the gap between the read-only REST API and full design manipulation capabilities.

**Duration**: 2-3 days  
**Complexity**: High  
**Prerequisites**: Phases 1-2 completed, Figma desktop app installed

## 📦 Deliverables

- ✅ Figma plugin that runs in background
- ✅ Comment polling system
- ✅ 8 command executors (frame, text, rectangle, auto-layout, etc.)
- ✅ Response posting system
- ✅ Error handling and logging
- ✅ Plugin configuration UI (optional)

## 🗂️ File Structure

```
figma-plugin-bridge/
├── src/
│   ├── code.ts                  # Main plugin code
│   ├── ui.html                  # Hidden UI for network
│   │
│   ├── commands/
│   │   ├── executor.ts          # Command execution router
│   │   ├── frame.ts             # Frame operations
│   │   ├── text.ts              # Text operations
│   │   ├── rectangle.ts         # Rectangle operations
│   │   ├── layout.ts            # Auto-layout operations
│   │   ├── component.ts         # Component operations
│   │   └── styles.ts            # Style operations
│   │
│   ├── polling/
│   │   ├── comments.ts          # Poll Figma comments
│   │   ├── processor.ts         # Process command queue
│   │   └── types.ts             # Polling types
│   │
│   └── utils/
│       ├── colors.ts            # Color conversion
│       ├── fonts.ts             # Font loading
│       ├── logger.ts            # Plugin logging
│       └── nodes.ts             # Node utilities
│
├── manifest.json                # Plugin manifest
├── package.json
├── tsconfig.json
└── README.md
```

## 🚀 Implementation Steps

### Step 1: Plugin Setup

#### manifest.json

```json
{
  "name": "Figma MCP Bridge",
  "id": "figma-mcp-bridge",
  "api": "1.0.0",
  "main": "dist/code.js",
  "ui": "dist/ui.html",
  "editorType": ["figma"],
  "networkAccess": {
    "allowedDomains": ["none"],
    "reasoning": "Plugin reads commands from file comments"
  }
}
```

#### package.json

```json
{
  "name": "figma-mcp-bridge",
  "version": "1.0.0",
  "description": "Figma plugin that executes MCP commands from comments",
  "main": "dist/code.js",
  "scripts": {
    "build": "tsc && cp src/ui.html dist/ui.html",
    "watch": "tsc --watch"
  },
  "dependencies": {},
  "devDependencies": {
    "@figma/plugin-typings": "^1.90.0",
    "typescript": "^5.3.0"
  }
}
```

#### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ES2020",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "types": ["@figma/plugin-typings"]
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

---

### Step 2: Core Plugin Code

#### src/code.ts

```typescript
import { CommandProcessor } from './polling/processor';
import { Logger } from './utils/logger';

const logger = new Logger('MCP Bridge');

// Show invisible UI for potential network access
figma.showUI(__html__, { visible: false, width: 1, height: 1 });

// Configuration
const POLL_INTERVAL = 5000; // 5 seconds
let processor: CommandProcessor;
let pollInterval: number | null = null;

/**
 * Initialize plugin
 */
async function initialize() {
  logger.info('Figma MCP Bridge starting...');

  try {
    // Create command processor
    processor = new CommandProcessor();

    // Start polling for commands
    startPolling();

    logger.info('Plugin initialized successfully');

    // Notify user
    figma.notify('MCP Bridge running - monitoring for commands', {
      timeout: 3000,
    });
  } catch (error) {
    logger.error('Initialization failed:', error);
    figma.notify('MCP Bridge failed to start', { error: true });
  }
}

/**
 * Start polling for commands
 */
function startPolling() {
  if (pollInterval) {
    return;
  }

  pollInterval = setInterval(async () => {
    try {
      await processor.processCommands();
    } catch (error) {
      logger.error('Polling error:', error);
    }
  }, POLL_INTERVAL);

  logger.info(`Polling started (${POLL_INTERVAL}ms interval)`);
}

/**
 * Stop polling
 */
function stopPolling() {
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
    logger.info('Polling stopped');
  }
}

/**
 * Handle plugin close
 */
figma.on('close', () => {
  stopPolling();
  logger.info('Plugin closing');
});

// Initialize on load
initialize();
```

#### src/ui.html

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>MCP Bridge</title>
    <style>
      body {
        margin: 0;
        padding: 8px;
        font-family: 'Inter', sans-serif;
        font-size: 11px;
      }
    </style>
  </head>
  <body>
    <div>MCP Bridge Active</div>
    <script>
      // Placeholder for any UI interactions
      console.log('MCP Bridge UI loaded');
    </script>
  </body>
</html>
```

---

### Step 3: Command Execution System

#### src/commands/executor.ts

```typescript
import { executeCreateFrame } from './frame';
import { executeCreateText } from './text';
import { executeCreateRectangle } from './rectangle';
import { executeApplyAutoLayout } from './layout';
import { executeCreateComponent } from './component';
import { executeApplyStyle } from './styles';
import { Logger } from '../utils/logger';

const logger = new Logger('Executor');

export interface Command {
  type: 'mcp-command';
  version: string;
  id: string;
  command: string;
  params: any;
  parent?: string;
  timestamp: string;
}

export interface CommandResult {
  success: boolean;
  result?: any;
  error?: {
    code: string;
    message: string;
    details?: string;
  };
}

/**
 * Execute a command
 */
export async function executeCommand(command: Command): Promise<CommandResult> {
  logger.info(`Executing command: ${command.command} (${command.id})`);

  try {
    // Validate parent node if specified
    let parentNode: BaseNode | null = null;
    if (command.parent) {
      parentNode = figma.getNodeById(command.parent);
      if (!parentNode) {
        throw new Error(`Parent node not found: ${command.parent}`);
      }
    }

    // Route to appropriate executor
    switch (command.command) {
      case 'create_frame':
        return await executeCreateFrame(command.params, parentNode);

      case 'create_text':
        return await executeCreateText(command.params, parentNode);

      case 'create_rectangle':
        return await executeCreateRectangle(command.params, parentNode);

      case 'apply_auto_layout':
        return await executeApplyAutoLayout(command.params, parentNode);

      case 'create_component':
        return await executeCreateComponent(command.params, parentNode);

      case 'apply_style':
        return await executeApplyStyle(command.params, parentNode);

      default:
        throw new Error(`Unknown command: ${command.command}`);
    }
  } catch (error: any) {
    logger.error(`Command failed: ${command.id}`, error);
    return {
      success: false,
      error: {
        code: 'EXECUTION_ERROR',
        message: error.message,
        details: error.stack,
      },
    };
  }
}
```

#### src/commands/frame.ts

```typescript
import { CommandResult } from './executor';
import { rgbToFigmaColor } from '../utils/colors';
import { Logger } from '../utils/logger';

const logger = new Logger('Frame');

export async function executeCreateFrame(
  params: any,
  parent: BaseNode | null
): Promise<CommandResult> {
  try {
    const frame = figma.createFrame();

    // Set basic properties
    frame.name = params.name || 'Frame';
    frame.resize(params.width, params.height);
    frame.x = params.x || 0;
    frame.y = params.y || 0;

    // Set fills
    if (params.fills && params.fills.length > 0) {
      frame.fills = params.fills.map((fill: any) => {
        if (fill.type === 'SOLID') {
          return {
            type: 'SOLID' as const,
            color: fill.color,
            opacity: fill.opacity || 1,
          };
        }
        return fill;
      });
    }

    // Set corner radius
    if (params.cornerRadius !== undefined) {
      frame.cornerRadius = params.cornerRadius;
    }

    // Add to parent
    if (parent && 'appendChild' in parent) {
      (parent as FrameNode).appendChild(frame);
    } else {
      figma.currentPage.appendChild(frame);
    }

    logger.info(`Created frame: ${frame.name} (${frame.id})`);

    return {
      success: true,
      result: {
        nodeId: frame.id,
        name: frame.name,
        type: frame.type,
      },
    };
  } catch (error: any) {
    logger.error('Frame creation failed:', error);
    return {
      success: false,
      error: {
        code: 'FRAME_CREATION_FAILED',
        message: error.message,
      },
    };
  }
}
```

#### src/commands/text.ts

```typescript
import { CommandResult } from './executor';
import { Logger } from '../utils/logger';
import { loadFont } from '../utils/fonts';

const logger = new Logger('Text');

export async function executeCreateText(
  params: any,
  parent: BaseNode | null
): Promise<CommandResult> {
  try {
    const text = figma.createText();

    // Load font
    const fontFamily = params.fontFamily || 'Inter';
    const fontWeight = params.fontWeight || 400;
    await loadFont(fontFamily, fontWeight);

    // Set text content
    text.characters = params.content;

    // Set position
    text.x = params.x || 0;
    text.y = params.y || 0;

    // Set font size
    text.fontSize = params.fontSize || 16;

    // Set font
    text.fontName = {
      family: fontFamily,
      style: getFontStyle(fontWeight),
    };

    // Set fills (color)
    if (params.fills && params.fills.length > 0) {
      text.fills = params.fills;
    }

    // Set alignment
    if (params.textAlignHorizontal) {
      text.textAlignHorizontal = params.textAlignHorizontal;
    }
    if (params.textAlignVertical) {
      text.textAlignVertical = params.textAlignVertical;
    }

    // Add to parent
    if (parent && 'appendChild' in parent) {
      (parent as FrameNode).appendChild(text);
    } else {
      figma.currentPage.appendChild(text);
    }

    logger.info(`Created text: "${text.characters}" (${text.id})`);

    return {
      success: true,
      result: {
        nodeId: text.id,
        name: text.name,
        type: text.type,
        content: text.characters,
      },
    };
  } catch (error: any) {
    logger.error('Text creation failed:', error);
    return {
      success: false,
      error: {
        code: 'TEXT_CREATION_FAILED',
        message: error.message,
      },
    };
  }
}

function getFontStyle(weight: number): string {
  const styles: { [key: number]: string } = {
    100: 'Thin',
    200: 'Extra Light',
    300: 'Light',
    400: 'Regular',
    500: 'Medium',
    600: 'Semi Bold',
    700: 'Bold',
    800: 'Extra Bold',
    900: 'Black',
  };
  return styles[weight] || 'Regular';
}
```

#### src/commands/rectangle.ts

```typescript
import { CommandResult } from './executor';
import { Logger } from '../utils/logger';

const logger = new Logger('Rectangle');

export async function executeCreateRectangle(
  params: any,
  parent: BaseNode | null
): Promise<CommandResult> {
  try {
    const rectangle = figma.createRectangle();

    // Set name
    rectangle.name = params.name || 'Rectangle';

    // Set size
    rectangle.resize(params.width, params.height);

    // Set position
    rectangle.x = params.x || 0;
    rectangle.y = params.y || 0;

    // Set fills
    if (params.fills && params.fills.length > 0) {
      rectangle.fills = params.fills;
    }

    // Set strokes
    if (params.strokes && params.strokes.length > 0) {
      rectangle.strokes = params.strokes;
    }

    // Set corner radius
    if (params.cornerRadius !== undefined) {
      rectangle.cornerRadius = params.cornerRadius;
    }

    // Add to parent
    if (parent && 'appendChild' in parent) {
      (parent as FrameNode).appendChild(rectangle);
    } else {
      figma.currentPage.appendChild(rectangle);
    }

    logger.info(`Created rectangle: ${rectangle.name} (${rectangle.id})`);

    return {
      success: true,
      result: {
        nodeId: rectangle.id,
        name: rectangle.name,
        type: rectangle.type,
      },
    };
  } catch (error: any) {
    logger.error('Rectangle creation failed:', error);
    return {
      success: false,
      error: {
        code: 'RECTANGLE_CREATION_FAILED',
        message: error.message,
      },
    };
  }
}
```

#### src/commands/layout.ts

```typescript
import { CommandResult } from './executor';
import { Logger } from '../utils/logger';

const logger = new Logger('Layout');

export async function executeApplyAutoLayout(
  params: any,
  targetNode: BaseNode | null
): Promise<CommandResult> {
  try {
    if (!targetNode || targetNode.type !== 'FRAME') {
      throw new Error('Target must be a frame node');
    }

    const frame = targetNode as FrameNode;

    // Set layout mode
    frame.layoutMode = params.mode || 'VERTICAL';

    // Set spacing
    if (params.itemSpacing !== undefined) {
      frame.itemSpacing = params.itemSpacing;
    }

    // Set padding
    if (params.paddingTop !== undefined) {
      frame.paddingTop = params.paddingTop;
    }
    if (params.paddingRight !== undefined) {
      frame.paddingRight = params.paddingRight;
    }
    if (params.paddingBottom !== undefined) {
      frame.paddingBottom = params.paddingBottom;
    }
    if (params.paddingLeft !== undefined) {
      frame.paddingLeft = params.paddingLeft;
    }

    // Set alignment
    if (params.primaryAxisAlignItems) {
      frame.primaryAxisAlignItems = params.primaryAxisAlignItems;
    }
    if (params.counterAxisAlignItems) {
      frame.counterAxisAlignItems = params.counterAxisAlignItems;
    }

    logger.info(`Applied auto-layout to: ${frame.name} (${frame.id})`);

    return {
      success: true,
      result: {
        nodeId: frame.id,
        name: frame.name,
        layoutMode: frame.layoutMode,
      },
    };
  } catch (error: any) {
    logger.error('Auto-layout application failed:', error);
    return {
      success: false,
      error: {
        code: 'LAYOUT_APPLICATION_FAILED',
        message: error.message,
      },
    };
  }
}
```

#### src/commands/component.ts

```typescript
import { CommandResult } from './executor';
import { Logger } from '../utils/logger';

const logger = new Logger('Component');

export async function executeCreateComponent(
  params: any,
  parent: BaseNode | null
): Promise<CommandResult> {
  try {
    // Create a frame first
    const frame = figma.createFrame();
    frame.name = params.name || 'Component';
    frame.resize(100, 100); // Default size

    // Add to parent
    if (parent && 'appendChild' in parent) {
      (parent as FrameNode).appendChild(frame);
    } else {
      figma.currentPage.appendChild(frame);
    }

    // Convert to component
    const component = figma.createComponent();
    component.name = params.name;

    if (params.description) {
      component.description = params.description;
    }

    // Copy properties from frame
    component.resize(frame.width, frame.height);
    component.x = frame.x;
    component.y = frame.y;

    // Remove the frame
    frame.remove();

    // Add component to parent
    if (parent && 'appendChild' in parent) {
      (parent as FrameNode).appendChild(component);
    } else {
      figma.currentPage.appendChild(component);
    }

    logger.info(`Created component: ${component.name} (${component.id})`);

    return {
      success: true,
      result: {
        nodeId: component.id,
        name: component.name,
        type: component.type,
        key: component.key,
      },
    };
  } catch (error: any) {
    logger.error('Component creation failed:', error);
    return {
      success: false,
      error: {
        code: 'COMPONENT_CREATION_FAILED',
        message: error.message,
      },
    };
  }
}
```

#### src/commands/styles.ts

```typescript
import { CommandResult } from './executor';
import { Logger } from '../utils/logger';

const logger = new Logger('Styles');

export async function executeApplyStyle(
  params: any,
  targetNode: BaseNode | null
): Promise<CommandResult> {
  try {
    if (!targetNode) {
      throw new Error('Target node is required');
    }

    const styleId = params.styleId;
    const styleType = params.styleType;

    // Apply style based on type
    if ('fillStyleId' in targetNode && styleType === 'FILL') {
      (targetNode as any).fillStyleId = styleId;
    } else if ('strokeStyleId' in targetNode && styleType === 'STROKE') {
      (targetNode as any).strokeStyleId = styleId;
    } else if ('textStyleId' in targetNode && styleType === 'TEXT') {
      (targetNode as any).textStyleId = styleId;
    } else if ('effectStyleId' in targetNode && styleType === 'EFFECT') {
      (targetNode as any).effectStyleId = styleId;
    } else {
      throw new Error(`Cannot apply ${styleType} style to ${targetNode.type}`);
    }

    logger.info(`Applied ${styleType} style to: ${targetNode.name}`);

    return {
      success: true,
      result: {
        nodeId: targetNode.id,
        styleId,
        styleType,
      },
    };
  } catch (error: any) {
    logger.error('Style application failed:', error);
    return {
      success: false,
      error: {
        code: 'STYLE_APPLICATION_FAILED',
        message: error.message,
      },
    };
  }
}
```

---

### Step 4: Polling & Processing

#### src/polling/processor.ts

```typescript
import { executeCommand, Command } from '../commands/executor';
import { Logger } from '../utils/logger';

const logger = new Logger('Processor');

export class CommandProcessor {
  private processedCommands: Set<string> = new Set();

  /**
   * Process pending commands from comments
   */
  async processCommands() {
    try {
      // Get all comments (simulated - actual implementation would fetch from Figma)
      const commands = await this.fetchPendingCommands();

      for (const command of commands) {
        // Skip if already processed
        if (this.processedCommands.has(command.id)) {
          continue;
        }

        // Execute command
        logger.info(`Processing command: ${command.id}`);
        const result = await executeCommand(command);

        // Post response
        await this.postResponse(command.id, result);

        // Mark as processed
        this.processedCommands.add(command.id);
      }
    } catch (error) {
      logger.error('Command processing failed:', error);
    }
  }

  /**
   * Fetch pending commands from comments
   * Note: This is simplified - actual implementation would parse Figma comments
   */
  private async fetchPendingCommands(): Promise<Command[]> {
    // In real implementation, this would:
    // 1. Get file comments via Figma Plugin API
    // 2. Filter for MCP command comments
    // 3. Parse command JSON
    // 4. Return array of commands

    return [];
  }

  /**
   * Post command response as comment
   */
  private async postResponse(commandId: string, result: any) {
    const response = {
      type: 'mcp-response',
      commandId,
      status: result.success ? 'success' : 'error',
      result: result.success ? result.result : undefined,
      error: result.success ? undefined : result.error,
      timestamp: new Date().toISOString(),
    };

    logger.info(`Response for ${commandId}: ${response.status}`);

    // In real implementation, post this as a comment reply
    // Note: Figma Plugin API doesn't support posting comments directly
    // This would need to be done via the hidden UI making API calls
  }
}
```

---

### Step 5: Utilities

#### src/utils/logger.ts

```typescript
export class Logger {
  constructor(private context: string) {}

  info(message: string, ...args: any[]) {
    console.log(`[${this.context}] INFO:`, message, ...args);
  }

  warn(message: string, ...args: any[]) {
    console.warn(`[${this.context}] WARN:`, message, ...args);
  }

  error(message: string, error?: any) {
    console.error(`[${this.context}] ERROR:`, message, error);
  }

  debug(message: string, ...args: any[]) {
    console.debug(`[${this.context}] DEBUG:`, message, ...args);
  }
}
```

#### src/utils/colors.ts

```typescript
/**
 * Convert Figma RGB to hex
 */
export function figmaColorToHex(color: RGB): string {
  const r = Math.round(color.r * 255);
  const g = Math.round(color.g * 255);
  const b = Math.round(color.b * 255);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/**
 * Convert hex to Figma RGB
 */
export function hexToFigmaColor(hex: string): RGB {
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

/**
 * Convert RGB object to Figma RGB
 */
export function rgbToFigmaColor(rgb: { r: number; g: number; b: number }): RGB {
  return {
    r: rgb.r,
    g: rgb.g,
    b: rgb.b,
  };
}
```

#### src/utils/fonts.ts

```typescript
import { Logger } from './logger';

const logger = new Logger('Fonts');

const fontCache: Set<string> = new Set();

/**
 * Load a font
 */
export async function loadFont(family: string, weight: number = 400): Promise<void> {
  const style = getFontStyle(weight);
  const fontName: FontName = { family, style };
  const key = `${family}-${style}`;

  // Check cache
  if (fontCache.has(key)) {
    return;
  }

  try {
    await figma.loadFontAsync(fontName);
    fontCache.add(key);
    logger.info(`Loaded font: ${family} ${style}`);
  } catch (error) {
    logger.error(`Failed to load font: ${family} ${style}`, error);
    // Fallback to Inter Regular
    await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
  }
}

function getFontStyle(weight: number): string {
  const styles: { [key: number]: string } = {
    100: 'Thin',
    200: 'Extra Light',
    300: 'Light',
    400: 'Regular',
    500: 'Medium',
    600: 'Semi Bold',
    700: 'Bold',
    800: 'Extra Bold',
    900: 'Black',
  };
  return styles[weight] || 'Regular';
}
```

---

## 🤖 Claude Code Prompts

### Initialize Plugin Project
```
Set up the Figma plugin project following PHASE_3.md:

1. Create directory structure
2. Initialize package.json with @figma/plugin-typings
3. Create manifest.json with network access settings
4. Configure TypeScript for Figma plugin
5. Create basic src/code.ts with plugin initialization
6. Create minimal src/ui.html

Follow the exact structure and configuration shown in the documentation.
```

### Implement Command Executors
```
Implement all command executors in src/commands/ following PHASE_3.md:

1. Create executor.ts with command routing
2. Implement frame.ts for frame creation
3. Implement text.ts with font loading
4. Implement rectangle.ts for shapes
5. Implement layout.ts for auto-layout
6. Implement component.ts for components
7. Implement styles.ts for style application

Each executor should:
- Validate inputs
- Handle the Figma Plugin API properly
- Return standardized CommandResult
- Include error handling
- Log operations
```

### Implement Polling System
```
Implement the command polling and processing system in src/polling/ as specified in PHASE_3.md:

Create CommandProcessor class that:
- Polls for commands from comments
- Tracks processed commands
- Executes commands via executor
- Posts responses back as comments
- Handles errors gracefully

Note: Comment fetching/posting will need special implementation since Figma Plugin API has limitations here.
```

---

## ✅ Phase 3 Completion Checklist

### Setup
- [ ] Plugin project initialized
- [ ] Manifest configured
- [ ] TypeScript configured
- [ ] Dependencies installed

### Core Plugin
- [ ] Plugin initialization
- [ ] Polling system running
- [ ] Hidden UI created

### Command Executors
- [ ] Frame creation
- [ ] Text creation
- [ ] Rectangle creation
- [ ] Auto-layout application
- [ ] Component creation
- [ ] Style application

### Processing
- [ ] Command processor
- [ ] Command routing
- [ ] Response posting

### Utilities
- [ ] Logger implemented
- [ ] Color utilities
- [ ] Font loading

### Testing
- [ ] Plugin installs in Figma
- [ ] Commands execute correctly
- [ ] Error handling works
- [ ] Responses post correctly

---

## 🎯 Success Criteria

**Phase 3 is complete when:**

1. ✅ Plugin runs in Figma desktop app
2. ✅ All command executors work
3. ✅ Commands create/modify nodes correctly
4. ✅ Error handling is robust
5. ✅ Ready for end-to-end testing with MCP server

---

## 🐛 Known Plugin Limitations

- Figma Plugin API cannot post comments directly
- Network access is restricted
- Must use hidden UI for API calls
- Font loading is asynchronous

---

## 📚 Next Steps

Complete **PHASE_4.md** for enhanced features and optimizations!
