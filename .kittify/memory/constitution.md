# FigConnect Constitution

> The authoritative document governing engineering standards, workflows, and principles for the FigConnect project.

---

## Preamble

### Purpose

This constitution establishes the technical standards, development workflows, and architectural principles that govern the FigConnect project. It serves as the single source of truth for how code is written, tested, and deployed.

### Audience

- **AI Assistants**: Claude Code, Cursor, and other AI agents working on this codebase
- **Human Developers**: Anyone contributing to or maintaining FigConnect
- **Reviewers**: Anyone evaluating code quality or architectural decisions

### Non-Negotiables

These principles are inviolable. Code that violates them must not be merged:

1. **No `any` types** in the command processing pipeline
2. **Spec-first development** for all non-trivial changes
3. **TypeScript strict mode** across all packages
4. **Plugin remains thin** - complex logic stays in the server
5. **All commands must be typed** with Zod schemas

### Versioning & Ratification

| Field | Value |
|-------|-------|
| Version | 2.1.0 |
| Ratified | 2026-01-29 |
| Status | Active |

**Amendment Process**: See [Section 12: Amendments](#12-amendments)

---

## 1. Project Identity

### Names

- **Public Name**: FigConnect
- **Internal Name**: FigYah
- **Package Names**: `figma-mcp-server`, `figma-plugin-bridge`, `control-center`

### Mission

Enable seamless collaboration between AI assistants and designers through Figma, using natural language to create and modify designs.

### Vision

A world where designers can say "Claude, build me a dashboard" and watch it appear in Figma, iterating through conversation.

### Core Philosophy

> **AI as Decision-Maker, Code as Worker**

| Role | AI | Code |
|------|-----|------|
| Pattern recognition | ✓ | |
| Creative generation | ✓ | |
| Decision-making | ✓ | |
| Data gathering | | ✓ |
| Aggregation | | ✓ |
| Transformation | | ✓ |
| Execution | | ✓ |

### Success Metrics

1. **Latency**: Command execution < 5 seconds end-to-end
2. **Reliability**: 99% command success rate
3. **Coverage**: Support all common Figma design operations
4. **Usability**: Natural language → working design in < 3 iterations

### Guiding Priorities (In Order)

1. **Correctness** - Code does what it claims
2. **Safety** - No data loss, no destructive surprises
3. **Clarity** - Code is readable and maintainable
4. **Performance** - Fast enough for interactive use

---

## 2. System Architecture

### Components & Responsibilities

```text
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐     ┌──────────────┐
│   AI Assistant  │────▶│   MCP Server     │────▶│  HTTP Bridge    │────▶│ Figma Plugin │
│   (Claude, etc) │     │  (localhost)     │     │  (port 3030)    │     │  (in Figma)  │
└─────────────────┘     └──────────────────┘     └──────────────────┘     └──────────────┘
         │                       │                       │                       │
         │                       │                       │                       ▼
         │                       │                       │               ┌──────────────┐
         │                       │                       │               │ Figma Canvas │
         │                       │                       │               └──────────────┘
         │                       │                       │
         │                       ▼                       ▼
         │               ┌──────────────┐       ┌──────────────┐
         │               │   Storage    │       │ Control Ctr  │
         │               │  (~/.figyah) │       │  (port 3032) │
         │               └──────────────┘       └──────────────┘
         │
         ▼
┌─────────────────┐
│   MCP Protocol  │
│  (stdio or SSE) │
└─────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Location |
|-----------|---------------|----------|
| **MCP Server** | Expose tools via MCP protocol, handle Figma API reads, queue commands | `figma-mcp-server/` |
| **Bridge Server** | HTTP API for command queuing, polling responses | `figma-mcp-server/src/bridge/` |
| **Figma Plugin** | Execute commands in Figma, report results | `figma-plugin-bridge/` |
| **Control Center** | Monitoring UI, configuration, history | `control-center/` |
| **Storage** | Persist config, history, queue state | `~/.figyah/` |

### Communication Paths

| From | To | Protocol | Port |
|------|-----|----------|------|
| AI Client | MCP Server | MCP (stdio or SSE) | stdin or 3031 |
| MCP Server | Bridge | Internal function call | N/A |
| Bridge | Plugin | HTTP REST | 3030 |
| Plugin | Bridge | HTTP REST | 3030 |
| Control Center | Bridge | HTTP REST | 3030 |
| MCP Server | Figma API | HTTPS | 443 |

### Supported Transports

| Transport | Use Case | Configuration |
|-----------|----------|---------------|
| **stdio** | Local development (Claude Desktop, Cursor) | Default |
| **SSE** | Remote/web clients | `MCP_TRANSPORT=sse` |

### Data Ownership

| Data Type | Owner | Storage |
|-----------|-------|---------|
| Configuration | MCP Server | `~/.figyah/config.json` |
| Command Queue | Bridge Server | In-memory + `~/.figyah/queue.json` |
| History | MCP Server | `~/.figyah/history.json` |
| File Cache | MCP Server | In-memory (TTL-based) |
| Plugin State | Plugin | Figma's plugin storage |

---

## 3. Protocol & Data Contracts

### Command Envelope

All commands follow this structure:

```typescript
interface CommandEnvelope {
  type: "mcp-command";
  version: "1.0";
  id: string;              // UUID, idempotency key
  command: string;         // e.g., "create_frame"
  params: Record<string, unknown>;
  parent?: string;         // Target parent node ID
  timestamp: string;       // ISO 8601
}
```

### Response Envelope

```typescript
interface ResponseEnvelope {
  type: "mcp-response";
  commandId: string;       // Matches command.id
  status: "success" | "error";
  result?: {
    nodeId?: string;
    name?: string;
    type?: string;
    [key: string]: unknown;
  };
  error?: {
    code: string;
    message: string;
  };
  timestamp: string;
  executionTime: number;   // Milliseconds
}
```

### Versioning

- **Protocol Version**: `1.0` (in command envelope)
- **Breaking Changes**: Increment major version, maintain backward compatibility for 2 versions

### Idempotency

- Commands with the same `id` should produce the same result
- Re-submitting a command should not create duplicate nodes
- Use UUIDs for command IDs

### Validation Rules

| Field | Rule |
|-------|------|
| `command` | Must be in allowed command list |
| `params` | Must pass Zod schema validation |
| `parent` | Must be valid node ID format (`###:###`) |
| String lengths | Max 10,000 characters |
| Array sizes | Max 1,000 items |
| Numeric values | Within Figma's bounds (-100000 to 100000) |

### Backward Compatibility Policy

1. **Never remove fields** from responses
2. **New fields** must be optional
3. **Deprecate** before removing (2 version warning)
4. **Document** all changes in CHANGELOG

---

## 4. Plugin Rules (Figma Runtime)

### Thin Client Constraints

The plugin MUST:

- Execute commands received from the bridge
- Report results back to the bridge
- Handle Figma API errors gracefully

The plugin MUST NOT:

- Make decisions about what to create
- Transform or aggregate data
- Maintain complex state
- Implement business logic
- Connect to external services (except bridge)

### What Lives Where

| Logic Type | Location |
|------------|----------|
| "Should I create a button?" | AI Assistant |
| "What properties for this button?" | MCP Server |
| "Execute `create_rectangle`" | Plugin |
| "What color is hex #3B82F6?" | MCP Server (utils) |

### Polling & Throughput

| Setting | Value | Configurable |
|---------|-------|--------------|
| Poll Interval | 1-3 seconds | Yes (`PLUGIN_POLL_INTERVAL`) |
| Max Batch Size | 10 commands | Yes |
| Command Timeout | 30 seconds | Yes |
| Max Retries | 3 | No |

### Failure Modes

| Failure | Plugin Behavior |
|---------|-----------------|
| Bridge unreachable | Retry with exponential backoff, notify user |
| Command fails | Report error to bridge, continue polling |
| Invalid command | Log error, skip command, report to bridge |
| Figma API error | Wrap in response error, include error code |

### Permissions & Network

- Plugin runs in Figma's sandbox
- Network access only via `ui.html` (hidden iframe)
- Only connect to `localhost:3030` (bridge)
- No external API calls from plugin

---

## 5. Server Rules (MCP + Bridge)

### Read vs Write Separation

| Operation Type | Handler | API Used |
|----------------|---------|----------|
| Read file structure | MCP Server | Figma REST API |
| Read node details | MCP Server | Figma REST API |
| Export images | MCP Server | Figma REST API |
| Create/modify nodes | Bridge → Plugin | Figma Plugin API |
| Delete nodes | Bridge → Plugin | Figma Plugin API |

### Queue Semantics

```text
Command Flow:
  POST /api/commands → Queue (pending)
                    → Plugin polls → Queue (processing)
                    → Plugin executes → Queue (completed/failed)
                    → Response available via GET /api/commands/:id
```

| State | Meaning |
|-------|---------|
| `pending` | Queued, awaiting plugin |
| `processing` | Plugin has claimed command |
| `completed` | Execution successful |
| `failed` | Execution failed |
| `timeout` | No response within timeout |

### Retries & Timeouts

| Parameter | Default | Env Variable |
|-----------|---------|--------------|
| Command Timeout | 30s | `COMMAND_TIMEOUT_MS` |
| Poll Timeout | 60s | `POLL_TIMEOUT_MS` |
| Max Retries | 3 | `MAX_RETRIES` |
| Retry Delay | 1s (exponential) | `RETRY_DELAY_MS` |

### Observability Requirements

Every MCP server operation MUST log:

- Request ID (for correlation)
- Operation type
- Duration
- Success/failure status
- Error details (if failed)

Log format:

```json
{
  "level": "info",
  "requestId": "uuid",
  "operation": "post_command",
  "command": "create_frame",
  "duration": 234,
  "status": "success"
}
```

---

## 6. Code Quality Standards

### TypeScript Configuration

All packages MUST use these `tsconfig.json` settings:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true
  }
}
```

### Banned Patterns

| Pattern | Reason | Alternative |
|---------|--------|-------------|
| `any` type | Defeats type safety | Use `unknown` + type guards |
| `@ts-ignore` | Hides errors | Fix the type error |
| `as` type assertion | Unsafe | Use type guards or Zod |
| `!` non-null assertion | Can cause runtime errors | Handle null case |
| `eval()` | Security risk | Never use |
| `Function` type | Too permissive | Define specific signature |

### Allowed Exceptions

- `any` in test mocks (with comment explaining why)
- `as const` assertions (safe)
- `as` after Zod `.parse()` (Zod guarantees type)

### Error Handling Conventions

```typescript
// ✅ Good: Specific error types
class FigmaApiError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number
  ) {
    super(message);
    this.name = 'FigmaApiError';
  }
}

// ✅ Good: Wrap external errors
try {
  await figmaApi.getFile(fileKey);
} catch (error) {
  throw new FigmaApiError(
    `Failed to fetch file: ${error.message}`,
    'FILE_FETCH_FAILED',
    error.status ?? 500
  );
}

// ❌ Bad: Swallowing errors
try {
  await something();
} catch {
  // silently ignored
}

// ❌ Bad: Throwing strings
throw "Something went wrong";
```

### Logging Style (User-Centric)

```typescript
// ✅ Good: User-centric, actionable
logger.info('Creating frame "Hero Section" at position (100, 200)');
logger.error('Failed to create frame: Font "Inter" not available. Install the font or use a different one.');

// ❌ Bad: Debug dump
logger.info('params:', JSON.stringify(params));
logger.error('Error:', error);
```

### File Organization

```text
src/
├── index.ts           # Entry point only (minimal logic)
├── types.ts           # Shared types and Zod schemas
├── config.ts          # Environment configuration
├── [feature]/         # Feature directories
│   ├── index.ts       # Public API
│   ├── types.ts       # Feature-specific types
│   ├── [name].ts      # Implementation files
│   └── __tests__/     # Co-located tests
└── utils/             # Shared utilities
```

### Naming Conventions

| Entity | Convention | Example |
|--------|------------|---------|
| Files | kebab-case | `command-tools.ts` |
| Classes | PascalCase | `FigmaClient` |
| Functions | camelCase | `getFileStructure` |
| Constants | SCREAMING_SNAKE | `MAX_RETRY_COUNT` |
| Types/Interfaces | PascalCase | `CommandEnvelope` |
| Zod schemas | camelCase + Schema | `createFrameSchema` |

---

## 7. Testing & Quality Gates

### Test Pyramid

```text
                    ┌─────────┐
                    │   E2E   │  ← Real Figma (manual + CI)
                   ─┴─────────┴─
                  ┌─────────────┐
                  │ Integration │  ← API + Bridge tests
                 ─┴─────────────┴─
                ┌─────────────────┐
                │     Unit        │  ← Functions, handlers
               ─┴─────────────────┴─
```

### Test Requirements by Type

| Test Type | Coverage Target | Runs On |
|-----------|-----------------|---------|
| Unit | 80%+ of functions | Every commit |
| Integration | All API endpoints | Every PR |
| E2E (Figma) | Critical paths | Pre-release |

### Unit Test Standards

```typescript
// ✅ Good: Descriptive, isolated
describe('createFrameHandler', () => {
  it('should create frame with specified dimensions', async () => {
    const result = await createFrameHandler({
      name: 'Test',
      width: 100,
      height: 200,
    });

    expect(result.nodeId).toBeDefined();
    expect(result.name).toBe('Test');
  });

  it('should throw ValidationError for negative dimensions', async () => {
    await expect(
      createFrameHandler({ name: 'Test', width: -100, height: 200 })
    ).rejects.toThrow(ValidationError);
  });
});
```

### Integration Test Standards

```typescript
describe('Bridge API', () => {
  it('POST /api/commands should queue command and return ID', async () => {
    const response = await fetch('http://localhost:3030/api/commands', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'mcp-command',
        version: '1.0',
        id: 'test-123',
        command: 'create_frame',
        params: { name: 'Test', width: 100, height: 100 },
      }),
    });

    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.commandId).toBe('test-123');
  });
});
```

### E2E / Real Figma Tests

Document manual test scenarios:

```markdown
## Test: Create Frame via Natural Language

1. Open Figma file
2. Run plugin
3. In Claude Code: "Create a frame called 'Header' at 0,0, 1440x80"
4. Verify: Frame appears in Figma with correct name and dimensions
```

### Quality Gates (Merge Blockers)

A PR cannot merge if:

- [ ] TypeScript compilation fails
- [ ] Unit tests fail
- [ ] Integration tests fail
- [ ] `any` type in command pipeline (without approved exception)
- [ ] Missing tests for new functions
- [ ] Spec Kitty workflow incomplete (for features)
- [ ] Console errors in plugin

### Pre-Release Checklist

- [ ] All tests pass
- [ ] Manual E2E test suite executed
- [ ] CHANGELOG updated
- [ ] Version bumped
- [ ] Documentation updated
- [ ] No security vulnerabilities (npm audit)

---

## 8. Security & Privacy

### Token & Secrets Handling

| Secret | Storage | Access |
|--------|---------|--------|
| Figma Access Token | Environment variable or `~/.figyah/config.json` | MCP Server only |
| File Keys | In-memory during session | MCP Server only |
| User Data | Never stored | N/A |

**Rules**:

1. **Never commit tokens** - Use `.env` files (gitignored)
2. **Never log tokens** - Redact in all log output
3. **Rotate regularly** - Recommend monthly rotation

### Audit & Log Redaction

Automatically redact from logs:

- Figma access tokens (`figd_*`)
- File keys (replace with `[FILE_KEY]`)
- User emails
- Node content (text values in large structures)

```typescript
// Redaction helper
function redactSensitive(obj: unknown): unknown {
  // Replace figd_* tokens with [REDACTED]
  // Replace file keys with [FILE_KEY]
  // Truncate large text content
}
```

### Command Validation

All commands MUST be validated:

```typescript
// Every command handler starts with validation
export async function handleCreateFrame(params: unknown) {
  const validated = createFrameSchema.parse(params); // Throws if invalid
  // ... proceed with validated params
}
```

### Rate Limiting

| Endpoint | Limit | Window |
|----------|-------|--------|
| POST /api/commands | 60 | 1 minute |
| GET /api/commands | 120 | 1 minute |
| Figma API calls | 1000 | 1 minute (Figma's limit) |

### Sandbox Constraints

| Constraint | Enforcement |
|------------|-------------|
| Plugin network access | Only localhost:3030 |
| Plugin file access | None (Figma sandbox) |
| Command allowlist | Only defined commands execute |
| Parameter bounds | Zod schema validation |

---

## 9. AI Assistant Directives

### Naming Rules

- **DO NOT** use "bridge" in user-facing names
- **USE**: "FigConnect", "connector", "MCP"
- **EXAMPLE**: Say "FigConnect plugin" not "bridge plugin"

### Manifest-Edit Policy

- **DO NOT** edit `manifest.json` unless explicitly asked
- **Reason**: Manifest changes can break plugin functionality
- **If needed**: Explain the change before making it

### Handling Constitution Conflicts

If a user request conflicts with this constitution:

1. **Flag the conflict** before proceeding
2. **Explain** which principle is at risk
3. **Propose alternatives** that comply
4. **Only proceed** with explicit override

```text
Example Response:
"This request would require adding `any` types to the command pipeline,
which violates Section 6 (Code Quality Standards). Instead, I can:
1. Use Zod schemas for validation
2. Use `unknown` with type guards
Which approach would you prefer?"
```

### Change Strategy

All changes should be:

1. **Small** - One logical change per commit
2. **Atomic** - Works independently, doesn't break existing code
3. **Spec-first** - Non-trivial changes need specification
4. **Tested** - Include tests for new functionality
5. **Documented** - Update relevant docs

### Code Generation Guidelines

When generating code:

1. **Follow existing patterns** in the codebase
2. **Use existing utilities** before creating new ones
3. **Match the style** of surrounding code
4. **Add JSDoc** for public functions
5. **Include error handling** from the start

---

## 10. Workflow & Repository Hygiene

### Spec Kitty Workflow

For all non-trivial changes:

```text
/spec-kitty.specify  →  Define WHAT to build
/spec-kitty.plan     →  Define HOW to build
/spec-kitty.tasks    →  Break into work packages
/spec-kitty.implement →  Build each WP
/spec-kitty.review   →  Quality gate
/spec-kitty.merge    →  Ship to main
```

### When to Use Spec Kitty

| Change Type | Use Spec Kitty? |
|-------------|-----------------|
| New feature | Yes |
| Major refactor | Yes |
| New command | Yes |
| Bug fix (simple) | No |
| Typo fix | No |
| Dependency update | No |

### Worktree & Branching Rules

**Main Branch**:

- Always deployable
- Protected from direct pushes
- Requires PR with passing tests

**Feature Branches**:

- Format: `###-feature-name-WP##`
- Example: `001-figma-mcp-server-WP01`
- One worktree per work package (optional)

**Worktree Commands**:

```bash
# Create worktree for a WP
spec-kitty implement WP01

# Or manually
git worktree add .worktrees/001-feature-WP01 -b 001-feature-WP01

# List worktrees
git worktree list

# Clean up
git worktree remove .worktrees/001-feature-WP01
```

### Commit Message Format

```text
<type>(<scope>): <subject>

<body>

<footer>
```

**Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

**Examples**:

```text
feat(plugin): add move_node command handler

Implements the move_node command with support for:
- Absolute positioning (x, y)
- Relative movement (deltaX, deltaY)

Closes #123
```

### Documentation Update Expectations

When changing code, update:

| Change | Documentation to Update |
|--------|------------------------|
| New command | README, command reference |
| New tool | MCP server README |
| New config option | .env.example, README |
| Architecture change | Constitution Section 2 |
| New workflow | development_workflow.md |

---

## 11. Reusable & Scalable Code Patterns

### Module Structure

```typescript
// feature/index.ts - Public API only
export { createFrame } from './create-frame';
export type { CreateFrameParams, CreateFrameResult } from './types';

// feature/types.ts - Types and schemas
export interface CreateFrameParams {
  name: string;
  width: number;
  height: number;
}

export const createFrameSchema = z.object({
  name: z.string().min(1).max(255),
  width: z.number().positive().max(100000),
  height: z.number().positive().max(100000),
});

// feature/create-frame.ts - Implementation
export async function createFrame(params: CreateFrameParams): Promise<CreateFrameResult> {
  // Implementation
}
```

### Dependency Injection

```typescript
// ✅ Good: Inject dependencies
class FigmaClient {
  constructor(
    private readonly httpClient: HttpClient,
    private readonly config: FigmaConfig
  ) {}
}

// ❌ Bad: Hard-coded dependencies
class FigmaClient {
  private readonly httpClient = new HttpClient();
}
```

### Factory Pattern for Commands

```typescript
// commands/factory.ts
const commandHandlers: Record<string, CommandHandler> = {
  create_frame: createFrameHandler,
  create_text: createTextHandler,
  move_node: moveNodeHandler,
};

export function getCommandHandler(command: string): CommandHandler {
  const handler = commandHandlers[command];
  if (!handler) {
    throw new UnknownCommandError(command);
  }
  return handler;
}
```

### Result Types Over Exceptions

```typescript
// ✅ Prefer: Result types for expected failures
type CommandResult<T> =
  | { success: true; data: T }
  | { success: false; error: CommandError };

async function executeCommand(cmd: Command): Promise<CommandResult<NodeInfo>> {
  // ...
}

// Usage
const result = await executeCommand(cmd);
if (!result.success) {
  logger.error('Command failed:', result.error);
  return;
}
console.log('Created node:', result.data.nodeId);
```

### Utility Functions

Keep utilities pure and focused:

```typescript
// ✅ Good: Pure, single responsibility
function hexToRgb(hex: string): RGB {
  // ...
}

function rgbToFigmaColor(rgb: RGB): FigmaColor {
  // ...
}

// ❌ Bad: Mixed concerns
function processColorAndApplyToNode(hex: string, node: SceneNode) {
  // Does too much
}
```

---

## 12. Amendments

### Proposing Changes

To amend this constitution:

1. **Create specification** in `kitty-specs/` describing the change
2. **Document impact** on existing code
3. **Get approval** via PR review
4. **Update version** and ratification date

### Required Artifacts

- Specification document explaining the change
- Impact assessment (what code needs updates)
- Migration plan (if breaking change)

### Version Bumping

| Change Type | Version Bump |
|-------------|--------------|
| Clarification (no behavior change) | Patch (2.1.0 → 2.1.1) |
| New section or significant addition | Minor (2.1.0 → 2.2.0) |
| Breaking change to principles | Major (2.1.0 → 3.0.0) |

### Ratification

After PR approval:

1. Update `Version` in Preamble
2. Update `Ratified` date
3. Add entry to amendment log below

### Amendment Log

| Version | Date | Change |
|---------|------|--------|
| 1.0.0 | 2024-05-24 | Initial ratification |
| 2.0.0 | 2026-01-29 | Spec Kitty migration, expanded architecture |
| 2.1.0 | 2026-01-29 | Added comprehensive standards (testing, security, patterns) |

---

## Quick Reference

### Must-Have Before Merge

- [ ] TypeScript compiles (`npm run build`)
- [ ] Tests pass (`npm test`)
- [ ] No `any` in command pipeline
- [ ] Zod schemas for all inputs
- [ ] User-centric log messages
- [ ] Documentation updated

### Key Commands

```bash
# Start development
cd figma-mcp-server && npm start
cd control-center && npm run dev

# Run tests
npm test

# Check types
npm run build

# View spec status
spec-kitty dashboard
spec-kitty agent tasks status
```

### Key Files

| Purpose | File |
|---------|------|
| This constitution | `.kittify/memory/constitution.md` |
| MCP tool schemas | `figma-mcp-server/src/types.ts` |
| Command handlers | `figma-plugin-bridge/src/commands/` |
| Feature specs | `kitty-specs/` |
| Quick reference | `QUICKSTART.md` |
