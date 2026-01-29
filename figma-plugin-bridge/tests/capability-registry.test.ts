/**
 * Tests for capabilities/registry.ts
 * Note: Figma plugin tests may need special setup for Figma API mocks
 */

import {
  PluginCapabilityRegistry,
  CapabilityRegistry,
} from "../src/capabilities/registry.js";
import { Capability } from "../src/capabilities/registry.js";

// Mock fetch for announceCapabilities
global.fetch = jest.fn() as jest.Mock;

describe("CapabilityRegistry", () => {
  let registry: CapabilityRegistry;

  beforeEach(() => {
    registry = new PluginCapabilityRegistry();
    (global.fetch as jest.Mock).mockClear();
  });

  describe("register", () => {
    it("should register capability", () => {
      const capability: Capability = {
        id: "test-capability",
        name: "Test Capability",
        commandTypes: ["create_frame", "create_text"],
        version: "1.0",
      };

      registry.register(capability);

      const capabilities = registry.getCapabilities();
      expect(capabilities).toContain(capability);
    });
  });

  describe("getCapabilities", () => {
    it("should return all registered capabilities", () => {
      const cap1: Capability = {
        id: "cap-1",
        name: "Capability 1",
        commandTypes: ["create_frame"],
        version: "1.0",
      };

      const cap2: Capability = {
        id: "cap-2",
        name: "Capability 2",
        commandTypes: ["create_text"],
        version: "1.0",
      };

      registry.register(cap1);
      registry.register(cap2);

      const capabilities = registry.getCapabilities();
      expect(capabilities.length).toBeGreaterThanOrEqual(2);
      expect(capabilities).toContain(cap1);
      expect(capabilities).toContain(cap2);
    });

    it("should include default capabilities", () => {
      const capabilities = registry.getCapabilities();

      // Default capabilities should be registered on module load
      expect(capabilities.length).toBeGreaterThan(0);
    });
  });

  describe("canExecute", () => {
    it("should return true when capability supports command type", () => {
      const capability: Capability = {
        id: "test-cap",
        name: "Test",
        commandTypes: ["create_frame"],
        version: "1.0",
      };

      registry.register(capability);

      expect(registry.canExecute("create_frame")).toBe(true);
    });

    it("should return false when capability does not support command type", () => {
      expect(registry.canExecute("unknown_command")).toBe(false);
    });
  });

  describe("announceCapabilities", () => {
    it("should POST capabilities to bridge server", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, registered: 1 }),
      });

      await registry.announceCapabilities();

      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:3030/api/capabilities",
        expect.objectContaining({
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: expect.stringContaining("capabilities"),
        }),
      );
    });

    it("should not announce twice", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      await registry.announceCapabilities();
      await registry.announceCapabilities();

      // Should only be called once
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it("should handle fetch errors gracefully", async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error("Network error"),
      );

      // Should not throw
      await expect(registry.announceCapabilities()).resolves.not.toThrow();
    });

    it("should handle non-ok response", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        statusText: "Server Error",
      });

      await expect(registry.announceCapabilities()).resolves.not.toThrow();
    });
  });

  describe("default capabilities", () => {
    it("should have core manipulation capability", () => {
      const capabilities = registry.getCapabilities();
      const coreCap = capabilities.find((c) => c.id === "core-manipulation");

      expect(coreCap).toBeDefined();
      expect(coreCap?.commandTypes).toContain("create_frame");
      expect(coreCap?.commandTypes).toContain("move_node");
    });

    it("should have layout capability", () => {
      const capabilities = registry.getCapabilities();
      const layoutCap = capabilities.find((c) => c.id === "layout");

      expect(layoutCap).toBeDefined();
      expect(layoutCap?.commandTypes).toContain("apply_auto_layout");
    });

    it("should have components capability", () => {
      const capabilities = registry.getCapabilities();
      const compCap = capabilities.find((c) => c.id === "components");

      expect(compCap).toBeDefined();
      expect(compCap?.commandTypes).toContain("create_component");
    });
  });
});
