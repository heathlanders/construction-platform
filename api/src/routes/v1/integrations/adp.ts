// routes/v1/integrations/adp.ts — ADP Workforce Now OAuth 2.0 + mTLS integration
// GET    /v1/integrations/adp/connect          — start OAuth flow
// GET    /v1/integrations/adp/callback         — exchange code for tokens (mTLS)
// DELETE /v1/integrations/adp/disconnect       — remove integration
// GET    /v1/integrations/adp/status           — check connection status
// POST   /v1/integrations/adp/sync-workers     — match ADP workers to platform users
//
// ADP requires mutual TLS (client certificate) for all API calls including
// token exchange. See lib/adp-client.ts for the mTLS agent setup.
//
// Locked decisions: T-11, T-21, T-22, T-23, T-31

import { randomUUID } from 'node:crypto';
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { redis } from '../../../lib/redis.js';
import { withTenantContext } from '../../../lib/tenant-context.js';
import { writeAuditEntry } from '../../../lib/audit-log.js';
import { encryptToken, decryptToken } from '../../../lib/token-crypto.js';
import { adpFetch } from '../../../lib/adp-client.js';
import { authenticate, requireRole } from '../../../plugins/auth-plugin.js';

const ADP_AUTH_URL = 'https://accounts.adp.com/auth/oauth/v2/authorize';
const ADP_TOKEN_URL = 'https://accounts.adp.com/auth/oauth/v2/token';

function adpStateKey(state: string): string {
  return `adp_oauth_state:${state}`;
}

interface AdpTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
}

interface AdpWorker {
  associateOID: string;
  businessCommunication?: {
    emails?: Array<{ emailUri: string; nameCode?: { codeValue: string } }>;
  };
  person?: {
    legalName?: { givenName: string; familyName1: string };
  };
}

interface AdpWorkersResponse {
  workers?: AdpWorker[];
}

async function getAdpAccessToken(
  tenantId: string,
  accessTokenEnc: string,
  refreshTokenEnc: string | null,
  expiresAt: Date | null,
): Promise<string> {
  if (expiresAt && new Date() < new Date(expiresAt.getTime() - 60_000)) {
    return decryptToken(accessTokenEnc);
  }

  if (!refreshTokenEnc) {
    throw new Error('ADP token expired and no refresh token available');
  }

  const clientId = process.env.ADP_CLIENT_ID!;
  const clientSecret = process.env.ADP_CLIENT_SECRET!;
  const refreshToken = decryptToken(refreshTokenEnc);
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const res = await adpFetch(ADP_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${credentials}`,
      'User-Agent': 'ConstructionPlatform-API/0.1.0',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }).toString(),
  });

  if (!res.ok) throw new Error(`ADP token refresh failed: ${res.status}`);

  const tokens = await res.json() as AdpTokenResponse;
  const newExpiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

  const rawClient = await import('../../../lib/db.js').then((m) => m.pgPool.connect());
  try {
    await rawClient.query(
      `UPDATE tenant_integrations
       SET access_token_enc = $1, token_expires_at = $2, updated_at = NOW()
       WHERE tenant_id = $3 AND provider = 'adp' AND deleted_at IS NULL`,
      [encryptToken(tokens.access_token), newExpiresAt, tenantId],
    );
  } finally {
    rawClient.release();
  }

  return tokens.access_token;
}

export async function adpRoutes(app: FastifyInstance): Promise<void> {
  /**
   * GET /v1/integrations/adp/connect
   */
  app.get(
    '/integrations/adp/connect',
    { preHandler: [authenticate, requireRole('OWNER')] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { tenant_id } = req.jwt;

      const clientId = process.env.ADP_CLIENT_ID;
      const redirectUri = process.env.ADP_REDIRECT_URI;
      if (!clientId || !redirectUri) {
        return reply.status(500).send({ error: { code: 'INTEGRATION_NOT_CONFIGURED', message: 'ADP integration is not configured.' } });
      }

      const state = `${tenant_id}:${randomUUID()}`;
      await redis.set(adpStateKey(state), tenant_id, 'EX', 600);

      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: 'openid',
        state,
      });

      return reply.status(200).send({ authorization_url: `${ADP_AUTH_URL}?${params.toString()}` });
    },
  );

  /**
   * GET /v1/integrations/adp/callback
   * Token exchange uses mTLS via adpFetch().
   */
  app.get(
    '/integrations/adp/callback',
    { preHandler: [authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { tenant_id, user_id } = req.jwt;
      const { code, state } = req.query as Record<string, string>;

      if (!code || !state) {
        return reply.status(400).send({ error: { code: 'MISSING_PARAMS', message: 'Missing code or state.' } });
      }

      const storedTenantId = await redis.get(adpStateKey(state));
      if (!storedTenantId || storedTenantId !== tenant_id) {
        return reply.status(400).send({ error: { code: 'INVALID_STATE', message: 'OAuth state is invalid or expired.' } });
      }

      const clientId = process.env.ADP_CLIENT_ID!;
      const clientSecret = process.env.ADP_CLIENT_SECRET!;
      const redirectUri = process.env.ADP_REDIRECT_URI!;
      const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

      // Token exchange with mTLS
      const tokenRes = await adpFetch(ADP_TOKEN_URL, {
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
        return reply.status(502).send({ error: { code: 'TOKEN_EXCHANGE_FAILED', message: 'Failed to exchange authorization code with ADP.' } });
      }

      const tokens = await tokenRes.json() as AdpTokenResponse;
      const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

      await redis.del(adpStateKey(state));

      await withTenantContext(tenant_id, async (client) => {
        await client.query(
          `INSERT INTO tenant_integrations
             (tenant_id, provider, access_token_enc, refresh_token_enc, token_expires_at, status, created_by)
           VALUES ($1, 'adp', $2, $3, $4, 'active', $5)
           ON CONFLICT (tenant_id, provider) DO UPDATE SET
             access_token_enc  = EXCLUDED.access_token_enc,
             refresh_token_enc = EXCLUDED.refresh_token_enc,
             token_expires_at  = EXCLUDED.token_expires_at,
             status            = 'active',
             deleted_at        = NULL,
             updated_at        = NOW()`,
          [
            tenant_id,
            encryptToken(tokens.access_token),
            tokens.refresh_token ? encryptToken(tokens.refresh_token) : null,
            expiresAt,
            user_id,
          ],
        );

        await writeAuditEntry(client, {
          tenantId: tenant_id,
          category: 'data',
          action: 'integration.adp.connected',
          actorId: user_id,
          resourceType: 'integration',
          ipAddress: req.ip,
        });
      });

      return reply.status(200).send({ connected: true });
    },
  );

  /**
   * DELETE /v1/integrations/adp/disconnect
   */
  app.delete(
    '/integrations/adp/disconnect',
    { preHandler: [authenticate, requireRole('OWNER')] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { tenant_id, user_id } = req.jwt;

      await withTenantContext(tenant_id, async (client) => {
        await client.query(
          `UPDATE tenant_integrations
           SET status = 'disconnected', deleted_at = NOW(), updated_at = NOW()
           WHERE tenant_id = $1 AND provider = 'adp' AND deleted_at IS NULL`,
          [tenant_id],
        );

        await writeAuditEntry(client, {
          tenantId: tenant_id,
          category: 'data',
          action: 'integration.adp.disconnected',
          actorId: user_id,
          resourceType: 'integration',
          ipAddress: req.ip,
        });
      });

      return reply.status(200).send({ disconnected: true });
    },
  );

  /**
   * GET /v1/integrations/adp/status
   */
  app.get(
    '/integrations/adp/status',
    { preHandler: [authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { tenant_id } = req.jwt;

      const row = await withTenantContext(tenant_id, async (client) => {
        const { rows } = await client.query(
          `SELECT status, last_sync_at FROM tenant_integrations
           WHERE tenant_id = $1 AND provider = 'adp' AND deleted_at IS NULL`,
          [tenant_id],
        );
        return rows[0] ?? null;
      });

      if (!row) return reply.status(200).send({ connected: false });
      return reply.status(200).send({ connected: row.status === 'active', status: row.status, last_sync_at: row.last_sync_at });
    },
  );

  /**
   * POST /v1/integrations/adp/sync-workers
   * Fetch workers from ADP and match to platform users by email.
   * Stores adp_worker_aoid in user_payroll_settings.
   */
  app.post(
    '/integrations/adp/sync-workers',
    { preHandler: [authenticate, requireRole('OWNER', 'ACCOUNTANT')] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { tenant_id, user_id } = req.jwt;
      const adpApiUrl = process.env.ADP_API_URL ?? 'https://api.adp.com';

      const result = await withTenantContext(tenant_id, async (client) => {
        const { rows: integRows } = await client.query(
          `SELECT access_token_enc, refresh_token_enc, token_expires_at
           FROM tenant_integrations
           WHERE tenant_id = $1 AND provider = 'adp' AND status = 'active' AND deleted_at IS NULL`,
          [tenant_id],
        );

        if (integRows.length === 0) {
          return { error: 'NOT_CONNECTED', message: 'ADP integration is not connected' };
        }

        const integ = integRows[0];
        const accessToken = await getAdpAccessToken(
          tenant_id,
          integ.access_token_enc,
          integ.refresh_token_enc,
          integ.token_expires_at,
        );

        // Fetch workers from ADP (mTLS required)
        const workersRes = await adpFetch(`${adpApiUrl}/hr/v2/workers`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'User-Agent': 'ConstructionPlatform-API/0.1.0',
            Accept: 'application/json',
          },
        });

        if (!workersRes.ok) {
          return { error: 'ADP_FETCH_FAILED', message: 'Failed to fetch workers from ADP' };
        }

        const data = await workersRes.json() as AdpWorkersResponse;
        const workers = data.workers ?? [];

        let matched = 0;
        const unmatched: string[] = [];

        for (const worker of workers) {
          const emails = worker.businessCommunication?.emails ?? [];
          const workEmail = emails.find((e) => e.nameCode?.codeValue === 'WORK')?.emailUri
            ?? emails[0]?.emailUri;

          if (!workEmail) {
            unmatched.push(`Worker ${worker.associateOID} (no email)`);
            continue;
          }

          const { rows: userRows } = await client.query<{ id: string }>(
            `SELECT id FROM users
             WHERE tenant_id = $1 AND LOWER(email) = LOWER($2) AND deleted_at IS NULL`,
            [tenant_id, workEmail],
          );

          if (userRows.length === 0) {
            unmatched.push(workEmail);
            continue;
          }

          const platformUserId = userRows[0].id;

          await client.query(
            `INSERT INTO user_payroll_settings (tenant_id, user_id, adp_worker_aoid, created_by)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (user_id) DO UPDATE SET
               adp_worker_aoid = EXCLUDED.adp_worker_aoid,
               updated_at      = NOW()`,
            [tenant_id, platformUserId, worker.associateOID, user_id],
          );

          matched++;
        }

        await client.query(
          `UPDATE tenant_integrations
           SET last_sync_at = NOW(), sync_error = NULL
           WHERE tenant_id = $1 AND provider = 'adp' AND deleted_at IS NULL`,
          [tenant_id],
        );

        await writeAuditEntry(client, {
          tenantId: tenant_id,
          category: 'data',
          action: 'integration.adp.workers_synced',
          actorId: user_id,
          resourceType: 'integration',
          payload: { matched, unmatched_count: unmatched.length },
        });

        return { matched, unmatched };
      });

      if ('error' in result) {
        return reply.status(422).send({ error: { code: result.error, message: result.message } });
      }

      return reply.status(200).send(result);
    },
  );
}
