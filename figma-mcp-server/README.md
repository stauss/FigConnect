# Figma MCP Server

A Model Context Protocol (MCP) server that provides read and write access to Figma files through AI agents like Claude.

## Setup

1. Copy `.env.example` to `.env` and add your Figma access token:

   ```bash
   cp .env.example .env
   ```

2. Add your Figma access token to `.env`:

   ```
   FIGMA_ACCESS_TOKEN=figd_your_token_here
   ```

3. Install dependencies:

   ```bash
   npm install
   ```

4. Build the project:

   ```bash
   npm run build
   ```

5. Start the server:
   ```bash
   npm start
   ```

## Transport Options

### Stdio Transport (Default - Local)

The default transport uses stdio for local connections (e.g., Claude Desktop):

```bash
# Uses stdio transport by default
npm start
```

### SSE Transport (Remote HTTP/SSE)

For remote AI clients or web-based integrations, use SSE transport:

1. Set in `.env`:

   ```
   MCP_TRANSPORT=sse
   MCP_HTTP_PORT=3031
   MCP_HTTP_HOST=localhost
   ```

2. Start the server:

   ```bash
   npm start
   ```

3. Connect remote clients to:

   ```
   http://localhost:3031/sse
   ```

   Or for remote access:

   ```
   http://your-server-ip:3031/sse
   ```

**Note**: Make sure to configure firewall rules if accessing remotely.

## Development

- Build: `npm run build`
- Watch mode: `npm run dev`
- Test: `npm test`

## Performance Configuration

The server includes performance optimizations that can be tuned via environment variables:

```env
# Reduce polling delays for faster command execution
PLUGIN_POLL_INTERVAL=1000  # Plugin polls every 1 second (default)
COMMAND_CHECK_INTERVAL=200  # Command completion checked every 200ms (default)

# Cache configuration
CACHE_TTL_FILE_STRUCTURE=300000  # 5 minutes (default)
CACHE_TTL_NODE_DETAILS=30000  # 30 seconds (default)
```

## Configuration

See `.env.example` for all available configuration options.
