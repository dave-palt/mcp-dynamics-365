import * as vscode from 'vscode';
import { ConfigCommands, HttpServerCommands, LegacyCommands } from './commands/index.js';
import { Dynamics365McpServerProvider } from './providers/mcp-server-provider.js';

let mcpProvider: Dynamics365McpServerProvider;
let httpCommands: HttpServerCommands;
let configCommands: ConfigCommands;
let legacyCommands: LegacyCommands;

export function activate(context: vscode.ExtensionContext) {
    console.log('🚀 MCP Dynamics 365 Extension is being activated...');

    // Initialize provider and command handlers
    mcpProvider = new Dynamics365McpServerProvider();
    httpCommands = new HttpServerCommands(mcpProvider);
    configCommands = new ConfigCommands();
    legacyCommands = new LegacyCommands(mcpProvider);

    // Register all commands
    registerCommands(context);

    console.log('✅ MCP Dynamics 365 Extension activated successfully');
}

function registerCommands(context: vscode.ExtensionContext) {
    const commands = [
        // HTTP Server Commands
        {
            command: 'mcp-dynamics365.startHttpServerLocal',
            handler: () => httpCommands.startLocalHttpServer(),
            title: 'MCP D365: Start Local HTTP Server'
        },
        {
            command: 'mcp-dynamics365.startHttpServer',
            handler: () => httpCommands.startProductionHttpServer(),
            title: 'MCP D365: Start HTTP Server'
        },
        {
            command: 'mcp-dynamics365.stopHttpServer',
            handler: () => httpCommands.stopHttpServer(),
            title: 'MCP D365: Stop HTTP Server'
        },
        {
            command: 'mcp-dynamics365.restartHttpServer',
            handler: () => httpCommands.restartHttpServer(),
            title: 'MCP D365: Restart HTTP Server'
        },
        {
            command: 'mcp-dynamics365.showServerStatus',
            handler: () => httpCommands.showServerStatus(),
            title: 'MCP D365: Show Server Status'
        },

        // Configuration Commands
        {
            command: 'mcp-dynamics365.configure',
            handler: () => configCommands.configureConnection(),
            title: 'MCP D365: Configure Connection'
        },
        {
            command: 'mcp-dynamics365.openConfiguration',
            handler: () => configCommands.openConfiguration(),
            title: 'MCP D365: Open Configuration'
        },
        {
            command: 'mcp-dynamics365.validateConfiguration',
            handler: () => configCommands.validateConfiguration(),
            title: 'MCP D365: Validate Configuration'
        },

        // Legacy Commands (stdio)
        {
            command: 'mcp-dynamics365.start',
            handler: () => legacyCommands.startServer(),
            title: 'MCP D365: Start Server (stdio)'
        },
        {
            command: 'mcp-dynamics365.stop',
            handler: () => legacyCommands.stopServer(),
            title: 'MCP D365: Stop Server (stdio)'
        },
        {
            command: 'mcp-dynamics365.restart',
            handler: () => legacyCommands.restartServer(),
            title: 'MCP D365: Restart Server (stdio)'
        },

        // Utility Commands
        {
            command: 'mcp-dynamics365.showOutput',
            handler: () => mcpProvider.showOutput(),
            title: 'MCP D365: Show Output'
        }
    ];

    // Register all commands
    for (const cmd of commands) {
        const disposable = vscode.commands.registerCommand(cmd.command, cmd.handler);
        context.subscriptions.push(disposable);
    }

    // Register provider for cleanup
    context.subscriptions.push(mcpProvider);
}

export function deactivate() {
    console.log('🛑 MCP Dynamics 365 Extension is being deactivated...');

    if (mcpProvider) {
        mcpProvider.dispose();
    }

    console.log('✅ MCP Dynamics 365 Extension deactivated successfully');
}
