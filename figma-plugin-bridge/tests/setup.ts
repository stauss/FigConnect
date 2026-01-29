/**
 * Jest test setup for plugin bridge
 * Mocks Figma API globals
 */

import { jest } from "@jest/globals";

const g = typeof globalThis !== "undefined" ? globalThis : (typeof global !== "undefined" ? global : (typeof window !== "undefined" ? window : {}));
(g as any).figma = {
  fileKey: "test-file-key",
  currentPage: {
    selection: [],
  },
  notify: jest.fn(),
  showUI: jest.fn(),
  ui: {
    onmessage: null,
    postMessage: jest.fn(),
  },
  on: jest.fn(),
  getNodeById: jest.fn(),
  createFrame: jest.fn(),
  createText: jest.fn(),
  createRectangle: jest.fn(),
  loadFontAsync: jest.fn(),
};
