#!/usr/bin/env node

/**
 * Self-contained test script for MCP Streamable HTTP transport
 * Starts its own server instance and tests the HTTP transport using the official MCP SDK client
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { spawn } from "child_process";
import dotenv from "dotenv";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function testStreamableHttpTransport() {
  // Use environment variable or fallback to default port
  const port = process.env.MCP_HTTP_PORT
    ? parseInt(process.env.MCP_HTTP_PORT)
    : 3300;
  const host = process.env.MCP_HTTP_HOST || "localhost";
  const baseUrl = `http://${host}:${port}/mcp`;
  let serverProcess = null;

  console.log("🚀 Starting self-contained MCP HTTP Transport test...");

  try {
    // Start the server process
    console.log(`🔧 Starting server on ${host}:${port}...`);
    const serverScript = join(__dirname, "..", "..", "dist", "index.js");
    serverProcess = spawn(
      "node",
      [serverScript, "--transport=http", `--host=${host}`, `--port=${port}`],
      {
        stdio: ["ignore", "pipe", "pipe"],
      }
    );

    // Wait a moment for server to start
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Check if server started successfully
    if (serverProcess.exitCode !== null) {
      throw new Error("Server failed to start");
    }

    console.log("✅ Server started successfully");
    console.log(`🔌 Connecting to: ${baseUrl}`);

    // Create MCP client
    const client = new Client({
      name: "test-client",
      version: "1.0.0",
    });

    // Create Streamable HTTP transport
    const transport = new StreamableHTTPClientTransport(new URL(baseUrl));

    // Connect to the server
    await client.connect(transport);
    console.log("✅ Connected successfully!");

    // Test listing tools
    console.log("\n🔧 Testing tool listing...");
    const tools = await client.listTools();
    console.log(`✅ Found ${tools.tools?.length || 0} tools`);

    if (tools.tools && tools.tools.length > 0) {
      console.log("Available tools:");
      tools.tools.forEach((tool, index) => {
        console.log(`  ${index + 1}. ${tool.name} - ${tool.description}`);
      });
    }

    // Test calling a tool (list_entities - read-only and safe)
    console.log("\n📊 Testing list_entities tool...");
    const result = await client.callTool({
      name: "list_entities",
      arguments: {
        includeSystem: false,
      },
    });

    console.log("✅ List entities successful");
    if (result.content?.[0]?.text) {
      const content = result.content[0].text;
      console.log("Sample output:", content.substring(0, 200) + "...");
    }

    // Disconnect the client
    await client.close();
    console.log("✅ Client disconnected");

    console.log(
      "\n🎉 All tests passed! Streamable HTTP transport is working correctly."
    );
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    process.exit(1);
  } finally {
    // Clean up: Kill the server process
    if (serverProcess && serverProcess.exitCode === null) {
      console.log("🧹 Cleaning up server process...");
      serverProcess.kill("SIGTERM");

      // Wait a moment for graceful shutdown
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Force kill if still running
      if (serverProcess.exitCode === null) {
        serverProcess.kill("SIGKILL");
      }
      console.log("✅ Server process cleaned up");
    }
  }
}

// Run the test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testStreamableHttpTransport();
}

export { testStreamableHttpTransport };
