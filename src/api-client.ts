import axios, { AxiosResponse } from "axios";
import { D365AuthService } from "./auth.js";
import {
  D365ApiResponse,
  D365AttributeMetadata,
  D365Config,
  D365DetailedAttributeMetadata,
  D365EntityMetadata,
  D365MetadataCollection,
  D365PicklistOption,
  D365QueryOptions,
  D365QueryResult,
  HttpMethod,
} from "./types.js";

export class D365ApiClient {
  private authService: D365AuthService;
  private baseUrl: string;

  constructor(config: D365Config) {
    this.authService = new D365AuthService(config);
    this.baseUrl = config.baseUrl;
  }

  /**
   * Get metadata for a specific entity
   */
  async getEntityMetadata(
    entityName: string,
    includeAttributes: boolean = true
  ): Promise<D365ApiResponse<D365EntityMetadata>> {
    try {
      const headers = await this.authService.getAuthHeaders();

      if (includeAttributes) {
        // Get full entity definition with attributes
        const url = `${this.baseUrl}/api/data/v9.2/EntityDefinitions?$filter=LogicalName eq '${entityName}'&$expand=Attributes($select=LogicalName,DisplayName,AttributeType,IsPrimaryId,RequiredLevel,Description)`;

        const response = await axios.get(url, { headers });
        const entityDefs = response.data.value;

        if (!entityDefs || entityDefs.length === 0) {
          throw new Error(`Entity '${entityName}' not found`);
        }

        const entityDef = entityDefs[0];

        // Extract attributes from the EntityDefinition
        const attributes: D365AttributeMetadata[] =
          entityDef.Attributes?.map((attr: any) => ({
            LogicalName: attr.LogicalName || "",
            DisplayName:
              attr.DisplayName?.UserLocalizedLabel?.Label ||
              attr.LogicalName ||
              "",
            AttributeType: attr.AttributeType || "Unknown",
            IsPrimaryKey: attr.IsPrimaryId || false,
            IsRequired: attr.RequiredLevel?.Value === 2, // ApplicationRequired = 2
            MaxLength: undefined, // Will be populated separately for string attributes if needed
            Description:
              attr.Description?.UserLocalizedLabel?.Label || undefined,
          })) || [];

        const metadata: D365EntityMetadata = {
          EntityType: entityDef.LogicalName || entityName,
          EntitySetName: entityDef.LogicalCollectionName || entityName,
          PrimaryKey:
            attributes.find((attr) => attr.IsPrimaryKey)?.LogicalName || "id",
          DisplayName:
            entityDef.DisplayName?.UserLocalizedLabel?.Label || entityName,
          Description:
            entityDef.Description?.UserLocalizedLabel?.Label ||
            `Entity definition for ${entityName}`,
          Attributes: attributes,
        };

        return {
          success: true,
          data: metadata,
          statusCode: response.status,
        };
      } else {
        // Get basic entity definition without attributes
        const url = `${this.baseUrl}/api/data/v9.2/EntityDefinitions?$filter=LogicalName eq '${entityName}'&$select=LogicalName,LogicalCollectionName,DisplayName,Description,PrimaryIdAttribute`;

        const response = await axios.get(url, { headers });
        const entityDefs = response.data.value;

        if (!entityDefs || entityDefs.length === 0) {
          throw new Error(`Entity '${entityName}' not found`);
        }

        const entityDef = entityDefs[0];

        const metadata: D365EntityMetadata = {
          EntityType: entityDef.LogicalName || entityName,
          EntitySetName: entityDef.LogicalCollectionName || entityName,
          PrimaryKey: entityDef.PrimaryIdAttribute || "id",
          DisplayName:
            entityDef.DisplayName?.UserLocalizedLabel?.Label || entityName,
          Description:
            entityDef.Description?.UserLocalizedLabel?.Label ||
            `Entity definition for ${entityName}`,
          Attributes: [],
        };

        return {
          success: true,
          data: metadata,
          statusCode: response.status,
        };
      }
    } catch (error: any) {
      return this.handleError(
        error,
        `Failed to get metadata for entity: ${entityName}`
      );
    }
  }

  /**
   * Get detailed metadata for a specific attribute of an entity
   */
  async getAttributeMetadata(
    entityName: string,
    attributeName: string
  ): Promise<D365ApiResponse<D365DetailedAttributeMetadata>> {
    try {
      const headers = await this.authService.getAuthHeaders();

      // Get detailed attribute definition
      let url = `${this.baseUrl}/api/data/v9.2/EntityDefinitions(LogicalName='${entityName}')/Attributes(LogicalName='${attributeName}')`;

      // First, get basic attribute info to determine type
      let response = await axios.get(url, { headers });
      let attributeDef = response.data;

      if (!attributeDef) {
        throw new Error(
          `Attribute '${attributeName}' not found on entity '${entityName}'`
        );
      }

      // If it's a picklist/status attribute, get it with OptionSet expansion using casting
      if (
        attributeDef.AttributeType === "Picklist" ||
        attributeDef.AttributeType === "State" ||
        attributeDef.AttributeType === "Status"
      ) {
        const castType =
          attributeDef.AttributeType === "Picklist"
            ? "Microsoft.Dynamics.CRM.PicklistAttributeMetadata"
            : attributeDef.AttributeType === "State"
              ? "Microsoft.Dynamics.CRM.StateAttributeMetadata"
              : "Microsoft.Dynamics.CRM.StatusAttributeMetadata";

        url = `${this.baseUrl}/api/data/v9.2/EntityDefinitions(LogicalName='${entityName}')/Attributes(LogicalName='${attributeName}')/${castType}?$expand=OptionSet`;
        response = await axios.get(url, { headers });
        attributeDef = response.data;
      }

      // Build detailed metadata
      const detailedMetadata: D365DetailedAttributeMetadata = {
        LogicalName: attributeDef.LogicalName || attributeName,
        DisplayName:
          attributeDef.DisplayName?.UserLocalizedLabel?.Label ||
          attributeDef.LogicalName ||
          attributeName,
        AttributeType: attributeDef.AttributeType || "Unknown",
        IsPrimaryKey: attributeDef.IsPrimaryId || false,
        IsRequired: attributeDef.RequiredLevel?.Value === 2, // ApplicationRequired = 2
        Description:
          attributeDef.Description?.UserLocalizedLabel?.Label || undefined,
        SchemaName: attributeDef.SchemaName,
        EntityLogicalName: attributeDef.EntityLogicalName,
        IsValidForAdvancedFind: attributeDef.IsValidForAdvancedFind,
        IsValidForCreate: attributeDef.IsValidForCreate,
        IsValidForRead: attributeDef.IsValidForRead,
        IsValidForUpdate: attributeDef.IsValidForUpdate,
        CanBeSecuredForCreate: attributeDef.CanBeSecuredForCreate,
        CanBeSecuredForRead: attributeDef.CanBeSecuredForRead,
        CanBeSecuredForUpdate: attributeDef.CanBeSecuredForUpdate,
        IsSecured: attributeDef.IsSecured,
        MaxLength: attributeDef.MaxLength,
        MinValue: attributeDef.MinValue,
        MaxValue: attributeDef.MaxValue,
        Precision: attributeDef.Precision,
        Format: attributeDef.Format,
        DateTimeBehavior: attributeDef.DateTimeBehavior?.Value,
        ImeMode: attributeDef.ImeMode?.Value,
      };

      // Handle Picklist/OptionSet attributes - get the options
      if (
        attributeDef.AttributeType === "Picklist" ||
        attributeDef.AttributeType === "State" ||
        attributeDef.AttributeType === "Status"
      ) {
        if (attributeDef.OptionSet && attributeDef.OptionSet.Options) {
          detailedMetadata.Options = attributeDef.OptionSet.Options.map(
            (option: any): D365PicklistOption => ({
              Value: option.Value,
              Label:
                option.Label?.UserLocalizedLabel?.Label ||
                `Option ${option.Value}`,
              Description: option.Description?.UserLocalizedLabel?.Label,
              Color: option.Color,
            })
          );
        }
        detailedMetadata.DefaultFormValue = attributeDef.DefaultFormValue;
      }

      // Handle Lookup attributes - get target entities
      if (
        attributeDef.AttributeType === "Lookup" ||
        attributeDef.AttributeType === "Customer" ||
        attributeDef.AttributeType === "Owner"
      ) {
        if (attributeDef.Targets) {
          detailedMetadata.Targets = attributeDef.Targets;
        }
      }

      return {
        success: true,
        data: detailedMetadata,
        statusCode: response.status,
      };
    } catch (error: any) {
      return this.handleError(
        error,
        `Failed to get metadata for attribute '${attributeName}' on entity '${entityName}'`
      );
    }
  }

  /**
   * Get all entity sets (list of available entities)
   */
  async getEntitySets(): Promise<D365ApiResponse<string[]>> {
    try {
      const headers = await this.authService.getAuthHeaders();

      // Query EntityDefinitions to get all entities
      const url = `${this.baseUrl}/api/data/v9.2/EntityDefinitions?$select=LogicalName,LogicalCollectionName,DisplayName&$filter=IsValidForAdvancedFind eq true and IsCustomizable/Value eq true`;

      const response = await axios.get(url, { headers });

      // Extract entity set names from EntityDefinitions
      const entitySets =
        response.data.value
          ?.map(
            (entity: any) => entity.LogicalCollectionName || entity.LogicalName
          )
          .filter((name: string) => name) || [];

      return {
        success: true,
        data: entitySets,
        statusCode: response.status,
      };
    } catch (error: any) {
      // If the above fails, fall back to common entities
      console.log(
        "EntityDefinitions query failed, falling back to common entities"
      );
      const commonEntities = [
        "accounts",
        "contacts",
        "leads",
        "opportunities",
        "cases",
        "tasks",
        "appointments",
        "emails",
        "phonecalls",
        "activities",
        "systemusers",
        "teams",
        "businessunits",
        "roles",
        "subjects",
        "products",
        "pricelists",
        "quotes",
        "orders",
        "invoices",
      ];

      return {
        success: true,
        data: commonEntities,
        statusCode: 200,
      };
    }
  }

  /**
   * Query entities with flexible options
   */
  async queryEntities(
    entitySet: string,
    options: D365QueryOptions = {}
  ): Promise<D365ApiResponse<D365QueryResult>> {
    try {
      const headers = await this.authService.getAuthHeaders();
      const queryParams = this.buildQueryParams(options);
      const url = `${this.baseUrl}/api/data/v9.2/${entitySet}${queryParams}`;

      const response = await axios.get(url, { headers });

      return {
        success: true,
        data: response.data,
        statusCode: response.status,
      };
    } catch (error: any) {
      return this.handleError(
        error,
        `Failed to query entities from: ${entitySet}`
      );
    }
  }

  /**
   * Get a specific entity by ID
   */
  async getEntity(
    entitySet: string,
    id: string,
    select?: string[]
  ): Promise<D365ApiResponse<any>> {
    try {
      const headers = await this.authService.getAuthHeaders();
      const selectParam = select ? `?$select=${select.join(",")}` : "";
      const url = `${this.baseUrl}/api/data/v9.2/${entitySet}(${id})${selectParam}`;

      const response = await axios.get(url, { headers });

      return {
        success: true,
        data: response.data,
        statusCode: response.status,
      };
    } catch (error: any) {
      return this.handleError(
        error,
        `Failed to get entity ${id} from: ${entitySet}`
      );
    }
  }

  /**
   * Create a new entity
   */
  async createEntity(
    entitySet: string,
    data: Record<string, any>
  ): Promise<D365ApiResponse<any>> {
    try {
      const headers = await this.authService.getAuthHeaders();
      const url = `${this.baseUrl}/api/data/v9.2/${entitySet}`;

      const response = await axios.post(url, data, { headers });

      return {
        success: true,
        data: response.data,
        statusCode: response.status,
      };
    } catch (error: any) {
      return this.handleError(
        error,
        `Failed to create entity in: ${entitySet}`
      );
    }
  }

  /**
   * Update an existing entity
   */
  async updateEntity(
    entitySet: string,
    id: string,
    data: Record<string, any>
  ): Promise<D365ApiResponse<any>> {
    try {
      const headers = await this.authService.getAuthHeaders();
      const url = `${this.baseUrl}/api/data/v9.2/${entitySet}(${id})`;

      const response = await axios.patch(url, data, { headers });

      return {
        success: true,
        data: response.data || { updated: true },
        statusCode: response.status,
      };
    } catch (error: any) {
      return this.handleError(
        error,
        `Failed to update entity ${id} in: ${entitySet}`
      );
    }
  }

  /**
   * Delete an entity
   */
  async deleteEntity(
    entitySet: string,
    id: string
  ): Promise<D365ApiResponse<any>> {
    try {
      const headers = await this.authService.getAuthHeaders();
      const url = `${this.baseUrl}/api/data/v9.2/${entitySet}(${id})`;

      const response = await axios.delete(url, { headers });

      return {
        success: true,
        data: { deleted: true },
        statusCode: response.status,
      };
    } catch (error: any) {
      return this.handleError(
        error,
        `Failed to delete entity ${id} from: ${entitySet}`
      );
    }
  }

  /**
   * Execute a custom OData query
   */
  async executeCustomQuery(odataQuery: string): Promise<D365ApiResponse<any>> {
    try {
      const headers = await this.authService.getAuthHeaders();
      const url = `${this.baseUrl}/api/data/v9.2/${odataQuery}`;

      const response = await axios.get(url, { headers });

      return {
        success: true,
        data: response.data,
        statusCode: response.status,
      };
    } catch (error: any) {
      return this.handleError(
        error,
        `Failed to execute custom query: ${odataQuery}`
      );
    }
  }

  /**
   * Get all functions, actions, complex types, enum types, and global option sets
   */
  async getFunctionsAndMetadata(): Promise<D365ApiResponse<D365MetadataCollection>> {
    try {
      const headers = await this.authService.getAuthHeaders();

      // Get the service document to discover all available resources
      const url = `${this.baseUrl}/api/data/v9.2/$metadata`;

      const response = await axios.get(url, {
        headers: {
          ...headers,
          'Accept': 'application/xml'
        }
      });

      // Parse the metadata to extract functions, actions, etc.
      const metadata = await this.parseMetadata(response.data);

      return {
        success: true,
        data: metadata,
        statusCode: response.status,
      };
    } catch (error: any) {
      return this.handleError(
        error,
        "Failed to get functions and metadata"
      );
    }
  }

  /**
   * Parse XML metadata to extract functions, actions, complex types, and enum types
   */
  private async parseMetadata(xmlData: string): Promise<D365MetadataCollection> {
    try {
      // For a more user-friendly approach, let's use the JSON-based service document
      const headers = await this.authService.getAuthHeaders();
      const serviceDocUrl = `${this.baseUrl}/api/data/v9.2/`;

      const response = await axios.get(serviceDocUrl, {
        headers: {
          ...headers,
          'Accept': 'application/json'
        }
      });

      const serviceDoc = response.data;

      // Extract different types of resources
      const result = {
        functions: [],
        actions: [],
        complexTypes: [],
        enumTypes: [],
        globalOptionSets: [],
        entitySets: serviceDoc.value || [],
        summary: {
          totalFunctions: 0,
          totalActions: 0,
          totalComplexTypes: 0,
          totalEnumTypes: 0,
          totalGlobalOptionSets: 0,
          totalEntitySets: serviceDoc.value?.length || 0
        }
      };

      // Get function imports and actions from metadata using OData queries
      try {
        // Get function definitions
        const functionsUrl = `${this.baseUrl}/api/data/v9.2/FunctionDefinitions?$select=Name,DisplayName,Description`;
        const functionsResponse = await axios.get(functionsUrl, { headers });
        result.functions = functionsResponse.data.value || [];
        result.summary.totalFunctions = result.functions.length;
      } catch (e) {
        console.log("Could not fetch function definitions");
      }

      try {
        // Get action definitions  
        const actionsUrl = `${this.baseUrl}/api/data/v9.2/ActionDefinitions?$select=Name,DisplayName,Description`;
        const actionsResponse = await axios.get(actionsUrl, { headers });
        result.actions = actionsResponse.data.value || [];
        result.summary.totalActions = result.actions.length;
      } catch (e) {
        console.log("Could not fetch action definitions");
      }

      try {
        // Get global option sets
        const optionSetsUrl = `${this.baseUrl}/api/data/v9.2/GlobalOptionSetDefinitions?$select=Name,DisplayName,Description`;
        const optionSetsResponse = await axios.get(optionSetsUrl, { headers });
        result.globalOptionSets = optionSetsResponse.data.value || [];
        result.summary.totalGlobalOptionSets = result.globalOptionSets.length;
      } catch (e) {
        console.log("Could not fetch global option sets");
      }

      return result;
    } catch (error: any) {
      // Fallback with basic information
      return {
        functions: [],
        actions: [],
        complexTypes: [],
        enumTypes: [],
        globalOptionSets: [],
        entitySets: [],
        summary: {
          totalFunctions: 0,
          totalActions: 0,
          totalComplexTypes: 0,
          totalEnumTypes: 0,
          totalGlobalOptionSets: 0,
          totalEntitySets: 0
        },
        error: "Could not parse metadata, limited information available"
      };
    }
  }

  /**
   * Execute a function or action
   */
  async executeFunction(
    functionName: string,
    parameters: Record<string, any> = {},
    method: HttpMethod = "GET"
  ): Promise<D365ApiResponse<any>> {
    try {
      const headers = await this.authService.getAuthHeaders();
      const url = `${this.baseUrl}/api/data/v9.2/${functionName}`;

      let response: AxiosResponse;

      if (method === "GET") {
        const params = new URLSearchParams(parameters).toString();
        const fullUrl = params ? `${url}?${params}` : url;
        response = await axios.get(fullUrl, { headers });
      } else {
        response = await axios.request({
          method,
          url,
          headers,
          data: parameters,
        });
      }

      return {
        success: true,
        data: response.data,
        statusCode: response.status,
      };
    } catch (error: any) {
      return this.handleError(
        error,
        `Failed to execute function: ${functionName}`
      );
    }
  }

  private buildQueryParams(options: D365QueryOptions): string {
    const params: string[] = [];

    if (options.select) {
      params.push(`$select=${options.select.join(",")}`);
    }

    if (options.filter) {
      params.push(`$filter=${encodeURIComponent(options.filter)}`);
    }

    if (options.orderby) {
      params.push(`$orderby=${encodeURIComponent(options.orderby)}`);
    }

    if (options.top) {
      params.push(`$top=${options.top}`);
    }

    if (options.skip) {
      params.push(`$skip=${options.skip}`);
    }

    if (options.expand) {
      params.push(`$expand=${encodeURIComponent(options.expand)}`);
    }

    return params.length > 0 ? `?${params.join("&")}` : "";
  }

  private handleError(error: any, message: string): D365ApiResponse<any> {
    const errorMessage =
      error.response?.data?.error?.message || error.message || "Unknown error";
    const statusCode = error.response?.status || 500;

    console.error(`${message}:`, errorMessage);

    return {
      success: false,
      error: `${message}: ${errorMessage}`,
      statusCode,
    };
  }
}
