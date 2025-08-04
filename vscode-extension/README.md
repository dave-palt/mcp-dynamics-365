# MCP Dynamics 365 VS Code Extension

VS Code extension for seamless integration with Microsoft Dynamics 365 CRM via the Model Context Protocol.

> **📖 Main Project Documentation**: For complete API documentation, tool examples, and manual setup instructions, see the [main project README](https://github.com/dave-palt/mcp-dynamics-365#readme).

> **⚠️ Disclaimer**: This extension was generated with AI assistance as a side project. It may not receive regular maintenance or updates. Use at your own discretion.

## Table of Contents

- [MCP Dynamics 365 VS Code Extension](#mcp-dynamics-365-vs-code-extension)
  - [Table of Contents](#table-of-contents)
  - [Features](#features)
  - [Quick Start](#quick-start)
  - [Usage](#usage)
    - [Extension Commands](#extension-commands)
      - [Production Mode (Default)](#production-mode-default)
      - [Development Mode (Auto-detected)](#development-mode-auto-detected)
    - [Extension Settings](#extension-settings)
    - [Available in AI Chat](#available-in-ai-chat)
      - [Available Tools](#available-tools)
      - [Example AI Requests](#example-ai-requests)
  - [Configuration](#configuration)
    - [Method 1: VS Code Settings (Recommended)](#method-1-vs-code-settings-recommended)
    - [Method 2: Environment File](#method-2-environment-file)
  - [Authentication Setup](#authentication-setup)
  - [When Manual Configuration is Needed](#when-manual-configuration-is-needed)
  - [Advanced Configuration](#advanced-configuration)
  - [Troubleshooting](#troubleshooting)
    - [Server Won't Start](#server-wont-start)
    - [Connection Issues](#connection-issues)
    - [Extension Not Working](#extension-not-working)
  - [Support](#support)
  - [License](#license)

## Features

- **Automatic HTTP Server Management**: Extension handles server startup/shutdown automatically
- **Modern HTTP Transport**: Fast, reliable connection to Dynamics 365
- **Zero Configuration**: Works out-of-the-box with `.env` file or VS Code settings
- **Real-time Output**: View server logs in dedicated output channel
- **Auto-start Support**: Optional automatic server startup when VS Code opens

## Quick Start

1. **Install the extension** from the VS Code marketplace
2. **Install the MCP server globally**: `npm install -g @dav3/mcp-dynamics365-server`
   > **⚠️ Note**: HTTP transport requires version 2.0.0 or later
3. **Configure your Dynamics 365 credentials** (see Configuration section below)
4. **Start the HTTP server**: Use "MCP Dynamics 365: Start HTTP Server" command
5. **Server automatically available**: The extension automatically registers the HTTP server with VS Code's AI features
6. **Fallback (if needed)**: If automatic registration doesn't work, manually add to your `mcp.json`:
   ```json
   {
     "servers": {
       "dynamics365-crm": {
         "url": "http://localhost:3300/mcp"
       }
     }
   }
   ```

## Usage

### Extension Commands

The extension provides intelligent command visibility based on your environment:

#### Production Mode (Default)

- **`MCP Dynamics 365: Start HTTP Server`** - Start the HTTP server using the published package
- **`MCP Dynamics 365: Stop HTTP Server`** - Stop the HTTP server
- **`MCP Dynamics 365: Configure MCP Dynamics 365 Server`** - Configure credentials via UI

#### Development Mode (Auto-detected)

All production commands PLUS:

- **`MCP Dynamics 365: Start HTTP Server (Local Dev)`** - Use local built server for development

**Auto-Detection**: Development commands automatically appear when:

1. User setting `mcpDynamics365.enableDevelopmentCommands` is `true`, OR
2. Workspace contains MCP server source code (`src/server.ts` or `dist/index.js`)

**Manual Control**: Set `mcpDynamics365.enableDevelopmentCommands: true` in VS Code settings to force development mode in any workspace.

### Extension Settings

- `mcpDynamics365.useHttpTransport`: Use HTTP transport instead of stdio (default: `true`)
- `mcpDynamics365.serverUrl`: URL of the running MCP Dynamics 365 HTTP server (default: `"http://localhost:3300/mcp"`)
- `mcpDynamics365.httpPort`: Port for the HTTP server (default: `3300`)
- `mcpDynamics365.autoStart`: Automatically start the MCP server when VS Code starts (default: `false`)
- `mcpDynamics365.enableDevelopmentCommands`: Enable development commands (default: `false`, auto-detected in dev workspaces)
- `mcpDynamics365.serverPath`: Path to the MCP Dynamics 365 server executable for stdio transport (default: `npx @dav3/mcp-dynamics365-server`)
  > **⚠️ Deprecated**: Stdio transport is deprecated since version 2.0.0. Use HTTP transport instead.
- `mcpDynamics365.clientId`: Dynamics 365 Client ID (Azure AD App Registration)
- `mcpDynamics365.clientSecret`: Dynamics 365 Client Secret (Azure AD App Registration)
- `mcpDynamics365.tenantId`: Dynamics 365 Tenant ID (Azure AD Directory)
- `mcpDynamics365.baseUrl`: Dynamics 365 Base URL (e.g., `https://your-org.crm.dynamics.com`)
- `mcpDynamics365.resource`: Dynamics 365 Resource URL (usually same as Base URL)

### Available in AI Chat

Once the server is running, all Dynamics 365 tools are automatically available in VS Code's AI features:

#### Available Tools

- **`get_entity_schema`** - Get entity metadata and field definitions
- **`list_entities`** - List all available entity sets in Dynamics 365
- **`query_entities`** - Query entities with filtering, sorting, and selection
- **`get_entity`** - Get a specific entity record by ID
- **`create_entity`** - Create new entity records
- **`update_entity`** - Update existing entity records
- **`delete_entity`** - Delete entity records
- **`execute_odata_query`** - Execute custom OData queries directly
- **`execute_function`** - Call Dynamics 365 functions and actions

#### Example AI Requests

- **Query entities**: "Show me all contacts with email containing 'example.com'"
- **Create records**: "Create a new account for Contoso Ltd"
- **Update records**: "Update contact John Doe's phone number"
- **Entity schemas**: "What fields are available on the opportunity entity?"
- **Custom queries**: "Execute this OData query: contacts?$filter=statecode eq 0"

> **📋 For complete tool documentation**: See the [main project documentation](https://github.com/dave-palt/mcp-dynamics-365#available-tools) for detailed parameter descriptions, examples, and naming conventions.

## Configuration

Configure your Dynamics 365 connection using either method:

### Method 1: VS Code Settings (Recommended)

**Step 1: Configure Dynamics 365 Credentials**

Open VS Code settings and configure:

- `mcpDynamics365.clientId`: Your Azure AD App Client ID
- `mcpDynamics365.clientSecret`: Your Azure AD App Client Secret
- `mcpDynamics365.tenantId`: Your Azure AD Tenant ID
- `mcpDynamics365.baseUrl`: Your Dynamics 365 URL (e.g., `https://your-org.crm.dynamics.com`)
- `mcpDynamics365.resource`: Your Dynamics 365 Resource URL (usually same as baseUrl)

**Step 2: Server Registration (Automatic + Fallback)**

The extension automatically registers the HTTP server with VS Code's MCP system. However, if the automatic registration doesn't work (e.g., existing `mcp.json` takes precedence), you can manually configure:

**Option A: Create/update `mcp.json` in workspace root:**

```json
{
  "servers": {
    "dynamics365-crm": {
      "url": "http://localhost:3300/mcp"
    }
  }
}
```

**Option B: For remote servers or custom ports:**

```json
{
  "servers": {
    "dynamics365-crm": {
      "url": "http://your-server-ip:8080/mcp"
    }
  }
}
```

**Option C: VS Code settings.json (alternative to mcp.json):**

```json
{
  "mcp.servers": {
    "dynamics365-crm": {
      "url": "http://localhost:3300/mcp"
    }
  }
}
```

**Option D: Stdio transport (deprecated since v2.0.0):**

```json
{
  "servers": {
    "dynamics365-crm": {
      "command": "npx",
      "args": ["@dav3/mcp-dynamics365-server", "--transport=stdio"]
    }
  }
}
```

> **⚠️ Deprecated**: Stdio transport is deprecated since version 2.0.0. Use HTTP transport instead.

### Method 2: Environment File

**Step 1: Create Environment File**

Create a `.env` file in your workspace root:

```env
# Dynamics 365 Connection
D365_CLIENT_ID=your-client-id
D365_CLIENT_SECRET=your-client-secret
D365_TENANT_ID=your-tenant-id
D365_BASE_URL=https://your-org.crm.dynamics.com
D365_RESOURCE=https://your-org.crm.dynamics.com

# HTTP Transport Configuration (Optional)
MCP_HTTP_PORT=3300        # Default port for HTTP transport
MCP_HTTP_HOST=localhost   # Default host for HTTP transport
```

**Step 2: Server Registration (Automatic + Fallback)**

The extension automatically registers the HTTP server with VS Code's MCP system. If automatic registration doesn't work, manually add to your `mcp.json`:

```json
{
  "servers": {
    "dynamics365-crm": {
      "url": "http://localhost:3300/mcp"
    }
  }
}
```

## Authentication Setup

For details on configuring authentication (OAuth flows, environment variables, and supported providers), see the [main project README](../README.md#authentication-modes).

## When Manual Configuration is Needed

The extension automatically registers the HTTP server, but manual `mcp.json` configuration may be needed if:

- ✅ **Existing mcp.json file**: VS Code prioritizes existing configuration files
- ✅ **Custom server URL**: Using different IP address or port
- ✅ **Multiple workspaces**: Want consistent configuration across projects
- ✅ **Troubleshooting**: Automatic registration isn't working

## Advanced Configuration

For advanced users who need custom server URLs or manual configuration, see the [main npm package documentation](https://www.npmjs.com/package/@dav3/mcp-dynamics365-server) or the [GitHub repository](https://github.com/dave-palt/mcp-dynamics-365) for detailed setup instructions.

## Troubleshooting

### Server Won't Start

1. Check your credentials in VS Code settings or `.env` file
2. Verify your Azure AD app has proper Dynamics 365 permissions
3. Check the output channel for detailed error messages

### Connection Issues

1. Ensure the server URL is correct in settings
2. Check if firewall is blocking the port
3. Verify the server is running with "MCP Dynamics 365: Start HTTP Server"

### Extension Not Working

1. Make sure VS Code is updated to version 1.85.0 or later
2. Check if there's an existing `mcp.json` file that might override the extension
3. Try disabling and re-enabling the extension

## Support

This is a side project with limited maintenance. For issues:

1. Check the [GitHub Issues](https://github.com/dave-palt/mcp-dynamics-365/issues)
2. Review the [main package documentation](https://www.npmjs.com/package/@dav3/mcp-dynamics365-server)
3. Consider forking if you need ongoing support

## License

MIT License - see the [LICENSE](https://github.com/dave-palt/mcp-dynamics-365/blob/master/LICENSE) file for details.
