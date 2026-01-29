/**
 * Tests for plugins/registry.ts
 */

import { PluginRegistryImpl, PluginRegistry } from "../src/plugins/registry.js";
import { createMockCommand } from "./helpers/command-helpers.js";
import {
  createMockToolPlugin,
  createMockFailingPlugin,
} from "./helpers/mock-providers.js";

describe("PluginRegistry", () => {
  let registry: PluginRegistry;

  beforeEach(() => {
    registry = new PluginRegistryImpl();
  });

  describe("register", () => {
    it("should register plugin", () => {
      const plugin = createMockToolPlugin("plugin-1", ["create_frame"]);

      registry.register(plugin);

      const plugins = registry.getPlugins();
      expect(plugins).toContain(plugin);
    });

    it("should overwrite existing plugin for same command type", () => {
      const plugin1 = createMockToolPlugin("plugin-1", ["create_frame"]);
      const plugin2 = createMockToolPlugin("plugin-2", ["create_frame"]);

      registry.register(plugin1);
      registry.register(plugin2);

      // Plugin2 should overwrite plugin1 for create_frame
      const canExecute = registry.canExecute(
        createMockCommand("cmd-1", "create_frame"),
      );
      expect(canExecute).toBe(true);
    });
  });

  describe("getPlugins", () => {
    it("should return all registered plugins", () => {
      const plugin1 = createMockToolPlugin("plugin-1");
      const plugin2 = createMockToolPlugin("plugin-2");

      registry.register(plugin1);
      registry.register(plugin2);

      const plugins = registry.getPlugins();
      expect(plugins.length).toBe(2);
    });

    it("should return empty array when no plugins registered", () => {
      const plugins = registry.getPlugins();
      expect(plugins).toEqual([]);
    });
  });

  describe("getPlugin", () => {
    it("should return plugin by ID", () => {
      const plugin = createMockToolPlugin("plugin-1");

      registry.register(plugin);

      const retrieved = registry.getPlugin("plugin-1");
      expect(retrieved).toEqual(plugin);
    });

    it("should return null for non-existent plugin", () => {
      const retrieved = registry.getPlugin("non-existent");
      expect(retrieved).toBeNull();
    });
  });

  describe("canExecute", () => {
    it("should return true when plugin can execute command", () => {
      const plugin = createMockToolPlugin("plugin-1", ["create_frame"]);
      registry.register(plugin);

      const command = createMockCommand("cmd-1", "create_frame");
      const canExecute = registry.canExecute(command);

      expect(canExecute).toBe(true);
    });

    it("should return false when no plugin can execute", () => {
      const command = createMockCommand("cmd-1", "unknown_command");
      const canExecute = registry.canExecute(command);

      expect(canExecute).toBe(false);
    });
  });

  describe("execute", () => {
    it("should execute command via plugin", async () => {
      const plugin = createMockToolPlugin("plugin-1", ["create_frame"]);
      registry.register(plugin);

      const command = createMockCommand("cmd-1", "create_frame");
      const result = await registry.execute(command);

      expect(result.success).toBe(true);
      expect(result.result).toBeDefined();
    });

    it("should return error when no plugin registered", async () => {
      const command = createMockCommand("cmd-1", "unknown_command");
      const result = await registry.execute(command);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("NO_PLUGIN");
    });

    it("should return error when plugin not found", async () => {
      // Register plugin but then simulate it being removed
      const plugin = createMockToolPlugin("plugin-1", ["create_frame"]);
      registry.register(plugin);

      // Manually remove from internal map (testing edge case)
      const impl = registry as PluginRegistryImpl;
      const plugins = (impl as any).plugins;
      plugins.delete("plugin-1");

      const command = createMockCommand("cmd-1", "create_frame");
      const result = await registry.execute(command);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("PLUGIN_NOT_FOUND");
    });

    it("should handle plugin execution errors", async () => {
      const plugin = createMockFailingPlugin("failing-plugin");
      registry.register(plugin);

      const command = createMockCommand("cmd-1", "create_frame");
      const result = await registry.execute(command);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("PLUGIN_ERROR");
    });
  });
});
