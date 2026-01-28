import { logger } from "../logger.js";

/**
 * Index result from search
 */
export interface IndexResult {
  nodeId: string;
  name: string;
  type: string;
  relevance: number; // 0-1 relevance score
  metadata?: Record<string, any>;
}

/**
 * Node changes for incremental indexing
 */
export interface NodeChanges {
  nodeId: string;
  name?: string;
  type?: string;
  deleted?: boolean;
  [key: string]: any;
}

/**
 * File index for searchable node lookup
 * Enables fast "find the settings header" queries
 */
export interface FileIndex {
  index(fileKey: string): Promise<void>;
  search(query: string, fileKey?: string): Promise<IndexResult[]>;
  updateNode(nodeId: string, changes: NodeChanges): Promise<void>;
  clear(fileKey?: string): Promise<void>;
  getStats(): IndexStats;
}

/**
 * Index statistics
 */
export interface IndexStats {
  indexedFiles: number;
  totalNodes: number;
  lastUpdated?: string;
}

/**
 * Basic file index implementation
 * For MVP: No-op (no indexing)
 * Future: Build searchable index, incremental updates
 */
export class NoOpFileIndex implements FileIndex {
  async index(fileKey: string): Promise<void> {
    logger.debug(`File indexing disabled (MVP): ${fileKey}`);
  }

  async search(query: string, fileKey?: string): Promise<IndexResult[]> {
    logger.debug(`File indexing disabled (MVP): search "${query}"`);
    return [];
  }

  async updateNode(nodeId: string, changes: NodeChanges): Promise<void> {
    logger.debug(`File indexing disabled (MVP): update node ${nodeId}`);
  }

  async clear(fileKey?: string): Promise<void> {
    logger.debug(`File indexing disabled (MVP): clear`);
  }

  getStats(): IndexStats {
    return {
      indexedFiles: 0,
      totalNodes: 0,
    };
  }
}

/**
 * In-memory file index implementation (for future use)
 */
export class InMemoryFileIndex implements FileIndex {
  private indexes: Map<string, Map<string, IndexResult>> = new Map(); // fileKey → nodeId → IndexResult

  async index(fileKey: string): Promise<void> {
    // Future: Build index from file structure
    logger.debug(`Indexing file: ${fileKey}`);
    this.indexes.set(fileKey, new Map());
  }

  async search(query: string, fileKey?: string): Promise<IndexResult[]> {
    const results: IndexResult[] = [];
    const lowerQuery = query.toLowerCase();

    const filesToSearch = fileKey ? [fileKey] : Array.from(this.indexes.keys());

    for (const fk of filesToSearch) {
      const index = this.indexes.get(fk);
      if (!index) continue;

      for (const [nodeId, entry] of index.entries()) {
        // Simple text matching (future: use proper search algorithm)
        const relevance = entry.name.toLowerCase().includes(lowerQuery)
          ? 0.8
          : 0.0;

        if (relevance > 0) {
          results.push({ ...entry, relevance });
        }
      }
    }

    // Sort by relevance
    results.sort((a, b) => b.relevance - a.relevance);

    return results;
  }

  async updateNode(nodeId: string, changes: NodeChanges): Promise<void> {
    // Future: Update index incrementally
    logger.debug(`Updating index for node: ${nodeId}`);
  }

  async clear(fileKey?: string): Promise<void> {
    if (fileKey) {
      this.indexes.delete(fileKey);
    } else {
      this.indexes.clear();
    }
  }

  getStats(): IndexStats {
    let totalNodes = 0;
    for (const index of this.indexes.values()) {
      totalNodes += index.size;
    }

    return {
      indexedFiles: this.indexes.size,
      totalNodes,
    };
  }
}

// Default: No-op for MVP
export const fileIndex: FileIndex = new NoOpFileIndex();
