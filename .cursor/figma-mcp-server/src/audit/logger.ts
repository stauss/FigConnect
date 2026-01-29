import { logger } from "../logger.js";

/**
 * Types of audit actions
 */
export type AuditActionType =
  | "command_executed"
  | "task_created"
  | "task_completed"
  | "task_failed"
  | "permission_denied"
  | "rollback"
  | "conflict_detected"
  | "preview_requested";

/**
 * Audit action entry
 */
export interface AuditAction {
  type: AuditActionType;
  userId: string;
  taskId?: string;
  commandId?: string;
  fileKey: string;
  details: Record<string, any>;
  timestamp: string;
}

/**
 * Filters for querying audit logs
 */
export interface AuditFilters {
  userId?: string;
  taskId?: string;
  commandId?: string;
  fileKey?: string;
  type?: AuditActionType | AuditActionType[];
  after?: string; // ISO timestamp
  before?: string; // ISO timestamp
}

/**
 * Audit log entry
 */
export interface AuditEntry extends AuditAction {
  id: string;
}

/**
 * Audit logger for complete action logging
 * Enables audit trail, compliance, and debugging
 */
export interface AuditLogger {
  log(action: AuditAction): Promise<void>;
  query(filters: AuditFilters): Promise<AuditEntry[]>;
}

/**
 * Basic audit logger implementation
 * For MVP: Logs to console/structured logs
 * Future: Dedicated audit storage, query API
 */
export class BasicAuditLogger implements AuditLogger {
  private entries: AuditEntry[] = [];
  private nextId = 1;

  /**
   * Log an audit action
   */
  async log(action: AuditAction): Promise<void> {
    const entry: AuditEntry = {
      id: `audit-${this.nextId++}`,
      ...action,
    };

    this.entries.push(entry);

    // Also log to structured logger
    logger.info(`[AUDIT] ${action.type}`, {
      userId: action.userId,
      taskId: action.taskId,
      commandId: action.commandId,
      fileKey: action.fileKey,
      details: action.details,
    });
  }

  /**
   * Query audit entries
   */
  async query(filters: AuditFilters): Promise<AuditEntry[]> {
    let results = [...this.entries];

    if (filters.userId) {
      results = results.filter((e) => e.userId === filters.userId);
    }

    if (filters.taskId) {
      results = results.filter((e) => e.taskId === filters.taskId);
    }

    if (filters.commandId) {
      results = results.filter((e) => e.commandId === filters.commandId);
    }

    if (filters.fileKey) {
      results = results.filter((e) => e.fileKey === filters.fileKey);
    }

    if (filters.type) {
      const types = Array.isArray(filters.type) ? filters.type : [filters.type];
      results = results.filter((e) => types.includes(e.type));
    }

    if (filters.after) {
      const after = new Date(filters.after).getTime();
      results = results.filter((e) => new Date(e.timestamp).getTime() >= after);
    }

    if (filters.before) {
      const before = new Date(filters.before).getTime();
      results = results.filter(
        (e) => new Date(e.timestamp).getTime() <= before,
      );
    }

    return results;
  }
}

// Default instance
export const auditLogger: AuditLogger = new BasicAuditLogger();
