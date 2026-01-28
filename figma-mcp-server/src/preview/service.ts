import { BaseCommand } from "../commands/types.js";
import { logger } from "../logger.js";

/**
 * Types of node changes
 */
export type NodeChangeType = "create" | "update" | "delete" | "move";

/**
 * Preview of a node change
 */
export interface NodeChange {
  nodeId: string;
  type: NodeChangeType;
  before?: any; // Node state before change
  after?: any; // Node state after change
  description: string; // Human-readable description
}

/**
 * Preview result
 */
export interface PreviewResult {
  changes: NodeChange[];
  affectedNodes: string[];
  warnings: string[];
  canExecute: boolean;
  estimatedDuration?: number; // Estimated execution time in ms
}

/**
 * Preview service for dry-run/preview mode
 * Shows what changes will be made before execution
 */
export interface PreviewService {
  preview(commands: BaseCommand[]): Promise<PreviewResult>;
}

/**
 * Basic preview service implementation
 * For MVP: Simple analysis of commands
 * Future: Actual file state analysis, diff generation
 */
export class BasicPreviewService implements PreviewService {
  async preview(commands: BaseCommand[]): Promise<PreviewResult> {
    const changes: NodeChange[] = [];
    const affectedNodes: Set<string> = new Set();
    const warnings: string[] = [];

    for (const command of commands) {
      const commandChanges = this.analyzeCommand(command);
      changes.push(...commandChanges);

      // Collect affected nodes
      commandChanges.forEach((change) => {
        affectedNodes.add(change.nodeId);
        if (change.before) {
          // Extract node IDs from before state if available
        }
      });

      // Check for warnings
      if (command.command === "delete_node" || command.command === "delete") {
        warnings.push(`Warning: Command will delete nodes`);
      }
    }

    return {
      changes,
      affectedNodes: Array.from(affectedNodes),
      warnings,
      canExecute:
        warnings.length === 0 || warnings.every((w) => w.includes("Warning")), // Can execute if only warnings
      estimatedDuration: commands.length * 100, // Rough estimate: 100ms per command
    };
  }

  /**
   * Analyze a single command and return preview changes
   */
  private analyzeCommand(command: BaseCommand): NodeChange[] {
    const changes: NodeChange[] = [];

    switch (command.command) {
      case "create_frame":
      case "create_text":
      case "create_rectangle":
      case "create_component":
        changes.push({
          nodeId: command.parent || "root",
          type: "create",
          description: `Create ${command.command.replace("create_", "")}`,
          after: command.params,
        });
        break;

      case "move_node":
        changes.push({
          nodeId: command.params.nodeId || command.parent || "unknown",
          type: "move",
          description: `Move node to (${command.params.x}, ${command.params.y})`,
          before: { x: "current", y: "current" },
          after: { x: command.params.x, y: command.params.y },
        });
        break;

      case "delete_node":
      case "delete":
        changes.push({
          nodeId: command.params.nodeId || command.parent || "unknown",
          type: "delete",
          description: "Delete node",
          before: { exists: true },
          after: { exists: false },
        });
        break;

      case "set_properties":
        changes.push({
          nodeId: command.parent || "unknown",
          type: "update",
          description: "Update node properties",
          before: {},
          after: command.params.properties,
        });
        break;

      default:
        changes.push({
          nodeId: command.parent || "unknown",
          type: "update",
          description: `Execute ${command.command}`,
          after: command.params,
        });
    }

    return changes;
  }
}

// Default instance
export const previewService: PreviewService = new BasicPreviewService();
