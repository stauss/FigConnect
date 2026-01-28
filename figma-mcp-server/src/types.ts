import { z } from 'zod';

// MCP Tool Response Type
export interface ToolResponse {
  content: Array<{
    type: 'text' | 'image' | 'resource';
    text?: string;
    data?: string;
    mimeType?: string;
  }>;
  isError?: boolean;
}

// Figma API Types
export interface FigmaFile {
  name: string;
  lastModified: string;
  thumbnailUrl: string;
  version: string;
  document: FigmaNode;
}

export interface FigmaNode {
  id: string;
  name: string;
  type: NodeType;
  children?: FigmaNode[];
  [key: string]: any;
}

export type NodeType = 
  | 'DOCUMENT'
  | 'CANVAS'
  | 'FRAME'
  | 'GROUP'
  | 'VECTOR'
  | 'BOOLEAN_OPERATION'
  | 'STAR'
  | 'LINE'
  | 'ELLIPSE'
  | 'REGULAR_POLYGON'
  | 'RECTANGLE'
  | 'TEXT'
  | 'SLICE'
  | 'COMPONENT'
  | 'COMPONENT_SET'
  | 'INSTANCE';

// Input Schemas using Zod
export const GetFileStructureSchema = z.object({
  file_key: z.string().describe('The Figma file key (from URL)'),
  depth: z.number().optional().describe('Maximum depth to traverse (default: 5)'),
});

export const GetNodeDetailsSchema = z.object({
  file_key: z.string(),
  node_ids: z.array(z.string()).describe('Array of node IDs to fetch'),
});

export const ExportNodeSchema = z.object({
  file_key: z.string(),
  node_ids: z.array(z.string()),
  format: z.enum(['png', 'svg', 'pdf', 'jpg']).default('png'),
  scale: z.number().min(0.01).max(4).default(1),
});

export const SearchNodesSchema = z.object({
  file_key: z.string(),
  query: z.string().describe('Search term for node names'),
  node_type: z.string().optional().describe('Filter by node type'),
});

export const GetComponentsSchema = z.object({
  file_key: z.string(),
});

export const GetStylesSchema = z.object({
  file_key: z.string(),
});

export const GetVariablesSchema = z.object({
  file_key: z.string(),
});

export const GetCommentsSchema = z.object({
  file_key: z.string(),
});

export const GetFileVersionsSchema = z.object({
  file_key: z.string(),
  page_size: z.number().optional().default(10),
});

export type GetFileStructureInput = z.infer<typeof GetFileStructureSchema>;
export type GetNodeDetailsInput = z.infer<typeof GetNodeDetailsSchema>;
export type ExportNodeInput = z.infer<typeof ExportNodeSchema>;
export type SearchNodesInput = z.infer<typeof SearchNodesSchema>;
export type GetComponentsInput = z.infer<typeof GetComponentsSchema>;
export type GetStylesInput = z.infer<typeof GetStylesSchema>;
export type GetVariablesInput = z.infer<typeof GetVariablesSchema>;
export type GetCommentsInput = z.infer<typeof GetCommentsSchema>;
export type GetFileVersionsInput = z.infer<typeof GetFileVersionsSchema>;
