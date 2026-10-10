// routes/v1/settings-org.ts — Tenant org-level settings
// GET   /v1/settings/org — read settings (any authenticated user — employees need mode to show correct UI)
// PATCH /v1/settings/org — update settings (OWNER only)
//
// Locked decisions: T-03, T-04, T-12, A-03

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { withTenantContext } from '../../lib/tenant-context.js';
import { writeAuditEntry } from '../../lib/audit-log.js';
import { authenticate, requireRole } from '../../plugins/auth-plugin.js';

const PatchSchema = z.object({
  time_tracking_mode: z.enum(['manual', 'clock_in_out']),
  version: z.number().int().min(0).optional(), // 0 or omitted = initial creation, skip version check
});

export async function settingsOrgRoutes(app: FastifyInstance): Promise<void> {
  // GET /settings/org — returns current org settings (defaults if no row yet)
  app.get('/settings/org', { preHandler: [authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { tenant_id } = req.jwt;

      const result = await withTenantContext(tenant_id, async (client) => {
        const { rows } = await client.query(
          `SELECT * FROM tenant_settings WHERE tenant_id = $1`,
          [tenant_id]
        );
        return rows[0] ?? null;
      });

      if (!result) {
        // No row yet — return defaults (manual mode)
        return reply.status(200).send({
          settings: {
            time_tracking_mode: 'manual',
            version: 0,
            updated_at: null,
          },
        });
      }

      return reply.status(200).send({ settings: result });
    }
  );

  // PATCH /settings/org — upsert org settings (OWNER only)
  app.patch('/settings/org', { preHandler: [authenticate, requireRole('OWNER')] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const body = PatchSchema.safeParse(req.body);
      if (!body.success) {
        return reply.status(422).send({
          error: { code: 'VALIDATION_ERROR', message: 'time_tracking_mode must be "manual" or "clock_in_out"' },
        });
      }
      const { tenant_id, user_id } = req.jwt;
      const { time_tracking_mode, version } = body.data;
      const clientVersion = version ?? 0;

      const result = await withTenantContext(tenant_id, async (client) => {
        let rows: unknown[];

        if (clientVersion === 0) {
          // Initial creation or unconditional update — skip version check
          const r = await client.query(
            `INSERT INTO tenant_settings (tenant_id, time_tracking_mode, updated_by)
             VALUES ($1, $2, $3)
             ON CONFLICT (tenant_id) DO UPDATE
               SET time_tracking_mode = EXCLUDED.time_tracking_mode,
                   updated_by         = EXCLUDED.updated_by
             RETURNING *`,
            [tenant_id, time_tracking_mode, user_id]
          );
          rows = r.rows;
        } else {
          // Optimistic lock — version must match
          const r = await client.query(
            `UPDATE tenant_settings
             SET time_tracking_mode = $2,
                 updated_by         = $3
             WHERE tenant_id = $1 AND version = $4
             RETURNING *`,
            [tenant_id, time_tracking_mode, user_id, clientVersion]
          );
          rows = r.rows;
        }

        if (rows.length === 0) {
          return 'conflict';
        }

        const row = rows[0];

        await writeAuditEntry(client, {
          tenantId: tenant_id,
          category: 'data',
          action: 'org_settings.updated',
          actorId: user_id,
          resourceType: 'tenant_settings',
          resourceId: (row as { id: string }).id,
          payload: { time_tracking_mode },
        });

        return row;
      });

      if (result === 'conflict') {
        return reply.status(409).send({
          error: { code: 'VERSION_CONFLICT', message: 'Settings were modified by another user. Refresh and try again.' },
        });
      }

      return reply.status(200).send({ settings: result });
    }
  );
}
