import { mkdir, readFile, writeFile } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import { logger } from "../logger.js";
import { homedir } from "os";
import { APP_CONFIG } from "../app-config.js";

/**
 * Storage directory path (~/.figyah)
 */
const STORAGE_DIR = join(homedir(), APP_CONFIG.storageDir);
const CONFIG_FILE = join(STORAGE_DIR, "config.json");
const PROJECTS_FILE = join(STORAGE_DIR, "projects.json");
const HISTORY_FILE = join(STORAGE_DIR, "history.json");
const CONVERSATIONS_FILE = join(STORAGE_DIR, "conversations.json");
const BACKUPS_DIR = join(STORAGE_DIR, "backups");

/**
 * Ensure storage directory exists
 */
async function ensureStorageDir(): Promise<void> {
  if (!existsSync(STORAGE_DIR)) {
    await mkdir(STORAGE_DIR, { recursive: true });
    logger.info(`Created storage directory: ${STORAGE_DIR}`);
  }
  if (!existsSync(BACKUPS_DIR)) {
    await mkdir(BACKUPS_DIR, { recursive: true });
    logger.info(`Created backups directory: ${BACKUPS_DIR}`);
  }
}

/**
 * Read JSON file, return default if doesn't exist
 */
async function readJsonFile<T>(filePath: string, defaultValue: T): Promise<T> {
  try {
    if (!existsSync(filePath)) {
      return defaultValue;
    }
    const content = await readFile(filePath, "utf-8");
    return JSON.parse(content) as T;
  } catch (error) {
    logger.error(`Error reading ${filePath}:`, error);
    return defaultValue;
  }
}

/**
 * Write JSON file
 */
async function writeJsonFile<T>(filePath: string, data: T): Promise<void> {
  try {
    await ensureStorageDir();
    await writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    logger.error(`Error writing ${filePath}:`, error);
    throw error;
  }
}

/**
 * Database interface for persistent storage
 */
export interface Database {
  // Config
  getConfig(): Promise<ConfigData>;
  saveConfig(config: ConfigData): Promise<void>;

  // Projects
  getProjectConnections(): Promise<ProjectConnection[]>;
  saveProjectConnection(connection: ProjectConnection): Promise<void>;
  removeProjectConnection(fileKey: string): Promise<void>;

  // History
  addCommandHistory(entry: CommandHistoryEntry): Promise<void>;
  getCommandHistory(filters?: HistoryFilters): Promise<CommandHistoryEntry[]>;

  // Conversations
  addConversationLog(entry: ConversationLogEntry): Promise<void>;
  getConversationLog(
    filters?: ConversationFilters,
  ): Promise<ConversationLogEntry[]>;

  // Backups
  addBackupMetadata(backup: BackupMetadata): Promise<void>;
  getBackupMetadata(fileKey: string): Promise<BackupMetadata[]>;
  getBackup(backupId: string): Promise<BackupMetadata | null>;
}

/**
 * Configuration data
 */
export interface ConfigData {
  figmaAccessToken?: string;
  defaultModel?: string;
  defaultProvider?: string;
  deploymentLocation?: "local" | "cloud";
  createdAt: string;
  updatedAt: string;
}

/**
 * Project connection
 */
export interface ProjectConnection {
  fileKey: string;
  fileName: string;
  projectId?: string;
  projectName?: string;
  pages?: string[]; // Page IDs or names
  enabled: boolean;
  connectedAt: string;
  lastSeenAt?: string;
}

/**
 * Command history entry
 */
export interface CommandHistoryEntry {
  id: string;
  commandId: string;
  fileKey: string;
  command: string;
  params: Record<string, any>;
  status: "pending" | "posted" | "completed" | "failed" | "timeout";
  result?: any;
  error?: string;
  timestamp: string;
  executionTime?: number;
  backupId?: string; // Link to backup snapshot
}

/**
 * Conversation log entry
 */
export interface ConversationLogEntry {
  id: string;
  fileKey: string;
  commentId?: string; // Figma comment ID if applicable
  message: string;
  author: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

/**
 * Backup metadata
 */
export interface BackupMetadata {
  id: string;
  fileKey: string;
  fileName: string;
  snapshotPath: string; // Path to JSON snapshot file
  createdAt: string;
  commandId?: string; // Command that triggered backup
  fileVersion?: string; // Figma file version if available
}

/**
 * History filters
 */
export interface HistoryFilters {
  fileKey?: string;
  status?: CommandHistoryEntry["status"];
  after?: string; // ISO timestamp
  before?: string; // ISO timestamp
  limit?: number;
}

/**
 * Conversation filters
 */
export interface ConversationFilters {
  fileKey?: string;
  after?: string; // ISO timestamp
  before?: string; // ISO timestamp
  limit?: number;
}

/**
 * JSON-based database implementation (MVP)
 */
export class JsonDatabase implements Database {
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;
    await ensureStorageDir();
    this.initialized = true;
  }

  async getConfig(): Promise<ConfigData> {
    await this.initialize();
    return readJsonFile<ConfigData>(CONFIG_FILE, {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  async saveConfig(config: ConfigData): Promise<void> {
    await this.initialize();
    const existing = await this.getConfig();
    const updated: ConfigData = {
      ...existing,
      ...config,
      updatedAt: new Date().toISOString(),
    };
    await writeJsonFile(CONFIG_FILE, updated);
  }

  async getProjectConnections(): Promise<ProjectConnection[]> {
    await this.initialize();
    return readJsonFile<ProjectConnection[]>(PROJECTS_FILE, []);
  }

  async saveProjectConnection(connection: ProjectConnection): Promise<void> {
    await this.initialize();
    const connections = await this.getProjectConnections();
    const index = connections.findIndex(
      (c) => c.fileKey === connection.fileKey,
    );
    if (index >= 0) {
      connections[index] = connection;
    } else {
      connections.push(connection);
    }
    await writeJsonFile(PROJECTS_FILE, connections);
  }

  async removeProjectConnection(fileKey: string): Promise<void> {
    await this.initialize();
    const connections = await this.getProjectConnections();
    const filtered = connections.filter((c) => c.fileKey !== fileKey);
    await writeJsonFile(PROJECTS_FILE, filtered);
  }

  async addCommandHistory(entry: CommandHistoryEntry): Promise<void> {
    await this.initialize();
    const history = await readJsonFile<CommandHistoryEntry[]>(HISTORY_FILE, []);
    history.push(entry);
    // Keep only last 1000 entries (can be configurable)
    const limited = history.slice(-1000);
    await writeJsonFile(HISTORY_FILE, limited);
  }

  async getCommandHistory(
    filters?: HistoryFilters,
  ): Promise<CommandHistoryEntry[]> {
    await this.initialize();
    let history = await readJsonFile<CommandHistoryEntry[]>(HISTORY_FILE, []);

    if (filters) {
      if (filters.fileKey) {
        history = history.filter((h) => h.fileKey === filters.fileKey);
      }
      if (filters.status) {
        history = history.filter((h) => h.status === filters.status);
      }
      if (filters.after) {
        const after = new Date(filters.after).getTime();
        history = history.filter(
          (h) => new Date(h.timestamp).getTime() >= after,
        );
      }
      if (filters.before) {
        const before = new Date(filters.before).getTime();
        history = history.filter(
          (h) => new Date(h.timestamp).getTime() <= before,
        );
      }
      if (filters.limit) {
        history = history.slice(-filters.limit);
      }
    }

    // Sort by timestamp descending (newest first)
    return history.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
  }

  async addConversationLog(entry: ConversationLogEntry): Promise<void> {
    await this.initialize();
    const conversations = await readJsonFile<ConversationLogEntry[]>(
      CONVERSATIONS_FILE,
      [],
    );
    conversations.push(entry);
    // Keep only last 5000 entries
    const limited = conversations.slice(-5000);
    await writeJsonFile(CONVERSATIONS_FILE, limited);
  }

  async getConversationLog(
    filters?: ConversationFilters,
  ): Promise<ConversationLogEntry[]> {
    await this.initialize();
    let conversations = await readJsonFile<ConversationLogEntry[]>(
      CONVERSATIONS_FILE,
      [],
    );

    if (filters) {
      if (filters.fileKey) {
        conversations = conversations.filter(
          (c) => c.fileKey === filters.fileKey,
        );
      }
      if (filters.after) {
        const after = new Date(filters.after).getTime();
        conversations = conversations.filter(
          (c) => new Date(c.timestamp).getTime() >= after,
        );
      }
      if (filters.before) {
        const before = new Date(filters.before).getTime();
        conversations = conversations.filter(
          (c) => new Date(c.timestamp).getTime() <= before,
        );
      }
      if (filters.limit) {
        conversations = conversations.slice(-filters.limit);
      }
    }

    // Sort by timestamp descending
    return conversations.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
  }

  async addBackupMetadata(backup: BackupMetadata): Promise<void> {
    await this.initialize();
    const backupsFile = join(STORAGE_DIR, `backups-${backup.fileKey}.json`);
    const backups = await readJsonFile<BackupMetadata[]>(backupsFile, []);
    backups.push(backup);
    await writeJsonFile(backupsFile, backups);

    // Update index for quick lookup
    const indexFile = join(STORAGE_DIR, "backups-index.json");
    const index = await readJsonFile<Record<string, { fileKey: string }>>(
      indexFile,
      {},
    );
    index[backup.id] = { fileKey: backup.fileKey };
    await writeJsonFile(indexFile, index);
  }

  async getBackupMetadata(fileKey: string): Promise<BackupMetadata[]> {
    await this.initialize();
    const backupsFile = join(STORAGE_DIR, `backups-${fileKey}.json`);
    const backups = await readJsonFile<BackupMetadata[]>(backupsFile, []);
    return backups.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  async getBackup(backupId: string): Promise<BackupMetadata | null> {
    await this.initialize();
    // Search all backup files using index
    const indexFile = join(STORAGE_DIR, "backups-index.json");
    const index = await readJsonFile<Record<string, { fileKey: string }>>(
      indexFile,
      {},
    );
    const entry = index[backupId];
    if (!entry) return null;
    const backups = await this.getBackupMetadata(entry.fileKey);
    return backups.find((b) => b.id === backupId) || null;
  }
}

// Singleton instance
export const database = new JsonDatabase();
