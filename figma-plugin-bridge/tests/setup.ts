/**
 * Jest test setup for plugin bridge
 * Mocks Figma API globals
 */

// Mock Figma API globals
global.figma = {
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
} as any;
