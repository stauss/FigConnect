/**
 * Tests for tools/export-tools.ts
 * Tests the export tool handler with mocked FigmaClient
 */

import { jest } from "@jest/globals";

// Mock the figmaClient
const mockGetImages = jest.fn<() => Promise<any>>();

jest.unstable_mockModule("../src/figma/client.js", () => ({
  figmaClient: {
    getImages: mockGetImages,
  },
  FigmaClient: jest.fn(),
  FigmaAPIError: class FigmaAPIError extends Error {
    constructor(
      message: string,
      public status?: number,
      public code?: string,
    ) {
      super(message);
      this.name = "FigmaAPIError";
    }
  },
}));

// Import after mocking
const { exportNode } = await import("../src/tools/export-tools.js");

describe("Export Tools", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("exportNode", () => {
    it("should return image URLs for exported nodes", async () => {
      mockGetImages.mockResolvedValueOnce({
        images: {
          "1:1": "https://figma.com/images/abc123.png",
          "1:2": "https://figma.com/images/def456.png",
        },
      });

      const result = await exportNode({
        file_key: "abc123",
        node_ids: ["1:1", "1:2"],
        format: "png",
        scale: 2,
      });

      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("# Exported PNG Images");
      expect(result.content[0].text).toContain("Scale: 2x");
      expect(result.content[0].text).toContain(
        "Node 1:1: https://figma.com/images/abc123.png",
      );
      expect(result.content[0].text).toContain(
        "Node 1:2: https://figma.com/images/def456.png",
      );
    });

    it("should pass correct parameters to client", async () => {
      mockGetImages.mockResolvedValueOnce({ images: {} });

      await exportNode({
        file_key: "abc123",
        node_ids: ["1:1"],
        format: "svg",
        scale: 1.5,
      });

      expect(mockGetImages).toHaveBeenCalledWith("abc123", ["1:1"], "svg", 1.5);
    });

    it("should handle different formats", async () => {
      const formats = ["png", "svg", "pdf", "jpg"] as const;

      for (const format of formats) {
        mockGetImages.mockResolvedValueOnce({ images: { "1:1": "url" } });

        const result = await exportNode({
          file_key: "abc123",
          node_ids: ["1:1"],
          format,
          scale: 1,
        });

        expect(result.content[0].text).toContain(
          `# Exported ${format.toUpperCase()} Images`,
        );
      }
    });

    it("should return error when API returns error", async () => {
      mockGetImages.mockResolvedValueOnce({
        err: "Invalid node IDs",
      });

      const result = await exportNode({
        file_key: "abc123",
        node_ids: ["invalid"],
        format: "png",
        scale: 1,
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("Error: Invalid node IDs");
    });

    it("should return error response on API failure", async () => {
      mockGetImages.mockRejectedValueOnce(new Error("Network error"));

      const result = await exportNode({
        file_key: "abc123",
        node_ids: ["1:1"],
        format: "png",
        scale: 1,
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("Error: Network error");
    });

    it("should handle empty images response", async () => {
      mockGetImages.mockResolvedValueOnce({ images: {} });

      const result = await exportNode({
        file_key: "abc123",
        node_ids: ["1:1"],
        format: "png",
        scale: 1,
      });

      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("# Exported PNG Images");
      // Empty images list is not an error, just no URLs returned
    });

    it("should include scale in output", async () => {
      mockGetImages.mockResolvedValueOnce({ images: { "1:1": "url" } });

      const result = await exportNode({
        file_key: "abc123",
        node_ids: ["1:1"],
        format: "png",
        scale: 4,
      });

      expect(result.content[0].text).toContain("Scale: 4x");
    });
  });
});
