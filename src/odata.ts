const IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]*$/;
const GUID = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

/** Validate a logical name / entity set name before putting it in a URL path. */
export function assertIdentifier(value: string, label: string): string {
  if (typeof value !== "string" || !IDENTIFIER.test(value)) {
    throw new Error(`Invalid ${label}: '${value}'`);
  }
  return value;
}

/** Validate a record id (GUID) before putting it in a URL path. */
export function assertGuid(value: string, label = "id"): string {
  if (typeof value !== "string" || !GUID.test(value)) {
    throw new Error(`Invalid ${label}: '${value}'`);
  }
  return value;
}

/** Escape a value for use inside an OData single-quoted string literal in a URL. */
export function odataStringLiteral(value: string): string {
  return encodeURIComponent(String(value).replace(/'/g, "''"));
}
