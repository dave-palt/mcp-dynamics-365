#!/usr/bin/env node

/**
 * Test script for MCP Streamable HTTP transport
 * Uses the official MCP SDK client to test the HTTP transport
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

async function testStreamableHttpTransport() {
  const port = 3300;
  const baseUrl = `http://localhost:${port}/mcp`;

  console.log("Testing MCP Streamable HTTP Transport...");
  console.log(`Connecting to: ${baseUrl}`);

  try {
    // Create MCP client
    const client = new Client({
      name: "test-client",
      version: "1.0.0",
    });

    // Create Streamable HTTP transport
    const transport = new StreamableHTTPClientTransport(new URL(baseUrl));

    // Connect to the server
    console.log("🔌 Connecting to server...");
    await client.connect(transport);
    console.log("✅ Connected successfully!");

    // Test listing tools
    console.log("\n🔧 Testing tool listing...");
    const tools = await client.listTools();
    console.log(`✅ Found ${tools.tools.length} tools`);

    if (tools.tools.length > 0) {
      console.log("Available tools:");
      tools.tools.forEach((tool, index) => {
        console.log(`  ${index + 1}. ${tool.name} - ${tool.description}`);
      });
    }

    // Test a simple tool call (list_entities)
    console.log("\n📊 Testing list_entities tool...");
    const result = await client.callTool({
      name: "list_entities",
      arguments: {
        includeSystem: false,
      },
    });

    console.log("✅ List entities successful");
    if (result.content && result.content.length > 0) {
      const content = result.content[0];
      if (content.type === "text") {
        console.log("Sample output:", content.text.substring(0, 200) + "...");
      }
    }

    console.log(
      "\n🎉 All tests passed! Streamable HTTP transport is working correctly."
    );

    // Clean up
    await transport.close();
  } catch (error) {
    console.error("❌ Test failed:", error.message);

    if (error.message.includes("ECONNREFUSED")) {
      console.log("\n💡 Make sure the server is running with HTTP transport:");
      console.log("   pnpm run build && node dist/index.js --transport=http");
    }

    process.exit(1);
  }
}

// Run the test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testStreamableHttpTransport();
}

export { testStreamableHttpTransport };
