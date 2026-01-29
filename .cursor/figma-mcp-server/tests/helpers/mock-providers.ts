/**
 * Mock providers for testing AI router and plugin registry
 */

import { BaseCommand } from "../../src/commands/types.js";
import { AIProvider, Intent, AIContext } from "../../src/ai/router.js";
import { ToolPlugin, CommandResult } from "../../src/plugins/registry.js";

/**
 * Create a mock AI provider for testing
 */
export function createMockAIProvider(
  name: string = "mock-provider",
): AIProvider {
  return {
    name,
    generateIntent: async (
      message: string,
      context: AIContext,
    ): Promise<Intent> => {
      return {
        action: "create",
        target: context.targetNodeId,
        parameters: { message },
        confidence: 0.9,
      };
    },
    generateCommands: async (
      intent: Intent,
      context: AIContext,
    ): Promise<BaseCommand[]> => {
      return [
        {
          type: "mcp-command",
          version: "1.0",
          id: `cmd-${Date.now()}`,
          command: "create_frame",
          params: {
            name: "Generated Frame",
            width: 100,
            height: 100,
          },
          timestamp: new Date().toISOString(),
        },
      ];
    },
  };
}

/**
 * Create a mock tool plugin for testing
 */
export function createMockToolPlugin(
  id: string = "mock-plugin",
  commandTypes: string[] = ["create_frame"],
): ToolPlugin {
  return {
    id,
    name: `Mock Plugin ${id}`,
    version: "1.0",
    commandTypes,
    execute: async (command: BaseCommand): Promise<CommandResult> => {
      return {
        success: true,
        result: {
          nodeId: "1:2",
          name: "Created Node",
        },
      };
    },
  };
}

/**
 * Create a mock plugin that fails
 */
export function createMockFailingPlugin(
  id: string = "failing-plugin",
): ToolPlugin {
  return {
    id,
    name: "Failing Plugin",
    version: "1.0",
    commandTypes: ["create_frame"],
    execute: async (): Promise<CommandResult> => {
      return {
        success: false,
        error: {
          code: "PLUGIN_ERROR",
          message: "Mock plugin failure",
        },
      };
    },
  };
}
