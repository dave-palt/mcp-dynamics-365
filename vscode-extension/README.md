# MCP Dynamics 365 VS Code Extension

VS Code extension for managing the MCP Dynamics 365 server.

> **⚠️ Disclaimer**: This extension was generated with AI assistance as a side project. It may not receive regular maintenance or updates. Use at your own discretion.

## Features

- Start/Stop/Restart MCP Dynamics 365 server
- Configure server settings
- View server output in dedicated output channel
- Auto-start server option

## Installation & Setup

### Prerequisites

1. **Install the MCP server globally**: `npm install -g @dav3/mcp-dynamics365-server`

### Method 1: Automatic Setup

1. **Install the extension** from the VS Code marketplace
2. **Configure credentials**: Use "Configure MCP Dynamics 365 Server" command
3. **Server automatically available**: The MCP server will be automatically registered with VS Code's AI features when credentials are configured

### Method 2: Manual Configuration (Without extension)

If the automatic registration doesn't work, you can manually add the server to VS Code's MCP configuration:

1. **Open VS Code Settings** (JSON format)
2. **Add to your `mcp.json` or `settings.json`**:

`mcp.json` (personally tested)

```json
{
  "servers": {
    "dynamics365-crm": {
      "command": "npx",
      "args": ["@dav3/mcp-dynamics365-server"],
      "env": {
        "D365_CLIENT_ID": "your_client_id",
        "D365_CLIENT_SECRET": "your_client_secret",
        "D365_TENANT_ID": "your_tenant_id",
        "D365_BASE_URL": "https://your-org.crm.dynamics.com",
        "D365_RESOURCE": "https://your-org.crm.dynamics.com"
      }
    }
  },
  "inputs": []
}
```

`settings.json` (untested)

```json
{
  "mcp.servers": {
    "dynamics365": {
      "command": "npx",
      "args": ["@dav3/mcp-dynamics365-server"],
      "env": {
        "D365_CLIENT_ID": "your_client_id",
        "D365_CLIENT_SECRET": "your_client_secret",
        "D365_TENANT_ID": "your_tenant_id",
        "D365_BASE_URL": "https://your-org.crm.dynamics.com",
        "D365_RESOURCE": "https://your-org.crm.dynamics.com"
      }
    }
  }
}
```

The server will be automatically available in VS Code's AI features once the extension is installed and your credentials are configured.

## Usage

### Via Extension Commands

- `MCP: Start MCP Dynamics 365 Server` - Start the server for testing
- `MCP: Stop MCP Dynamics 365 Server` - Stop the server
- `MCP: Restart MCP Dynamics 365 Server` - Restart the server
- `MCP: Configure MCP Dynamics 365 Server` - Open configuration file

### Via AI Chat

Once configured, the Dynamics 365 tools will be available in VS Code's AI chat features (Copilot, etc.) for:

- Querying entities (contacts, accounts, products, etc.)
- Creating and updating records
- Fetching entity schemas
- Custom OData queries## Configuration

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
