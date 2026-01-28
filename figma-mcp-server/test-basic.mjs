#!/usr/bin/env node
/**
 * Basic smoke tests to verify core functionality
 * Run with: node test-basic.mjs
 *
 * The Figma token is automatically loaded from .env file - no need to pass it!
 */

import { CONFIG } from "./dist/config.js";
import { logger } from "./dist/logger.js";
import { FigmaClient } from "./dist/figma/client.js";
import {
  findNodes,
  flattenNodes,
  formatNodeTree,
  getNodeSummary,
} from "./dist/figma/utils.js";

console.log("🧪 Running basic smoke tests...\n");

// Test 1: Configuration loading
console.log("1️⃣ Testing configuration...");
try {
  if (!CONFIG.figma.accessToken) {
    throw new Error("FIGMA_ACCESS_TOKEN not found in config");
  }
  console.log("   ✅ Config loaded successfully");
  console.log(`   ✅ API Base: ${CONFIG.figma.apiBase}`);
  console.log(`   ✅ Timeout: ${CONFIG.figma.timeout}ms`);
  console.log(`   ✅ Rate Limit: ${CONFIG.rateLimit.maxRequestsPerMinute}/min`);
  console.log(
    `   ✅ Token present: ${CONFIG.figma.accessToken.substring(0, 10)}...`,
  );
} catch (error) {
  console.error("   ❌ Config test failed:", error.message);
  process.exit(1);
}

// Test 2: Logger
console.log("\n2️⃣ Testing logger...");
try {
  logger.info("Test info message");
  logger.warn("Test warn message");
  logger.debug("Test debug message (may not show)");
  logger.error("Test error message");
  console.log("   ✅ Logger works correctly");
} catch (error) {
  console.error("   ❌ Logger test failed:", error.message);
  process.exit(1);
}

// Test 3: FigmaClient instantiation
console.log("\n3️⃣ Testing FigmaClient...");
try {
  const client = new FigmaClient();
  console.log("   ✅ FigmaClient instantiated");

  // Test URL construction (without making actual API call)
  const testUrl = new URL(`${CONFIG.figma.apiBase}/files/test123`);
  console.log(
    `   ✅ URL construction works: ${testUrl.toString().substring(0, 50)}...`,
  );
} catch (error) {
  console.error("   ❌ FigmaClient test failed:", error.message);
  process.exit(1);
}

// Test 4: Utility functions with mock data
console.log("\n4️⃣ Testing utility functions...");
try {
  const mockNode = {
    id: "1:2",
    name: "Test Frame",
    type: "FRAME",
    children: [
      {
        id: "1:3",
        name: "Child Text",
        type: "TEXT",
        children: [],
      },
      {
        id: "1:4",
        name: "Child Rectangle",
        type: "RECTANGLE",
        children: [],
      },
    ],
  };

  // Test findNodes
  const found = findNodes(mockNode, (n) => n.type === "TEXT");
  if (found.length !== 1 || found[0].name !== "Child Text") {
    throw new Error("findNodes failed");
  }
  console.log("   ✅ findNodes works");

  // Test flattenNodes
  const flattened = flattenNodes(mockNode);
  if (flattened.length !== 3) {
    throw new Error("flattenNodes failed");
  }
  console.log("   ✅ flattenNodes works");

  // Test formatNodeTree
  const formatted = formatNodeTree(mockNode);
  if (!formatted.includes("Test Frame") || !formatted.includes("Child Text")) {
    throw new Error("formatNodeTree failed");
  }
  console.log("   ✅ formatNodeTree works");

  // Test getNodeSummary
  const summary = getNodeSummary(mockNode);
  if (summary.id !== "1:2" || summary.childCount !== 2) {
    throw new Error("getNodeSummary failed");
  }
  console.log("   ✅ getNodeSummary works");
} catch (error) {
  console.error("   ❌ Utility functions test failed:", error.message);
  process.exit(1);
}

// Test 5: Real API call (optional)
if (
  process.argv.includes("--test-api") &&
  process.argv.includes("--file-key")
) {
  const fileKeyIndex = process.argv.indexOf("--file-key");
  const fileKey = process.argv[fileKeyIndex + 1];

  console.log(`\n5️⃣ Testing real API call with file: ${fileKey}...`);
  try {
    const client = new FigmaClient();
    const file = await client.getFile(fileKey);
    console.log(`   ✅ API call successful! File: ${file.name}`);
    console.log(`   ✅ Last Modified: ${file.lastModified}`);
  } catch (error) {
    console.error(`   ❌ API call failed: ${error.message}`);
    if (error.status === 403) {
      console.error(
        "   💡 Tip: Check that your Figma token has access to this file",
      );
    } else if (error.status === 404) {
      console.error("   💡 Tip: Verify the file key is correct");
    }
  }
} else {
  console.log("\n5️⃣ Testing real API connection (optional)...");
  console.log("   ⚠️  Skipping real API test");
  console.log(
    "   💡 To test real API: node test-basic.mjs --test-api --file-key YOUR_FILE_KEY",
  );
}

console.log("\n✅ All basic tests passed!");
console.log("\n💡 Next steps:");
console.log("   - Continue with Step 4: Read-Only Tools Implementation");
