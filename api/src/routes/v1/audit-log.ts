// routes/v1/audit-log.ts — Read-only access to tenant's own audit log
// Locked decisions: T-33, T-34
// Tenant admins can read their own scoped audit log — read-only, no ip_address exposed.
// Role restriction: owner and accountant only (security-sensitive data).

import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { withTenantContext } from '../../lib/tenant-context.js';
import { authenticate, requireRole } from '../../plugins/auth-plugin.js';
import { sendJob } from '../../lib/queue.js';

const AUDIT_CATEGORIES = ['auth', 'data', 'access', 'admin', 'billing', 'cross_tenant'] as const;

const ListQ = z.object({
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  category: z.enum(AUDIT_CATEGORIES).optional(),
  action: z.string().optional(),
  actor_id: z.string().uuid().optional(),
  resource_type: z.string().optional(),
  resource_id: z.string().uuid().optional(),
  from: z.string().optional(), // ISO date string
  to: z.string().optional(),   // ISO date string
});

export async function auditLogRoutes(app: FastifyInstance): Promise<void> {

  /**
   * GET /v1/audit-log — paginated read of tenant's own audit log (T-33)
   * Excludes: ip_address (never exposed to tenant admins per T-33)
   * Roles: owner, accountant (security-sensitive)
   */
  app.get(
    '/audit-log',
    { preHandler: [authenticate, requireRole('OWNER', 'ACCOUNTANT')] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const q = ListQ.safeParse(req.query);
      if (!q.success) return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: 'Invalid query params' } });

      const { tenant_id } = req.jwt;
      const { cursor, limit, category, action, actor_id, resource_type, resource_id, from, to } = q.data;

      const entries = await withTenantContext(tenant_id, async (client) => {
        const params: unknown[] = [limit + 1, tenant_id];
        const conds: string[] = ['tenant_id=$2'];
        let idx = 3;

        if (category) { conds.push(`category=$${idx++}`); params.push(category); }
        if (action) { conds.push(`action ILIKE $${idx++}`); params.push(`%${action}%`); }
        if (actor_id) { conds.push(`actor_id=$${idx++}`); params.push(actor_id); }
        if (resource_type) { conds.push(`resource_type=$${idx++}`); params.push(resource_type); }
        if (resource_id) { conds.push(`resource_id=$${idx++}`); params.push(resource_id); }
        if (from) { conds.push(`created_at>=$${idx++}`); params.push(from); }
        if (to) { conds.push(`created_at<=$${idx++}`); params.push(to); }
        if (cursor) {
          conds.push(`(created_at,id)<(SELECT created_at,id FROM audit_log WHERE id=$${idx++})`);
          params.push(cursor);
        }

        const { rows } = await client.query(
          // ip_address intentionally excluded (T-33)
          `SELECT id, tenant_id, category, action, actor_id, actor_email, actor_role,
                  resource_type, resource_id, payload, previous_hash, entry_hash, created_at
           FROM audit_log
           WHERE ${conds.join(' AND ')}
           ORDER BY created_at DESC, id DESC
           LIMIT $1`,
          params,
        );
        return rows;
      });

      const hasMore = entries.length > limit;
      const data = hasMore ? entries.slice(0, limit) : entries;
      const nextCursor = hasMore ? data[data.length - 1]?.id : null;

      return reply.status(200).send({
        entries: data,
        pagination: { has_more: hasMore, next_cursor: nextCursor ?? null },
      });
    },
  );

  /**
   * GET /v1/audit-log/export — async export (returns job_id, delivers via email)
   * Full 7-year depth, CSV per category (T-35, T-37)
   */
  app.get(
    '/audit-log/export',
    { preHandler: [authenticate, requireRole('OWNER')] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { tenant_id, user_id } = req.jwt;
      await sendJob('audit_log.export', tenant_id, { tenant_id, requested_by: user_id });
      return reply.status(202).send({ message: 'Audit log export job queued. You will receive an email when the download is ready.' });
    },
  );
}
