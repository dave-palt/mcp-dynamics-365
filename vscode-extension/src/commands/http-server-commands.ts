import * as vscode from 'vscode';
import { Dynamics365McpServerProvider } from '../providers/mcp-server-provider.js';
import { ConfigurationHelper } from '../utils/config.js';
import { EnvironmentDetector } from '../utils/environment.js';

export class HttpServerCommands {
    constructor(private provider: Dynamics365McpServerProvider) { }

    async startLocalHttpServer(): Promise<void> {
        const environment = EnvironmentDetector.detect();

        if (!environment.isLocal) {
            vscode.window.showWarningMessage(
                'This command is for local development only. Use "Start HTTP Server" for production.'
            );
            return;
        }

        const port = EnvironmentDetector.getRecommendedPort(environment);
        const success = await this.provider.startHttpServer(port);

        if (success) {
            vscode.window.showInformationMessage(
                `🚀 Local MCP server started on http://localhost:${port}`
            );
            this.provider.showOutput();
        } else {
            vscode.window.showErrorMessage('Failed to start local HTTP server. Check output for details.');
        }
    }

    async startProductionHttpServer(): Promise<void> {
        const port = await vscode.window.showInputBox({
            prompt: 'Enter port number for HTTP server',
            value: ConfigurationHelper.getHttpPort().toString(),
            validateInput: (value) => {
                const num = parseInt(value);
                if (isNaN(num) || num < 1 || num > 65535) {
                    return 'Please enter a valid port number (1-65535)';
                }
                return null;
            }
        });

        if (!port) return;

        const host = await vscode.window.showInputBox({
            prompt: 'Enter host address (leave empty for localhost)',
            value: ConfigurationHelper.getHttpHost(),
            placeHolder: 'localhost'
        });

        const actualPort = parseInt(port);
        const actualHost = host || 'localhost';

        // Save configuration
        await ConfigurationHelper.setHttpPort(actualPort);
        await ConfigurationHelper.setHttpHost(actualHost);

        const success = await this.provider.startHttpServer(actualPort, actualHost);

        if (success) {
            vscode.window.showInformationMessage(
                `🌐 MCP HTTP server started on http://${actualHost}:${actualPort}`
            );
            this.provider.showOutput();
        } else {
            vscode.window.showErrorMessage('Failed to start HTTP server. Check output for details.');
        }
    }

    async stopHttpServer(): Promise<void> {
        const success = await this.provider.stopHttpServer();

        if (success) {
            vscode.window.showInformationMessage('🛑 HTTP server stopped');
        } else {
            vscode.window.showErrorMessage('Failed to stop HTTP server. Check output for details.');
        }
    }

    async restartHttpServer(): Promise<void> {
        const success = await this.provider.restartHttpServer();

        if (success) {
            vscode.window.showInformationMessage('🔄 HTTP server restarted');
            this.provider.showOutput();
        } else {
            vscode.window.showErrorMessage('Failed to restart HTTP server. Check output for details.');
        }
    }

    async showServerStatus(): Promise<void> {
        const status = this.provider.getStatus();

        let message = '📊 Server Status:\n\n';

        if (status.httpServer) {
            const uptime = Math.floor((Date.now() - status.httpServer.startTime.getTime()) / 1000);
            message += `🌐 HTTP Server: Running\n`;
            message += `   Host: ${status.httpServer.host}\n`;
            message += `   Port: ${status.httpServer.port}\n`;
            message += `   Uptime: ${uptime}s\n`;
        } else {
            message += `🌐 HTTP Server: Stopped\n`;
        }

        message += '\n';

        if (status.stdioServer) {
            message += `📡 Stdio Server: Running\n`;
        } else {
            message += `📡 Stdio Server: Stopped\n`;
        }

        const panel = vscode.window.createWebviewPanel(
            'mcpServerStatus',
            'MCP Server Status',
            vscode.ViewColumn.One,
            {}
        );

        panel.webview.html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MCP Server Status</title>
    <style>
        body { 
            font-family: var(--vscode-font-family); 
            color: var(--vscode-foreground);
            padding: 20px;
        }
        pre { 
            background: var(--vscode-textCodeBlock-background); 
            padding: 10px; 
            border-radius: 4px;
            white-space: pre-wrap;
        }
        .status-running { color: #4CAF50; }
        .status-stopped { color: #f44336; }
    </style>
</head>
<body>
    <h1>MCP Dynamics 365 Server Status</h1>
    <pre>${message}</pre>
    <button onclick="refresh()">🔄 Refresh</button>
    <script>
        function refresh() {
            location.reload();
        }
    </script>
</body>
</html>`;
    }
}
