import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

export async function startStdioTransport(server: Server): Promise<void> {
    console.error("Starting stdio transport...");
    const stdioTransport = new StdioServerTransport();
    await server.connect(stdioTransport);
    console.error("Stdio transport connected");
}
