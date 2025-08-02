import { CallToolResult, Tool } from "@modelcontextprotocol/sdk/types.js";
import { D365ApiClient } from "../api-client.js";

export const schemaTools: Tool[] = [
    {
        name: "get_entity_schema",
        description: "Get detailed schema information for a specific Dynamics 365 entity",
        inputSchema: {
            type: "object",
            properties: {
                entityName: {
                    type: "string",
                    description: "The logical name of the entity (singular, e.g., 'contact', 'account', 'opportunity')",
                },
            },
            required: ["entityName"],
        },
    },
    {
        name: "get_attribute_schema",
        description: "Get detailed schema/metadata for a specific attribute of a Dynamics 365 entity, including options for picklists",
        inputSchema: {
            type: "object",
            properties: {
                entityName: {
                    type: "string",
                    description: 'The entity logical name (singular form, e.g., "contact", "account", "product") - NOT the entity set name',
                },
                attributeName: {
                    type: "string",
                    description: 'The logical name of the attribute (e.g., "statecode", "statuscode", "firstname")',
                },
            },
            required: ["entityName", "attributeName"],
        },
    },
    {
        name: "list_entities",
        description: "List all available Dynamics 365 entities with their basic information",
        inputSchema: {
            type: "object",
            properties: {},
        },
    },
];

export async function handleSchemaTools(
    name: string,
    args: any,
    apiClient: D365ApiClient
): Promise<CallToolResult> {
    switch (name) {
        case "get_entity_schema":
            return await handleGetEntitySchema(args, apiClient);
        case "get_attribute_schema":
            return await handleGetAttributeSchema(args, apiClient);
        case "list_entities":
            return await handleListEntities(args, apiClient);
        default:
            throw new Error(`Unknown schema tool: ${name}`);
    }
}

async function handleGetEntitySchema(args: any, apiClient: D365ApiClient): Promise<CallToolResult> {
    const { entityName } = args;
    const result = await apiClient.getEntityMetadata(entityName);

    if (!result.success) {
        return {
            content: [
                {
                    type: "text",
                    text: `Error getting entity schema: ${result.error}`,
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

async function handleGetAttributeSchema(args: any, apiClient: D365ApiClient): Promise<CallToolResult> {
    const { entityName, attributeName } = args;
    const result = await apiClient.getAttributeMetadata(entityName, attributeName);

    if (!result.success) {
        return {
            content: [
                {
                    type: "text",
                    text: `Error getting attribute schema: ${result.error}`,
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

async function handleListEntities(args: any, apiClient: D365ApiClient): Promise<CallToolResult> {
    const result = await apiClient.getEntitySets();

    if (!result.success) {
        return {
            content: [
                {
                    type: "text",
                    text: `Error listing entities: ${result.error}`,
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
