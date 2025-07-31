# Example Usage

Here are some example interactions an AI agent could have with this MCP server:

## Query Examples

### List all available entities

```json
{
  "tool": "list_entities",
  "arguments": {
    "includeSystem": false
  }
}
```

### List functions, actions, and other metadata

```json
{
  "tool": "list_functions_and_metadata",
  "arguments": {
    "includeDetails": false
  }
}
```

### Get contact schema

```json
{
  "tool": "get_entity_schema",
  "arguments": {
    "entityName": "contacts"
  }
}
```

### Find contacts by name

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

### Get specific contact

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

### Create new contact

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

### Update contact

```json
{
  "tool": "update_entity",
  "arguments": {
    "entitySet": "contacts",
    "id": "12345678-1234-1234-1234-123456789abc",
    "data": {
      "emailaddress1": "jane.smith.updated@example.com",
      "telephone1": "+1-555-987-6543"
    }
  }
}
```

### Complex query with related data

```json
{
  "tool": "execute_odata_query",
  "arguments": {
    "query": "contacts?$select=firstname,lastname,emailaddress1&$expand=parentcustomerid($select=name)&$filter=statecode eq 0&$orderby=createdon desc&$top=20"
  }
}
```

### Execute a Dynamics 365 function

```json
{
  "tool": "execute_function",
  "arguments": {
    "functionName": "WhoAmI",
    "method": "GET"
  }
}
```

## AI Agent Conversations

### Example 1: Finding customer information

**User**: "Find all contacts from Acme Corporation"

**AI Agent**: I'll search for contacts from Acme Corporation. Let me query the contacts and accounts.

```json
{
  "tool": "query_entities",
  "arguments": {
    "entitySet": "contacts",
    "select": [
      "contactid",
      "firstname",
      "lastname",
      "emailaddress1",
      "telephone1"
    ],
    "expand": "parentcustomerid($select=name)",
    "filter": "parentcustomerid/name eq 'Acme Corporation'"
  }
}
```

### Example 2: Creating and updating records

**User**: "Create a new contact for John Doe at john.doe@newcompany.com, then update his phone number to 555-1234"

**AI Agent**: I'll create the contact first, then update the phone number.

Step 1 - Create contact:

```json
{
  "tool": "create_entity",
  "arguments": {
    "entitySet": "contacts",
    "data": {
      "firstname": "John",
      "lastname": "Doe",
      "emailaddress1": "john.doe@newcompany.com"
    }
  }
}
```

Step 2 - Update with phone number:

```json
{
  "tool": "update_entity",
  "arguments": {
    "entitySet": "contacts",
    "id": "[returned contact ID]",
    "data": {
      "telephone1": "555-1234"
    }
  }
}
```

### Example 3: Data analysis

**User**: "Show me all opportunities created this month with their values"

**AI Agent**: I'll query the opportunities created this month with their estimated values.

```json
{
  "tool": "query_entities",
  "arguments": {
    "entitySet": "opportunities",
    "select": ["name", "estimatedvalue", "createdon", "statecode"],
    "filter": "createdon ge 2025-07-01T00:00:00Z",
    "orderby": "estimatedvalue desc"
  }
}
```

## Common OData Filters

### Date filters

- `createdon ge 2025-01-01T00:00:00Z` - Created after Jan 1, 2025
- `modifiedon le 2025-07-31T23:59:59Z` - Modified before July 31, 2025

### String filters

- `firstname eq 'John'` - Exact match
- `contains(lastname, 'Smith')` - Contains text
- `startswith(emailaddress1, 'john')` - Starts with text

### Number filters

- `estimatedvalue gt 10000` - Greater than 10,000
- `statecode eq 0` - Active records (statecode = 0)

### Combining filters

- `firstname eq 'John' and lastname eq 'Doe'` - AND condition
- `statecode eq 0 or statecode eq 1` - OR condition
