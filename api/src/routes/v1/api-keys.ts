// routes/v1/api-keys.ts — Enterprise API key management
// Locked decisions: PR-04 (Enterprise tier gate), T-03

import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { withTenantContext } from '../../lib/tenant-context.js';
import { writeAuditEntry } from '../../lib/audit-log.js';
import { authenticate, requireRole } from '../../plugins/auth-plugin.js';
import { assertTier, TierEnforcementError } from '../../services/tier-enforcement.js';

const scryptAsync = promisify(scrypt);

const KEY_PREFIX_LEN = 16; // first 16 chars of pk_live_<64hex> used as fast lookup index

export async function hashApiKey(rawKey: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const derived = (await scryptAsync(rawKey, salt, 32)) as Buffer;
  return `${salt}:${derived.toString('hex')}`;
}

export async function verifyApiKey(rawKey: string, stored: string): Promise<boolean> {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  try {
    const derived = (await scryptAsync(rawKey, salt, 32)) as Buffer;
    const hashBuf = Buffer.from(hash, 'hex');
    if (derived.length !== hashBuf.length) return false;
    return timingSafeEqual(derived, hashBuf);
  } catch {
    return false;
  }
}

const CreateSchema = z.object({
  name: z.string().min(1).max(200),
});

export async function apiKeyRoutes(app: FastifyInstance): Promise<void> {
  // GET /api-keys — list keys (never returns key_hash)
  app.get('/api-keys', { preHandler: [authenticate, requireRole('OWNER')] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { tenant_id } = req.jwt;

      try {
        await assertTier(tenant_id, 'ENTERPRISE');
      } catch (err) {
        if (err instanceof TierEnforcementError) {
          return reply.status(402).send(err.toResponse());
        }
        throw err;
      }

      const keys = await withTenantContext(tenant_id, async (client) => {
        const { rows } = await client.query(
          `SELECT id, name, last_used_at, created_at, revoked_at
           FROM api_keys WHERE tenant_id = $1 ORDER BY created_at DESC`,
          [tenant_id]
        );
        return rows;
      });

      return reply.status(200).send({ api_keys: keys });
    }
  );

  // POST /api-keys — generate new key (key shown once only)
  app.post('/api-keys', { preHandler: [authenticate, requireRole('OWNER')] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { tenant_id, user_id, email, role } = req.jwt;

      try {
        await assertTier(tenant_id, 'ENTERPRISE');
      } catch (err) {
        if (err instanceof TierEnforcementError) {
          return reply.status(402).send(err.toResponse());
        }
        throw err;
      }

      const body = CreateSchema.safeParse(req.body);
      if (!body.success) {
        return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: 'Validation failed', fields: body.error.errors.map(e => ({ field: e.path.join('.'), message: e.message })) } });
      }

      const rawKey = `pk_live_${randomBytes(32).toString('hex')}`;
      const keyPrefix = rawKey.substring(0, KEY_PREFIX_LEN);
      const keyHash = await hashApiKey(rawKey);

      const apiKey = await withTenantContext(tenant_id, async (client) => {
        const { rows } = await client.query(
          `INSERT INTO api_keys (tenant_id, name, key_hash, key_prefix, created_by)
           VALUES ($1,$2,$3,$4,$5) RETURNING id, name, created_at`,
          [tenant_id, body.data.name, keyHash, keyPrefix, user_id]
        );
        await writeAuditEntry(client, {
          tenantId: tenant_id, category: 'admin', action: 'api_key.created',
          actorId: user_id, actorEmail: email, actorRole: role,
          resourceType: 'api_key', resourceId: rows[0].id,
          payload: { name: body.data.name }, ipAddress: req.ip,
        });
        return rows[0];
      });

      return reply.status(201).send({
        api_key: { id: apiKey.id, name: apiKey.name, key: rawKey, created_at: apiKey.created_at },
      });
    }
  );

  // DELETE /api-keys/:id — revoke key
  app.delete('/api-keys/:id', { preHandler: [authenticate, requireRole('OWNER')] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { tenant_id, user_id, email, role } = req.jwt;

      try {
        await assertTier(tenant_id, 'ENTERPRISE');
      } catch (err) {
        if (err instanceof TierEnforcementError) {
          return reply.status(402).send(err.toResponse());
        }
        throw err;
      }

      const { id } = req.params as { id: string };

      const revoked = await withTenantContext(tenant_id, async (client) => {
        const { rows } = await client.query(
          `UPDATE api_keys SET revoked_at = NOW()
           WHERE id = $1 AND tenant_id = $2 AND revoked_at IS NULL
           RETURNING id`,
          [id, tenant_id]
        );
        if (rows.length === 0) return null;
        await writeAuditEntry(client, {
          tenantId: tenant_id, category: 'admin', action: 'api_key.revoked',
          actorId: user_id, actorEmail: email, actorRole: role,
          resourceType: 'api_key', resourceId: id, payload: {}, ipAddress: req.ip,
        });
        return rows[0];
      });

      if (!revoked) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'API key not found or already revoked' } });
      return reply.status(204).send();
    }
  );
}
