import { z } from "zod";

// Base command schema
export const BaseCommandSchema = z.object({
  type: z.literal("mcp-command"),
  version: z.string().default("1.0"),
  id: z.string(),
  command: z.string(),
  params: z.record(z.any()),
  parent: z.string().optional(),
  timestamp: z.string().datetime(),
  idempotencyKey: z.string().optional(), // For preventing duplicate execution
});

export type BaseCommand = z.infer<typeof BaseCommandSchema>;

// Color schema (reused in multiple places)
export const ColorSchema = z.object({
  r: z.number().min(0).max(1),
  g: z.number().min(0).max(1),
  b: z.number().min(0).max(1),
});

// Fill schema
export const FillSchema = z.object({
  type: z.enum(["SOLID", "GRADIENT_LINEAR", "GRADIENT_RADIAL", "IMAGE"]),
  color: ColorSchema.optional(),
  opacity: z.number().min(0).max(1).default(1),
});

// Frame creation
export const CreateFrameParamsSchema = z.object({
  name: z.string(),
  width: z.number().positive(),
  height: z.number().positive(),
  x: z.number().default(0),
  y: z.number().default(0),
  fills: z.array(FillSchema).optional(),
  cornerRadius: z.number().min(0).default(0),
});

export type CreateFrameParams = z.infer<typeof CreateFrameParamsSchema>;

// Text creation
export const CreateTextParamsSchema = z.object({
  content: z.string(),
  x: z.number().default(0),
  y: z.number().default(0),
  fontSize: z.number().positive().default(16),
  fontFamily: z.string().default("Inter"),
  fontWeight: z.number().default(400),
  fills: z
    .array(
      z.object({
        type: z.literal("SOLID"),
        color: ColorSchema,
      }),
    )
    .optional(),
  textAlignHorizontal: z
    .enum(["LEFT", "CENTER", "RIGHT", "JUSTIFIED"])
    .optional(),
  textAlignVertical: z.enum(["TOP", "CENTER", "BOTTOM"]).optional(),
});

export type CreateTextParams = z.infer<typeof CreateTextParamsSchema>;

// Rectangle creation
export const CreateRectangleParamsSchema = z.object({
  name: z.string().optional(),
  width: z.number().positive(),
  height: z.number().positive(),
  x: z.number().default(0),
  y: z.number().default(0),
  fills: z.array(z.any()).optional(),
  strokes: z.array(z.any()).optional(),
  cornerRadius: z.number().min(0).default(0),
});

export type CreateRectangleParams = z.infer<typeof CreateRectangleParamsSchema>;

// Auto-layout application
export const ApplyAutoLayoutParamsSchema = z.object({
  mode: z.enum(["HORIZONTAL", "VERTICAL"]),
  paddingTop: z.number().min(0).default(0),
  paddingRight: z.number().min(0).default(0),
  paddingBottom: z.number().min(0).default(0),
  paddingLeft: z.number().min(0).default(0),
  itemSpacing: z.number().min(0).default(0),
  primaryAxisAlignItems: z
    .enum(["MIN", "CENTER", "MAX", "SPACE_BETWEEN"])
    .optional(),
  counterAxisAlignItems: z.enum(["MIN", "CENTER", "MAX"]).optional(),
});

export type ApplyAutoLayoutParams = z.infer<typeof ApplyAutoLayoutParamsSchema>;

// Component creation
export const CreateComponentParamsSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
});

export type CreateComponentParams = z.infer<typeof CreateComponentParamsSchema>;

// Style application
export const ApplyStyleParamsSchema = z.object({
  styleId: z.string(),
  styleType: z.enum(["FILL", "STROKE", "TEXT", "EFFECT", "GRID"]),
});

export type ApplyStyleParams = z.infer<typeof ApplyStyleParamsSchema>;

// Property updates
export const SetPropertiesParamsSchema = z.object({
  properties: z.record(z.any()),
});

export type SetPropertiesParams = z.infer<typeof SetPropertiesParamsSchema>;

// Response schema
export const CommandResponseSchema = z.object({
  type: z.literal("mcp-response"),
  commandId: z.string(),
  status: z.enum(["success", "error", "pending"]),
  result: z.any().optional(),
  error: z
    .object({
      code: z.string(),
      message: z.string(),
      details: z.string().optional(),
    })
    .optional(),
  timestamp: z.string().datetime(),
  executionTime: z.number().optional(),
  artifacts: z.array(z.string()).optional(), // References to result artifacts
});

export type CommandResponse = z.infer<typeof CommandResponseSchema>;

// Move node schema
export const MoveNodeParamsSchema = z.object({
  nodeId: z.union([z.string(), z.array(z.string())]),
  x: z.number().optional(),
  y: z.number().optional(),
  relative: z.boolean().default(false), // true = delta, false = absolute
});

export type MoveNodeParams = z.infer<typeof MoveNodeParamsSchema>;

// Duplicate node schema
export const DuplicateNodeParamsSchema = z.object({
  nodeId: z.union([z.string(), z.array(z.string())]),
});

export type DuplicateNodeParams = z.infer<typeof DuplicateNodeParamsSchema>;

// Delete node schema
export const DeleteNodeParamsSchema = z.object({
  nodeId: z.union([z.string(), z.array(z.string())]),
});

export type DeleteNodeParams = z.infer<typeof DeleteNodeParamsSchema>;

// Resize node schema
export const ResizeNodeParamsSchema = z.object({
  nodeId: z.string(),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
  relative: z.boolean().default(false),
  maintainAspectRatio: z.boolean().default(false),
});

export type ResizeNodeParams = z.infer<typeof ResizeNodeParamsSchema>;

// Group nodes schema
export const GroupNodesParamsSchema = z.object({
  nodeIds: z.array(z.string()).min(2),
  name: z.string().optional(),
});

export type GroupNodesParams = z.infer<typeof GroupNodesParamsSchema>;

// Ungroup nodes schema
export const UngroupNodesParamsSchema = z.object({
  nodeId: z.string(), // Group node ID
});

export type UngroupNodesParams = z.infer<typeof UngroupNodesParamsSchema>;

// Supported command types
export type CommandType =
  | "create_frame"
  | "create_text"
  | "create_rectangle"
  | "apply_auto_layout"
  | "create_component"
  | "apply_style"
  | "set_properties"
  | "move_node"
  | "duplicate_node"
  | "delete_node"
  | "resize_node"
  | "group_nodes"
  | "ungroup_nodes";
