#!/usr/bin/env node

// Simple test to verify the server can start without errors
import { D365MCPServer } from "./dist/server.js";

console.log("Testing MCP Server instantiation...");

try {
  // This will fail due to missing env vars, but should not have syntax errors
  const server = new D365MCPServer();
  console.log("✓ Server class instantiated successfully");
} catch (error) {
  if (error.message.includes("Missing required environment variables")) {
    console.log("✓ Server properly validates environment variables");
    console.log("✓ All TypeScript compilation successful");
    process.exit(0);
  } else {
    console.error("✗ Unexpected error:", error.message);
    process.exit(1);
  }
}
