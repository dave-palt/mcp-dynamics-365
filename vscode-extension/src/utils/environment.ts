import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

export interface EnvironmentInfo {
    isProduction: boolean;
    isLocal: boolean;
    serverPath?: string;
    workspacePath?: string;
    hasPackageJson: boolean;
    hasEnvFile: boolean;
}

export class EnvironmentDetector {
    static detect(): EnvironmentInfo {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        const workspacePath = workspaceFolders?.[0]?.uri.fsPath;

        if (!workspacePath) {
            return {
                isProduction: true,
                isLocal: false,
                hasPackageJson: false,
                hasEnvFile: false
            };
        }

        const packageJsonPath = path.join(workspacePath, 'package.json');
        const envFilePath = path.join(workspacePath, '.env');
        const hasPackageJson = fs.existsSync(packageJsonPath);
        const hasEnvFile = fs.existsSync(envFilePath);

        // Check if this is a local development environment
        let isLocal = false;
        let serverPath: string | undefined;

        if (hasPackageJson) {
            try {
                const packageJsonContent = fs.readFileSync(packageJsonPath, 'utf8');
                const packageJson = JSON.parse(packageJsonContent);

                // Check if this is the MCP Dynamics 365 project
                if (packageJson.name?.includes('mcp-dynamics365') ||
                    packageJson.name?.includes('dynamics365')) {
                    isLocal = true;

                    // Try to find the built server
                    const possiblePaths = [
                        path.join(workspacePath, 'dist', 'index.js'),
                        path.join(workspacePath, 'lib', 'index.js'),
                        path.join(workspacePath, 'build', 'index.js'),
                        path.join(workspacePath, 'src', 'index.ts') // For development
                    ];

                    for (const possiblePath of possiblePaths) {
                        if (fs.existsSync(possiblePath)) {
                            serverPath = possiblePath;
                            break;
                        }
                    }
                }
            } catch (error) {
                // Invalid package.json, treat as production
            }
        }

        return {
            isProduction: !isLocal,
            isLocal,
            serverPath,
            workspacePath,
            hasPackageJson,
            hasEnvFile
        };
    }

    static getRecommendedPort(env: EnvironmentInfo): number {
        // Use different default ports for local vs production
        return env.isLocal ? 3301 : 3300;
    }

    static getServerDisplayName(env: EnvironmentInfo): string {
        return env.isLocal ? 'Local Development Server' : 'MCP Dynamics 365 Server';
    }

    static getConfigurationHelp(env: EnvironmentInfo): string[] {
        const help: string[] = [];

        if (env.isLocal) {
            help.push('🔧 Local development environment detected');
            if (env.serverPath) {
                help.push(`📁 Server found at: ${env.serverPath}`);
            } else {
                help.push('⚠️ Server executable not found. Make sure to build the project first.');
            }
            if (!env.hasEnvFile) {
                help.push('📝 Create a .env file with your Dynamics 365 configuration');
            }
        } else {
            help.push('🌐 Production environment detected');
            help.push('📦 Make sure the MCP Dynamics 365 server is installed globally');
        }

        return help;
    }
}
