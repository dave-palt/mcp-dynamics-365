import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import {
  CallToolRequestSchema,
  CallToolResult,
  ListToolsRequestSchema,
  ListToolsResult,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import cors from "cors";
import dotenv from "dotenv";
import express, { Request, Response } from "express";
import { readFileSync } from "fs";
import { randomUUID } from "node:crypto";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { D365ApiClient } from "./api-client.js";
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

        try {
          switch (name) {
            case "get_entity_schema":
              return await this.getEntitySchema(args);

            case "get_attribute_schema":
              return await this.getAttributeSchema(args);

            case "list_entities":
              return await this.listEntities(args);

            case "query_entities":
              return await this.queryEntities(args);

            case "get_entity":
              return await this.getEntity(args);

            case "create_entity":
              return await this.createEntity(args);

            case "update_entity":
              return await this.updateEntity(args);

            case "delete_entity":
              return await this.deleteEntity(args);

            case "execute_odata_query":
              return await this.executeODataQuery(args);

            case "execute_function":
              return await this.executeFunction(args);

            default:
              throw new Error(`Unknown tool: ${name}`);
          }
        } catch (error: any) {
          return {
            content: [
              {
                type: "text" as const,
                text: `Error executing ${name}: ${error.message}`,
              },
            ],
            isError: true,
          };
        }
      }
    );
  }

  private getAvailableTools(): Tool[] {
    // NAMING CONVENTION GUIDE:
    // 📋 Metadata operations (get_entity_schema, get_attribute_schema): 
    //    Use entityName parameter with SINGULAR entity logical names (e.g., "contact", "account", "opportunity")
    // 📊 Data operations (query_entities, get_entity, create_entity, etc.): 
    //    Use entitySet parameter with PLURAL entity set names (e.g., "contacts", "accounts", "opportunities")
    // 🔍 OData queries: Use PLURAL entity set names in the query URL path

    return [
      {
        name: "get_entity_schema",
        description:
          "Get the schema/metadata for a specific Dynamics 365 entity",
        inputSchema: {
          type: "object",
          properties: {
            entityName: {
              type: "string",
              description:
                'The entity logical name (singular form, e.g., "contact", "account", "opportunity") - NOT the entity set name',
            },
            includeAttributes: {
              type: "boolean",
              description:
                "Whether to include detailed attribute information (default: true)",
              default: true,
            },
          },
          required: ["entityName"],
        },
      },
      {
        name: "get_attribute_schema",
        description:
          "Get detailed schema/metadata for a specific attribute of a Dynamics 365 entity, including options for picklists",
        inputSchema: {
          type: "object",
          properties: {
            entityName: {
              type: "string",
              description:
                'The entity logical name (singular form, e.g., "contact", "account", "product") - NOT the entity set name',
            },
            attributeName: {
              type: "string",
              description:
                'The logical name of the attribute (e.g., "statecode", "statuscode", "firstname")',
            },
          },
          required: ["entityName", "attributeName"],
        },
      },
      {
        name: "list_entities",
        description: "List all available entity sets in Dynamics 365",
        inputSchema: {
          type: "object",
          properties: {
            includeSystem: {
              type: "boolean",
              description:
                "Whether to include system entities (default: false)",
              default: false,
            },
          },
        },
      },
      {
        name: "query_entities",
        description:
          "Query entities with flexible filtering, sorting, and selection options",
        inputSchema: {
          type: "object",
          properties: {
            entitySet: {
              type: "string",
              description: 'The entity set name (plural form for data operations, e.g., "contacts", "accounts", "opportunities")',
            },
            select: {
              type: "array",
              items: { type: "string" },
              description:
                'Fields to select (e.g., ["firstname", "lastname", "emailaddress1"])',
            },
            filter: {
              type: "string",
              description:
                "OData filter expression (e.g., \"firstname eq 'John'\")",
            },
            orderby: {
              type: "string",
              description: 'OData orderby expression (e.g., "createdon desc")',
            },
            top: {
              type: "number",
              description: "Maximum number of records to return",
            },
            skip: {
              type: "number",
              description: "Number of records to skip",
            },
            expand: {
              type: "string",
              description:
                'Related entities to expand (e.g., "parentcustomerid")',
            },
          },
          required: ["entitySet"],
        },
      },
      {
        name: "get_entity",
        description: "Get a specific entity record by ID",
        inputSchema: {
          type: "object",
          properties: {
            entitySet: {
              type: "string",
              description: "The entity set name (plural form for data operations, e.g., \"contacts\", \"accounts\")",
            },
            id: {
              type: "string",
              description: "The entity ID (GUID)",
            },
            select: {
              type: "array",
              items: { type: "string" },
              description: "Specific fields to retrieve",
            },
          },
          required: ["entitySet", "id"],
        },
      },
      {
        name: "create_entity",
        description: "Create a new entity record",
        inputSchema: {
          type: "object",
          properties: {
            entitySet: {
              type: "string",
              description: "The entity set name (plural form for data operations, e.g., \"contacts\", \"accounts\")",
            },
            data: {
              type: "object",
              description: "The entity data to create",
            },
          },
          required: ["entitySet", "data"],
        },
      },
      {
        name: "update_entity",
        description: "Update an existing entity record",
        inputSchema: {
          type: "object",
          properties: {
            entitySet: {
              type: "string",
              description: "The entity set name (plural form for data operations, e.g., \"contacts\", \"accounts\")",
            },
            id: {
              type: "string",
              description: "The entity ID (GUID)",
            },
            data: {
              type: "object",
              description: "The entity data to update",
            },
          },
          required: ["entitySet", "id", "data"],
        },
      },
      {
        name: "delete_entity",
        description: "Delete an entity record",
        inputSchema: {
          type: "object",
          properties: {
            entitySet: {
              type: "string",
              description: "The entity set name (plural form for data operations, e.g., \"contacts\", \"accounts\")",
            },
            id: {
              type: "string",
              description: "The entity ID (GUID)",
            },
          },
          required: ["entitySet", "id"],
        },
      },
      {
        name: "execute_odata_query",
        description: "Execute a custom OData query directly",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description:
                "The OData query string using entity set names (plural form, e.g., \"contacts?$filter=firstname eq 'John'\")",
            },
          },
          required: ["query"],
        },
      },
      {
        name: "execute_function",
        description: "Execute a Dynamics 365 function or action",
        inputSchema: {
          type: "object",
          properties: {
            functionName: {
              type: "string",
              description: "The function or action name",
            },
            parameters: {
              type: "object",
              description: "Function parameters",
            },
            method: {
              type: "string",
              enum: ["GET", "POST", "PATCH", "DELETE"],
              description: "HTTP method to use",
              default: "GET",
            },
          },
          required: ["functionName"],
        },
      },
    ];
  }

  // Tool implementation methods
  private async getEntitySchema(args: any): Promise<CallToolResult> {
    const { entityName, includeAttributes = true } = args;
    const result = await this.apiClient.getEntityMetadata(
      entityName,
      includeAttributes
    );

    if (result.success) {
      return {
        content: [
          {
            type: "text",
            text: `Schema for entity "${entityName}":\n\n${JSON.stringify(
              result.data,
              null,
              2
            )}`,
          },
        ],
      };
    } else {
      return {
        content: [
          {
            type: "text",
            text: `Failed to get schema for entity "${entityName}": ${result.error}`,
          },
        ],
        isError: true,
      };
    }
  }

  private async getAttributeSchema(args: any): Promise<CallToolResult> {
    const { entityName, attributeName } = args;
    const result = await this.apiClient.getAttributeMetadata(
      entityName,
      attributeName
    );

    if (result.success && result.data) {
      const metadata = result.data;
      let output = `Detailed schema for attribute "${attributeName}" on entity "${entityName}":\n\n`;

      // Basic information
      output += `**Basic Information:**\n`;
      output += `- Logical Name: ${metadata.LogicalName}\n`;
      output += `- Display Name: ${metadata.DisplayName}\n`;
      output += `- Attribute Type: ${metadata.AttributeType}\n`;
      output += `- Is Primary Key: ${metadata.IsPrimaryKey}\n`;
      output += `- Is Required: ${metadata.IsRequired}\n`;
      if (metadata.Description) {
        output += `- Description: ${metadata.Description}\n`;
      }
      output += `\n`;

      // Validation and permissions
      output += `**Validation & Permissions:**\n`;
      output += `- Valid for Create: ${metadata.IsValidForCreate}\n`;
      output += `- Valid for Read: ${metadata.IsValidForRead}\n`;
      output += `- Valid for Update: ${metadata.IsValidForUpdate}\n`;
      output += `- Valid for Advanced Find: ${metadata.IsValidForAdvancedFind}\n`;
      output += `- Is Secured: ${metadata.IsSecured}\n`;
      output += `\n`;

      // Type-specific information
      if (metadata.AttributeType === "String" && metadata.MaxLength) {
        output += `**String Properties:**\n`;
        output += `- Max Length: ${metadata.MaxLength}\n`;
        if (metadata.Format) {
          output += `- Format: ${metadata.Format}\n`;
        }
        output += `\n`;
      }

      if (
        (metadata.AttributeType === "Integer" ||
          metadata.AttributeType === "Decimal" ||
          metadata.AttributeType === "Double") &&
        (metadata.MinValue !== undefined || metadata.MaxValue !== undefined)
      ) {
        output += `**Numeric Properties:**\n`;
        if (metadata.MinValue !== undefined) {
          output += `- Min Value: ${metadata.MinValue}\n`;
        }
        if (metadata.MaxValue !== undefined) {
          output += `- Max Value: ${metadata.MaxValue}\n`;
        }
        if (metadata.Precision !== undefined) {
          output += `- Precision: ${metadata.Precision}\n`;
        }
        output += `\n`;
      }

      if (metadata.AttributeType === "DateTime" && metadata.DateTimeBehavior) {
        output += `**DateTime Properties:**\n`;
        output += `- DateTime Behavior: ${metadata.DateTimeBehavior}\n`;
        if (metadata.Format) {
          output += `- Format: ${metadata.Format}\n`;
        }
        output += `\n`;
      }

      // Options for Picklist/State/Status attributes
      if (metadata.Options && metadata.Options.length > 0) {
        output += `**Available Options:**\n`;
        metadata.Options.forEach((option) => {
          output += `- ${option.Value}: ${option.Label}`;
          if (option.Description) {
            output += ` (${option.Description})`;
          }
          if (option.Color) {
            output += ` [Color: ${option.Color}]`;
          }
          output += `\n`;
        });
        if (metadata.DefaultFormValue !== undefined) {
          output += `- Default Value: ${metadata.DefaultFormValue}\n`;
        }
        output += `\n`;
      }

      // Target entities for Lookup attributes
      if (metadata.Targets && metadata.Targets.length > 0) {
        output += `**Target Entities (for Lookup):**\n`;
        metadata.Targets.forEach((target) => {
          output += `- ${target}\n`;
        });
        output += `\n`;
      }

      // Raw JSON for advanced users
      output += `**Raw Metadata (JSON):**\n\`\`\`json\n${JSON.stringify(
        metadata,
        null,
        2
      )}\n\`\`\``;

      return {
        content: [
          {
            type: "text",
            text: output,
          },
        ],
      };
    } else {
      return {
        content: [
          {
            type: "text",
            text: `Failed to get schema for attribute "${attributeName}" on entity "${entityName}": ${result.error}`,
          },
        ],
        isError: true,
      };
    }
  }

  private async listEntities(args: any): Promise<CallToolResult> {
    const result = await this.apiClient.getEntitySets();

    if (result.success) {
      const entities = result.data || [];
      const filteredEntities = args.includeSystem
        ? entities
        : entities.filter(
          (entity: string) =>
            !entity.startsWith("_") && !entity.includes("system")
        );

      return {
        content: [
          {
            type: "text",
            text: `Available entities (${filteredEntities.length
              }):\n\n${filteredEntities.join("\n")}`,
          },
        ],
      };
    } else {
      return {
        content: [
          {
            type: "text",
            text: `Failed to list entities: ${result.error}`,
          },
        ],
        isError: true,
      };
    }
  }

  private async queryEntities(args: any): Promise<CallToolResult> {
    const { entitySet, ...options } = args;
    const result = await this.apiClient.queryEntities(entitySet, options);

    if (result.success) {
      const data = result.data!;
      return {
        content: [
          {
            type: "text",
            text: `Query results for "${entitySet}":\n\nCount: ${data.value?.length || 0
              }\n\n${JSON.stringify(data, null, 2)}`,
          },
        ],
      };
    } else {
      return {
        content: [
          {
            type: "text",
            text: `Failed to query entities from "${entitySet}": ${result.error}`,
          },
        ],
        isError: true,
      };
    }
  }

  private async getEntity(args: any): Promise<CallToolResult> {
    const { entitySet, id, select } = args;
    const result = await this.apiClient.getEntity(entitySet, id, select);

    if (result.success) {
      return {
        content: [
          {
            type: "text",
            text: `Entity "${id}" from "${entitySet}":\n\n${JSON.stringify(
              result.data,
              null,
              2
            )}`,
          },
        ],
      };
    } else {
      return {
        content: [
          {
            type: "text",
            text: `Failed to get entity "${id}" from "${entitySet}": ${result.error}`,
          },
        ],
        isError: true,
      };
    }
  }

  private async createEntity(args: any): Promise<CallToolResult> {
    const { entitySet, data } = args;
    const result = await this.apiClient.createEntity(entitySet, data);

    if (result.success) {
      return {
        content: [
          {
            type: "text",
            text: `Successfully created entity in "${entitySet}":\n\n${JSON.stringify(
              result.data,
              null,
              2
            )}`,
          },
        ],
      };
    } else {
      return {
        content: [
          {
            type: "text",
            text: `Failed to create entity in "${entitySet}": ${result.error}`,
          },
        ],
        isError: true,
      };
    }
  }

  private async updateEntity(args: any): Promise<CallToolResult> {
    const { entitySet, id, data } = args;
    const result = await this.apiClient.updateEntity(entitySet, id, data);

    if (result.success) {
      return {
        content: [
          {
            type: "text",
            text: `Successfully updated entity "${id}" in "${entitySet}"\n\nUpdated data: ${JSON.stringify(
              data,
              null,
              2
            )}`,
          },
        ],
      };
    } else {
      return {
        content: [
          {
            type: "text",
            text: `Failed to update entity "${id}" in "${entitySet}": ${result.error}`,
          },
        ],
        isError: true,
      };
    }
  }

  private async deleteEntity(args: any): Promise<CallToolResult> {
    const { entitySet, id } = args;
    const result = await this.apiClient.deleteEntity(entitySet, id);

    if (result.success) {
      return {
        content: [
          {
            type: "text",
            text: `Successfully deleted entity "${id}" from "${entitySet}"`,
          },
        ],
      };
    } else {
      return {
        content: [
          {
            type: "text",
            text: `Failed to delete entity "${id}" from "${entitySet}": ${result.error}`,
          },
        ],
        isError: true,
      };
    }
  }

  private async executeODataQuery(args: any): Promise<CallToolResult> {
    const { query } = args;
    const result = await this.apiClient.executeCustomQuery(query);

    if (result.success) {
      return {
        content: [
          {
            type: "text",
            text: `OData query results:\n\n${JSON.stringify(
              result.data,
              null,
              2
            )}`,
          },
        ],
      };
    } else {
      return {
        content: [
          {
            type: "text",
            text: `Failed to execute OData query: ${result.error}`,
          },
        ],
        isError: true,
      };
    }
  }

  private async executeFunction(args: any): Promise<CallToolResult> {
    const { functionName, parameters = {}, method = "GET" } = args;
    const result = await this.apiClient.executeFunction(
      functionName,
      parameters,
      method
    );

    if (result.success) {
      return {
        content: [
          {
            type: "text",
            text: `Function "${functionName}" results:\n\n${JSON.stringify(
              result.data,
              null,
              2
            )}`,
          },
        ],
      };
    } else {
      return {
        content: [
          {
            type: "text",
            text: `Failed to execute function "${functionName}": ${result.error}`,
          },
        ],
        isError: true,
      };
    }
  }

  async run(transport: 'stdio' | 'http' = 'stdio', port: number = 3300, host: string = 'localhost'): Promise<void> {
    console.error(`Starting Dynamics 365 MCP Server v${packageVersion}`);

    if (transport === 'http') {
      console.error(`Starting HTTP server on ${host}:${port}...`); const app = express();

      // Enable CORS for browser compatibility
      app.use(cors({
        origin: '*',
        exposedHeaders: ['Mcp-Session-Id'],
        allowedHeaders: ['Content-Type', 'mcp-session-id'],
      }));

      app.use(express.json());

      // Map to store transports by session ID
      const transports: { [sessionId: string]: StreamableHTTPServerTransport } = {};

      // Handle POST requests for client-to-server communication
      app.post('/mcp', async (req: Request, res: Response) => {
        try {
          // Check for existing session ID
          const sessionId = req.headers['mcp-session-id'] as string | undefined;
          let transport: StreamableHTTPServerTransport;

          if (sessionId && transports[sessionId]) {
            // Reuse existing transport
            transport = transports[sessionId];
          } else if (!sessionId && req.body?.method === 'initialize') {
            // New initialization request
            const isLocalDevelopment = host === 'localhost' || host === '127.0.0.1';
            const isWildcardBinding = host === '0.0.0.0';

            transport = new StreamableHTTPServerTransport({
              sessionIdGenerator: () => randomUUID(),
              onsessioninitialized: (sessionId) => {
                // Store the transport by session ID
                transports[sessionId] = transport;
              },
              // Disable DNS rebinding protection for localhost and wildcard binding
              // Enable only for specific remote hosts
              enableDnsRebindingProtection: !isLocalDevelopment && !isWildcardBinding,
              allowedHosts: (!isLocalDevelopment && !isWildcardBinding) ? [host, `${host}:${port}`] : undefined,
            });

            // Clean up transport when closed
            transport.onclose = () => {
              if (transport.sessionId) {
                delete transports[transport.sessionId];
              }
            };

            // Connect the MCP server to this transport
            await this.server.connect(transport);
          } else {
            // Invalid request
            res.status(400).json({
              jsonrpc: '2.0',
              error: {
                code: -32000,
                message: 'Bad Request: No valid session ID provided',
              },
              id: null,
            });
            return;
          }

          // Handle the request
          await transport.handleRequest(req, res, req.body);
        } catch (error) {
          console.error('Error handling MCP request:', error);
          if (!res.headersSent) {
            res.status(500).json({
              jsonrpc: '2.0',
              error: {
                code: -32603,
                message: 'Internal server error',
              },
              id: null,
            });
          }
        }
      });

      // Handle GET requests for server-to-client notifications via SSE
      app.get('/mcp', async (req: Request, res: Response) => {
        const sessionId = req.headers['mcp-session-id'] as string | undefined;
        if (!sessionId || !transports[sessionId]) {
          res.status(400).send('Invalid or missing session ID');
          return;
        }

        const transport = transports[sessionId];
        await transport.handleRequest(req, res);
      });

      // Handle DELETE requests for session termination
      app.delete('/mcp', async (req: Request, res: Response) => {
        const sessionId = req.headers['mcp-session-id'] as string | undefined;
        if (!sessionId || !transports[sessionId]) {
          res.status(400).send('Invalid or missing session ID');
          return;
        }

        const transport = transports[sessionId];
        await transport.handleRequest(req, res);
      });

      // Start the HTTP server
      app.listen(port, host, () => {
        console.error(`HTTP server running on http://${host}:${port}`);
      });

    } else {
      console.error("Starting stdio transport...");
      const stdioTransport = new StdioServerTransport();
      await this.server.connect(stdioTransport);
      console.error("Stdio transport connected");
    }
  }
}
