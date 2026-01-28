import { Logger } from "./logger";

const logger = new Logger("Nodes");

/**
 * Type guard for FrameNode
 */
export function isFrame(node: BaseNode | null): node is FrameNode {
  return node !== null && node.type === "FRAME";
}

/**
 * Type guard for TextNode
 */
export function isText(node: BaseNode | null): node is TextNode {
  return node !== null && node.type === "TEXT";
}

/**
 * Type guard for RectangleNode
 */
export function isRectangle(node: BaseNode | null): node is RectangleNode {
  return node !== null && node.type === "RECTANGLE";
}

/**
 * Type guard for ComponentNode
 */
export function isComponent(node: BaseNode | null): node is ComponentNode {
  return node !== null && node.type === "COMPONENT";
}

/**
 * Type guard for nodes that can have children
 */
export function canHaveChildren(
  node: BaseNode | null,
): node is FrameNode | ComponentNode | GroupNode {
  return (
    node !== null &&
    (node.type === "FRAME" ||
      node.type === "COMPONENT" ||
      node.type === "GROUP" ||
      node.type === "SECTION")
  );
}

/**
 * Get node by ID safely (async)
 */
export async function getNodeById(nodeId: string): Promise<BaseNode | null> {
  try {
    const node = await figma.getNodeByIdAsync(nodeId);
    return node;
  } catch (error) {
    logger.error(`Failed to get node ${nodeId}:`, error);
    return null;
  }
}

/**
 * Get parent for a new node
 * If parent ID is provided, returns that node. Otherwise returns current page.
 */
export async function getParentNode(
  parentId?: string,
): Promise<FrameNode | PageNode | ComponentNode> {
  if (!parentId) {
    return figma.currentPage;
  }

  const node = await getNodeById(parentId);

  if (!node) {
    throw new Error(`Parent node not found: ${parentId}`);
  }

  if (!canHaveChildren(node)) {
    throw new Error(
      `Node ${parentId} cannot have children (type: ${node.type})`,
    );
  }

  return node as FrameNode | ComponentNode;
}

/**
 * Append a node to a parent
 */
export function appendChild(
  parent: FrameNode | PageNode | ComponentNode | GroupNode,
  child: SceneNode,
): void {
  parent.appendChild(child);
}

/**
 * Set common node properties
 */
export function setNodePosition(node: SceneNode, x?: number, y?: number): void {
  if (x !== undefined) node.x = x;
  if (y !== undefined) node.y = y;
}

/**
 * Set node size
 */
export function setNodeSize(
  node: SceneNode & { resize: (width: number, height: number) => void },
  width: number,
  height: number,
): void {
  node.resize(width, height);
}

/**
 * Focus viewport on a node
 */
export function focusOnNode(node: SceneNode): void {
  figma.viewport.scrollAndZoomIntoView([node]);
}

/**
 * Select a node
 */
export function selectNode(node: SceneNode): void {
  figma.currentPage.selection = [node];
}

/**
 * Create a basic result object for command responses
 */
export function createNodeResult(node: SceneNode): {
  nodeId: string;
  name: string;
  type: string;
} {
  return {
    nodeId: node.id,
    name: node.name,
    type: node.type,
  };
}
