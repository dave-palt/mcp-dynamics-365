export interface D365Config {
  baseUrl: string;
  clientId: string;
  clientSecret: string;
  tenantId: string;
  resource: string;
}

export interface D365AuthToken {
  access_token: string;
  token_type: string;
  expires_in: number;
  expires_at: number;
}

export interface D365EntityMetadata {
  EntityType: string;
  EntitySetName: string;
  PrimaryKey: string;
  DisplayName: string;
  Description?: string;
  Attributes: D365AttributeMetadata[];
}

export interface D365AttributeMetadata {
  LogicalName: string;
  DisplayName: string;
  AttributeType: string;
  IsPrimaryKey: boolean;
  IsRequired: boolean;
  MaxLength?: number;
  Description?: string;
}

export interface D365PicklistOption {
  Value: number;
  Label: string;
  Description?: string;
  Color?: string;
}

export interface D365DetailedAttributeMetadata extends D365AttributeMetadata {
  SchemaName?: string;
  EntityLogicalName?: string;
  IsValidForAdvancedFind?: boolean;
  IsValidForCreate?: boolean;
  IsValidForRead?: boolean;
  IsValidForUpdate?: boolean;
  CanBeSecuredForCreate?: boolean;
  CanBeSecuredForRead?: boolean;
  CanBeSecuredForUpdate?: boolean;
  IsSecured?: boolean;
  MaxLength?: number;
  MinValue?: number;
  MaxValue?: number;
  Precision?: number;
  Options?: D365PicklistOption[];
  DefaultFormValue?: number;
  Targets?: string[];
  Format?: string;
  DateTimeBehavior?: string;
  ImeMode?: string;
}

export interface D365QueryOptions {
  select?: string[];
  filter?: string;
  orderby?: string;
  top?: number;
  skip?: number;
  expand?: string;
}

export interface D365QueryResult {
  "@odata.context": string;
  "@odata.count"?: number;
  "@odata.nextLink"?: string;
  value: any[];
}

export interface D365CreateRequest {
  entity: string;
  data: Record<string, any>;
}

export interface D365UpdateRequest {
  entity: string;
  id: string;
  data: Record<string, any>;
}

export interface D365DeleteRequest {
  entity: string;
  id: string;
}

export interface ToolResult {
  content: Array<{
    type: "text" | "image" | "resource";
    text?: string;
    data?: string;
    mimeType?: string;
  }>;
  isError?: boolean;
}

export type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE" | "PUT";

export interface D365ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode?: number;
}
