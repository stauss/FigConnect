# FigYah Control Center

Browser-based control center for managing Figma AI connections, monitoring activity, and viewing history.

## Features

- **Connection Management**: Configure Figma access token, model settings, and deployment options
- **File Discovery**: Auto-detect files from running Figma plugin or manually connect files
- **Real-time Monitoring**: View connection status, command queue, and active files
- **History Timeline**: Browse all AI-driven edits with status, timestamps, and results
- **Conversation Log**: Durable conversation history independent of Figma comments
- **Backup Management**: View and restore file snapshots created before AI changes

## Getting Started

### Prerequisites

- Node.js 18+
- Figma MCP Server running with bridge enabled

### Installation

```bash
cd control-center
npm install
```

### Development

```bash
npm run dev
```

The control center will be available at `http://localhost:3032`

### Build

```bash
npm run build
```

## Usage

1. **Onboarding**: On first launch, you'll be guided through:
   - Step 1: Add your Figma access token and configure model settings
   - Step 2: Connect your first Figma file (or let the plugin auto-detect)

2. **Dashboard**: After setup, you'll see:
   - Connection status (bridge server, MCP server, active file)
   - Project connections (list of connected files)
   - History timeline (all AI commands and their results)
   - Task queue (pending/completed/failed commands)
   - Conversation log (durable chat history)

3. **File Management**:
   - Files are automatically detected when you open them in Figma with the plugin running
   - You can also manually add files by entering the file key
   - Toggle files on/off to control which files the AI can access

## Architecture

The control center communicates with the MCP server's bridge server (port 3030) via REST API:

- `/api/ui/config` - Configuration management
- `/api/ui/projects` - Project/file connections
- `/api/ui/history` - Command history
- `/api/ui/conversations` - Conversation logs
- `/api/ui/backups` - Backup management
- `/api/ui/status` - Connection status

## File Context Auto-Detection

The plugin automatically announces the current file when opened in Figma. This eliminates the need to manually enter file keys - just open a file in Figma with the plugin running, and it will appear in the control center!
