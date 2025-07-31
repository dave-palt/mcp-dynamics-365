import { ChildProcess, spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

let mcpProcess: ChildProcess | undefined;
let outputChannel: vscode.OutputChannel;

// MCP Server Definition Provider
class Dynamics365McpServerProvider implements vscode.McpServerDefinitionProvider {
    provideMcpServerDefinitions(token: vscode.CancellationToken): vscode.ProviderResult<any[]> {
        outputChannel.appendLine('=== MCP Provider: provideMcpServerDefinitions called ===');

        // Check for existing mcp.json files that might override this extension
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (workspaceFolder) {
            const mcpJsonPath = path.join(workspaceFolder.uri.fsPath, 'mcp.json');
            if (fs.existsSync(mcpJsonPath)) {
                outputChannel.appendLine(`⚠️  WARNING: Found existing mcp.json at ${mcpJsonPath}`);
                outputChannel.appendLine('⚠️  This file may take precedence over extension-registered servers');
                outputChannel.appendLine('⚠️  Consider using manual configuration instead of the extension');
            }
        }

        const config = vscode.workspace.getConfiguration('mcpDynamics365');
        const serverPath = config.get<string>('serverPath') || 'npx @dav3/mcp-dynamics365-server';
        outputChannel.appendLine(`MCP Provider: Server path: ${serverPath}`);

        // Try multiple sources for environment variables
        let envVars: Record<string, string> = {};

        // 1. Check VS Code settings first
        const settingsEnv = {
            'D365_CLIENT_ID': config.get<string>('clientId'),
            'D365_CLIENT_SECRET': config.get<string>('clientSecret'),
            'D365_TENANT_ID': config.get<string>('tenantId'),
            'D365_BASE_URL': config.get<string>('baseUrl'),
            'D365_RESOURCE': config.get<string>('resource')
        };

        for (const [key, value] of Object.entries(settingsEnv)) {
            if (value) {
                envVars[key] = value;
                outputChannel.appendLine(`MCP Provider: Got ${key} from VS Code settings`);
            }
        }

        // 2. Try to load .env file as fallback
        if (workspaceFolder && Object.keys(envVars).length === 0) {
            const envPath = path.join(workspaceFolder.uri.fsPath, '.env');
            outputChannel.appendLine(`MCP Provider: Looking for .env at: ${envPath}`);

            if (fs.existsSync(envPath)) {
                try {
                    const envContent = fs.readFileSync(envPath, 'utf8');
                    const envLines = envContent.split('\n');

                    for (const line of envLines) {
                        const trimmed = line.trim();
                        if (trimmed && !trimmed.startsWith('#')) {
                            const [key, ...valueParts] = trimmed.split('=');
                            if (key && valueParts.length > 0) {
                                const value = valueParts.join('=').replace(/^["']|["']$/g, '');
                                envVars[key.trim()] = value;
                            }
                        }
                    }
                    outputChannel.appendLine(`MCP Provider: Loaded ${Object.keys(envVars).length} environment variables from .env`);
                } catch (envError) {
                    outputChannel.appendLine(`MCP Provider: Error loading .env file: ${envError}`);
                }
            } else {
                outputChannel.appendLine('MCP Provider: No .env file found');
            }
        }

        // 3. Check process environment as last resort
        if (Object.keys(envVars).length === 0) {
            const requiredVars = ['D365_CLIENT_ID', 'D365_CLIENT_SECRET', 'D365_TENANT_ID', 'D365_BASE_URL', 'D365_RESOURCE'];
            for (const varName of requiredVars) {
                if (process.env[varName]) {
                    envVars[varName] = process.env[varName]!;
                    outputChannel.appendLine(`MCP Provider: Got ${varName} from process environment`);
                }
            }
        }

        outputChannel.appendLine(`MCP Provider: Total environment variables: ${Object.keys(envVars).length}`);
        outputChannel.appendLine(`MCP Provider: Available variables: ${Object.keys(envVars).join(', ')}`);

        // Only provide the server if we have the required environment variables
        const requiredVars = ['D365_CLIENT_ID', 'D365_CLIENT_SECRET', 'D365_TENANT_ID', 'D365_BASE_URL', 'D365_RESOURCE'];
        const hasRequiredVars = requiredVars.every(varName => {
            const hasVar = !!envVars[varName];
            if (!hasVar) {
                outputChannel.appendLine(`MCP Provider: Missing required variable: ${varName}`);
            }
            return hasVar;
        });

        if (!hasRequiredVars) {
            outputChannel.appendLine('MCP Provider: Not registering server - missing required environment variables');
            return [];
        }

        const [command, ...args] = serverPath.split(' ');

        const serverDefinition = {
            id: 'dynamics365-mcp-server',
            name: 'Dynamics 365 CRM',
            description: 'Microsoft Dynamics 365 CRM operations via MCP',
            command: command,
            args: args,
            env: envVars
        };

        outputChannel.appendLine(`MCP Provider: Registering server: ${JSON.stringify(serverDefinition, null, 2)}`);
        return [serverDefinition];
    }

    resolveMcpServerDefinition?(server: any, token: vscode.CancellationToken): vscode.ProviderResult<any> {
        // Server is already resolved in provideMcpServerDefinitions
        return server;
    }
}

export function activate(context: vscode.ExtensionContext) {
    outputChannel = vscode.window.createOutputChannel('MCP Dynamics 365');
    outputChannel.show(); // Show output channel for debugging

    outputChannel.appendLine('=== MCP Dynamics 365 Extension Activation Started ===');
    outputChannel.appendLine(`VS Code version: ${vscode.version}`);
    outputChannel.appendLine(`Extension path: ${context.extensionPath}`);

    // Register MCP Server Definition Provider
    const mcpProvider = new Dynamics365McpServerProvider();
    outputChannel.appendLine('MCP Provider created, registering with VS Code...');

    try {
        const mcpProviderDisposable = vscode.lm.registerMcpServerDefinitionProvider('dynamics365-mcp-server', mcpProvider);
        outputChannel.appendLine('✅ MCP Server Definition Provider registered successfully');

        // Test the provider immediately
        outputChannel.appendLine('Testing provider...');
        const definitions = mcpProvider.provideMcpServerDefinitions(new vscode.CancellationTokenSource().token);
        outputChannel.appendLine(`Provider test result: ${JSON.stringify(definitions, null, 2)}`);

        context.subscriptions.push(mcpProviderDisposable);
    } catch (error) {
        outputChannel.appendLine(`❌ Error registering MCP provider: ${error}`);
    }

    // Register commands
    const startCommand = vscode.commands.registerCommand('mcpDynamics365.start', startMCPServer);
    const stopCommand = vscode.commands.registerCommand('mcpDynamics365.stop', stopMCPServer);
    const restartCommand = vscode.commands.registerCommand('mcpDynamics365.restart', restartMCPServer);
    const configureCommand = vscode.commands.registerCommand('mcpDynamics365.configure', configureMCPServer);

    context.subscriptions.push(
        startCommand,
        stopCommand,
        restartCommand,
        configureCommand,
        outputChannel
    );

    // Auto-start if configured
    const config = vscode.workspace.getConfiguration('mcpDynamics365');
    if (config.get('autoStart')) {
        outputChannel.appendLine('Auto-start enabled, starting MCP server...');
        startMCPServer();
    }

    // Show welcome message
    outputChannel.appendLine('=== MCP Dynamics 365 Extension Activation Complete ===');
    outputChannel.appendLine('Available commands:');
    outputChannel.appendLine('  - MCP: Start MCP Dynamics 365 Server');
    outputChannel.appendLine('  - MCP: Stop MCP Dynamics 365 Server');
    outputChannel.appendLine('  - MCP: Restart MCP Dynamics 365 Server');
    outputChannel.appendLine('  - MCP: Configure MCP Dynamics 365 Server');
}

export function deactivate() {
    stopMCPServer();
}

async function startMCPServer() {
    if (mcpProcess) {
        vscode.window.showWarningMessage('MCP Dynamics 365 server is already running');
        return;
    }

    const config = vscode.workspace.getConfiguration('mcpDynamics365');
    const serverPath = config.get<string>('serverPath') || 'npx @dav3/mcp-dynamics365-server';

    outputChannel.show();
    outputChannel.appendLine('Starting MCP Dynamics 365 server...');
    outputChannel.appendLine(`Server path: ${serverPath}`);

    try {
        // Parse the command
        const [command, ...args] = serverPath.split(' ');

        // Get workspace folder to find .env file
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        let envPath = '';
        let envVars = { ...process.env };

        if (workspaceFolder) {
            envPath = path.join(workspaceFolder.uri.fsPath, '.env');

            // Try to load .env file
            if (fs.existsSync(envPath)) {
                try {
                    const envContent = fs.readFileSync(envPath, 'utf8');
                    const envLines = envContent.split('\n');

                    for (const line of envLines) {
                        const trimmed = line.trim();
                        if (trimmed && !trimmed.startsWith('#')) {
                            const [key, ...valueParts] = trimmed.split('=');
                            if (key && valueParts.length > 0) {
                                const value = valueParts.join('=').replace(/^["']|["']$/g, '');
                                envVars[key.trim()] = value;
                            }
                        }
                    }
                    outputChannel.appendLine(`Loaded environment variables from: ${envPath}`);
                } catch (envError) {
                    outputChannel.appendLine(`Warning: Could not load .env file: ${envError}`);
                }
            } else {
                outputChannel.appendLine(`No .env file found at: ${envPath}`);
            }
        }

        mcpProcess = spawn(command, args, {
            stdio: ['pipe', 'pipe', 'pipe'],
            shell: true,
            env: envVars,
            cwd: workspaceFolder?.uri.fsPath
        }); mcpProcess.stdout?.on('data', (data) => {
            outputChannel.appendLine(`[STDOUT] ${data.toString()}`);
        });

        mcpProcess.stderr?.on('data', (data) => {
            outputChannel.appendLine(`[STDERR] ${data.toString()}`);
        });

        mcpProcess.on('close', (code) => {
            outputChannel.appendLine(`MCP server exited with code ${code}`);
            mcpProcess = undefined;
            if (code !== 0) {
                vscode.window.showErrorMessage(`MCP Dynamics 365 server exited with code ${code}`);
            }
        });

        mcpProcess.on('error', (error) => {
            outputChannel.appendLine(`Error starting MCP server: ${error.message}`);
            vscode.window.showErrorMessage(`Failed to start MCP server: ${error.message}`);
            mcpProcess = undefined;
        });

        vscode.window.showInformationMessage('MCP Dynamics 365 server started');
    } catch (error) {
        outputChannel.appendLine(`Error: ${error}`);
        vscode.window.showErrorMessage(`Failed to start MCP server: ${error}`);
    }
}

function stopMCPServer() {
    if (!mcpProcess) {
        vscode.window.showWarningMessage('MCP Dynamics 365 server is not running');
        return;
    }

    outputChannel.appendLine('Stopping MCP Dynamics 365 server...');
    mcpProcess.kill();
    mcpProcess = undefined;
    vscode.window.showInformationMessage('MCP Dynamics 365 server stopped');
}

async function restartMCPServer() {
    stopMCPServer();
    // Wait a bit before restarting
    await new Promise(resolve => setTimeout(resolve, 1000));
    startMCPServer();
}

async function configureMCPServer() {
    // Give user choice between .env file and VS Code settings
    const choice = await vscode.window.showQuickPick([
        {
            label: 'Configure via VS Code Settings',
            description: 'Store credentials in VS Code settings (recommended for security)',
            detail: 'Credentials will be stored in your VS Code settings'
        },
        {
            label: 'Configure via .env file',
            description: 'Create/edit .env file in workspace',
            detail: 'Credentials will be stored in .env file (add to .gitignore!)'
        }
    ], {
        placeHolder: 'Choose configuration method'
    });

    if (!choice) {
        return;
    }

    if (choice.label === 'Configure via VS Code Settings') {
        await configureViaSettings();
    } else {
        await configureViaEnvFile();
    }
}

async function configureViaSettings() {
    const config = vscode.workspace.getConfiguration('mcpDynamics365');

    const inputs = [
        { key: 'clientId', prompt: 'Enter Dynamics 365 Client ID (Azure AD App Registration)' },
        { key: 'clientSecret', prompt: 'Enter Dynamics 365 Client Secret (Azure AD App Registration)', password: true },
        { key: 'tenantId', prompt: 'Enter Dynamics 365 Tenant ID (Azure AD Directory)' },
        { key: 'baseUrl', prompt: 'Enter Dynamics 365 Base URL (e.g., https://your-org.crm.dynamics.com)' },
        { key: 'resource', prompt: 'Enter Dynamics 365 Resource URL (usually same as Base URL)' }
    ];

    for (const input of inputs) {
        const currentValue = config.get<string>(input.key);
        const value = await vscode.window.showInputBox({
            prompt: input.prompt,
            value: currentValue,
            password: input.password || false,
            ignoreFocusOut: true
        });

        if (value === undefined) {
            vscode.window.showWarningMessage('Configuration cancelled');
            return;
        }

        if (value) {
            await config.update(input.key, value, vscode.ConfigurationTarget.Workspace);
        }
    }

    vscode.window.showInformationMessage('MCP Dynamics 365 configuration saved to VS Code settings');

    // Test the configuration
    const provider = new Dynamics365McpServerProvider();
    const definitions = provider.provideMcpServerDefinitions(new vscode.CancellationTokenSource().token);
    outputChannel.appendLine('Configuration test result:');
    outputChannel.appendLine(JSON.stringify(definitions, null, 2));
}

async function configureViaEnvFile() {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
        vscode.window.showErrorMessage('No workspace folder found');
        return;
    }

    const configPath = path.join(workspaceFolder.uri.fsPath, '.env');
    const exampleConfigPath = path.join(workspaceFolder.uri.fsPath, '.env.example');

    // Check if .env exists, if not, create from .env.example
    if (!fs.existsSync(configPath) && fs.existsSync(exampleConfigPath)) {
        try {
            fs.copyFileSync(exampleConfigPath, configPath);
            vscode.window.showInformationMessage('Created .env file from template');
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to create .env file: ${error}`);
            return;
        }
    }

    // Open the configuration file
    if (fs.existsSync(configPath)) {
        const document = await vscode.workspace.openTextDocument(configPath);
        await vscode.window.showTextDocument(document);
    } else {
        // Create a basic .env file
        const basicConfig = `# Dynamics 365 Configuration
D365_CLIENT_ID=your_client_id_here
D365_CLIENT_SECRET=your_client_secret_here
D365_TENANT_ID=your_tenant_id_here
D365_BASE_URL=https://your-org.crm.dynamics.com
D365_RESOURCE=https://your-org.crm.dynamics.com
D365_AUTHORITY_URL=https://login.microsoftonline.com/
D365_API_VERSION=v9.2
`;

        try {
            fs.writeFileSync(configPath, basicConfig);
            const document = await vscode.workspace.openTextDocument(configPath);
            await vscode.window.showTextDocument(document);
            vscode.window.showInformationMessage('Created basic .env configuration file. Please update with your Dynamics 365 credentials.');
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to create configuration file: ${error}`);
        }
    }
}
