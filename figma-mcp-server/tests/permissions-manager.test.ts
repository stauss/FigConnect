/**
 * Tests for permissions/manager.ts
 */

import {
  BasicPermissionManager,
  PermissionManager,
} from "../src/permissions/manager.js";
import { createMockTask } from "./helpers/command-helpers.js";

describe("PermissionManager", () => {
  let manager: PermissionManager;

  beforeEach(() => {
    manager = new BasicPermissionManager();
  });

  describe("checkPermission", () => {
    it("should allow read actions", async () => {
      const task = createMockTask("task-1");

      const allowed = await manager.checkPermission(task, "read");
      expect(allowed).toBe(true);
    });

    it("should allow write actions by default in MVP", async () => {
      const task = createMockTask("task-1");

      const allowed = await manager.checkPermission(task, "create");
      expect(allowed).toBe(true);
    });

    it("should identify write actions correctly", () => {
      const manager = new BasicPermissionManager();
      const isWriteAction = (manager as any).isWriteAction.bind(manager);

      const writeActions = ["create", "update", "delete", "move", "duplicate"];
      for (const action of writeActions) {
        expect(isWriteAction(action)).toBe(true);
      }

      const readActions = ["read", "get", "list"];
      for (const action of readActions) {
        expect(isWriteAction(action)).toBe(false);
      }
    });
  });

  describe("getScope", () => {
    it("should return default scope (no restrictions) in MVP", async () => {
      const task = createMockTask("task-1");

      const scope = await manager.getScope(task);

      expect(scope.readOnly).toBe(false);
      expect(scope.allowedNodes).toBeUndefined();
      expect(scope.deniedActions).toBeUndefined();
    });
  });
});
