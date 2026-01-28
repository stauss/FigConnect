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
} from "../types.js";

export const TOOLS = [
  {
    name: "get_file_structure",
    description:
      "Get the complete node tree structure of a Figma file. Returns hierarchical view of all frames, components, and layers.",
    inputSchema: GetFileStructureSchema,
  },
  {
    name: "get_node_details",
    description:
      "Get detailed properties of specific nodes by their IDs. Returns full node data including styles, constraints, and effects.",
    inputSchema: GetNodeDetailsSchema,
  },
  {
    name: "search_nodes",
    description:
      "Search for nodes by name or type within a Figma file. Useful for finding specific layers or components.",
    inputSchema: SearchNodesSchema,
  },
  {
    name: "get_components",
    description:
      "List all components in a Figma file with their properties and metadata.",
    inputSchema: GetComponentsSchema,
  },
  {
    name: "get_styles",
    description:
      "Get all color, text, and effect styles defined in the Figma file.",
    inputSchema: GetStylesSchema,
  },
  {
    name: "get_variables",
    description:
      "Get all design variables (tokens) including colors, numbers, strings, and booleans.",
    inputSchema: GetVariablesSchema,
  },
  {
    name: "export_node",
    description:
      "Export nodes as PNG, SVG, PDF, or JPG images. Supports custom scale and format options.",
    inputSchema: ExportNodeSchema,
  },
  {
    name: "get_comments",
    description:
      "Get all comments in the Figma file with author, timestamp, and location.",
    inputSchema: GetCommentsSchema,
  },
  {
    name: "get_file_versions",
    description:
      "Get version history of the Figma file including labels, timestamps, and authors.",
    inputSchema: GetFileVersionsSchema,
  },
] as const;
