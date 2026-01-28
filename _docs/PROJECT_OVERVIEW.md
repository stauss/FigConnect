# Figma MCP Server - Project Overview

## 🎯 Project Vision

Create an MCP (Model Context Protocol) server that bridges Claude Code with Figma, enabling AI-powered design creation and modification through natural language prompts. This system will allow developers and designers to use Claude Code to read, analyze, and manipulate Figma designs programmatically.

## 🏗️ Architecture

```
┌─────────────────┐
│   Claude Code   │
│   (AI Agent)    │
└────────┬────────┘
         │
         │ MCP Protocol
         │
┌────────▼────────┐
│   MCP Server    │
│  (Node.js/TS)   │
├─────────────────┤
│ - Read Tools    │
│ - Command Post  │
│ - Queue Manager │
└────────┬────────┘
         │
         │ REST API / Comments
         │
┌────────▼────────┐
│   Figma API     │
│   & Plugin      │
├─────────────────┤
│ - File Access   │
│ - Command Exec  │
│ - Node Creation │
└─────────────────┘
```

## 🎪 Hybrid Approach

Due to Figma's API limitations (REST API is read-only for node manipulation), this project uses a hybrid architecture:

1. **MCP Server**: Handles all read operations and API communication
2. **Comment-Based Commands**: Posts structured commands as Figma comments
3. **Figma Plugin**: Polls comments and executes design operations

## 📦 Tech Stack

- **Language**: TypeScript (strict mode)
- **Runtime**: Node.js 18+
- **MCP SDK**: `@modelcontextprotocol/sdk`
- **API Client**: `node-fetch`
- **Testing**: Jest or Vitest
- **Build**: TypeScript compiler (tsc)
- **Linting**: ESLint + Prettier

## 🗂️ Project Structure

```
figma-mcp-workspace/
├── figma-mcp-server/           # MCP Server (Phases 1-2)
│   ├── src/
│   │   ├── index.ts
│   │   ├── types.ts
│   │   ├── config.ts
│   │   ├── tools/
│   │   │   ├── registry.ts
│   │   │   ├── read-tools.ts
│   │   │   ├── export-tools.ts
│   │   │   └── command-tools.ts
│   │   ├── figma/
│   │   │   ├── client.ts
│   │   │   └── utils.ts
│   │   ├── commands/
│   │   │   ├── parser.ts
│   │   │   ├── validator.ts
│   │   │   └── templates.ts
│   │   └── queue/
│   │       ├── manager.ts
│   │       └── polling.ts
│   ├── tests/
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md
│
├── figma-plugin-bridge/        # Figma Plugin (Phase 3)
│   ├── src/
│   │   ├── code.ts
│   │   ├── ui.html
│   │   ├── commands/
│   │   ├── polling/
│   │   └── utils/
│   ├── manifest.json
│   └── package.json
│
└── docs/                       # Documentation
    ├── PROJECT_OVERVIEW.md     # This file
    ├── PHASE_1.md
    ├── PHASE_2.md
    ├── PHASE_3.md
    ├── PHASE_4.md
    ├── API_REFERENCE.md
    └── EXAMPLES.md
```

## 🚀 Development Phases

### Phase 1: Foundation & Read-Only MCP Server
**Duration**: 1-2 days  
**Goal**: Build working MCP server with read-only Figma operations

**Deliverables**:
- MCP server connects to Claude Code
- 9 read-only tools implemented
- Figma API client with error handling
- Basic test suite

**See**: [PHASE_1.md](./PHASE_1.md)

---

### Phase 2: Comment-Based Command System
**Duration**: 2-3 days  
**Goal**: Enable write operations through structured comments

**Deliverables**:
- Command syntax defined
- Command posting system
- Queue management
- Polling for results

**See**: [PHASE_2.md](./PHASE_2.md)

---

### Phase 3: Figma Plugin Bridge
**Duration**: 2-3 days  
**Goal**: Build plugin that executes commands from comments

**Deliverables**:
- Figma plugin installs and runs
- Comment polling system
- 8 core command executors
- Response posting

**See**: [PHASE_3.md](./PHASE_3.md)

---

### Phase 4: Enhanced Features
**Duration**: 3-5 days  
**Goal**: Add advanced capabilities and optimizations

**Deliverables**:
- Batch operations
- Design system integration
- AI-friendly high-level tools
- Performance optimizations

**See**: [PHASE_4.md](./PHASE_4.md)

---

## 🎬 Getting Started

### Prerequisites

```bash
# Required
- Node.js 18+ 
- npm or yarn
- Figma account with API access
- Claude Code or Cursor IDE

# For plugin development
- Figma desktop app
```

### Initial Setup

1. **Get Figma Access Token**
   - Go to Figma → Settings → Account → Personal Access Tokens
   - Generate new token with file read/write permissions
   - Save token securely

2. **Clone/Create Project**
   ```bash
   mkdir figma-mcp-workspace
   cd figma-mcp-workspace
   mkdir figma-mcp-server
   mkdir figma-plugin-bridge
   mkdir docs
   ```

3. **Start with Phase 1**
   - Read [PHASE_1.md](./PHASE_1.md)
   - Use provided prompts with Claude Code/Cursor
   - Build incrementally

### Environment Setup

```bash
# figma-mcp-server/.env
FIGMA_ACCESS_TOKEN=figd_xxxxxxxxxxxxxxxxxxxxx
FIGMA_FILE_KEY=your-test-file-key
POLLING_INTERVAL_MS=5000
COMMAND_TIMEOUT_MS=30000
LOG_LEVEL=info
```

### MCP Configuration

```json
// ~/.config/claude/claude_desktop_config.json
{
  "mcpServers": {
    "figma": {
      "command": "node",
      "args": ["/absolute/path/to/figma-mcp-server/dist/index.js"],
      "env": {
        "FIGMA_ACCESS_TOKEN": "figd_xxxxxxxxxxxxxxxxxxxxx"
      }
    }
  }
}
```

## 📋 Command Format Specification

### Command Structure (Posted as Figma Comment)

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
  "timestamp": "2025-01-27T10:30:00Z"
}
```

### Response Structure (Posted as Comment Reply)

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
  "timestamp": "2025-01-27T10:30:05Z",
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
  "timestamp": "2025-01-27T10:30:05Z"
}
```

## 🎯 Success Criteria

### Minimum Viable Product (Phases 1-3)
- [ ] MCP server connects to Claude Code successfully
- [ ] Can read any Figma file structure
- [ ] Can export nodes as PNG/SVG
- [ ] Can post commands via comments
- [ ] Plugin executes basic commands (frame, text, rectangle)
- [ ] Results return to MCP server
- [ ] Error handling works for common cases

### Full Feature Set (Phase 4)
- [ ] Batch command execution
- [ ] Design system integration
- [ ] Component library operations
- [ ] High-level AI-friendly tools
- [ ] Performance optimized (<100ms overhead)
- [ ] Comprehensive documentation
- [ ] Test coverage >80%

## 🧪 Testing Strategy

### Unit Tests
- Tool input validation
- Command parsing and validation
- API client error handling
- Response formatting

### Integration Tests
- End-to-end MCP server operations
- Real Figma API calls (test file)
- Command execution cycle
- Plugin response handling

### Manual Testing
- Claude Code integration
- Natural language prompts
- Complex multi-step operations
- Error recovery

## 📚 Key Resources

### Figma API Documentation
- **REST API**: https://www.figma.com/developers/api
- **Plugin API**: https://www.figma.com/plugin-docs/
- **Webhooks**: https://www.figma.com/developers/api#webhooks

### MCP Documentation
- **Specification**: https://modelcontextprotocol.io/
- **SDK Repository**: https://github.com/modelcontextprotocol/sdk
- **Examples**: https://github.com/modelcontextprotocol/servers

### Example Projects
- **MCP Filesystem Server**: Reference for tool patterns
- **Figma Plugins**: Browse community plugins for patterns

## 💡 Example Use Cases

### Use Case 1: Generate Mobile Screen
```
User → Claude Code: "Create a mobile login screen with email input, 
password input, and a blue login button in my Figma file"

Claude Code executes:
1. get_file_structure() - Understand current file
2. post_command({
     command: "create_frame",
     params: { name: "Login Screen", width: 375, height: 812 }
   })
3. post_command({ command: "create_text", ... }) x3
4. post_command({ command: "create_rectangle", ... }) (button)
5. post_command({ command: "apply_auto_layout", ... })

Result: Complete login screen created in Figma
```

### Use Case 2: Apply Design System
```
User → Claude Code: "Apply our design system colors to all buttons 
in the Dashboard frame"

Claude Code executes:
1. get_variables() - Get design tokens
2. get_node_details("Dashboard") - Find frame
3. search_nodes({ type: "RECTANGLE", name: "*Button*" })
4. For each button:
   post_command({ command: "apply_styles", ... })

Result: All buttons updated with design system colors
```

### Use Case 3: Component Generation
```
User → Claude Code: "Create a card component with image, title, 
description, and CTA button variants"

Claude Code executes:
1. get_components() - Check existing patterns
2. post_command({ command: "create_component_set", ... })
3. post_command({ command: "create_variant", ... }) x3
4. Apply styles and auto-layout

Result: Complete component set with variants
```

## 🐛 Known Limitations

### Figma API Constraints
- **No Direct Node Creation**: REST API is read-only for nodes
- **Rate Limits**: 1000 requests per minute per token
- **Comment Latency**: Polling introduces 5-10 second delay
- **Font Loading**: Async font loading can slow operations
- **No Undo Support**: Plugin operations can't be undone via API

### Technical Constraints
- **Token Security**: Access token must be kept secure
- **Plugin Must Run**: User must keep Figma desktop app open
- **Network Dependency**: Requires internet connection
- **File Size**: Very large files may have slow operations

### Workarounds
- Use webhooks for faster notifications (Phase 4)
- Implement local caching for file structure
- Batch operations to reduce API calls
- Provide clear error messages for font issues

## 🔐 Security Considerations

### Access Token Management
- **Never commit tokens**: Use environment variables
- **Rotate regularly**: Generate new tokens periodically
- **Scope limitation**: Use minimum required permissions
- **Secure storage**: Use system keychain when possible

### Command Validation
- **Input sanitization**: Validate all command parameters
- **Size limits**: Prevent oversized operations
- **Rate limiting**: Throttle command execution
- **Authorization**: Verify user has file access

### Plugin Security
- **Sandbox execution**: Plugin runs in Figma's sandbox
- **No arbitrary code**: Only execute predefined commands
- **Content validation**: Verify comment format
- **Error isolation**: Don't expose system details

## 📈 Future Enhancements

### Short Term (Post-MVP)
- [ ] Real-time updates via Figma webhooks
- [ ] Multiple file support
- [ ] Component library management
- [ ] Design token sync (Style Dictionary integration)
- [ ] Version control integration

### Long Term
- [ ] Visual diff generation
- [ ] AI-powered layout optimization
- [ ] Accessibility checking
- [ ] Design-to-code export
- [ ] Multi-user collaboration support
- [ ] Cloud function deployment (serverless)

## 🤝 Contributing

### Development Workflow
1. Pick a phase or feature
2. Create feature branch
3. Write tests first (TDD)
4. Implement functionality
5. Test with real Figma file
6. Document changes
7. Submit for review

### Code Standards
- **TypeScript strict mode**: No `any` types
- **Naming**: camelCase for functions, PascalCase for types
- **Comments**: JSDoc for all public functions
- **Error handling**: Always handle API errors
- **Logging**: Use structured logging

## 📞 Support & Resources

### Getting Help
- **Issues**: GitHub issues for bugs and features
- **Discussions**: Community forum for questions
- **Documentation**: Comprehensive guides in `/docs`
- **Examples**: Sample code in `/examples`

### Quick Start Prompts for Claude Code

#### Initialize Project
```
Set up the Figma MCP Server project structure as defined in 
PROJECT_OVERVIEW.md. Create all directories, initialize package.json 
with dependencies, configure TypeScript, and create placeholder files 
for Phase 1. Use the tech stack specified: TypeScript strict mode, 
@modelcontextprotocol/sdk, and node-fetch.
```

#### Start Phase 1
```
Implement Phase 1 of the Figma MCP Server project. Follow PHASE_1.md 
exactly. Start by creating the MCP server initialization in src/index.ts, 
then build the Figma API client wrapper with error handling. Implement 
all 9 read-only tools as specified. Use TypeScript strict mode and 
include proper error handling for rate limits and auth errors.
```

#### Build Complete Feature
```
I need to implement the command posting system from Phase 2. Create 
the command parser, validator, and posting tools. Follow the command 
format specification in PROJECT_OVERVIEW.md. Include TypeScript types, 
input validation, and proper error handling. Reference PHASE_2.md for 
complete specifications.
```

## 🎓 Learning Path

For developers new to this stack:

1. **Week 1**: MCP Protocol + Figma API basics
2. **Week 2**: Phase 1 implementation
3. **Week 3**: Phase 2 + start Phase 3
4. **Week 4**: Complete Phase 3, test integration
5. **Week 5**: Phase 4 features and polish

## ✅ Pre-Flight Checklist

Before starting development:

- [ ] Figma account created
- [ ] API access token generated and tested
- [ ] Test Figma file created
- [ ] Node.js 18+ installed
- [ ] Claude Code or Cursor installed
- [ ] Git repository initialized
- [ ] `.gitignore` includes `.env`
- [ ] All documentation files reviewed
- [ ] Development environment configured

## 🚦 Next Steps

1. **Read PHASE_1.md** - Understand the foundation
2. **Set up environment** - Get tokens and tools ready
3. **Run first prompt** - Initialize project with Claude Code
4. **Build incrementally** - One phase at a time
5. **Test continuously** - Validate each feature

---

**Ready to begin?** Start with [PHASE_1.md](./PHASE_1.md) and use the prompts provided with Claude Code or Cursor to build your Figma MCP Server!

---

**Project Status**: 🟢 Ready for Development  
**Last Updated**: 2025-01-27  
**Version**: 1.0.0
