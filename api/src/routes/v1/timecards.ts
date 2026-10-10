// routes/v1/timecards.ts — Weekly timecard workflow
// Locked decisions: T-01, T-03, T-12, A-03
// Roles: anyone can view/submit their own; OWNER/PM can approve/reject any

import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { withTenantContext } from '../../lib/tenant-context.js';
import { writeAuditEntry } from '../../lib/audit-log.js';
import { sendJob } from '../../lib/queue.js';
import { authenticate, requireRole } from '../../plugins/auth-plugin.js';

const APPROVE_ROLES = ['OWNER', 'PROJECT_MANAGER', 'ACCOUNTANT'] as ['OWNER', 'PROJECT_MANAGER', 'ACCOUNTANT'];

const ListQuerySchema = z.object({
  week: z.string().regex(/^\d{4}-W\d{2}$/).optional(), // e.g. 2026-W12
  user_id: z.string().uuid().optional(),
  status: z.enum(['draft', 'submitted', 'approved', 'rejected']).optional(),
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const CreateSchema = z.object({
  user_id: z.string().uuid().optional(), // defaults to self
  week_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // ISO date of Monday
});

const RejectSchema = z.object({
  rejection_note: z.string().min(1).max(1000),
  version: z.number().int().min(0),
});

const ApproveSchema = z.object({
  version: z.number().int().min(0),
});

/** Convert ISO week string "2026-W12" to Monday date */
function isoWeekToMonday(week: string): string {
  const [year, w] = week.split('-W').map(Number);
  // Jan 4 of year is always in week 1
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4Day = jan4.getUTCDay() || 7; // Mon=1..Sun=7
  const monday = new Date(jan4.getTime() + (w - 1) * 7 * 86400000 - (jan4Day - 1) * 86400000);
  return monday.toISOString().slice(0, 10);
}

export async function timecardRoutes(app: FastifyInstance): Promise<void> {
  // GET /timecards — list timecards
  app.get('/timecards', { preHandler: [authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const query = ListQuerySchema.safeParse(req.query);
      if (!query.success) {
        return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: 'Invalid query parameters' } });
      }
      const { tenant_id } = req.jwt;
      const { week, user_id, status, cursor, limit } = query.data;

      const rows = await withTenantContext(tenant_id, async (client) => {
        const params: unknown[] = [limit + 1];
        const conditions: string[] = ['t.deleted_at IS NULL'];

        if (week) {
          const monday = isoWeekToMonday(week);
          params.push(monday);
          conditions.push(`t.week_start = $${params.length}`);
        }
        if (user_id) {
          params.push(user_id);
          conditions.push(`t.user_id = $${params.length}`);
        }
        if (status) {
          params.push(status);
          conditions.push(`t.status = $${params.length}`);
        }
        if (cursor) {
          params.push(cursor);
          conditions.push(`t.id > $${params.length}`);
        }

        const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        const { rows } = await client.query(
          `SELECT t.*, u.first_name, u.last_name, u.email
           FROM timecards t
           JOIN users u ON u.id = t.user_id
           ${where}
           ORDER BY t.week_start DESC, t.id ASC LIMIT $1`,
          params
        );
        return rows;
      });

      const hasMore = rows.length > limit;
      const items = hasMore ? rows.slice(0, limit) : rows;
      return reply.status(200).send({
        timecards: items,
        has_more: hasMore,
        next_cursor: hasMore ? items[items.length - 1]?.id ?? null : null,
      });
    }
  );

  // POST /timecards — create/open timecard for a week, summing time_entries
  app.post('/timecards', { preHandler: [authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const body = CreateSchema.safeParse(req.body);
      if (!body.success) {
        return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: 'week_start (YYYY-MM-DD) is required' } });
      }
      const { tenant_id, user_id: jwt_user_id } = req.jwt;
      const { week_start, user_id: target_user_id } = body.data;
      const user_id = target_user_id ?? jwt_user_id;

      const result = await withTenantContext(tenant_id, async (client) => {
        // Sum hours from time_entries for this user + week
        const weekEnd = new Date(week_start);
        weekEnd.setDate(weekEnd.getDate() + 6);
        const weekEndStr = weekEnd.toISOString().slice(0, 10);

        const { rows: hourRows } = await client.query<{ total: string }>(
          `SELECT COALESCE(SUM(hours_worked), 0) AS total
           FROM time_entries
           WHERE user_id = $1
             AND date >= $2 AND date <= $3
             AND deleted_at IS NULL`,
          [user_id, week_start, weekEndStr]
        );
        const total_hours = parseFloat(hourRows[0]?.total ?? '0');
        const overtime_hours = Math.max(0, total_hours - 40);

        const { rows } = await client.query(
          `INSERT INTO timecards (tenant_id, user_id, week_start, total_hours, overtime_hours, created_by)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING *`,
          [tenant_id, user_id, week_start, total_hours, overtime_hours, jwt_user_id]
        );
        return rows[0];
      });

      return reply.status(201).send({ timecard: result });
    }
  );

  // POST /timecards/:id/submit — worker submits timecard for approval
  app.post('/timecards/:id/submit', { preHandler: [authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as { id: string };
      const { tenant_id, user_id } = req.jwt;

      const result = await withTenantContext(tenant_id, async (client) => {
        // Re-sum hours before submitting
        const { rows: tc } = await client.query(
          `SELECT * FROM timecards WHERE id = $1 AND deleted_at IS NULL`,
          [id]
        );
        if (!tc[0]) return null;
        if (tc[0].status !== 'draft') return { error: 'NOT_DRAFT' };

        const weekStart = tc[0].week_start instanceof Date
          ? tc[0].week_start.toISOString().slice(0, 10)
          : String(tc[0].week_start).slice(0, 10);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        const weekEndStr = weekEnd.toISOString().slice(0, 10);

        const { rows: hourRows } = await client.query<{ total: string }>(
          `SELECT COALESCE(SUM(hours_worked), 0) AS total FROM time_entries
           WHERE user_id = $1 AND date >= $2 AND date <= $3 AND deleted_at IS NULL`,
          [tc[0].user_id, weekStart, weekEndStr]
        );
        const total_hours = parseFloat(hourRows[0]?.total ?? '0');
        const overtime_hours = Math.max(0, total_hours - 40);

        const { rows } = await client.query(
          `UPDATE timecards
           SET status = 'submitted', submitted_at = NOW(),
               total_hours = $2, overtime_hours = $3,
               version = version + 1, updated_at = NOW()
           WHERE id = $1 AND deleted_at IS NULL
           RETURNING *`,
          [id, total_hours, overtime_hours]
        );
        return rows[0] ?? null;
      });

      if (!result) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Timecard not found' } });
      if ('error' in result) return reply.status(422).send({ error: { code: result.error, message: 'Timecard must be in draft status to submit' } });

      return reply.status(200).send({ timecard: result });
    }
  );

  // POST /timecards/:id/approve — PM/Owner approves
  app.post('/timecards/:id/approve', { preHandler: [authenticate, requireRole(...APPROVE_ROLES)] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as { id: string };
      const body = ApproveSchema.safeParse(req.body);
      if (!body.success) {
        return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: 'version is required' } });
      }
      const { tenant_id, user_id } = req.jwt;

      const result = await withTenantContext(tenant_id, async (client) => {
        const { rows } = await client.query(
          `UPDATE timecards
           SET status = 'approved', approved_by = $2, approved_at = NOW(),
               version = version + 1, updated_at = NOW()
           WHERE id = $1 AND version = $3 AND status = 'submitted' AND deleted_at IS NULL
           RETURNING *`,
          [id, user_id, body.data.version]
        );
        if (rows.length === 0) {
          const { rows: check } = await client.query(
            `SELECT id, version, status FROM timecards WHERE id = $1 AND deleted_at IS NULL`,
            [id]
          );
          if (!check[0]) return 'not_found';
          if (check[0].version !== body.data.version) return 'conflict';
          return 'bad_status';
        }
        return rows[0];
      });

      if (result === 'not_found') return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Timecard not found' } });
      if (result === 'conflict') return reply.status(409).send({ error: { code: 'VERSION_CONFLICT', message: 'Timecard was modified by another user. Refresh and try again.' } });
      if (result === 'bad_status') return reply.status(422).send({ error: { code: 'INVALID_STATUS', message: 'Timecard must be submitted before approving' } });

      // Write audit log + enqueue payroll push jobs for active integrations
      await withTenantContext(tenant_id, async (client) => {
        await writeAuditEntry(client, {
          tenantId: tenant_id,
          category: 'data',
          action: 'timecard.approved',
          actorId: user_id,
          resourceType: 'timecard',
          resourceId: id,
          payload: { approved_by: user_id },
        });

        // Enqueue payroll push for each active integration (T-10)
        const { rows: integrations } = await client.query<{ provider: string }>(
          `SELECT provider FROM tenant_integrations
           WHERE tenant_id = $1 AND status = 'active' AND deleted_at IS NULL`,
          [tenant_id],
        );

        for (const integ of integrations) {
          await sendJob(`payroll.${integ.provider}_push`, tenant_id, {
            timecard_id: id,
            approved_by: user_id,
          });
        }
      });

      return reply.status(200).send({ timecard: result });
    }
  );

  // POST /timecards/:id/reject — PM/Owner rejects with note
  app.post('/timecards/:id/reject', { preHandler: [authenticate, requireRole(...APPROVE_ROLES)] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as { id: string };
      const body = RejectSchema.safeParse(req.body);
      if (!body.success) {
        return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: 'rejection_note and version are required' } });
      }
      const { tenant_id, user_id } = req.jwt;

      const result = await withTenantContext(tenant_id, async (client) => {
        const { rows } = await client.query(
          `UPDATE timecards
           SET status = 'rejected', rejection_note = $2,
               version = version + 1, updated_at = NOW()
           WHERE id = $1 AND version = $3 AND status = 'submitted' AND deleted_at IS NULL
           RETURNING *`,
          [id, body.data.rejection_note, body.data.version]
        );
        if (rows.length === 0) {
          const { rows: check } = await client.query(
            `SELECT id, version, status FROM timecards WHERE id = $1 AND deleted_at IS NULL`,
            [id]
          );
          if (!check[0]) return 'not_found';
          if (check[0].version !== body.data.version) return 'conflict';
          return 'bad_status';
        }
        return rows[0];
      });

      if (result === 'not_found') return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Timecard not found' } });
      if (result === 'conflict') return reply.status(409).send({ error: { code: 'VERSION_CONFLICT', message: 'Timecard was modified. Refresh and try again.' } });
      if (result === 'bad_status') return reply.status(422).send({ error: { code: 'INVALID_STATUS', message: 'Only submitted timecards can be rejected' } });

      await withTenantContext(tenant_id, async (client) => {
        await writeAuditEntry(client, { tenantId: tenant_id, category: 'data', action: 'timecard.rejected', actorId: user_id, resourceType: 'timecard', resourceId: id, payload: { rejection_note: body.data.rejection_note } });
      });

      return reply.status(200).send({ timecard: result });
    }
  );
}
