import { FigmaNode } from '../types.js';

/**
 * Traverse node tree and collect nodes matching predicate
 */
export function findNodes(
  node: FigmaNode,
  predicate: (node: FigmaNode) => boolean,
  maxDepth: number = 10,
  currentDepth: number = 0
): FigmaNode[] {
  const results: FigmaNode[] = [];

  if (currentDepth > maxDepth) {
    return results;
  }

  if (predicate(node)) {
    results.push(node);
  }

  if (node.children) {
    for (const child of node.children) {
      results.push(...findNodes(child, predicate, maxDepth, currentDepth + 1));
    }
  }

  return results;
}

/**
 * Flatten node tree to specified depth
 */
export function flattenNodes(
  node: FigmaNode,
  maxDepth: number = 5,
  currentDepth: number = 0
): FigmaNode[] {
  const nodes: FigmaNode[] = [node];

  if (currentDepth >= maxDepth || !node.children) {
    return nodes;
  }

  for (const child of node.children) {
    nodes.push(...flattenNodes(child, maxDepth, currentDepth + 1));
  }

  return nodes;
}

/**
 * Format node tree as indented text
 */
export function formatNodeTree(
  node: FigmaNode,
  indent: number = 0,
  maxDepth: number = 5
): string {
  if (indent > maxDepth) {
    return '';
  }

  const prefix = '  '.repeat(indent);
  let output = `${prefix}[${node.type}] ${node.name} (${node.id})\n`;

  if (node.children) {
    for (const child of node.children) {
      output += formatNodeTree(child, indent + 1, maxDepth);
    }
  }

  return output;
}

/**
 * Extract summary info from node
 */
export function getNodeSummary(node: FigmaNode) {
  return {
    id: node.id,
    name: node.name,
    type: node.type,
    childCount: node.children?.length || 0,
  };
}
