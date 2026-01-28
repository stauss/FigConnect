import { logger } from "../logger.js";

/**
 * Resource types
 */
export type ResourceType = "tokens" | "prompt" | "component" | "style";

/**
 * Resource URI format: "figma://file/{fileKey}/tokens" or "prompt://create-component-set"
 */
export type ResourceURI = string;

/**
 * Resource that can be referenced and shared
 * Enables exposing resources to AI clients
 */
export interface Resource {
  uri: ResourceURI;
  type: ResourceType;
  data: any;
  metadata: {
    name?: string;
    description?: string;
    fileKey?: string;
    createdAt: string;
    updatedAt: string;
    [key: string]: any;
  };
}

/**
 * Resource registry for sharing resources across AI clients
 * Enables "figma://file/.../tokens" or "prompt://..." URIs
 */
export interface ResourceRegistry {
  register(resource: Resource): void;
  get(uri: ResourceURI): Promise<Resource | null>;
  list(type?: ResourceType): Promise<Resource[]>;
  delete(uri: ResourceURI): Promise<boolean>;
  search(query: string, type?: ResourceType): Promise<Resource[]>;
}

/**
 * Resource registry implementation
 */
export class ResourceRegistryImpl implements ResourceRegistry {
  private resources: Map<ResourceURI, Resource> = new Map();
  private typeIndex: Map<ResourceType, Set<ResourceURI>> = new Map();

  /**
   * Register a resource
   */
  register(resource: Resource): void {
    this.resources.set(resource.uri, resource);

    // Index by type
    if (!this.typeIndex.has(resource.type)) {
      this.typeIndex.set(resource.type, new Set());
    }
    this.typeIndex.get(resource.type)!.add(resource.uri);

    logger.debug(
      `Registered resource: ${resource.uri} (type: ${resource.type})`,
    );
  }

  /**
   * Get resource by URI
   */
  async get(uri: ResourceURI): Promise<Resource | null> {
    return this.resources.get(uri) || null;
  }

  /**
   * List resources, optionally filtered by type
   */
  async list(type?: ResourceType): Promise<Resource[]> {
    if (type) {
      const uris = this.typeIndex.get(type) || new Set();
      return Array.from(uris)
        .map((uri) => this.resources.get(uri))
        .filter((r): r is Resource => r !== undefined);
    }

    return Array.from(this.resources.values());
  }

  /**
   * Delete a resource
   */
  async delete(uri: ResourceURI): Promise<boolean> {
    const resource = this.resources.get(uri);
    if (!resource) {
      return false;
    }

    // Remove from type index
    const typeSet = this.typeIndex.get(resource.type);
    if (typeSet) {
      typeSet.delete(uri);
    }

    this.resources.delete(uri);
    logger.debug(`Deleted resource: ${uri}`);
    return true;
  }

  /**
   * Search resources by query string
   */
  async search(query: string, type?: ResourceType): Promise<Resource[]> {
    const lowerQuery = query.toLowerCase();
    let candidates = await this.list(type);

    return candidates.filter((resource) => {
      // Search in URI, name, description
      const searchable = [
        resource.uri,
        resource.metadata.name,
        resource.metadata.description,
      ]
        .filter((s): s is string => typeof s === "string")
        .join(" ")
        .toLowerCase();

      return searchable.includes(lowerQuery);
    });
  }
}

// Singleton instance
export const resourceRegistry: ResourceRegistry = new ResourceRegistryImpl();
