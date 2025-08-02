import { ChildProcess, spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

let mcpProcess: ChildProcess | undefined;
let httpServerProcess: ChildProcess | undefined;
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

    // HTTP Server commands (with conditional dev commands)
    const startHttpCommand = vscode.commands.registerCommand('mcpDynamics365.startHttpServer', startHttpServerProduction);
    const stopHttpCommand = vscode.commands.registerCommand('mcpDynamics365.stopHttpServer', stopHttpServer);

    // Auto-detect development environment and conditionally register local dev command
    const extensionConfig = vscode.workspace.getConfiguration('mcpDynamics365');
    const userEnabledDev = extensionConfig.get<boolean>('enableDevelopmentCommands', false);

    // Auto-detect development environment based on:
    // 1. User explicitly enabled it via settings
    // 2. Running from source (development) vs installed extension
    // 3. Workspace contains the MCP server source code
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    const isDevWorkspace = workspaceFolder &&
        (fs.existsSync(path.join(workspaceFolder.uri.fsPath, 'src', 'server.ts')) ||
            fs.existsSync(path.join(workspaceFolder.uri.fsPath, 'dist', 'index.js')));

    const enableDevCommands = userEnabledDev || !!isDevWorkspace;

    let startHttpLocalCommand: vscode.Disposable | undefined;
    if (enableDevCommands) {
        startHttpLocalCommand = vscode.commands.registerCommand('mcpDynamics365.startHttpServerLocal', startHttpServerLocal);
        if (userEnabledDev) {
            outputChannel.appendLine('🔧 Development commands enabled (user setting)');
        } else {
            outputChannel.appendLine('🔧 Development commands auto-enabled (detected MCP server workspace)');
        }
    } else {
        outputChannel.appendLine('🚀 Production mode - development commands hidden');
    }
    const showOutputCommand = vscode.commands.registerCommand('mcpDynamics365.showOutput', () => {
        outputChannel.show();
    });

    const subscriptions = [
        startCommand,
        stopCommand,
        restartCommand,
        configureCommand,
        startHttpCommand,
        stopHttpCommand,
        showOutputCommand,
        outputChannel
    ];

    // Add local dev command if enabled
    if (startHttpLocalCommand) {
        subscriptions.push(startHttpLocalCommand);
    }

    context.subscriptions.push(...subscriptions);

    // Auto-start if configured
    if (extensionConfig.get('autoStart')) {
        outputChannel.appendLine('Auto-start enabled, starting MCP server...');
        startMCPServer();
    }

    // Show welcome message
    outputChannel.appendLine('=== MCP Dynamics 365 Extension Activation Complete ===');
    outputChannel.appendLine('Available commands:');
    outputChannel.appendLine('  - MCP: Start HTTP Server (Production)');
    outputChannel.appendLine('  - MCP: Stop HTTP Server');
    if (enableDevCommands) {
        outputChannel.appendLine('  - MCP: Start HTTP Server (Local Dev) [Development Mode]');
    }
    outputChannel.appendLine('  - MCP: Configure MCP Dynamics 365 Server');
    outputChannel.appendLine('  - Legacy: Start/Stop/Restart MCP Dynamics 365 Server (Stdio)');
    outputChannel.appendLine('  - MCP: Show Output');
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

// HTTP Server Management Functions
async function startHttpServerLocal() {
    await startHttpServerWithMode('local');
}

async function startHttpServerProduction() {
    await startHttpServerWithMode('production');
}

async function startHttpServerWithMode(mode: 'local' | 'production') {
    if (httpServerProcess && httpServerProcess.exitCode === null) {
        outputChannel.appendLine('⚠️ HTTP server is already running');
        vscode.window.showWarningMessage('HTTP server is already running');
        return;
    }

    outputChannel.appendLine(`🚀 === Starting HTTP Server (${mode === 'local' ? 'Local Dev' : 'Production'}) ===`);

    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
        outputChannel.appendLine('❌ No workspace folder found');
        vscode.window.showErrorMessage('No workspace folder found');
        return;
    }

    // Load environment variables from .env file
    const envPath = path.join(workspaceFolder.uri.fsPath, '.env');
    let envVars = { ...process.env };

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
            outputChannel.appendLine(`✅ Loaded environment variables from: ${envPath}`);
        } catch (envError) {
            outputChannel.appendLine(`⚠️ Warning: Could not load .env file: ${envError}`);
        }
    }

    // Check for required environment variables
    const requiredVars = ['D365_CLIENT_ID', 'D365_CLIENT_SECRET', 'D365_TENANT_ID', 'D365_BASE_URL', 'D365_RESOURCE'];
    const missingVars = requiredVars.filter(varName => !envVars[varName]);

    if (missingVars.length > 0) {
        outputChannel.appendLine(`❌ Missing required environment variables: ${missingVars.join(', ')}`);
        vscode.window.showErrorMessage(`Missing required environment variables: ${missingVars.join(', ')}`);
        return;
    }

    try {
        let command: string;
        let args: string[];

        if (mode === 'local') {
            // Force use local server path for development
            // When using main project as workspace, dist folder is directly in workspace
            const localServerPath = path.join(workspaceFolder.uri.fsPath, 'dist', 'index.js');
            if (fs.existsSync(localServerPath)) {
                outputChannel.appendLine(`🎯 Using local development server: ${localServerPath}`);
                command = 'node';
                args = [localServerPath, '--transport=http', '--port=3300'];
            } else {
                outputChannel.appendLine(`❌ Local server not found at: ${localServerPath}`);
                outputChannel.appendLine('💡 Run "pnpm run build" in the main project to build the server');
                outputChannel.appendLine(`💡 Expected path: ${localServerPath}`);
                vscode.window.showErrorMessage('Local server not found. Please build the project first.');
                return;
            }
        } else {
            // Force use production npx version
            outputChannel.appendLine('🌐 Using production server via npx');
            command = 'npx';
            args = ['@dav3/mcp-dynamics365-server', '--transport=http', '--port=3300'];
        }

        httpServerProcess = spawn(command, args, {
            stdio: ['pipe', 'pipe', 'pipe'],
            shell: true,
            env: envVars,
            cwd: workspaceFolder.uri.fsPath
        });

        httpServerProcess.stdout?.on('data', (data) => {
            const output = data.toString().trim();
            outputChannel.appendLine(`📤 [HTTP STDOUT] ${output}`);

            // Detect HTTP server startup
            if (output.includes('HTTP server running on') || output.includes('HTTP server listening on port')) {
                const portMatch = output.match(/(?:port |:)(\d+)/);
                if (portMatch) {
                    outputChannel.appendLine(`🎯 HTTP Server Started: http://localhost:${portMatch[1]}`);
                }
            }
        });

        httpServerProcess.stderr?.on('data', (data) => {
            const error = data.toString().trim();
            outputChannel.appendLine(`⚠️ [HTTP STDERR] ${error}`);
        });

        httpServerProcess.on('close', (code) => {
            outputChannel.appendLine(`🔌 HTTP server process exited with code ${code}`);
            if (code !== 0) {
                vscode.window.showErrorMessage(`HTTP server exited with error code ${code}`);
            }
            httpServerProcess = undefined;
        });

        httpServerProcess.on('error', (error) => {
            outputChannel.appendLine(`❌ HTTP server process error: ${error.message}`);
            vscode.window.showErrorMessage(`Failed to start HTTP server: ${error.message}`);
            httpServerProcess = undefined;
        });

        // Wait a moment to see if the server starts successfully
        await new Promise(resolve => setTimeout(resolve, 2000));

        if (httpServerProcess && httpServerProcess.exitCode === null) {
            outputChannel.appendLine(`✅ HTTP server process started (PID: ${httpServerProcess.pid})`);
            const modeText = mode === 'local' ? 'Local Development' : 'Production';
            vscode.window.showInformationMessage(`${modeText} HTTP server started successfully on port 3300`);
            outputChannel.appendLine(`🌐 ${modeText} HTTP server started successfully`);
        }

    } catch (error) {
        outputChannel.appendLine(`❌ Failed to start HTTP server: ${error}`);
        vscode.window.showErrorMessage(`Failed to start HTTP server: ${error}`);
    }
}

async function stopHttpServer() {
    if (!httpServerProcess || httpServerProcess.exitCode !== null) {
        outputChannel.appendLine('⚠️ HTTP server is not running');
        vscode.window.showWarningMessage('HTTP server is not running');
        return;
    }

    outputChannel.appendLine('🛑 === Stopping HTTP Server ===');

    try {
        httpServerProcess.kill('SIGTERM');

        // Wait for graceful shutdown
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Force kill if still running
        if (httpServerProcess && httpServerProcess.exitCode === null) {
            outputChannel.appendLine('🔨 Force killing HTTP server...');
            httpServerProcess.kill('SIGKILL');
        }

        httpServerProcess = undefined;
        outputChannel.appendLine('✅ HTTP server stopped');
        vscode.window.showInformationMessage('HTTP server stopped');

    } catch (error) {
        outputChannel.appendLine(`❌ Error stopping HTTP server: ${error}`);
        vscode.window.showErrorMessage(`Error stopping HTTP server: ${error}`);
    }
}
