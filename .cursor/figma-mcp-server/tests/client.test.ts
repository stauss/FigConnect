/**
 * Tests for figma/client.ts FigmaClient
 * Uses mocked fetch to test API interactions
 */

import { jest } from "@jest/globals";

// Mock node-fetch before importing client
const mockFetch = jest.fn<typeof fetch>();
jest.unstable_mockModule("node-fetch", () => ({
  default: mockFetch,
}));

// Import after mocking
const { FigmaClient, FigmaAPIError } = await import("../src/figma/client.js");

describe("FigmaClient", () => {
  let client: InstanceType<typeof FigmaClient>;

  beforeEach(() => {
    client = new FigmaClient();
    mockFetch.mockReset();
  });

  describe("constructor", () => {
    it("should create client instance", () => {
      expect(client).toBeInstanceOf(FigmaClient);
    });
  });

  describe("get", () => {
    it("should make GET request with correct headers", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: "test" }),
      } as Response);

      await client.get("/test");

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/test"),
        expect.objectContaining({
          method: "GET",
          headers: expect.objectContaining({
            "X-Figma-Token": expect.any(String),
          }),
        }),
      );
    });

    it("should append query parameters to URL", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      } as Response);

      await client.get("/test", { foo: "bar", baz: "qux" });

      const calledUrl = mockFetch.mock.calls[0][0] as string;
      expect(calledUrl).toContain("foo=bar");
      expect(calledUrl).toContain("baz=qux");
    });

    it("should return parsed JSON response", async () => {
      const mockData = { name: "Test File", version: "1.0" };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      } as Response);

      const result = await client.get("/test");

      expect(result).toEqual(mockData);
    });
  });

  describe("error handling", () => {
    it("should throw FigmaAPIError on 404", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: "Not Found",
        text: async () => "File not found",
      } as Response);

      await expect(client.get("/files/invalid")).rejects.toThrow(FigmaAPIError);

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: "Not Found",
        text: async () => "File not found",
      } as Response);

      await expect(client.get("/files/invalid")).rejects.toMatchObject({
        status: 404,
        code: "NOT_FOUND",
      });
    });

    it("should throw FigmaAPIError on 403", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: "Forbidden",
        text: async () => "Access denied",
      } as Response);

      await expect(client.get("/files/secret")).rejects.toThrow(FigmaAPIError);

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: "Forbidden",
        text: async () => "Access denied",
      } as Response);

      await expect(client.get("/files/secret")).rejects.toMatchObject({
        status: 403,
        code: "FORBIDDEN",
      });
    });

    it("should throw FigmaAPIError on 429 rate limit", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: "Too Many Requests",
        text: async () => "Rate limit exceeded",
      } as Response);

      await expect(client.get("/files/busy")).rejects.toThrow(FigmaAPIError);

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: "Too Many Requests",
        text: async () => "Rate limit exceeded",
      } as Response);

      await expect(client.get("/files/busy")).rejects.toMatchObject({
        status: 429,
        code: "RATE_LIMITED",
      });
    });

    it("should throw FigmaAPIError on other errors", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        text: async () => "Server error",
      } as Response);

      await expect(client.get("/files/broken")).rejects.toThrow(FigmaAPIError);

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        text: async () => "Server error",
      } as Response);

      await expect(client.get("/files/broken")).rejects.toMatchObject({
        status: 500,
      });
    });
  });

  describe("getFile", () => {
    it("should call correct endpoint", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ name: "Test File" }),
      } as Response);

      await client.getFile("abc123");

      const calledUrl = mockFetch.mock.calls[0][0] as string;
      expect(calledUrl).toContain("/files/abc123");
    });

    it("should include depth parameter when provided", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ name: "Test File" }),
      } as Response);

      await client.getFile("abc123", 3);

      const calledUrl = mockFetch.mock.calls[0][0] as string;
      expect(calledUrl).toContain("depth=3");
    });
  });

  describe("getNodes", () => {
    it("should call correct endpoint with node IDs", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ nodes: {} }),
      } as Response);

      await client.getNodes("abc123", ["1:1", "2:2", "3:3"]);

      const calledUrl = mockFetch.mock.calls[0][0] as string;
      expect(calledUrl).toContain("/files/abc123/nodes");
      expect(calledUrl).toContain("ids=1%3A1%2C2%3A2%2C3%3A3"); // URL encoded
    });
  });

  describe("getImages", () => {
    it("should call correct endpoint with format and scale", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ images: {} }),
      } as Response);

      await client.getImages("abc123", ["1:1"], "svg", 2);

      const calledUrl = mockFetch.mock.calls[0][0] as string;
      expect(calledUrl).toContain("/images/abc123");
      expect(calledUrl).toContain("format=svg");
      expect(calledUrl).toContain("scale=2");
    });

    it("should use default format and scale", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ images: {} }),
      } as Response);

      await client.getImages("abc123", ["1:1"]);

      const calledUrl = mockFetch.mock.calls[0][0] as string;
      expect(calledUrl).toContain("format=png");
      expect(calledUrl).toContain("scale=1");
    });
  });

  describe("getFileComponents", () => {
    it("should call correct endpoint", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ meta: { components: [] } }),
      } as Response);

      await client.getFileComponents("abc123");

      const calledUrl = mockFetch.mock.calls[0][0] as string;
      expect(calledUrl).toContain("/files/abc123/components");
    });
  });

  describe("getFileStyles", () => {
    it("should call correct endpoint", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ meta: { styles: {} } }),
      } as Response);

      await client.getFileStyles("abc123");

      const calledUrl = mockFetch.mock.calls[0][0] as string;
      expect(calledUrl).toContain("/files/abc123/styles");
    });
  });

  describe("getComments", () => {
    it("should call correct endpoint", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ comments: [] }),
      } as Response);

      await client.getComments("abc123");

      const calledUrl = mockFetch.mock.calls[0][0] as string;
      expect(calledUrl).toContain("/files/abc123/comments");
    });
  });

  describe("getVersions", () => {
    it("should call correct endpoint with page size", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ versions: [] }),
      } as Response);

      await client.getVersions("abc123", 20);

      const calledUrl = mockFetch.mock.calls[0][0] as string;
      expect(calledUrl).toContain("/files/abc123/versions");
      expect(calledUrl).toContain("page_size=20");
    });
  });

  describe("getLocalVariables", () => {
    it("should call correct endpoint", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ meta: { variableCollections: {} } }),
      } as Response);

      await client.getLocalVariables("abc123");

      const calledUrl = mockFetch.mock.calls[0][0] as string;
      expect(calledUrl).toContain("/files/abc123/variables/local");
    });
  });
});

describe("FigmaAPIError", () => {
  it("should create error with message, status, and code", () => {
    const error = new FigmaAPIError("Test error", 404, "NOT_FOUND");

    expect(error.message).toBe("Test error");
    expect(error.status).toBe(404);
    expect(error.code).toBe("NOT_FOUND");
    expect(error.name).toBe("FigmaAPIError");
  });

  it("should be instanceof Error", () => {
    const error = new FigmaAPIError("Test");
    expect(error).toBeInstanceOf(Error);
  });
});
