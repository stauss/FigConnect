# Research & Technology Decisions: Figma MCP Server

**Date**: 2025-01-27  
**Feature**: Figma MCP Server Project  
**Purpose**: Document technology choices, rationale, and alternatives considered

## Technology Stack Decisions

### TypeScript & Node.js

**Decision**: Use TypeScript 5.3+ with strict mode and Node.js 18+

**Rationale**:

- TypeScript provides type safety for complex API integrations and reduces runtime errors
- Strict mode enforces best practices and catches potential issues early
- Node.js 18+ provides modern JavaScript features and stable LTS support
- Both MCP server and Figma plugin can share TypeScript codebase patterns
- Strong ecosystem support for both MCP protocol and Figma API integrations

**Alternatives Considered**:

- **Python**: Strong ecosystem but Figma Plugin API requires JavaScript/TypeScript
- **Pure JavaScript**: Less type safety, more runtime errors in complex integrations
- **Other runtimes**: Deno/Bun not yet mature enough for production MCP servers

### Model Context Protocol SDK

**Decision**: Use `@modelcontextprotocol/sdk` for MCP server implementation

**Rationale**:

- Official SDK maintained by MCP specification authors
- Provides standardized protocol implementation
- Handles stdio transport, tool registration, and request/response formatting
- Reduces custom protocol implementation complexity
- Well-documented and actively maintained

**Alternatives Considered**:

- **Custom MCP implementation**: Too complex, error-prone, and maintenance burden
- **Other protocol libraries**: MCP is specific protocol, no direct alternatives

### HTTP Client: node-fetch

**Decision**: Use `node-fetch` for Figma API HTTP requests

**Rationale**:

- Lightweight and focused on HTTP requests
- Native Promise/async support
- Good TypeScript support
- Standard fetch API interface familiar to developers
- Works well with rate limiting and retry logic

**Alternatives Considered**:

- **axios**: More features but heavier dependency
- **got**: Good but less familiar API
- **Native fetch (Node 18+)**: Available but node-fetch provides better error handling

### Schema Validation: Zod

**Decision**: Use `zod` for command and input validation

**Rationale**:

- TypeScript-first schema validation
- Generates TypeScript types from schemas (single source of truth)
- Excellent error messages for debugging
- Runtime validation for API inputs
- Widely adopted in TypeScript ecosystem

**Alternatives Considered**:

- **Joi**: More features but less TypeScript integration
- **Yup**: Similar but less active development
- **Manual validation**: Too error-prone for complex command structures

### Testing Framework

**Decision**: Use Jest or Vitest for testing

**Rationale**:

- Both support TypeScript out of the box
- Good mocking capabilities for API calls
- Fast execution for unit tests
- Vitest offers faster performance, Jest has more ecosystem support
- Either choice acceptable based on team preference

**Alternatives Considered**:

- **Mocha + Chai**: More setup required, less modern
- **Tape**: Minimal but less feature-rich
- **No testing**: Violates test-first principles

### Figma Plugin API

**Decision**: Use `@figma/plugin-typings` for TypeScript types

**Rationale**:

- Official type definitions from Figma
- Provides IntelliSense and type checking for Plugin API
- Reduces errors when working with Figma's API
- Required for proper TypeScript development of plugins

**Alternatives Considered**:

- **Manual type definitions**: Too error-prone and maintenance burden
- **No types**: Would lead to runtime errors and poor developer experience

## Architecture Decisions

### Hybrid Comment-Based Command System

**Decision**: Use Figma comments as command channel between MCP server and plugin

**Rationale**:

- Figma REST API is read-only for node manipulation
- Comments API allows posting structured data
- Plugin can poll comments and execute commands
- Provides audit trail of all commands
- Works within Figma's existing infrastructure

**Alternatives Considered**:

- **Direct API calls**: Not possible - REST API doesn't support node creation
- **Webhooks**: Would require external server, adds complexity
- **File-based communication**: Would require file system access, less reliable
- **WebSocket**: Would require custom server infrastructure

### In-Memory Command Queue

**Decision**: Use in-memory queue for command tracking (no persistent storage)

**Rationale**:

- Simpler implementation for MVP
- No database setup required
- Sufficient for single-user localhost deployment
- Commands are short-lived (execute within 30 seconds typically)
- Can be enhanced later if persistence needed

**Alternatives Considered**:

- **Database storage**: Overkill for MVP, adds deployment complexity
- **File-based queue**: More complex, potential file locking issues
- **Redis/external queue**: Unnecessary for single-user scenario

### Timeout-Based Plugin Detection

**Decision**: Detect plugin availability via command timeout (no explicit status check)

**Rationale**:

- Simpler implementation
- No additional status endpoint needed
- Works reliably: if plugin doesn't respond, it's not running
- Clear error messages when timeout occurs
- Aligns with command execution flow

**Alternatives Considered**:

- **Heartbeat mechanism**: Adds complexity, requires plugin to continuously post status
- **Explicit status endpoint**: Would require additional API design
- **File-based status**: Would require file system access

### File Structure Caching

**Decision**: Implement in-memory cache for file structure with 5-minute TTL

**Rationale**:

- Reduces API calls (40% reduction target)
- Improves performance for repeated operations
- 5-minute TTL balances freshness vs performance
- In-memory sufficient for single-user scenario
- Can be invalidated on file modification detection

**Alternatives Considered**:

- **No caching**: Would exceed rate limits on repeated operations
- **Persistent cache**: Unnecessary complexity for localhost deployment
- **Longer TTL**: Risk of stale data
- **Shorter TTL**: Less performance benefit

## Configuration Management

### Environment Variables for Secrets

**Decision**: Store Figma access token in `.env` file (not committed to git)

**Rationale**:

- Standard practice for local development
- Easy to set up and manage
- Clear separation of secrets from code
- Works well with dotenv library
- Documented in `.env.example`

**Alternatives Considered**:

- **Config file with token**: Risk of accidental commit
- **Command-line arguments**: Less secure, visible in process list
- **System keychain**: More complex, platform-specific

### Configurable Logging Levels

**Decision**: Support debug, info, warn, error levels via config/environment variable

**Rationale**:

- Essential for debugging multi-system integration (MCP + Figma API + Plugin)
- User can adjust verbosity based on needs
- Default to info level for normal operation
- Debug level for troubleshooting
- Environment variable allows runtime configuration

**Alternatives Considered**:

- **Fixed logging level**: Insufficient for debugging complex integrations
- **File-based config only**: Less flexible, requires restart to change
- **No logging**: Would make debugging impossible

## Performance Considerations

### Rate Limiting Strategy

**Decision**: Implement client-side rate limiting (60 requests/minute default, configurable)

**Rationale**:

- Figma API limit is 1000 requests/minute per token
- Conservative default prevents accidental limit hits
- Automatic queuing and retry when limit approached
- Configurable for different use cases
- Prevents API errors and improves reliability

**Alternatives Considered**:

- **No rate limiting**: Risk of hitting API limits
- **Server-side rate limiting**: Unnecessary for single-user localhost
- **Fixed 1000/minute**: Too aggressive, no safety margin

### Depth Limiting for File Traversal

**Decision**: Support configurable depth limits (default 5 levels) for file structure reads

**Rationale**:

- Prevents excessive API calls for very large files
- Allows users to control detail level needed
- Default 5 levels covers most use cases
- Can be increased for specific deep structures
- Improves performance for large files

**Alternatives Considered**:

- **No depth limit**: Risk of excessive API calls and timeouts
- **Fixed depth**: Less flexible
- **Full depth always**: Performance issues with large files

## Error Handling Strategy

### Graceful Degradation

**Decision**: Return clear error messages without exposing sensitive data (tokens, internal details)

**Rationale**:

- User needs actionable error information
- Security: tokens must never appear in logs/errors
- Helps with debugging without revealing internals
- Aligns with security best practices
- Improves user experience

**Alternatives Considered**:

- **Generic errors**: Too vague, unhelpful for debugging
- **Verbose errors with tokens**: Security risk
- **Silent failures**: Makes debugging impossible

### Retry Logic for Transient Failures

**Decision**: Implement retry with exponential backoff for network/rate limit errors

**Rationale**:

- Network issues are transient
- Rate limit errors resolve after time window
- Exponential backoff prevents overwhelming API
- Improves reliability without user intervention
- Standard practice for API integrations

**Alternatives Considered**:

- **No retries**: Poor user experience, manual retry needed
- **Immediate retries**: Risk of making problems worse
- **Fixed retry count**: Less adaptive than exponential backoff

## Integration Patterns

### MCP Tool Registration Pattern

**Decision**: Register all tools in centralized registry, route via switch statement

**Rationale**:

- Clear separation of tool definitions from implementation
- Easy to add new tools
- Type-safe tool definitions with Zod schemas
- Follows MCP SDK best practices
- Maintainable and extensible

**Alternatives Considered**:

- **Dynamic tool loading**: Too complex for MVP
- **Separate handlers per tool**: More files, harder to maintain
- **Plugin architecture**: Overkill for fixed tool set

### Command Template Pattern

**Decision**: Use template functions for common command creation

**Rationale**:

- Reduces boilerplate in command creation
- Ensures consistent command structure
- Type-safe command generation
- Easy to extend with new command types
- Centralized command ID generation

**Alternatives Considered**:

- **Manual JSON construction**: Error-prone, inconsistent
- **Class-based commands**: More complex, unnecessary abstraction
- **String templates**: Less type-safe

## Summary

All technology choices align with:

- TypeScript-first development for type safety
- Standard Node.js ecosystem tools
- Official SDKs and type definitions where available
- Simplicity over complexity (YAGNI principle)
- Single-user localhost deployment context
- Clear error handling and debugging support

No unresolved technical decisions remain. All choices are justified and alternatives considered.
