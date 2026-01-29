export default {
  preset: "ts-jest/presets/default-esm",
  testEnvironment: "node",
  extensionsToTreatAsEsm: [".ts"],
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        useESM: true,
        tsconfig: {
          module: "ES2020",
          moduleResolution: "node",
        },
      },
    ],
  },
  testMatch: ["**/tests/**/*.test.ts"],
  setupFiles: ["./tests/setup.ts"],
  collectCoverageFrom: ["src/**/*.ts", "!src/**/*.d.ts"],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html"],
  globals: {
    figma: {
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
    },
  },
};
