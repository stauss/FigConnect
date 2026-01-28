# Implementation Plan: Figma MCP Server Project

**Branch**: `001-figma-mcp-spec` | **Date**: 2025-01-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-figma-mcp-spec/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Build a Model Context Protocol (MCP) server that enables AI agents (Claude Code) to interact with Figma design files. The system consists of two main components: (1) an MCP server that provides read/write operations via Figma REST API and comment-based commands, and (2) a Figma plugin that executes commands posted as comments. The hybrid architecture bridges Figma's read-only REST API limitations by using comments as a command channel, enabling AI-powered design creation and manipulation.

## Technical Context

**Language/Version**: TypeScript 5.3+ (strict mode), Node.js 18+  
**Primary Dependencies**:

- `@modelcontextprotocol/sdk` (MCP protocol implementation)
- `node-fetch` (HTTP client for Figma API)
- `zod` (schema validation)
- `@figma/plugin-typings` (Figma Plugin API types)
- `dotenv` (environment variable management)

**Storage**: In-memory command queue and file structure cache (no persistent storage required for MVP)  
**Testing**: Jest or Vitest with TypeScript support  
**Target Platform**:

- MCP Server: Node.js runtime (cross-platform: macOS, Linux, Windows)
- Figma Plugin: Figma desktop app (macOS, Windows, Linux)

**Project Type**: Hybrid system (MCP server + Figma plugin)  
**Performance Goals**:

- File structure reads: <5 seconds for files up to 1000 nodes
- Command execution: 95% success rate within 30 seconds
- API rate limit: Handle 1000 requests/minute with automatic queuing

**Constraints**:

- Figma REST API is read-only for node manipulation (workaround: comment-based commands)
- Plugin must be running in Figma desktop app for command execution
- Network connectivity required for API calls
- Token-based authentication (no OAuth flow)

**Scale/Scope**:

- Single-user localhost deployment
- Support for files with up to 1000 nodes efficiently
- Batch operations up to 50 commands
- Configurable logging for debugging multi-system integration

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

**Note**: Constitution file appears to be a template. Assuming standard development practices:

- ✅ Test-first development approach
- ✅ Clear separation of concerns (MCP server vs plugin)
- ✅ Error handling and logging
- ✅ Configuration management (environment variables)
- ✅ Documentation requirements

## Project Structure

### Documentation (this feature)

```text
specs/001-figma-mcp-spec/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
figma-mcp-server/
├── src/
│   ├── index.ts                 # MCP server entry point
│   ├── types.ts                 # Shared TypeScript types
│   ├── config.ts                # Configuration management
│   ├── logger.ts                # Logging utility
│   │
│   ├── tools/
│   │   ├── registry.ts          # Tool registration
│   │   ├── read-tools.ts        # Read operations
│   │   ├── export-tools.ts      # Export operations
│   │   └── command-tools.ts     # Command posting tools
│   │
│   ├── figma/
│   │   ├── client.ts            # Figma API wrapper
│   │   └── utils.ts             # Helper functions
│   │
│   ├── commands/
│   │   ├── parser.ts            # Command parsing
│   │   ├── validator.ts         # Command validation
│   │   └── templates.ts         # Command templates
│   │
│   ├── queue/
│   │   ├── manager.ts           # Command queue
│   │   └── polling.ts           # Result polling
│   │
│   └── cache/
│       └── file-cache.ts        # File structure caching
│
├── tests/
│   ├── setup.ts
│   ├── client.test.ts
│   ├── read-tools.test.ts
│   ├── export-tools.test.ts
│   └── command-tools.test.ts
│
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md

figma-plugin-bridge/
├── src/
│   ├── code.ts                  # Main plugin code
│   ├── ui.html                  # Hidden UI for network
│   │
│   ├── commands/
│   │   ├── executor.ts          # Command execution router
│   │   ├── frame.ts             # Frame operations
│   │   ├── text.ts              # Text operations
│   │   ├── rectangle.ts         # Rectangle operations
│   │   ├── layout.ts            # Auto-layout operations
│   │   ├── component.ts         # Component operations
│   │   └── styles.ts            # Style operations
│   │
│   ├── polling/
│   │   ├── comments.ts          # Poll Figma comments
│   │   ├── processor.ts         # Process command queue
│   │   └── types.ts             # Polling types
│   │
│   └── utils/
│       ├── colors.ts            # Color conversion
│       ├── fonts.ts             # Font loading
│       ├── logger.ts            # Plugin logging
│       └── nodes.ts             # Node utilities
│
├── manifest.json                # Plugin manifest
├── package.json
├── tsconfig.json
└── README.md
```

**Structure Decision**: Two separate projects (MCP server and Figma plugin) due to different runtime environments and deployment models. The MCP server runs as a Node.js process, while the plugin runs within the Figma desktop app. They communicate via Figma comments as an intermediary channel.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation                                   | Why Needed                                                   | Simpler Alternative Rejected Because                               |
| ------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------ |
| Two separate projects (MCP server + plugin) | Different runtime environments (Node.js vs Figma Plugin API) | Single project insufficient due to incompatible execution contexts |
| Comment-based command system                | Figma REST API is read-only for node manipulation            | Direct API calls impossible; comment system is required workaround |
