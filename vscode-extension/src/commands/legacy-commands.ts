import * as vscode from 'vscode';
import { Dynamics365McpServerProvider } from '../providers/mcp-server-provider.js';

export class LegacyCommands {
    constructor(private provider: Dynamics365McpServerProvider) { }

    async startServer(): Promise<void> {
        const success = await this.provider.startStdioServer();

        if (success) {
            vscode.window.showInformationMessage('📡 MCP Dynamics 365 Server started (stdio mode)');
            this.provider.showOutput();
        } else {
            vscode.window.showErrorMessage('Failed to start MCP server. Check output for details.');
        }
    }

    async stopServer(): Promise<void> {
        const success = await this.provider.stopStdioServer();

        if (success) {
            vscode.window.showInformationMessage('🛑 MCP Dynamics 365 Server stopped');
        } else {
            vscode.window.showErrorMessage('Failed to stop MCP server. Check output for details.');
        }
    }

    async restartServer(): Promise<void> {
        await this.provider.stopStdioServer();
        const success = await this.provider.startStdioServer();

        if (success) {
            vscode.window.showInformationMessage('🔄 MCP Dynamics 365 Server restarted (stdio mode)');
            this.provider.showOutput();
        } else {
            vscode.window.showErrorMessage('Failed to restart MCP server. Check output for details.');
        }
    }
}
