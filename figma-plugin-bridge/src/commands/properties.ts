import { Logger } from "../utils/logger";
import { getNodeById } from "../utils/nodes";
import type { CommandResult, SetPropertiesParams } from "./types";

const logger = new Logger("Properties");

/**
 * Execute set_properties command
 */
export async function executeSetProperties(
  params: Record<string, unknown>,
  targetNodeId?: string,
): Promise<CommandResult> {
  try {
    const p = params as SetPropertiesParams;

    if (!targetNodeId) {
      throw new Error("Target node ID is required for set_properties");
    }

    // Get target node
    const node = await getNodeById(targetNodeId);

    if (!node) {
      throw new Error(`Target node not found: ${targetNodeId}`);
    }

    const properties = p.properties;
    const appliedProperties: string[] = [];

    // Apply each property
    for (const [key, value] of Object.entries(properties)) {
      try {
        if (key in node) {
          // Type-safe property setting
          switch (key) {
            case "name":
              if (typeof value === "string") {
                (node as SceneNode).name = value;
                appliedProperties.push(key);
              }
              break;

            case "visible":
              if (typeof value === "boolean" && "visible" in node) {
                (node as SceneNode).visible = value;
                appliedProperties.push(key);
              }
              break;

            case "opacity":
              if (typeof value === "number" && "opacity" in node) {
                (node as BlendMixin).opacity = value;
                appliedProperties.push(key);
              }
              break;

            case "x":
              if (typeof value === "number" && "x" in node) {
                (node as SceneNode).x = value;
                appliedProperties.push(key);
              }
              break;

            case "y":
              if (typeof value === "number" && "y" in node) {
                (node as SceneNode).y = value;
                appliedProperties.push(key);
              }
              break;

            case "rotation":
              if (typeof value === "number" && "rotation" in node) {
                (node as LayoutMixin).rotation = value;
                appliedProperties.push(key);
              }
              break;

            case "locked":
              if (typeof value === "boolean" && "locked" in node) {
                (node as SceneNode).locked = value;
                appliedProperties.push(key);
              }
              break;

            case "cornerRadius":
              if (typeof value === "number" && "cornerRadius" in node) {
                (node as CornerMixin).cornerRadius = value;
                appliedProperties.push(key);
              }
              break;

            case "strokeWeight":
              if (typeof value === "number" && "strokeWeight" in node) {
                (node as GeometryMixin).strokeWeight = value;
                appliedProperties.push(key);
              }
              break;

            case "fills":
              if (Array.isArray(value) && "fills" in node) {
                try {
                  (node as GeometryMixin).fills = value as Paint[];
                  appliedProperties.push(key);
                } catch (e) {
                  logger.warn(`Failed to set fills: ${e}`);
                }
              }
              break;

            case "strokes":
              if (Array.isArray(value) && "strokes" in node) {
                try {
                  (node as GeometryMixin).strokes = value as Paint[];
                  appliedProperties.push(key);
                } catch (e) {
                  logger.warn(`Failed to set strokes: ${e}`);
                }
              }
              break;

            case "effects":
              if (Array.isArray(value) && "effects" in node) {
                try {
                  (node as BlendMixin).effects = value as Effect[];
                  appliedProperties.push(key);
                } catch (e) {
                  logger.warn(`Failed to set effects: ${e}`);
                }
              }
              break;

            case "constraints":
              if (
                typeof value === "object" &&
                value !== null &&
                "constraints" in node
              ) {
                try {
                  const constraints = value as {
                    horizontal: "MIN" | "CENTER" | "MAX" | "STRETCH" | "SCALE";
                    vertical: "MIN" | "CENTER" | "MAX" | "STRETCH" | "SCALE";
                  };
                  (node as LayoutMixin).constraints = constraints;
                  appliedProperties.push(key);
                } catch (e) {
                  logger.warn(`Failed to set constraints: ${e}`);
                }
              }
              break;

            case "strokeAlign":
              if (
                typeof value === "string" &&
                ["CENTER", "INSIDE", "OUTSIDE"].includes(value) &&
                "strokeAlign" in node
              ) {
                try {
                  (node as GeometryMixin).strokeAlign = value as
                    | "CENTER"
                    | "INSIDE"
                    | "OUTSIDE";
                  appliedProperties.push(key);
                } catch (e) {
                  logger.warn(`Failed to set strokeAlign: ${e}`);
                }
              }
              break;

            case "strokeCap":
              if (
                typeof value === "string" &&
                ["NONE", "ROUND", "SQUARE"].includes(value) &&
                "strokeCap" in node
              ) {
                try {
                  (node as GeometryMixin).strokeCap = value as
                    | "NONE"
                    | "ROUND"
                    | "SQUARE";
                  appliedProperties.push(key);
                } catch (e) {
                  logger.warn(`Failed to set strokeCap: ${e}`);
                }
              }
              break;

            case "strokeJoin":
              if (
                typeof value === "string" &&
                ["MITER", "BEVEL", "ROUND"].includes(value) &&
                "strokeJoin" in node
              ) {
                try {
                  (node as GeometryMixin).strokeJoin = value as
                    | "MITER"
                    | "BEVEL"
                    | "ROUND";
                  appliedProperties.push(key);
                } catch (e) {
                  logger.warn(`Failed to set strokeJoin: ${e}`);
                }
              }
              break;

            case "lineHeight":
              if (
                typeof value === "object" &&
                value !== null &&
                "lineHeight" in node &&
                node.type === "TEXT"
              ) {
                try {
                  (node as TextNode).lineHeight = value as LineHeight;
                  appliedProperties.push(key);
                } catch (e) {
                  logger.warn(`Failed to set lineHeight: ${e}`);
                }
              }
              break;

            case "letterSpacing":
              if (
                typeof value === "object" &&
                value !== null &&
                "letterSpacing" in node &&
                node.type === "TEXT"
              ) {
                try {
                  (node as TextNode).letterSpacing = value as LetterSpacing;
                  appliedProperties.push(key);
                } catch (e) {
                  logger.warn(`Failed to set letterSpacing: ${e}`);
                }
              }
              break;

            case "paragraphSpacing":
              if (
                typeof value === "number" &&
                "paragraphSpacing" in node &&
                node.type === "TEXT"
              ) {
                try {
                  (node as TextNode).paragraphSpacing = value;
                  appliedProperties.push(key);
                } catch (e) {
                  logger.warn(`Failed to set paragraphSpacing: ${e}`);
                }
              }
              break;

            case "paragraphIndent":
              if (
                typeof value === "number" &&
                "paragraphIndent" in node &&
                node.type === "TEXT"
              ) {
                try {
                  (node as TextNode).paragraphIndent = value;
                  appliedProperties.push(key);
                } catch (e) {
                  logger.warn(`Failed to set paragraphIndent: ${e}`);
                }
              }
              break;

            default:
              logger.warn(`Skipping unsupported property: ${key}`);
          }
        } else {
          logger.warn(`Property ${key} not found on node type ${node.type}`);
        }
      } catch (propError) {
        logger.warn(`Failed to set property ${key}:`, propError);
      }
    }

    logger.info(
      `Set properties on ${node.name} (${node.id}): ${appliedProperties.join(", ")}`,
    );

    return {
      success: true,
      result: {
        nodeId: node.id,
        name: node.name,
        type: node.type,
        appliedProperties,
      },
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error("Property setting failed:", error);

    return {
      success: false,
      error: {
        code: "SET_PROPERTIES_FAILED",
        message,
      },
    };
  }
}
