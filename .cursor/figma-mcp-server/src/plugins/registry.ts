import { BaseCommand, CommandResponse } from "../commands/types.js";
import { logger } from "../logger.js";

/**
 * Command result from plugin execution
 */
export interface CommandResult {
  success: boolean;
  result?: any;
  error?: {
    code: string;
    message: string;
    details?: string;
  };
}

/**
 * Tool plugin interface
 * Enables drop-in tool modules (accessibility, token management, etc.)
 */
export interface ToolPlugin {
  id: string;
  name: string;
  version: string;
  commandTypes: string[]; // Commands this plugin handles
  execute(command: BaseCommand): Promise<CommandResult>;
  metadata?: Record<string, any>;
}

/**
 * Plugin registry for extensible tool system
 * Enables "power tools" plugins without code changes
 */
export interface PluginRegistry {
  register(plugin: ToolPlugin): void;
  getPlugins(): ToolPlugin[];
  getPlugin(pluginId: string): ToolPlugin | null;
  canExecute(command: BaseCommand): boolean;
  execute(command: BaseCommand): Promise<CommandResult>;
}

/**
 * Plugin registry implementation
 */
export class PluginRegistryImpl implements PluginRegistry {
  private plugins: Map<string, ToolPlugin> = new Map();
  private commandToPlugin: Map<string, string> = new Map(); // commandType → pluginId

  /**
   * Register a plugin
   */
  register(plugin: ToolPlugin): void {
    this.plugins.set(plugin.id, plugin);

    // Index command types
    for (const commandType of plugin.commandTypes) {
      if (this.commandToPlugin.has(commandType)) {
        logger.warn(
          `Command type ${commandType} already registered by plugin ${this.commandToPlugin.get(commandType)}. Overwriting with ${plugin.id}`,
        );
      }
      this.commandToPlugin.set(commandType, plugin.id);
    }

    logger.info(
      `Registered plugin: ${plugin.name} v${plugin.version} (${plugin.commandTypes.length} command types)`,
    );
  }

  /**
   * Get all registered plugins
   */
  getPlugins(): ToolPlugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Get plugin by ID
   */
  getPlugin(pluginId: string): ToolPlugin | null {
    return this.plugins.get(pluginId) || null;
  }

  /**
   * Check if a command can be executed by any plugin
   */
  canExecute(command: BaseCommand): boolean {
    return this.commandToPlugin.has(command.command);
  }

  /**
   * Execute command via appropriate plugin
   */
  async execute(command: BaseCommand): Promise<CommandResult> {
    const pluginId = this.commandToPlugin.get(command.command);
    if (!pluginId) {
      return {
        success: false,
        error: {
          code: "NO_PLUGIN",
          message: `No plugin registered for command type: ${command.command}`,
        },
      };
    }

    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      return {
        success: false,
        error: {
          code: "PLUGIN_NOT_FOUND",
          message: `Plugin ${pluginId} not found`,
        },
      };
    }

    try {
      logger.debug(`Executing ${command.command} via plugin ${plugin.id}`);
      return await plugin.execute(command);
    } catch (error: any) {
      logger.error(`Plugin ${plugin.id} execution failed:`, error);
      return {
        success: false,
        error: {
          code: "PLUGIN_ERROR",
          message: error.message || "Unknown plugin error",
          details: error.stack,
        },
      };
    }
  }
}

// Singleton instance
export const pluginRegistry: PluginRegistry = new PluginRegistryImpl();
