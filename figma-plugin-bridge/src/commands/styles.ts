import { Logger } from "../utils/logger";
import { getNodeById } from "../utils/nodes";
import type { CommandResult, ApplyStyleParams } from "./types";

const logger = new Logger("Styles");

/**
 * Execute apply_style command
 */
export async function executeApplyStyle(
  params: Record<string, unknown>,
  targetNodeId?: string,
): Promise<CommandResult> {
  try {
    const p = params as ApplyStyleParams;

    if (!targetNodeId) {
      throw new Error("Target node ID is required for apply_style");
    }

    // Get target node
    const node = await getNodeById(targetNodeId);

    if (!node) {
      throw new Error(`Target node not found: ${targetNodeId}`);
    }

    const styleId = p.styleId;
    const styleType = p.styleType;

    // Apply style based on type
    switch (styleType) {
      case "FILL":
        if ("fillStyleId" in node) {
          (node as GeometryMixin).fillStyleId = styleId;
        } else {
          throw new Error(`Node ${node.type} does not support fill styles`);
        }
        break;

      case "STROKE":
        if ("strokeStyleId" in node) {
          (node as GeometryMixin).strokeStyleId = styleId;
        } else {
          throw new Error(`Node ${node.type} does not support stroke styles`);
        }
        break;

      case "TEXT":
        if (node.type === "TEXT") {
          (node as TextNode).textStyleId = styleId;
        } else {
          throw new Error(`Node ${node.type} does not support text styles`);
        }
        break;

      case "EFFECT":
        if ("effectStyleId" in node) {
          (node as BlendMixin).effectStyleId = styleId;
        } else {
          throw new Error(`Node ${node.type} does not support effect styles`);
        }
        break;

      case "GRID":
        if (node.type === "FRAME") {
          (node as FrameNode).gridStyleId = styleId;
        } else {
          throw new Error(`Node ${node.type} does not support grid styles`);
        }
        break;

      default:
        throw new Error(`Unknown style type: ${styleType}`);
    }

    logger.info(`Applied ${styleType} style to: ${node.name} (${node.id})`);

    return {
      success: true,
      result: {
        nodeId: node.id,
        name: node.name,
        type: node.type,
        styleId,
        styleType,
      },
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error("Style application failed:", error);

    return {
      success: false,
      error: {
        code: "STYLE_APPLICATION_FAILED",
        message,
      },
    };
  }
}
