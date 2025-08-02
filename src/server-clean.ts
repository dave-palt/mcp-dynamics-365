import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
    CallToolRequestSchema,
    CallToolResult,
    ListToolsRequestSchema,
    ListToolsResult,
    Tool,
} from "@modelcontextprotocol/sdk/types.js";
import dotenv from "dotenv";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { D365ApiClient } from "./api-client.js";
import { allTools, handleToolCall } from "./tools/index.js";
import { startHttpTransport, startStdioTransport } from "./transports/index.js";
import { D365Config } from "./types.js";

// Load environment variables
dotenv.config();

// Get package version
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJson = JSON.parse(readFileSync(join(__dirname, "../package.json"), "utf8"));
const packageVersion = packageJson.version;

export class D365MCPServer {
    private server: Server;
    private apiClient: D365ApiClient;

    constructor() {
        // Validate required environment variables
        this.validateConfig();

        const config: D365Config = {
            baseUrl: process.env.D365_BASE_URL!,
            clientId: process.env.D365_CLIENT_ID!,
            clientSecret: process.env.D365_CLIENT_SECRET!,
            tenantId: process.env.D365_TENANT_ID!,
            resource: process.env.D365_RESOURCE!,
        };

        this.apiClient = new D365ApiClient(config);

        this.server = new Server(
            {
                name: "dynamics365-crm-server",
                version: packageVersion,
            },
            {
                capabilities: {
                    tools: {},
                },
            }
        );

        this.setupToolHandlers();
    }

    private validateConfig(): void {
        const required = [
            "D365_BASE_URL",
            "D365_CLIENT_ID",
            "D365_CLIENT_SECRET",
            "D365_TENANT_ID",
            "D365_RESOURCE",
        ];

        const missing = required.filter((key) => !process.env[key]);
        if (missing.length > 0) {
            throw new Error(
                `Missing required environment variables: ${missing.join(", ")}`
            );
        }
    }

    private setupToolHandlers(): void {
        // List available tools
        this.server.setRequestHandler(
            ListToolsRequestSchema,
            async (): Promise<ListToolsResult> => {
                return {
                    tools: this.getAvailableTools(),
                };
            }
        );

        // Handle tool calls
        this.server.setRequestHandler(
            CallToolRequestSchema,
            async (request): Promise<CallToolResult> => {
                const { name, arguments: args } = request.params;
                return await handleToolCall(name, args, this.apiClient);
            }
        );
    }

    private getAvailableTools(): Tool[] {
        return allTools;
    }

    async run(transport: 'stdio' | 'http' = 'stdio', port: number = 3300, host: string = 'localhost'): Promise<void> {
        console.error(`Starting Dynamics 365 MCP Server v${packageVersion}`);

        if (transport === 'http') {
            await startHttpTransport(this.server, port, host);
        } else {
            await startStdioTransport(this.server);
        }
    }
}
