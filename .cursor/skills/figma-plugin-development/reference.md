# Figma Plugin API Reference

Detailed reference for Figma Plugin API operations. See [SKILL.md](SKILL.md) for quick start and common patterns.

## Global Object: figma

### Core Properties

- `figma.currentPage: PageNode` - Active page (read/write)
- `figma.root: DocumentNode` - Document root (read-only)
- `figma.command: string` - Current command from manifest
- `figma.pluginId: string | undefined` - Plugin ID
- `figma.editorType: 'figma' | 'figjam' | 'dev' | 'slides' | 'buzz'` - Editor context

### Node Creation Methods

```typescript
// Basic shapes
figma.createRectangle(): RectangleNode
figma.createEllipse(): EllipseNode
figma.createLine(): LineNode
figma.createPolygon(): PolygonNode
figma.createStar(): StarNode
figma.createVector(): VectorNode

// Containers
figma.createFrame(): FrameNode
figma.createComponent(): ComponentNode
figma.createPage(): PageNode

// Text
figma.createText(): TextNode
figma.createTextPath(vector: VectorNode, ...): TextPathNode

// Special
figma.createSlice(): SliceNode
figma.createGroup(nodes: BaseNode[], parent, index?): GroupNode
```

### Node Access

```typescript
// Async (preferred)
figma.getNodeByIdAsync(id: string): Promise<BaseNode | null>

// Sync (deprecated, throws with dynamic-page)
figma.getNodeById(id: string): BaseNode | null
```

## Node Types

### FrameNode

Container for other nodes. Supports auto layout.

```typescript
interface FrameNode extends SceneNode, ChildrenMixin, BlendMixin {
  type: "FRAME";

  // Layout
  layoutMode: "NONE" | "HORIZONTAL" | "VERTICAL";
  primaryAxisSizingMode: "FIXED" | "AUTO";
  counterAxisSizingMode: "FIXED" | "AUTO";
  primaryAxisAlignItems: "MIN" | "CENTER" | "MAX" | "SPACE_BETWEEN";
  counterAxisAlignItems: "MIN" | "CENTER" | "MAX" | "BASELINE";
  paddingLeft: number;
  paddingRight: number;
  paddingTop: number;
  paddingBottom: number;
  itemSpacing: number;

  // Clipping
  clipsContent: boolean;

  // Grid
  gridStyleId: string;
  layoutGrids: ReadonlyArray<LayoutGrid>;
}
```

### TextNode

Text content. Requires font loading before modification.

```typescript
interface TextNode extends SceneNode, BlendMixin {
  type: "TEXT";

  // Content
  characters: string;
  fontSize: number;
  fontName: FontName;
  textStyleId: string;

  // Alignment
  textAlignHorizontal: "LEFT" | "CENTER" | "RIGHT" | "JUSTIFIED";
  textAlignVertical: "TOP" | "CENTER" | "BOTTOM";

  // Spacing
  lineHeight: LineHeight;
  letterSpacing: LetterSpacing;
  paragraphSpacing: number;
  paragraphIndent: number;

  // Styling
  textCase: "ORIGINAL" | "UPPER" | "LOWER" | "TITLE";
  textDecoration: "NONE" | "UNDERLINE" | "STRIKETHROUGH";
  fills: ReadonlyArray<Paint>;
}
```

### RectangleNode

Rectangle shape.

```typescript
interface RectangleNode extends GeometryMixin, BlendMixin {
  type: "RECTANGLE";

  // Geometry
  fills: ReadonlyArray<Paint>;
  strokes: ReadonlyArray<Paint>;
  strokeWeight: number;
  cornerRadius: number;
  topLeftRadius: number;
  topRightRadius: number;
  bottomLeftRadius: number;
  bottomRightRadius: number;
}
```

### ComponentNode

Reusable component definition.

```typescript
interface ComponentNode extends FrameNode {
  type: "COMPONENT";

  // Component properties
  description: string;
  key: string;

  // Variants (if part of component set)
  variantProperties: { [property: string]: string } | null;
}
```

### InstanceNode

Instance of a component.

```typescript
interface InstanceNode extends FrameNode {
  type: "INSTANCE";

  // Source component
  mainComponent: ComponentNode;

  // Overrides
  componentProperties: { [nodeId: string]: InstanceSwapPreferredValue };

  // Variant properties
  variantProperties: { [property: string]: string } | null;
}
```

## Shared Node Properties

### ChildrenMixin

Nodes that can contain children (Frame, Page, Component, Group, etc.).

```typescript
interface ChildrenMixin {
  children: ReadonlyArray<SceneNode>;

  appendChild(child: SceneNode): void;
  insertChild(index: number, child: SceneNode): void;
  removeChild(child: SceneNode): void;
  findChild(callback: (node: SceneNode) => boolean): SceneNode | null;
  findAll(callback: (node: SceneNode) => boolean): SceneNode[];
  findOne(callback: (node: SceneNode) => boolean): SceneNode | null;
}
```

### BlendMixin

All scene nodes support blending.

```typescript
interface BlendMixin {
  opacity: number;
  blendMode: BlendMode;
  isMask: boolean;
  effects: ReadonlyArray<Effect>;
  effectStyleId: string;
  visible: boolean;
}
```

### GeometryMixin

Shape nodes (Rectangle, Ellipse, Vector, etc.).

```typescript
interface GeometryMixin {
  fills: ReadonlyArray<Paint>;
  strokes: ReadonlyArray<Paint>;
  strokeWeight: number;
  strokeAlign: "CENTER" | "INSIDE" | "OUTSIDE";
  strokeCap: "NONE" | "ROUND" | "SQUARE";
  strokeJoin: "MITER" | "BEVEL" | "ROUND";
  dashPattern: ReadonlyArray<number>;
  fillGeometry: VectorPath[];
  strokeGeometry: VectorPath[];
  strokeMiterAngle: number;
}
```

### LayoutMixin

Positioning and sizing.

```typescript
interface LayoutMixin {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;

  resize(width: number, height: number): void;
  resizeWithoutConstraints(width: number, height: number): void;
}
```

## Paint Types

### Solid Paint

```typescript
{
  type: "SOLID"
  color: RGB
  opacity?: number
}
```

### Gradient Paints

```typescript
// Linear gradient
{
  type: "GRADIENT_LINEAR";
  gradientStops: ReadonlyArray<ColorStop>;
  gradientTransform: Transform;
}

// Radial gradient
{
  type: "GRADIENT_RADIAL";
  gradientStops: ReadonlyArray<ColorStop>;
  gradientTransform: Transform;
}

// Angular gradient
{
  type: "GRADIENT_ANGULAR";
  gradientStops: ReadonlyArray<ColorStop>;
  gradientTransform: Transform;
}

// Diamond gradient
{
  type: "GRADIENT_DIAMOND";
  gradientStops: ReadonlyArray<ColorStop>;
  gradientTransform: Transform;
}
```

### Image Paint

```typescript
{
  type: "IMAGE"
  scaleMode: "FILL" | "FIT" | "CROP" | "TILE"
  imageHash: string
  imageTransform?: Transform
  scalingFactor?: number
  rotation?: number
  opacity?: number
}
```

## Effect Types

### Drop Shadow

```typescript
{
  type: "DROP_SHADOW"
  color: RGBA
  offset: { x: number, y: number }
  radius: number
  spread?: number
  visible: boolean
  blendMode: BlendMode
}
```

### Inner Shadow

```typescript
{
  type: "INNER_SHADOW"
  color: RGBA
  offset: { x: number, y: number }
  radius: number
  spread?: number
  visible: boolean
  blendMode: BlendMode
}
```

### Layer Blur

```typescript
{
  type: "LAYER_BLUR";
  radius: number;
  visible: boolean;
}
```

### Background Blur

```typescript
{
  type: "BACKGROUND_BLUR";
  radius: number;
  visible: boolean;
}
```

## Styles API

### Creating Styles

```typescript
// Paint style
const paintStyle = figma.createPaintStyle();
paintStyle.name = "Primary";
paintStyle.paints = [{ type: "SOLID", color: { r: 0.2, g: 0.4, b: 0.8 } }];

// Text style
const textStyle = figma.createTextStyle();
textStyle.name = "Heading";
await figma.loadFontAsync({ family: "Inter", style: "Bold" });
textStyle.fontName = { family: "Inter", style: "Bold" };
textStyle.fontSize = 32;

// Effect style
const effectStyle = figma.createEffectStyle();
effectStyle.name = "Shadow";
effectStyle.effects = [{ type: "DROP_SHADOW", ... }];

// Grid style
const gridStyle = figma.createGridStyle();
gridStyle.name = "8px Grid";
gridStyle.layoutGrids = [{ pattern: "COLUMNS", sectionSize: 8 }];
```

### Getting Styles

```typescript
// Get by ID (async)
const style = await figma.getStyleByIdAsync(styleId);

// Get local styles (async)
const paintStyles = await figma.getLocalPaintStylesAsync();
const textStyles = await figma.getLocalTextStylesAsync();
const effectStyles = await figma.getLocalEffectStylesAsync();
const gridStyles = await figma.getLocalGridStylesAsync();
```

## Font API

### List Available Fonts

```typescript
const fonts = await figma.listAvailableFontsAsync();
// Returns: Array<{ family: string, style: string }>
```

### Load Font

```typescript
await figma.loadFontAsync({ family: "Inter", style: "Regular" });
```

**Critical**: Must load font before:

- Setting `text.characters`
- Changing `text.fontSize`
- Changing `text.fontName`
- Any text property that affects rendering

### Check Missing Fonts

```typescript
if (figma.hasMissingFont) {
  figma.notify("Document contains missing fonts", { error: true });
}
```

## Image API

### Create Image from Bytes

```typescript
const imageBytes = new Uint8Array([...]); // PNG/JPEG bytes
const image = figma.createImage(imageBytes);
```

### Create Image from URL

```typescript
const image = await figma.createImageAsync("https://example.com/image.png");
```

### Get Image by Hash

```typescript
const image = figma.getImageByHash(hash);
```

### Use Image as Fill

```typescript
const image = await figma.createImageAsync(url);
node.fills = [
  {
    type: "IMAGE",
    scaleMode: "FILL",
    imageHash: image.hash,
  },
];
```

## Events

### Selection Changed

```typescript
figma.on("selectionchange", () => {
  const selection = figma.currentPage.selection;
  console.log("Selection:", selection);
});
```

### Current Page Changed

```typescript
figma.on("currentpagechange", () => {
  console.log("Page changed:", figma.currentPage.name);
});
```

### Document Changed

```typescript
figma.on("documentchange", (event) => {
  console.log("Document changed:", event);
});
```

### Close Plugin

```typescript
figma.on("close", () => {
  console.log("Plugin closing");
});
```

## UI Communication

### Show UI

```typescript
figma.showUI(
  `
  <html>
    <body>
      <button id="create">Create Frame</button>
      <script>
        document.getElementById("create").onclick = () => {
          parent.postMessage({ type: "create-frame" }, "*");
        };
      </script>
    </body>
  </html>
`,
  { width: 300, height: 200 },
);
```

### Send Message to UI

```typescript
figma.ui.postMessage({ type: "data", payload: data });
```

### Receive Message from UI

```typescript
figma.ui.onmessage = (msg) => {
  if (msg.type === "create-frame") {
    const frame = figma.createFrame();
    figma.currentPage.appendChild(frame);
    figma.ui.postMessage({ type: "success" });
  }
};
```

## Utilities

### Base64 Encoding

```typescript
const encoded = figma.base64Encode(uint8Array);
const decoded = figma.base64Decode(encoded);
```

### Notifications

```typescript
figma.notify("Operation completed");
figma.notify("Error occurred", { error: true });
figma.notify("Processing...", { timeout: 2000 });
```

### Open External URL

```typescript
figma.openExternal("https://example.com");
```

## Type Guards

```typescript
function isFrame(node: BaseNode | null): node is FrameNode {
  return node !== null && node.type === "FRAME";
}

function isText(node: BaseNode | null): node is TextNode {
  return node !== null && node.type === "TEXT";
}

function isComponent(node: BaseNode | null): node is ComponentNode {
  return node !== null && node.type === "COMPONENT";
}

function isInstance(node: BaseNode | null): node is InstanceNode {
  return node !== null && node.type === "INSTANCE";
}
```

## Error Patterns

### Node Not Found

```typescript
const node = await figma.getNodeByIdAsync(id);
if (node === null) {
  throw new Error(`Node ${id} not found`);
}
```

### Font Not Available

```typescript
try {
  await figma.loadFontAsync({ family: "CustomFont", style: "Regular" });
} catch (error) {
  // Fallback to system font
  await figma.loadFontAsync({ family: "Inter", style: "Regular" });
}
```

### Invalid Operation

```typescript
if (node.type !== "FRAME") {
  throw new Error("Operation only valid for frames");
}
```

## Performance Tips

1. **Use `skipInvisibleInstanceChildren`** for faster traversal:

   ```typescript
   figma.skipInvisibleInstanceChildren = true;
   ```

2. **Batch operations** when possible:

   ```typescript
   // Load all fonts first
   const fonts = await figma.listAvailableFontsAsync();
   await Promise.all(fonts.map((f) => figma.loadFontAsync(f)));
   ```

3. **Use `findAll` with specific criteria** instead of manual traversal:

   ```typescript
   // Fast
   const frames = figma.currentPage.findAll((n) => n.type === "FRAME");

   // Slower
   function findFrames(node: BaseNode): FrameNode[] {
     // Manual traversal
   }
   ```

4. **Commit undo history** for large operations:
   ```typescript
   // After batch of changes
   figma.commitUndo();
   ```
