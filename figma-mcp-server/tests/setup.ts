/**
 * Jest test setup
 * Configures test environment before tests run
 */

// Mock environment variables for testing
process.env.FIGMA_ACCESS_TOKEN = "test-token-12345";
process.env.FIGMA_FILE_KEY = "test-file-key";
process.env.LOG_LEVEL = "error"; // Suppress logs during tests
process.env.API_TIMEOUT_MS = "5000";
process.env.MAX_REQUESTS_PER_MINUTE = "60";
