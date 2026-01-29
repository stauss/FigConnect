# Tasks: Figma MCP Server - Phase A

> Comment-Based Collaboration Basics

---

## Overview

Phase A enables async AI collaboration via **native Figma comments**. Designers leave tasks directly on the canvas using comments (e.g., `Claude: fix spacing here`) and Claude replies in-thread with status and results.

**Status**: Ready to implement

---

## Work Packages

| WP ID | Title | Status | Dependencies |
|-------|-------|--------|--------------|
| WP01 | Comment Trigger Contract | planned | - |
| WP02 | Comment Ingestion System | planned | WP01 |
| WP03 | Comment Parser & Queue | planned | WP02 |
| WP04 | Reply Helpers | planned | WP02 |
| WP05 | Safety Gating | planned | WP03, WP04 |
| WP06 | Target Node Resolution | planned | WP03 |
| WP07 | Comment Task Router | planned | WP05, WP06 |
| WP08 | Testing & Integration | planned | WP07 |

---

## WP01: Comment Trigger Contract

**Goal**: Define how comments trigger AI tasks

**Tasks**:
- [ ] Define primary trigger: `Claude:` prefix (case-insensitive)
- [ ] Define secondary trigger: `/claude` (optional)
- [ ] Document: plain comments = normal human comments (ignored)
- [ ] Create type definitions for comment triggers

**File**: `figma-mcp-server/src/comments/triggers.ts`

---

## WP02: Comment Ingestion System

**Goal**: Receive and process Figma comments

**Tasks**:
- [ ] Implement webhook path for `FILE_COMMENT` events
- [ ] Implement polling fallback via `get_comments`
- [ ] Add comment dedupe + cursor tracking
- [ ] Store last-seen comment IDs per file_key
- [ ] Prevent double-processing (webhook retries / polling overlap)

**Files**:
- `figma-mcp-server/src/comments/ingestion.ts`
- `figma-mcp-server/src/comments/cursor.ts`

---

## WP03: Comment Parser & Queue

**Goal**: Parse comments into actionable tasks

**Tasks**:
- [ ] Implement Comment → Task parser
- [ ] Extract: file_key, comment_id, parent_id/thread_id, author, created_at, message, client_meta
- [ ] Determine: priority (optional keywords), scope (single-node vs multi-node)
- [ ] Implement comment-task queue with state machine
- [ ] States: `queued`, `in_progress`, `needs_input`, `done`, `failed`, `canceled`
- [ ] Capture: durations, errors, command IDs, resulting node IDs

**Files**:
- `figma-mcp-server/src/comments/parser.ts`
- `figma-mcp-server/src/queue/comment-queue.ts`

---

## WP04: Reply Helpers

**Goal**: Enable AI to reply to comments

**Tasks**:
- [ ] Implement `post_comment_reply({ file_key, parent_comment_id, message })`
- [ ] Standardize status strings:
  - `Queued ⏳`
  - `Working…`
  - `Needs input ❓`
  - `Done ✅`
  - `Failed 🧨`
- [ ] Add immediate "ack" reply when task is queued

**File**: `figma-mcp-server/src/figma/comment-client.ts`

---

## WP05: Safety Gating

**Goal**: Require confirmation for destructive actions

**Tasks**:
- [ ] Define destructive actions: `delete`, bulk updates, style changes
- [ ] Implement Plan → Confirm → Execute flow
- [ ] Claude replies with plan and waits for `Claude: go` in same thread
- [ ] Add timeout for confirmation (e.g., 5 minutes)
- [ ] Log confirmation events

**File**: `figma-mcp-server/src/comments/safety.ts`

---

## WP06: Target Node Resolution

**Goal**: Resolve which node a comment refers to

**Tasks**:
- [ ] Implement `resolve_target_from_comment` command executor
- [ ] Input: `{ frame_node_id?, client_meta, x?, y?, thread_id/comment_id }`
- [ ] Output: `{ target_node_id, confidence, reason, boundsSnapshot }`
- [ ] Use frame + offset hit-testing to find node under comment pin
- [ ] Implement optional `flash_node` / `focus_viewport_on_node` for UX feedback

**Files**:
- `figma-plugin-bridge/src/commands/comments.ts`
- `figma-mcp-server/src/commands/schema.ts` (add types)

---

## WP07: Comment Task Router

**Goal**: Connect all pieces into end-to-end flow

**Tasks**:
- [ ] Implement comment task router in MCP server
- [ ] Flow:
  1. Parse comment task
  2. Resolve target node (via plugin command if needed)
  3. Gather context (node details / nearby nodes / styles)
  4. Decide actions (AI)
  5. Execute commands (existing bridge)
  6. Reply in thread with summary + any follow-ups
- [ ] Add task templates for common ops:
  - "move X by N px"
  - "duplicate"
  - "delete"
  - "rename"
  - "apply style"
  - "fix padding"

**File**: `figma-mcp-server/src/comments/router.ts`

---

## WP08: Testing & Integration

**Goal**: Validate end-to-end functionality

**Tasks**:
- [ ] Create test file with comments
- [ ] Test: Comment with `Claude:` prefix triggers task
- [ ] Test: Immediate "Queued ⏳" reply appears
- [ ] Test: Target resolution returns correct node
- [ ] Test: Manipulation commands execute (move/duplicate/delete)
- [ ] Test: Completion reply summarizes actions
- [ ] Test: Safety gating requires `Claude: go` for destructive ops
- [ ] Add observability: structured logs, `/api/stats` queue counts

**Files**:
- `figma-mcp-server/tests/comments/`
- `figma-plugin-bridge/tests/comments/`

---

## Implementation Notes

- Comments are the primary UX surface; plugin UI stays minimal
- Node manipulation and comment-context targeting require **plugin execution** (not REST-only)
- Start with single-file MVP: one file_key, one team

---

## Metadata

| Field | Value |
|-------|-------|
| Phase | A - Collaboration Basics |
| Status | Ready to implement |
| Created | 2026-01-29 |
