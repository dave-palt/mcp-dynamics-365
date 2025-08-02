import { CallToolResult, Tool } from "@modelcontextprotocol/sdk/types.js";
import { D365ApiClient } from "../api-client.js";
import { entityTools, handleEntityTools } from "./entity-tools.js";
import { handleQueryTools, queryTools } from "./query-tools.js";
import { handleSchemaTools, schemaTools } from "./schema-tools.js";

// Export all tools
export const allTools: Tool[] = [
    ...schemaTools,
    ...entityTools,
    ...queryTools,
];

// Main tool handler
export async function handleToolCall(
    name: string,
    args: any,
    apiClient: D365ApiClient
): Promise<CallToolResult> {
    // Schema tools
    if (schemaTools.some(tool => tool.name === name)) {
        return await handleSchemaTools(name, args, apiClient);
    }

    // Entity tools
    if (entityTools.some(tool => tool.name === name)) {
        return await handleEntityTools(name, args, apiClient);
    }

    // Query tools
    if (queryTools.some(tool => tool.name === name)) {
        return await handleQueryTools(name, args, apiClient);
    }

    throw new Error(`Unknown tool: ${name}`);
}

// Export individual tool arrays for convenience
export { entityTools, queryTools, schemaTools };
