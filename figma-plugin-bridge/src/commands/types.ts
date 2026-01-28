/**
 * Command types for the Figma plugin
 * These mirror the types defined in figma-mcp-server/src/commands/types.ts
 */

export interface Command {
  id: string;
  type: "mcp-command";
  version: string;
  command: CommandType;
  params: Record<string, unknown>;
  parent?: string;
  fileKey: string;
  timestamp: string;
  createdAt: number;
}

export type CommandType =
  | "create_frame"
  | "create_text"
  | "create_rectangle"
  | "apply_auto_layout"
  | "create_component"
  | "apply_style"
  | "set_properties";

export interface CommandResult {
  success: boolean;
  result?: {
    nodeId: string;
    name: string;
    type: string;
    [key: string]: unknown;
  };
  error?: {
    code: string;
    message: string;
    details?: string;
  };
}

export interface CommandResponse {
  type: "mcp-response";
  commandId: string;
  status: "success" | "error" | "pending";
  result?: unknown;
  error?: {
    code: string;
    message: string;
    details?: string;
  };
  timestamp: string;
  executionTime?: number;
}

// Parameter types for each command

export interface CreateFrameParams {
  name: string;
  width: number;
  height: number;
  x?: number;
  y?: number;
  fills?: FillParam[];
  cornerRadius?: number;
}

export interface CreateTextParams {
  content: string;
  x?: number;
  y?: number;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: number;
  fills?: FillParam[];
  textAlignHorizontal?: "LEFT" | "CENTER" | "RIGHT" | "JUSTIFIED";
  textAlignVertical?: "TOP" | "CENTER" | "BOTTOM";
}

export interface CreateRectangleParams {
  name?: string;
  width: number;
  height: number;
  x?: number;
  y?: number;
  fills?: FillParam[];
  strokes?: StrokeParam[];
  cornerRadius?: number;
}

export interface ApplyAutoLayoutParams {
  mode: "HORIZONTAL" | "VERTICAL";
  paddingTop?: number;
  paddingRight?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  itemSpacing?: number;
  primaryAxisAlignItems?: "MIN" | "CENTER" | "MAX" | "SPACE_BETWEEN";
  counterAxisAlignItems?: "MIN" | "CENTER" | "MAX";
}

export interface CreateComponentParams {
  name: string;
  description?: string;
}

export interface ApplyStyleParams {
  styleId: string;
  styleType: "FILL" | "STROKE" | "TEXT" | "EFFECT" | "GRID";
}

export interface SetPropertiesParams {
  properties: Record<string, unknown>;
}

export interface FillParam {
  type: "SOLID" | "GRADIENT_LINEAR" | "GRADIENT_RADIAL" | "IMAGE";
  color?: { r: number; g: number; b: number };
  opacity?: number;
}

export interface StrokeParam {
  type: "SOLID";
  color?: { r: number; g: number; b: number };
  opacity?: number;
}
