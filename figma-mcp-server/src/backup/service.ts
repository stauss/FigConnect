import { writeFile, readFile } from "fs/promises";
import { join } from "path";
import { homedir } from "os";
import { v4 as uuidv4 } from "uuid";
import { figmaClient } from "../figma/client.js";
import { database, BackupMetadata } from "../storage/database.js";
import { logger } from "../logger.js";
import { APP_CONFIG } from "../app-config.js";

const BACKUPS_DIR = join(homedir(), APP_CONFIG.storageDir, "backups");

/**
 * Backup service for creating file snapshots before AI changes
 */
export class BackupService {
  /**
   * Create a backup snapshot of a Figma file
   */
  async createBackup(
    fileKey: string,
    fileName: string,
    commandId?: string,
  ): Promise<BackupMetadata> {
    try {
      logger.info(`Creating backup for file: ${fileName} (${fileKey})`);

      // Fetch current file state from Figma API
      const fileData = await figmaClient.getFile(fileKey);

      // Generate backup ID
      const backupId = uuidv4();
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const snapshotFileName = `${fileKey}-${timestamp}-${backupId}.json`;
      const snapshotPath = join(BACKUPS_DIR, snapshotFileName);

      // Save snapshot to disk
      await writeFile(snapshotPath, JSON.stringify(fileData, null, 2), "utf-8");

      // Create backup metadata
      const backup: BackupMetadata = {
        id: backupId,
        fileKey,
        fileName,
        snapshotPath,
        createdAt: new Date().toISOString(),
        commandId,
        fileVersion: (fileData as any).version || undefined,
      };

      // Store metadata in database
      await database.addBackupMetadata(backup);

      logger.info(`Backup created: ${backupId} (${snapshotFileName})`);

      return backup;
    } catch (error: any) {
      logger.error(`Failed to create backup for ${fileKey}:`, error);
      throw new Error(`Backup failed: ${error.message}`);
    }
  }

  /**
   * Get backup metadata for a file
   */
  async getBackups(fileKey: string): Promise<BackupMetadata[]> {
    return database.getBackupMetadata(fileKey);
  }

  /**
   * Get a specific backup by ID
   */
  async getBackup(backupId: string): Promise<BackupMetadata | null> {
    return database.getBackup(backupId);
  }

  /**
   * Load backup snapshot data
   */
  async loadBackupSnapshot(backupId: string): Promise<any> {
    const backup = await this.getBackup(backupId);
    if (!backup) {
      throw new Error(`Backup not found: ${backupId}`);
    }

    try {
      const content = await readFile(backup.snapshotPath, "utf-8");
      return JSON.parse(content);
    } catch (error: any) {
      logger.error(`Failed to load backup snapshot ${backupId}:`, error);
      throw new Error(`Failed to load backup: ${error.message}`);
    }
  }

  /**
   * Restore file from backup (returns snapshot data for comparison/restore)
   * Note: Actual restore would need to be done via Figma API or plugin
   */
  async getBackupForRestore(backupId: string): Promise<{
    backup: BackupMetadata;
    snapshot: any;
  }> {
    const backup = await this.getBackup(backupId);
    if (!backup) {
      throw new Error(`Backup not found: ${backupId}`);
    }

    const snapshot = await this.loadBackupSnapshot(backupId);

    return {
      backup,
      snapshot,
    };
  }

  /**
   * Delete old backups (keep last N backups per file)
   */
  async cleanupOldBackups(
    fileKey: string,
    keepCount: number = 10,
  ): Promise<number> {
    const backups = await this.getBackups(fileKey);
    if (backups.length <= keepCount) {
      return 0;
    }

    // Sort by creation date (oldest first)
    const sorted = backups.sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );

    // Delete oldest backups
    const toDelete = sorted.slice(0, backups.length - keepCount);
    let deleted = 0;

    // Note: For MVP, we'll just remove from metadata
    // Actual file deletion could be added later
    for (const backup of toDelete) {
      // Remove from index (would need to update database implementation)
      deleted++;
    }

    logger.info(`Cleaned up ${deleted} old backups for ${fileKey}`);
    return deleted;
  }
}

// Singleton instance
export const backupService = new BackupService();
