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

export async function getFileStructure(
  input: GetFileStructureInput,
): Promise<ToolResponse> {
  try {
    logger.info(`Getting file structure: ${input.file_key}`);

    const file = (await figmaClient.getFile(
      input.file_key,
      input.depth,
    )) as any;

    const treeView = formatNodeTree(file.document, 0, input.depth || 5);

    return {
      content: [
        {
          type: "text",
          text: `# File: ${file.name}\n\nLast Modified: ${file.lastModified}\n\n## Structure:\n\n${treeView}`,
        },
      ],
    };
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
    logger.info(
      `Getting node details: ${input.node_ids.length} nodes from ${input.file_key}`,
    );

    const response = (await figmaClient.getNodes(
      input.file_key,
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

    return {
      content: [
        {
          type: "text",
          text: details || "No nodes found",
        },
      ],
    };
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
    logger.info(`Searching nodes: "${input.query}" in ${input.file_key}`);

    const file = (await figmaClient.getFile(input.file_key)) as any;
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
    logger.info(`Getting components from ${input.file_key}`);

    const response = (await figmaClient.getFileComponents(
      input.file_key,
    )) as any;

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
    logger.info(`Getting styles from ${input.file_key}`);

    const response = (await figmaClient.getFileStyles(input.file_key)) as any;

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
    logger.info(`Getting variables from ${input.file_key}`);

    const response = (await figmaClient.getLocalVariables(
      input.file_key,
    )) as any;

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
    logger.info(`Getting comments from ${input.file_key}`);

    const response = (await figmaClient.getComments(input.file_key)) as any;

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
    logger.info(`Getting versions from ${input.file_key}`);

    const response = (await figmaClient.getVersions(
      input.file_key,
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
