import {
  database,
  CommandHistoryEntry,
  ConversationLogEntry,
  HistoryFilters,
  ConversationFilters,
} from "./database.js";
import { logger } from "../logger.js";
import { v4 as uuidv4 } from "uuid";
import { writeFile } from "fs/promises";
import { join } from "path";
import { homedir } from "os";

/**
 * History store for commands and conversations
 */
export class HistoryStore {
  /**
   * Add command to history
   */
  async addCommand(
    entry: Omit<CommandHistoryEntry, "id" | "timestamp">,
  ): Promise<string> {
    const historyEntry: CommandHistoryEntry = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      ...entry,
    };

    await database.addCommandHistory(historyEntry);
    logger.debug(`Command history added: ${historyEntry.id}`);

    return historyEntry.id;
  }

  /**
   * Update command status
   */
  async updateCommandStatus(
    commandId: string,
    status: CommandHistoryEntry["status"],
    result?: any,
    error?: string,
    executionTime?: number,
  ): Promise<void> {
    // For MVP: Read all, update, write back
    // This is inefficient but works for small datasets
    const history = await database.getCommandHistory({ limit: 10000 });
    const entryIndex = history.findIndex((h) => h.commandId === commandId);

    if (entryIndex >= 0) {
      const entry = history[entryIndex];
      entry.status = status;
      if (result !== undefined) entry.result = result;
      if (error !== undefined) entry.error = error;
      if (executionTime !== undefined) entry.executionTime = executionTime;

      // Update in place (database will handle persistence on next write)
      // For JSON storage, we need to rewrite the file
      // This is a limitation of JSON storage - would be better with SQLite
      history[entryIndex] = entry;

      // Re-add all entries (inefficient but works for MVP)
      // In production with SQLite, we'd do an UPDATE query
      const { APP_CONFIG } = await import("../app-config.js");
      const HISTORY_FILE = join(
        homedir(),
        APP_CONFIG.storageDir,
        "history.json",
      );
      await writeFile(HISTORY_FILE, JSON.stringify(history, null, 2), "utf-8");
    } else {
      logger.warn(
        `Command ${commandId} not found in history for status update`,
      );
    }
  }

  /**
   * Get command history
   */
  async getCommandHistory(
    filters?: HistoryFilters,
  ): Promise<CommandHistoryEntry[]> {
    return database.getCommandHistory(filters);
  }

  /**
   * Add conversation log entry
   */
  async addConversation(
    fileKey: string,
    message: string,
    author: string,
    commentId?: string,
    metadata?: Record<string, any>,
  ): Promise<string> {
    const entry: ConversationLogEntry = {
      id: uuidv4(),
      fileKey,
      message,
      author,
      commentId,
      timestamp: new Date().toISOString(),
      metadata,
    };

    await database.addConversationLog(entry);
    logger.debug(`Conversation log added: ${entry.id}`);

    return entry.id;
  }

  /**
   * Get conversation log
   */
  async getConversations(
    filters?: ConversationFilters,
  ): Promise<ConversationLogEntry[]> {
    return database.getConversationLog(filters);
  }

  /**
   * Link backup to command
   */
  async linkBackupToCommand(
    commandId: string,
    backupId: string,
  ): Promise<void> {
    const history = await database.getCommandHistory();
    const entry = history.find((h) => h.commandId === commandId);
    if (entry) {
      entry.backupId = backupId;
      await database.addCommandHistory(entry);
    }
  }
}

// Singleton instance
export const historyStore = new HistoryStore();
