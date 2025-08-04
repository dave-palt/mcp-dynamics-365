import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import cors from "cors";
import express, { Request, Response } from "express";
import { randomUUID } from "node:crypto";
import { validateAccessToken } from '../auth/token-validator.js';

export async function startHttpTransport(
    server: Server,
    port: number = 3300,
    host: string = 'localhost'
): Promise<void> {
    console.error(`Starting HTTP server on ${host}:${port}...`);

    const app = express();

    // Enable CORS for browser compatibility
    app.use(cors({
        origin: '*',
        exposedHeaders: ['Mcp-Session-Id'],
        allowedHeaders: ['Content-Type', 'mcp-session-id'],
    }));

    app.use(express.json());

    // Map to store transports by session ID
    const transports: { [sessionId: string]: StreamableHTTPServerTransport } = {};

    // Determine if OAuth is enabled
    const oauthEnabled = Boolean(
        process.env.OAUTH_MCP_RESOURCE &&
        process.env.OAUTH_AUTH_URL &&
        process.env.OAUTH_BASE_URL &&
        process.env.OAUTH_JWKS_URL &&
        process.env.OAUTH_TOKEN_URL
    );

    if (oauthEnabled) {
        console.log('MCP HTTP server: OAuth authentication ENABLED');
    } else {
        console.log('MCP HTTP server: OAuth authentication DISABLED');
    }

    // Conditionally add MCP OAuth authentication middleware
    if (oauthEnabled) {
        app.use('/mcp', async (req: Request, res: Response, next) => {
            if (!['POST', 'GET', 'DELETE'].includes(req.method)) return next();
            const authHeader = req.headers['authorization'];
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                res.setHeader('WWW-Authenticate', `Bearer realm="MCP", resource_metadata="/mcp/.well-known/oauth-protected-resource"`);
                return res.status(401).json({
                    jsonrpc: '2.0',
                    error: {
                        code: -32001,
                        message: 'Unauthorized: Missing or invalid access token',
                    },
                    id: null,
                });
            }
            const token = authHeader.slice('Bearer '.length);
            const flow = process.env.OAUTH_FLOW || 'jwt';
            let validationOptions: any = {};
            if (flow === 'jwt') {
                validationOptions.jwksUri = process.env.OAUTH_JWKS_URL;
                validationOptions.expectedAudience = process.env.OAUTH_MCP_RESOURCE;
            } else if (flow === 'opaque') {
                validationOptions.opaqueUserApi = process.env.OAUTH_OPAQUE_USER_API || 'https://api.github.com/user';
            }
            try {
                const result = await validateAccessToken(token, flow, validationOptions);
                if (!result.valid) throw new Error(result.reason || 'Invalid token');
                // Optionally attach user info to request
                (req as any).user = result.payload;
                next();
            } catch (err) {
                res.setHeader('WWW-Authenticate', `Bearer realm="MCP", resource_metadata="/mcp/.well-known/oauth-protected-resource"`);
                return res.status(401).json({
                    jsonrpc: '2.0',
                    error: {
                        code: -32001,
                        message: `Unauthorized: ${err instanceof Error ? err.message : 'Invalid access token'}`,
                    },
                    id: null,
                });
            }
        });
    } else {
        console.warn('MCP OAuth authentication is DISABLED (missing OAUTH_MCP_RESOURCE or OAuth envs)');
    }

    // MCP protected resource metadata endpoint
    app.get('/mcp/.well-known/oauth-protected-resource', (req: Request, res: Response) => {
        if (!oauthEnabled) {
            return res.status(404).json({ error: 'OAuth metadata not available: server is running unauthenticated.' });
        }
        // Per RFC9728, return JSON with authorization_servers field
        res.json({
            resource: process.env.OAUTH_MCP_RESOURCE,
            authorization_servers: [process.env.OAUTH_AUTH_URL],
            issuer: process.env.OAUTH_BASE_URL,
            jwks_uri: process.env.OAUTH_JWKS_URL,
            token_endpoint: process.env.OAUTH_TOKEN_URL,
            response_types_supported: ['code', 'token'],
            grant_types_supported: ['authorization_code', 'client_credentials'],
        });
    });

    // Handle POST requests for client-to-server communication
    app.post('/mcp', async (req: Request, res: Response) => {
        try {
            // Check for existing session ID
            const sessionId = req.headers['mcp-session-id'] as string | undefined;
            let transport: StreamableHTTPServerTransport;

            if (sessionId && transports[sessionId]) {
                // Reuse existing transport
                transport = transports[sessionId];
            } else if (!sessionId && req.body?.method === 'initialize') {
                // New initialization request
                const isLocalDevelopment = host === 'localhost' || host === '127.0.0.1';
                const isWildcardBinding = host === '0.0.0.0';

                transport = new StreamableHTTPServerTransport({
                    sessionIdGenerator: () => randomUUID(),
                    onsessioninitialized: (sessionId) => {
                        // Store the transport by session ID
                        transports[sessionId] = transport;
                    },
                    // Disable DNS rebinding protection for localhost and wildcard binding
                    // Enable only for specific remote hosts
                    enableDnsRebindingProtection: !isLocalDevelopment && !isWildcardBinding,
                    allowedHosts: (!isLocalDevelopment && !isWildcardBinding) ? [host, `${host}:${port}`] : undefined,
                });

                // Clean up transport when closed
                transport.onclose = () => {
                    if (transport.sessionId) {
                        delete transports[transport.sessionId];
                    }
                };

                // Connect the MCP server to this transport
                await server.connect(transport);
            } else {
                // Invalid request
                res.status(400).json({
                    jsonrpc: '2.0',
                    error: {
                        code: -32000,
                        message: 'Bad Request: No valid session ID provided',
                    },
                    id: null,
                });
                return;
            }

            // Handle the request
            await transport.handleRequest(req, res, req.body);
        } catch (error) {
            console.error('Error handling MCP request:', error);
            if (!res.headersSent) {
                res.status(500).json({
                    jsonrpc: '2.0',
                    error: {
                        code: -32603,
                        message: 'Internal server error',
                    },
                    id: null,
                });
            }
        }
    });

    // Handle GET requests for server-to-client notifications via SSE
    app.get('/mcp', async (req: Request, res: Response) => {
        const sessionId = req.headers['mcp-session-id'] as string | undefined;
        if (!sessionId || !transports[sessionId]) {
            res.status(400).send('Invalid or missing session ID');
            return;
        }

        const transport = transports[sessionId];
        await transport.handleRequest(req, res);
    });

    // Handle DELETE requests for session termination
    app.delete('/mcp', async (req: Request, res: Response) => {
        const sessionId = req.headers['mcp-session-id'] as string | undefined;
        if (!sessionId || !transports[sessionId]) {
            res.status(400).send('Invalid or missing session ID');
            return;
        }

        const transport = transports[sessionId];
        await transport.handleRequest(req, res);
    });

    // Start the HTTP server
    app.listen(port, host, () => {
        console.error(`HTTP server running on http://${host}:${port}`);
    });
}
