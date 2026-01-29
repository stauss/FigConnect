import { figmaClient } from "../figma/client.js";
import { ExportNodeInput, ToolResponse } from "../types.js";
import { logger } from "../logger.js";
import { getFileKey } from "./file-detection.js";

export async function exportNode(
  input: ExportNodeInput,
): Promise<ToolResponse> {
  try {
    const fileKey = await getFileKey(input.file_key);
    logger.info(
      `Exporting ${input.node_ids.length} nodes as ${input.format} from ${fileKey}`,
    );

    const response = (await figmaClient.getImages(
      fileKey,
      input.node_ids,
      input.format,
      input.scale,
    )) as any;

    if (response.err) {
      throw new Error(response.err);
    }

    const images = Object.entries(response.images || {})
      .map(([id, url]: [string, any]) => {
        return `- Node ${id}: ${url}`;
      })
      .join("\n");

    return {
      content: [
        {
          type: "text",
          text: `# Exported ${input.format.toUpperCase()} Images\n\nScale: ${input.scale}x\n\n${images}`,
        },
      ],
    };
  } catch (error: any) {
    logger.error("Error exporting nodes:", error);
    return {
      content: [{ type: "text", text: `Error: ${error.message}` }],
      isError: true,
    };
  }
}
