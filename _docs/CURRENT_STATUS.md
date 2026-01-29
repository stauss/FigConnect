# FigConnect - Current Status & Direction

**Last Updated:** January 28, 2026  
**Branch:** 001-figma-mcp-spec

---

## Project Overview

FigConnect is an AI-powered Figma design collaborator that enables AI assistants to read from and write to Figma files through the Model Context Protocol (MCP).

### Core Principle

> **AI as Decision-Maker, Code as Worker**
>
> - Code/Plugin handles: data gathering, aggregation, transformation, execution
> - AI handles: decision-making, pattern recognition, creative generation

---

## Architecture

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

## What's Built (Phases 1-3)

### MCP Server (`figma-mcp-server/`)

**9 Read Tools:**

- `get_file_structure` - Node tree of a file
- `get_node_details` - Properties of specific nodes
- `search_nodes` - Find by name/type
- `get_components` - List all components
- `get_styles` - Color/text/effect styles
- `get_variables` - Design tokens
- `export_node` - Export as PNG/SVG/PDF
- `get_comments` - File comments
- `get_file_versions` - Version history

**4 Command Tools:**

- `post_command` - Send command to plugin
- `get_command_status` - Check command result
- `post_batch_commands` - Multiple commands
- `get_queue_stats` - Queue statistics

### Figma Plugin (`figma-plugin-bridge/`)

**13 Commands Supported:**

**Creation:**

- `create_frame`
- `create_text`
- `create_rectangle`
- `create_component`

**Manipulation:**

- `move_node` - Move nodes by delta or absolute position
- `duplicate_node` - Duplicate single or multiple nodes
- `delete_node` - Delete single or multiple nodes
- `resize_node` - Resize nodes with aspect ratio option

**Grouping:**

- `group_nodes` - Combine multiple nodes into a group
- `ungroup_nodes` - Break apart a group into individual nodes

**Layout & Styling:**

- `apply_auto_layout` - Apply auto-layout to frames
- `apply_style` - Apply Figma styles
- `set_properties` - Set node properties (supports gradients, effects, constraints, strokes, text properties)

### Bridge Server

- Runs on `localhost:3030`
- Endpoints: `/api/commands`, `/api/commands/:id/response`, `/api/health`, `/api/stats`

---

## What's Missing

### Collaboration Tools (Interactive Mode)

| Tool             | Purpose                     | Status       |
| ---------------- | --------------------------- | ------------ |
| `move_node`      | Reposition elements         | ✅ Built     |
| `duplicate_node` | Copy elements               | ✅ Built     |
| `delete_node`    | Remove elements             | ✅ Built     |
| `resize_node`    | Resize elements             | ✅ Built     |
| `group_nodes`    | Combine elements            | ✅ Built     |
| `ungroup_nodes`  | Break apart groups          | ✅ Built     |
| `search_by_name` | Find nodes by name          | ❌ Not built |
| `find_similar`   | Find nodes matching pattern | ❌ Not built |

**Note:** `get_selection` and `select_node` removed - comments handle targeting via pins

### Audit Tools (Analyst Mode)

| Tool               | Purpose                             | Status       |
| ------------------ | ----------------------------------- | ------------ |
| `audit_colors`     | Scan and summarize color usage      | ❌ Not built |
| `audit_typography` | Scan and summarize font usage       | ❌ Not built |
| `audit_spacing`    | Scan and summarize spacing patterns | ❌ Not built |

### Style CRUD

| Tool           | Purpose                        | Status       |
| -------------- | ------------------------------ | ------------ |
| `create_style` | Create color/text/effect style | ❌ Not built |
| `update_style` | Modify existing style          | ❌ Not built |
| `delete_style` | Remove style                   | ❌ Not built |

### Plugin UI

- Currently headless (hidden iframe for network access)
- Uses `figma.notify()` for basic feedback
- No debugging/visibility tools yet

---

## AI Operation Modes

### 1. Collaborator Mode (Interactive)

Working with a designer in real-time:

- "What's selected?"
- "Find all buttons"
- "Move this right 20px"
- "Duplicate this component"

**Requires:** Selection awareness, node manipulation, search

### 2. Analyst Mode (Design System Management)

Auditing and systematizing designs:

- "Audit all colors in this file"
- "Create styles from the patterns you found"
- "Standardize typography"

**Requires:** Aggregation tools, style CRUD, pattern recognition

---

## UX Breakthrough / Key Insights

> **Bridge Architecture Simplification (70% Development Reduction)**
>
> The original plan involved complex comment-based command posting and polling. The breakthrough was realizing we could use a simple HTTP bridge server running on localhost:3030 that the plugin polls directly. This eliminated:
>
> - Complex comment parsing logic
> - Comment reply threading
> - Figma API comment posting limitations
> - Polling complexity
>
> **New Architecture**: MCP Server → HTTP Bridge (port 3030) → Plugin polls bridge → Execute → Post response back to bridge → MCP Server retrieves
>
> **Result**: Much simpler, more reliable, faster execution. Reduced development time by ~70% while improving reliability.

---

## Decision Log

| Date       | Decision                       | Rationale                                      |
| ---------- | ------------------------------ | ---------------------------------------------- |
| 2026-01-28 | Build tools before UI          | Real usage reveals actual needs vs speculation |
| 2026-01-28 | Start with collaboration tools | Enables interactive sessions to learn from     |

---

## Next Steps

**Immediate Priority:** Phase A - Collaboration Basics

1. `get_selection` - essential for context
2. `select_node` - AI can point to things
3. `move_node` / `duplicate_node` / `delete_node` - basic manipulation

**Then:** Use it in real design sessions to inform UI needs

---

## Key Files

| File                                           | Purpose                    |
| ---------------------------------------------- | -------------------------- |
| `figma-mcp-server/src/tools/registry.ts`       | MCP tool definitions       |
| `figma-mcp-server/src/tools/command-tools.ts`  | Command posting logic      |
| `figma-mcp-server/src/bridge/server.ts`        | HTTP bridge server         |
| `figma-plugin-bridge/src/commands/executor.ts` | Command router in plugin   |
| `figma-plugin-bridge/src/code.ts`              | Plugin entry point         |
| `figma-plugin-bridge/src/ui.html`              | Hidden UI (network access) |

---

## Repository

- **GitHub:** stauss/FigConnect
- **Branch:** 001-figma-mcp-spec
- **Docs:** `_docs/PHASE_1.md` through `_docs/PHASE_4.md`
