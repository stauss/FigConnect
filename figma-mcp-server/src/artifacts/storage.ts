import { Artifact, ArtifactId, ArtifactFilters } from "./types.js";
import { logger } from "../logger.js";

/**
 * Storage interface for result artifacts
 * Enables referencing command results across tasks/threads
 */
export interface ArtifactStorage {
  save(artifact: Artifact): Promise<ArtifactId>;
  get(artifactId: ArtifactId): Promise<Artifact | null>;
  findByTaskId(taskId: string): Promise<Artifact[]>;
  query(filters: ArtifactFilters): Promise<Artifact[]>;
  delete(artifactId: ArtifactId): Promise<boolean>;
}

/**
 * No-op implementation for MVP
 * Artifacts are not persisted, but interface exists for future implementation
 */
export class NoOpArtifactStorage implements ArtifactStorage {
  async save(artifact: Artifact): Promise<ArtifactId> {
    logger.debug(`Artifact storage disabled (MVP): ${artifact.id}`);
    return artifact.id;
  }

  async get(artifactId: ArtifactId): Promise<Artifact | null> {
    logger.debug(`Artifact storage disabled (MVP): ${artifactId}`);
    return null;
  }

  async findByTaskId(taskId: string): Promise<Artifact[]> {
    logger.debug(`Artifact storage disabled (MVP): task ${taskId}`);
    return [];
  }

  async query(filters: ArtifactFilters): Promise<Artifact[]> {
    logger.debug(`Artifact storage disabled (MVP): query`);
    return [];
  }

  async delete(artifactId: ArtifactId): Promise<boolean> {
    logger.debug(`Artifact storage disabled (MVP): delete ${artifactId}`);
    return false;
  }
}

/**
 * In-memory implementation for development/testing
 */
export class InMemoryArtifactStorage implements ArtifactStorage {
  private artifacts: Map<ArtifactId, Artifact> = new Map();
  private taskIndex: Map<string, ArtifactId[]> = new Map();

  async save(artifact: Artifact): Promise<ArtifactId> {
    this.artifacts.set(artifact.id, artifact);

    // Index by task ID
    if (!this.taskIndex.has(artifact.taskId)) {
      this.taskIndex.set(artifact.taskId, []);
    }
    const taskArtifacts = this.taskIndex.get(artifact.taskId)!;
    if (!taskArtifacts.includes(artifact.id)) {
      taskArtifacts.push(artifact.id);
    }

    logger.debug(`Saved artifact: ${artifact.id} (type: ${artifact.type})`);
    return artifact.id;
  }

  async get(artifactId: ArtifactId): Promise<Artifact | null> {
    return this.artifacts.get(artifactId) || null;
  }

  async findByTaskId(taskId: string): Promise<Artifact[]> {
    const artifactIds = this.taskIndex.get(taskId) || [];
    return artifactIds
      .map((id) => this.artifacts.get(id))
      .filter((a): a is Artifact => a !== undefined);
  }

  async query(filters: ArtifactFilters): Promise<Artifact[]> {
    let results = Array.from(this.artifacts.values());

    if (filters.taskId) {
      results = results.filter((a) => a.taskId === filters.taskId);
    }

    if (filters.type) {
      results = results.filter((a) => a.type === filters.type);
    }

    if (filters.fileKey) {
      results = results.filter((a) => a.metadata.fileKey === filters.fileKey);
    }

    if (filters.createdAfter) {
      const after = new Date(filters.createdAfter).getTime();
      results = results.filter(
        (a) => new Date(a.metadata.timestamp).getTime() >= after,
      );
    }

    if (filters.createdBefore) {
      const before = new Date(filters.createdBefore).getTime();
      results = results.filter(
        (a) => new Date(a.metadata.timestamp).getTime() <= before,
      );
    }

    return results;
  }

  async delete(artifactId: ArtifactId): Promise<boolean> {
    const artifact = this.artifacts.get(artifactId);
    if (!artifact) {
      return false;
    }

    // Remove from task index
    const taskArtifacts = this.taskIndex.get(artifact.taskId);
    if (taskArtifacts) {
      const index = taskArtifacts.indexOf(artifactId);
      if (index >= 0) {
        taskArtifacts.splice(index, 1);
      }
    }

    this.artifacts.delete(artifactId);
    logger.debug(`Deleted artifact: ${artifactId}`);
    return true;
  }
}

// Default: No-op for MVP
export const artifactStorage: ArtifactStorage = new NoOpArtifactStorage();
