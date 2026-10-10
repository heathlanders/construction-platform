// auth.ts — JWT validation middleware + RBAC helpers
// See: .claude/skills/auth/SKILL.md
// Locked decisions: A-05, T-07, T-09, T-11

import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';
import { redis } from '../lib/redis.js';

// ─── JWT payload types ────────────────────────────────────────────────────────

export interface JWTPayload {
  jti: string;
  user_id: string;
  tenant_id: string;
  role: UserRole;
  email: string;
  preferred_language: 'en' | 'es';
  iat: number;
  exp: number;
}

export interface SuperAdminJWTPayload {
  jti: string;
  admin_id: string;
  role: 'SUPER_ADMIN';
  tenant_id: 'PLATFORM';
  exp: number;
}

export type UserRole =
  | 'OWNER'
  | 'PROJECT_MANAGER'
  | 'ESTIMATOR'
  | 'FOREMAN'
  | 'FIELD_TECH'
  | 'ACCOUNTANT'
  | 'SAFETY_OFFICER'
  | 'CLIENT_PORTAL'
  | 'SUB_PORTAL'
  | 'HOMEOWNER_PORTAL';

// Extend Fastify request with JWT context
declare module 'fastify' {
  interface FastifyRequest {
    jwt: JWTPayload;
  }
}

// ─── Standard tenant JWT middleware ──────────────────────────────────────────

/**
 * Validate JWT and attach req.jwt.
 * Rejects missing User-Agent (T-11), missing/invalid/revoked tokens.
 */
/**
 * T-11 for PUBLIC routes (no bearer token): User-Agent required. requireAuth already does this for
 * authenticated routes; use this as the preHandler on unauthenticated endpoints (magic-link exchange…).
 */
export async function requireUserAgent(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  if (!req.headers['user-agent']?.trim()) {
    return reply.status(400).send({
      error: { code: 'MISSING_USER_AGENT', message: 'User-Agent header is required' },
    });
  }
}

export async function requireAuth(
  req: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  // T-11: User-Agent required on all requests (empty string treated as missing)
  if (!req.headers['user-agent']?.trim()) {
    return reply.status(400).send({
      error: { code: 'MISSING_USER_AGENT', message: 'User-Agent header is required' },
    });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return reply.status(401).send({
      error: { code: 'UNAUTHORIZED', message: 'Missing bearer token' },
    });
  }

  const token = authHeader.slice(7);
  let payload: JWTPayload;

  try {
    payload = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
  } catch {
    return reply.status(401).send({
      error: { code: 'TOKEN_INVALID', message: 'Invalid or expired token' },
    });
  }

  // One round trip: jti blacklist (logout) + "not valid before" markers written when the user is
  // deactivated / suspended / re-roled or the tenant is suspended. Without the markers a JWT stays
  // valid for its full life (24h web / 30d mobile) after the account it belongs to was shut off.
  const [isRevoked, userNbf, tenantNbf] = await redis.mget(
    `blacklist:jti:${payload.jti}`,
    userNbfKey(payload.user_id),
    tenantNbfKey(payload.tenant_id),
  );
  if (isRevoked) {
    return reply.status(401).send({
      error: { code: 'TOKEN_REVOKED', message: 'Token has been revoked' },
    });
  }
  // `<=`, fail-closed: iat and the marker are whole seconds, so a token minted in the same second
  // as the revoke is indistinguishable from one minted just before it. Rejecting it costs at most
  // one re-login; accepting it would leave a stolen token alive past the revoke.
  const iat = payload.iat ?? 0;
  if (tenantNbf && iat <= Number(tenantNbf)) {
    return reply.status(401).send({
      error: { code: 'TENANT_SUSPENDED', message: 'Your organization’s access has been suspended' },
    });
  }
  if (userNbf && iat <= Number(userNbf)) {
    return reply.status(401).send({
      error: { code: 'SESSION_REVOKED', message: 'Your session is no longer valid — please sign in again' },
    });
  }

  req.jwt = payload;
}

// ─── RBAC ─────────────────────────────────────────────────────────────────────

/**
 * Returns a preHandler that rejects requests from roles not in the allow list.
 *
 * Usage: preHandler: [requireAuth, requireRole('OWNER', 'PROJECT_MANAGER')]
 */
export function requireRole(...roles: UserRole[]) {
  return async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
    if (!roles.map(r => r.toUpperCase()).includes(req.jwt.role.toUpperCase())) {
      return reply.status(403).send({
        error: { code: 'FORBIDDEN', message: 'Insufficient permissions' },
      });
    }
  };
}

// ─── Super admin JWT ──────────────────────────────────────────────────────────

/**
 * Validate super admin JWT.
 * Requires role = 'SUPER_ADMIN' and tenant_id = 'PLATFORM'.
 * See: docs/SuperAdmin_Operations_v1_0.md §1
 */
export async function requireSuperAdmin(
  req: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  if (!req.headers['user-agent']?.trim()) {
    return reply.status(400).send({
      error: { code: 'MISSING_USER_AGENT', message: 'User-Agent header is required' },
    });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return reply.status(401).send({
      error: { code: 'UNAUTHORIZED', message: 'Missing bearer token' },
    });
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as SuperAdminJWTPayload;

    if (payload.role !== 'SUPER_ADMIN' || payload.tenant_id !== 'PLATFORM') {
      return reply.status(403).send({
        error: { code: 'FORBIDDEN', message: 'Super admin access required' },
      });
    }

    const isRevoked = await redis.get(`blacklist:jti:${payload.jti}`);
    if (isRevoked) {
      return reply.status(401).send({
        error: { code: 'TOKEN_REVOKED', message: 'Token has been revoked' },
      });
    }

    // Attach the decoded super-admin payload so handlers can read admin_id for audit actor.
    // (req.jwt is typed as the tenant JWTPayload; the super-admin payload carries admin_id +
    // tenant_id='PLATFORM'. Cast through unknown — handlers read admin_id ?? user_id.)
    req.jwt = payload as unknown as JWTPayload;
  } catch {
    return reply.status(401).send({
      error: { code: 'TOKEN_INVALID', message: 'Invalid or expired token' },
    });
  }
}

// ─── Token helpers ────────────────────────────────────────────────────────────

/**
 * Issue a JWT for a tenant user.
 */
export function issueToken(
  user: {
    id: string;
    tenantId: string;
    role: UserRole;
    email: string;
    languagePreference: string;
  },
  platform: 'web' | 'mobile'
): string {
  const expirySeconds =
    platform === 'web'
      ? parseInt(process.env.JWT_EXPIRY_WEB ?? '86400', 10)
      : parseInt(process.env.JWT_EXPIRY_MOBILE ?? '2592000', 10);

  return jwt.sign(
    {
      jti: randomUUID(),  // from node:crypto (top-level import)
      user_id: user.id,
      tenant_id: user.tenantId,
      role: (user.role.toUpperCase()) as UserRole,
      email: user.email,
      preferred_language: user.languagePreference === 'es' ? 'es' : 'en',
    } satisfies Omit<JWTPayload, 'iat' | 'exp'>,
    process.env.JWT_SECRET!,
    { expiresIn: expirySeconds }
  );
}

/**
 * Issue a platform-scope JWT for a super admin.
 * Shape matches SuperAdminJWTPayload (role 'SUPER_ADMIN', tenant_id 'PLATFORM') so
 * requireSuperAdmin accepts it. tenant_id is the literal 'PLATFORM' — never a tenant UUID —
 * which returns zero rows from every RLS table (T-52: no superadmin bypass).
 */
export function issueSuperAdminToken(adminId: string, email: string): string {
  const expirySeconds = parseInt(process.env.JWT_EXPIRY_ADMIN ?? '86400', 10); // 24h default

  return jwt.sign(
    {
      jti: randomUUID(),
      admin_id: adminId,
      role: 'SUPER_ADMIN',
      tenant_id: 'PLATFORM',
      email,
    },
    process.env.JWT_SECRET!,
    { expiresIn: expirySeconds }
  );
}

/**
 * Revoke a JWT by adding its jti to the Redis blacklist.
 * TTL matches remaining token lifetime.
 */
export async function revokeToken(jti: string, exp: number): Promise<void> {
  const ttl = exp - Math.floor(Date.now() / 1000);
  if (ttl > 0) {
    await redis.set(`blacklist:jti:${jti}`, '1', 'EX', ttl);
  }
}

// ─── Session invalidation (user / tenant) ─────────────────────────────────────
// Tokens issued BEFORE the marker are rejected; tokens issued after (a fresh login once the
// account is usable again) pass. TTL outlives the longest token (30d mobile).

const NBF_TTL_SECONDS = 31 * 24 * 3600;
const userNbfKey = (userId: string) => `auth:nbf:user:${userId}`;
const tenantNbfKey = (tenantId: string) => `auth:nbf:tenant:${tenantId}`;

/** Invalidate every outstanding token for a user (deactivate, suspend, role change, migration). */
export async function revokeUserSessions(userId: string): Promise<void> {
  await redis.set(userNbfKey(userId), String(Math.floor(Date.now() / 1000)), 'EX', NBF_TTL_SECONDS);
}

/** Invalidate every outstanding token in a tenant (tenant suspended). */
export async function revokeTenantSessions(tenantId: string): Promise<void> {
  await redis.set(tenantNbfKey(tenantId), String(Math.floor(Date.now() / 1000)), 'EX', NBF_TTL_SECONDS);
}

// ─── Locale resolution (T-09) ─────────────────────────────────────────────────

/**
 * Resolve request locale.
 * Order: JWT preferred_language → Accept-Language header → 'en'
 */
export function resolveLocale(req: FastifyRequest): 'en' | 'es' {
  if (req.jwt?.preferred_language) return req.jwt.preferred_language;
  const accept = req.headers['accept-language'];
  if (accept?.startsWith('es')) return 'es';
  return 'en';
}
