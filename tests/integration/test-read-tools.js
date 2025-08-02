#!/usr/bin/env node

/**
 * Comprehensive test script for all read tools in the MCP Dynamics 365 server
 *
 * This file tests all non-destructive (read-only) operations to ensure they work properly.
 * It will not be committed to the repository as it contains test data and may contain
 * sensitive information.
 *
 * NAMING CONVENTIONS TESTED:
 * 📋 Metadata operations: Use SINGULAR entity logical names (e.g., "contact", "account")
 * 📊 Data operations: Use PLURAL entity set names (e.g., "contacts", "accounts")
 * 🔍 OData queries: Use PLURAL entity set names in URL paths
 *
 * To run: pnpm run test:read-tools
 */

import dotenv from "dotenv";
import { D365ApiClient } from "../../dist/api-client.js";

// Load environment variables
dotenv.config();

class ReadToolsTester {
  constructor() {
    this.apiClient = null;
    this.testResults = {
      passed: 0,
      failed: 0,
      tests: [],
    };
  }

  log(message, type = "info") {
    const timestamp = new Date().toISOString();
    const prefix = type === "error" ? "❌" : type === "success" ? "✅" : "ℹ️";
    console.log(`[${timestamp}] ${prefix} ${message}`);
  }

  async runTest(testName, testFunction) {
    this.log(`Running test: ${testName}`);
    try {
      const result = await testFunction();
      this.testResults.passed++;
      this.testResults.tests.push({ name: testName, status: "passed", result });
      this.log(`Test passed: ${testName}`, "success");
      return result;
    } catch (error) {
      this.testResults.failed++;
      this.testResults.tests.push({
        name: testName,
        status: "failed",
        error: error.message,
      });
      this.log(`Test failed: ${testName} - ${error.message}`, "error");
      return null;
    }
  }

  async initialize() {
    this.log("Initializing MCP Dynamics 365 API client...");

    // Check required environment variables
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

    const config = {
      baseUrl: process.env.D365_BASE_URL,
      clientId: process.env.D365_CLIENT_ID,
      clientSecret: process.env.D365_CLIENT_SECRET,
      tenantId: process.env.D365_TENANT_ID,
      resource: process.env.D365_RESOURCE,
    };

    this.apiClient = new D365ApiClient(config);
    this.log("API client initialized successfully", "success");
  }

  async testGetEntitySets() {
    const result = await this.apiClient.getEntitySets();

    if (!result.success) {
      throw new Error(result.error || "Failed to get entity sets");
    }

    const entities = result.data || [];
    if (entities.length === 0) {
      throw new Error("No entities returned");
    }

    return {
      success: true,
      entityCount: entities.length,
      sampleEntities: entities.slice(0, 5),
    };
  }

  async testGetEntityMetadata() {
    // Use singular entity logical name for metadata operations
    const result = await this.apiClient.getEntityMetadata("contact", true);

    if (!result.success) {
      throw new Error(result.error || "Failed to get entity metadata");
    }

    const metadata = result.data;
    if (!metadata || !metadata.EntityType) {
      throw new Error("Invalid metadata structure returned");
    }

    return {
      success: true,
      entityType: metadata.EntityType,
      attributeCount: metadata.Attributes?.length || 0,
      displayName: metadata.DisplayName,
    };
  }

  async testGetEntityMetadataWithoutAttributes() {
    // Use singular entity logical name for metadata operations
    const result = await this.apiClient.getEntityMetadata("account", false);

    if (!result.success) {
      throw new Error(result.error || "Failed to get entity metadata");
    }

    return {
      success: true,
      entityType: result.data?.EntityType,
      hasAttributes: !!result.data?.Attributes?.length,
    };
  }

  async testGetAttributeMetadata() {
    // Use singular entity logical name for metadata operations
    const result = await this.apiClient.getAttributeMetadata(
      "contact",
      "firstname"
    );

    if (!result.success) {
      throw new Error(result.error || "Failed to get attribute metadata");
    }

    const metadata = result.data;
    if (!metadata || !metadata.LogicalName) {
      throw new Error("Invalid attribute metadata structure returned");
    }

    return {
      success: true,
      logicalName: metadata.LogicalName,
      attributeType: metadata.AttributeType,
      displayName: metadata.DisplayName,
    };
  }

  async testQueryEntities() {
    // Use plural entity set name for data operations
    const result = await this.apiClient.queryEntities("contacts", {
      select: ["contactid", "firstname", "lastname"],
      top: 3,
    });

    if (!result.success) {
      throw new Error(result.error || "Failed to query entities");
    }

    const data = result.data;
    if (!data || !Array.isArray(data.value)) {
      throw new Error("Invalid query result structure");
    }

    return {
      success: true,
      recordCount: data.value.length,
      hasODataContext: !!data["@odata.context"],
    };
  }

  async testQueryEntitiesWithFilter() {
    // Use plural entity set name for data operations
    const result = await this.apiClient.queryEntities("contacts", {
      select: ["contactid", "firstname", "lastname"],
      filter: "statecode eq 0",
      top: 2,
    });

    if (!result.success) {
      throw new Error(result.error || "Failed to query entities with filter");
    }

    return {
      success: true,
      recordCount: result.data?.value?.length || 0,
    };
  }

  async testExecuteCustomQuery() {
    // Use plural entity set name in OData query URL
    const result = await this.apiClient.executeCustomQuery(
      "contacts?$select=contactid,firstname&$top=2"
    );

    if (!result.success) {
      throw new Error(result.error || "Failed to execute custom query");
    }

    return {
      success: true,
      recordCount: result.data?.value?.length || 0,
    };
  }

  async testExecuteFunction() {
    const result = await this.apiClient.executeFunction("WhoAmI", {}, "GET");

    if (!result.success) {
      throw new Error(result.error || "Failed to execute function");
    }

    return {
      success: true,
      hasUserId: !!result.data?.UserId,
    };
  }

  async runAllTests() {
    this.log("🚀 Starting comprehensive read tools test suite...");
    this.log("===============================================");

    try {
      await this.initialize();

      // Test all read-only API methods
      await this.runTest("Get Entity Sets", () => this.testGetEntitySets());
      await this.runTest("Get Entity Metadata (with attributes)", () =>
        this.testGetEntityMetadata()
      );
      await this.runTest("Get Entity Metadata (without attributes)", () =>
        this.testGetEntityMetadataWithoutAttributes()
      );
      await this.runTest("Get Attribute Metadata", () =>
        this.testGetAttributeMetadata()
      );
      await this.runTest("Query Entities (basic)", () =>
        this.testQueryEntities()
      );
      await this.runTest("Query Entities (with filter)", () =>
        this.testQueryEntitiesWithFilter()
      );
      await this.runTest("Execute Custom Query", () =>
        this.testExecuteCustomQuery()
      );
      await this.runTest("Execute Function (WhoAmI)", () =>
        this.testExecuteFunction()
      );
    } catch (error) {
      this.log(`Fatal error during testing: ${error.message}`, "error");
    }

    // Print summary
    this.printSummary();
  }

  printSummary() {
    this.log("===============================================");
    this.log("📊 TEST SUMMARY");
    this.log("===============================================");
    this.log(
      `Total tests: ${this.testResults.passed + this.testResults.failed}`
    );
    this.log(`Passed: ${this.testResults.passed}`, "success");
    this.log(
      `Failed: ${this.testResults.failed}`,
      this.testResults.failed > 0 ? "error" : "info"
    );

    if (this.testResults.passed + this.testResults.failed > 0) {
      this.log(
        `Success rate: ${Math.round(
          (this.testResults.passed /
            (this.testResults.passed + this.testResults.failed)) *
            100
        )}%`
      );
    }

    if (this.testResults.failed > 0) {
      this.log("");
      this.log("❌ FAILED TESTS:");
      this.testResults.tests
        .filter((test) => test.status === "failed")
        .forEach((test) => {
          this.log(`  - ${test.name}: ${test.error}`, "error");
        });
    }

    this.log("");
    this.log("📝 DETAILED RESULTS:");
    this.testResults.tests.forEach((test) => {
      const status = test.status === "passed" ? "✅" : "❌";
      this.log(`  ${status} ${test.name}`);
      if (test.result) {
        const resultStr = JSON.stringify(test.result, null, 2)
          .split("\n")
          .map((line) => `    ${line}`)
          .join("\n");
        this.log(resultStr);
      }
    });

    this.log("");
    this.log("🎉 Testing complete!");

    // Exit with error code if any tests failed
    if (this.testResults.failed > 0) {
      process.exit(1);
    }
  }
}

// Run the tests
const tester = new ReadToolsTester();
tester.runAllTests().catch((error) => {
  console.error("❌ Test suite failed to run:", error);
  process.exit(1);
});
