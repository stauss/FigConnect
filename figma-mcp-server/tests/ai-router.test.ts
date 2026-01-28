/**
 * Tests for ai/router.ts
 */

import { AIRouterImpl, AIRouter } from "../src/ai/router.js";
import { createMockAIProvider } from "./helpers/mock-providers.js";
import { AIContext } from "../src/ai/router.js";

describe("AIRouter", () => {
  let router: AIRouter;

  beforeEach(() => {
    router = new AIRouterImpl();
  });

  describe("registerProvider", () => {
    it("should register AI provider", () => {
      const provider = createMockAIProvider("test-provider");

      router.registerProvider("test-provider", provider);

      const retrieved = router.getProvider("test-provider");
      expect(retrieved).toEqual(provider);
    });

    it("should set first provider as default", () => {
      const provider1 = createMockAIProvider("provider-1");
      const provider2 = createMockAIProvider("provider-2");

      router.registerProvider("provider-1", provider1);
      router.registerProvider("provider-2", provider2);

      const defaultProvider = router.getDefaultProvider();
      expect(defaultProvider?.name).toBe("provider-1");
    });
  });

  describe("getProvider", () => {
    it("should return provider by name", () => {
      const provider = createMockAIProvider("test-provider");
      router.registerProvider("test-provider", provider);

      const retrieved = router.getProvider("test-provider");
      expect(retrieved).toEqual(provider);
    });

    it("should return default provider when name not specified", () => {
      const provider = createMockAIProvider("default-provider");
      router.registerProvider("default-provider", provider);

      const retrieved = router.getProvider();
      expect(retrieved).toEqual(provider);
    });

    it("should return null for non-existent provider", () => {
      const retrieved = router.getProvider("non-existent");
      expect(retrieved).toBeNull();
    });
  });

  describe("getDefaultProvider", () => {
    it("should return default provider", () => {
      const provider = createMockAIProvider("default");
      router.registerProvider("default", provider);

      const defaultProvider = router.getDefaultProvider();
      expect(defaultProvider).toEqual(provider);
    });

    it("should return null when no providers registered", () => {
      const defaultProvider = router.getDefaultProvider();
      expect(defaultProvider).toBeNull();
    });
  });

  describe("route", () => {
    it("should route message through default provider", async () => {
      const provider = createMockAIProvider("test-provider");
      router.registerProvider("test-provider", provider);

      const context: AIContext = {
        fileKey: "file-123",
        userMessage: "create a frame",
      };

      const commands = await router.route("create a frame", context);

      expect(commands.length).toBeGreaterThan(0);
      expect(commands[0].command).toBe("create_frame");
    });

    it("should throw error when no provider registered", async () => {
      const context: AIContext = {
        fileKey: "file-123",
        userMessage: "test",
      };

      await expect(router.route("test", context)).rejects.toThrow(
        "No AI provider registered",
      );
    });

    it("should propagate provider errors", async () => {
      const provider = createMockAIProvider("failing-provider");
      // Mock provider to throw error
      provider.generateIntent = async () => {
        throw new Error("Provider error");
      };

      router.registerProvider("failing-provider", provider);

      const context: AIContext = {
        fileKey: "file-123",
        userMessage: "test",
      };

      await expect(router.route("test", context)).rejects.toThrow(
        "AI routing failed",
      );
    });
  });
});
