# Dynamics 365 CRM MCP Server

A comprehensive Model Context Protocol (MCP) server for interacting with Microsoft Dynamics 365 CRM. This server provides AI agents with the ability to perform CRUD operations, query data, fetch schemas, and execute custom operations on Dynamics 365 entities.

> **⚠️ Disclaimer**: This project was generated with the assistance of AI as a side project. While functional, it may not receive regular maintenance or updates. Use at your own discretion and consider forking if you need ongoing support.

## Features

- **Generic Entity Operations**: Query, create, update, and delete any Dynamics 365 entity
- **Schema Discovery**: Fetch entity metadata and available entity sets
- **Flexible Querying**: Support for OData query parameters (select, filter, orderby, top, skip, expand)
- **Custom OData Queries**: Execute direct OData queries for complex scenarios
- **Function Execution**: Call Dynamics 365 functions and actions
- **Authentication**: Secure OAuth 2.0 client credentials flow
- **Error Handling**: Comprehensive error handling and logging

## Prerequisites

- Node.js 18+
- pnpm (recommended package manager)
- Dynamics 365 CRM instance
- Azure AD app registration with appropriate permissions

## Azure AD App Registration

1. Go to Azure Portal > Azure Active Directory > App registrations
2. Create a new registration or use existing one
3. Note down:
   - Application (client) ID
   - Directory (tenant) ID
4. Create a client secret and note it down
5. Grant the following API permissions:
   - Dynamics CRM > user_impersonation
   - Or create custom permissions based on your needs

## Installation

1. Install dependencies:

```bash
pnpm install
```

2. Copy the environment template:

```bash
cp .env.example .env
```

3. Configure your environment variables in `.env`:

```env
D365_BASE_URL=https://your-org.crm.dynamics.com
D365_CLIENT_ID=your-client-id
D365_CLIENT_SECRET=your-client-secret
D365_TENANT_ID=your-tenant-id
D365_RESOURCE=https://your-org.crm.dynamics.com
```

## Usage

### Development

```bash
pnpm dev
```

### Production

```bash
pnpm build
pnpm start
```

## MCP Integration

### Prerequisites

1. **Install the MCP server globally**: `npm install -g @dav3/mcp-dynamics365-server`

### Option 1: Manual Configuration (Recommended)

The standard approach is to add the server to your MCP client configuration:

1. **Add to your MCP client configuration** (see examples below)

### Option 2: VS Code Extension (Alternative)

If you prefer not to manage JSON configuration files, there's a VS Code extension available:

1. **Install the VS Code extension**: `dav3.mcp-dynamics365-extension`
2. **Configure credentials**: Use the "Configure MCP Dynamics 365 Server" command

**Note**: The extension approach only works if you don't have an existing MCP configuration file, as configuration files take precedence over extension-registered servers.

## Configuration Examples

#### For VS Code

Add to your `mcp.json` or `settings.json`:

**mcp.json** (personally tested)

```json
{
  "servers": {
    "dynamics365-crm": {
      "command": "npx",
      "args": ["@dav3/mcp-dynamics365-server"],
      "env": {
        "D365_CLIENT_ID": "your_client_id",
        "D365_CLIENT_SECRET": "your_client_secret",
        "D365_TENANT_ID": "your_tenant_id",
        "D365_BASE_URL": "https://your-org.crm.dynamics.com",
        "D365_RESOURCE": "https://your-org.crm.dynamics.com"
      }
    }
  },
  "inputs": []
}
```

**settings.json** (untested)

````json
{
  "mcp.servers": {
    "dynamics365": {
      "command": "npx",
      "args": ["@dav3/mcp-dynamics365-server"],
      "env": {
        "D365_CLIENT_ID": "your_client_id",
        "D365_CLIENT_SECRET": "your_client_secret",
        "D365_TENANT_ID": "your_tenant_id",
        "D365_BASE_URL": "https://your-org.crm.dynamics.com",
        "D365_RESOURCE": "https://your-org.crm.dynamics.com"
      }
    }
  }
}
```#### For Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "dynamics365-crm": {
      "command": "npx",
      "args": ["@dav3/mcp-dynamics365-server"],
      "env": {
        "D365_BASE_URL": "https://your-org.crm.dynamics.com",
        "D365_CLIENT_ID": "your-client-id",
        "D365_CLIENT_SECRET": "your-client-secret",
        "D365_TENANT_ID": "your-tenant-id",
        "D365_RESOURCE": "https://your-org.crm.dynamics.com"
      }
    }
  }
}
````

**Note:** Environment variables must be explicitly specified in the MCP configuration. The server does not automatically load `.env` files when run via MCP clients.

## Available Tools

> **📋 Naming Convention**:
>
> - **Metadata operations** (`get_entity_schema`, `get_attribute_schema`): Use **singular** entity logical names (e.g., `"contact"`, `"account"`)
> - **Data operations** (`query_entities`, `get_entity`, `create_entity`, etc.): Use **plural** entity set names (e.g., `"contacts"`, `"accounts"`)

### 1. `get_entity_schema`

Get the schema/metadata for a specific Dynamics 365 entity.

**Parameters:**

- `entityName` (string): The entity logical name in singular form (e.g., "contact", "account")

**Example:**

```json
{
  "entityName": "contact"
}
```

### 2. `list_entities`

List all available entity sets in Dynamics 365.

**Parameters:**

- `includeSystem` (boolean, optional): Whether to include system entities

**Example:**

```json
{
  "includeSystem": false
}
```

### 3. `query_entities`

Query entities with flexible filtering, sorting, and selection options.

**Parameters:**

- `entitySet` (string): The entity set name
- `select` (array, optional): Fields to select
- `filter` (string, optional): OData filter expression
- `orderby` (string, optional): OData orderby expression
- `top` (number, optional): Maximum number of records
- `skip` (number, optional): Number of records to skip
- `expand` (string, optional): Related entities to expand

**Example:**

```json
{
  "entitySet": "contacts",
  "select": ["firstname", "lastname", "emailaddress1"],
  "filter": "firstname eq 'John'",
  "orderby": "createdon desc",
  "top": 10
}
```

### 4. `get_entity`

Get a specific entity record by ID.

**Parameters:**

- `entitySet` (string): The entity set name
- `id` (string): The entity ID (GUID)
- `select` (array, optional): Specific fields to retrieve

**Example:**

```json
{
  "entitySet": "contacts",
  "id": "12345678-1234-1234-1234-123456789abc",
  "select": ["firstname", "lastname"]
}
```

### 5. `create_entity`

Create a new entity record.

**Parameters:**

- `entitySet` (string): The entity set name
- `data` (object): The entity data to create

**Example:**

```json
{
  "entitySet": "contacts",
  "data": {
    "firstname": "John",
    "lastname": "Doe",
    "emailaddress1": "john.doe@example.com"
  }
}
```

### 6. `update_entity`

Update an existing entity record.

**Parameters:**

- `entitySet` (string): The entity set name
- `id` (string): The entity ID (GUID)
- `data` (object): The entity data to update

**Example:**

```json
{
  "entitySet": "contacts",
  "id": "12345678-1234-1234-1234-123456789abc",
  "data": {
    "emailaddress1": "john.doe.updated@example.com"
  }
}
```

### 7. `delete_entity`

Delete an entity record.

**Parameters:**

- `entitySet` (string): The entity set name
- `id` (string): The entity ID (GUID)

**Example:**

```json
{
  "entitySet": "contacts",
  "id": "12345678-1234-1234-1234-123456789abc"
}
```

### 8. `execute_odata_query`

Execute a custom OData query directly.

**Parameters:**

- `query` (string): The OData query string

**Example:**

```json
{
  "query": "contacts?$filter=firstname eq 'John' and lastname eq 'Doe'&$select=contactid,fullname"
}
```

### 9. `execute_function`

Execute a Dynamics 365 function or action.

**Parameters:**

- `functionName` (string): The function or action name
- `parameters` (object, optional): Function parameters
- `method` (string, optional): HTTP method (GET, POST, PATCH, DELETE)

**Example:**

```json
{
  "functionName": "WhoAmI",
  "method": "GET"
}
```

## Common Entity Sets

- `accounts` - Account records
- `contacts` - Contact records
- `leads` - Lead records
- `opportunities` - Opportunity records
- `cases` - Case records
- `tasks` - Task records
- `appointments` - Appointment records
- `emails` - Email records
- `phonecalls` - Phone call records

## OData Query Examples

### Basic Filtering

```
contacts?$filter=firstname eq 'John'
```

### Multiple Conditions

```
contacts?$filter=firstname eq 'John' and lastname eq 'Doe'
```

### Selecting Specific Fields

```
contacts?$select=firstname,lastname,emailaddress1
```

### Ordering Results

```
contacts?$orderby=createdon desc
```

### Limiting Results

```
contacts?$top=10&$skip=20
```

### Expanding Related Records

```
contacts?$expand=parentcustomerid
```

## Error Handling

The server provides comprehensive error handling:

- Authentication errors are logged and returned with appropriate messages
- API errors include status codes and detailed error descriptions
- Validation errors for missing required parameters
- Network and timeout errors are handled gracefully

## Security Considerations

- Store sensitive credentials in environment variables
- Use least-privilege principle for Azure AD app permissions
- Implement IP restrictions if needed
- Monitor and log access patterns
- Rotate client secrets regularly

## Contributing

For detailed development guidelines and conventions, see [`copilot-instructions.md`](.github/copilot-instructions.md).

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

### Development Setup

```bash
# Install dependencies
pnpm install

# Build the project
pnpm run build

# Run tests
pnpm run test:read-tools

# Type checking
pnpm run typecheck
```

## License

MIT License

## Support

For issues and questions:

1. Check the troubleshooting section below
2. Review Dynamics 365 Web API documentation
3. Create an issue in the repository

## Troubleshooting

### Authentication Issues

- Verify client ID, secret, and tenant ID
- Check Azure AD app permissions
- Ensure the app has been granted admin consent
- Verify the resource URL matches your Dynamics 365 instance

### Connection Issues

- Check the base URL format
- Verify network connectivity
- Check firewall and proxy settings
- Validate SSL certificates

### Query Issues

- Review OData syntax
- Check entity and field names (case sensitive)
- Verify entity permissions

## Contributing & Support

This project was generated with AI assistance as a side project. While contributions are welcome, please note:

- **Limited Maintenance**: This project may not receive regular updates or active maintenance
- **Community Driven**: The community is encouraged to fork and maintain their own versions
- **Best Effort Support**: Issues will be addressed on a best-effort basis when time permits
- **Pull Requests**: Well-documented PRs are welcome, but review times may vary

If you need reliable, maintained software for production use, consider:

- Forking this repository and maintaining your own version
- Contributing to make this project more robust
- Looking for alternative commercial solutions

## AI Generation Notice

This project was created with the assistance of AI tools. While the code has been reviewed and tested, users should:

- Thoroughly test in their own environments
- Review code for security implications
- Understand the functionality before production use

## License

MIT License - see [LICENSE](LICENSE) file for details.
