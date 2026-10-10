# Auth Skill
**Locked decisions: A-05, T-07, T-09, T-11**

## JWT structure (A-05)
```typescript
interface JWTPayload {
  jti: string;       // unique token ID — checked against Redis blacklist
  user_id: string;   // UUID
  tenant_id: string; // UUID — used to set RLS context
  role: UserRole;    // from UserRole enum
  email: string;     // denormalized for audit log
  preferred_language: 'en' | 'es';
  iat: number;
  exp: number;
}
```

## Token expiry
- Web: 24 hours (`JWT_EXPIRY_WEB=86400`)
- Mobile: 30 days (`JWT_EXPIRY_MOBILE=2592000`)

## Issuing a token

```typescript
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';

async function issueToken(user: User, platform: 'web' | 'mobile'): Promise<string> {
  const expirySeconds = platform === 'web'
    ? parseInt(process.env.JWT_EXPIRY_WEB)
    : parseInt(process.env.JWT_EXPIRY_MOBILE);

  return jwt.sign(
    {
      jti: randomUUID(),
      user_id: user.id,
      tenant_id: user.tenantId,
      role: user.role,
      email: user.email,
      preferred_language: user.languagePreference,
    } satisfies Omit<JWTPayload, 'iat' | 'exp'>,
    process.env.JWT_SECRET,
    { expiresIn: expirySeconds }
  );
}
```

## JWT validation middleware (Fastify)

```typescript
import fp from 'fastify-plugin';
import jwt from 'jsonwebtoken';

export const requireJwt = fp(async (fastify) => {
  fastify.addHook('preHandler', async (req, reply) => {
    // T-11: User-Agent required on all requests
    if (!req.headers['user-agent']) {
      return reply.status(400).send({
        error: { code: 'MISSING_USER_AGENT', message: 'User-Agent header is required' }
      });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return reply.status(401).send({
        error: { code: 'UNAUTHORIZED', message: 'Missing bearer token' }
      });
    }

    const token = authHeader.slice(7);
    let payload: JWTPayload;

    try {
      payload = jwt.verify(token, process.env.JWT_SECRET) as JWTPayload;
    } catch {
      return reply.status(401).send({
        error: { code: 'TOKEN_INVALID', message: 'Invalid or expired token' }
      });
    }

    // Check Redis blacklist (revoked tokens)
    const isRevoked = await redis.get(`blacklist:jti:${payload.jti}`);
    if (isRevoked) {
      return reply.status(401).send({
        error: { code: 'TOKEN_REVOKED', message: 'Token has been revoked' }
      });
    }

    // Attach to request context
    req.jwt = payload;
  });
});
```

## Token revocation (logout / forced invalidation)

```typescript
async function revokeToken(jti: string, expiresAt: number): Promise<void> {
  const ttlSeconds = expiresAt - Math.floor(Date.now() / 1000);
  if (ttlSeconds > 0) {
    // Keep in blacklist until natural expiry — no need to keep after expiry
    await redis.set(`blacklist:jti:${jti}`, '1', 'EX', ttlSeconds);
  }
}

// POST /v1/auth/logout
fastify.post('/v1/auth/logout', { preHandler: [requireJwt] }, async (req, reply) => {
  await revokeToken(req.jwt.jti, req.jwt.exp);
  return reply.status(204).send();
});
```

## Role-based access control

```typescript
// Middleware factory — use in route definitions
function requireRole(...roles: UserRole[]) {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    if (!roles.includes(req.jwt.role)) {
      return reply.status(403).send({
        error: { code: 'FORBIDDEN', message: 'Insufficient permissions' }
      });
    }
  };
}

// Usage
fastify.delete('/v1/projects/:id', {
  preHandler: [requireJwt, requireRole('OWNER', 'PROJECT_MANAGER')],
}, handler);
```

## Locale resolution (T-09)

```typescript
function resolveLocale(req: FastifyRequest): 'en' | 'es' {
  // 1. JWT preferred_language (user's saved preference — always wins)
  if (req.jwt?.preferred_language) return req.jwt.preferred_language;

  // 2. Accept-Language header
  const acceptLang = req.headers['accept-language'];
  if (acceptLang?.startsWith('es')) return 'es';

  // 3. Default
  return 'en';
}
```

## Mobile token storage (T-07)
JWT tokens on mobile MUST be stored in device Keychain (iOS) or Keystore (Android).
AsyncStorage is unencrypted — prohibited for token storage.

```typescript
// React Native — use expo-secure-store, not AsyncStorage
import * as SecureStore from 'expo-secure-store';

await SecureStore.setItemAsync('jwt_token', token);
const token = await SecureStore.getItemAsync('jwt_token');
```
