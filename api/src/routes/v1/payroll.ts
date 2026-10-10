// routes/v1/payroll.ts — payroll export endpoints
// POST /v1/payroll/export   — trigger async CSV export
// GET  /v1/payroll/exports  — list past exports
//
// Roles: OWNER, ACCOUNTANT, PROJECT_MANAGER
// Locked decisions: T-10, T-11, A-14

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { withTenantContext } from '../../lib/tenant-context.js';
import { sendJob } from '../../lib/queue.js';
import { authenticate, requireRole } from '../../plugins/auth-plugin.js';

const EXPORT_ROLES = ['OWNER', 'ACCOUNTANT', 'PROJECT_MANAGER'] as const;

const ExportSchema = z.object({
  week_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'week_start must be YYYY-MM-DD'),
  format: z.literal('csv').optional().default('csv'),
});

export async function payrollRoutes(app: FastifyInstance): Promise<void> {
  /**
   * POST /v1/payroll/export
   * Enqueue an async CSV payroll export for a given week.
   * week_start must be a Monday.
   */
  app.post(
    '/payroll/export',
    { preHandler: [authenticate, requireRole(...EXPORT_ROLES)] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const parse = ExportSchema.safeParse(req.body);
      if (!parse.success) {
        return reply.status(422).send({
          error: { code: 'VALIDATION_ERROR', message: parse.error.issues[0]?.message ?? 'Validation error' },
        });
      }

      const { week_start } = parse.data;
      const { tenant_id, user_id } = req.jwt;

      // Validate week_start falls on a Monday (getUTCDay() === 1)
      const date = new Date(week_start + 'T00:00:00Z');
      if (isNaN(date.getTime()) || date.getUTCDay() !== 1) {
        return reply.status(422).send({
          error: { code: 'INVALID_WEEK_START', message: 'week_start must be a Monday (YYYY-MM-DD)' },
        });
      }

      // Check that approved timecards exist for this week
      const hasTimecards = await withTenantContext(tenant_id, async (client) => {
        const { rows } = await client.query<{ count: string }>(
          `SELECT COUNT(*) AS count FROM timecards
           WHERE tenant_id = $1
             AND week_start = $2
             AND status = 'approved'
             AND deleted_at IS NULL`,
          [tenant_id, week_start],
        );
        return parseInt(rows[0]?.count ?? '0', 10) > 0;
      });

      if (!hasTimecards) {
        return reply.status(422).send({
          error: { code: 'NO_APPROVED_TIMECARDS', message: 'No approved timecards found for this week' },
        });
      }

      // Enqueue export job (T-10: tenant_id required)
      const jobId = randomUUID();
      await sendJob('payroll.export_csv', tenant_id, {
        week_start,
        requested_by: user_id,
        job_id: jobId,
      });

      return reply.status(202).send({
        job_id: jobId,
        message: 'Export will be emailed when ready',
      });
    },
  );

  /**
   * GET /v1/payroll/exports
   * List past export jobs for this tenant.
   * (Placeholder — full implementation requires a payroll_exports table)
   */
  app.get(
    '/payroll/exports',
    { preHandler: [authenticate, requireRole(...EXPORT_ROLES)] },
    async (_req: FastifyRequest, reply: FastifyReply) => {
      return reply.status(200).send({ exports: [] });
    },
  );
}
