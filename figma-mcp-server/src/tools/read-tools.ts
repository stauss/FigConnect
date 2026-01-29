import { figmaClient } from "../figma/client.js";
import { findNodes, formatNodeTree, flattenNodes } from "../figma/utils.js";
import {
  GetFileStructureInput,
  GetNodeDetailsInput,
  SearchNodesInput,
  GetComponentsInput,
  GetStylesInput,
  GetVariablesInput,
  GetCommentsInput,
  GetFileVersionsInput,
  ToolResponse,
} from "../types.js";
import { logger } from "../logger.js";
import { getFileKey } from "./file-detection.js";
import { cacheManager } from "../cache/manager.js";

export async function getFileStructure(
  input: GetFileStructureInput,
): Promise<ToolResponse> {
  try {
    const fileKey = await getFileKey(input.file_key);
    const depth = input.depth || 5;
    const cacheKey = `file_structure:${fileKey}:${depth}`;

    // Check cache first
    const cached = cacheManager.get<any>(cacheKey);
    if (cached) {
      logger.info(`Using cached file structure: ${fileKey}`);
      return cached;
    }

    logger.info(`Getting file structure: ${fileKey}`);
    const file = (await figmaClient.getFile(fileKey, depth)) as any;

    const treeView = formatNodeTree(file.document, 0, depth);

    const result: ToolResponse = {
      content: [
        {
          type: "text",
          text: `# File: ${file.name}\n\nLast Modified: ${file.lastModified}\n\n## Structure:\n\n${treeView}`,
        },
      ],
    };

    // Cache the result
    const { CONFIG } = await import("../config.js");
    cacheManager.set(cacheKey, result, CONFIG.cache.ttlFileStructure);

    return result;
  } catch (error: any) {
    logger.error("Error getting file structure:", error);
    return {
      content: [{ type: "text", text: `Error: ${error.message}` }],
      isError: true,
    };
  }
}

export async function getNodeDetails(
  input: GetNodeDetailsInput,
): Promise<ToolResponse> {
  try {
    const fileKey = await getFileKey(input.file_key);
    const nodeIdsKey = input.node_ids.sort().join(",");
    const cacheKey = `node_details:${fileKey}:${nodeIdsKey}`;

    // Check cache first
    const cached = cacheManager.get<ToolResponse>(cacheKey);
    if (cached) {
      logger.info(`Using cached node details: ${fileKey}`);
      return cached;
    }

    logger.info(
      `Getting node details: ${input.node_ids.length} nodes from ${fileKey}`,
    );

    const response = (await figmaClient.getNodes(
      fileKey,
      input.node_ids,
    )) as any;

    const details = Object.entries(response.nodes || {})
      .map(([id, data]: [string, any]) => {
        const node = data.document;
        return `### Node: ${node.name} (${node.id})

**Type:** ${node.type}
**Visible:** ${node.visible !== false}
${node.children ? `**Children:** ${node.children.length}` : ""}

**Properties:**
\`\`\`json
${JSON.stringify(node, null, 2)}
\`\`\`
`;
      })
      .join("\n\n---\n\n");

    const result: ToolResponse = {
      content: [
        {
          type: "text",
          text: details || "No nodes found",
        },
      ],
    };

    // Cache the result
    const { CONFIG } = await import("../config.js");
    cacheManager.set(cacheKey, result, CONFIG.cache.ttlNodeDetails);

    return result;
  } catch (error: any) {
    logger.error("Error getting node details:", error);
    return {
      content: [{ type: "text", text: `Error: ${error.message}` }],
      isError: true,
    };
  }
}

export async function searchNodes(
  input: SearchNodesInput,
): Promise<ToolResponse> {
  try {
    const fileKey = await getFileKey(input.file_key);
    logger.info(`Searching nodes: "${input.query}" in ${fileKey}`);

    const file = (await figmaClient.getFile(fileKey)) as any;
    const allNodes = flattenNodes(file.document);

    const matches = allNodes.filter((node) => {
      const nameMatch = node.name
        .toLowerCase()
        .includes(input.query.toLowerCase());
      const typeMatch = input.node_type
        ? node.type === input.node_type.toUpperCase()
        : true;
      return nameMatch && typeMatch;
    });

    const results = matches
      .map((node) => `- [${node.type}] ${node.name} (ID: ${node.id})`)
      .join("\n");

    return {
      content: [
        {
          type: "text",
          text: `# Search Results: "${input.query}"\n\nFound ${matches.length} nodes:\n\n${results || "No matches found"}`,
        },
      ],
    };
  } catch (error: any) {
    logger.error("Error searching nodes:", error);
    return {
      content: [{ type: "text", text: `Error: ${error.message}` }],
      isError: true,
    };
  }
}

export async function getComponents(
  input: GetComponentsInput,
): Promise<ToolResponse> {
  try {
    const fileKey = await getFileKey(input.file_key);
    logger.info(`Getting components from ${fileKey}`);

    const response = (await figmaClient.getFileComponents(fileKey)) as any;

    const components = (response.meta?.components || [])
      .map(
        (comp: any) =>
          `- **${comp.name}**\n  - ID: ${comp.node_id}\n  - Key: ${comp.key}\n  - Description: ${comp.description || "None"}`,
      )
      .join("\n\n");

    return {
      content: [
        {
          type: "text",
          text: `# Components\n\nTotal: ${response.meta?.components?.length || 0}\n\n${components || "No components found"}`,
        },
      ],
    };
  } catch (error: any) {
    logger.error("Error getting components:", error);
    return {
      content: [{ type: "text", text: `Error: ${error.message}` }],
      isError: true,
    };
  }
}

export async function getStyles(input: GetStylesInput): Promise<ToolResponse> {
  try {
    const fileKey = await getFileKey(input.file_key);
    logger.info(`Getting styles from ${fileKey}`);

    const response = (await figmaClient.getFileStyles(fileKey)) as any;

    const styles = Object.entries(response.meta?.styles || {})
      .map(([id, style]: [string, any]) => {
        return `- **${style.name}** (${style.style_type})\n  - ID: ${id}\n  - Key: ${style.key}\n  - Description: ${style.description || "None"}`;
      })
      .join("\n\n");

    return {
      content: [
        {
          type: "text",
          text: `# Styles\n\nTotal: ${Object.keys(response.meta?.styles || {}).length}\n\n${styles || "No styles found"}`,
        },
      ],
    };
  } catch (error: any) {
    logger.error("Error getting styles:", error);
    return {
      content: [{ type: "text", text: `Error: ${error.message}` }],
      isError: true,
    };
  }
}

export async function getVariables(
  input: GetVariablesInput,
): Promise<ToolResponse> {
  try {
    const fileKey = await getFileKey(input.file_key);
    logger.info(`Getting variables from ${fileKey}`);

    const response = (await figmaClient.getLocalVariables(fileKey)) as any;

    const collections = Object.entries(response.meta?.variableCollections || {})
      .map(([id, collection]: [string, any]) => {
        return `## ${collection.name}\n\nID: ${id}\nModes: ${collection.modes?.map((m: any) => m.name).join(", ") || "None"}`;
      })
      .join("\n\n");

    return {
      content: [
        {
          type: "text",
          text: `# Variables\n\n${collections || "No variable collections found"}`,
        },
      ],
    };
  } catch (error: any) {
    logger.error("Error getting variables:", error);
    return {
      content: [{ type: "text", text: `Error: ${error.message}` }],
      isError: true,
    };
  }
}

export async function getComments(
  input: GetCommentsInput,
): Promise<ToolResponse> {
  try {
    const fileKey = await getFileKey(input.file_key);
    logger.info(`Getting comments from ${fileKey}`);

    const response = (await figmaClient.getComments(fileKey)) as any;

    const comments = (response.comments || [])
      .map((comment: any) => {
        return `**${comment.user.handle}** (${new Date(comment.created_at).toLocaleString()})\n\n${comment.message}\n\nNode: ${comment.client_meta?.node_id || "N/A"}`;
      })
      .join("\n\n---\n\n");

    return {
      content: [
        {
          type: "text",
          text: `# Comments\n\nTotal: ${response.comments?.length || 0}\n\n${comments || "No comments found"}`,
        },
      ],
    };
  } catch (error: any) {
    logger.error("Error getting comments:", error);
    return {
      content: [{ type: "text", text: `Error: ${error.message}` }],
      isError: true,
    };
  }
}

export async function getFileVersions(
  input: GetFileVersionsInput,
): Promise<ToolResponse> {
  try {
    const fileKey = await getFileKey(input.file_key);
    logger.info(`Getting versions from ${fileKey}`);

    const response = (await figmaClient.getVersions(
      fileKey,
      input.page_size,
    )) as any;

    const versions = (response.versions || [])
      .map((version: any) => {
        return `- **${version.label || "Unlabeled"}**\n  - Created: ${new Date(version.created_at).toLocaleString()}\n  - User: ${version.user.handle}\n  - Description: ${version.description || "None"}`;
      })
      .join("\n\n");

    return {
      content: [
        {
          type: "text",
          text: `# Version History\n\nShowing ${response.versions?.length || 0} versions:\n\n${versions || "No versions found"}`,
        },
      ],
    };
  } catch (error: any) {
    logger.error("Error getting versions:", error);
    return {
      content: [{ type: "text", text: `Error: ${error.message}` }],
      isError: true,
    };
  }
}
