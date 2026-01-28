import { v4 as uuidv4 } from "uuid";
import { BaseCommand } from "./types.js";

/**
 * Generate unique command ID
 */
export function generateCommandId(): string {
  return `cmd-${Date.now()}-${uuidv4().slice(0, 8)}`;
}

/**
 * Helper: Convert hex color to RGB (0-1 range for Figma)
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    throw new Error(`Invalid hex color: ${hex}`);
  }
  return {
    r: parseInt(result[1], 16) / 255,
    g: parseInt(result[2], 16) / 255,
    b: parseInt(result[3], 16) / 255,
  };
}

/**
 * Create frame command template
 */
export function createFrameCommand(params: {
  name: string;
  width: number;
  height: number;
  x?: number;
  y?: number;
  backgroundColor?: string;
  parent?: string;
}): BaseCommand {
  return {
    type: "mcp-command",
    version: "1.0",
    id: generateCommandId(),
    command: "create_frame",
    params: {
      name: params.name,
      width: params.width,
      height: params.height,
      x: params.x ?? 0,
      y: params.y ?? 0,
      fills: params.backgroundColor
        ? [
            {
              type: "SOLID" as const,
              color: hexToRgb(params.backgroundColor),
              opacity: 1,
            },
          ]
        : [],
    },
    parent: params.parent,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Create text command template
 */
export function createTextCommand(params: {
  content: string;
  x?: number;
  y?: number;
  fontSize?: number;
  color?: string;
  parent?: string;
}): BaseCommand {
  return {
    type: "mcp-command",
    version: "1.0",
    id: generateCommandId(),
    command: "create_text",
    params: {
      content: params.content,
      x: params.x ?? 0,
      y: params.y ?? 0,
      fontSize: params.fontSize ?? 16,
      fills: params.color
        ? [
            {
              type: "SOLID" as const,
              color: hexToRgb(params.color),
            },
          ]
        : undefined,
    },
    parent: params.parent,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Create rectangle command template
 */
export function createRectangleCommand(params: {
  width: number;
  height: number;
  x?: number;
  y?: number;
  fillColor?: string;
  cornerRadius?: number;
  parent?: string;
}): BaseCommand {
  return {
    type: "mcp-command",
    version: "1.0",
    id: generateCommandId(),
    command: "create_rectangle",
    params: {
      width: params.width,
      height: params.height,
      x: params.x ?? 0,
      y: params.y ?? 0,
      fills: params.fillColor
        ? [
            {
              type: "SOLID" as const,
              color: hexToRgb(params.fillColor),
            },
          ]
        : [],
      cornerRadius: params.cornerRadius ?? 0,
    },
    parent: params.parent,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Apply auto-layout command template
 */
export function applyAutoLayoutCommand(params: {
  nodeId: string;
  direction: "HORIZONTAL" | "VERTICAL";
  spacing?: number;
  padding?: number;
}): BaseCommand {
  return {
    type: "mcp-command",
    version: "1.0",
    id: generateCommandId(),
    command: "apply_auto_layout",
    params: {
      mode: params.direction,
      itemSpacing: params.spacing ?? 0,
      paddingTop: params.padding ?? 0,
      paddingRight: params.padding ?? 0,
      paddingBottom: params.padding ?? 0,
      paddingLeft: params.padding ?? 0,
    },
    parent: params.nodeId,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Create component command template
 */
export function createComponentCommand(params: {
  name: string;
  description?: string;
  parent?: string;
}): BaseCommand {
  return {
    type: "mcp-command",
    version: "1.0",
    id: generateCommandId(),
    command: "create_component",
    params: {
      name: params.name,
      description: params.description,
    },
    parent: params.parent,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Set properties command template
 */
export function setPropertiesCommand(params: {
  nodeId: string;
  properties: Record<string, any>;
}): BaseCommand {
  return {
    type: "mcp-command",
    version: "1.0",
    id: generateCommandId(),
    command: "set_properties",
    params: {
      properties: params.properties,
    },
    parent: params.nodeId,
    timestamp: new Date().toISOString(),
  };
}
