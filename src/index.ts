#!/usr/bin/env node
import { D365MCPServer } from "./server.js";

async function main() {
  try {
    console.log("Starting Dynamics 365 MCP Server...");
    const server = new D365MCPServer();
    await server.run();
    console.log("Dynamics 365 MCP Server is running");
  } catch (error: any) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Unhandled error:", error);
  process.exit(1);
});
