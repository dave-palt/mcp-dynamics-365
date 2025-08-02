# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.1] - 2025-08-02

### Fixed

- **VS Code Extension Configuration**: Fixed missing `mcpDynamics365.httpPort` configuration registration
- **Documentation**: Updated extension README to include all registered configuration properties
- **Port Configuration**: Removed production/development port distinctions, now uses consistent 3300 default
- **Test Files**: Updated test scripts to use environment variable configuration with proper defaults

### Changed

- **Environment Variable Usage**: Test scripts now respect `MCP_HTTP_PORT` environment variable
- **Deprecation Notice**: Added clear deprecation warnings for stdio transport (deprecated since v2.0.0)
- **Configuration Documentation**: Added complete configuration options including stdio transport setup

## [2.0.0] - 2025-08-02

### Added

- **HTTP Transport Support** - Added Streamable HTTP transport alongside stdio
  - Command line arguments: `--transport=http`, `--port=<number>`, and `--host=<ip-address>`
  - Default HTTP port: 3300, default host: localhost
  - Environment variable configuration: `MCP_HTTP_PORT` and `MCP_HTTP_HOST` for default values
  - CORS support for browser compatibility
  - Session management with UUID-based session IDs
  - Compatible with MCP SDK StreamableHTTPClientTransport
  - DNS rebinding protection for remote deployments
  - Support for binding to any IP address (e.g., 0.0.0.0 for remote access)
- **VS Code Extension Enhancements**
  - Intelligent development vs production command visibility
  - Auto-detection of development environments (workspace contains MCP server source)
  - Clean production command names ("Start HTTP Server" instead of "Start HTTP Server (Production)")
  - Conditional local development commands ("Start HTTP Server (Local Dev)")
  - Enhanced emoji-rich logging for better debugging experience
  - Smart environment detection with manual override via `enableDevelopmentCommands` setting
- Test suite for HTTP transport using MCP SDK client
- Enhanced command line interface with help documentation
- New npm scripts for HTTP development and testing
- Cross-referenced documentation between main project and VS Code extension

### Changed

- **Major Code Refactoring** - Modularized large files for better maintainability
  - Split `server.ts` (902 lines) into modular components in `src/tools/` and `src/transports/`
  - Extracted tool implementations: `schema-tools.ts`, `entity-tools.ts`, `query-tools.ts`
  - Separated transport logic: `http-transport.ts`, `stdio-transport.ts`
  - VS Code extension (623 lines) refactored into modular structure with `providers/`, `commands/`, and `utils/`
  - Improved code organization and separation of concerns
- Updated server class to support both stdio and HTTP transports
- Added express and cors dependencies for HTTP transport
- Enhanced index.js with command line argument parsing
- Cleaned up unnecessary test files and improved .gitignore patterns
- **VS Code Extension Command Structure** - Renamed and reorganized commands for better UX
  - Production command simplified to "Start HTTP Server"
  - Development commands now conditionally visible based on environment detection
- **Documentation Restructuring** - Consolidated development vs production documentation into extension README with cross-references

## [1.6.0] - 2025-07

### Added

- MCP server implementation for Dynamics 365 CRM
- CRUD operations for entities (create, read, update, delete)
- Entity and attribute schema retrieval
- OData query execution support
- OAuth 2.0 authentication with Dynamics 365
- VS Code extension for setup
- 8 MCP tools for D365 operations
- TypeScript implementation with ES modules
- Test suite for read operations
