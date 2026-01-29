# Implementation Plan: Figma MCP Server

---

## 1. Architecture

### System Components

```
┌─────────────────┐
│ AI Assistant    │  ← Starts first, connects TO MCP server
│ (Claude/Cursor) │
└────────┬────────┘
         │
         │ MCP Protocol (stdio or SSE)
         │
         ▼
┌─────────────────┐     ┌──────────────────┐     ┌──────────────┐
│  MCP Server     │────▶│  Bridge Server   │────▶│ Figma Plugin │
│  (exposes       │     │  (port 3030)     │     │  (in Figma)  │
│   tools)        │     │                  │     │              │
└─────────────────┘     └──────────────────┘     └──────────────┘
         │                       │
         │                       │
         ▼                       ▼
┌─────────────────┐     ┌──────────────────┐
│  Control Center │     │  Storage Layer   │
│  (port 3032)    │     │  (~/.figyah)     │
└─────────────────┘     └──────────────────┘
```

### Key Concept
**AI assistants connect TO the MCP server**, not the other way around. The server exposes tools/resources that any MCP-compatible client can use. No need to configure which AI model to use.

---

## 2. Tech Stack

| Layer | Technology |
|-------|------------|
| Language | TypeScript (strict mode) |
| Runtime | Node.js 18+ |
| MCP SDK | `@modelcontextprotocol/sdk` |
| API Client | `node-fetch` |
| Testing | Jest |
| Build | TypeScript compiler (tsc) |
| Linting | ESLint + Prettier |
| Plugin | Figma Plugin API |

---

## 3. Project Structure

```
FigConnect/
├── figma-mcp-server/           # MCP Server + Bridge
│   ├── src/
│   │   ├── index.ts            # MCP server entry point
│   │   ├── types.ts            # TypeScript types
│   │   ├── config.ts           # Environment configuration
│   │   ├── tools/
│   │   │   ├── registry.ts     # Tool definitions
│   │   │   ├── read-tools.ts   # Read-only Figma tools
│   │   │   ├── export-tools.ts # Export tools
│   │   │   └── command-tools.ts # Command posting tools
│   │   ├── figma/
│   │   │   ├── client.ts       # Figma API client
│   │   │   └── utils.ts        # Node traversal utilities
│   │   ├── bridge/
│   │   │   └── server.ts       # HTTP bridge server
│   │   └── queue/
│   │       └── manager.ts      # Command queue
│   └── tests/
│
├── figma-plugin-bridge/        # Figma Plugin
│   ├── src/
│   │   ├── code.ts             # Plugin entry point
│   │   ├── ui.html             # Hidden UI for network
│   │   ├── commands/
│   │   │   ├── executor.ts     # Command router
│   │   │   ├── frame.ts        # Frame operations
│   │   │   ├── text.ts         # Text operations
│   │   │   ├── rectangle.ts    # Rectangle operations
│   │   │   ├── layout.ts       # Auto-layout
│   │   │   ├── component.ts    # Component operations
│   │   │   ├── manipulation.ts # Move/duplicate/delete
│   │   │   └── styles.ts       # Style operations
│   │   ├── polling/
│   │   │   └── processor.ts    # Command polling
│   │   └── utils/
│   │       ├── colors.ts       # Color conversion
│   │       ├── fonts.ts        # Font loading
│   │       └── logger.ts       # Plugin logging
│   └── manifest.json           # Plugin manifest
│
├── control-center/             # Browser UI
│   └── (React/Vite app)
│
└── kitty-specs/                # Spec Kitty specs
    └── 001-figma-mcp-server/
```

---

## 4. Command Protocol

### Command Structure (MCP → Bridge → Plugin)

```json
{
  "type": "mcp-command",
  "version": "1.0",
  "id": "cmd-uuid-here",
  "command": "create_frame",
  "params": {
    "name": "Hero Section",
    "width": 1440,
    "height": 600,
    "x": 0,
    "y": 0,
    "fills": [{
      "type": "SOLID",
      "color": { "r": 0.95, "g": 0.95, "b": 0.95 }
    }]
  },
  "parent": "0:1",
  "timestamp": "2026-01-27T10:30:00Z"
}
```

### Response Structure (Plugin → Bridge → MCP)

```json
{
  "type": "mcp-response",
  "commandId": "cmd-uuid-here",
  "status": "success",
  "result": {
    "nodeId": "123:456",
    "name": "Hero Section",
    "type": "FRAME"
  },
  "timestamp": "2026-01-27T10:30:05Z",
  "executionTime": 234
}
```

### Error Response

```json
{
  "type": "mcp-response",
  "commandId": "cmd-uuid-here",
  "status": "error",
  "error": {
    "code": "INVALID_PARENT",
    "message": "Parent node not found: 0:999"
  },
  "timestamp": "2026-01-27T10:30:05Z"
}
```

---

## 5. API Endpoints (Bridge Server)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/health` | GET | Health check |
| `/api/stats` | GET | Queue statistics |
| `/api/commands` | GET | Pending commands |
| `/api/commands` | POST | Queue new command |
| `/api/commands/:id/response` | POST | Post command result |

---

## 6. Environment Configuration

```bash
# figma-mcp-server/.env
FIGMA_ACCESS_TOKEN=figd_xxxxxxxxxxxxxxxxxxxxx
BRIDGE_ENABLED=true
BRIDGE_PORT=3030
MCP_TRANSPORT=stdio
LOG_LEVEL=info
```

---

## 7. Implementation Phases

### Phase 1: Foundation (COMPLETE)
- MCP server initialization
- Figma API client with error handling
- 9 read-only tools

### Phase 2: Command System (COMPLETE)
- Command syntax and validation
- HTTP bridge server
- Queue management

### Phase 3: Plugin Bridge (COMPLETE)
- Figma plugin setup
- Command polling
- 13 command executors

### Phase A: Collaboration (CURRENT)
- Comment-based task intake
- Target node resolution
- Safety gating
- In-thread replies

### Phase 4: Enhanced Features (FUTURE)
- Batch operations
- Design system integration
- AI-friendly high-level tools

---

## 8. Key Files Reference

| File | Purpose |
|------|---------|
| `figma-mcp-server/src/tools/registry.ts` | MCP tool definitions |
| `figma-mcp-server/src/tools/command-tools.ts` | Command posting logic |
| `figma-mcp-server/src/bridge/server.ts` | HTTP bridge server |
| `figma-plugin-bridge/src/commands/executor.ts` | Command router |
| `figma-plugin-bridge/src/code.ts` | Plugin entry point |
| `figma-plugin-bridge/src/ui.html` | Hidden UI for network |

---

## 9. Startup Sequence

1. **Start MCP Server** (includes bridge on port 3030)
   ```bash
   cd figma-mcp-server && npm start
   ```

2. **Configure AI Client** (Claude Code / Cursor)
   - Add MCP server to configuration
   - AI connects automatically when used

3. **Start Control Center** (optional, port 3032)
   ```bash
   cd control-center && npm run dev
   ```

4. **Run Figma Plugin**
   - Import plugin in Figma Desktop
   - Plugin announces current file to bridge

---

## Metadata

| Field | Value |
|-------|-------|
| Status | Phase A In Progress |
| Last Updated | 2026-01-29 |
