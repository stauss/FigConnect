/**
 * Artifact types that can be stored and referenced
 */
export type ArtifactType = "node_ids" | "diff" | "export" | "screenshot";

/**
 * Unique identifier for an artifact
 */
export type ArtifactId = string;

/**
 * Artifact metadata
 */
export interface ArtifactMetadata {
  nodeIds?: string[];
  fileKey?: string;
  timestamp: string;
  [key: string]: any; // Allow additional metadata
}

/**
 * Result artifact that can be stored and referenced across tasks/threads
 */
export interface Artifact {
  id: ArtifactId;
  taskId: string;
  type: ArtifactType;
  data: any; // Type-specific data
  metadata: ArtifactMetadata;
}

/**
 * Filters for querying artifacts
 */
export interface ArtifactFilters {
  taskId?: string;
  type?: ArtifactType;
  fileKey?: string;
  createdAfter?: string; // ISO timestamp
  createdBefore?: string; // ISO timestamp
}
