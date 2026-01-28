# Quick Start Guide: Figma MCP Server

**Date**: 2025-01-27  
**Feature**: Figma MCP Server Project

## Prerequisites

- Node.js 18+ installed
- Figma account with API access
- Figma desktop app installed (for plugin execution)
- Claude Code or compatible MCP client

## Setup Steps

### 1. Get Figma Access Token

1. Go to Figma → Settings → Account → Personal Access Tokens
2. Click "Create new token"
3. Give it a name (e.g., "MCP Server")
4. Copy the token (starts with `figd_`)
5. Save it securely - you won't be able to see it again

### 2. Clone/Initialize Project

```bash
# If starting from scratch
mkdir figma-mcp-workspace
cd figma-mcp-workspace
git init

# Create project structure
mkdir -p figma-mcp-server/src/{tools,figma,commands,queue,cache}
mkdir -p figma-plugin-bridge/src/{commands,polling,utils}
```

### 3. Set Up MCP Server

```bash
cd figma-mcp-server

# Initialize package
npm init -y

# Install dependencies
npm install @modelcontextprotocol/sdk node-fetch zod dotenv
npm install -D typescript @types/node @types/jest jest ts-jest

# Create .env file
cat > .env << EOF
FIGMA_ACCESS_TOKEN=figd_your_token_here
FIGMA_FILE_KEY=your_test_file_key_here
LOG_LEVEL=info
API_TIMEOUT_MS=10000
MAX_REQUESTS_PER_MINUTE=60
EOF

# Create .env.example
cp .env .env.example
# Edit .env.example to remove actual token

# Configure TypeScript
cat > tsconfig.json << EOF
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "node",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
EOF
```

### 4. Configure MCP Client (Claude Code)

Add to your Claude Code MCP configuration (typically `~/.config/claude/claude_desktop_config.json` or Cursor settings):

```json
{
  "mcpServers": {
    "figma": {
      "command": "node",
      "args": ["/absolute/path/to/figma-mcp-server/dist/index.js"],
      "env": {
        "FIGMA_ACCESS_TOKEN": "figd_your_token_here"
      }
    }
  }
}
```

**Note**: Use absolute path to the compiled `index.js` file.

### 5. Set Up Figma Plugin

```bash
cd figma-plugin-bridge

# Initialize package
npm init -y

# Install dependencies
npm install -D @figma/plugin-typings typescript

# Create manifest.json
cat > manifest.json << EOF
{
  "name": "Figma MCP Bridge",
  "id": "figma-mcp-bridge",
  "api": "1.0.0",
  "main": "dist/code.js",
  "ui": "dist/ui.html",
  "editorType": ["figma"],
  "networkAccess": {
    "allowedDomains": ["none"],
    "reasoning": "Plugin reads commands from file comments"
  }
}
EOF

# Configure TypeScript
cat > tsconfig.json << EOF
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ES2020",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "types": ["@figma/plugin-typings"]
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
EOF
```

### 6. Build and Test

```bash
# Build MCP server
cd figma-mcp-server
npm run build

# Test MCP server (should start without errors)
npm start

# Build plugin
cd ../figma-plugin-bridge
npm run build
```

### 7. Install Plugin in Figma

1. Open Figma desktop app
2. Go to Plugins → Development → Import plugin from manifest...
3. Select `figma-plugin-bridge/manifest.json`
4. Plugin should appear in Plugins → Development menu
5. Run the plugin (it will start polling for commands)

## Usage Examples

### Read File Structure

In Claude Code, you can now use:

```
"Get the structure of my Figma file with key abc123"
```

The MCP server will execute `get_file_structure` tool and return the file hierarchy.

### Create a Frame

```
"Create a frame named 'Hero Section' with width 1440 and height 600 in my Figma file"
```

The MCP server will:

1. Post a `create_frame` command as a comment
2. Plugin will detect and execute it
3. Return the created node ID

### Export Nodes

```
"Export the frame with ID 123:456 as a PNG image"
```

The MCP server will call Figma export API and return the image URL.

## Troubleshooting

### MCP Server Won't Start

- Check that `FIGMA_ACCESS_TOKEN` is set in environment
- Verify Node.js version: `node --version` (should be 18+)
- Check logs for specific error messages
- Ensure TypeScript compiled successfully: `npm run build`

### Plugin Not Executing Commands

- Verify plugin is running in Figma (check Plugins menu)
- Check that commands are being posted as comments
- Verify plugin is polling (check console logs if available)
- Ensure file is open in Figma desktop app

### Rate Limit Errors

- Reduce `MAX_REQUESTS_PER_MINUTE` in `.env`
- Implement caching for repeated operations
- Add delays between batch operations

### Authentication Errors

- Verify token is correct and not expired
- Check token has file read/write permissions
- Ensure `.env` file is in correct location
- Verify token is not exposed in logs (check `LOG_LEVEL`)

## Next Steps

1. **Implement Phase 1**: Build read-only MCP server tools
2. **Test with real file**: Use a test Figma file to verify operations
3. **Implement Phase 2**: Add command posting system
4. **Build plugin**: Implement command execution in plugin
5. **End-to-end test**: Verify complete workflow

## Development Workflow

1. Make changes to TypeScript source files
2. Build: `npm run build`
3. Restart MCP server: `npm start`
4. Test in Claude Code
5. Iterate

For plugin development:

1. Make changes to plugin source
2. Build: `npm run build`
3. Reload plugin in Figma (Plugins → Development → [Your Plugin])
4. Test command execution
5. Iterate

## Configuration Reference

### Environment Variables (MCP Server)

- `FIGMA_ACCESS_TOKEN`: Your Figma personal access token (required)
- `FIGMA_FILE_KEY`: Default file key for testing (optional)
- `LOG_LEVEL`: Logging verbosity: debug, info, warn, error (default: info)
- `API_TIMEOUT_MS`: HTTP request timeout (default: 10000)
- `MAX_REQUESTS_PER_MINUTE`: Rate limit threshold (default: 60)

### MCP Configuration

- `command`: Path to Node.js executable
- `args`: Array with path to compiled `index.js`
- `env`: Environment variables (including `FIGMA_ACCESS_TOKEN`)

## Support

- Check `research.md` for technology decisions
- Review `data-model.md` for entity relationships
- See `contracts/mcp-tools.json` for tool schemas
- Refer to Figma API docs: https://www.figma.com/developers/api
- MCP docs: https://modelcontextprotocol.io/
