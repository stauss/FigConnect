import { zodToJsonSchema } from "zod-to-json-schema";
import {
  GetFileStructureSchema,
  GetNodeDetailsSchema,
  SearchNodesSchema,
  GetComponentsSchema,
  GetStylesSchema,
  GetVariablesSchema,
  GetCommentsSchema,
  GetFileVersionsSchema,
  ExportNodeSchema,
  // Phase 2: Command schemas
  PostCommandSchema,
  GetCommandStatusSchema,
  BatchCommandSchema,
  GetQueueStatsSchema,
} from "../types.js";

// Helper to convert Zod schema to JSON Schema (MCP format)
function toJsonSchema(zodSchema: any) {
  return zodToJsonSchema(zodSchema, { target: "openApi3" });
}

// Phase 1: Read-only tools
export const READ_TOOLS = [
  {
    name: "get_file_structure",
    description:
      "Get the complete node tree structure of a Figma file. Returns hierarchical view of all frames, components, and layers.",
    inputSchema: toJsonSchema(GetFileStructureSchema),
  },
  {
    name: "get_node_details",
    description:
      "Get detailed properties of specific nodes by their IDs. Returns full node data including styles, constraints, and effects.",
    inputSchema: toJsonSchema(GetNodeDetailsSchema),
  },
  {
    name: "search_nodes",
    description:
      "Search for nodes by name or type within a Figma file. Useful for finding specific layers or components.",
    inputSchema: toJsonSchema(SearchNodesSchema),
  },
  {
    name: "get_components",
    description:
      "List all components in a Figma file with their properties and metadata.",
    inputSchema: toJsonSchema(GetComponentsSchema),
  },
  {
    name: "get_styles",
    description:
      "Get all color, text, and effect styles defined in the Figma file.",
    inputSchema: toJsonSchema(GetStylesSchema),
  },
  {
    name: "get_variables",
    description:
      "Get all design variables (tokens) including colors, numbers, strings, and booleans.",
    inputSchema: toJsonSchema(GetVariablesSchema),
  },
  {
    name: "export_node",
    description:
      "Export nodes as PNG, SVG, PDF, or JPG images. Supports custom scale and format options.",
    inputSchema: toJsonSchema(ExportNodeSchema),
  },
  {
    name: "get_comments",
    description:
      "Get all comments in the Figma file with author, timestamp, and location.",
    inputSchema: toJsonSchema(GetCommentsSchema),
  },
  {
    name: "get_file_versions",
    description:
      "Get version history of the Figma file including labels, timestamps, and authors.",
    inputSchema: toJsonSchema(GetFileVersionsSchema),
  },
];

// Phase 2: Command tools
export const COMMAND_TOOLS = [
  {
    name: "post_command",
    description:
      "Post a command to be executed by the Figma plugin. Supports create_frame, create_text, create_rectangle, apply_auto_layout, create_component, set_properties, move_node, duplicate_node, delete_node, resize_node, group_nodes, ungroup_nodes.",
    inputSchema: toJsonSchema(PostCommandSchema),
  },
  {
    name: "get_command_status",
    description:
      "Get the status of a previously posted command. Returns status, timestamps, and response if completed.",
    inputSchema: toJsonSchema(GetCommandStatusSchema),
  },
  {
    name: "post_batch_commands",
    description:
      "Post multiple commands at once. Commands are executed sequentially by the plugin.",
    inputSchema: toJsonSchema(BatchCommandSchema),
  },
  {
    name: "get_queue_stats",
    description:
      "Get statistics about the command queue including pending, posted, completed, and failed command counts.",
    inputSchema: toJsonSchema(GetQueueStatsSchema),
  },
];

// All tools combined
export const TOOLS = [...READ_TOOLS, ...COMMAND_TOOLS];
