/**
 * Tests for commands/validator.ts
 */

import {
  validateCommandParams,
  validateNodeId,
  validateColor,
  isSupportedCommand,
} from "../src/commands/validator.js";

describe("validateCommandParams", () => {
  describe("create_frame", () => {
    it("should validate valid frame params", () => {
      const params = {
        name: "Test Frame",
        width: 100,
        height: 200,
      };

      const result = validateCommandParams("create_frame", params);

      expect(result.name).toBe("Test Frame");
      expect(result.width).toBe(100);
      expect(result.height).toBe(200);
      expect(result.x).toBe(0); // default
      expect(result.y).toBe(0); // default
    });

    it("should throw on missing required fields", () => {
      const params = { name: "Test" }; // missing width/height

      expect(() => validateCommandParams("create_frame", params)).toThrow(
        "Invalid parameters for create_frame",
      );
    });

    it("should throw on negative dimensions", () => {
      const params = { name: "Test", width: -100, height: 200 };

      expect(() => validateCommandParams("create_frame", params)).toThrow();
    });

    it("should validate fills array", () => {
      const params = {
        name: "Test",
        width: 100,
        height: 100,
        fills: [
          {
            type: "SOLID",
            color: { r: 0.5, g: 0.5, b: 0.5 },
            opacity: 0.8,
          },
        ],
      };

      const result = validateCommandParams("create_frame", params);
      expect(result.fills).toHaveLength(1);
      expect(result.fills[0].type).toBe("SOLID");
    });
  });

  describe("create_text", () => {
    it("should validate valid text params", () => {
      const params = {
        content: "Hello World",
      };

      const result = validateCommandParams("create_text", params);

      expect(result.content).toBe("Hello World");
      expect(result.fontSize).toBe(16); // default
      expect(result.fontFamily).toBe("Inter"); // default
    });

    it("should validate custom font settings", () => {
      const params = {
        content: "Test",
        fontSize: 24,
        fontFamily: "Roboto",
        fontWeight: 700,
      };

      const result = validateCommandParams("create_text", params);

      expect(result.fontSize).toBe(24);
      expect(result.fontFamily).toBe("Roboto");
      expect(result.fontWeight).toBe(700);
    });

    it("should validate text alignment", () => {
      const params = {
        content: "Test",
        textAlignHorizontal: "CENTER",
        textAlignVertical: "BOTTOM",
      };

      const result = validateCommandParams("create_text", params);

      expect(result.textAlignHorizontal).toBe("CENTER");
      expect(result.textAlignVertical).toBe("BOTTOM");
    });
  });

  describe("create_rectangle", () => {
    it("should validate valid rectangle params", () => {
      const params = {
        width: 50,
        height: 50,
        cornerRadius: 8,
      };

      const result = validateCommandParams("create_rectangle", params);

      expect(result.width).toBe(50);
      expect(result.height).toBe(50);
      expect(result.cornerRadius).toBe(8);
    });
  });

  describe("apply_auto_layout", () => {
    it("should validate auto-layout params", () => {
      const params = {
        mode: "HORIZONTAL",
        itemSpacing: 16,
        paddingTop: 24,
      };

      const result = validateCommandParams("apply_auto_layout", params);

      expect(result.mode).toBe("HORIZONTAL");
      expect(result.itemSpacing).toBe(16);
      expect(result.paddingTop).toBe(24);
    });

    it("should throw on invalid mode", () => {
      const params = { mode: "DIAGONAL" };

      expect(() =>
        validateCommandParams("apply_auto_layout", params),
      ).toThrow();
    });
  });

  describe("create_component", () => {
    it("should validate component params", () => {
      const params = {
        name: "Button",
        description: "Primary button component",
      };

      const result = validateCommandParams("create_component", params);

      expect(result.name).toBe("Button");
      expect(result.description).toBe("Primary button component");
    });
  });

  describe("set_properties", () => {
    it("should validate properties object", () => {
      const params = {
        properties: {
          opacity: 0.5,
          visible: false,
        },
      };

      const result = validateCommandParams("set_properties", params);

      expect(result.properties.opacity).toBe(0.5);
      expect(result.properties.visible).toBe(false);
    });
  });

  describe("unknown commands", () => {
    it("should pass through params for unknown commands", () => {
      const params = { custom: "value" };

      const result = validateCommandParams("unknown_command", params);

      expect(result.custom).toBe("value");
    });
  });
});

describe("validateNodeId", () => {
  it("should return true for valid node IDs", () => {
    expect(validateNodeId("1:2")).toBe(true);
    expect(validateNodeId("123:456")).toBe(true);
    expect(validateNodeId("0:0")).toBe(true);
  });

  it("should return false for invalid node IDs", () => {
    expect(validateNodeId("invalid")).toBe(false);
    expect(validateNodeId("1-2")).toBe(false);
    expect(validateNodeId("1:2:3")).toBe(false);
    expect(validateNodeId("")).toBe(false);
    expect(validateNodeId("abc:def")).toBe(false);
  });
});

describe("validateColor", () => {
  it("should return true for valid colors", () => {
    expect(validateColor({ r: 0, g: 0, b: 0 })).toBe(true);
    expect(validateColor({ r: 1, g: 1, b: 1 })).toBe(true);
    expect(validateColor({ r: 0.5, g: 0.25, b: 0.75 })).toBe(true);
  });

  it("should return false for invalid colors", () => {
    expect(validateColor({ r: 2, g: 0, b: 0 })).toBe(false); // r > 1
    expect(validateColor({ r: -0.1, g: 0, b: 0 })).toBe(false); // r < 0
    expect(validateColor({ r: 0, g: 0 })).toBe(false); // missing b
    expect(validateColor({ r: 0, g: "0", b: 0 })).toBe(false); // string
    expect(validateColor(null)).toBe(false);
    expect(validateColor("red")).toBe(false);
  });
});

describe("isSupportedCommand", () => {
  it("should return true for supported commands", () => {
    expect(isSupportedCommand("create_frame")).toBe(true);
    expect(isSupportedCommand("create_text")).toBe(true);
    expect(isSupportedCommand("create_rectangle")).toBe(true);
    expect(isSupportedCommand("apply_auto_layout")).toBe(true);
    expect(isSupportedCommand("create_component")).toBe(true);
    expect(isSupportedCommand("apply_style")).toBe(true);
    expect(isSupportedCommand("set_properties")).toBe(true);
  });

  it("should return false for unsupported commands", () => {
    expect(isSupportedCommand("unknown")).toBe(false);
    expect(isSupportedCommand("delete_node")).toBe(false);
    expect(isSupportedCommand("")).toBe(false);
  });
});
