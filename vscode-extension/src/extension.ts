import { ChildProcess, spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

let mcpProcess: ChildProcess | undefined;
let outputChannel: vscode.OutputChannel;

export function activate(context: vscode.ExtensionContext) {
    outputChannel = vscode.window.createOutputChannel('MCP Dynamics 365');

    // Register commands
    const startCommand = vscode.commands.registerCommand('mcpDynamics365.start', startMCPServer);
    const stopCommand = vscode.commands.registerCommand('mcpDynamics365.stop', stopMCPServer);
    const restartCommand = vscode.commands.registerCommand('mcpDynamics365.restart', restartMCPServer);
    const configureCommand = vscode.commands.registerCommand('mcpDynamics365.configure', configureMCPServer);

    context.subscriptions.push(startCommand, stopCommand, restartCommand, configureCommand, outputChannel);

    // Auto-start if configured
    const config = vscode.workspace.getConfiguration('mcpDynamics365');
    if (config.get('autoStart')) {
        startMCPServer();
    }

    // Show welcome message
    outputChannel.appendLine('MCP Dynamics 365 Extension activated');
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

        mcpProcess = spawn(command, args, {
            stdio: ['pipe', 'pipe', 'pipe'],
            shell: true
        });

        mcpProcess.stdout?.on('data', (data) => {
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
D365_RESOURCE_URL=https://your-org.crm.dynamics.com/
D365_AUTHORITY_URL=https://login.microsoftonline.com/
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
