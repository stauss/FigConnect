# Figma Plugin Development Examples

Practical examples for common Figma plugin operations. See [SKILL.md](SKILL.md) for patterns and [reference.md](reference.md) for API details.

## Example 1: Create Button Component

```typescript
async function createButton(
  text: string,
  width: number = 120,
  height: number = 40,
) {
  // Load font
  await figma.loadFontAsync({ family: "Inter", style: "Regular" });

  // Create frame (button container)
  const button = figma.createFrame();
  button.name = "Button";
  button.resize(width, height);
  button.fills = [{ type: "SOLID", color: { r: 0.2, g: 0.4, b: 0.8 } }];
  button.cornerRadius = 8;

  // Create text
  const textNode = figma.createText();
  textNode.characters = text;
  textNode.fontSize = 14;
  textNode.fontName = { family: "Inter", style: "Regular" };
  textNode.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
  textNode.textAlignHorizontal = "CENTER";
  textNode.textAlignVertical = "CENTER";

  // Center text in button
  textNode.x = (width - textNode.width) / 2;
  textNode.y = (height - textNode.height) / 2;

  button.appendChild(textNode);

  // Add to page
  figma.currentPage.appendChild(button);

  return button;
}

// Usage
const btn = await createButton("Click Me", 150, 50);
btn.x = 100;
btn.y = 100;
```

## Example 2: Create Card with Auto Layout

```typescript
async function createCard(title: string, description: string) {
  // Load fonts
  await figma.loadFontAsync({ family: "Inter", style: "Bold" });
  await figma.loadFontAsync({ family: "Inter", style: "Regular" });

  // Create card frame with auto layout
  const card = figma.createFrame();
  card.name = "Card";
  card.layoutMode = "VERTICAL";
  card.primaryAxisSizingMode = "AUTO";
  card.counterAxisSizingMode = "FIXED";
  card.counterAxisAlignItems = "STRETCH";
  card.itemSpacing = 12;
  card.paddingLeft = 24;
  card.paddingRight = 24;
  card.paddingTop = 24;
  card.paddingBottom = 24;
  card.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
  card.strokes = [{ type: "SOLID", color: { r: 0.9, g: 0.9, b: 0.9 } }];
  card.strokeWeight = 1;
  card.cornerRadius = 12;
  card.effects = [
    {
      type: "DROP_SHADOW",
      color: { r: 0, g: 0, b: 0, a: 0.1 },
      offset: { x: 0, y: 4 },
      radius: 8,
    },
  ];

  // Title
  const titleText = figma.createText();
  titleText.characters = title;
  titleText.fontSize = 20;
  titleText.fontName = { family: "Inter", style: "Bold" };
  titleText.fills = [{ type: "SOLID", color: { r: 0.1, g: 0.1, b: 0.1 } }];
  card.appendChild(titleText);

  // Description
  const descText = figma.createText();
  descText.characters = description;
  descText.fontSize = 14;
  descText.fontName = { family: "Inter", style: "Regular" };
  descText.fills = [{ type: "SOLID", color: { r: 0.5, g: 0.5, b: 0.5 } }];
  card.appendChild(descText);

  figma.currentPage.appendChild(card);
  return card;
}

// Usage
const card = await createCard("Welcome", "This is a sample card component");
card.x = 50;
card.y = 50;
```

## Example 3: Duplicate and Modify Nodes

```typescript
async function duplicateAndStyle(node: SceneNode, count: number) {
  const duplicates: SceneNode[] = [];

  for (let i = 0; i < count; i++) {
    // Clone node
    const duplicate = node.clone();

    // Position
    duplicate.x = node.x + (node.width + 20) * (i + 1);
    duplicate.y = node.y;

    // Modify properties
    if (duplicate.type === "FRAME") {
      const frame = duplicate as FrameNode;
      // Change color based on index
      const hue = (i * 360) / count;
      frame.fills = [
        {
          type: "SOLID",
          color: hslToRgb(hue, 0.7, 0.5),
        },
      ];
    }

    duplicates.push(duplicate);
  }

  return duplicates;
}

function hslToRgb(h: number, s: number, l: number): RGB {
  // HSL to RGB conversion
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;

  let r = 0,
    g = 0,
    b = 0;
  if (h < 60) {
    r = c;
    g = x;
  } else if (h < 120) {
    r = x;
    g = c;
  } else if (h < 180) {
    g = c;
    b = x;
  } else if (h < 240) {
    g = x;
    b = c;
  } else if (h < 300) {
    r = x;
    b = c;
  } else {
    r = c;
    b = x;
  }

  return {
    r: r + m,
    g: g + m,
    b: b + m,
  };
}
```

## Example 4: Search and Replace Text

```typescript
async function replaceTextInSelection(search: string, replace: string) {
  const selection = figma.currentPage.selection;

  if (selection.length === 0) {
    figma.notify("No selection", { error: true });
    return;
  }

  let replaced = 0;

  for (const node of selection) {
    if (node.type === "TEXT") {
      const text = node as TextNode;

      // Load font if needed
      if (text.fontName) {
        await figma.loadFontAsync(text.fontName);
      }

      // Replace text
      if (text.characters.includes(search)) {
        text.characters = text.characters.replace(
          new RegExp(search, "g"),
          replace,
        );
        replaced++;
      }
    }

    // Recursively check children
    if ("children" in node) {
      await replaceTextInNode(node, search, replace);
    }
  }

  figma.notify(`Replaced ${replaced} instances`);
}

async function replaceTextInNode(
  node: SceneNode,
  search: string,
  replace: string,
) {
  if (node.type === "TEXT") {
    const text = node as TextNode;
    if (text.fontName) {
      await figma.loadFontAsync(text.fontName);
    }
    if (text.characters.includes(search)) {
      text.characters = text.characters.replace(
        new RegExp(search, "g"),
        replace,
      );
    }
  }

  if ("children" in node) {
    for (const child of node.children) {
      await replaceTextInNode(child, search, replace);
    }
  }
}
```

## Example 5: Create Component Set with Variants

```typescript
async function createButtonVariants() {
  await figma.loadFontAsync({ family: "Inter", style: "Regular" });

  const variants: ComponentNode[] = [];

  // Primary button
  const primary = figma.createComponent();
  primary.name = "Button/Primary";
  primary.resize(120, 40);
  primary.fills = [{ type: "SOLID", color: { r: 0.2, g: 0.4, b: 0.8 } }];
  primary.cornerRadius = 8;

  const primaryText = figma.createText();
  primaryText.characters = "Button";
  primaryText.fontSize = 14;
  primaryText.fontName = { family: "Inter", style: "Regular" };
  primaryText.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
  primaryText.textAlignHorizontal = "CENTER";
  primaryText.textAlignVertical = "CENTER";
  primaryText.x = (primary.width - primaryText.width) / 2;
  primaryText.y = (primary.height - primaryText.height) / 2;
  primary.appendChild(primaryText);

  variants.push(primary);

  // Secondary button
  const secondary = primary.clone() as ComponentNode;
  secondary.name = "Button/Secondary";
  secondary.fills = [{ type: "SOLID", color: { r: 0.9, g: 0.9, b: 0.9 } }];
  const secondaryText = secondary.children[0] as TextNode;
  await figma.loadFontAsync(secondaryText.fontName);
  secondaryText.fills = [{ type: "SOLID", color: { r: 0.2, g: 0.2, b: 0.2 } }];
  variants.push(secondary);

  // Combine into component set
  const componentSet = figma.combineAsVariants(variants, figma.currentPage);
  componentSet.name = "Button";

  return componentSet;
}
```

## Example 6: Apply Design System Colors

```typescript
async function applyDesignSystemColors() {
  // Get or create design system colors
  const colors = {
    primary: { r: 0.2, g: 0.4, b: 0.8 },
    secondary: { r: 0.6, g: 0.8, b: 0.4 },
    accent: { r: 0.9, g: 0.3, b: 0.2 },
    background: { r: 1, g: 1, b: 1 },
    text: { r: 0.1, g: 0.1, b: 0.1 },
  };

  // Find all frames
  const frames = figma.currentPage.findAll(
    (n) => n.type === "FRAME",
  ) as FrameNode[];

  for (const frame of frames) {
    // Apply based on name pattern
    if (frame.name.includes("Primary")) {
      frame.fills = [{ type: "SOLID", color: colors.primary }];
    } else if (frame.name.includes("Secondary")) {
      frame.fills = [{ type: "SOLID", color: colors.secondary }];
    } else if (frame.name.includes("Background")) {
      frame.fills = [{ type: "SOLID", color: colors.background }];
    }
  }

  // Apply text colors
  const textNodes = figma.currentPage.findAll(
    (n) => n.type === "TEXT",
  ) as TextNode[];
  for (const text of textNodes) {
    if (text.fontName) {
      await figma.loadFontAsync(text.fontName);
    }
    text.fills = [{ type: "SOLID", color: colors.text }];
  }

  figma.notify("Design system colors applied");
}
```

## Example 7: Export Selection as Images

```typescript
async function exportSelectionAsImages(format: "PNG" | "JPG" | "SVG" = "PNG") {
  const selection = figma.currentPage.selection;

  if (selection.length === 0) {
    figma.notify("No selection", { error: true });
    return;
  }

  // Note: Actual export requires REST API or plugin UI
  // This example shows how to prepare nodes for export

  const exportData = selection.map((node) => ({
    id: node.id,
    name: node.name,
    format: format,
    scale: 2, // 2x for retina
  }));

  figma.notify(`Prepared ${exportData.length} nodes for export`);

  // In real implementation, you would:
  // 1. Use REST API to export: GET /v1/images/{file_key}?ids={node_ids}&format={format}
  // 2. Or use plugin UI to trigger download
}
```

## Example 8: Create Responsive Layout Grid

```typescript
function createResponsiveFrame(
  name: string,
  breakpoint: "mobile" | "tablet" | "desktop",
) {
  const frame = figma.createFrame();
  frame.name = name;

  // Set size based on breakpoint
  const sizes = {
    mobile: { width: 375, height: 812 },
    tablet: { width: 768, height: 1024 },
    desktop: { width: 1440, height: 900 },
  };

  frame.resize(sizes[breakpoint].width, sizes[breakpoint].height);

  // Add layout grid
  const gridSize =
    breakpoint === "mobile" ? 8 : breakpoint === "tablet" ? 12 : 16;
  frame.layoutGrids = [
    {
      pattern: "COLUMNS",
      sectionSize: gridSize,
      visible: true,
      color: { r: 0, g: 0, b: 0, a: 0.1 },
    },
  ];

  return frame;
}
```

## Example 9: Batch Create from Data

```typescript
interface User {
  name: string;
  email: string;
  avatar: string;
}

async function createUserCards(users: User[]) {
  await figma.loadFontAsync({ family: "Inter", style: "Regular" });
  await figma.loadFontAsync({ family: "Inter", style: "Bold" });

  const container = figma.createFrame();
  container.name = "User Cards";
  container.layoutMode = "VERTICAL";
  container.primaryAxisSizingMode = "AUTO";
  container.counterAxisSizingMode = "FIXED";
  container.itemSpacing = 16;
  container.paddingLeft = 24;
  container.paddingRight = 24;
  container.paddingTop = 24;
  container.paddingBottom = 24;

  for (const user of users) {
    const card = figma.createFrame();
    card.layoutMode = "HORIZONTAL";
    card.primaryAxisSizingMode = "AUTO";
    card.counterAxisSizingMode = "FIXED";
    card.itemSpacing = 12;
    card.paddingLeft = 16;
    card.paddingRight = 16;
    card.paddingTop = 16;
    card.paddingBottom = 16;
    card.fills = [{ type: "SOLID", color: { r: 0.95, g: 0.95, b: 0.95 } }];
    card.cornerRadius = 8;

    // Avatar placeholder
    const avatar = figma.createEllipse();
    avatar.resize(48, 48);
    avatar.fills = [{ type: "SOLID", color: { r: 0.8, g: 0.8, b: 0.8 } }];
    card.appendChild(avatar);

    // Text container
    const textContainer = figma.createFrame();
    textContainer.layoutMode = "VERTICAL";
    textContainer.primaryAxisSizingMode = "AUTO";
    textContainer.counterAxisSizingMode = "FIXED";
    textContainer.itemSpacing = 4;

    // Name
    const nameText = figma.createText();
    nameText.characters = user.name;
    nameText.fontSize = 16;
    nameText.fontName = { family: "Inter", style: "Bold" };
    nameText.fills = [{ type: "SOLID", color: { r: 0.1, g: 0.1, b: 0.1 } }];
    textContainer.appendChild(nameText);

    // Email
    const emailText = figma.createText();
    emailText.characters = user.email;
    emailText.fontSize = 14;
    emailText.fontName = { family: "Inter", style: "Regular" };
    emailText.fills = [{ type: "SOLID", color: { r: 0.5, g: 0.5, b: 0.5 } }];
    textContainer.appendChild(emailText);

    card.appendChild(textContainer);
    container.appendChild(card);
  }

  figma.currentPage.appendChild(container);
  return container;
}

// Usage
const users = [
  { name: "John Doe", email: "john@example.com", avatar: "" },
  { name: "Jane Smith", email: "jane@example.com", avatar: "" },
];
await createUserCards(users);
```

## Example 10: Error Handling Wrapper

```typescript
async function safeExecute<T>(
  operation: () => Promise<T>,
  errorMessage: string,
): Promise<T | null> {
  try {
    return await operation();
  } catch (error) {
    figma.notify(`${errorMessage}: ${error.message}`, { error: true });
    console.error(error);
    return null;
  }
}

// Usage
const node = await safeExecute(
  () => figma.getNodeByIdAsync("123:456"),
  "Failed to get node",
);

if (node) {
  // Safe to use node
  node.name = "Updated";
}
```
