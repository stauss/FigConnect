/**
 * Extensibility Module Index
 *
 * This module exports all extensibility interfaces and implementations
 * that enable future features without requiring refactoring.
 *
 * All modules follow the pattern:
 * - Interface defines contract
 * - Basic implementation for MVP (may be no-op)
 * - Future: Swap implementations without changing consuming code
 */

// Versioned command schemas
export * from "../commands/schema/registry.js";
export * from "../commands/schema/migrations.js";

// Result artifacts
export * from "../artifacts/types.js";
export * from "../artifacts/storage.js";

// Extended task state machine
export * from "../queue/comment-task-types.js";

// Conflict detection
export * from "../conflicts/types.js";
export * from "../conflicts/detector.js";

// Preview/dry-run
export * from "../preview/service.js";

// Permissions
export * from "../permissions/manager.js";

// Audit logging
export * from "../audit/logger.js";

// Caching with invalidation
export * from "../cache/manager.js";

// File indexing
export * from "../indexing/index.js";

// Plugin registry
export * from "../plugins/registry.js";

// Resource registry
export * from "../resources/registry.js";

// AI router (provider-agnostic)
export * from "../ai/router.js";
