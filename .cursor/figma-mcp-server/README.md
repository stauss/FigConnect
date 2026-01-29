# Figma MCP Server

A Model Context Protocol (MCP) server that provides read-only access to Figma files through AI agents like Claude Code.

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

## Development

- Build: `npm run build`
- Watch mode: `npm run dev`
- Test: `npm test`

## Configuration

See `.env.example` for available configuration options.
