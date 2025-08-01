# Copilot Instructions for MCP Dynamics 365 Server

This file contains specific instructions for AI assistants working on this codebase.

## Project Overview

This is a Model Context Protocol (MCP) server for Microsoft Dynamics 365 CRM. It provides AI agents with tools to perform CRUD operations, query data, fetch schemas, and execute custom operations on Dynamics 365 entities.

## 🚨 Critical: Stay Current with MCP Technology

**The Model Context Protocol ecosystem is rapidly evolving** - changes occur weekly or even daily. Before working on any MCP-related features:

### 📚 **ALWAYS Check Latest Documentation First**

1. **Read the official MCP SDK documentation**: Use the `fetch_webpage` tool to check the latest changes at:

   - Main documentation: https://modelcontextprotocol.io/
   - SDK GitHub: https://github.com/modelcontextprotocol/typescript-sdk
   - Release notes and changelog for breaking changes
   - API documentation for current interfaces and patterns

2. **Check for deprecations and new features**:

   - Transport implementations (HTTP, stdio, SSE)
   - Client/server interfaces and lifecycle methods
   - Tool definition schemas and parameter handling
   - Authentication and security patterns

3. **Verify current best practices**:
   - Package imports and module structure
   - Error handling patterns
   - Type definitions and interfaces
   - Transport configuration and setup

### ⚠️ **Common Pitfalls to Avoid**

- **Don't assume existing patterns are current** - always verify against latest docs
- **Don't use deprecated transport methods** - HTTP/SSE implementations change frequently
- **Don't skip version checking** - MCP SDK updates often include breaking changes
- **Don't implement without research** - newer, simpler approaches may be available

### 🔄 **When to Re-check Documentation**

- Before implementing any new MCP features
- When encountering transport or connection issues
- When SDK version updates are available
- When error patterns don't match current documentation
- Before troubleshooting connectivity or protocol issues

## Package Manager

**Always use `pnpm`** for this project:

- Install dependencies: `pnpm install`
- Build: `pnpm run build`
- Development: `pnpm run dev`
- Testing: `pnpm run test` or `pnpm run test:read-tools`
- Type checking: `pnpm run typecheck`

### Package Management Guidelines

- **Use the most recent compatible versions** when adding new packages
- Check for latest stable versions before installing dependencies
- Update package versions regularly to maintain security and compatibility

## Critical Naming Conventions

The project has **two different naming patterns** that must be used correctly:

### 📋 Metadata Operations

Tools: `get_entity_schema`, `get_attribute_schema`

- **Use SINGULAR entity logical names**: `"contact"`, `"account"`, `"opportunity"`
- Parameter name: `entityName`
- Example: `{ "entityName": "contact" }`

### 📊 Data Operations

Tools: `query_entities`, `get_entity`, `create_entity`, `update_entity`, `delete_entity`

- **Use PLURAL entity set names**: `"contacts"`, `"accounts"`, `"opportunities"`
- Parameter name: `entitySet`
- Example: `{ "entitySet": "contacts" }`

### 🔍 OData Queries

Tool: `execute_odata_query`

- **Use PLURAL entity set names in URL paths**: `"contacts?$filter=..."`
- Example: `{ "query": "contacts?$select=firstname,lastname&$top=5" }`

## File Structure

```
src/
├── api-client.ts     # API client for Dynamics 365 Web API
├── auth.ts          # OAuth 2.0 authentication service
├── index.ts         # Entry point
├── server.ts        # MCP server implementation with tool definitions
└── types.ts         # TypeScript type definitions

vscode-extension/    # VS Code extension for easier setup
test-read-tools.js   # Test file (not committed to git)
```

## Development Guidelines

### TypeScript Configuration

- Uses ES modules (`"type": "module"` in package.json)
- **Keep `.js` extensions in imports** - they are required for ES modules
- Target: ES2022
- Strict mode enabled

### Error Handling

- All API operations return `D365ApiResponse<T>` with success/error structure
- Use comprehensive error messages with context
- Include HTTP status codes when available

### Environment Variables

Required for Dynamics 365 connection:

```
D365_BASE_URL=https://your-org.crm.dynamics.com
D365_CLIENT_ID=your-client-id
D365_CLIENT_SECRET=your-client-secret
D365_TENANT_ID=your-tenant-id
D365_RESOURCE=https://your-org.crm.dynamics.com
```

### Default Configuration

- **Default HTTP port**: 3300
- Use this port for local development and testing unless specifically configured otherwise

### Testing

- `test-read-tools.js` tests all read-only operations
- Uses actual API client, not mocked data
- Only tests standard entities available in all D365 environments
- File is excluded from git commits

## Code Patterns

### Tool Definitions

Each tool in `server.ts` should have:

- Clear description explaining the purpose
- Explicit parameter descriptions with naming convention notes
- Examples showing correct entity name format
- Required vs optional parameters clearly marked

### API Client Methods

- Metadata operations: Accept singular entity names, query `EntityDefinitions`
- Data operations: Accept plural entity set names, query data endpoints
- All methods return `D365ApiResponse<T>` for consistent error handling

### Type Definitions

- Use interfaces for structured data
- Include optional properties where appropriate
- Extend base types for specialized variations

## Common Entity Examples

Use these standard entities in examples and tests:

- **Singular**: `contact`, `account`, `opportunity`, `lead`, `case`
- **Plural**: `contacts`, `accounts`, `opportunities`, `leads`, `cases`

## MCP Integration

- Server implements MCP protocol via `@modelcontextprotocol/sdk`
- Supports both stdio and HTTP transports (StreamableHTTPServerTransport)
- Tools are exposed via `ListToolsRequestSchema` and `CallToolRequestSchema`
- **Always verify transport implementations against latest SDK docs** - transport APIs change frequently

## Security Notes

- Never commit credentials or `.env` files
- Use environment variables for sensitive configuration
- Implement proper error handling to avoid information leakage

## Documentation Standards

- Keep README.md updated with any new tools or changes
- Include practical examples for each tool
- Maintain clear parameter descriptions
- Update VS Code extension README when relevant
- **Maintain CHANGELOG.md**: Update changelog for every feature addition, bug fix, or breaking change
- **Update copilot instructions**: Keep `.github/copilot-instructions.md` in sync with project changes

## Changelog Management

- **Always update CHANGELOG.md** when adding features, fixing bugs, or making breaking changes
- Follow semantic versioning principles
- Include clear descriptions of changes with context
- Group changes by type: Added, Changed, Deprecated, Removed, Fixed, Security
- Date each release and include version numbers
- **Keep entries short and concise** - focus on user-visible changes, not implementation details

## When Adding New Tools

1. Add tool definition to `getAvailableTools()` in `server.ts`
2. Add handler method in the switch statement
3. Implement the private method
4. Add corresponding API client method if needed
5. Update documentation
6. Add test coverage in `test-read-tools.js`
7. Follow naming conventions consistently
8. **Update CHANGELOG.md** with the new feature
9. **Update .gitignore** if new files or patterns need to be excluded
10. **Update copilot instructions** if new patterns, conventions, or workflows are introduced

## Security and Git Management

### .gitignore Maintenance

- **Always update .gitignore** when making changes that could introduce sensitive data
- Review and update exclusion patterns for new file types
- Ensure test files with credentials are properly excluded
- Add patterns for new development tools or build artifacts
- Double-check before committing to avoid exposing sensitive information

## Common Pitfalls to Avoid

❌ **Don't mix naming conventions**

- Don't use `"contacts"` for metadata operations
- Don't use `"contact"` for data operations

❌ **Don't remove `.js` extensions from imports**

- ES modules require explicit file extensions

❌ **Don't commit sensitive files**

- `.env` files
- Any files with credentials
- Configuration files with API keys or secrets

❌ **Don't forget to build before testing**

- Run `pnpm run build` before `pnpm run test:read-tools`

❌ **Don't skip .gitignore updates**

- Always review .gitignore when adding new files or patterns
- Ensure sensitive data patterns are properly excluded

❌ **Don't use outdated MCP patterns**

- Always check latest MCP SDK documentation before implementing features
- Verify transport implementations and API interfaces are current
- Don't rely on cached knowledge - the ecosystem changes rapidly

✅ **Do follow established patterns**

- Use consistent error handling
- Include proper TypeScript types
- Add descriptive tool descriptions
- Test with standard entities only
- **Always verify MCP SDK patterns against latest documentation**
