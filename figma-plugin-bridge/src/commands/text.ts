import { Logger } from "../utils/logger";
import { loadFont, createFontName } from "../utils/fonts";
import { rgbToFigmaColor } from "../utils/colors";
import { appendChild, setNodePosition, createNodeResult } from "../utils/nodes";
import type { CommandResult, CreateTextParams } from "./types";

const logger = new Logger("Text");

/**
 * Execute create_text command
 */
export async function executeCreateText(
  params: Record<string, unknown>,
  parent: FrameNode | PageNode | ComponentNode,
): Promise<CommandResult> {
  try {
    const p = params as CreateTextParams;

    // Load font first (required before setting text properties)
    const fontFamily = p.fontFamily || "Inter";
    const fontWeight = p.fontWeight || 400;
    const fontName = await loadFont(fontFamily, fontWeight);

    // Create text node
    const text = figma.createText();

    // Set font (must be done before setting characters)
    text.fontName = fontName;

    // Set text content
    text.characters = p.content;

    // Set position
    setNodePosition(text, p.x, p.y);

    // Set font size
    if (p.fontSize) {
      text.fontSize = p.fontSize;
    }

    // Set fills (text color)
    if (p.fills && p.fills.length > 0) {
      text.fills = p.fills.map((fill) => {
        if (fill.type === "SOLID" && fill.color) {
          return {
            type: "SOLID" as const,
            color: rgbToFigmaColor(fill.color),
            opacity: fill.opacity != null ? fill.opacity : 1,
          };
        }
        // Default to black
        return {
          type: "SOLID" as const,
          color: { r: 0, g: 0, b: 0 },
          opacity: 1,
        };
      });
    }

    // Set alignment
    if (p.textAlignHorizontal) {
      text.textAlignHorizontal = p.textAlignHorizontal;
    }
    if (p.textAlignVertical) {
      text.textAlignVertical = p.textAlignVertical;
    }

    // Add to parent
    appendChild(parent, text);

    logger.info(`Created text: "${text.characters}" (${text.id})`);

    return {
      success: true,
      result: {
        ...createNodeResult(text),
        content: text.characters,
        fontSize: text.fontSize,
        fontFamily: fontName.family,
        fontStyle: fontName.style,
      },
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error("Text creation failed:", error);

    return {
      success: false,
      error: {
        code: "TEXT_CREATION_FAILED",
        message,
      },
    };
  }
}
