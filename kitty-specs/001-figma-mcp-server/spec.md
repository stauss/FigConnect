# Specification: Figma MCP Server

> AI-powered Figma design collaborator enabling AI assistants to read from and write to Figma files through the Model Context Protocol (MCP).

---

## 1. Overview

### Vision
Create an MCP server that bridges Claude Code (and other AI assistants) with Figma, enabling AI-powered design creation and modification through natural language prompts.

### Core Principle
> **AI as Decision-Maker, Code as Worker**
> - Code/Plugin handles: data gathering, aggregation, transformation, execution
> - AI handles: decision-making, pattern recognition, creative generation

### Why MCP?
The Model Context Protocol (MCP) provides a standardized way for AI assistants to connect to external tools. The MCP server exposes Figma capabilities that any MCP-compatible AI assistant can use.

---

## 2. Problem Statement

Figma's REST API is **read-only for node manipulation**. You can read file structure, export assets, and get comments, but you cannot create, move, or modify design elements directly.

### The Solution: Hybrid Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐     ┌──────────────┐
│   AI Assistant  │────▶│   MCP Server     │────▶│  HTTP Bridge    │────▶│ Figma Plugin │
│   (Claude, etc) │     │  (localhost)     │     │  (port 3030)    │     │  (in Figma)  │
└─────────────────┘     └──────────────────┘     └──────────────────┘     └──────────────┘
                                                                                  │
                                                                                  ▼
                                                                          ┌──────────────┐
                                                                          │ Figma Canvas │
                                                                          └──────────────┘
```

**Data Flow:**
1. AI calls MCP tool (e.g., `post_command`)
2. MCP server queues command, exposes via HTTP bridge
3. Plugin polls bridge every 3 seconds
4. Plugin executes command on Figma canvas
5. Plugin posts response back to bridge
6. MCP server returns result to AI

---

## 3. User Stories

### US1: Read Figma Files
As an AI assistant, I want to read Figma file structure, node properties, styles, and components so I can understand and analyze designs.

**Acceptance Criteria:**
- Can retrieve complete file node tree
- Can get detailed properties for any node
- Can search nodes by name/type
- Can list components, styles, and variables
- Can export nodes as PNG/SVG/PDF

### US2: Create and Modify Designs
As an AI assistant, I want to create frames, text, rectangles, and other elements so I can generate designs from natural language.

**Acceptance Criteria:**
- Can create frames, text, rectangles, components
- Can move, duplicate, delete, resize nodes
- Can group and ungroup nodes
- Can apply auto-layout, styles, and properties
- Operations return success/failure with node IDs

### US3: Collaborate with Designers
As an AI assistant, I want to understand designer context (selection, comments, file state) so I can collaborate effectively in real-time.

**Acceptance Criteria:**
- Can resolve target nodes from comment context
- Can respond to designer comments in-thread
- Can handle "Claude: do X" comment commands
- Destructive actions require confirmation

---

## 4. Current Implementation Status

### Completed (Phases 1-3)

**MCP Server - 9 Read Tools:**
- `get_file_structure` - Node tree of a file
- `get_node_details` - Properties of specific nodes
- `search_nodes` - Find by name/type
- `get_components` - List all components
- `get_styles` - Color/text/effect styles
- `get_variables` - Design tokens
- `export_node` - Export as PNG/SVG/PDF
- `get_comments` - File comments
- `get_file_versions` - Version history

**MCP Server - 4 Command Tools:**
- `post_command` - Send command to plugin
- `get_command_status` - Check command result
- `post_batch_commands` - Multiple commands
- `get_queue_stats` - Queue statistics

**Figma Plugin - 13 Commands:**

| Category | Commands |
|----------|----------|
| Creation | `create_frame`, `create_text`, `create_rectangle`, `create_component` |
| Manipulation | `move_node`, `duplicate_node`, `delete_node`, `resize_node` |
| Grouping | `group_nodes`, `ungroup_nodes` |
| Layout/Styling | `apply_auto_layout`, `apply_style`, `set_properties` |

### In Progress (Phase A)

**Comment-Based Collaboration Loop:**
- Designer leaves comment: `Claude: fix spacing here`
- System acknowledges: "Queued ⏳"
- AI resolves target node from comment pin location
- AI executes commands
- AI replies in-thread: "Done ✅ - moved 20px right"

---

## 5. Non-Goals

- Real-time multiplayer sync (use Figma's native collaboration)
- Direct Figma API node creation (impossible - REST is read-only)
- Browser-based plugin (requires Figma Desktop for full API access)
- Production deployment (MVP is local-first)

---

## 6. Technical Constraints

### Figma API Limitations
- REST API is read-only for nodes
- Rate limits: 1000 requests per minute per token
- Plugin API requires Figma Desktop
- Async font loading can slow operations

### Workarounds
- HTTP bridge instead of direct API
- Plugin polling (3-second intervals)
- Batch operations to reduce API calls
- Local caching for file structure

---

## 7. Success Metrics

### MVP (Phases 1-3)
- [x] MCP server connects to Claude Code
- [x] Can read any Figma file structure
- [x] Can export nodes as PNG/SVG
- [x] Can post commands via bridge
- [x] Plugin executes basic commands
- [x] Results return to MCP server
- [x] Error handling for common cases

### Full Feature (Phase A+)
- [ ] Comment-based task intake
- [ ] Target node resolution from comment pins
- [ ] Safety gating for destructive operations
- [ ] In-thread replies with status updates

---

## 8. References

- **MCP Specification**: https://modelcontextprotocol.io/
- **Figma REST API**: https://www.figma.com/developers/api
- **Figma Plugin API**: https://www.figma.com/plugin-docs/

---

## Metadata

| Field | Value |
|-------|-------|
| Status | In Progress |
| Phase | A (Collaboration Basics) |
| Mission | software-dev |
| Created | 2026-01-29 |
| Author | Claude (from archived docs) |
