import { Logger } from "../utils/logger";
import { rgbToFigmaColor } from "../utils/colors";
import {
  appendChild,
  setNodePosition,
  setNodeSize,
  createNodeResult,
} from "../utils/nodes";
import type {
  CommandResult,
  CreateRectangleParams,
  FillParam,
  StrokeParam,
} from "./types";

const logger = new Logger("Rectangle");

/**
 * Execute create_rectangle command
 */
export async function executeCreateRectangle(
  params: Record<string, unknown>,
  parent: FrameNode | PageNode | ComponentNode,
): Promise<CommandResult> {
  try {
    const p = params as CreateRectangleParams;

    // Create rectangle
    const rectangle = figma.createRectangle();

    // Set name
    rectangle.name = p.name || "Rectangle";

    // Set size
    setNodeSize(rectangle, p.width, p.height);

    // Set position
    setNodePosition(rectangle, p.x, p.y);

    // Set fills if provided
    if (p.fills && p.fills.length > 0) {
      rectangle.fills = p.fills.map((fill: FillParam) => {
        if (fill.type === "SOLID" && fill.color) {
          return {
            type: "SOLID" as const,
            color: rgbToFigmaColor(fill.color),
            opacity: fill.opacity != null ? fill.opacity : 1,
          };
        }
        // Default to gray solid
        return {
          type: "SOLID" as const,
          color: { r: 0.8, g: 0.8, b: 0.8 },
          opacity: 1,
        };
      });
    }

    // Set strokes if provided
    if (p.strokes && p.strokes.length > 0) {
      rectangle.strokes = p.strokes.map((stroke: StrokeParam) => {
        if (stroke.type === "SOLID" && stroke.color) {
          return {
            type: "SOLID" as const,
            color: rgbToFigmaColor(stroke.color),
            opacity: stroke.opacity != null ? stroke.opacity : 1,
          };
        }
        // Default to black stroke
        return {
          type: "SOLID" as const,
          color: { r: 0, g: 0, b: 0 },
          opacity: 1,
        };
      });
    }

    // Set corner radius
    if (p.cornerRadius !== undefined) {
      rectangle.cornerRadius = p.cornerRadius;
    }

    // Add to parent
    appendChild(parent, rectangle);

    logger.info(`Created rectangle: ${rectangle.name} (${rectangle.id})`);

    return {
      success: true,
      result: {
        ...createNodeResult(rectangle),
        width: rectangle.width,
        height: rectangle.height,
      },
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error("Rectangle creation failed:", error);

    return {
      success: false,
      error: {
        code: "RECTANGLE_CREATION_FAILED",
        message,
      },
    };
  }
}
