# Data Model: Figma MCP Server

**Date**: 2025-01-27  
**Feature**: Figma MCP Server Project

## Entities

### FigmaFile

Represents a Figma design file accessible via the Figma API.

**Attributes**:

- `fileKey` (string, required): Unique identifier extracted from Figma file URL
- `name` (string): Display name of the file
- `lastModified` (datetime): Last modification timestamp
- `thumbnailUrl` (string, optional): URL to file thumbnail
- `version` (string): File version identifier
- `document` (FigmaNode): Root document node containing the file structure

**Relationships**:

- Contains multiple `Node` entities (hierarchical tree)
- Contains multiple `Component` entities
- Contains multiple `Style` entities
- Contains multiple `DesignToken` entities (via variables)

**Validation Rules**:

- `fileKey` must match Figma file key format (alphanumeric)
- `fileKey` must be accessible with provided access token

**State Transitions**: N/A (read-only representation)

### Node

Represents a design element in Figma (frame, text, rectangle, component, etc.).

**Attributes**:

- `id` (string, required): Unique node identifier (format: "123:456")
- `name` (string): Display name of the node
- `type` (NodeType, required): Type of node (FRAME, TEXT, RECTANGLE, etc.)
- `children` (Node[], optional): Child nodes (for container types)
- `properties` (object): Type-specific properties (dimensions, styles, constraints, etc.)
- `visible` (boolean, default: true): Visibility state
- `parent` (string, optional): Parent node ID reference

**Relationships**:

- Belongs to one `FigmaFile`
- May have parent `Node` (hierarchical)
- May have child `Node` entities
- May reference `Style` entities
- May be a `Component` instance

**Validation Rules**:

- `id` must match Figma node ID format (digits:digits)
- `type` must be valid Figma node type
- `parent` reference must exist if specified
- `children` only valid for container node types

**State Transitions**:

- Created → Active (when command executes successfully)
- Active → Deleted (if node is removed, but this is read-only in API)

### Command

Represents an instruction to create or modify design elements, posted as structured JSON in Figma comments.

**Attributes**:

- `id` (string, required): Unique command identifier (format: "cmd-{timestamp}-{uuid}")
- `type` (string, required): Always "mcp-command"
- `version` (string, default: "1.0"): Command format version
- `command` (string, required): Command type (create_frame, create_text, etc.)
- `params` (object, required): Command-specific parameters
- `parent` (string, optional): Parent node ID for hierarchical placement
- `timestamp` (datetime, required): Command creation timestamp (ISO 8601)

**Relationships**:

- Posted to one `FigmaFile` (via comment)
- May reference parent `Node` via `parent` attribute
- Has one `CommandResponse` (after execution)

**Validation Rules**:

- `id` must be unique within command queue
- `command` must be recognized command type
- `params` must validate against command-specific schema (Zod)
- `parent` must be valid node ID format if provided
- `timestamp` must be valid ISO 8601 datetime

**State Transitions**:

- Pending → Posted (when comment is posted)
- Posted → Completed (when plugin executes successfully)
- Posted → Failed (when plugin execution fails)
- Posted → Timeout (when timeout window expires)

### CommandResponse

Represents the result of command execution, posted as a reply to the command comment.

**Attributes**:

- `type` (string, required): Always "mcp-response"
- `commandId` (string, required): Reference to original command ID
- `status` (enum, required): "success" | "error" | "pending"
- `result` (object, optional): Execution result (nodeId, name, type, etc.)
- `error` (object, optional): Error details (code, message, details)
- `timestamp` (datetime, required): Response creation timestamp
- `executionTime` (number, optional): Execution duration in milliseconds

**Relationships**:

- References one `Command` via `commandId`
- Posted as reply to command comment in `FigmaFile`

**Validation Rules**:

- `commandId` must reference existing command
- `status` must be valid enum value
- `result` required if `status` is "success"
- `error` required if `status` is "error"
- `timestamp` must be valid ISO 8601 datetime

**State Transitions**: N/A (immutable response record)

### CommandQueue

Tracks pending, executing, and completed commands with status, timestamps, and responses.

**Attributes**:

- `commandId` (string, required): Unique identifier (references Command.id)
- `command` (Command, required): Full command object
- `fileKey` (string, required): Target Figma file
- `status` (enum, required): "pending" | "posted" | "completed" | "failed" | "timeout"
- `commentId` (string, optional): Figma comment ID where command was posted
- `response` (CommandResponse, optional): Execution response
- `createdAt` (number, required): Creation timestamp (Unix milliseconds)
- `updatedAt` (number, required): Last update timestamp
- `timeoutAt` (number, required): Timeout expiration timestamp

**Relationships**:

- Contains multiple `Command` entities
- References one `FigmaFile` via `fileKey`

**Validation Rules**:

- `commandId` must be unique within queue
- `status` transitions must be valid (pending → posted → completed/failed/timeout)
- `timeoutAt` must be after `createdAt`
- `response` only valid when `status` is "completed" or "failed"

**State Transitions**:

- pending → posted (when comment posted)
- posted → completed (when response received with success)
- posted → failed (when response received with error)
- posted → timeout (when timeoutAt reached)

### Component

Represents a reusable component definition in a Figma file.

**Attributes**:

- `nodeId` (string, required): Node ID of the component
- `key` (string, required): Component key (unique identifier)
- `name` (string, required): Component name
- `description` (string, optional): Component description
- `fileKey` (string, required): File containing the component

**Relationships**:

- Belongs to one `FigmaFile`
- May have multiple `Instance` nodes referencing it

**Validation Rules**:

- `nodeId` must be valid Figma node ID
- `key` must be unique within file
- `fileKey` must reference accessible file

**State Transitions**: N/A (read-only metadata)

### Style

Represents a design style (color, text, effect, grid) defined in a Figma file.

**Attributes**:

- `id` (string, required): Style ID
- `key` (string, required): Style key (unique identifier)
- `name` (string, required): Style name
- `styleType` (enum, required): "FILL" | "STROKE" | "TEXT" | "EFFECT" | "GRID"
- `description` (string, optional): Style description
- `fileKey` (string, required): File containing the style

**Relationships**:

- Belongs to one `FigmaFile`
- May be applied to multiple `Node` entities

**Validation Rules**:

- `id` must be valid style ID
- `key` must be unique within file
- `styleType` must match style category

**State Transitions**: N/A (read-only metadata)

### DesignToken

Represents a design system value (color, typography, spacing) extracted from Figma variables or styles.

**Attributes**:

- `type` (enum, required): "color" | "typography" | "spacing" | "number" | "string" | "boolean"
- `name` (string, required): Token name
- `value` (any, required): Token value (type-specific)
- `collection` (string, optional): Variable collection name
- `mode` (string, optional): Variable mode (for multi-mode variables)
- `fileKey` (string, required): File containing the token

**Relationships**:

- Belongs to one `FigmaFile`
- May be applied to `Node` entities via design system application

**Validation Rules**:

- `type` must be valid token type
- `value` must match type (color → RGB object, spacing → number, etc.)
- `name` should follow naming convention (e.g., kebab-case)

**State Transitions**: N/A (read-only extraction)

## Relationships Summary

```
FigmaFile
  ├── contains → Node* (hierarchical tree)
  ├── contains → Component*
  ├── contains → Style*
  ├── contains → DesignToken*
  └── receives → Command* (via comments)

Node
  ├── belongs to → FigmaFile
  ├── parent → Node (optional)
  ├── children → Node* (optional)
  └── may reference → Style*

Command
  ├── posted to → FigmaFile
  ├── references → Node (parent, optional)
  └── generates → CommandResponse

CommandQueue
  ├── tracks → Command*
  └── references → FigmaFile

Component
  └── belongs to → FigmaFile

Style
  └── belongs to → FigmaFile

DesignToken
  └── belongs to → FigmaFile
```

## Data Flow

1. **Read Operations**: MCP Server → Figma API → File/Node/Component/Style data
2. **Write Operations**: MCP Server → Command Queue → Figma Comment → Plugin → Node Creation → Response Comment → Queue Update
3. **Export Operations**: MCP Server → Figma API → Image URLs
4. **Polling**: MCP Server → Figma Comments API → Response Detection → Queue Update

## Validation Rules Summary

- All node IDs must match format: `^\d+:\d+$`
- All command IDs must match format: `^cmd-\d+-[a-f0-9]{8}$`
- All timestamps must be ISO 8601 format
- All file keys must be accessible with provided token
- Command parameters must validate against Zod schemas
- State transitions must follow defined flow
