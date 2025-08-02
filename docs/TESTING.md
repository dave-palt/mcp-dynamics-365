# Testing Notes

## Read Tools Test Suite

The `tests/integration/test-read-tools.js` file (not committed to git) provides comprehensive testing for all read-only tools in the MCP server.

### Setup

1. Ensure your `.env` file is configured with valid Dynamics 365 credentials
2. Build the project: `pnpm run build`
3. Run the test suite: `pnpm run test:read-tools`

### What it tests

The test suite covers all non-destructive operations:

- ✅ `list_entities` (with and without system entities)
- ✅ `get_entity_schema` (with and without attributes)
- ✅ `get_attribute_schema`
- ✅ `list_functions_and_metadata` (basic and detailed)
- ✅ `query_entities` (basic and with filters)
- ✅ `execute_odata_query`
- ✅ `execute_function` (WhoAmI function)

### Creating the test file

If the test file doesn't exist, create it manually:

```bash
# Copy the template from the commit history or recreate based on the server's read methods
# The file should test all server methods that don't modify data
```

### Notes

- The test file is excluded from git commits via `.gitignore`
- Tests use small result sets (`$top=3-5`) to avoid overwhelming output
- All tests are read-only and safe to run against production environments
- Failed tests will show detailed error messages for debugging
