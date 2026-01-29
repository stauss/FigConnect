# Development Workflow (Spec Kitty)

This project uses the **Spec Kitty** framework for spec-driven development. This ensures all features are specified, planned, and implemented according to our Constitution.

## 1. Core Principles

The **Constitution** (`.kittify/memory/constitution.md`) is the living document that defines our engineering standards.

- **Rule**: All code and specifications must adhere to these principles.
- **Modification**: To change a principle, update the Constitution first, then run `/spec-kitty.constitution`.

## 2. The Workflow

For every new feature, bug fix, or significant refactor, follow this cycle:

### Phase 1: Specify (Define WHAT to build)

```text
/spec-kitty.specify

Build [your feature description here]
```

**Output**: Creates `kitty-specs/###-feature-name/spec.md` with user stories and requirements.

### Phase 2: Plan (Define HOW to build)

```text
/spec-kitty.plan

[Technical approach and architecture decisions]
```

**Output**: Creates `plan.md` with technical architecture and implementation approach.

### Phase 3: Tasks (Break into Work Packages)

```text
/spec-kitty.tasks
```

**Output**: Creates `tasks.md` and `tasks/WP##.md` files with work packages ready for implementation.

### Phase 4: Implement (Build the feature)

```text
/spec-kitty.implement
```

**What happens**:

1. Auto-detects first WP with `lane: "planned"`
2. Moves WP to `lane: "doing"`
3. Displays the implementation prompt
4. Agent implements, then moves to `lane: "for_review"`

### Phase 5: Review (Quality gate)

```text
/spec-kitty.review
```

**What happens**:

1. Reviews completed work package
2. Either approves (→ `done`) or requests changes (→ `planned`)

### Phase 6: Accept & Merge

```text
/spec-kitty.accept
/spec-kitty.merge --push
```

**What happens**:

1. Validates all WPs are complete
2. Merges feature branch to main
3. Cleans up worktree

## 3. Directory Structure

```text
FigConnect/
├── .kittify/                      # Spec Kitty framework
│   ├── memory/
│   │   └── constitution.md        # Project principles
│   ├── missions/                  # Workflow templates
│   └── config.yaml                # Agent configuration
│
├── .claude/                       # Claude Code commands
│   └── commands/
│       └── spec-kitty.*.md        # Slash commands
│
├── kitty-specs/                   # Feature specifications
│   └── 001-figma-mcp-server/
│       ├── spec.md                # What we're building
│       ├── plan.md                # How we're building it
│       ├── tasks.md               # Work packages overview
│       └── tasks/
│           ├── WP01.md            # Work Package 1
│           ├── WP02.md            # Work Package 2
│           └── ...
│
├── figma-mcp-server/              # MCP Server source
├── figma-plugin-bridge/           # Figma Plugin source
└── control-center/                # Control Center UI
```

## 4. Slash Commands Reference

| Command | When to Use |
|---------|-------------|
| `/spec-kitty.constitution` | Establish or update project principles |
| `/spec-kitty.specify` | Create new feature specification |
| `/spec-kitty.plan` | Define technical architecture |
| `/spec-kitty.tasks` | Generate work packages |
| `/spec-kitty.implement` | Execute implementation |
| `/spec-kitty.review` | Review completed work |
| `/spec-kitty.accept` | Validate feature complete |
| `/spec-kitty.merge` | Merge and cleanup |
| `/spec-kitty.dashboard` | View kanban board |

## 5. Quick Start

1. **New feature**: Start with `/spec-kitty.specify`
2. **View progress**: Run `/spec-kitty.dashboard`
3. **Continue work**: Run `/spec-kitty.implement`
4. **Check status**: `spec-kitty agent tasks status`

## 6. Links

- **Constitution**: `.kittify/memory/constitution.md`
- **Current Feature**: `kitty-specs/001-figma-mcp-server/`
- **Dashboard**: http://127.0.0.1:9239 (when running)
