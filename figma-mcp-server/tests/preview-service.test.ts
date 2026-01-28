/**
 * Tests for preview/service.ts
 */

import { BasicPreviewService, PreviewService } from "../src/preview/service.js";
import { createMockCommand } from "./helpers/command-helpers.js";

describe("PreviewService", () => {
  let service: PreviewService;

  beforeEach(() => {
    service = new BasicPreviewService();
  });

  describe("preview", () => {
    it("should preview create_frame command", async () => {
      const command = createMockCommand("cmd-1", "create_frame", {
        name: "Test Frame",
        width: 100,
        height: 200,
      });

      const result = await service.preview([command]);

      expect(result.changes).toHaveLength(1);
      expect(result.changes[0].type).toBe("create");
      expect(result.changes[0].description.toLowerCase()).toContain("frame");
      expect(result.affectedNodes.length).toBeGreaterThan(0);
    });

    it("should preview move_node command", async () => {
      const command = createMockCommand("cmd-1", "move_node", {
        nodeId: "1:2",
        x: 50,
        y: 100,
      });

      const result = await service.preview([command]);

      expect(result.changes).toHaveLength(1);
      expect(result.changes[0].type).toBe("move");
      expect(result.changes[0].after).toMatchObject({ x: 50, y: 100 });
    });

    it("should preview delete_node command", async () => {
      const command = createMockCommand("cmd-1", "delete_node", {
        nodeId: "1:2",
      });

      const result = await service.preview([command]);

      expect(result.changes).toHaveLength(1);
      expect(result.changes[0].type).toBe("delete");
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain("delete");
    });

    it("should preview set_properties command", async () => {
      const command = createMockCommand("cmd-1", "set_properties", {
        properties: { opacity: 0.5 },
      });

      const result = await service.preview([command]);

      expect(result.changes).toHaveLength(1);
      expect(result.changes[0].type).toBe("update");
      expect(result.changes[0].after).toMatchObject({ opacity: 0.5 });
    });

    it("should preview batch commands", async () => {
      const cmd1 = createMockCommand("cmd-1", "create_frame");
      const cmd2 = createMockCommand("cmd-2", "create_text");

      const result = await service.preview([cmd1, cmd2]);

      expect(result.changes).toHaveLength(2);
      expect(result.affectedNodes.length).toBeGreaterThan(0);
    });

    it("should calculate affected nodes", async () => {
      const cmd1 = createMockCommand("cmd-1", "create_frame", {}, "1:2");
      const cmd2 = createMockCommand("cmd-2", "move_node", {
        nodeId: "3:4",
      });

      const result = await service.preview([cmd1, cmd2]);

      expect(result.affectedNodes.length).toBeGreaterThan(0);
      expect(result.affectedNodes).toContain("1:2");
      expect(result.affectedNodes).toContain("3:4");
    });

    it("should generate warnings for destructive actions", async () => {
      const command = createMockCommand("cmd-1", "delete");

      const result = await service.preview([command]);

      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some((w) => w.includes("delete"))).toBe(true);
    });

    it("should estimate execution duration", async () => {
      const commands = [
        createMockCommand("cmd-1"),
        createMockCommand("cmd-2"),
        createMockCommand("cmd-3"),
      ];

      const result = await service.preview(commands);

      expect(result.estimatedDuration).toBeDefined();
      expect(result.estimatedDuration).toBeGreaterThan(0);
    });

    it("should set canExecute based on warnings", async () => {
      const safeCommand = createMockCommand("cmd-1", "create_frame");
      const destructiveCommand = createMockCommand("cmd-2", "delete");

      const safeResult = await service.preview([safeCommand]);
      const destructiveResult = await service.preview([destructiveCommand]);

      expect(safeResult.canExecute).toBe(true);
      // Destructive actions may still be executable (warnings only)
      expect(destructiveResult.warnings.length).toBeGreaterThan(0);
    });
  });
});
