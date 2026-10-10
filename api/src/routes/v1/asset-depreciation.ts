// routes/v1/asset-depreciation.ts — Depreciation schedules + append-only entries
// Locked decisions: T-56 (Business+ gate), T-12 (optimistic locking on schedules)
// Entries are append-only — no UPDATE or DELETE

import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { withTenantContext } from '../../lib/tenant-context.js';
import { authenticate, requireRole } from '../../plugins/auth-plugin.js';
import { assertTier, TierEnforcementError } from '../../services/tier-enforcement.js';

async function guardTier(request: FastifyRequest, reply: FastifyReply): Promise<string | null> {
  const { tenant_id } = (request as any).jwt;
  try { await assertTier(tenant_id, 'BUSINESS'); return tenant_id; }
  catch (e) {
    if (e instanceof TierEnforcementError) { reply.status(402).send({ error: { code: e.code, message: e.message, upgrade_to: e.upgradeToTier } }); return null; }
    throw e;
  }
}

const ScheduleCreateSchema = z.object({
  method: z.enum(['straight_line', 'declining_balance', 'sum_of_years', 'units_of_production']),
  useful_life_years: z.number().positive(),
  salvage_value_cents: z.number().int().min(0).default(0),
  depreciation_rate: z.number().min(0).max(1).optional().nullable(),
  is_active: z.boolean().default(true),
  notes: z.string().optional().nullable(),
});

const ScheduleUpdateSchema = z.object({
  version: z.number().int().positive(),
  method: z.enum(['straight_line', 'declining_balance', 'sum_of_years', 'units_of_production']).optional(),
  useful_life_years: z.number().positive().optional(),
  salvage_value_cents: z.number().int().min(0).optional(),
  depreciation_rate: z.number().min(0).max(1).optional().nullable(),
  is_active: z.boolean().optional(),
  notes: z.string().optional().nullable(),
});

export async function assetDepreciationRoutes(app: FastifyInstance): Promise<void> {

  // ── Depreciation Schedules ─────────────────────────────────────────────────

  app.get('/assets/:id/depreciation', { preHandler: [authenticate, requireRole('OWNER', 'PROJECT_MANAGER')] },
    async (req: any, reply: FastifyReply) => {
      const tenant_id = await guardTier(req, reply);
      if (!tenant_id) return;
      return withTenantContext(tenant_id, async (client) => {
        const scheduleRes = await client.query(`SELECT * FROM asset_depreciation_schedules WHERE asset_id = $1 AND deleted_at IS NULL ORDER BY created_at DESC LIMIT 1`, [req.params.id]);
        const schedule = scheduleRes.rows[0] ?? null;
        if (!schedule) return reply.send({ schedule: null, entries: [] });
        const entriesRes = await client.query(`SELECT * FROM asset_depreciation_entries WHERE schedule_id = $1 ORDER BY period_start ASC`, [schedule.id]);
        return reply.send({ schedule, entries: entriesRes.rows });
      });
    },
  );

  app.post('/assets/:id/depreciation', { preHandler: [authenticate, requireRole('OWNER', 'PROJECT_MANAGER')] },
    async (req: any, reply: FastifyReply) => {
      const tenant_id = await guardTier(req, reply);
      if (!tenant_id) return;
      const body = ScheduleCreateSchema.safeParse(req.body);
      if (!body.success) return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: body.error.issues[0]?.message } });
      const { user_id } = (req as any).jwt;
      const d = body.data;
      return withTenantContext(tenant_id, async (client) => {
        // One active schedule per asset — deactivate any existing active ones
        await client.query(`UPDATE asset_depreciation_schedules SET is_active = FALSE, updated_at = NOW() WHERE asset_id = $1 AND is_active = TRUE AND deleted_at IS NULL`, [req.params.id]);
        const res = await client.query(
          `INSERT INTO asset_depreciation_schedules (tenant_id, asset_id, method, useful_life_years, salvage_value_cents, depreciation_rate, is_active, notes, created_by) VALUES (current_setting('app.current_tenant_id')::uuid,$1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
          [req.params.id, d.method, d.useful_life_years, d.salvage_value_cents, d.depreciation_rate ?? null, d.is_active, d.notes ?? null, user_id]
        );
        return reply.status(201).send(res.rows[0]);
      });
    },
  );

  app.patch('/assets/:id/depreciation/:did', { preHandler: [authenticate, requireRole('OWNER', 'PROJECT_MANAGER')] },
    async (req: any, reply: FastifyReply) => {
      const tenant_id = await guardTier(req, reply);
      if (!tenant_id) return;
      const body = ScheduleUpdateSchema.safeParse(req.body);
      if (!body.success) return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: body.error.issues[0]?.message } });
      const { version, ...fields } = body.data;
      return withTenantContext(tenant_id, async (client) => {
        const existing = await client.query(`SELECT id FROM asset_depreciation_schedules WHERE id = $1 AND asset_id = $2 AND deleted_at IS NULL`, [req.params.did, req.params.id]);
        if (existing.rows.length === 0) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Depreciation schedule not found' } });
        const sets: string[] = ['updated_at = NOW()']; const params: unknown[] = []; let i = 1;
        const cols = ['method','useful_life_years','salvage_value_cents','depreciation_rate','is_active','notes'] as const;
        for (const col of cols) {
          if (col in fields) { sets.push(`${col} = $${i++}`); params.push((fields as any)[col] ?? null); }
        }
        params.push(req.params.did, version);
        const res = await client.query(`UPDATE asset_depreciation_schedules SET ${sets.join(', ')} WHERE id = $${i++} AND version = $${i++} AND deleted_at IS NULL RETURNING *`, params);
        if (res.rows.length === 0) return reply.status(409).send({ error: { code: 'VERSION_CONFLICT', message: 'Schedule was modified by another user.' } });
        return reply.send(res.rows[0]);
      });
    },
  );

  // ── Depreciation Entries — APPEND ONLY (no PATCH or DELETE) ───────────────

  app.get('/assets/:id/depreciation/:did/entries', { preHandler: [authenticate, requireRole('OWNER', 'PROJECT_MANAGER')] },
    async (req: any, reply: FastifyReply) => {
      const tenant_id = await guardTier(req, reply);
      if (!tenant_id) return;
      return withTenantContext(tenant_id, async (client) => {
        const res = await client.query(`SELECT * FROM asset_depreciation_entries WHERE schedule_id = $1 AND asset_id = $2 ORDER BY period_start ASC`, [req.params.did, req.params.id]);
        return reply.send({ items: res.rows });
      });
    },
  );

  // Manual entry creation (background job also creates entries automatically)
  app.post('/assets/:id/depreciation/:did/entries', { preHandler: [authenticate, requireRole('OWNER', 'PROJECT_MANAGER')] },
    async (req: any, reply: FastifyReply) => {
      const tenant_id = await guardTier(req, reply);
      if (!tenant_id) return;
      const body = z.object({
        period_start: z.string().date(),
        period_end: z.string().date(),
        depreciation_amount_cents: z.number().int().min(0),
        book_value_after_cents: z.number().int().min(0),
        notes: z.string().optional().nullable(),
      }).safeParse(req.body);
      if (!body.success) return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: body.error.issues[0]?.message } });
      const { user_id } = (req as any).jwt;
      const d = body.data;
      return withTenantContext(tenant_id, async (client) => {
        const schedRes = await client.query(`SELECT id FROM asset_depreciation_schedules WHERE id = $1 AND asset_id = $2 AND deleted_at IS NULL`, [req.params.did, req.params.id]);
        if (schedRes.rows.length === 0) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Depreciation schedule not found' } });
        const res = await client.query(
          `INSERT INTO asset_depreciation_entries (tenant_id, schedule_id, asset_id, period_start, period_end, depreciation_amount_cents, book_value_after_cents, notes, created_by) VALUES (current_setting('app.current_tenant_id')::uuid,$1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
          [req.params.did, req.params.id, d.period_start, d.period_end, d.depreciation_amount_cents, d.book_value_after_cents, d.notes ?? null, user_id]
        );
        // Update asset current book value
        await client.query(`UPDATE company_assets SET current_book_value_cents = $1, updated_at = NOW() WHERE id = $2`, [d.book_value_after_cents, req.params.id]);
        return reply.status(201).send(res.rows[0]);
      });
    },
  );
}
