import { z, ZodSchema } from "zod";
import { BaseCommand } from "../types.js";
import { logger } from "../../logger.js";

/**
 * Migration function to transform commands between versions
 */
export type MigrationFunction = (command: any) => any;

/**
 * Command schema definition with versioning support
 */
export interface CommandSchema {
  type: string;
  version: string;
  schema: ZodSchema;
  migration?: MigrationFunction; // v1 → v2 transformer
}

/**
 * Schema registry for versioned command schemas
 * Enables command schema evolution without breaking old commands
 */
export interface CommandSchemaRegistry {
  register(schema: CommandSchema): void;
  getSchema(commandType: string, version: string): CommandSchema | null;
  migrate(
    command: BaseCommand,
    fromVersion: string,
    toVersion: string,
  ): BaseCommand | null;
  getLatestVersion(commandType: string): string | null;
  getAllVersions(commandType: string): string[];
}

/**
 * Implementation of command schema registry
 */
export class CommandSchemaRegistryImpl implements CommandSchemaRegistry {
  private schemas: Map<string, Map<string, CommandSchema>> = new Map();

  /**
   * Register a command schema
   */
  register(schema: CommandSchema): void {
    if (!this.schemas.has(schema.type)) {
      this.schemas.set(schema.type, new Map());
    }

    const versions = this.schemas.get(schema.type)!;
    versions.set(schema.version, schema);

    logger.debug(`Registered schema: ${schema.type} v${schema.version}`);
  }

  /**
   * Get a specific schema version
   */
  getSchema(commandType: string, version: string): CommandSchema | null {
    const versions = this.schemas.get(commandType);
    if (!versions) {
      return null;
    }

    return versions.get(version) || null;
  }

  /**
   * Migrate a command from one version to another
   */
  migrate(
    command: BaseCommand,
    fromVersion: string,
    toVersion: string,
  ): BaseCommand | null {
    if (fromVersion === toVersion) {
      return command;
    }

    const fromSchema = this.getSchema(command.command, fromVersion);
    const toSchema = this.getSchema(command.command, toVersion);

    if (!fromSchema || !toSchema) {
      logger.warn(
        `Cannot migrate ${command.command} from v${fromVersion} to v${toVersion}: schemas not found`,
      );
      return null;
    }

    // If migration function exists, use it
    if (toSchema.migration) {
      try {
        const migrated = toSchema.migration(command);
        logger.debug(
          `Migrated ${command.command} from v${fromVersion} to v${toVersion}`,
        );
        return migrated as BaseCommand;
      } catch (error) {
        logger.error(`Migration failed for ${command.command}:`, error);
        return null;
      }
    }

    // No migration function - return as-is (may fail validation later)
    logger.warn(
      `No migration function for ${command.command} v${fromVersion} → v${toVersion}`,
    );
    return command;
  }

  /**
   * Get the latest version of a command type
   */
  getLatestVersion(commandType: string): string | null {
    const versions = this.schemas.get(commandType);
    if (!versions || versions.size === 0) {
      return null;
    }

    // Sort versions and return latest
    const versionStrings = Array.from(versions.keys());
    versionStrings.sort((a, b) => {
      // Simple version comparison (assumes semantic versioning)
      const aParts = a.split(".").map(Number);
      const bParts = b.split(".").map(Number);
      for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
        const aPart = aParts[i] || 0;
        const bPart = bParts[i] || 0;
        if (aPart !== bPart) {
          return bPart - aPart; // Descending order
        }
      }
      return 0;
    });

    return versionStrings[0] || null;
  }

  /**
   * Get all versions for a command type
   */
  getAllVersions(commandType: string): string[] {
    const versions = this.schemas.get(commandType);
    if (!versions) {
      return [];
    }

    return Array.from(versions.keys());
  }
}

// Singleton instance
export const commandSchemaRegistry = new CommandSchemaRegistryImpl();
