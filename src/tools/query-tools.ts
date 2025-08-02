import { CallToolResult, Tool } from "@modelcontextprotocol/sdk/types.js";
import { D365ApiClient } from "../api-client.js";

export const queryTools: Tool[] = [
    {
        name: "execute_odata_query",
        description: "Execute a custom OData query against Dynamics 365 Web API",
        inputSchema: {
            type: "object",
            properties: {
                query: {
                    type: "string",
                    description: 'Raw OData query (e.g., "contacts?$filter=statecode eq 0&$select=firstname,lastname")',
                },
            },
            required: ["query"],
        },
    },
    {
        name: "execute_function",
        description: "Execute a custom Dynamics 365 function or action",
        inputSchema: {
            type: "object",
            properties: {
                functionName: {
                    type: "string",
                    description: "The name of the function or action to execute",
                },
                parameters: {
                    type: "object",
                    description: "Parameters to pass to the function (optional)",
                },
            },
            required: ["functionName"],
        },
    },
];

export async function handleQueryTools(
    name: string,
    args: any,
    apiClient: D365ApiClient
): Promise<CallToolResult> {
    switch (name) {
        case "execute_odata_query":
            return await handleExecuteODataQuery(args, apiClient);
        case "execute_function":
            return await handleExecuteFunction(args, apiClient);
        default:
            throw new Error(`Unknown query tool: ${name}`);
    }
}

async function handleExecuteODataQuery(args: any, apiClient: D365ApiClient): Promise<CallToolResult> {
    const { query } = args;
    const result = await apiClient.executeCustomQuery(query);

    if (!result.success) {
        return {
            content: [
                {
                    type: "text",
                    text: `Error executing OData query: ${result.error}`,
                },
            ],
        };
    }

    return {
        content: [
            {
                type: "text",
                text: JSON.stringify(result.data, null, 2),
            },
        ],
    };
}

async function handleExecuteFunction(args: any, apiClient: D365ApiClient): Promise<CallToolResult> {
    const { functionName, parameters } = args;

    // For now, we'll use the custom query method to execute functions
    // In a more advanced implementation, this could be a separate method
    let query = functionName;
    if (parameters && Object.keys(parameters).length > 0) {
        const params = new URLSearchParams();
        for (const [key, value] of Object.entries(parameters)) {
            params.append(key, String(value));
        }
        query += `?${params.toString()}`;
    }

    const result = await apiClient.executeCustomQuery(query);

    if (!result.success) {
        return {
            content: [
                {
                    type: "text",
                    text: `Error executing function: ${result.error}`,
                },
            ],
        };
    }

    return {
        content: [
            {
                type: "text",
                text: JSON.stringify(result.data, null, 2),
            },
        ],
    };
}
