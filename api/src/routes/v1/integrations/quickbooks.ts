// routes/v1/integrations/quickbooks.ts — QuickBooks OAuth 2.0 integration routes
// GET  /v1/integrations/quickbooks/connect    — start OAuth flow
// GET  /v1/integrations/quickbooks/callback   — OAuth callback (exchange code for tokens)
// DELETE /v1/integrations/quickbooks/disconnect — remove integration
// GET  /v1/integrations/quickbooks/status     — check connection status
//
// Locked decisions: T-11, T-18, T-21, T-31
// Tokens persisted in tenant_integrations (provider='quickbooks') — DB migration 0007

import { randomUUID } from 'node:crypto';
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { redis } from '../../../lib/redis.js';
import { writeAuditEntry } from '../../../lib/audit-log.js';
import { withTenantContext } from '../../../lib/tenant-context.js';
import { encryptToken } from '../../../lib/token-crypto.js';
import { authenticate, requireRole } from '../../../plugins/auth-plugin.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function qbStateKey(state: string): string {
  return `qb_oauth_state:${state}`;
}

// ─── Route plugin ─────────────────────────────────────────────────────────────

export async function quickbooksIntegrationRoutes(app: FastifyInstance): Promise<void> {
  /**
   * GET /v1/integrations/quickbooks/connect
   * Generate QB OAuth authorization URL and return it to the client.
   * Client is responsible for redirecting the user.
   */
  app.get(
    '/integrations/quickbooks/connect',
    { preHandler: [authenticate, requireRole('OWNER', 'ACCOUNTANT')] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { tenant_id } = req.jwt;

      const clientId = process.env.QB_CLIENT_ID;
      const redirectUri = process.env.QB_REDIRECT_URI;

      if (!clientId || !redirectUri) {
        return reply.status(500).send({
          error: { code: 'INTEGRATION_NOT_CONFIGURED', message: 'QuickBooks integration is not configured.' },
        });
      }

      // Generate state param: {tenant_id}:{random UUID}
      const state = `${tenant_id}:${randomUUID()}`;

      // Store state in Redis with 10-minute TTL
      await redis.set(qbStateKey(state), tenant_id, 'EX', 600);

      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: 'com.intuit.quickbooks.accounting',
        state,
      });

      const authorization_url = `https://appcenter.intuit.com/connect/oauth2?${params.toString()}`;

      return reply.status(200).send({ authorization_url });
    }
  );

  /**
   * GET /v1/integrations/quickbooks/callback
   * Exchange authorization code for tokens and store them.
   */
  app.get(
    '/integrations/quickbooks/callback',
    { preHandler: [authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { tenant_id, user_id } = req.jwt;
      const query = req.query as Record<string, string>;
      const { code, state, realmId } = query;

      if (!code || !state || !realmId) {
        return reply.status(400).send({
          error: { code: 'MISSING_PARAMS', message: 'Missing code, state, or realmId.' },
        });
      }

      // Validate state against Redis
      const storedTenantId = await redis.get(qbStateKey(state));
      if (!storedTenantId || storedTenantId !== tenant_id) {
        return reply.status(400).send({
          error: { code: 'INVALID_STATE', message: 'OAuth state is invalid or expired.' },
        });
      }

      const clientId = process.env.QB_CLIENT_ID;
      const clientSecret = process.env.QB_CLIENT_SECRET;
      const redirectUri = process.env.QB_REDIRECT_URI;

      if (!clientId || !clientSecret || !redirectUri) {
        return reply.status(500).send({
          error: { code: 'INTEGRATION_NOT_CONFIGURED', message: 'QuickBooks integration is not configured.' },
        });
      }

      // Exchange code for tokens
      const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
      const tokenRes = await fetch('https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${credentials}`,
          'User-Agent': 'ConstructionPlatform-API/0.1.0',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: redirectUri,
        }).toString(),
      });

      if (!tokenRes.ok) {
        const errBody = await tokenRes.text().catch(() => '');
        app.log.error({ status: tokenRes.status, body: errBody }, 'QB token exchange failed');
        return reply.status(502).send({
          error: { code: 'TOKEN_EXCHANGE_FAILED', message: 'Failed to exchange authorization code.' },
        });
      }

      const tokens = await tokenRes.json() as {
        access_token: string;
        refresh_token: string;
        expires_in: number;
        token_type: string;
      };

      const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

      // Delete state key from Redis
      await redis.del(qbStateKey(state));

      // Persist tokens in tenant_integrations (DB — survives restart)
      await withTenantContext(tenant_id, async (client) => {
        await client.query(
          `INSERT INTO tenant_integrations
             (tenant_id, provider, access_token_enc, refresh_token_enc, token_expires_at, external_id, status, created_by)
           VALUES ($1, 'quickbooks', $2, $3, $4, $5, 'active', $6)
           ON CONFLICT (tenant_id, provider) DO UPDATE SET
             access_token_enc  = EXCLUDED.access_token_enc,
             refresh_token_enc = EXCLUDED.refresh_token_enc,
             token_expires_at  = EXCLUDED.token_expires_at,
             external_id       = EXCLUDED.external_id,
             status            = 'active',
             deleted_at        = NULL,
             updated_at        = NOW()`,
          [tenant_id, encryptToken(tokens.access_token), encryptToken(tokens.refresh_token), expiresAt, realmId, user_id],
        );

        await writeAuditEntry(client, {
          tenantId: tenant_id,
          category: 'data',
          action: 'integration.quickbooks.connected',
          actorId: user_id,
          resourceType: 'integration',
          resourceId: tenant_id,
          payload: { realm_id: realmId },
          ipAddress: req.ip,
        });
      });

      return reply.status(200).send({ connected: true, realm_id: realmId });
    }
  );

  /**
   * DELETE /v1/integrations/quickbooks/disconnect
   * Remove stored QB tokens for this tenant.
   */
  app.delete(
    '/integrations/quickbooks/disconnect',
    { preHandler: [authenticate, requireRole('OWNER')] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { tenant_id, user_id } = req.jwt;

      await withTenantContext(tenant_id, async (client) => {
        await client.query(
          `UPDATE tenant_integrations
           SET status = 'disconnected', deleted_at = NOW(), updated_at = NOW()
           WHERE tenant_id = $1 AND provider = 'quickbooks' AND deleted_at IS NULL`,
          [tenant_id],
        );

        await writeAuditEntry(client, {
          tenantId: tenant_id,
          category: 'data',
          action: 'integration.quickbooks.disconnected',
          actorId: user_id,
          resourceType: 'integration',
          resourceId: tenant_id,
          ipAddress: req.ip,
        });
      });

      return reply.status(200).send({ disconnected: true });
    }
  );

  /**
   * GET /v1/integrations/quickbooks/status
   * Check whether this tenant has an active QB connection.
   */
  app.get(
    '/integrations/quickbooks/status',
    { preHandler: [authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { tenant_id } = req.jwt;

      const row = await withTenantContext(tenant_id, async (client) => {
        const { rows } = await client.query(
          `SELECT status, external_id, last_sync_at FROM tenant_integrations
           WHERE tenant_id = $1 AND provider = 'quickbooks' AND deleted_at IS NULL`,
          [tenant_id],
        );
        return rows[0] ?? null;
      });

      if (!row) return reply.status(200).send({ connected: false });
      return reply.status(200).send({ connected: row.status === 'active', realm_id: row.external_id, last_sync_at: row.last_sync_at });
    }
  );
}
