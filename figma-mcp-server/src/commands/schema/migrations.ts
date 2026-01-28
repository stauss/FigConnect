import { BaseCommand } from "../types.js";
import { MigrationFunction } from "./registry.js";

/**
 * Migration functions for command schema versions
 * Add migrations here as schemas evolve
 */

/**
 * Example: Migrate create_frame from v1 to v2
 * (This is a placeholder - no actual migration needed for v1)
 */
export const createFrameV1ToV2: MigrationFunction = (
  command: BaseCommand,
): BaseCommand => {
  // Example: Add new optional field in v2
  // For now, just return as-is since v1 is current
  return command;
};

/**
 * Register default migrations
 * Call this during initialization to set up migration paths
 */
export function registerDefaultMigrations(): void {
  // Future: Register migrations as schemas evolve
  // For MVP, no migrations needed (all commands are v1)
}
