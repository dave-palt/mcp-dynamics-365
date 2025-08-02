# MCP Dynamics 365 VS Code Extension

VS Code extension for seamless integration with Microsoft Dynamics 365 CRM via the Model Context Protocol.

> **📖 Main Project Documentation**: For complete API documentation, tool examples, and manual setup instructions, see the [main project README](../README.md).

> **⚠️ Disclaimer**: This extension was generated with AI assistance as a side project. It may not receive regular maintenance or updates. Use at your own discretion.

## Table of Contents

- [Features](#features)
- [Quick Start](#quick-start)
- [Usage](#usage)
- [Configuration](#configuration)
- [When Manual Configuration is Needed](#when-manual-configuration-is-needed)
- [Advanced Configuration](#advanced-configuration)
- [Troubleshooting](#troubleshooting)
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
2. **Configure your Dynamics 365 credentials** (see Configuration section below)
3. **Start the HTTP server**: Use "MCP Dynamics 365: Start HTTP Server" command
4. **Server automatically available**: The extension automatically registers the HTTP server with VS Code's AI features
5. **Fallback (if needed)**: If automatic registration doesn't work, manually add to your `mcp.json`:
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

- `mcpDynamics365.useHttpTransport`: Use HTTP transport (default: `true`)
- `mcpDynamics365.serverUrl`: Server URL for remote connections (default: `"http://localhost:3300/mcp"`)
- `mcpDynamics365.autoStart`: Auto-start server on VS Code startup (default: `false`)
- `mcpDynamics365.enableDevelopmentCommands`: Enable development commands (default: `false`, auto-detected in dev workspaces)

### Available in AI Chat

Once the server is running, all Dynamics 365 tools are automatically available in VS Code's AI features:

- **Query entities**: "Show me all contacts with email containing 'example.com'"
- **Create records**: "Create a new account for Contoso Ltd"
- **Update records**: "Update contact John Doe's phone number"
- **Entity schemas**: "What fields are available on the opportunity entity?"
- **Custom queries**: "Execute this OData query: contacts?$filter=statecode eq 0"

For complete tool documentation and examples, see the [main project documentation](../README.md#available-tools) and [NPM package](https://www.npmjs.com/package/@dav3/mcp-dynamics365-server).

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

### Method 2: Environment File

**Step 1: Create Environment File**

Create a `.env` file in your workspace root:

```env
D365_CLIENT_ID=your-client-id
D365_CLIENT_SECRET=your-client-secret
D365_TENANT_ID=your-tenant-id
D365_BASE_URL=https://your-org.crm.dynamics.com
D365_RESOURCE=https://your-org.crm.dynamics.com
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

MIT License - see the [LICENSE](../LICENSE) file for details.

#### `execute_function` - Call Dynamics 365 functions

Ask: "Who am I in the system?"

```json
{
  "tool": "execute_function",
  "arguments": {
    "functionName": "WhoAmI",
    "method": "GET"
  }
}
```

### 4. Advanced Operations

#### `execute_odata_query` - Custom OData queries

Ask: "Execute a custom query to find active opportunities over $10,000"

```json
{
  "tool": "execute_odata_query",
  "arguments": {
    "query": "opportunities?$filter=statecode eq 0 and estimatedvalue gt 10000&$select=name,estimatedvalue,createdon&$orderby=estimatedvalue desc"
  }
}
```

#### `execute_function` - Call Dynamics 365 functions

Ask: "Who am I currently logged in as?"

```json
{
  "tool": "execute_function",
  "arguments": {
    "functionName": "WhoAmI",
    "method": "GET"
  }
}
```

### Common Entity Sets

- `accounts` - Companies and organizations
- `contacts` - Individual people
- `leads` - Potential customers
- `opportunities` - Sales opportunities
- `cases` - Customer service cases
- `tasks` - Task records
- `appointments` - Calendar appointments
- `emails` - Email messages
- `phonecalls` - Phone call records

### Useful OData Filters

- **Date filters**: `createdon ge 2025-01-01T00:00:00Z`
- **String filters**: `contains(lastname, 'Smith')`, `startswith(emailaddress1, 'john')`
- **Number filters**: `estimatedvalue gt 10000`
- **Status filters**: `statecode eq 0` (active records)
- **Combine filters**: `firstname eq 'John' and statecode eq 0`

### Example AI Conversations

**"Find all contacts from Acme Corporation"**

- Uses `query_entities` with expand and filter on parent customer

**"Create a contact and then update their phone number"**

- Uses `create_entity` followed by `update_entity`

**"What fields are available for opportunities?"**

- Uses `get_entity_schema` to show all opportunity fields

**"Show me recent high-value opportunities"**

- Uses `execute_odata_query` with date and value filters## Configuration

The extension can be configured through VS Code settings:

- `mcpDynamics365.serverPath`: Path to the MCP server executable (default: `npx @dav3/mcp-dynamics365-server`)
- `mcpDynamics365.autoStart`: Automatically start server when VS Code starts (default: false)

## Support & Maintenance

This extension was created with AI assistance as a side project. Please note:

- Limited maintenance and support
- Community contributions welcome
- Fork recommended for production use

## License

MIT
