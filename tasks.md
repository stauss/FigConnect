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

## Dependencies

1. **Setup & Foundation** (T001-T006) must be completed before any tools.
2. **Read-Only Tools** (T007-T014) enable US1 and are prerequisites for US2 (need to read before writing intelligently).
3. **Command System** (T015-T018) enables US2 and is a prerequisite for US3 (plugin needs commands to execute).
4. **Plugin Bridge** (T019-T022) enables US3 and completes the write loop.

## Implementation Strategy

1. **MVP (Phase 1-3)**: Focus on getting the MCP server running with Read capabilities first. This delivers immediate value (context gathering) even without write access.
2. **Write Capability (Phase 4-5)**: Once reading is stable, implement the "Bridge" architecture.

## Parallel Execution Opportunities

- **T004 (Client)** and **T005 (Utils)** can be built in parallel.
- **T007-T012 (Tools)** are largely independent once the Client is ready.
- **Phase 4 (Server-side commands)** and **Phase 5 (Plugin-side execution)** can be developed in parallel if the JSON schema (T015) is agreed upon first.
