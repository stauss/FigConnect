/**
 * Tests for figma/utils.ts utility functions
 * These are pure functions that can be tested without mocking
 */

import {
  findNodes,
  flattenNodes,
  formatNodeTree,
  getNodeSummary,
} from "../src/figma/utils.js";
import { FigmaNode } from "../src/types.js";

// Mock node tree for testing
const mockNodeTree: FigmaNode = {
  id: "0:0",
  name: "Document",
  type: "DOCUMENT",
  children: [
    {
      id: "1:1",
      name: "Page 1",
      type: "CANVAS",
      children: [
        {
          id: "2:1",
          name: "Header Frame",
          type: "FRAME",
          children: [
            { id: "3:1", name: "Logo", type: "RECTANGLE" },
            { id: "3:2", name: "Title", type: "TEXT" },
          ],
        },
        {
          id: "2:2",
          name: "Button",
          type: "COMPONENT",
          children: [{ id: "3:3", name: "Button Label", type: "TEXT" }],
        },
      ],
    },
  ],
};

describe("findNodes", () => {
  it("should find nodes matching predicate", () => {
    const textNodes = findNodes(mockNodeTree, (node) => node.type === "TEXT");

    expect(textNodes).toHaveLength(2);
    expect(textNodes[0].name).toBe("Title");
    expect(textNodes[1].name).toBe("Button Label");
  });

  it("should find nodes by name", () => {
    const logoNodes = findNodes(mockNodeTree, (node) => node.name === "Logo");

    expect(logoNodes).toHaveLength(1);
    expect(logoNodes[0].id).toBe("3:1");
  });

  it("should return empty array when no matches", () => {
    const noMatch = findNodes(mockNodeTree, (node) => node.type === "ELLIPSE");

    expect(noMatch).toHaveLength(0);
  });

  it("should respect maxDepth parameter", () => {
    // At depth 0, only root node is searched
    const atDepth0 = findNodes(mockNodeTree, () => true, 0);
    expect(atDepth0).toHaveLength(1);

    // At depth 1, root + first level children
    const atDepth1 = findNodes(mockNodeTree, () => true, 1);
    expect(atDepth1).toHaveLength(2); // Document + Page 1
  });

  it("should find component nodes", () => {
    const components = findNodes(
      mockNodeTree,
      (node) => node.type === "COMPONENT",
    );

    expect(components).toHaveLength(1);
    expect(components[0].name).toBe("Button");
  });
});

describe("flattenNodes", () => {
  it("should flatten entire tree by default", () => {
    const flattened = flattenNodes(mockNodeTree);

    // Document + Page 1 + Header Frame + Logo + Title + Button + Button Label = 7
    expect(flattened).toHaveLength(7);
  });

  it("should respect maxDepth parameter", () => {
    const atDepth1 = flattenNodes(mockNodeTree, 1);

    // Document (depth 0) + Page 1 (depth 1) = 2
    expect(atDepth1).toHaveLength(2);
  });

  it("should include root node first", () => {
    const flattened = flattenNodes(mockNodeTree);

    expect(flattened[0].id).toBe("0:0");
    expect(flattened[0].name).toBe("Document");
  });

  it("should handle nodes without children", () => {
    const leafNode: FigmaNode = { id: "1:1", name: "Leaf", type: "RECTANGLE" };
    const flattened = flattenNodes(leafNode);

    expect(flattened).toHaveLength(1);
    expect(flattened[0].name).toBe("Leaf");
  });
});

describe("formatNodeTree", () => {
  it("should format tree with indentation", () => {
    const formatted = formatNodeTree(mockNodeTree);

    expect(formatted).toContain("[DOCUMENT] Document (0:0)");
    expect(formatted).toContain("[CANVAS] Page 1 (1:1)");
    expect(formatted).toContain("[FRAME] Header Frame (2:1)");
  });

  it("should include node type, name, and id", () => {
    const simpleNode: FigmaNode = { id: "1:1", name: "Test", type: "FRAME" };
    const formatted = formatNodeTree(simpleNode);

    expect(formatted).toBe("[FRAME] Test (1:1)\n");
  });

  it("should respect maxDepth parameter", () => {
    const formatted = formatNodeTree(mockNodeTree, 0, 1);

    // Should have Document and Page 1, but not deeper nodes
    expect(formatted).toContain("[DOCUMENT] Document");
    expect(formatted).toContain("[CANVAS] Page 1");
    expect(formatted).not.toContain("[FRAME] Header Frame");
  });

  it("should use proper indentation for nested nodes", () => {
    const formatted = formatNodeTree(mockNodeTree, 0, 5);
    const lines = formatted.split("\n").filter(Boolean);

    // Check indentation increases
    expect(lines[0]).toMatch(/^\[DOCUMENT\]/); // No indent
    expect(lines[1]).toMatch(/^  \[CANVAS\]/); // 2 spaces
  });
});

describe("getNodeSummary", () => {
  it("should extract basic node info", () => {
    const summary = getNodeSummary(mockNodeTree);

    expect(summary.id).toBe("0:0");
    expect(summary.name).toBe("Document");
    expect(summary.type).toBe("DOCUMENT");
    expect(summary.childCount).toBe(1);
  });

  it("should return 0 childCount for leaf nodes", () => {
    const leafNode: FigmaNode = { id: "1:1", name: "Leaf", type: "RECTANGLE" };
    const summary = getNodeSummary(leafNode);

    expect(summary.childCount).toBe(0);
  });

  it("should count direct children only", () => {
    const nodeWithChildren = mockNodeTree.children![0]; // Page 1
    const summary = getNodeSummary(nodeWithChildren);

    // Page 1 has 2 direct children: Header Frame and Button
    expect(summary.childCount).toBe(2);
  });
});
