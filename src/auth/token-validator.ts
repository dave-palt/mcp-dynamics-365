import axios from 'axios';
import jwt, { JwtPayload } from 'jsonwebtoken';
import jwkToPem from 'jwk-to-pem';

export async function validateAccessToken(token: string, flow: string, options: {
    expectedAudience?: string;
    jwksUri?: string;
    opaqueUserApi?: string;
} = {}): Promise<{ valid: boolean; reason?: string; payload?: any }> {
    if (flow === 'jwt') {
        try {
            // Decode header to get kid
            const decodedHeader = jwt.decode(token, { complete: true });
            if (!decodedHeader || typeof decodedHeader !== 'object') return { valid: false, reason: 'Invalid token' };
            const kid = decodedHeader.header?.kid;
            // Fetch JWKS
            const jwksUri = options.jwksUri;
            if (!jwksUri) return { valid: false, reason: 'Missing JWKS URI' };
            // Simple in-memory JWKS cache (expires after 1 day)
            const jwksCache: { [uri: string]: { keys: any[]; fetchedAt: number } } = (globalThis as any).__jwksCache || {};
            const now = Date.now();
            let keys: any[] = [];
            if (
                jwksCache[jwksUri] &&
                (now - jwksCache[jwksUri].fetchedAt) < 24 * 60 * 60 * 1000 // 1 day
            ) {
                keys = jwksCache[jwksUri].keys;
            } else {
                const jwksResp = await axios.get(jwksUri);
                keys = jwksResp.data.keys || [];
                jwksCache[jwksUri] = { keys, fetchedAt: now };
                (globalThis as any).__jwksCache = jwksCache;
            }
            const keys = jwksResp.data.keys || [];
            const jwk = keys.find((k: any) => k.kid === kid);
            if (!jwk) return { valid: false, reason: 'No matching JWK found for kid' };
            const pem = jwkToPem(jwk);
            // Verify JWT signature
            const payload = jwt.verify(token, pem, { algorithms: ['RS256'] }) as JwtPayload;
            // Check expiry
            if (payload.exp && Date.now() / 1000 > payload.exp) return { valid: false, reason: 'Token expired' };
            // Check audience
            if (options.expectedAudience && payload.aud !== options.expectedAudience) return { valid: false, reason: 'Token audience mismatch' };
            return { valid: true, payload };
        } catch (err) {
            return { valid: false, reason: err instanceof Error ? err.message : 'JWT validation error' };
        }
    } else if (flow === 'opaque') {
        // Generic opaque token validation via user info endpoint
        try {
            const apiUrl = options.opaqueUserApi || 'https://api.github.com/user'; // Default to GitHub, but can be any provider
            const resp = await axios.get(apiUrl, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (resp.status === 200) {
                return { valid: true, payload: resp.data };
            } else {
                return { valid: false, reason: `Opaque token validation failed: ${resp.status}` };
            }
        } catch (err) {
            return { valid: false, reason: err instanceof Error ? err.message : 'Opaque token validation error' };
        }
    }
    return { valid: false, reason: 'Unsupported flow' };
}
