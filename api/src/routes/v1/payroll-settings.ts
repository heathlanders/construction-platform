// routes/v1/payroll-settings.ts — per-employee payroll settings
// GET    /v1/payroll-settings          — list all users + their payroll settings
// POST   /v1/payroll-settings          — create settings for a user
// PATCH  /v1/payroll-settings/:userId  — update settings for a user
//
// Roles: OWNER, ACCOUNTANT only
// Locked decisions: T-11, A-03

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { withTenantContext } from '../../lib/tenant-context.js';
import { writeAuditEntry } from '../../lib/audit-log.js';
import { authenticate, requireRole } from '../../plugins/auth-plugin.js';

const ALLOWED_ROLES = ['OWNER', 'ACCOUNTANT'] as const;

const PayrollSettingsSchema = z.object({
  user_id: z.string().uuid(),
  employment_type: z.enum(['w2', 'contractor_1099']).optional(),
  default_hourly_rate_cents: z.number().int().min(0).optional(),
  overtime_multiplier: z.number().positive().optional(),
  pay_frequency: z.enum(['weekly', 'biweekly', 'semimonthly', 'monthly']).optional(),
  gusto_employee_id: z.string().optional(),
  adp_worker_aoid: z.string().optional(),
});

const PatchPayrollSettingsSchema = PayrollSettingsSchema.omit({ user_id: true }).partial();

export async function payrollSettingsRoutes(app: FastifyInstance): Promise<void> {
  /**
   * GET /v1/payroll-settings
   * Returns all active users with their payroll settings (LEFT JOIN so users
   * without settings also appear — makes the UI table complete).
   */
  app.get(
    '/payroll-settings',
    { preHandler: [authenticate, requireRole(...ALLOWED_ROLES)] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { tenant_id } = req.jwt;

      const rows = await withTenantContext(tenant_id, async (client) => {
        const { rows } = await client.query(
          `SELECT
             u.id AS user_id,
             u.first_name, u.last_name, u.email, u.role,
             ups.id AS settings_id,
             ups.employment_type,
             ups.default_hourly_rate_cents,
             ups.overtime_multiplier,
             ups.pay_frequency,
             ups.gusto_employee_id,
             ups.adp_worker_aoid,
             ups.version,
             ups.updated_at AS settings_updated_at
           FROM users u
           LEFT JOIN user_payroll_settings ups
             ON ups.user_id = u.id AND ups.deleted_at IS NULL
           WHERE u.tenant_id = $1
             AND u.status = 'active'
             AND u.deleted_at IS NULL
             AND u.role NOT IN ('client_portal', 'sub_portal')
           ORDER BY u.last_name, u.first_name`,
          [tenant_id],
        );
        return rows;
      });

      return reply.status(200).send({ payroll_settings: rows });
    },
  );

  /**
   * POST /v1/payroll-settings
   * Create payroll settings for a user. Fails if settings already exist (use PATCH).
   */
  app.post(
    '/payroll-settings',
    { preHandler: [authenticate, requireRole(...ALLOWED_ROLES)] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const parse = PayrollSettingsSchema.safeParse(req.body);
      if (!parse.success) {
        return reply.status(422).send({
          error: { code: 'VALIDATION_ERROR', message: parse.error.issues[0]?.message ?? 'Validation error' },
        });
      }

      const { tenant_id, user_id: actorId } = req.jwt;
      const {
        user_id,
        employment_type = 'w2',
        default_hourly_rate_cents = 0,
        overtime_multiplier = 1.5,
        pay_frequency = 'biweekly',
        gusto_employee_id,
        adp_worker_aoid,
      } = parse.data;

      const result = await withTenantContext(tenant_id, async (client) => {
        const { rows } = await client.query(
          `INSERT INTO user_payroll_settings
             (tenant_id, user_id, employment_type, default_hourly_rate_cents,
              overtime_multiplier, pay_frequency, gusto_employee_id, adp_worker_aoid, created_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           RETURNING *`,
          [
            tenant_id, user_id, employment_type, default_hourly_rate_cents,
            overtime_multiplier, pay_frequency,
            gusto_employee_id ?? null, adp_worker_aoid ?? null, actorId,
          ],
        );

        await writeAuditEntry(client, {
          tenantId: tenant_id,
          category: 'data',
          action: 'payroll_settings.created',
          actorId,
          resourceType: 'user_payroll_settings',
          resourceId: rows[0].id,
          payload: { user_id, employment_type },
        });

        return rows[0];
      });

      return reply.status(201).send({ payroll_settings: result });
    },
  );

  /**
   * PATCH /v1/payroll-settings/:userId
   * Update (or upsert) payroll settings for a user.
   */
  app.patch(
    '/payroll-settings/:userId',
    { preHandler: [authenticate, requireRole(...ALLOWED_ROLES)] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { userId } = req.params as { userId: string };
      const parse = PatchPayrollSettingsSchema.safeParse(req.body);
      if (!parse.success) {
        return reply.status(422).send({
          error: { code: 'VALIDATION_ERROR', message: parse.error.issues[0]?.message ?? 'Validation error' },
        });
      }

      const { tenant_id, user_id: actorId } = req.jwt;
      const updates = parse.data;

      const result = await withTenantContext(tenant_id, async (client) => {
        // Build dynamic SET clause
        const setClauses: string[] = ['updated_at = NOW()', 'version = version + 1'];
        const values: unknown[] = [tenant_id, userId];
        let idx = 3;

        if (updates.employment_type !== undefined) {
          setClauses.push(`employment_type = $${idx++}`);
          values.push(updates.employment_type);
        }
        if (updates.default_hourly_rate_cents !== undefined) {
          setClauses.push(`default_hourly_rate_cents = $${idx++}`);
          values.push(updates.default_hourly_rate_cents);
        }
        if (updates.overtime_multiplier !== undefined) {
          setClauses.push(`overtime_multiplier = $${idx++}`);
          values.push(updates.overtime_multiplier);
        }
        if (updates.pay_frequency !== undefined) {
          setClauses.push(`pay_frequency = $${idx++}`);
          values.push(updates.pay_frequency);
        }
        if (updates.gusto_employee_id !== undefined) {
          setClauses.push(`gusto_employee_id = $${idx++}`);
          values.push(updates.gusto_employee_id);
        }
        if (updates.adp_worker_aoid !== undefined) {
          setClauses.push(`adp_worker_aoid = $${idx++}`);
          values.push(updates.adp_worker_aoid);
        }

        if (setClauses.length === 2) {
          // No actual fields to update
          return reply.status(400).send({ error: { code: 'NO_FIELDS', message: 'No fields to update' } });
        }

        const { rows } = await client.query(
          `UPDATE user_payroll_settings
           SET ${setClauses.join(', ')}
           WHERE tenant_id = $1 AND user_id = $2 AND deleted_at IS NULL
           RETURNING *`,
          values,
        );

        if (rows.length === 0) {
          return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Payroll settings not found for this user' } });
        }

        await writeAuditEntry(client, {
          tenantId: tenant_id,
          category: 'data',
          action: 'payroll_settings.updated',
          actorId,
          resourceType: 'user_payroll_settings',
          resourceId: rows[0].id,
          payload: updates as Record<string, unknown>,
        });

        return rows[0];
      });

      if (result && typeof result === 'object' && 'statusCode' in result) return result;
      return reply.status(200).send({ payroll_settings: result });
    },
  );
}
