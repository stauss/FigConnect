# FigConnect

> AI-powered Figma design collaborator using the Model Context Protocol (MCP)

FigConnect enables AI assistants (Claude Code, Cursor, etc.) to read from and write to Figma files through natural language prompts.

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐     ┌──────────────┐
│   AI Assistant  │────▶│   MCP Server     │────▶│  HTTP Bridge    │────▶│ Figma Plugin │
│   (Claude, etc) │     │  (localhost)     │     │  (port 3030)    │     │  (in Figma)  │
└─────────────────┘     └──────────────────┘     └──────────────────┘     └──────────────┘
```

**Core Principle**: AI as Decision-Maker, Code as Worker
- AI handles decision-making, pattern recognition, creative generation
- Code handles data gathering, aggregation, transformation, execution

## Quick Start

```bash
# 1. Start MCP Server (Terminal 1)
cd figma-mcp-server && npm install && npm run build && npm start

# 2. Build & Import Plugin into Figma Desktop
cd figma-plugin-bridge && npm install && npm run build
# Import manifest.json via Figma → Plugins → Development

# 3. Optional: Start Control Center (Terminal 2)
cd control-center && npm install && npm run dev
# Open http://localhost:3032
```

See [QUICKSTART.md](./QUICKSTART.md) for detailed setup and terminal commands.

## Project Structure

```
FigConnect/
├── figma-mcp-server/     # MCP Server + HTTP Bridge
├── figma-plugin-bridge/  # Figma Plugin (command execution)
├── control-center/       # Browser-based monitoring UI
├── kitty-specs/          # Feature specifications
├── .kittify/             # Spec Kitty framework
└── QUICKSTART.md         # Command reference
```

## Components

| Component | Port | Purpose |
|-----------|------|---------|
| MCP Server | stdio/3031 | Exposes Figma tools via MCP |
| HTTP Bridge | 3030 | Queues commands for plugin |
| Figma Plugin | - | Executes commands in Figma |
| Control Center | 3032 | Monitoring dashboard |

## Development

This project uses **Spec Kitty** for spec-driven development.

```bash
# View project dashboard
spec-kitty dashboard

# Check current work status
spec-kitty agent tasks status
```

**Workflow**: Specify → Plan → Tasks → Implement → Review → Merge

See:
- [QUICKSTART.md](./QUICKSTART.md) - Commands and workflow reference
- [figma-plugin-bridge/development_workflow.md](./figma-plugin-bridge/development_workflow.md) - Full workflow guide
- [.kittify/memory/constitution.md](./.kittify/memory/constitution.md) - Project principles

## Current Status

**Completed (Phases 1-3)**:
- 9 read-only MCP tools (file structure, nodes, styles, exports)
- 4 command tools (post, status, batch, stats)
- 13 plugin commands (create, manipulate, group, style)

**In Progress (Phase A)**: Comment-based collaboration
- Designers comment `Claude: do X` on canvas
- AI resolves target, executes, replies in-thread

## License

MIT
