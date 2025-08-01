# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **HTTP Transport Support** - Added Streamable HTTP transport alongside stdio
  - Command line arguments: `--transport=http`, `--port=<number>`, and `--host=<ip-address>`
  - Default HTTP port: 3300, default host: localhost
  - CORS support for browser compatibility
  - Session management with UUID-based session IDs
  - Compatible with MCP SDK StreamableHTTPClientTransport
  - DNS rebinding protection for remote deployments
  - Support for binding to any IP address (e.g., 0.0.0.0 for remote access)
- Test suite for HTTP transport using MCP SDK client
- Enhanced command line interface with help documentation
- New npm scripts for HTTP development and testing

### Changed

- Updated server class to support both stdio and HTTP transports
- Added express and cors dependencies for HTTP transport
- Enhanced index.js with command line argument parsing
- Cleaned up unnecessary test files and improved .gitignore patterns

## [1.6.0] - 2025-01-01

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
