/**
 * Tests for resources/registry.ts
 */

import {
  ResourceRegistryImpl,
  ResourceRegistry,
} from "../src/resources/registry.js";
import { Resource, ResourceType } from "../src/resources/registry.js";

describe("ResourceRegistry", () => {
  let registry: ResourceRegistry;

  beforeEach(() => {
    registry = new ResourceRegistryImpl();
  });

  describe("register", () => {
    it("should register resource", async () => {
      const resource: Resource = {
        uri: "figma://file/abc123/tokens",
        type: "tokens",
        data: { colors: {} },
        metadata: {
          name: "Design Tokens",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      };

      registry.register(resource);

      // Verify registered
      const retrieved = await registry.get("figma://file/abc123/tokens");
      expect(retrieved).toEqual(resource);
    });
  });

  describe("get", () => {
    it("should get resource by URI", async () => {
      const resource: Resource = {
        uri: "figma://file/abc123/tokens",
        type: "tokens",
        data: {},
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      };

      registry.register(resource);

      const retrieved = await registry.get("figma://file/abc123/tokens");
      expect(retrieved).toEqual(resource);
    });

    it("should return null for non-existent URI", async () => {
      const retrieved = await registry.get("figma://file/unknown/resource");
      expect(retrieved).toBeNull();
    });
  });

  describe("list", () => {
    beforeEach(() => {
      registry.register({
        uri: "figma://file/abc/tokens",
        type: "tokens",
        data: {},
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      });

      registry.register({
        uri: "figma://file/abc/components",
        type: "component",
        data: {},
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      });

      registry.register({
        uri: "prompt://create-component-set",
        type: "prompt",
        data: {},
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      });
    });

    it("should list all resources when no type filter", async () => {
      const resources = await registry.list();

      expect(resources.length).toBe(3);
    });

    it("should filter by type", async () => {
      const tokens = await registry.list("tokens");
      expect(tokens.length).toBe(1);
      expect(tokens[0].type).toBe("tokens");

      const components = await registry.list("component");
      expect(components.length).toBe(1);
      expect(components[0].type).toBe("component");
    });
  });

  describe("delete", () => {
    it("should delete resource", async () => {
      const resource: Resource = {
        uri: "figma://file/abc/tokens",
        type: "tokens",
        data: {},
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      };

      registry.register(resource);
      expect(await registry.get("figma://file/abc/tokens")).not.toBeNull();

      const deleted = await registry.delete("figma://file/abc/tokens");
      expect(deleted).toBe(true);
      expect(await registry.get("figma://file/abc/tokens")).toBeNull();
    });

    it("should return false when deleting non-existent resource", async () => {
      const deleted = await registry.delete("non-existent");
      expect(deleted).toBe(false);
    });

    it("should remove resource from type index on delete", async () => {
      const resource: Resource = {
        uri: "figma://file/abc/tokens",
        type: "tokens",
        data: {},
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      };

      registry.register(resource);
      expect(await registry.list("tokens")).toHaveLength(1);

      await registry.delete("figma://file/abc/tokens");
      expect(await registry.list("tokens")).toHaveLength(0);
    });
  });

  describe("search", () => {
    beforeEach(() => {
      registry.register({
        uri: "figma://file/abc/tokens",
        type: "tokens",
        data: {},
        metadata: {
          name: "Design Tokens",
          description: "Color and spacing tokens",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      });

      registry.register({
        uri: "prompt://create-component",
        type: "prompt",
        data: {},
        metadata: {
          name: "Component Creator",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      });
    });

    it("should search by name", async () => {
      const results = await registry.search("Design Tokens");
      expect(results.length).toBe(1);
      expect(results[0].metadata.name).toBe("Design Tokens");
    });

    it("should search by description", async () => {
      const results = await registry.search("Color");
      expect(results.length).toBe(1);
    });

    it("should search by URI", async () => {
      const results = await registry.search("figma://file/abc");
      expect(results.length).toBe(1);
    });

    it("should filter search by type", async () => {
      const results = await registry.search("component", "prompt");
      expect(results.length).toBe(1);
      expect(results[0].type).toBe("prompt");
    });

    it("should return empty array when no matches", async () => {
      const results = await registry.search("non-existent");
      expect(results).toEqual([]);
    });
  });
});
