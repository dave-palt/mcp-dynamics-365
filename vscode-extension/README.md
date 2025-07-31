# MCP Dynamics 365 VS Code Extension

VS Code extension for managing the MCP Dynamics 365 server.

> **⚠️ Disclaimer**: This extension was generated with AI assistance as a side project. It may not receive regular maintenance or updates. Use at your own discretion.

## Features

- Start/Stop/Restart MCP Dynamics 365 server
- Configure server settings
- View server output in dedicated output channel
- Auto-start server option

## Installation

1. Install the extension from the VS Code marketplace
2. Install the MCP server: `npm install -g @dav3/mcp-dynamics365-server`
3. Configure your Dynamics 365 credentials using the "Configure MCP Dynamics 365 Server" command

## Commands

- `MCP: Start MCP Dynamics 365 Server` - Start the server
- `MCP: Stop MCP Dynamics 365 Server` - Stop the server
- `MCP: Restart MCP Dynamics 365 Server` - Restart the server
- `MCP: Configure MCP Dynamics 365 Server` - Open configuration file

## Configuration

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
