import axios from "axios";
import { D365AuthToken, D365Config } from "./types.js";

export class D365AuthService {
  private config: D365Config;
  private currentToken: D365AuthToken | null = null;

  constructor(config: D365Config) {
    this.config = config;
  }

  async getAccessToken(): Promise<string> {
    // Check if current token is still valid (with 5 minute buffer)
    if (
      this.currentToken &&
      this.currentToken.expires_at > Date.now() + 300000
    ) {
      return this.currentToken.access_token;
    }

    // Get new token
    await this.authenticate();
    return this.currentToken!.access_token;
  }

  private async authenticate(): Promise<void> {
    const tokenUrl = `https://login.microsoftonline.com/${this.config.tenantId}/oauth2/token`;

    const data = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      resource: this.config.resource,
    });

    try {
      const response = await axios.post(tokenUrl, data, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });

      this.currentToken = {
        ...response.data,
        expires_at: Date.now() + response.data.expires_in * 1000,
      };

      console.log("Successfully authenticated with Dynamics 365");
    } catch (error: any) {
      console.error(
        "Authentication failed:",
        error.response?.data || error.message
      );
      throw new Error(
        `Authentication failed: ${
          error.response?.data?.error_description || error.message
        }`
      );
    }
  }

  async getAuthHeaders(): Promise<Record<string, string>> {
    const token = await this.getAccessToken();
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "OData-MaxVersion": "4.0",
      "OData-Version": "4.0",
      Accept: "application/json",
    };
  }
}
