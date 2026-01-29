# FigYah Architecture

## Overview

FigYah uses the **Model Context Protocol (MCP)** architecture where **AI assistants connect TO the MCP server**, not the other way around.

## Key Concept

**The MCP server exposes tools/resources that AI assistants can use.** You don't configure which AI model to use - any MCP-compatible AI assistant (Claude in Cursor, Claude Desktop, etc.) can connect to your server and use the tools.

## Components

### 1. MCP Server (`figma-mcp-server`)

- **Purpose**: Exposes Figma tools via MCP protocol
- **Transport**:
  - Stdio (default) - for local connections like Cursor/Claude Desktop
  - SSE (Server-Sent Events) - for remote HTTP connections
- **What it does**:
  - Waits for AI clients to connect
  - Provides tools like `get_file_structure`, `post_command`, etc.
  - Does NOT initiate connections to AI models

### 2. Bridge Server (included in MCP Server)

- **Purpose**: HTTP server that connects the MCP server to:
  - Figma Plugin (for executing commands)
  - Control Center UI (for monitoring/configuration)
- **Port**: 3030 (default)
- **What it does**:
  - Receives file announcements from Figma plugin
  - Queues commands from MCP tools
  - Provides REST API for Control Center

### 3. Control Center (`control-center`)

- **Purpose**: Browser-based UI for configuration and monitoring
- **Port**: 3032 (default)
- **What it does**:
  - Shows connection status
  - Manages Figma file connections
  - Displays command history and queue
  - Provides onboarding flow

### 4. Figma Plugin (`figma-plugin-bridge`)

- **Purpose**: Runs inside Figma to execute commands
- **What it does**:
  - Announces current file to bridge server
  - Polls for commands from bridge server
  - Executes commands in Figma
  - Reports results back to bridge server

## Connection Flow

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

## Startup Order

1. **Start MCP Server** (includes bridge server)

   ```bash
   cd figma-mcp-server
   npm start
   ```

   - MCP server starts listening for AI connections
   - Bridge server starts on port 3030

2. **Configure AI Client** (Cursor/Claude Desktop)
   - Add MCP server configuration pointing to your server
   - AI client connects automatically when you use it

3. **Start Control Center** (optional)

   ```bash
   cd control-center
   npm run dev
   ```

   - Opens at http://localhost:3032
   - Connects to bridge server for monitoring

4. **Run Figma Plugin**
   - Import plugin in Figma
   - Plugin announces current file to bridge server
   - Ready to receive commands from AI

## What You Need to Configure

### Required

- **Figma Access Token**: Needed to call Figma API

### NOT Required

- ❌ **Default Model**: Not needed - AI clients connect to you
- ❌ **Default Provider**: Not needed - any MCP-compatible client works
- ✅ **Deployment Location**: Optional metadata (local vs cloud)

## Status Indicators

- **Bridge Server**: Shows if HTTP server is running (port 3030)
- **MCP Server**: Shows if server is running and waiting for AI connections
- **Active File**: Shows current file announced by Figma plugin
- **Queue**: Shows pending/completed commands

## Common Confusion

### ❌ Wrong Understanding

"The MCP server connects to AI models"

- This would require API keys for each AI provider
- This would limit which AI assistants you can use

### ✅ Correct Understanding

"AI assistants connect to the MCP server"

- The server exposes tools/resources
- Any MCP-compatible client can connect
- No need to configure which AI model to use

## Example: Using with Cursor

1. Start MCP server: `cd figma-mcp-server && npm start`
2. Configure Cursor's MCP settings to point to your server
3. In Cursor, ask: "Show me the structure of my Figma file"
4. Cursor connects to your MCP server, calls `get_file_structure` tool
5. Your server responds with file structure
6. Cursor displays the results

The MCP server doesn't know or care which AI model Cursor is using - it just provides the tools.
