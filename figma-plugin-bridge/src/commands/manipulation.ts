import { Logger } from "../utils/logger";
import { getNodeById, createNodeResult } from "../utils/nodes";
import type { CommandResult } from "./types";

const logger = new Logger("Manipulation");

/**
 * Execute move_node command
 */
export async function executeMoveNode(
  params: Record<string, unknown>,
  targetNodeId?: string,
): Promise<CommandResult> {
  try {
    const nodeId = params.nodeId as string | string[];
    const x = params.x as number | undefined;
    const y = params.y as number | undefined;
    const relative =
      params.relative != null ? (params.relative as boolean) : false;

    const nodeIds = Array.isArray(nodeId) ? nodeId : [nodeId];
    const movedNodes: Array<{ nodeId: string; name: string; type: string }> =
      [];

    for (const id of nodeIds) {
      const node = await getNodeById(id);
      if (!node) {
        throw new Error(`Node not found: ${id}`);
      }

      if (!("x" in node) || !("y" in node)) {
        throw new Error(`Node ${id} cannot be moved (type: ${node.type})`);
      }

      const sceneNode = node as SceneNode;

      if (relative) {
        // Relative movement (delta)
        if (x !== undefined) sceneNode.x += x;
        if (y !== undefined) sceneNode.y += y;
      } else {
        // Absolute positioning
        if (x !== undefined) sceneNode.x = x;
        if (y !== undefined) sceneNode.y = y;
      }

      movedNodes.push(createNodeResult(sceneNode));
    }

    logger.info(`Moved ${movedNodes.length} node(s)`);

    return {
      success: true,
      result: {
        nodeIds: movedNodes.map((n) => n.nodeId),
        nodes: movedNodes,
      },
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error("Move node failed:", error);

    return {
      success: false,
      error: {
        code: "MOVE_NODE_FAILED",
        message,
      },
    };
  }
}

/**
 * Execute duplicate_node command
 */
export async function executeDuplicateNode(
  params: Record<string, unknown>,
): Promise<CommandResult> {
  try {
    const nodeId = params.nodeId as string | string[];
    const nodeIds = Array.isArray(nodeId) ? nodeId : [nodeId];
    const duplicatedNodes: Array<{
      nodeId: string;
      name: string;
      type: string;
    }> = [];

    for (const id of nodeIds) {
      const node = await getNodeById(id);
      if (!node) {
        throw new Error(`Node not found: ${id}`);
      }

      if (!("clone" in node)) {
        throw new Error(`Node ${id} cannot be duplicated (type: ${node.type})`);
      }

      const cloneableNode = node as SceneNode & { clone: () => SceneNode };
      const duplicated = cloneableNode.clone();

      // Append to same parent
      if (node.parent && "appendChild" in node.parent) {
        node.parent.appendChild(duplicated);
      }

      duplicatedNodes.push(createNodeResult(duplicated));
    }

    logger.info(`Duplicated ${duplicatedNodes.length} node(s)`);

    return {
      success: true,
      result: {
        nodeIds: duplicatedNodes.map((n) => n.nodeId),
        nodes: duplicatedNodes,
      },
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error("Duplicate node failed:", error);

    return {
      success: false,
      error: {
        code: "DUPLICATE_NODE_FAILED",
        message,
      },
    };
  }
}

/**
 * Execute delete_node command
 */
export async function executeDeleteNode(
  params: Record<string, unknown>,
): Promise<CommandResult> {
  try {
    const nodeId = params.nodeId as string | string[];
    const nodeIds = Array.isArray(nodeId) ? nodeId : [nodeId];
    const deletedNodes: Array<{ nodeId: string; name: string; type: string }> =
      [];

    for (const id of nodeIds) {
      const node = await getNodeById(id);
      if (!node) {
        throw new Error(`Node not found: ${id}`);
      }

      // Check if locked
      if ("locked" in node && node.locked) {
        throw new Error(`Node ${id} is locked and cannot be deleted`);
      }

      const nodeInfo = createNodeResult(node as SceneNode);
      deletedNodes.push(nodeInfo);

      // Remove from parent
      if (node.parent && "removeChild" in node.parent) {
        node.parent.removeChild(node);
      } else {
        node.remove();
      }
    }

    logger.info(`Deleted ${deletedNodes.length} node(s)`);

    return {
      success: true,
      result: {
        nodeIds: deletedNodes.map((n) => n.nodeId),
        nodes: deletedNodes,
      },
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error("Delete node failed:", error);

    return {
      success: false,
      error: {
        code: "DELETE_NODE_FAILED",
        message,
      },
    };
  }
}

/**
 * Execute resize_node command
 */
export async function executeResizeNode(
  params: Record<string, unknown>,
  targetNodeId?: string,
): Promise<CommandResult> {
  try {
    const nodeId = (targetNodeId || params.nodeId) as string;
    const width = params.width as number | undefined;
    const height = params.height as number | undefined;
    const relative =
      params.relative != null ? (params.relative as boolean) : false;
    const maintainAspectRatio =
      params.maintainAspectRatio != null
        ? (params.maintainAspectRatio as boolean)
        : false;

    const node = await getNodeById(nodeId);
    if (!node) {
      throw new Error(`Node not found: ${nodeId}`);
    }

    if (!("resize" in node)) {
      throw new Error(`Node ${nodeId} cannot be resized (type: ${node.type})`);
    }

    const resizableNode = node as SceneNode & {
      resize: (width: number, height: number) => void;
      width: number;
      height: number;
    };

    let newWidth = resizableNode.width;
    let newHeight = resizableNode.height;

    if (relative) {
      // Relative resizing (delta)
      if (width !== undefined) newWidth += width;
      if (height !== undefined) newHeight += height;
    } else {
      // Absolute resizing
      if (width !== undefined) newWidth = width;
      if (height !== undefined) newHeight = height;
    }

    // Maintain aspect ratio if requested
    if (maintainAspectRatio && width !== undefined && height === undefined) {
      const aspectRatio = resizableNode.width / resizableNode.height;
      newHeight = newWidth / aspectRatio;
    } else if (
      maintainAspectRatio &&
      height !== undefined &&
      width === undefined
    ) {
      const aspectRatio = resizableNode.width / resizableNode.height;
      newWidth = newHeight * aspectRatio;
    }

    resizableNode.resize(newWidth, newHeight);

    logger.info(`Resized node ${nodeId} to ${newWidth}x${newHeight}`);

    return {
      success: true,
      result: createNodeResult(resizableNode),
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error("Resize node failed:", error);

    return {
      success: false,
      error: {
        code: "RESIZE_NODE_FAILED",
        message,
      },
    };
  }
}
