# FigConnect Command Reference

**Quick reference for all available MCP tools and Figma commands**

---

## MCP Tools (Available to AI)

### Read Tools

| Tool                 | Purpose                      | Parameters                                   |
| -------------------- | ---------------------------- | -------------------------------------------- |
| `get_file_structure` | Get complete node tree       | `file_key?`, `depth?`                        |
| `get_node_details`   | Get detailed node properties | `file_key?`, `node_ids[]`                    |
| `search_nodes`       | Find nodes by name/type      | `file_key?`, `query`, `node_type?`           |
| `get_components`     | List all components          | `file_key?`                                  |
| `get_styles`         | List all styles              | `file_key?`                                  |
| `get_variables`      | List design variables        | `file_key?`                                  |
| `get_comments`       | List file comments           | `file_key?`                                  |
| `get_file_versions`  | Get version history          | `file_key?`, `page_size?`                    |
| `export_node`        | Export as image              | `file_key?`, `node_ids[]`, `format`, `scale` |
| `get_current_file`   | Get auto-detected file       | (no parameters)                              |

### Command Tools

| Tool                  | Purpose                   | Parameters                                                                        |
| --------------------- | ------------------------- | --------------------------------------------------------------------------------- |
| `post_command`        | Execute a command         | `file_key?`, `command`, `params{}`, `parent?`, `wait_for_completion?`, `timeout?` |
| `get_command_status`  | Check command status      | `command_id`                                                                      |
| `post_batch_commands` | Execute multiple commands | `file_key?`, `commands[]`, `wait_for_completion?`                                 |
| `get_queue_stats`     | Get queue statistics      | (no parameters)                                                                   |

---

## Figma Commands (Executed by Plugin)

### Creation Commands

#### `create_frame`

Create a new frame.

**Parameters:**

```json
{
  "name": "Frame Name",
  "width": 400,
  "height": 300,
  "x": 0,
  "y": 0
}
```

**Example:**

```json
{
  "command": "create_frame",
  "params": {
    "name": "Hero Section",
    "width": 1200,
    "height": 600
  }
}
```

---

#### `create_text`

Create a text node.

**Parameters:**

```json
{
  "name": "Text Name",
  "content": "Text content",
  "x": 0,
  "y": 0,
  "fontSize": 16,
  "fontFamily": "Inter",
  "fontWeight": 400
}
```

**Example:**

```json
{
  "command": "create_text",
  "params": {
    "content": "Hello World",
    "fontSize": 24,
    "fontFamily": "Inter"
  }
}
```

---

#### `create_rectangle`

Create a rectangle shape.

**Parameters:**

```json
{
  "name": "Rectangle Name",
  "width": 100,
  "height": 100,
  "x": 0,
  "y": 0,
  "cornerRadius": 0,
  "fills": []
}
```

**Example:**

```json
{
  "command": "create_rectangle",
  "params": {
    "name": "Button",
    "width": 120,
    "height": 40,
    "cornerRadius": 8,
    "fills": [{ "type": "SOLID", "color": { "r": 0, "g": 0.4, "b": 1 } }]
  }
}
```

---

#### `create_component`

Create a component.

**Parameters:**

```json
{
  "name": "Component Name",
  "width": 100,
  "height": 100,
  "x": 0,
  "y": 0
}
```

**Example:**

```json
{
  "command": "create_component",
  "params": {
    "name": "Primary Button",
    "width": 120,
    "height": 40
  }
}
```

---

### Manipulation Commands

#### `move_node`

Move nodes by delta or absolute position.

**Parameters:**

```json
{
  "nodeId": "1:2",
  "x": 100,
  "y": 100,
  "relative": false
}
```

**Examples:**

```json
// Absolute position
{
  "command": "move_node",
  "params": {
    "nodeId": "1:2",
    "x": 500,
    "y": 300,
    "relative": false
  }
}

// Relative movement
{
  "command": "move_node",
  "params": {
    "nodeId": "1:2",
    "x": 50,
    "y": 30,
    "relative": true
  }
}
```

---

#### `duplicate_node`

Duplicate a node.

**Parameters:**

```json
{
  "nodeId": "1:2"
}
```

**Example:**

```json
{
  "command": "duplicate_node",
  "params": {
    "nodeId": "1:2"
  }
}
```

---

#### `delete_node`

Delete a node.

**Parameters:**

```json
{
  "nodeId": "1:2"
}
```

**Example:**

```json
{
  "command": "delete_node",
  "params": {
    "nodeId": "1:2"
  }
}
```

---

#### `resize_node`

Resize a node.

**Parameters:**

```json
{
  "nodeId": "1:2",
  "width": 400,
  "height": 300,
  "relative": false,
  "maintainAspectRatio": false
}
```

**Examples:**

```json
// Absolute size
{
  "command": "resize_node",
  "params": {
    "nodeId": "1:2",
    "width": 600,
    "height": 400,
    "relative": false
  }
}

// Relative resize
{
  "command": "resize_node",
  "params": {
    "nodeId": "1:2",
    "width": 50,
    "height": 30,
    "relative": true
  }
}

// Maintain aspect ratio
{
  "command": "resize_node",
  "params": {
    "nodeId": "1:2",
    "width": 200,
    "maintainAspectRatio": true
  }
}
```

---

### Grouping Commands

#### `group_nodes`

Group multiple nodes together.

**Parameters:**

```json
{
  "nodeIds": ["1:2", "1:3", "1:4"],
  "name": "Group Name"
}
```

**Example:**

```json
{
  "command": "group_nodes",
  "params": {
    "nodeIds": ["1:2", "1:3", "1:4"],
    "name": "Card Elements"
  }
}
```

---

#### `ungroup_nodes`

Ungroup a group.

**Parameters:**

```json
{
  "nodeId": "1:5"
}
```

**Example:**

```json
{
  "command": "ungroup_nodes",
  "params": {
    "nodeId": "1:5"
  }
}
```

---

### Layout & Styling Commands

#### `apply_auto_layout`

Apply auto-layout to a frame.

**Parameters:**

```json
{
  "nodeId": "1:2",
  "direction": "HORIZONTAL" | "VERTICAL",
  "spacing": 16,
  "paddingTop": 20,
  "paddingRight": 20,
  "paddingBottom": 20,
  "paddingLeft": 20
}
```

**Example:**

```json
{
  "command": "apply_auto_layout",
  "params": {
    "nodeId": "1:2",
    "direction": "VERTICAL",
    "spacing": 16,
    "paddingTop": 24,
    "paddingRight": 24,
    "paddingBottom": 24,
    "paddingLeft": 24
  }
}
```

---

#### `set_properties`

Set various node properties dynamically.

**Parameters:**

```json
{
  "nodeId": "1:2",
  "properties": {
    // Fills
    "fills": [
      {
        "type": "SOLID",
        "color": {"r": 0, "g": 0.4, "b": 1}
      },
      {
        "type": "GRADIENT_LINEAR",
        "gradientStops": [
          {"position": 0, "color": {"r": 0, "g": 0.4, "b": 1}},
          {"position": 1, "color": {"r": 0.6, "g": 0.2, "b": 1}}
        ]
      }
    ],

    // Strokes
    "strokes": [
      {
        "type": "SOLID",
        "color": {"r": 0, "g": 0, "b": 0},
        "strokeWeight": 2
      }
    ],
    "strokeAlign": "CENTER" | "INSIDE" | "OUTSIDE",
    "strokeCap": "NONE" | "ROUND" | "SQUARE",
    "strokeJoin": "MITER" | "BEVEL" | "ROUND",

    // Effects
    "effects": [
      {
        "type": "DROP_SHADOW",
        "radius": 10,
        "offset": {"x": 0, "y": 4},
        "color": {"r": 0, "g": 0, "b": 0, "a": 0.25}
      }
    ],

    // Constraints
    "constraints": {
      "horizontal": "MIN" | "CENTER" | "MAX" | "STRETCH",
      "vertical": "MIN" | "CENTER" | "MAX" | "STRETCH"
    },

    // Text properties
    "lineHeight": {"value": 1.5, "unit": "AUTO"},
    "letterSpacing": {"value": 2, "unit": "PIXELS"},
    "paragraphSpacing": 8,
    "paragraphIndent": 0,

    // Opacity
    "opacity": 0.8,

    // Corner radius (for rectangles)
    "cornerRadius": 12
  }
}
```

**Examples:**

**Solid fill:**

```json
{
  "command": "set_properties",
  "params": {
    "nodeId": "1:2",
    "properties": {
      "fills": [
        {
          "type": "SOLID",
          "color": { "r": 1, "g": 0.2, "b": 0.2 }
        }
      ]
    }
  }
}
```

**Linear gradient:**

```json
{
  "command": "set_properties",
  "params": {
    "nodeId": "1:2",
    "properties": {
      "fills": [
        {
          "type": "GRADIENT_LINEAR",
          "gradientStops": [
            { "position": 0, "color": { "r": 0, "g": 0.4, "b": 1 } },
            { "position": 1, "color": { "r": 0.6, "g": 0.2, "b": 1 } }
          ]
        }
      ]
    }
  }
}
```

**Drop shadow:**

```json
{
  "command": "set_properties",
  "params": {
    "nodeId": "1:2",
    "properties": {
      "effects": [
        {
          "type": "DROP_SHADOW",
          "radius": 10,
          "offset": { "x": 0, "y": 4 },
          "color": { "r": 0, "g": 0, "b": 0, "a": 0.25 }
        }
      ]
    }
  }
}
```

**Text properties:**

```json
{
  "command": "set_properties",
  "params": {
    "nodeId": "1:2",
    "properties": {
      "lineHeight": { "value": 1.5, "unit": "AUTO" },
      "letterSpacing": { "value": 2, "unit": "PIXELS" },
      "paragraphSpacing": 8
    }
  }
}
```

---

## Color Format

Colors in Figma use RGB values from 0-1:

```json
{
  "r": 0, // Red: 0-1
  "g": 0.4, // Green: 0-1
  "b": 1, // Blue: 0-1
  "a": 1 // Alpha: 0-1 (optional, defaults to 1)
}
```

**Common colors:**

- Black: `{"r": 0, "g": 0, "b": 0}`
- White: `{"r": 1, "g": 1, "b": 1}`
- Blue (#0066FF): `{"r": 0, "g": 0.4, "b": 1}`
- Red (#FF3333): `{"r": 1, "g": 0.2, "b": 0.2}`

**Hex to RGB conversion:**

- `#0066FF` → `r: 0/255 = 0, g: 102/255 = 0.4, b: 255/255 = 1`

---

## Common Patterns

### Create and Style

```json
{
  "command": "create_rectangle",
  "params": {
    "name": "Button",
    "width": 120,
    "height": 40,
    "cornerRadius": 8
  },
  "parent": "1:2"
}
```

Then:

```json
{
  "command": "set_properties",
  "params": {
    "nodeId": "1:3",
    "properties": {
      "fills": [{ "type": "SOLID", "color": { "r": 0, "g": 0.4, "b": 1 } }]
    }
  }
}
```

### Batch Operations

```json
{
  "command": "post_batch_commands",
  "params": {
    "commands": [
      {
        "command": "create_frame",
        "params": { "name": "Frame 1", "width": 100, "height": 100 }
      },
      {
        "command": "create_frame",
        "params": { "name": "Frame 2", "width": 100, "height": 100 }
      },
      {
        "command": "create_frame",
        "params": { "name": "Frame 3", "width": 100, "height": 100 }
      }
    ]
  }
}
```

---

## Notes

- All `file_key` parameters are **optional** - will auto-detect from plugin if not provided
- Use `parent` parameter to create elements inside other elements
- Node IDs are in format `"1:2"` (page:node)
- Commands execute sequentially in batch operations
- Use `wait_for_completion: true` to wait for command to finish before returning

---

**For full test prompts, see `_docs/COMPREHENSIVE_TEST_PROMPTS.md`**
