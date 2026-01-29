/**
 * Tests for tools/read-tools.ts
 * Tests the MCP tool handlers with mocked FigmaClient
 */

import { jest } from "@jest/globals";

// Mock the figmaClient
const mockGetFile = jest.fn<() => Promise<any>>();
const mockGetNodes = jest.fn<() => Promise<any>>();
const mockGetFileComponents = jest.fn<() => Promise<any>>();
const mockGetFileStyles = jest.fn<() => Promise<any>>();
const mockGetLocalVariables = jest.fn<() => Promise<any>>();
const mockGetComments = jest.fn<() => Promise<any>>();
const mockGetVersions = jest.fn<() => Promise<any>>();

jest.unstable_mockModule("../src/figma/client.js", () => ({
  figmaClient: {
    getFile: mockGetFile,
    getNodes: mockGetNodes,
    getFileComponents: mockGetFileComponents,
    getFileStyles: mockGetFileStyles,
    getLocalVariables: mockGetLocalVariables,
    getComments: mockGetComments,
    getVersions: mockGetVersions,
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
const {
  getFileStructure,
  getNodeDetails,
  searchNodes,
  getComponents,
  getStyles,
  getVariables,
  getComments,
  getFileVersions,
} = await import("../src/tools/read-tools.js");

describe("Read Tools", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getFileStructure", () => {
    it("should return formatted file structure", async () => {
      mockGetFile.mockResolvedValueOnce({
        name: "Test Design",
        lastModified: "2024-01-15T10:00:00Z",
        document: {
          id: "0:0",
          name: "Document",
          type: "DOCUMENT",
          children: [
            {
              id: "1:1",
              name: "Page 1",
              type: "CANVAS",
              children: [],
            },
          ],
        },
      });

      const result = await getFileStructure({ file_key: "abc123" });

      expect(result.isError).toBeUndefined();
      expect(result.content[0].type).toBe("text");
      expect(result.content[0].text).toContain("# File: Test Design");
      expect(result.content[0].text).toContain("Last Modified:");
      expect(result.content[0].text).toContain("[DOCUMENT] Document");
      expect(result.content[0].text).toContain("[CANVAS] Page 1");
    });

    it("should pass depth parameter to client", async () => {
      mockGetFile.mockResolvedValueOnce({
        name: "Test",
        lastModified: "2024-01-15",
        document: { id: "0:0", name: "Doc", type: "DOCUMENT" },
      });

      await getFileStructure({ file_key: "abc123", depth: 3 });

      expect(mockGetFile).toHaveBeenCalledWith("abc123", 3);
    });

    it("should return error response on failure", async () => {
      mockGetFile.mockRejectedValueOnce(new Error("API Error"));

      const result = await getFileStructure({ file_key: "invalid" });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("Error: API Error");
    });
  });

  describe("getNodeDetails", () => {
    it("should return formatted node details", async () => {
      mockGetNodes.mockResolvedValueOnce({
        nodes: {
          "1:1": {
            document: {
              id: "1:1",
              name: "Header",
              type: "FRAME",
              visible: true,
              children: [{ id: "2:1" }],
            },
          },
        },
      });

      const result = await getNodeDetails({
        file_key: "abc123",
        node_ids: ["1:1"],
      });

      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("### Node: Header");
      expect(result.content[0].text).toContain("**Type:** FRAME");
      expect(result.content[0].text).toContain("**Visible:** true");
      expect(result.content[0].text).toContain("**Children:** 1");
    });

    it("should handle multiple nodes", async () => {
      mockGetNodes.mockResolvedValueOnce({
        nodes: {
          "1:1": { document: { id: "1:1", name: "Node A", type: "FRAME" } },
          "1:2": { document: { id: "1:2", name: "Node B", type: "TEXT" } },
        },
      });

      const result = await getNodeDetails({
        file_key: "abc123",
        node_ids: ["1:1", "1:2"],
      });

      expect(result.content[0].text).toContain("Node A");
      expect(result.content[0].text).toContain("Node B");
    });

    it('should return "No nodes found" when empty', async () => {
      mockGetNodes.mockResolvedValueOnce({ nodes: {} });

      const result = await getNodeDetails({
        file_key: "abc123",
        node_ids: ["nonexistent"],
      });

      expect(result.content[0].text).toBe("No nodes found");
    });
  });

  describe("searchNodes", () => {
    it("should find nodes matching query", async () => {
      mockGetFile.mockResolvedValueOnce({
        document: {
          id: "0:0",
          name: "Document",
          type: "DOCUMENT",
          children: [
            { id: "1:1", name: "Header Button", type: "FRAME" },
            { id: "1:2", name: "Footer", type: "FRAME" },
            { id: "1:3", name: "Button Label", type: "TEXT" },
          ],
        },
      });

      const result = await searchNodes({
        file_key: "abc123",
        query: "button",
      });

      expect(result.content[0].text).toContain("Found 2 nodes");
      expect(result.content[0].text).toContain("Header Button");
      expect(result.content[0].text).toContain("Button Label");
      expect(result.content[0].text).not.toContain("Footer");
    });

    it("should filter by node_type", async () => {
      mockGetFile.mockResolvedValueOnce({
        document: {
          id: "0:0",
          name: "Document",
          type: "DOCUMENT",
          children: [
            { id: "1:1", name: "Test Frame", type: "FRAME" },
            { id: "1:2", name: "Test Text", type: "TEXT" },
          ],
        },
      });

      const result = await searchNodes({
        file_key: "abc123",
        query: "test",
        node_type: "TEXT",
      });

      expect(result.content[0].text).toContain("Found 1 nodes");
      expect(result.content[0].text).toContain("Test Text");
      expect(result.content[0].text).not.toContain("Test Frame");
    });

    it("should handle no matches", async () => {
      mockGetFile.mockResolvedValueOnce({
        document: {
          id: "0:0",
          name: "Document",
          type: "DOCUMENT",
          children: [],
        },
      });

      const result = await searchNodes({
        file_key: "abc123",
        query: "nonexistent",
      });

      expect(result.content[0].text).toContain("Found 0 nodes");
      expect(result.content[0].text).toContain("No matches found");
    });
  });

  describe("getComponents", () => {
    it("should list components with details", async () => {
      mockGetFileComponents.mockResolvedValueOnce({
        meta: {
          components: [
            {
              name: "Button",
              node_id: "1:1",
              key: "btn-001",
              description: "Primary button",
            },
            {
              name: "Input",
              node_id: "1:2",
              key: "inp-001",
              description: "",
            },
          ],
        },
      });

      const result = await getComponents({ file_key: "abc123" });

      expect(result.content[0].text).toContain("# Components");
      expect(result.content[0].text).toContain("Total: 2");
      expect(result.content[0].text).toContain("**Button**");
      expect(result.content[0].text).toContain("Primary button");
      expect(result.content[0].text).toContain("**Input**");
    });

    it("should handle no components", async () => {
      mockGetFileComponents.mockResolvedValueOnce({
        meta: { components: [] },
      });

      const result = await getComponents({ file_key: "abc123" });

      expect(result.content[0].text).toContain("Total: 0");
      expect(result.content[0].text).toContain("No components found");
    });
  });

  describe("getStyles", () => {
    it("should list styles with details", async () => {
      mockGetFileStyles.mockResolvedValueOnce({
        meta: {
          styles: {
            "style-1": {
              name: "Primary Blue",
              style_type: "FILL",
              key: "color-001",
              description: "Brand color",
            },
          },
        },
      });

      const result = await getStyles({ file_key: "abc123" });

      expect(result.content[0].text).toContain("# Styles");
      expect(result.content[0].text).toContain("Total: 1");
      expect(result.content[0].text).toContain("**Primary Blue** (FILL)");
      expect(result.content[0].text).toContain("Brand color");
    });

    it("should handle no styles", async () => {
      mockGetFileStyles.mockResolvedValueOnce({
        meta: { styles: {} },
      });

      const result = await getStyles({ file_key: "abc123" });

      expect(result.content[0].text).toContain("Total: 0");
      expect(result.content[0].text).toContain("No styles found");
    });
  });

  describe("getVariables", () => {
    it("should list variable collections", async () => {
      mockGetLocalVariables.mockResolvedValueOnce({
        meta: {
          variableCollections: {
            "coll-1": {
              name: "Colors",
              modes: [{ name: "Light" }, { name: "Dark" }],
            },
          },
        },
      });

      const result = await getVariables({ file_key: "abc123" });

      expect(result.content[0].text).toContain("# Variables");
      expect(result.content[0].text).toContain("## Colors");
      expect(result.content[0].text).toContain("Modes: Light, Dark");
    });

    it("should handle no variable collections", async () => {
      mockGetLocalVariables.mockResolvedValueOnce({
        meta: { variableCollections: {} },
      });

      const result = await getVariables({ file_key: "abc123" });

      expect(result.content[0].text).toContain("No variable collections found");
    });
  });

  describe("getComments", () => {
    it("should list comments with details", async () => {
      mockGetComments.mockResolvedValueOnce({
        comments: [
          {
            user: { handle: "designer1" },
            created_at: "2024-01-15T10:00:00Z",
            message: "Please review this design",
            client_meta: { node_id: "1:1" },
          },
        ],
      });

      const result = await getComments({ file_key: "abc123" });

      expect(result.content[0].text).toContain("# Comments");
      expect(result.content[0].text).toContain("Total: 1");
      expect(result.content[0].text).toContain("designer1");
      expect(result.content[0].text).toContain("Please review this design");
    });

    it("should handle no comments", async () => {
      mockGetComments.mockResolvedValueOnce({ comments: [] });

      const result = await getComments({ file_key: "abc123" });

      expect(result.content[0].text).toContain("Total: 0");
      expect(result.content[0].text).toContain("No comments found");
    });
  });

  describe("getFileVersions", () => {
    it("should list versions with details", async () => {
      mockGetVersions.mockResolvedValueOnce({
        versions: [
          {
            label: "v1.0",
            created_at: "2024-01-15T10:00:00Z",
            user: { handle: "designer1" },
            description: "Initial release",
          },
        ],
      });

      const result = await getFileVersions({
        file_key: "abc123",
        page_size: 10,
      });

      expect(result.content[0].text).toContain("# Version History");
      expect(result.content[0].text).toContain("Showing 1 versions");
      expect(result.content[0].text).toContain("**v1.0**");
      expect(result.content[0].text).toContain("designer1");
      expect(result.content[0].text).toContain("Initial release");
    });

    it("should pass page_size to client", async () => {
      mockGetVersions.mockResolvedValueOnce({ versions: [] });

      await getFileVersions({ file_key: "abc123", page_size: 5 });

      expect(mockGetVersions).toHaveBeenCalledWith("abc123", 5);
    });

    it("should handle no versions", async () => {
      mockGetVersions.mockResolvedValueOnce({ versions: [] });

      const result = await getFileVersions({
        file_key: "abc123",
        page_size: 10,
      });

      expect(result.content[0].text).toContain("Showing 0 versions");
      expect(result.content[0].text).toContain("No versions found");
    });
  });
});
