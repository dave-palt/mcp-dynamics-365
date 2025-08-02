import { ChildProcess, spawn } from 'child_process';
import { ConfigurationHelper } from '../utils/config.js';
import { EnvironmentDetector, EnvironmentInfo } from '../utils/environment.js';
import { OutputChannelLogger } from '../utils/logging.js';

export interface ServerInstance {
    process: ChildProcess;
    port: number;
    host: string;
    startTime: Date;
}

export class Dynamics365McpServerProvider {
    private outputChannel: OutputChannelLogger;
    private httpServer: ServerInstance | null = null;
    private stdioServer: ChildProcess | null = null;
    private environment: EnvironmentInfo;

    constructor() {
        this.outputChannel = new OutputChannelLogger('MCP Dynamics 365');
        this.environment = EnvironmentDetector.detect();

        this.outputChannel.info('🚀 MCP Dynamics 365 Provider initialized');
        this.logEnvironmentInfo();
    }

    private logEnvironmentInfo(): void {
        const help = EnvironmentDetector.getConfigurationHelp(this.environment);
        help.forEach(line => this.outputChannel.info(line));
    }

    async startHttpServer(port?: number, host?: string): Promise<boolean> {
        if (this.httpServer) {
            this.outputChannel.warning('HTTP server is already running');
            return true;
        }

        const actualPort = port || ConfigurationHelper.getHttpPort();
        const actualHost = host || ConfigurationHelper.getHttpHost();

        try {
            this.outputChannel.info(`🌐 Starting HTTP server on ${actualHost}:${actualPort}...`);

            const serverProcess = await this.spawnServerProcess([`--transport=http`, `--port=${actualPort}`, `--host=${actualHost}`]);

            this.httpServer = {
                process: serverProcess,
                port: actualPort,
                host: actualHost,
                startTime: new Date()
            };

            this.setupProcessHandlers(serverProcess, 'HTTP');

            this.outputChannel.success(`✅ HTTP server started successfully on ${actualHost}:${actualPort}`);
            return true;
        } catch (error) {
            this.outputChannel.error(`Failed to start HTTP server: ${error}`);
            return false;
        }
    }

    async stopHttpServer(): Promise<boolean> {
        if (!this.httpServer) {
            this.outputChannel.warning('No HTTP server is running');
            return true;
        }

        try {
            this.outputChannel.info('🛑 Stopping HTTP server...');

            this.httpServer.process.kill('SIGTERM');

            // Wait for graceful shutdown
            await new Promise<void>((resolve) => {
                const timeout = setTimeout(() => {
                    if (this.httpServer) {
                        this.httpServer.process.kill('SIGKILL');
                    }
                    resolve();
                }, 5000);

                this.httpServer!.process.on('exit', () => {
                    clearTimeout(timeout);
                    resolve();
                });
            });

            this.httpServer = null;
            this.outputChannel.success('✅ HTTP server stopped successfully');
            return true;
        } catch (error) {
            this.outputChannel.error(`Failed to stop HTTP server: ${error}`);
            return false;
        }
    }

    async restartHttpServer(): Promise<boolean> {
        const wasRunning = this.httpServer !== null;
        const port = this.httpServer?.port;
        const host = this.httpServer?.host;

        if (wasRunning) {
            await this.stopHttpServer();
        }

        return await this.startHttpServer(port, host);
    }

    async startStdioServer(): Promise<boolean> {
        if (this.stdioServer) {
            this.outputChannel.warning('Stdio server is already running');
            return true;
        }

        try {
            this.outputChannel.info('📡 Starting stdio server...');

            const serverProcess = await this.spawnServerProcess([]);
            this.stdioServer = serverProcess;

            this.setupProcessHandlers(serverProcess, 'stdio');

            this.outputChannel.success('✅ Stdio server started successfully');
            return true;
        } catch (error) {
            this.outputChannel.error(`Failed to start stdio server: ${error}`);
            return false;
        }
    }

    async stopStdioServer(): Promise<boolean> {
        if (!this.stdioServer) {
            this.outputChannel.warning('No stdio server is running');
            return true;
        }

        try {
            this.outputChannel.info('🛑 Stopping stdio server...');

            this.stdioServer.kill('SIGTERM');

            await new Promise<void>((resolve) => {
                const timeout = setTimeout(() => {
                    if (this.stdioServer) {
                        this.stdioServer.kill('SIGKILL');
                    }
                    resolve();
                }, 5000);

                this.stdioServer!.on('exit', () => {
                    clearTimeout(timeout);
                    resolve();
                });
            });

            this.stdioServer = null;
            this.outputChannel.success('✅ Stdio server stopped successfully');
            return true;
        } catch (error) {
            this.outputChannel.error(`Failed to stop stdio server: ${error}`);
            return false;
        }
    }

    private async spawnServerProcess(args: string[]): Promise<ChildProcess> {
        const { command, serverArgs } = this.getServerCommand();

        this.outputChannel.debug(`Spawning process: ${command} ${[...serverArgs, ...args].join(' ')}`);

        const serverProcess = spawn(command, [...serverArgs, ...args], {
            cwd: this.environment.workspacePath,
            env: { ...process.env }
        });

        return serverProcess;
    }

    private getServerCommand(): { command: string; serverArgs: string[] } {
        if (this.environment.isLocal && this.environment.serverPath) {
            // Use local development server
            if (this.environment.serverPath.endsWith('.ts')) {
                return {
                    command: 'tsx',
                    serverArgs: [this.environment.serverPath]
                };
            } else {
                return {
                    command: 'node',
                    serverArgs: [this.environment.serverPath]
                };
            }
        } else {
            // Use globally installed server
            return {
                command: 'mcp-dynamics365-server',
                serverArgs: []
            };
        }
    } private setupProcessHandlers(process: ChildProcess, type: string): void {
        process.stdout?.on('data', (data) => {
            this.outputChannel.log(`[${type} stdout] ${data.toString().trim()}`);
        });

        process.stderr?.on('data', (data) => {
            this.outputChannel.log(`[${type} stderr] ${data.toString().trim()}`);
        });

        process.on('error', (error) => {
            this.outputChannel.error(`[${type} error] ${error.message}`);
        });

        process.on('exit', (code, signal) => {
            if (code === 0) {
                this.outputChannel.info(`[${type}] Process exited successfully`);
            } else {
                this.outputChannel.error(`[${type}] Process exited with code ${code}, signal ${signal}`);
            }

            // Clean up references
            if (type === 'HTTP') {
                this.httpServer = null;
            } else if (type === 'stdio') {
                this.stdioServer = null;
            }
        });
    }

    getStatus(): { httpServer: ServerInstance | null; stdioServer: ChildProcess | null } {
        return {
            httpServer: this.httpServer,
            stdioServer: this.stdioServer
        };
    }

    showOutput(): void {
        this.outputChannel.show();
    }

    dispose(): void {
        this.stopHttpServer();
        this.stopStdioServer();
        this.outputChannel.dispose();
    }
}
