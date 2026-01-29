import { Logger } from "../utils/logger";
import { getNodeById, createNodeResult } from "../utils/nodes";
import type { CommandResult } from "./types";

const logger = new Logger("Grouping");

/**
 * Execute group_nodes command
 */
export async function executeGroupNodes(
  params: Record<string, unknown>,
): Promise<CommandResult> {
  try {
    const nodeIds = params.nodeIds as string[];
    const name = params.name as string | undefined;

    if (!Array.isArray(nodeIds) || nodeIds.length < 2) {
      throw new Error("At least 2 node IDs required for grouping");
    }

    // Get all nodes
    const nodes: SceneNode[] = [];
    for (const id of nodeIds) {
      const node = await getNodeById(id);
      if (!node) {
        throw new Error(`Node not found: ${id}`);
      }
      nodes.push(node as SceneNode);
    }

    // Verify all nodes have the same parent
    const parent = nodes[0].parent;
    if (!parent || !("appendChild" in parent)) {
      throw new Error("Nodes must have a valid parent to group");
    }

    for (const node of nodes.slice(1)) {
      if (node.parent !== parent) {
        throw new Error("All nodes must have the same parent to group");
      }
    }

    // Group the nodes
    const group = figma.group(
      nodes,
      parent as PageNode | FrameNode | GroupNode,
    );

    // Set name if provided
    if (name) {
      group.name = name;
    }

    logger.info(`Grouped ${nodes.length} nodes into group ${group.id}`);

    return {
      success: true,
      result: createNodeResult(group),
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error("Group nodes failed:", error);

    return {
      success: false,
      error: {
        code: "GROUP_NODES_FAILED",
        message,
      },
    };
  }
}

/**
 * Execute ungroup_nodes command
 */
export async function executeUngroupNodes(
  params: Record<string, unknown>,
  targetNodeId?: string,
): Promise<CommandResult> {
  try {
    const nodeId = (targetNodeId || params.nodeId) as string;

    const node = await getNodeById(nodeId);
    if (!node) {
      throw new Error(`Node not found: ${nodeId}`);
    }

    if (node.type !== "GROUP") {
      throw new Error(`Node ${nodeId} is not a group (type: ${node.type})`);
    }

    const group = node as GroupNode;
    const children: SceneNode[] = [];

    // Collect children before ungrouping
    for (const child of group.children) {
      children.push(child);
    }

    // Ungroup
    const parent = group.parent;
    if (!parent || !("appendChild" in parent)) {
      throw new Error("Group must have a valid parent to ungroup");
    }

    figma.ungroup(group);

    const ungroupedNodes = children.map((child) => createNodeResult(child));

    logger.info(
      `Ungrouped ${ungroupedNodes.length} nodes from group ${nodeId}`,
    );

    return {
      success: true,
      result: {
        nodeIds: ungroupedNodes.map((n) => n.nodeId),
        nodes: ungroupedNodes,
      },
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error("Ungroup nodes failed:", error);

    return {
      success: false,
      error: {
        code: "UNGROUP_NODES_FAILED",
        message,
      },
    };
  }
}
