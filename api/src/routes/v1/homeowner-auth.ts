// routes/v1/homeowner-auth.ts — Homeowner portal magic-link authentication
// No Business+ gate — homeowners don't have a subscription tier.
// Token: Redis key warranty_magic:{token}, 7-day TTL, single-use.

import { FastifyInstance, FastifyReply } from 'fastify';
import { z } from 'zod';
import { withTenantContext } from '../../lib/tenant-context.js';
import { issueToken, revokeToken } from '../../middleware/auth.js';
import { generateHomeownerMagicLinkToken, consumeHomeownerMagicLinkToken } from '../../lib/password-reset.js';
import { pgPool } from '../../lib/db.js';

const ExchangeSchema = z.object({
  token: z.string().min(1),
});

export async function homeownerAuthRoutes(app: FastifyInstance): Promise<void> {

  // Exchange magic-link token for JWT
  app.post('/homeowner/auth/exchange', async (req: any, reply: FastifyReply) => {
    const body = ExchangeSchema.safeParse(req.body);
    if (!body.success) return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: body.error.issues[0]?.message } });

    const userId = await consumeHomeownerMagicLinkToken(body.data.token);
    if (!userId) return reply.status(401).send({ error: { code: 'TOKEN_INVALID', message: 'Magic link is invalid or expired' } });

    // Look up user (no tenant context needed — use platform pool, filter by role)
    const client = await pgPool.connect();
    try {
      const res = await client.query(
        `SELECT u.id, u.tenant_id, u.email, u.first_name, u.last_name, u.language_preference
         FROM users u
         WHERE u.id = $1 AND u.role = 'homeowner_portal' AND u.status = 'active' AND u.deleted_at IS NULL`,
        [userId]
      );
      if (res.rows.length === 0) return reply.status(401).send({ error: { code: 'USER_NOT_FOUND', message: 'Homeowner account not found' } });

      const user = res.rows[0];
      const token = issueToken(
        { id: user.id, tenantId: user.tenant_id, role: 'HOMEOWNER_PORTAL', email: user.email, languagePreference: user.language_preference },
        'web'
      );

      return reply.send({ token, user: { id: user.id, email: user.email, first_name: user.first_name, last_name: user.last_name } });
    } finally {
      client.release();
    }
  });

  // Logout — revoke JWT
  app.post('/homeowner/auth/logout', async (req: any, reply: FastifyReply) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return reply.status(204).send();
    try {
      const jwt = require('jsonwebtoken');
      const payload = jwt.verify(authHeader.slice(7), process.env.JWT_SECRET!) as any;
      await revokeToken(payload.jti, payload.exp);
    } catch {
      // Token already invalid — that's fine
    }
    return reply.status(204).send();
  });
}
