---
name: figma-plugin-development
description: Provides patterns and best practices for Figma Plugin API integration. Use when implementing Figma API calls, handling Figma-specific errors, working with Figma node structures, creating or modifying design elements, or developing Figma plugins.
---

# Figma Plugin Development

## Quick Start

The Figma Plugin API is accessed through the global `figma` object. All operations run in a plugin context with access to the current document.

```typescript
// Access current page and document
const currentPage = figma.currentPage;
const root = figma.root; // DocumentNode

// Create nodes
const frame = figma.createFrame();
frame.name = "My Frame";
frame.resize(400, 300);

// Always close the plugin when done
figma.closePlugin();
```

## Core API Patterns

### Global Objects

- `figma` - Main API object (always available)
- `figma.currentPage` - Currently active page (read/write)
- `figma.root` - Document root (read-only)
- `figma.ui` - UI communication API
- `figma.util` - Utility functions

### Node Access

```typescript
// Get node by ID (async - preferred)
const node = await figma.getNodeByIdAsync("123:456");

// Get node by ID (sync - deprecated, throws if dynamic-page)
const node = figma.getNodeById("123:456");

// Always check for null
if (node === null) {
  figma.notify("Node not found");
  return;
}
```

### Node Types

Common node types:
- `FRAME` - Container for other nodes
- `TEXT` - Text content
- `RECTANGLE` - Rectangle shape
- `COMPONENT` - Reusable component
- `INSTANCE` - Component instance
- `GROUP` - Group of nodes

Check node type:
```typescript
if (node.type === "FRAME") {
  const frame = node as FrameNode;
  // Frame-specific operations
}
```

## Creating Nodes

### Frames

```typescript
const frame = figma.createFrame();
frame.name = "Container";
frame.resize(800, 600);
frame.x = 100;
frame.y = 100;

// Add to current page
figma.currentPage.appendChild(frame);
```

### Text Nodes

**Critical**: Always load fonts before modifying text properties.

```typescript
// Load font first
await figma.loadFontAsync({ family: "Inter", style: "Regular" });

// Create text
const text = figma.createText();
text.characters = "Hello, Figma!";
text.fontSize = 24;
text.fontName = { family: "Inter", style: "Regular" };

// Add to frame
frame.appendChild(text);
```

### Shapes

```typescript
// Rectangle
const rect = figma.createRectangle();
rect.resize(200, 100);
rect.fills = [{ type: "SOLID", color: { r: 1, g: 0, b: 0 } }];

// Ellipse
const ellipse = figma.createEllipse();
ellipse.resize(150, 150);

// Line
const line = figma.createLine();
line.resize(200, 0);
```

### Components

```typescript
// Create from existing node
const component = figma.createComponentFromNode(frame);

// Or create empty
const component = figma.createComponent();
component.name = "Button";
```

## Node Manipulation

### Hierarchy

```typescript
// Append child
parent.appendChild(child);

// Insert at index
parent.insertChild(0, child);

// Remove child
parent.removeChild(child);

// Move to different parent
newParent.appendChild(child);
```

### Properties

```typescript
// Position and size
node.x = 100;
node.y = 200;
node.resize(300, 400);

// Visibility
node.visible = true;
node.opacity = 0.5;

// Name
node.name = "My Node";
```

### Fills and Strokes

```typescript
// Solid color fill
node.fills = [{
  type: "SOLID",
  color: { r: 0.2, g: 0.4, b: 0.8 }
}];

// Gradient fill
node.fills = [{
  type: "GRADIENT_LINEAR",
  gradientStops: [
    { position: 0, color: { r: 1, g: 0, b: 0, a: 1 } },
    { position: 1, color: { r: 0, g: 0, b: 1, a: 1 } }
  ]
}];

// Stroke
node.strokes = [{
  type: "SOLID",
  color: { r: 0, g: 0, b: 0 }
}];
node.strokeWeight = 2;
```

## Auto Layout

```typescript
if (node.type === "FRAME") {
  const frame = node as FrameNode;
  
  // Enable auto layout
  frame.layoutMode = "VERTICAL"; // or "HORIZONTAL"
  frame.primaryAxisSizingMode = "AUTO"; // or "FIXED"
  frame.counterAxisSizingMode = "AUTO"; // or "FIXED"
  
  // Spacing
  frame.itemSpacing = 16;
  frame.paddingLeft = 24;
  frame.paddingRight = 24;
  frame.paddingTop = 24;
  frame.paddingBottom = 24;
}
```

## Error Handling

### Common Errors

```typescript
try {
  const node = await figma.getNodeByIdAsync(nodeId);
  if (node === null) {
    throw new Error(`Node ${nodeId} not found`);
  }
  // Use node
} catch (error) {
  figma.notify(`Error: ${error.message}`, { error: true });
  console.error(error);
}
```

### Font Loading Errors

```typescript
try {
  await figma.loadFontAsync({ family: "Inter", style: "Regular" });
} catch (error) {
  // Font not available, use fallback
  await figma.loadFontAsync({ family: "Roboto", style: "Regular" });
}
```

### Validation Patterns

```typescript
// Validate node type before operations
function isFrame(node: BaseNode | null): node is FrameNode {
  return node !== null && node.type === "FRAME";
}

const node = await figma.getNodeByIdAsync(id);
if (!isFrame(node)) {
  figma.notify("Node is not a frame", { error: true });
  return;
}

// Safe to use as FrameNode
node.layoutMode = "VERTICAL";
```

## Working with Text

### Font Loading

**Always load fonts before:**
- Setting `characters`
- Changing `fontSize`
- Changing `fontName`
- Any property that affects text rendering

```typescript
// List available fonts
const fonts = await figma.listAvailableFontsAsync();

// Load specific font
await figma.loadFontAsync({ family: "Inter", style: "Bold" });

// Load from existing text node
const existingText = figma.currentPage.findOne(n => n.type === "TEXT") as TextNode;
if (existingText) {
  await figma.loadFontAsync(existingText.fontName);
}
```

### Text Properties

```typescript
const text = figma.createText();
await figma.loadFontAsync({ family: "Inter", style: "Regular" });

text.characters = "Hello, World!";
text.fontSize = 16;
text.fontName = { family: "Inter", style: "Regular" };
text.textAlignHorizontal = "CENTER";
text.textAlignVertical = "CENTER";
text.lineHeight = { value: 24, unit: "PIXELS" };
```

## Styles

### Creating Styles

```typescript
// Paint style (color)
const paintStyle = figma.createPaintStyle();
paintStyle.name = "Primary Color";
paintStyle.paints = [{ type: "SOLID", color: { r: 0.2, g: 0.4, b: 0.8 } }];

// Text style
const textStyle = figma.createTextStyle();
textStyle.name = "Heading";
await figma.loadFontAsync({ family: "Inter", style: "Bold" });
textStyle.fontName = { family: "Inter", style: "Bold" };
textStyle.fontSize = 32;

// Effect style
const effectStyle = figma.createEffectStyle();
effectStyle.name = "Card Shadow";
effectStyle.effects = [{
  type: "DROP_SHADOW",
  color: { r: 0, g: 0, b: 0, a: 0.2 },
  offset: { x: 0, y: 4 },
  radius: 8
}];
```

### Applying Styles

```typescript
// Apply paint style
node.fills = paintStyle.paints;

// Apply text style
if (node.type === "TEXT") {
  const text = node as TextNode;
  text.textStyleId = textStyle.id;
}

// Apply effect style
node.effects = effectStyle.effects;
```

### Getting Local Styles

```typescript
// Get all local styles (async - preferred)
const paintStyles = await figma.getLocalPaintStylesAsync();
const textStyles = await figma.getLocalTextStylesAsync();
const effectStyles = await figma.getLocalEffectStylesAsync();

// Find style by name
const primaryColor = paintStyles.find(s => s.name === "Primary Color");
```

## Async Operations

Many Figma API methods are async. Always use `await`:

```typescript
// ✅ Correct
const node = await figma.getNodeByIdAsync(id);
const styles = await figma.getLocalPaintStylesAsync();

// ❌ Wrong (deprecated sync methods throw errors with dynamic-page)
const node = figma.getNodeById(id); // May throw
```

## Document Traversal

### Finding Nodes

```typescript
// Find all nodes matching criteria
const frames = figma.currentPage.findAll(node => node.type === "FRAME");

// Find first matching node
const button = figma.currentPage.findOne(node => 
  node.type === "FRAME" && node.name === "Button"
);

// Traverse children
function traverse(node: BaseNode) {
  console.log(node.name, node.type);
  if ("children" in node) {
    node.children.forEach(child => traverse(child));
  }
}

traverse(figma.currentPage);
```

## Best Practices

### 1. Always Close Plugin

```typescript
// At the end of plugin execution
figma.closePlugin("Operation completed");
```

### 2. Load Fonts Before Text Operations

```typescript
// ❌ Wrong
const text = figma.createText();
text.characters = "Hello"; // Error: font not loaded

// ✅ Correct
await figma.loadFontAsync({ family: "Inter", style: "Regular" });
const text = figma.createText();
text.characters = "Hello";
```

### 3. Use Async Methods

```typescript
// ✅ Preferred
const node = await figma.getNodeByIdAsync(id);

// ❌ Deprecated (throws with dynamic-page)
const node = figma.getNodeById(id);
```

### 4. Check for Null

```typescript
const node = await figma.getNodeByIdAsync(id);
if (node === null) {
  figma.notify("Node not found", { error: true });
  return;
}
```

### 5. Type Guards

```typescript
function isFrame(node: BaseNode | null): node is FrameNode {
  return node !== null && node.type === "FRAME";
}

const node = await figma.getNodeByIdAsync(id);
if (isFrame(node)) {
  // TypeScript knows node is FrameNode
  node.layoutMode = "VERTICAL";
}
```

### 6. Error Handling

```typescript
try {
  // Plugin operations
} catch (error) {
  figma.notify(`Error: ${error.message}`, { error: true });
  console.error(error);
} finally {
  figma.closePlugin();
}
```

### 7. Notifications

```typescript
// Success
figma.notify("Operation completed");

// Error
figma.notify("Operation failed", { error: true });

// With timeout
figma.notify("Processing...", { timeout: 2000 });
```

## Common Patterns

### Create Frame with Auto Layout

```typescript
async function createAutoLayoutFrame(name: string, direction: "HORIZONTAL" | "VERTICAL") {
  const frame = figma.createFrame();
  frame.name = name;
  frame.layoutMode = direction;
  frame.primaryAxisSizingMode = "AUTO";
  frame.counterAxisSizingMode = "AUTO";
  frame.itemSpacing = 16;
  frame.paddingLeft = 24;
  frame.paddingRight = 24;
  frame.paddingTop = 24;
  frame.paddingBottom = 24;
  return frame;
}
```

### Create Text with Style

```typescript
async function createStyledText(
  content: string,
  fontSize: number,
  fontFamily: string = "Inter",
  fontStyle: string = "Regular"
) {
  await figma.loadFontAsync({ family: fontFamily, style: fontStyle });
  const text = figma.createText();
  text.characters = content;
  text.fontSize = fontSize;
  text.fontName = { family: fontFamily, style: fontStyle };
  return text;
}
```

### Apply Color from Hex

```typescript
function hexToRgb(hex: string): RGB {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16) / 255,
    g: parseInt(result[2], 16) / 255,
    b: parseInt(result[3], 16) / 255
  } : { r: 0, g: 0, b: 0 };
}

// Usage
node.fills = [{ type: "SOLID", color: hexToRgb("#FF5733") }];
```

## TypeScript Setup

Install typings:

```bash
npm install --save-dev @figma/plugin-typings
```

In `tsconfig.json`:

```json
{
  "compilerOptions": {
    "types": ["@figma/plugin-typings"]
  }
}
```

## Additional Resources

- [Figma Plugin API Reference](https://developers.figma.com/docs/plugins/api/api-reference/)
- [Working with Text](https://developers.figma.com/docs/plugins/working-with-text/)
- [Working with Images](https://developers.figma.com/docs/plugins/working-with-images/)
- [Plugin Manifest](https://developers.figma.com/docs/plugins/manifest/)
