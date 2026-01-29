/**
 * Capability definition
 * Plugin announces what it can do
 */
export interface Capability {
  id: string;
  name: string;
  commandTypes: string[]; // Commands this capability supports
  version: string;
  metadata?: Record<string, any>;
}

/**
 * Capability registry in plugin
 * Plugin announces capabilities on startup, server routes accordingly
 */
export interface CapabilityRegistry {
  register(capability: Capability): void;
  getCapabilities(): Capability[];
  canExecute(commandType: string): boolean;
  announceCapabilities(): Promise<void>; // POST to bridge server
}

/**
 * Capability registry implementation
 */
export class PluginCapabilityRegistry implements CapabilityRegistry {
  private capabilities: Capability[] = [];
  private announced = false;

  /**
   * Register a capability
   */
  register(capability: Capability): void {
    this.capabilities.push(capability);
    console.log(
      `[Capabilities] Registered: ${capability.name} (${capability.commandTypes.length} command types)`,
    );
  }

  /**
   * Get all registered capabilities
   */
  getCapabilities(): Capability[] {
    return [...this.capabilities];
  }

  /**
   * Check if plugin can execute a command type
   */
  canExecute(commandType: string): boolean {
    return this.capabilities.some((cap) =>
      cap.commandTypes.includes(commandType),
    );
  }

  /**
   * Announce capabilities to bridge server
   * Called during plugin initialization
   */
  async announceCapabilities(): Promise<void> {
    if (this.announced) {
      return; // Already announced
    }

    const bridgeUrl = "http://localhost:3030";
    const capabilities = this.getCapabilities();

    try {
      // POST capabilities to bridge
      const response = await fetch(`${bridgeUrl}/api/capabilities`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pluginId: "figma-mcp-bridge",
          capabilities,
        }),
      });

      if (!response.ok) {
        throw new Error(
          `Failed to announce capabilities: ${response.statusText}`,
        );
      }

      this.announced = true;
      console.log(
        `[Capabilities] Announced ${capabilities.length} capabilities to bridge server`,
      );
    } catch (error) {
      console.error("[Capabilities] Failed to announce capabilities:", error);
      // Don't throw - plugin can still work without capability announcement
    }
  }
}

// Singleton instance
export const capabilityRegistry = new PluginCapabilityRegistry();

// Register default capabilities on module load
capabilityRegistry.register({
  id: "core-manipulation",
  name: "Core Manipulation",
  commandTypes: [
    "create_frame",
    "create_text",
    "create_rectangle",
    "move_node",
    "duplicate_node",
    "delete_node",
    "resize_node",
    "group_nodes",
    "ungroup_nodes",
    "set_properties",
  ],
  version: "1.0",
});

capabilityRegistry.register({
  id: "layout",
  name: "Layout",
  commandTypes: ["apply_auto_layout"],
  version: "1.0",
});

capabilityRegistry.register({
  id: "components",
  name: "Components",
  commandTypes: ["create_component"],
  version: "1.0",
});

capabilityRegistry.register({
  id: "styles",
  name: "Styles",
  commandTypes: ["apply_style"],
  version: "1.0",
});

capabilityRegistry.register({
  id: "comments",
  name: "Comment Operations",
  commandTypes: ["resolve_target_from_comment", "post_comment_reply"],
  version: "1.0",
});
