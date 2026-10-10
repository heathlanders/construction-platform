// routes/v1/integrations/gusto.ts — Gusto OAuth 2.0 payroll integration
// GET    /v1/integrations/gusto/connect          — start OAuth flow
// GET    /v1/integrations/gusto/callback         — exchange code for tokens
// DELETE /v1/integrations/gusto/disconnect       — remove integration
// GET    /v1/integrations/gusto/status           — check connection status
// POST   /v1/integrations/gusto/sync-employees   — match Gusto employees to platform users
//
// Locked decisions: T-11, T-21, T-22, T-23, T-31

import { randomUUID } from 'node:crypto';
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { redis } from '../../../lib/redis.js';
import { withTenantContext } from '../../../lib/tenant-context.js';
import { writeAuditEntry } from '../../../lib/audit-log.js';
import { encryptToken, decryptToken } from '../../../lib/token-crypto.js';
import { authenticate, requireRole } from '../../../plugins/auth-plugin.js';

const GUSTO_BASE = 'https://api.gusto.com';
const GUSTO_AUTH_URL = 'https://api.gusto.com/oauth/authorize';
const GUSTO_TOKEN_URL = 'https://api.gusto.com/oauth/token';

function gustoStateKey(state: string): string {
  return `gusto_oauth_state:${state}`;
}

interface GustoTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

interface GustoMeResponse {
  roles?: {
    payroll?: {
      companies?: Array<{ uuid: string }>;
    };
  };
}

interface GustoEmployee {
  uuid: string;
  first_name: string;
  last_name: string;
  email?: string;
  work_email?: string;
}

async function refreshGustoTokenIfNeeded(
  tenantId: string,
  accessTokenEnc: string,
  refreshTokenEnc: string,
  expiresAt: Date | null,
): Promise<string> {
  if (expiresAt && new Date() < new Date(expiresAt.getTime() - 60_000)) {
    return decryptToken(accessTokenEnc);
  }

  // Token expired — refresh
  const clientId = process.env.GUSTO_CLIENT_ID!;
  const clientSecret = process.env.GUSTO_CLIENT_SECRET!;
  const refreshToken = decryptToken(refreshTokenEnc);

  const res = await fetch(GUSTO_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'ConstructionPlatform-API/0.1.0',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    }).toString(),
  });

  if (!res.ok) throw new Error(`Gusto token refresh failed: ${res.status}`);

  const tokens = await res.json() as GustoTokenResponse;
  const newExpiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

  // Persist refreshed tokens
  const rawClient = await import('../../../lib/db.js').then((m) => m.pgPool.connect());
  try {
    await rawClient.query(
      `UPDATE tenant_integrations
       SET access_token_enc = $1, token_expires_at = $2, updated_at = NOW()
       WHERE tenant_id = $3 AND provider = 'gusto' AND deleted_at IS NULL`,
      [encryptToken(tokens.access_token), newExpiresAt, tenantId],
    );
  } finally {
    rawClient.release();
  }

  return tokens.access_token;
}

export async function gustoRoutes(app: FastifyInstance): Promise<void> {
  /**
   * GET /v1/integrations/gusto/connect
   * Redirect to Gusto OAuth authorization page.
   */
  app.get(
    '/integrations/gusto/connect',
    { preHandler: [authenticate, requireRole('OWNER')] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { tenant_id } = req.jwt;

      const clientId = process.env.GUSTO_CLIENT_ID;
      const redirectUri = process.env.GUSTO_REDIRECT_URI;
      if (!clientId || !redirectUri) {
        return reply.status(500).send({ error: { code: 'INTEGRATION_NOT_CONFIGURED', message: 'Gusto integration is not configured.' } });
      }

      const state = `${tenant_id}:${randomUUID()}`;
      await redis.set(gustoStateKey(state), tenant_id, 'EX', 600);

      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: 'payrolls:run employees:read',
        state,
      });

      return reply.status(200).send({ authorization_url: `${GUSTO_AUTH_URL}?${params.toString()}` });
    },
  );

  /**
   * GET /v1/integrations/gusto/callback
   * Exchange authorization code for tokens and persist to tenant_integrations.
   */
  app.get(
    '/integrations/gusto/callback',
    { preHandler: [authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { tenant_id, user_id } = req.jwt;
      const { code, state } = req.query as Record<string, string>;

      if (!code || !state) {
        return reply.status(400).send({ error: { code: 'MISSING_PARAMS', message: 'Missing code or state.' } });
      }

      const storedTenantId = await redis.get(gustoStateKey(state));
      if (!storedTenantId || storedTenantId !== tenant_id) {
        return reply.status(400).send({ error: { code: 'INVALID_STATE', message: 'OAuth state is invalid or expired.' } });
      }

      const clientId = process.env.GUSTO_CLIENT_ID!;
      const clientSecret = process.env.GUSTO_CLIENT_SECRET!;
      const redirectUri = process.env.GUSTO_REDIRECT_URI!;

      // Exchange code for tokens
      const tokenRes = await fetch(GUSTO_TOKEN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'ConstructionPlatform-API/0.1.0',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: redirectUri,
          client_id: clientId,
          client_secret: clientSecret,
        }).toString(),
      });

      if (!tokenRes.ok) {
        return reply.status(502).send({ error: { code: 'TOKEN_EXCHANGE_FAILED', message: 'Failed to exchange authorization code with Gusto.' } });
      }

      const tokens = await tokenRes.json() as GustoTokenResponse;
      const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

      // Get company UUID from /v1/me
      const meRes = await fetch(`${GUSTO_BASE}/v1/me`, {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
          'User-Agent': 'ConstructionPlatform-API/0.1.0',
        },
      });

      if (!meRes.ok) {
        return reply.status(502).send({ error: { code: 'GUSTO_ME_FAILED', message: 'Could not retrieve Gusto company information.' } });
      }

      const me = await meRes.json() as GustoMeResponse;
      const companyUuid = me.roles?.payroll?.companies?.[0]?.uuid;

      if (!companyUuid) {
        return reply.status(422).send({ error: { code: 'NO_COMPANY', message: 'No Gusto payroll company found for this account.' } });
      }

      await redis.del(gustoStateKey(state));

      await withTenantContext(tenant_id, async (client) => {
        await client.query(
          `INSERT INTO tenant_integrations
             (tenant_id, provider, access_token_enc, refresh_token_enc, token_expires_at, external_id, status, created_by)
           VALUES ($1, 'gusto', $2, $3, $4, $5, 'active', $6)
           ON CONFLICT (tenant_id, provider) DO UPDATE SET
             access_token_enc  = EXCLUDED.access_token_enc,
             refresh_token_enc = EXCLUDED.refresh_token_enc,
             token_expires_at  = EXCLUDED.token_expires_at,
             external_id       = EXCLUDED.external_id,
             status            = 'active',
             deleted_at        = NULL,
             updated_at        = NOW()`,
          [tenant_id, encryptToken(tokens.access_token), encryptToken(tokens.refresh_token), expiresAt, companyUuid, user_id],
        );

        await writeAuditEntry(client, {
          tenantId: tenant_id,
          category: 'data',
          action: 'integration.gusto.connected',
          actorId: user_id,
          resourceType: 'integration',
          payload: { company_uuid: companyUuid },
          ipAddress: req.ip,
        });
      });

      return reply.status(200).send({ connected: true, company_uuid: companyUuid });
    },
  );

  /**
   * DELETE /v1/integrations/gusto/disconnect
   */
  app.delete(
    '/integrations/gusto/disconnect',
    { preHandler: [authenticate, requireRole('OWNER')] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { tenant_id, user_id } = req.jwt;

      await withTenantContext(tenant_id, async (client) => {
        await client.query(
          `UPDATE tenant_integrations
           SET status = 'disconnected', deleted_at = NOW(), updated_at = NOW()
           WHERE tenant_id = $1 AND provider = 'gusto' AND deleted_at IS NULL`,
          [tenant_id],
        );

        await writeAuditEntry(client, {
          tenantId: tenant_id,
          category: 'data',
          action: 'integration.gusto.disconnected',
          actorId: user_id,
          resourceType: 'integration',
          ipAddress: req.ip,
        });
      });

      return reply.status(200).send({ disconnected: true });
    },
  );

  /**
   * GET /v1/integrations/gusto/status
   */
  app.get(
    '/integrations/gusto/status',
    { preHandler: [authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { tenant_id } = req.jwt;

      const row = await withTenantContext(tenant_id, async (client) => {
        const { rows } = await client.query(
          `SELECT status, external_id, last_sync_at FROM tenant_integrations
           WHERE tenant_id = $1 AND provider = 'gusto' AND deleted_at IS NULL`,
          [tenant_id],
        );
        return rows[0] ?? null;
      });

      if (!row) return reply.status(200).send({ connected: false });
      return reply.status(200).send({ connected: row.status === 'active', status: row.status, company_uuid: row.external_id, last_sync_at: row.last_sync_at });
    },
  );

  /**
   * POST /v1/integrations/gusto/sync-employees
   * Fetch employees from Gusto and match by email to platform users.
   * Stores gusto_employee_id in user_payroll_settings.
   */
  app.post(
    '/integrations/gusto/sync-employees',
    { preHandler: [authenticate, requireRole('OWNER', 'ACCOUNTANT')] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { tenant_id, user_id } = req.jwt;

      const result = await withTenantContext(tenant_id, async (client) => {
        const { rows: integRows } = await client.query(
          `SELECT access_token_enc, refresh_token_enc, token_expires_at, external_id
           FROM tenant_integrations
           WHERE tenant_id = $1 AND provider = 'gusto' AND status = 'active' AND deleted_at IS NULL`,
          [tenant_id],
        );

        if (integRows.length === 0) {
          return { error: 'NOT_CONNECTED', message: 'Gusto integration is not connected' };
        }

        const integ = integRows[0];
        const accessToken = await refreshGustoTokenIfNeeded(
          tenant_id,
          integ.access_token_enc,
          integ.refresh_token_enc,
          integ.token_expires_at,
        );

        const companyUuid = integ.external_id as string;

        // Fetch employees from Gusto
        const empRes = await fetch(`${GUSTO_BASE}/v1/companies/${companyUuid}/employees`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'User-Agent': 'ConstructionPlatform-API/0.1.0',
          },
        });

        if (!empRes.ok) {
          return { error: 'GUSTO_FETCH_FAILED', message: 'Failed to fetch employees from Gusto' };
        }

        const employees = await empRes.json() as GustoEmployee[];

        let matched = 0;
        const unmatched: string[] = [];

        for (const emp of employees) {
          const empEmail = emp.work_email ?? emp.email;
          if (!empEmail) {
            unmatched.push(`${emp.first_name} ${emp.last_name} (no email)`);
            continue;
          }

          // Find platform user by email
          const { rows: userRows } = await client.query<{ id: string }>(
            `SELECT id FROM users
             WHERE tenant_id = $1 AND LOWER(email) = LOWER($2) AND deleted_at IS NULL`,
            [tenant_id, empEmail],
          );

          if (userRows.length === 0) {
            unmatched.push(empEmail);
            continue;
          }

          const platformUserId = userRows[0].id;

          // Upsert user_payroll_settings with gusto_employee_id
          await client.query(
            `INSERT INTO user_payroll_settings (tenant_id, user_id, gusto_employee_id, created_by)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (user_id) DO UPDATE SET
               gusto_employee_id = EXCLUDED.gusto_employee_id,
               updated_at        = NOW()`,
            [tenant_id, platformUserId, emp.uuid, user_id],
          );

          matched++;
        }

        await client.query(
          `UPDATE tenant_integrations
           SET last_sync_at = NOW(), sync_error = NULL
           WHERE tenant_id = $1 AND provider = 'gusto' AND deleted_at IS NULL`,
          [tenant_id],
        );

        await writeAuditEntry(client, {
          tenantId: tenant_id,
          category: 'data',
          action: 'integration.gusto.employees_synced',
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
