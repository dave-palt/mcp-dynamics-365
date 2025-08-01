#!/usr/bin/env node
import { D365MCPServer } from "./server.js";

async function main() {
  try {
    // Parse command line arguments
    const args = process.argv.slice(2);
    let transport: 'stdio' | 'http' = 'stdio';
    let port = 3300;
    let host = 'localhost';

    // Check for transport argument
    const transportFlag = args.find(arg => arg.startsWith('--transport='));
    if (transportFlag) {
      const transportValue = transportFlag.split('=')[1];
      if (transportValue === 'http' || transportValue === 'stdio') {
        transport = transportValue;
      } else {
        console.error('Invalid transport. Use --transport=stdio or --transport=http');
        process.exit(1);
      }
    }

    // Check for port argument (only used with HTTP transport)
    const portFlag = args.find(arg => arg.startsWith('--port='));
    if (portFlag) {
      const portValue = parseInt(portFlag.split('=')[1]);
      if (isNaN(portValue) || portValue < 1 || portValue > 65535) {
        console.error('Invalid port. Use --port=<number> where number is 1-65535');
        process.exit(1);
      }
      port = portValue;
    }

    // Check for host argument (only used with HTTP transport)
    const hostFlag = args.find(arg => arg.startsWith('--host='));
    if (hostFlag) {
      host = hostFlag.split('=')[1];
      if (!host || host.trim() === '') {
        console.error('Invalid host. Use --host=<ip-address> (e.g., --host=0.0.0.0)');
        process.exit(1);
      }
    }

    // Show help
    if (args.includes('--help') || args.includes('-h')) {
      console.log(`
Dynamics 365 MCP Server

Usage: 
  d365-mcp-server [OPTIONS]

Options:
  --transport=<stdio|http>  Transport type (default: stdio)
  --port=<number>          Port for HTTP transport (default: 3300)
  --host=<ip-address>      Host/IP to bind HTTP server (default: localhost)
  --help, -h               Show this help message

Examples:
  d365-mcp-server                           # Start with stdio transport
  d365-mcp-server --transport=http          # Start with HTTP transport on localhost:3300
  d365-mcp-server --transport=http --port=8080  # Start with HTTP transport on localhost:8080
  d365-mcp-server --transport=http --host=0.0.0.0  # Start on all interfaces (remote access)
  d365-mcp-server --transport=http --host=0.0.0.0 --port=8080  # Remote access on port 8080

Environment Variables Required:
  D365_BASE_URL     - Dynamics 365 base URL (e.g., https://org.crm.dynamics.com)
  D365_CLIENT_ID    - Azure AD application client ID
  D365_CLIENT_SECRET - Azure AD application client secret
  D365_TENANT_ID    - Azure AD tenant ID
  D365_RESOURCE     - Dynamics 365 resource URL (usually same as base URL)
      `);
      process.exit(0);
    }

    console.log("Starting Dynamics 365 MCP Server...");
    const server = new D365MCPServer();
    await server.run(transport, port, host);

    if (transport === 'stdio') {
      console.log("Dynamics 365 MCP Server is running on stdio transport");
    } else {
      console.log(`Dynamics 365 MCP Server is running on HTTP transport at http://${host}:${port}`);
    }
  } catch (error: any) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Unhandled error:", error);
  process.exit(1);
});
