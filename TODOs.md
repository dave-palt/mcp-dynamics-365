# TODOs

## 🔴 High

## 🟡 Medium

- [ ] **Docker Support** - Containerization with Docker Compose
- [ ] **Read-Only Mode** - Configuration flag to disable write operations
- [ ] **Better Error Handling** - Improved messages and retry logic

## 🟢 Low

- [ ] **Performance** - Schema caching, connection pooling
- [ ] **Monitoring** - Health checks, basic metrics
- [ ] **Advanced Features** - Batch operations, webhooks, multi-env support

## ✅ Completed

- [ ] **Authentication** - Implement auth strategy for HTTP mode following the specifications of this page https://modelcontextprotocol.io/specification/draft/basic/authorization
  - [x] Support multiple authentication flows (JWT/JWKS and opaque/API)
    - [x] Add OAUTH_FLOW and OAUTH_OPAQUE_USER_API env variables
    - [x] Refactor token validation into a dedicated module
    - [x] Update documentation and example configs for new flows
    - [x] Link extension README to main README for authentication setup
- MCP server with stdio transport
- CRUD operations for D365 entities
- Schema retrieval (entity/attribute metadata)
- OData query execution
- VS Code extension
- 8 MCP tools for D365 operations
- Test suite for read operations
- **HTTP Transport** - Streamable HTTP alongside stdio (port 3300)
