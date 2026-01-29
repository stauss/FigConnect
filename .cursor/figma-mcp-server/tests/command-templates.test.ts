/**
 * Tests for commands/templates.ts
 */

import {
  generateCommandId,
  hexToRgb,
  createFrameCommand,
  createTextCommand,
  createRectangleCommand,
  applyAutoLayoutCommand,
  createComponentCommand,
  setPropertiesCommand,
} from "../src/commands/templates.js";

describe("generateCommandId", () => {
  it("should generate unique IDs", () => {
    const id1 = generateCommandId();
    const id2 = generateCommandId();

    expect(id1).not.toBe(id2);
  });

  it("should follow cmd-timestamp-uuid format", () => {
    const id = generateCommandId();

    expect(id).toMatch(/^cmd-\d+-[a-f0-9]{8}$/);
  });
});

describe("hexToRgb", () => {
  it("should convert hex to RGB (0-1 range)", () => {
    expect(hexToRgb("#000000")).toEqual({ r: 0, g: 0, b: 0 });
    expect(hexToRgb("#ffffff")).toEqual({ r: 1, g: 1, b: 1 });
    expect(hexToRgb("#ff0000")).toEqual({ r: 1, g: 0, b: 0 });
    expect(hexToRgb("#00ff00")).toEqual({ r: 0, g: 1, b: 0 });
    expect(hexToRgb("#0000ff")).toEqual({ r: 0, g: 0, b: 1 });
  });

  it("should handle hex without # prefix", () => {
    expect(hexToRgb("ffffff")).toEqual({ r: 1, g: 1, b: 1 });
  });

  it("should handle mixed case", () => {
    expect(hexToRgb("#AbCdEf")).toEqual({
      r: 171 / 255,
      g: 205 / 255,
      b: 239 / 255,
    });
  });

  it("should throw on invalid hex", () => {
    expect(() => hexToRgb("invalid")).toThrow("Invalid hex color");
    expect(() => hexToRgb("#fff")).toThrow("Invalid hex color"); // short form not supported
    expect(() => hexToRgb("#gggggg")).toThrow("Invalid hex color");
  });
});

describe("createFrameCommand", () => {
  it("should create frame command with required params", () => {
    const cmd = createFrameCommand({
      name: "Test Frame",
      width: 100,
      height: 200,
    });

    expect(cmd.type).toBe("mcp-command");
    expect(cmd.version).toBe("1.0");
    expect(cmd.command).toBe("create_frame");
    expect(cmd.params.name).toBe("Test Frame");
    expect(cmd.params.width).toBe(100);
    expect(cmd.params.height).toBe(200);
    expect(cmd.params.x).toBe(0);
    expect(cmd.params.y).toBe(0);
    expect(cmd.id).toMatch(/^cmd-/);
    expect(cmd.timestamp).toBeDefined();
  });

  it("should include position when provided", () => {
    const cmd = createFrameCommand({
      name: "Test",
      width: 100,
      height: 100,
      x: 50,
      y: 75,
    });

    expect(cmd.params.x).toBe(50);
    expect(cmd.params.y).toBe(75);
  });

  it("should include fills when backgroundColor provided", () => {
    const cmd = createFrameCommand({
      name: "Test",
      width: 100,
      height: 100,
      backgroundColor: "#ff0000",
    });

    expect(cmd.params.fills).toHaveLength(1);
    expect(cmd.params.fills[0].type).toBe("SOLID");
    expect(cmd.params.fills[0].color).toEqual({ r: 1, g: 0, b: 0 });
    expect(cmd.params.fills[0].opacity).toBe(1);
  });

  it("should include parent when provided", () => {
    const cmd = createFrameCommand({
      name: "Test",
      width: 100,
      height: 100,
      parent: "1:2",
    });

    expect(cmd.parent).toBe("1:2");
  });
});

describe("createTextCommand", () => {
  it("should create text command with required params", () => {
    const cmd = createTextCommand({
      content: "Hello World",
    });

    expect(cmd.command).toBe("create_text");
    expect(cmd.params.content).toBe("Hello World");
    expect(cmd.params.x).toBe(0);
    expect(cmd.params.y).toBe(0);
    expect(cmd.params.fontSize).toBe(16);
  });

  it("should include position and font size when provided", () => {
    const cmd = createTextCommand({
      content: "Test",
      x: 10,
      y: 20,
      fontSize: 24,
    });

    expect(cmd.params.x).toBe(10);
    expect(cmd.params.y).toBe(20);
    expect(cmd.params.fontSize).toBe(24);
  });

  it("should include fills when color provided", () => {
    const cmd = createTextCommand({
      content: "Test",
      color: "#0000ff",
    });

    expect(cmd.params.fills).toHaveLength(1);
    expect(cmd.params.fills[0].color).toEqual({ r: 0, g: 0, b: 1 });
  });
});

describe("createRectangleCommand", () => {
  it("should create rectangle command", () => {
    const cmd = createRectangleCommand({
      width: 50,
      height: 50,
    });

    expect(cmd.command).toBe("create_rectangle");
    expect(cmd.params.width).toBe(50);
    expect(cmd.params.height).toBe(50);
    expect(cmd.params.cornerRadius).toBe(0);
  });

  it("should include cornerRadius when provided", () => {
    const cmd = createRectangleCommand({
      width: 100,
      height: 100,
      cornerRadius: 12,
    });

    expect(cmd.params.cornerRadius).toBe(12);
  });

  it("should include fills when fillColor provided", () => {
    const cmd = createRectangleCommand({
      width: 50,
      height: 50,
      fillColor: "#00ff00",
    });

    expect(cmd.params.fills).toHaveLength(1);
    expect(cmd.params.fills[0].color).toEqual({ r: 0, g: 1, b: 0 });
  });
});

describe("applyAutoLayoutCommand", () => {
  it("should create auto-layout command", () => {
    const cmd = applyAutoLayoutCommand({
      nodeId: "1:2",
      direction: "HORIZONTAL",
    });

    expect(cmd.command).toBe("apply_auto_layout");
    expect(cmd.params.mode).toBe("HORIZONTAL");
    expect(cmd.parent).toBe("1:2");
    expect(cmd.params.itemSpacing).toBe(0);
  });

  it("should include spacing and padding when provided", () => {
    const cmd = applyAutoLayoutCommand({
      nodeId: "1:2",
      direction: "VERTICAL",
      spacing: 16,
      padding: 24,
    });

    expect(cmd.params.mode).toBe("VERTICAL");
    expect(cmd.params.itemSpacing).toBe(16);
    expect(cmd.params.paddingTop).toBe(24);
    expect(cmd.params.paddingRight).toBe(24);
    expect(cmd.params.paddingBottom).toBe(24);
    expect(cmd.params.paddingLeft).toBe(24);
  });
});

describe("createComponentCommand", () => {
  it("should create component command", () => {
    const cmd = createComponentCommand({
      name: "Button",
    });

    expect(cmd.command).toBe("create_component");
    expect(cmd.params.name).toBe("Button");
  });

  it("should include description when provided", () => {
    const cmd = createComponentCommand({
      name: "Button",
      description: "Primary button component",
    });

    expect(cmd.params.description).toBe("Primary button component");
  });
});

describe("setPropertiesCommand", () => {
  it("should create set properties command", () => {
    const cmd = setPropertiesCommand({
      nodeId: "1:2",
      properties: {
        opacity: 0.5,
        visible: false,
      },
    });

    expect(cmd.command).toBe("set_properties");
    expect(cmd.parent).toBe("1:2");
    expect(cmd.params.properties.opacity).toBe(0.5);
    expect(cmd.params.properties.visible).toBe(false);
  });
});
