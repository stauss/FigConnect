# FigConnect Quick Reference

> Essential commands and workflows for daily development

---

## Table of Contents

1. [Starting the Project](#starting-the-project)
2. [Spec Kitty Workflow](#spec-kitty-workflow)
3. [Terminal Commands](#terminal-commands)
4. [Slash Commands Reference](#slash-commands-reference)
5. [Working with Worktrees](#working-with-worktrees)
6. [Figma Plugin Development](#figma-plugin-development)
7. [Troubleshooting](#troubleshooting)

---

## Starting the Project

### Quick Start (All Components)

```bash
# Terminal 1: Start MCP Server (includes bridge on port 3030)
cd figma-mcp-server
npm install && npm run build
npm start

# Terminal 2: Start Control Center (optional, port 3032)
cd control-center
npm install
npm run dev

# Terminal 3: Build Plugin (then import into Figma)
cd figma-plugin-bridge
npm install
npm run build
# or for watch mode:
npm run watch
```

### Import Plugin into Figma
1. Open Figma Desktop
2. Go to **Plugins → Development → Import plugin from manifest...**
3. Select `figma-plugin-bridge/manifest.json`
4. Run from **Plugins → Development → FigYah Bridge**

### Configure Claude Code MCP
Add to `~/.config/claude/claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "figyah": {
      "command": "node",
      "args": ["/path/to/FigConnect/figma-mcp-server/dist/index.js"],
      "env": {
        "FIGMA_ACCESS_TOKEN": "your-token-here"
      }
    }
  }
}
```

---

## Spec Kitty Workflow

### The Development Cycle

```
1. SPECIFY  →  2. PLAN  →  3. TASKS  →  4. IMPLEMENT  →  5. REVIEW  →  6. MERGE
   (WHAT)       (HOW)       (WHO)        (BUILD)         (CHECK)       (SHIP)
```

### Detailed Steps

| Step | Command | What Happens |
|------|---------|--------------|
| 1 | `/spec-kitty.specify` | Create feature spec in `kitty-specs/###-feature/` |
| 2 | `/spec-kitty.plan` | Define technical approach and architecture |
| 3 | `/spec-kitty.tasks` | Break into work packages (WP01, WP02, etc.) |
| 4 | `/spec-kitty.implement` | Auto-selects first `planned` WP, moves to `doing` |
| 5 | `/spec-kitty.review` | Review completed work, approve or request changes |
| 6 | `/spec-kitty.merge` | Merge to main and cleanup |

### Work Package States

```
planned → doing → for_review → done
                      ↓
                   planned (if changes needed)
```

---

## Terminal Commands

### Spec Kitty CLI

```bash
# Dashboard & Status

                 # Open kanban board in browser
spec-kitty dashboard --port 4000        # Specify port
spec-kitty dashboard --kill             # Stop dashboard
spec-kitty agent tasks status           # View WP status in terminal

# Feature Management
spec-kitty agent feature create-feature "Feature Name"
spec-kitty agent feature check-prerequisites
spec-kitty agent feature accept

# Task Management
spec-kitty agent tasks list-tasks                  # List all tasks by lane
spec-kitty agent tasks mark-status WP01 --status doing
spec-kitty agent tasks move-task WP01 --to for_review
spec-kitty agent tasks add-history WP01 --note "Added tests"

# Workflow Automation
spec-kitty agent workflow implement WP01 --agent claude
spec-kitty agent workflow review WP01 --agent claude

# Worktree Operations
spec-kitty implement WP01              # Create worktree for WP01
spec-kitty implement WP02 --base WP01  # Branch from WP01

# Validation & Merge
spec-kitty accept                       # Validate all WPs complete
spec-kitty merge --push                 # Merge and push
spec-kitty merge --dry-run              # Preview merge
spec-kitty merge --strategy squash      # Squash commits

# Diagnostics
spec-kitty diagnostics                  # Project health check
spec-kitty verify-setup                 # Verify configuration
spec-kitty upgrade                      # Apply migrations
spec-kitty upgrade --dry-run            # Preview migrations
```

### Git Worktree Commands

```bash
# List all worktrees
git worktree list

# Create worktree manually
git worktree add .worktrees/001-feature-WP01 -b 001-feature-WP01

# Remove worktree
git worktree remove .worktrees/001-feature-WP01

# Navigate to worktree
cd .worktrees/001-feature-WP01

# Prune stale worktrees
git worktree prune
```

### FigConnect Development

```bash
# MCP Server
cd figma-mcp-server
npm install
npm run build               # Build TypeScript
npm start                   # Start server (stdio transport)
npm run dev                 # Development mode with watch
npm test                    # Run tests

# Plugin
cd figma-plugin-bridge
npm install
npm run build               # Build plugin
npm run watch               # Watch mode for development
npm test                    # Run tests

# Control Center
cd control-center
npm install
npm run dev                 # Start dev server (port 3032)
npm run build               # Production build

# Check Services
curl http://localhost:3030/api/health   # Bridge health
curl http://localhost:3030/api/stats    # Queue stats
curl http://localhost:3032              # Control center
```

---

## Slash Commands Reference

### Core Workflow (In Order)

| Command | When to Use | Output |
|---------|-------------|--------|
| `/spec-kitty.constitution` | Once per project | `.kittify/memory/constitution.md` |
| `/spec-kitty.specify` | Start new feature | `kitty-specs/###-feature/spec.md` |
| `/spec-kitty.plan` | After specify | `plan.md` |
| `/spec-kitty.tasks` | After plan | `tasks.md` + `tasks/WP##.md` |
| `/spec-kitty.implement` | Ready to code | Moves WP to `doing` |
| `/spec-kitty.review` | Code complete | Reviews WP |
| `/spec-kitty.accept` | All WPs done | Validates feature |
| `/spec-kitty.merge` | Feature approved | Merges to main |

### Optional Enhancement

| Command | Purpose |
|---------|---------|
| `/spec-kitty.clarify` | Ask questions before planning |
| `/spec-kitty.research` | Technical research |
| `/spec-kitty.analyze` | Cross-artifact consistency check |
| `/spec-kitty.checklist` | Generate quality checklist |
| `/spec-kitty.dashboard` | Open kanban board |

---

## Working with Worktrees

### Concept

Worktrees allow parallel development without branch switching. Each work package gets its own directory.

```
FigConnect/                       # Main repo (main branch)
├── .worktrees/
│   ├── 001-feature-WP01/         # WP01 worktree
│   ├── 001-feature-WP02/         # WP02 worktree
│   └── 001-feature-WP03/         # WP03 worktree
├── kitty-specs/
└── (main branch files)
```

### Creating Worktrees

```bash
# Automatic (recommended)
spec-kitty implement WP01

# With dependency
spec-kitty implement WP02 --base WP01

# Manual
git worktree add .worktrees/001-feature-WP01 -b 001-feature-WP01
```

### Navigating Worktrees

```bash
# Enter worktree
cd .worktrees/001-feature-WP01

# Return to main
cd ../..

# Or use absolute path
cd /path/to/FigConnect
```

### Dependency Patterns

```bash
# Linear chain: WP01 → WP02 → WP03
spec-kitty implement WP01
spec-kitty implement WP02 --base WP01
spec-kitty implement WP03 --base WP02

# Fan-out: WP01 branches to WP02, WP03, WP04
spec-kitty implement WP01
spec-kitty implement WP02 --base WP01 &
spec-kitty implement WP03 --base WP01 &
spec-kitty implement WP04 --base WP01 &

# Diamond merge: WP02+WP03 converge to WP04
spec-kitty implement WP04 --base WP03
cd .worktrees/001-feature-WP04
git merge 001-feature-WP02
```

---

## Figma Plugin Development

### Plugin Commands Available

| Command | Description |
|---------|-------------|
| `create_frame` | Create new frame |
| `create_text` | Create text node |
| `create_rectangle` | Create rectangle |
| `create_component` | Create component |
| `move_node` | Move by delta or absolute |
| `duplicate_node` | Duplicate nodes |
| `delete_node` | Delete nodes |
| `resize_node` | Resize with aspect ratio option |
| `group_nodes` | Group multiple nodes |
| `ungroup_nodes` | Ungroup nodes |
| `apply_auto_layout` | Apply auto-layout |
| `apply_style` | Apply Figma styles |
| `set_properties` | Set node properties |

### Testing Commands

```bash
# In Claude Code, test MCP tools:
# "Show me the structure of my Figma file"
# "Create a frame called 'Test' at 0,0 with width 400 and height 300"
# "Move node 123:456 right by 50 pixels"
# "Delete node 123:456"
```

### Debugging

```bash
# Check if bridge is receiving commands
curl http://localhost:3030/api/commands

# Check queue stats
curl http://localhost:3030/api/stats

# View plugin console in Figma
# Plugins → Development → Open Console
```

---

## Troubleshooting

### Common Issues

**MCP Server won't start**
```bash
# Kill process on port 3030
lsof -ti:3030 | xargs kill -9

# Check for errors
npm run build
npm start 2>&1 | head -50
```

**Plugin not connecting**
1. Ensure MCP server is running
2. Check bridge health: `curl http://localhost:3030/api/health`
3. Restart plugin in Figma

**Commands not executing**
```bash
# Check queue for pending commands
curl http://localhost:3030/api/commands

# Ensure plugin is polling (check Figma console)
```

**Control Center can't connect**
```bash
# Verify bridge is running
curl http://localhost:3030/api/health

# Check CORS (should be allowed in dev)
```

**Worktree issues**
```bash
# Clean up stale worktrees
git worktree prune

# Force remove worktree
git worktree remove --force .worktrees/001-feature-WP01
```

### Environment Variables

| Variable | Purpose | Default |
|----------|---------|---------|
| `FIGMA_ACCESS_TOKEN` | Figma API auth | Required |
| `BRIDGE_ENABLED` | Enable bridge server | `true` |
| `BRIDGE_PORT` | Bridge server port | `3030` |
| `MCP_TRANSPORT` | `stdio` or `sse` | `stdio` |
| `LOG_LEVEL` | Logging verbosity | `info` |

---

## Key Files

| File | Purpose |
|------|---------|
| `.kittify/memory/constitution.md` | Project principles |
| `kitty-specs/001-figma-mcp-server/spec.md` | Current feature spec |
| `kitty-specs/001-figma-mcp-server/tasks/` | Work packages |
| `figma-mcp-server/src/types.ts` | All Zod schemas |
| `figma-plugin-bridge/src/commands/executor.ts` | Command routing |

---

## Daily Workflow Cheat Sheet

```bash
# Morning: Check status
spec-kitty dashboard
spec-kitty agent tasks status

# Start work: Pick a WP
/spec-kitty.implement WP01

# During work: Update status
spec-kitty agent tasks add-history WP01 --note "Progress update"

# Finish work: Move to review
spec-kitty agent tasks move-task WP01 --to for_review

# Review: Check completed work
/spec-kitty.review WP01

# Ship: Merge when all done
spec-kitty accept
spec-kitty merge --push
```

---

**Last Updated**: 2026-01-29
