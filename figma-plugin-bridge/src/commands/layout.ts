import { Logger } from "../utils/logger";
import { getNodeById, isFrame } from "../utils/nodes";
import type { CommandResult, ApplyAutoLayoutParams } from "./types";

const logger = new Logger("Layout");

/**
 * Execute apply_auto_layout command
 */
export async function executeApplyAutoLayout(
  params: Record<string, unknown>,
  targetNodeId?: string,
): Promise<CommandResult> {
  try {
    const p = params as ApplyAutoLayoutParams;

    if (!targetNodeId) {
      throw new Error("Target node ID is required for apply_auto_layout");
    }

    // Get target node
    const node = await getNodeById(targetNodeId);

    if (!isFrame(node)) {
      throw new Error(
        `Target must be a frame node (got: ${node?.type || "null"})`,
      );
    }

    const frame = node;

    // Set layout mode
    frame.layoutMode = p.mode;

    // Set spacing
    if (p.itemSpacing !== undefined) {
      frame.itemSpacing = p.itemSpacing;
    }

    // Set padding
    if (p.paddingTop !== undefined) {
      frame.paddingTop = p.paddingTop;
    }
    if (p.paddingRight !== undefined) {
      frame.paddingRight = p.paddingRight;
    }
    if (p.paddingBottom !== undefined) {
      frame.paddingBottom = p.paddingBottom;
    }
    if (p.paddingLeft !== undefined) {
      frame.paddingLeft = p.paddingLeft;
    }

    // Set alignment
    if (p.primaryAxisAlignItems) {
      frame.primaryAxisAlignItems = p.primaryAxisAlignItems;
    }
    if (p.counterAxisAlignItems) {
      frame.counterAxisAlignItems = p.counterAxisAlignItems;
    }

    // Set sizing mode to auto for auto-layout
    frame.primaryAxisSizingMode = "AUTO";
    frame.counterAxisSizingMode = "AUTO";

    logger.info(`Applied auto-layout to: ${frame.name} (${frame.id})`);

    return {
      success: true,
      result: {
        nodeId: frame.id,
        name: frame.name,
        type: frame.type,
        layoutMode: frame.layoutMode,
        itemSpacing: frame.itemSpacing,
      },
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error("Auto-layout application failed:", error);

    return {
      success: false,
      error: {
        code: "LAYOUT_APPLICATION_FAILED",
        message,
      },
    };
  }
}
