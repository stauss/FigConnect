import { Logger } from "../utils/logger";
import { appendChild, createNodeResult } from "../utils/nodes";
import type { CommandResult, CreateComponentParams } from "./types";

const logger = new Logger("Component");

/**
 * Execute create_component command
 */
export async function executeCreateComponent(
  params: Record<string, unknown>,
  parent: FrameNode | PageNode | ComponentNode,
): Promise<CommandResult> {
  try {
    const p = params as CreateComponentParams;

    // Create component
    const component = figma.createComponent();

    // Set name
    component.name = p.name;

    // Set description if provided
    if (p.description) {
      component.description = p.description;
    }

    // Set default size
    component.resize(100, 100);

    // Add to parent
    appendChild(parent, component);

    logger.info(`Created component: ${component.name} (${component.id})`);

    return {
      success: true,
      result: {
        ...createNodeResult(component),
        key: component.key,
        description: component.description,
      },
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error("Component creation failed:", error);

    return {
      success: false,
      error: {
        code: "COMPONENT_CREATION_FAILED",
        message,
      },
    };
  }
}
