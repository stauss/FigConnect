# Figma MCP Bridge Plugin

A Figma plugin that executes MCP commands from the bridge server, enabling AI-powered design manipulation.

## Overview

This plugin bridges the gap between the MCP server and Figma's Plugin API. Since Figma's REST API is read-only for design manipulation, this plugin:

1. Polls the local MCP bridge server for pending commands
2. Executes commands using the Figma Plugin API
3. Posts responses back to the bridge server

## Prerequisites

- Node.js 18+
- Figma desktop app installed
- MCP server running with bridge enabled (`BRIDGE_ENABLED=true`)

## Installation

### 1. Install dependencies

```bash
npm install
```

### 2. Build the plugin

```bash
npm run build
```

### 3. Import into Figma

1. Open Figma desktop app
2. Go to **Plugins** > **Development** > **Import plugin from manifest...**
3. Select the `manifest.json` file from this directory

## Development

### Watch mode

```bash
npm run watch
```

This rebuilds the plugin automatically when you make changes.

### Structure

```
figma-plugin-bridge/
├── src/
│   ├── code.ts              # Main plugin code
│   ├── ui.html              # Hidden UI for network requests
│   │
│   ├── commands/
│   │   ├── executor.ts      # Command execution router
│   │   ├── frame.ts         # Frame operations
│   │   ├── text.ts          # Text operations
│   │   ├── rectangle.ts     # Rectangle operations
│   │   ├── layout.ts        # Auto-layout operations
│   │   ├── component.ts     # Component operations
│   │   └── styles.ts        # Style operations
│   │
│   ├── polling/
│   │   └── processor.ts     # Command polling & processing
│   │
│   └── utils/
│       ├── colors.ts        # Color conversion
│       ├── fonts.ts         # Font loading
│       └── logger.ts        # Plugin logging
│
├── manifest.json            # Plugin manifest
├── package.json
└── tsconfig.json
```

## Supported Commands

### Creation Commands

| Command            | Description            |
| ------------------ | ---------------------- |
| `create_frame`     | Create a new frame     |
| `create_text`      | Create text node       |
| `create_rectangle` | Create rectangle shape |
| `create_component` | Create a component     |

### Manipulation Commands

| Command          | Description                              |
| ---------------- | ---------------------------------------- |
| `move_node`      | Move nodes by delta or absolute position |
| `duplicate_node` | Duplicate single or multiple nodes       |
| `delete_node`    | Delete single or multiple nodes          |
| `resize_node`    | Resize nodes with aspect ratio option    |

### Grouping Commands

| Command         | Description                               |
| --------------- | ----------------------------------------- |
| `group_nodes`   | Combine multiple nodes into a group       |
| `ungroup_nodes` | Break apart a group into individual nodes |

### Layout & Styling Commands

| Command             | Description                                                                              |
| ------------------- | ---------------------------------------------------------------------------------------- |
| `apply_auto_layout` | Apply auto-layout to frame                                                               |
| `apply_style`       | Apply a style to node                                                                    |
| `set_properties`    | Set node properties (supports gradients, effects, constraints, strokes, text properties) |

## Configuration

The plugin connects to the MCP bridge server at `http://localhost:3030` by default.

## Troubleshooting

### Plugin not receiving commands

1. Ensure the MCP server is running with bridge enabled
2. Check that `BRIDGE_PORT` matches in both MCP server and plugin
3. Verify Figma has network access permissions

### Commands failing

1. Check the Figma console for error messages
2. Ensure the target nodes exist and are accessible
3. Verify font availability for text operations

## License

MIT
