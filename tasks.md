# Tasks: Figma MCP Server

## Phase 1: Project Initialization & Setup

- [ ] T001 Initialize project structure (package.json, tsconfig, dirs) in `figma-mcp-server/`
- [ ] T002 Create environment configuration and types in `figma-mcp-server/src/config.ts` & `figma-mcp-server/src/types.ts`
- [ ] T003 Implement Logger utility in `figma-mcp-server/src/logger.ts`

## Phase 2: Foundation - Figma API Client

- [ ] T004 [P] Implement FigmaClient class with auth/rate-limiting in `figma-mcp-server/src/figma/client.ts`
- [ ] T005 [P] Implement node traversal utilities in `figma-mcp-server/src/figma/utils.ts`
- [ ] T006 Create unit tests for FigmaClient in `figma-mcp-server/tests/client.test.ts`

## Phase 3: Read-Only Tools (User Story: Read Access)

- [ ] T007 [US1] Implement `get_file_structure` tool in `figma-mcp-server/src/tools/read-tools.ts`
- [ ] T008 [US1] Implement `get_node_details` tool in `figma-mcp-server/src/tools/read-tools.ts`
- [ ] T009 [US1] Implement `search_nodes` tool in `figma-mcp-server/src/tools/read-tools.ts`
- [ ] T010 [US1] Implement `get_components`, `get_styles`, `get_variables` in `figma-mcp-server/src/tools/read-tools.ts`
- [ ] T011 [US1] Implement `get_comments` and `get_file_versions` in `figma-mcp-server/src/tools/read-tools.ts`
- [ ] T012 [US1] Implement `export_node` tool in `figma-mcp-server/src/tools/export-tools.ts`
- [ ] T013 [US1] Register all tools in `figma-mcp-server/src/tools/registry.ts`
- [ ] T014 [US1] Implement MCP Server entry point in `figma-mcp-server/src/index.ts`

## Phase 4: Command System (User Story: Write Prep)

- [ ] T015 [US2] Define Command Zod schemas in `figma-mcp-server/src/commands/schema.ts`
- [ ] T016 [US2] Implement Command Parser & Validator in `figma-mcp-server/src/commands/validator.ts`
- [ ] T017 [US2] Implement `post_command` tool in `figma-mcp-server/src/tools/command-tools.ts`
- [ ] T018 [US2] Implement Queue Manager (optional/basic) in `figma-mcp-server/src/queue/manager.ts`

## Phase 5: Figma Plugin Bridge (User Story: Write Execution)

- [ ] T019 [US3] Initialize Plugin project (manifest.json) in `figma-plugin-bridge/`
- [ ] T020 [US3] Implement Polling mechanism in `figma-plugin-bridge/src/polling/`
- [ ] T021 [US3] Implement Command Executors (Frame, Text, Shapes) in `figma-plugin-bridge/src/commands/`
- [ ] T022 [US3] Implement Response posting logic in `figma-plugin-bridge/src/code.ts`

## Phase 6: Polish & Integration

- [ ] T023 Verify end-to-end flow with Claude Code
- [ ] T024 Add comprehensive documentation in `README.md`

## Phase A: Collaboration Basics (Interactive Mode) - CURRENT PRIORITY

**Status**: Ready to start  
**Goal**: Enable _async_ AI collaboration via **native Figma comments** (no custom chat UI).  
**Key shift**: Comments are the UX surface; the plugin is the execution engine.

---

### A1) Comment-Based Collaboration Loop (NEW)

> Designers leave tasks directly on the canvas using comments.  
> Example: `Claude: fix spacing here`  
> Claude replies in-thread with status + results.

#### Comment Intake & Routing (Server)

- [ ] TAC001 Define comment trigger contract
  - Primary: `Claude:` prefix (case-insensitive)
  - Secondary (optional): `/claude`
  - Treat “plain comments” as normal human comments

- [ ] TAC002 Implement comment ingestion (choose one, keep the other as fallback)
  - Webhook path (preferred): receive `FILE_COMMENT` events and enqueue tasks
  - Polling fallback: periodically call `get_comments` and diff new items

- [ ] TAC003 Add comment dedupe + cursor tracking
  - Store last-seen comment IDs / timestamps per file_key
  - Prevent double-processing (webhook retries / polling overlap)

- [ ] TAC004 Implement Comment → Task parser in `figma-mcp-server/src/comments/parser.ts`
  - Extract: file_key, comment_id, parent_id/thread_id, author, created_at, message, client_meta
  - Determine: priority (optional keywords), scope (single-node vs multi-node)

- [ ] TAC005 Implement “ack” + “reply” helpers in Figma client
  - `post_comment_reply({ file_key, parent_comment_id, message })`
  - Standardize status strings: `Queued ⏳`, `Working…`, `Needs input ❓`, `Done ✅`, `Failed 🧨`

- [ ] TAC006 Implement comment-task queue + state machine in `figma-mcp-server/src/queue/comment-queue.ts`
  - States: `queued`, `in_progress`, `needs_input`, `done`, `failed`, `canceled`
  - Capture: durations, errors, command IDs, resulting node IDs

- [ ] TAC007 Implement safety gating (Plan → Confirm → Execute)
  - Destructive actions (`delete`, bulk updates, style changes) require confirmation reply:
    - Claude replies with plan and waits for `Claude: go` in same thread

- [ ] TAC008 Add observability for comment tasks
  - Structured logs by task_id/comment_id
  - `/api/stats` includes queue counts by status + average durations

#### Comment Context → Target Node Resolution (Plugin)

- [ ] TAC009 Implement `resolve_target_from_comment` command executor in `figma-plugin-bridge/src/commands/comments.ts`
  - Input: `{ frame_node_id?, client_meta, x?, y?, thread_id/comment_id }`
  - Output: `{ target_node_id, confidence, reason, boundsSnapshot }`
  - Approach: use frame + offset hit-testing to find the best node under the comment pin

- [ ] TAC010 Implement optional “pointing” feedback
  - `flash_node` / `focus_viewport_on_node` command for UX (“Claude is working _here_”)

#### Intent → Actions (Use existing command system)

- [ ] TAC011 Add “comment task router” in MCP server
  - Steps:
    1. parse comment task
    2. resolve target node (via plugin command if needed)
    3. gather context (node details / nearby nodes / styles)
    4. decide actions (AI)
    5. execute commands (existing bridge)
    6. reply in thread with summary + any follow-ups

- [ ] TAC012 Add task templates for common comment ops (quick wins)
  - “move X by N px”, “duplicate”, “delete”, “rename”, “apply style”, “fix padding”
  - Prefer small, composable commands

---

### A2) Core Manipulation Commands (Still Needed)

These remain the core “hands” that make comment tasks actionable.

- [ ] TA003 Implement `move_node` command executor in `figma-plugin-bridge/src/commands/manipulation.ts`
  - Move nodes by delta (x, y) or absolute position
  - Command: `move_node` with `node_id`, `x`, `y`, `relative` flag

- [ ] TA004 Implement `duplicate_node` command executor in `figma-plugin-bridge/src/commands/manipulation.ts`
  - Duplicate specified nodes
  - Command: `duplicate_node` with `node_id` (or `node_ids`)

- [ ] TA005 Implement `delete_node` command executor in `figma-plugin-bridge/src/commands/manipulation.ts`
  - Delete specified nodes
  - Command: `delete_node` with `node_id` or `node_ids` array

- [ ] TA007 Add manipulation command types in `figma-mcp-server/src/commands/types.ts`
  - Define Zod schemas for `move_node`, `duplicate_node`, `delete_node`

- [ ] TA008 Update command executor router in `figma-plugin-bridge/src/commands/executor.ts`
  - Add routing for manipulation + comment commands
  - Ensure errors are returned in a structured response

- [ ] TA006 Register collaboration tools in `figma-mcp-server/src/tools/registry.ts`
  - Register any new MCP tools used by the comment-task pipeline (if needed)
  - Ensure command schemas are available to the validator

---

### A3) Deprioritized / Optional (Selection-Based)

Keep these only if you find gaps during real usage.

- [ ] TA001 Implement `get_selection` tool in `figma-mcp-server/src/tools/collaboration-tools.ts` (optional)
- [ ] TA002 Implement `select_node` tool in `figma-mcp-server/src/tools/collaboration-tools.ts` (optional)

---

### Implementation Notes (Updated)

- Comments are the primary UX surface; plugin UI stays minimal.
- Node manipulation and comment-context targeting require **plugin execution** (not REST-only).
- Start with a _single-file_ MVP: one file_key, one team, prove the loop.

---

### Testing Strategy (Updated)

1. Create comment with `Claude:` prefix pinned to a specific element
2. Verify ingestion → task creation → immediate “Queued ⏳” reply
3. Verify target resolution returns correct `target_node_id`
4. Verify manipulation command runs end-to-end (move/duplicate/delete)
5. Verify completion reply summarizes actions + any follow-ups
6. Verify safety gating: destructive action requires `Claude: go`

---

### (Future) Integrations (Not this phase)

- Slack notifications + screenshots after task completion
- Daily summaries, “needs input” pings, batch reports
