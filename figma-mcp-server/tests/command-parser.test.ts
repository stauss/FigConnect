/**
 * Tests for commands/parser.ts
 */

import {
  parseCommand,
  parseResponse,
  extractCommandFromComment,
  extractResponseFromComment,
  formatCommandMessage,
} from "../src/commands/parser.js";

describe("parseCommand", () => {
  it("should parse valid command JSON", () => {
    const json = JSON.stringify({
      type: "mcp-command",
      version: "1.0",
      id: "cmd-123",
      command: "create_frame",
      params: { name: "Test", width: 100, height: 100 },
      timestamp: "2024-01-15T10:00:00Z",
    });

    const result = parseCommand(json);

    expect(result.type).toBe("mcp-command");
    expect(result.id).toBe("cmd-123");
    expect(result.command).toBe("create_frame");
    expect(result.params.name).toBe("Test");
  });

  it("should parse command with optional parent", () => {
    const json = JSON.stringify({
      type: "mcp-command",
      version: "1.0",
      id: "cmd-123",
      command: "create_frame",
      params: {},
      parent: "1:2",
      timestamp: "2024-01-15T10:00:00Z",
    });

    const result = parseCommand(json);
    expect(result.parent).toBe("1:2");
  });

  it("should throw on invalid JSON", () => {
    expect(() => parseCommand("not json")).toThrow("Failed to parse command");
  });

  it("should throw on missing required fields", () => {
    const json = JSON.stringify({ type: "mcp-command" });
    expect(() => parseCommand(json)).toThrow("Invalid command format");
  });

  it("should throw on wrong type literal", () => {
    const json = JSON.stringify({
      type: "wrong-type",
      id: "cmd-123",
      command: "create_frame",
      params: {},
      timestamp: "2024-01-15T10:00:00Z",
    });
    expect(() => parseCommand(json)).toThrow("Invalid command format");
  });
});

describe("parseResponse", () => {
  it("should parse valid success response", () => {
    const json = JSON.stringify({
      type: "mcp-response",
      commandId: "cmd-123",
      status: "success",
      result: { nodeId: "1:2" },
      timestamp: "2024-01-15T10:00:05Z",
      executionTime: 234,
    });

    const result = parseResponse(json);

    expect(result?.type).toBe("mcp-response");
    expect(result?.commandId).toBe("cmd-123");
    expect(result?.status).toBe("success");
    expect(result?.result.nodeId).toBe("1:2");
  });

  it("should parse valid error response", () => {
    const json = JSON.stringify({
      type: "mcp-response",
      commandId: "cmd-123",
      status: "error",
      error: {
        code: "INVALID_PARENT",
        message: "Parent not found",
      },
      timestamp: "2024-01-15T10:00:05Z",
    });

    const result = parseResponse(json);

    expect(result?.status).toBe("error");
    expect(result?.error?.code).toBe("INVALID_PARENT");
  });

  it("should return null on invalid JSON", () => {
    const result = parseResponse("not json");
    expect(result).toBeNull();
  });

  it("should return null on invalid structure", () => {
    const json = JSON.stringify({ type: "wrong" });
    const result = parseResponse(json);
    expect(result).toBeNull();
  });
});

describe("extractCommandFromComment", () => {
  it("should extract command from markdown code block", () => {
    const message = `MCP Command

\`\`\`json
{
  "type": "mcp-command",
  "version": "1.0",
  "id": "cmd-123",
  "command": "create_frame",
  "params": {},
  "timestamp": "2024-01-15T10:00:00Z"
}
\`\`\``;

    const result = extractCommandFromComment(message);

    expect(result?.id).toBe("cmd-123");
    expect(result?.command).toBe("create_frame");
  });

  it("should extract command from raw JSON", () => {
    const message = `{
      "type": "mcp-command",
      "version": "1.0",
      "id": "cmd-456",
      "command": "create_text",
      "params": {},
      "timestamp": "2024-01-15T10:00:00Z"
    }`;

    const result = extractCommandFromComment(message);

    expect(result?.id).toBe("cmd-456");
    expect(result?.command).toBe("create_text");
  });

  it("should return null for non-JSON message", () => {
    const result = extractCommandFromComment(
      "Hello, this is a regular comment",
    );
    expect(result).toBeNull();
  });

  it("should return null for invalid JSON in code block", () => {
    const message = "```json\nnot valid json\n```";
    const result = extractCommandFromComment(message);
    expect(result).toBeNull();
  });
});

describe("extractResponseFromComment", () => {
  it("should extract response from markdown code block", () => {
    const message = `\`\`\`json
{
  "type": "mcp-response",
  "commandId": "cmd-123",
  "status": "success",
  "timestamp": "2024-01-15T10:00:05Z"
}
\`\`\``;

    const result = extractResponseFromComment(message);

    expect(result?.commandId).toBe("cmd-123");
    expect(result?.status).toBe("success");
  });

  it("should extract response from raw JSON", () => {
    const message = `{
      "type": "mcp-response",
      "commandId": "cmd-456",
      "status": "error",
      "error": { "code": "ERROR", "message": "Failed" },
      "timestamp": "2024-01-15T10:00:05Z"
    }`;

    const result = extractResponseFromComment(message);

    expect(result?.commandId).toBe("cmd-456");
    expect(result?.status).toBe("error");
  });

  it("should return null for non-JSON message", () => {
    const result = extractResponseFromComment("Regular comment");
    expect(result).toBeNull();
  });
});

describe("formatCommandMessage", () => {
  it("should format command as markdown message", () => {
    const command = {
      type: "mcp-command" as const,
      version: "1.0",
      id: "cmd-123",
      command: "create_frame",
      params: { name: "Test" },
      timestamp: "2024-01-15T10:00:00Z",
    };

    const result = formatCommandMessage(command);

    expect(result).toContain("MCP Command");
    expect(result).toContain("```json");
    expect(result).toContain('"id": "cmd-123"');
    expect(result).toContain("Figma MCP Plugin");
  });
});
