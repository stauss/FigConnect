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
  backupId?: string;
}

export interface ConversationLogEntry {
  id: string;
  fileKey: string;
  commentId?: string;
  message: string;
  author: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface BackupMetadata {
  id: string;
  fileKey: string;
  fileName: string;
  snapshotPath: string;
  createdAt: string;
  commandId?: string;
  fileVersion?: string;
}
