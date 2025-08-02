import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { startHttpTransport } from "./http-transport.js";
import { startStdioTransport } from "./stdio-transport.js";

export async function startTransport(
    server: Server,
    transport: 'stdio' | 'http' = 'stdio',
    port: number = 3300,
    host: string = 'localhost'
): Promise<void> {
    if (transport === 'http') {
        await startHttpTransport(server, port, host);
    } else {
        await startStdioTransport(server);
    }
}

export { startHttpTransport, startStdioTransport };
