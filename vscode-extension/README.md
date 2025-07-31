# MCP Dynamics 365 VS Code Extension

VS Code extension for managing the MCP Dynamics 365 server.

> **⚠️ Disclaimer**: This extension was generated with AI assistance as a side project. It may not receive regular maintenance or updates. Use at your own discretion.

## Features

- Start/Stop/Restart MCP Dynamics 365 server
- Configure server settings
- View server output in dedicated output channel
- Auto-start server option

## Installation & Setup

### Prerequisites

1. **Install the MCP server globally**: `npm install -g @dav3/mcp-dynamics365-server`

### Method 1: Automatic Setup

1. **Install the extension** from the VS Code marketplace
2. **Configure credentials**: Use "Configure MCP Dynamics 365 Server" command
3. **Server automatically available**: The MCP server will be automatically registered with VS Code's AI features when credentials are configured

### Method 2: Manual Configuration (Without extension)

If the automatic registration doesn't work, you can manually add the server to VS Code's MCP configuration:

1. **Open VS Code Settings** (JSON format)
2. **Add to your `mcp.json` or `settings.json`**:

`mcp.json` (personally tested)

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

`settings.json` (untested)

```json
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
```

The server will be automatically available in VS Code's AI features once the extension is installed and your credentials are configured.

## Usage

### Via Extension Commands

- `MCP: Start MCP Dynamics 365 Server` - Start the server for testing
- `MCP: Stop MCP Dynamics 365 Server` - Stop the server
- `MCP: Restart MCP Dynamics 365 Server` - Restart the server
- `MCP: Configure MCP Dynamics 365 Server` - Open configuration file

### Via AI Chat

Once configured, the Dynamics 365 tools will be available in VS Code's AI chat features (Copilot, etc.) for:

- Querying entities (contacts, accounts, products, etc.)
- Creating and updating records
- Fetching entity schemas
- Custom OData queries

## Available Tools & Examples

### 1. Entity Schema & Discovery

#### `list_entities` - List all available entities

Ask: "What entities are available in my Dynamics 365?"

```json
{
  "tool": "list_entities",
  "arguments": {
    "includeSystem": false
  }
}
```

#### `get_entity_schema` - Get entity metadata

Ask: "What fields are available for contacts?"

```json
{
  "tool": "get_entity_schema",
  "arguments": {
    "entityName": "contacts"
  }
}
```

### 2. Data Querying

#### `query_entities` - Search and filter entities

Ask: "Find all contacts named John"

```json
{
  "tool": "query_entities",
  "arguments": {
    "entitySet": "contacts",
    "select": ["contactid", "firstname", "lastname", "emailaddress1"],
    "filter": "firstname eq 'John'",
    "top": 10
  }
}
```

#### `get_entity` - Get specific record by ID

Ask: "Get details for contact with ID 12345678-1234-1234-1234-123456789abc"

```json
{
  "tool": "get_entity",
  "arguments": {
    "entitySet": "contacts",
    "id": "12345678-1234-1234-1234-123456789abc",
    "select": ["firstname", "lastname", "emailaddress1", "telephone1"]
  }
}
```

### 3. Data Modification

#### `create_entity` - Create new records

Ask: "Create a new contact for Jane Smith with email jane.smith@example.com"

```json
{
  "tool": "create_entity",
  "arguments": {
    "entitySet": "contacts",
    "data": {
      "firstname": "Jane",
      "lastname": "Smith",
      "emailaddress1": "jane.smith@example.com",
      "telephone1": "+1-555-123-4567"
    }
  }
}
```

#### `update_entity` - Update existing records

Ask: "Update the email address for contact ID 12345..."

```json
{
  "tool": "update_entity",
  "arguments": {
    "entitySet": "contacts",
    "id": "12345678-1234-1234-1234-123456789abc",
    "data": {
      "emailaddress1": "jane.smith.updated@example.com"
    }
  }
}
```

#### `delete_entity` - Delete records

Ask: "Delete contact with ID 12345..."

```json
{
  "tool": "delete_entity",
  "arguments": {
    "entitySet": "contacts",
    "id": "12345678-1234-1234-1234-123456789abc"
  }
}
```

### 4. Advanced Operations

#### `execute_odata_query` - Complex custom queries

Ask: "Show me all opportunities created this month with their values"

```json
{
  "tool": "execute_odata_query",
  "arguments": {
    "query": "opportunities?$select=name,estimatedvalue,createdon&$filter=createdon ge 2025-07-01T00:00:00Z&$orderby=estimatedvalue desc"
  }
}
```

#### `execute_function` - Call Dynamics 365 functions

Ask: "Who am I in the system?"

```json
{
  "tool": "execute_function",
  "arguments": {
    "functionName": "WhoAmI",
    "method": "GET"
  }
}
```

### 4. Advanced Operations

#### `execute_odata_query` - Custom OData queries

Ask: "Execute a custom query to find active opportunities over $10,000"

```json
{
  "tool": "execute_odata_query",
  "arguments": {
    "query": "opportunities?$filter=statecode eq 0 and estimatedvalue gt 10000&$select=name,estimatedvalue,createdon&$orderby=estimatedvalue desc"
  }
}
```

#### `execute_function` - Call Dynamics 365 functions

Ask: "Who am I currently logged in as?"

```json
{
  "tool": "execute_function",
  "arguments": {
    "functionName": "WhoAmI",
    "method": "GET"
  }
}
```

### Common Entity Sets

- `accounts` - Companies and organizations
- `contacts` - Individual people
- `leads` - Potential customers
- `opportunities` - Sales opportunities
- `cases` - Customer service cases
- `tasks` - Task records
- `appointments` - Calendar appointments
- `emails` - Email messages
- `phonecalls` - Phone call records

### Useful OData Filters

- **Date filters**: `createdon ge 2025-01-01T00:00:00Z`
- **String filters**: `contains(lastname, 'Smith')`, `startswith(emailaddress1, 'john')`
- **Number filters**: `estimatedvalue gt 10000`
- **Status filters**: `statecode eq 0` (active records)
- **Combine filters**: `firstname eq 'John' and statecode eq 0`

### Example AI Conversations

**"Find all contacts from Acme Corporation"**

- Uses `query_entities` with expand and filter on parent customer

**"Create a contact and then update their phone number"**

- Uses `create_entity` followed by `update_entity`

**"What fields are available for opportunities?"**

- Uses `get_entity_schema` to show all opportunity fields

**"Show me recent high-value opportunities"**

- Uses `execute_odata_query` with date and value filters## Configuration

The extension can be configured through VS Code settings:

- `mcpDynamics365.serverPath`: Path to the MCP server executable (default: `npx @dav3/mcp-dynamics365-server`)
- `mcpDynamics365.autoStart`: Automatically start server when VS Code starts (default: false)

## Support & Maintenance

This extension was created with AI assistance as a side project. Please note:

- Limited maintenance and support
- Community contributions welcome
- Fork recommended for production use

## License

MIT
