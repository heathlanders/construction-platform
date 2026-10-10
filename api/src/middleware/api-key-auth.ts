// api-key-auth.ts — Alternative auth via X-API-Key header (Enterprise only)
// Used as a preHandler before routes that support API key access.
// Falls through (no-op) if header is absent — JWT auth remains primary.

import { FastifyRequest, FastifyReply } from 'fastify';
import { pgPool } from '../lib/db.js';
import { verifyApiKey } from '../routes/v1/api-keys.js';

export async function apiKeyAuth(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const apiKey = req.headers['x-api-key'] as string | undefined;
  if (!apiKey) return; // no API key — let JWT auth handle it

  const prefix = apiKey.substring(0, 16);

  const { rows } = await pgPool.query(
    `SELECT id, tenant_id, key_hash, created_by FROM api_keys
     WHERE key_prefix = $1 AND revoked_at IS NULL`,
    [prefix]
  );

  if (rows.length === 0) {
    return reply.status(401).send({ error: { code: 'INVALID_API_KEY', message: 'Invalid or revoked API key' } });
  }

  // Verify hash — there could theoretically be prefix collisions (extremely rare)
  let matched: (typeof rows)[0] | null = null;
  for (const row of rows) {
    if (await verifyApiKey(apiKey, row.key_hash)) {
      matched = row;
      break;
    }
  }

  if (!matched) {
    return reply.status(401).send({ error: { code: 'INVALID_API_KEY', message: 'Invalid or revoked API key' } });
  }

  // Update last_used_at async — do not block the request path
  pgPool.query(`UPDATE api_keys SET last_used_at = NOW() WHERE id = $1`, [matched.id]).catch(() => {});

  // Inject JWT-shaped object so downstream handlers work transparently
  // Cast to any — api-key auth injects a partial JWT-shaped object.
  // iat/exp are not present but downstream middleware only reads user_id/tenant_id/role.
  (req as any).jwt = {
    jti: matched.id,
    user_id: matched.created_by,
    tenant_id: matched.tenant_id,
    role: 'OWNER' as const,
    email: 'api-key',
    preferred_language: 'en' as const,
    iat: 0,
    exp: Number.MAX_SAFE_INTEGER,
  };
}
