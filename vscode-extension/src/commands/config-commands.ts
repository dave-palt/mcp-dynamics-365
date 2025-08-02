import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { ConfigurationHelper, D365Config } from '../utils/config.js';
import { OutputChannelLogger } from '../utils/logging.js';

export class ConfigCommands {
    private outputChannel: OutputChannelLogger;

    constructor() {
        this.outputChannel = new OutputChannelLogger('MCP Dynamics 365 Config');
    }

    async configureConnection(): Promise<void> {
        this.outputChannel.info('🔧 Starting Dynamics 365 connection configuration...');

        const config = await ConfigurationHelper.promptForConfig();

        if (!config) {
            this.outputChannel.warning('Configuration cancelled by user');
            return;
        }

        // Validate the configuration
        const errors = ConfigurationHelper.validateD365Config(config);
        if (errors.length > 0) {
            vscode.window.showErrorMessage(`Configuration validation failed: ${errors.join(', ')}`);
            return;
        }

        // Ask user where to save the configuration
        const saveOption = await vscode.window.showQuickPick([
            {
                label: '📁 Save to .env file (recommended)',
                description: 'Create/update .env file in workspace root',
                value: 'env'
            },
            {
                label: '⚙️ Save to VS Code settings',
                description: 'Store in VS Code workspace settings (less secure)',
                value: 'settings'
            }
        ], {
            placeHolder: 'Where would you like to save the configuration?'
        });

        if (!saveOption) return;

        if (saveOption.value === 'env') {
            await this.saveToEnvFile(config);
        } else {
            await this.saveToSettings(config);
        }

        this.outputChannel.success('✅ Configuration saved successfully');
        vscode.window.showInformationMessage(
            '✅ Dynamics 365 configuration saved! You can now start the MCP server.'
        );
    }

    private async saveToEnvFile(config: D365Config): Promise<void> {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            throw new Error('No workspace folder found');
        }

        const workspaceRoot = workspaceFolders[0].uri.fsPath;
        const envPath = path.join(workspaceRoot, '.env');

        let envContent = '';

        // Read existing .env file if it exists
        if (fs.existsSync(envPath)) {
            const existingContent = fs.readFileSync(envPath, 'utf8');
            const lines = existingContent.split('\n');

            // Remove existing D365 configuration
            const filteredLines = lines.filter(line =>
                !line.startsWith('D365_') && line.trim() !== ''
            );

            if (filteredLines.length > 0) {
                envContent = filteredLines.join('\n') + '\n\n';
            }
        }

        // Add D365 configuration
        envContent += '# Dynamics 365 MCP Server Configuration\n';
        envContent += `D365_BASE_URL=${config.baseUrl}\n`;
        envContent += `D365_CLIENT_ID=${config.clientId}\n`;
        envContent += `D365_CLIENT_SECRET=${config.clientSecret}\n`;
        envContent += `D365_TENANT_ID=${config.tenantId}\n`;
        envContent += `D365_RESOURCE=${config.resource}\n`;

        fs.writeFileSync(envPath, envContent);

        this.outputChannel.info(`Configuration saved to ${envPath}`);

        // Add .env to .gitignore if it doesn't exist
        await this.ensureGitIgnore(workspaceRoot);
    }

    private async saveToSettings(config: D365Config): Promise<void> {
        const settings = {
            'd365.baseUrl': config.baseUrl,
            'd365.clientId': config.clientId,
            'd365.clientSecret': config.clientSecret,
            'd365.tenantId': config.tenantId,
            'd365.resource': config.resource
        };

        for (const [key, value] of Object.entries(settings)) {
            await ConfigurationHelper.setConfigValue(key, value);
        }

        this.outputChannel.info('Configuration saved to VS Code settings');

        vscode.window.showWarningMessage(
            '⚠️ Credentials stored in VS Code settings. Consider using .env file for better security.'
        );
    }

    private async ensureGitIgnore(workspaceRoot: string): Promise<void> {
        const gitIgnorePath = path.join(workspaceRoot, '.gitignore');

        let gitIgnoreContent = '';
        if (fs.existsSync(gitIgnorePath)) {
            gitIgnoreContent = fs.readFileSync(gitIgnorePath, 'utf8');
        }

        // Check if .env is already in .gitignore
        if (!gitIgnoreContent.includes('.env')) {
            gitIgnoreContent += gitIgnoreContent.endsWith('\n') ? '' : '\n';
            gitIgnoreContent += '# Environment variables\n.env\n';

            fs.writeFileSync(gitIgnorePath, gitIgnoreContent);
            this.outputChannel.info('Added .env to .gitignore');
        }
    }

    async openConfiguration(): Promise<void> {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            vscode.window.showErrorMessage('No workspace folder found');
            return;
        }

        const workspaceRoot = workspaceFolders[0].uri.fsPath;
        const envPath = path.join(workspaceRoot, '.env');

        if (fs.existsSync(envPath)) {
            const document = await vscode.workspace.openTextDocument(envPath);
            await vscode.window.showTextDocument(document);
        } else {
            const create = await vscode.window.showQuickPick([
                { label: 'Create .env file', value: true },
                { label: 'Cancel', value: false }
            ], {
                placeHolder: '.env file not found. Would you like to create one?'
            });

            if (create?.value) {
                await this.configureConnection();
            }
        }
    }

    async validateConfiguration(): Promise<void> {
        this.outputChannel.info('🔍 Validating Dynamics 365 configuration...');

        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            vscode.window.showErrorMessage('No workspace folder found');
            return;
        }

        const workspaceRoot = workspaceFolders[0].uri.fsPath;
        const envPath = path.join(workspaceRoot, '.env');

        let config: Partial<D365Config> = {};
        let source = '';

        // Try to load from .env file first
        if (fs.existsSync(envPath)) {
            try {
                const envContent = fs.readFileSync(envPath, 'utf8');
                const lines = envContent.split('\n');

                for (const line of lines) {
                    const match = line.match(/^D365_([^=]+)=(.*)$/);
                    if (match) {
                        const key = match[1].toLowerCase();
                        const value = match[2];

                        switch (key) {
                            case 'base_url': config.baseUrl = value; break;
                            case 'client_id': config.clientId = value; break;
                            case 'client_secret': config.clientSecret = value; break;
                            case 'tenant_id': config.tenantId = value; break;
                            case 'resource': config.resource = value; break;
                        }
                    }
                }
                source = '.env file';
            } catch (error) {
                this.outputChannel.error(`Failed to read .env file: ${error}`);
            }
        }

        // Fallback to VS Code settings
        if (Object.keys(config).length === 0) {
            config = {
                baseUrl: ConfigurationHelper.getOptionalConfigValue('d365.baseUrl'),
                clientId: ConfigurationHelper.getOptionalConfigValue('d365.clientId'),
                clientSecret: ConfigurationHelper.getOptionalConfigValue('d365.clientSecret'),
                tenantId: ConfigurationHelper.getOptionalConfigValue('d365.tenantId'),
                resource: ConfigurationHelper.getOptionalConfigValue('d365.resource')
            };
            source = 'VS Code settings';
        }

        const errors = ConfigurationHelper.validateD365Config(config);

        if (errors.length === 0) {
            this.outputChannel.success(`✅ Configuration is valid (loaded from ${source})`);
            vscode.window.showInformationMessage(`✅ Dynamics 365 configuration is valid`);
        } else {
            this.outputChannel.error(`❌ Configuration validation failed: ${errors.join(', ')}`);
            vscode.window.showErrorMessage(`❌ Configuration validation failed: ${errors.join(', ')}`);

            const fix = await vscode.window.showQuickPick([
                { label: 'Fix configuration', value: true },
                { label: 'Cancel', value: false }
            ], {
                placeHolder: 'Would you like to fix the configuration?'
            });

            if (fix?.value) {
                await this.configureConnection();
            }
        }

        this.outputChannel.show();
    }
}
