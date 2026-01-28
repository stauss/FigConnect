/**
 * Tests for commands/schema/registry.ts
 */

import {
  CommandSchemaRegistryImpl,
  CommandSchemaRegistry,
  type CommandSchema,
} from "../src/commands/schema/registry.js";
import { BaseCommand } from "../src/commands/types.js";
import { z } from "zod";

describe("CommandSchemaRegistry", () => {
  let registry: CommandSchemaRegistry;

  beforeEach(() => {
    registry = new CommandSchemaRegistryImpl();
  });

  describe("register", () => {
    it("should register schema for command type", () => {
      const schema: CommandSchema = {
        type: "create_frame",
        version: "1.0",
        schema: z.object({
          name: z.string(),
          width: z.number(),
        }),
      };

      registry.register(schema);

      const retrieved = registry.getSchema("create_frame", "1.0");
      expect(retrieved).toEqual(schema);
    });

    it("should support multiple versions of same command type", () => {
      const v1: CommandSchema = {
        type: "create_frame",
        version: "1.0",
        schema: z.object({ name: z.string() }),
      };

      const v2: CommandSchema = {
        type: "create_frame",
        version: "2.0",
        schema: z.object({
          name: z.string(),
          description: z.string().optional(),
        }),
      };

      registry.register(v1);
      registry.register(v2);

      expect(registry.getSchema("create_frame", "1.0")).toEqual(v1);
      expect(registry.getSchema("create_frame", "2.0")).toEqual(v2);
    });
  });

  describe("getSchema", () => {
    it("should return schema for registered type and version", () => {
      const schema: CommandSchema = {
        type: "create_frame",
        version: "1.0",
        schema: z.object({}),
      };

      registry.register(schema);

      const retrieved = registry.getSchema("create_frame", "1.0");
      expect(retrieved).toEqual(schema);
    });

    it("should return null for non-existent command type", () => {
      const result = registry.getSchema("unknown_command", "1.0");
      expect(result).toBeNull();
    });

    it("should return null for non-existent version", () => {
      const schema: CommandSchema = {
        type: "create_frame",
        version: "1.0",
        schema: z.object({}),
      };

      registry.register(schema);

      const result = registry.getSchema("create_frame", "2.0");
      expect(result).toBeNull();
    });
  });

  describe("getLatestVersion", () => {
    it("should return latest version for command type", () => {
      registry.register({
        type: "create_frame",
        version: "1.0",
        schema: z.object({}),
      });

      registry.register({
        type: "create_frame",
        version: "2.0",
        schema: z.object({}),
      });

      registry.register({
        type: "create_frame",
        version: "1.5",
        schema: z.object({}),
      });

      const latest = registry.getLatestVersion("create_frame");
      expect(latest).toBe("2.0");
    });

    it("should return null for non-existent command type", () => {
      const result = registry.getLatestVersion("unknown_command");
      expect(result).toBeNull();
    });
  });

  describe("getAllVersions", () => {
    it("should return all versions for command type", () => {
      registry.register({
        type: "create_frame",
        version: "1.0",
        schema: z.object({}),
      });

      registry.register({
        type: "create_frame",
        version: "2.0",
        schema: z.object({}),
      });

      const versions = registry.getAllVersions("create_frame");
      expect(versions).toContain("1.0");
      expect(versions).toContain("2.0");
      expect(versions.length).toBe(2);
    });

    it("should return empty array for non-existent command type", () => {
      const versions = registry.getAllVersions("unknown_command");
      expect(versions).toEqual([]);
    });
  });

  describe("migrate", () => {
    it("should return command unchanged when versions match", () => {
      const command: BaseCommand = {
        type: "mcp-command",
        version: "1.0",
        id: "cmd-123",
        command: "create_frame",
        params: { name: "Test" },
        timestamp: new Date().toISOString(),
      };

      const result = registry.migrate(command, "1.0", "1.0");
      expect(result).toEqual(command);
    });

    it("should migrate command using migration function", () => {
      const command: BaseCommand = {
        type: "mcp-command",
        version: "1.0",
        id: "cmd-123",
        command: "create_frame",
        params: { name: "Test" },
        timestamp: new Date().toISOString(),
      };

      const migrationFn = (cmd: any) => ({
        ...cmd,
        params: { ...cmd.params, description: "Migrated" },
      });

      registry.register({
        type: "create_frame",
        version: "1.0",
        schema: z.object({}),
      });

      registry.register({
        type: "create_frame",
        version: "2.0",
        schema: z.object({}),
        migration: migrationFn,
      });

      const result = registry.migrate(command, "1.0", "2.0");
      expect(result).not.toBeNull();
      expect(result?.params.description).toBe("Migrated");
    });

    it("should return null when migration function throws error", () => {
      const command: BaseCommand = {
        type: "mcp-command",
        version: "1.0",
        id: "cmd-123",
        command: "create_frame",
        params: {},
        timestamp: new Date().toISOString(),
      };

      registry.register({
        type: "create_frame",
        version: "1.0",
        schema: z.object({}),
      });

      registry.register({
        type: "create_frame",
        version: "2.0",
        schema: z.object({}),
        migration: () => {
          throw new Error("Migration failed");
        },
      });

      const result = registry.migrate(command, "1.0", "2.0");
      expect(result).toBeNull();
    });

    it("should return null when schemas not found", () => {
      const command: BaseCommand = {
        type: "mcp-command",
        version: "1.0",
        id: "cmd-123",
        command: "create_frame",
        params: {},
        timestamp: new Date().toISOString(),
      };

      const result = registry.migrate(command, "1.0", "2.0");
      expect(result).toBeNull();
    });
  });
});
