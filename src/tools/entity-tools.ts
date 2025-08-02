import { CallToolResult, Tool } from "@modelcontextprotocol/sdk/types.js";
import { D365ApiClient } from "../api-client.js";

export const entityTools: Tool[] = [
    {
        name: "query_entities",
        description: "Query entities from Dynamics 365 with optional filtering, sorting, and pagination",
        inputSchema: {
            type: "object",
            properties: {
                entitySet: {
                    type: "string",
                    description: 'Entity set name (plural form, e.g., "contacts", "accounts", "opportunities") - NOT the entity logical name',
                },
                select: {
                    type: "string",
                    description: 'Comma-separated list of fields to retrieve (e.g., "firstname,lastname,emailaddress1")',
                },
                filter: {
                    type: "string",
                    description: 'OData filter expression (e.g., "statecode eq 0 and firstname eq \'John\'")',
                },
                orderby: {
                    type: "string",
                    description: 'Order by clause (e.g., "createdon desc" or "lastname asc,firstname asc")',
                },
                top: {
                    type: "number",
                    description: "Maximum number of records to return (default: 10, max: 5000)",
                },
            },
            required: ["entitySet"],
        },
    },
    {
        name: "get_entity",
        description: "Get a specific entity record by ID from Dynamics 365",
        inputSchema: {
            type: "object",
            properties: {
                entitySet: {
                    type: "string",
                    description: 'Entity set name (plural form, e.g., "contacts", "accounts", "opportunities")',
                },
                entityId: {
                    type: "string",
                    description: "The unique identifier (GUID) of the entity record",
                },
                select: {
                    type: "string",
                    description: 'Comma-separated list of fields to retrieve (e.g., "firstname,lastname,emailaddress1")',
                },
            },
            required: ["entitySet", "entityId"],
        },
    },
    {
        name: "create_entity",
        description: "Create a new entity record in Dynamics 365",
        inputSchema: {
            type: "object",
            properties: {
                entitySet: {
                    type: "string",
                    description: 'Entity set name (plural form, e.g., "contacts", "accounts", "opportunities")',
                },
                data: {
                    type: "object",
                    description: "The data for the new entity record as key-value pairs",
                },
            },
            required: ["entitySet", "data"],
        },
    },
    {
        name: "update_entity",
        description: "Update an existing entity record in Dynamics 365",
        inputSchema: {
            type: "object",
            properties: {
                entitySet: {
                    type: "string",
                    description: 'Entity set name (plural form, e.g., "contacts", "accounts", "opportunities")',
                },
                entityId: {
                    type: "string",
                    description: "The unique identifier (GUID) of the entity record to update",
                },
                data: {
                    type: "object",
                    description: "The data to update as key-value pairs",
                },
            },
            required: ["entitySet", "entityId", "data"],
        },
    },
    {
        name: "delete_entity",
        description: "Delete an entity record from Dynamics 365",
        inputSchema: {
            type: "object",
            properties: {
                entitySet: {
                    type: "string",
                    description: 'Entity set name (plural form, e.g., "contacts", "accounts", "opportunities")',
                },
                entityId: {
                    type: "string",
                    description: "The unique identifier (GUID) of the entity record to delete",
                },
            },
            required: ["entitySet", "entityId"],
        },
    },
];

export async function handleEntityTools(
    name: string,
    args: any,
    apiClient: D365ApiClient
): Promise<CallToolResult> {
    switch (name) {
        case "query_entities":
            return await handleQueryEntities(args, apiClient);
        case "get_entity":
            return await handleGetEntity(args, apiClient);
        case "create_entity":
            return await handleCreateEntity(args, apiClient);
        case "update_entity":
            return await handleUpdateEntity(args, apiClient);
        case "delete_entity":
            return await handleDeleteEntity(args, apiClient);
        default:
            throw new Error(`Unknown entity tool: ${name}`);
    }
}

async function handleQueryEntities(args: any, apiClient: D365ApiClient): Promise<CallToolResult> {
    const { entitySet, select, filter, orderby, top } = args;
    const result = await apiClient.queryEntities(entitySet, {
        select,
        filter,
        orderby,
        top,
    });

    if (!result.success) {
        return {
            content: [
                {
                    type: "text",
                    text: `Error querying entities: ${result.error}`,
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

async function handleGetEntity(args: any, apiClient: D365ApiClient): Promise<CallToolResult> {
    const { entitySet, entityId, select } = args;
    const result = await apiClient.getEntity(entitySet, entityId, select);

    if (!result.success) {
        return {
            content: [
                {
                    type: "text",
                    text: `Error getting entity: ${result.error}`,
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

async function handleCreateEntity(args: any, apiClient: D365ApiClient): Promise<CallToolResult> {
    const { entitySet, data } = args;
    const result = await apiClient.createEntity(entitySet, data);

    if (!result.success) {
        return {
            content: [
                {
                    type: "text",
                    text: `Error creating entity: ${result.error}`,
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

async function handleUpdateEntity(args: any, apiClient: D365ApiClient): Promise<CallToolResult> {
    const { entitySet, entityId, data } = args;
    const result = await apiClient.updateEntity(entitySet, entityId, data);

    if (!result.success) {
        return {
            content: [
                {
                    type: "text",
                    text: `Error updating entity: ${result.error}`,
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

async function handleDeleteEntity(args: any, apiClient: D365ApiClient): Promise<CallToolResult> {
    const { entitySet, entityId } = args;
    const result = await apiClient.deleteEntity(entitySet, entityId);

    if (!result.success) {
        return {
            content: [
                {
                    type: "text",
                    text: `Error deleting entity: ${result.error}`,
                },
            ],
        };
    }

    return {
        content: [
            {
                type: "text",
                text: "Entity deleted successfully",
            },
        ],
    };
}
