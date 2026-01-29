import { Logger } from "../utils/logger";
import { rgbToFigmaColor } from "../utils/colors";
import {
  appendChild,
  setNodePosition,
  setNodeSize,
  createNodeResult,
} from "../utils/nodes";
import type { CommandResult, CreateFrameParams, FillParam } from "./types";

const logger = new Logger("Frame");

/**
 * Execute create_frame command
 */
export async function executeCreateFrame(
  params: Record<string, unknown>,
  parent: FrameNode | PageNode | ComponentNode,
): Promise<CommandResult> {
  try {
    const p = params as CreateFrameParams;

    // Create frame
    const frame = figma.createFrame();

    // Set name
    frame.name = p.name || "Frame";

    // Set size
    setNodeSize(frame, p.width, p.height);

    // Set position
    setNodePosition(frame, p.x, p.y);

    // Set fills if provided
    if (p.fills && p.fills.length > 0) {
      frame.fills = p.fills.map((fill: FillParam) => {
        if (fill.type === "SOLID" && fill.color) {
          return {
            type: "SOLID" as const,
            color: rgbToFigmaColor(fill.color),
            opacity: fill.opacity != null ? fill.opacity : 1,
          };
        }
        // Default to white solid
        return {
          type: "SOLID" as const,
          color: { r: 1, g: 1, b: 1 },
          opacity: 1,
        };
      });
    }

    // Set corner radius
    if (p.cornerRadius !== undefined) {
      frame.cornerRadius = p.cornerRadius;
    }

    // Add to parent
    appendChild(parent, frame);

    logger.info(`Created frame: ${frame.name} (${frame.id})`);

    return {
      success: true,
      result: {
        ...createNodeResult(frame),
        width: frame.width,
        height: frame.height,
      },
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error("Frame creation failed:", error);

    return {
      success: false,
      error: {
        code: "FRAME_CREATION_FAILED",
        message,
      },
    };
  }
}
