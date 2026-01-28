/**
 * Tests for audit/logger.ts
 */

import { BasicAuditLogger, AuditLogger } from "../src/audit/logger.js";
import { AuditActionType } from "../src/audit/logger.js";

describe("AuditLogger", () => {
  let logger: AuditLogger;

  beforeEach(() => {
    logger = new BasicAuditLogger();
  });

  describe("log", () => {
    it("should log audit action", async () => {
      const action = {
        type: "command_executed" as AuditActionType,
        userId: "user-123",
        taskId: "task-123",
        commandId: "cmd-123",
        fileKey: "file-123",
        details: { command: "create_frame" },
        timestamp: new Date().toISOString(),
      };

      await logger.log(action);

      const entries = await logger.query({});
      expect(entries.length).toBeGreaterThan(0);
      expect(entries[0].type).toBe("command_executed");
      expect(entries[0].userId).toBe("user-123");
    });

    it("should include all required fields in log entry", async () => {
      const action = {
        type: "task_created" as AuditActionType,
        userId: "user-123",
        fileKey: "file-123",
        details: {},
        timestamp: new Date().toISOString(),
      };

      await logger.log(action);

      const entries = await logger.query({});
      const entry = entries[0];

      expect(entry.id).toBeDefined();
      expect(entry.type).toBe("task_created");
      expect(entry.userId).toBe("user-123");
      expect(entry.fileKey).toBe("file-123");
      expect(entry.timestamp).toBeDefined();
    });
  });

  describe("query", () => {
    beforeEach(async () => {
      // Add test entries
      await logger.log({
        type: "command_executed",
        userId: "user-1",
        taskId: "task-1",
        commandId: "cmd-1",
        fileKey: "file-A",
        details: {},
        timestamp: new Date().toISOString(),
      });

      await logger.log({
        type: "task_created",
        userId: "user-2",
        fileKey: "file-B",
        details: {},
        timestamp: new Date().toISOString(),
      });

      await logger.log({
        type: "command_executed",
        userId: "user-1",
        taskId: "task-2",
        commandId: "cmd-2",
        fileKey: "file-A",
        details: {},
        timestamp: new Date().toISOString(),
      });
    });

    it("should query by userId", async () => {
      const entries = await logger.query({ userId: "user-1" });

      expect(entries.length).toBe(2);
      expect(entries.every((e) => e.userId === "user-1")).toBe(true);
    });

    it("should query by taskId", async () => {
      const entries = await logger.query({ taskId: "task-1" });

      expect(entries.length).toBe(1);
      expect(entries[0].taskId).toBe("task-1");
    });

    it("should query by fileKey", async () => {
      const entries = await logger.query({ fileKey: "file-A" });

      expect(entries.length).toBe(2);
      expect(entries.every((e) => e.fileKey === "file-A")).toBe(true);
    });

    it("should query by action type", async () => {
      const entries = await logger.query({ type: "command_executed" });

      expect(entries.length).toBe(2);
      expect(entries.every((e) => e.type === "command_executed")).toBe(true);
    });

    it("should query by multiple types", async () => {
      const entries = await logger.query({
        type: ["command_executed", "task_created"],
      });

      expect(entries.length).toBe(3);
    });

    it("should query by date range (after)", async () => {
      const now = new Date();
      const after = new Date(now.getTime() - 1000).toISOString();

      const entries = await logger.query({ after });

      // All entries should be after the timestamp
      expect(entries.length).toBeGreaterThan(0);
    });

    it("should query by date range (before)", async () => {
      const future = new Date(Date.now() + 10000).toISOString();

      const entries = await logger.query({ before: future });

      // All entries should be before future timestamp
      expect(entries.length).toBe(3);
    });

    it("should query with multiple filters", async () => {
      const entries = await logger.query({
        userId: "user-1",
        fileKey: "file-A",
        type: "command_executed",
      });

      expect(entries.length).toBe(2);
      expect(
        entries.every(
          (e) =>
            e.userId === "user-1" &&
            e.fileKey === "file-A" &&
            e.type === "command_executed",
        ),
      ).toBe(true);
    });

    it("should return empty array when no matches", async () => {
      const entries = await logger.query({ userId: "non-existent" });

      expect(entries).toEqual([]);
    });
  });
});
