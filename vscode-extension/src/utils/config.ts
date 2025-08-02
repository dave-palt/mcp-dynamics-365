import * as vscode from 'vscode';

export interface D365Config {
    baseUrl: string;
    clientId: string;
    clientSecret: string;
    tenantId: string;
    resource: string;
}

export class ConfigurationHelper {
    private static readonly CONFIG_SECTION = 'mcp-dynamics365';

    static getConfiguration(): vscode.WorkspaceConfiguration {
        return vscode.workspace.getConfiguration(this.CONFIG_SECTION);
    }

    static getConfigValue<T>(key: string, defaultValue: T): T {
        return this.getConfiguration().get<T>(key, defaultValue);
    }

    static getOptionalConfigValue<T>(key: string): T | undefined {
        return this.getConfiguration().get<T>(key);
    }

    static async setConfigValue<T>(key: string, value: T, target?: vscode.ConfigurationTarget): Promise<void> {
        await this.getConfiguration().update(key, value, target || vscode.ConfigurationTarget.Workspace);
    }

    static getHttpPort(): number {
        return this.getConfigValue<number>('httpPort', 3300);
    }

    static getHttpHost(): string {
        return this.getConfigValue<string>('httpHost', 'localhost');
    }

    static async setHttpPort(port: number): Promise<void> {
        await this.setConfigValue('httpPort', port);
    }

    static async setHttpHost(host: string): Promise<void> {
        await this.setConfigValue('httpHost', host);
    }

    static validateD365Config(config: Partial<D365Config>): string[] {
        const errors: string[] = [];
        const required = ['baseUrl', 'clientId', 'clientSecret', 'tenantId', 'resource'];

        for (const field of required) {
            if (!config[field as keyof D365Config]) {
                errors.push(`Missing ${field}`);
            }
        }

        return errors;
    }

    static async promptForConfig(): Promise<D365Config | undefined> {
        const baseUrl = await vscode.window.showInputBox({
            prompt: 'Enter your Dynamics 365 Base URL',
            placeHolder: 'https://your-org.crm.dynamics.com',
            validateInput: (value) => {
                if (!value) return 'Base URL is required';
                if (!value.startsWith('https://')) return 'Base URL must start with https://';
                return null;
            }
        });

        if (!baseUrl) return undefined;

        const clientId = await vscode.window.showInputBox({
            prompt: 'Enter your Azure App Client ID',
            placeHolder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
        });

        if (!clientId) return undefined;

        const clientSecret = await vscode.window.showInputBox({
            prompt: 'Enter your Azure App Client Secret',
            password: true
        });

        if (!clientSecret) return undefined;

        const tenantId = await vscode.window.showInputBox({
            prompt: 'Enter your Azure Tenant ID',
            placeHolder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
        });

        if (!tenantId) return undefined;

        const resource = await vscode.window.showInputBox({
            prompt: 'Enter your Dynamics 365 Resource URL',
            placeHolder: 'https://your-org.crm.dynamics.com',
            value: baseUrl
        });

        if (!resource) return undefined;

        return {
            baseUrl,
            clientId,
            clientSecret,
            tenantId,
            resource
        };
    }
}
