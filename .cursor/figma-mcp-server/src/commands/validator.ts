import {
  CreateFrameParamsSchema,
  CreateTextParamsSchema,
  CreateRectangleParamsSchema,
  ApplyAutoLayoutParamsSchema,
  CreateComponentParamsSchema,
  ApplyStyleParamsSchema,
  SetPropertiesParamsSchema,
  MoveNodeParamsSchema,
  DuplicateNodeParamsSchema,
  DeleteNodeParamsSchema,
  ResizeNodeParamsSchema,
  GroupNodesParamsSchema,
  UngroupNodesParamsSchema,
  CommandType,
} from "./types.js";
import { logger } from "../logger.js";

/**
 * Validate command parameters based on command type
 */
export function validateCommandParams(command: string, params: any): any {
  try {
    switch (command as CommandType) {
      case "create_frame":
        return CreateFrameParamsSchema.parse(params);

      case "create_text":
        return CreateTextParamsSchema.parse(params);

      case "create_rectangle":
        return CreateRectangleParamsSchema.parse(params);

      case "apply_auto_layout":
        return ApplyAutoLayoutParamsSchema.parse(params);

      case "create_component":
        return CreateComponentParamsSchema.parse(params);

      case "apply_style":
        return ApplyStyleParamsSchema.parse(params);

      case "set_properties":
        return SetPropertiesParamsSchema.parse(params);

      case "move_node":
        return MoveNodeParamsSchema.parse(params);

      case "duplicate_node":
        return DuplicateNodeParamsSchema.parse(params);

      case "delete_node":
        return DeleteNodeParamsSchema.parse(params);

      case "resize_node":
        return ResizeNodeParamsSchema.parse(params);

      case "group_nodes":
        return GroupNodesParamsSchema.parse(params);

      case "ungroup_nodes":
        return UngroupNodesParamsSchema.parse(params);

      default:
        logger.warn(`Unknown command type: ${command}`);
        return params; // Pass through for unknown commands
    }
  } catch (error: any) {
    logger.error(`Validation failed for ${command}:`, error);
    throw new Error(`Invalid parameters for ${command}: ${error.message}`);
  }
}

/**
 * Validate parent node ID format
 * Figma node IDs are in format "123:456"
 */
export function validateNodeId(nodeId: string): boolean {
  return /^\d+:\d+$/.test(nodeId);
}

/**
 * Validate color object
 * Color values must be numbers between 0 and 1
 */
export function validateColor(color: any): boolean {
  return (
    typeof color === "object" &&
    color !== null &&
    typeof color.r === "number" &&
    color.r >= 0 &&
    color.r <= 1 &&
    typeof color.g === "number" &&
    color.g >= 0 &&
    color.g <= 1 &&
    typeof color.b === "number" &&
    color.b >= 0 &&
    color.b <= 1
  );
}

/**
 * Check if a command type is supported
 */
export function isSupportedCommand(command: string): command is CommandType {
  const supportedCommands: CommandType[] = [
    "create_frame",
    "create_text",
    "create_rectangle",
    "apply_auto_layout",
    "create_component",
    "apply_style",
    "set_properties",
    "move_node",
    "duplicate_node",
    "delete_node",
    "resize_node",
    "group_nodes",
    "ungroup_nodes",
  ];
  return supportedCommands.includes(command as CommandType);
}
