import axios from 'axios';
import jwt, { JwtPayload } from 'jsonwebtoken';
import jwkToPem from 'jwk-to-pem';

// Cache interface for storing requests with expiry
interface CacheEntry {
    data: any;
    expiry: number;
}

// In-memory cache for JWKS and user API responses
const cache = new Map<string, CacheEntry>();

// Cache duration: configurable via environment variable (default: 24 hours)
const OAUTH_TOKEN_CACHE_DURATION_MS = parseInt(process.env.OAUTH_TOKEN_CACHE_DURATION_MS || '86400000');

function getCachedData(key: string): any | null {
    const entry = cache.get(key);
    if (entry && Date.now() < entry.expiry) {
        return entry.data;
    }
    // Remove expired entry
    if (entry) {
        cache.delete(key);
    }
    return null;
}

function setCachedData(key: string, data: any): void {
    cache.set(key, {
        data,
        expiry: Date.now() + OAUTH_TOKEN_CACHE_DURATION_MS
    });
}

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
            // Fetch JWKS with caching
            const jwksUri = options.jwksUri;
            if (!jwksUri) return { valid: false, reason: 'Missing JWKS URI' };

            let jwksData = getCachedData(`jwks:${jwksUri}`);
            if (!jwksData) {
                const jwksResp = await axios.get(jwksUri);
                jwksData = jwksResp.data;
                setCachedData(`jwks:${jwksUri}`, jwksData);
            }

            const keys = jwksData.keys || [];
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
        // Generic opaque token validation via user info endpoint with caching
        try {
            const apiUrl = options.opaqueUserApi || 'https://api.github.com/user'; // Default to GitHub, but can be any provider
            const cacheKey = `opaque:${apiUrl}:${token}`;

            let userData = getCachedData(cacheKey);
            if (!userData) {
                const resp = await axios.get(apiUrl, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (resp.status === 200) {
                    userData = resp.data;
                    setCachedData(cacheKey, userData);
                } else {
                    return { valid: false, reason: `Opaque token validation failed: ${resp.status}` };
                }
            }

            return { valid: true, payload: userData };
        } catch (err) {
            return { valid: false, reason: err instanceof Error ? err.message : 'Opaque token validation error' };
        }
    }
    return { valid: false, reason: 'Unsupported flow' };
}
