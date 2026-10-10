// routes/v1/asset-fuel.ts — Fuel logs + fleet fuel summary
// Locked decisions: T-56 (Business+ gate), T-12 (optimistic locking)
// NOTE: /assets/fuel-summary must be registered before /:id routes — handled in index.ts registration order
// but this file's routes are all /assets/:id/fuel-logs; fleet summary is on /assets (in assets.ts)

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

// Columns mirror migration 0010 asset_fuel_logs exactly.
const FUEL_TYPES = ['gasoline', 'diesel', 'propane', 'electric', 'natural_gas', 'other'] as const;

const FuelLogCreateSchema = z.object({
  log_date: z.string().date(),
  fuel_type: z.enum(FUEL_TYPES),
  gallons: z.number().positive().optional().nullable(),
  cost_per_gallon_cents: z.number().int().min(0).optional().nullable(),
  total_cost_cents: z.number().int().min(0).default(0), // NOT NULL in DB
  odometer_reading: z.number().optional().nullable(),
  hours_reading: z.number().optional().nullable(),
  is_full_fill: z.boolean().optional(),
  state_code: z.string().length(2).optional().nullable(),
  fuel_card_number: z.string().optional().nullable(),
  station_name: z.string().optional().nullable(),
  project_id: z.string().uuid().optional().nullable(),
  budget_line_item_id: z.string().uuid().optional().nullable(),
  notes: z.string().optional().nullable(),
});

const FuelLogUpdateSchema = z.object({
  version: z.number().int().positive(),
  log_date: z.string().date().optional(),
  fuel_type: z.enum(FUEL_TYPES).optional(),
  gallons: z.number().positive().optional().nullable(),
  cost_per_gallon_cents: z.number().int().min(0).optional().nullable(),
  total_cost_cents: z.number().int().min(0).optional(),
  odometer_reading: z.number().optional().nullable(),
  hours_reading: z.number().optional().nullable(),
  is_full_fill: z.boolean().optional(),
  state_code: z.string().length(2).optional().nullable(),
  fuel_card_number: z.string().optional().nullable(),
  station_name: z.string().optional().nullable(),
  project_id: z.string().uuid().optional().nullable(),
  budget_line_item_id: z.string().uuid().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function assetFuelRoutes(app: FastifyInstance): Promise<void> {

  // ── Fleet Fuel Summary ─────────────────────────────────────────────────────
  // Static route must come before /:id routes — register first

  app.get('/assets/fuel-summary', { preHandler: [authenticate, requireRole('OWNER', 'PROJECT_MANAGER')] },
    async (req: any, reply: FastifyReply) => {
      const tenant_id = await guardTier(req, reply);
      if (!tenant_id) return;
      const { project_id, from, to } = req.query;
      return withTenantContext(tenant_id, async (client) => {
        const conditions: string[] = ['fl.deleted_at IS NULL'];
        const params: unknown[] = [];
        let i = 1;
        if (project_id) { conditions.push(`fl.project_id = $${i++}`); params.push(project_id); }
        if (from) { conditions.push(`fl.log_date >= $${i++}`); params.push(from); }
        if (to) { conditions.push(`fl.log_date <= $${i++}`); params.push(to); }
        const where = conditions.join(' AND ');
        const res = await client.query(
          `SELECT
             ca.id AS asset_id, ca.asset_number, ca.name AS asset_name, ca.asset_category AS category,
             fl.fuel_type,
             COUNT(fl.id) AS fill_count,
             SUM(fl.gallons) AS total_gallons,
             SUM(fl.total_cost_cents) AS total_cost_cents
           FROM asset_fuel_logs fl
           JOIN company_assets ca ON ca.id = fl.asset_id
           WHERE ${where}
           GROUP BY ca.id, ca.asset_number, ca.name, ca.asset_category, fl.fuel_type
           ORDER BY ca.name, fl.fuel_type`,
          params
        );
        return reply.send({ items: res.rows });
      });
    },
  );

  // ── Per-Asset Fuel Logs ────────────────────────────────────────────────────

  app.get('/assets/:id/fuel-logs', { preHandler: [authenticate, requireRole('OWNER', 'PROJECT_MANAGER', 'FOREMAN')] },
    async (req: any, reply: FastifyReply) => {
      const tenant_id = await guardTier(req, reply);
      if (!tenant_id) return;
      return withTenantContext(tenant_id, async (client) => {
        const res = await client.query(`SELECT * FROM asset_fuel_logs WHERE asset_id = $1 AND deleted_at IS NULL ORDER BY log_date DESC`, [req.params.id]);
        return reply.send({ fuel_logs: res.rows });
      });
    },
  );

  app.post('/assets/:id/fuel-logs', { preHandler: [authenticate, requireRole('OWNER', 'PROJECT_MANAGER', 'FOREMAN')] },
    async (req: any, reply: FastifyReply) => {
      const tenant_id = await guardTier(req, reply);
      if (!tenant_id) return;
      const body = FuelLogCreateSchema.safeParse(req.body);
      if (!body.success) return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: body.error.issues[0]?.message } });
      const { user_id } = (req as any).jwt;
      const d = body.data;
      return withTenantContext(tenant_id, async (client) => {
        const res = await client.query(
          `INSERT INTO asset_fuel_logs (tenant_id, asset_id, log_date, fuel_type, gallons, cost_per_gallon_cents, total_cost_cents, odometer_reading, hours_reading, is_full_fill, state_code, fuel_card_number, station_name, project_id, budget_line_item_id, notes, created_by) VALUES (current_setting('app.current_tenant_id')::uuid,$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING *`,
          [req.params.id, d.log_date, d.fuel_type, d.gallons ?? null, d.cost_per_gallon_cents ?? null, d.total_cost_cents ?? 0, d.odometer_reading ?? null, d.hours_reading ?? null, d.is_full_fill ?? true, d.state_code ?? null, d.fuel_card_number ?? null, d.station_name ?? null, d.project_id ?? null, d.budget_line_item_id ?? null, d.notes ?? null, user_id]
        );
        const log = res.rows[0];
        // Also log meter reading if odometer or hours provided
        const meterValue = d.odometer_reading ?? d.hours_reading;
        if (meterValue !== null && meterValue !== undefined) {
          await client.query(
            `INSERT INTO asset_meter_readings (tenant_id, asset_id, reading_date, reading_value, source, created_by) VALUES (current_setting('app.current_tenant_id')::uuid,$1,$2,$3,'fuel_log',$4)`,
            [req.params.id, d.log_date, meterValue, user_id]
          );
          await client.query(
            `UPDATE company_assets SET current_meter_reading = $1, updated_at = NOW() WHERE id = $2 AND (current_meter_reading IS NULL OR current_meter_reading < $1)`,
            [meterValue, req.params.id]
          );
        }
        return reply.status(201).send(log);
      });
    },
  );

  app.patch('/assets/:id/fuel-logs/:fid', { preHandler: [authenticate, requireRole('OWNER', 'PROJECT_MANAGER')] },
    async (req: any, reply: FastifyReply) => {
      const tenant_id = await guardTier(req, reply);
      if (!tenant_id) return;
      const body = FuelLogUpdateSchema.safeParse(req.body);
      if (!body.success) return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: body.error.issues[0]?.message } });
      const { version, ...fields } = body.data;
      return withTenantContext(tenant_id, async (client) => {
        const existing = await client.query(`SELECT id FROM asset_fuel_logs WHERE id = $1 AND asset_id = $2 AND deleted_at IS NULL`, [req.params.fid, req.params.id]);
        if (existing.rows.length === 0) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Fuel log not found' } });
        const sets: string[] = ['updated_at = NOW()']; const params: unknown[] = []; let i = 1;
        const cols = ['log_date','fuel_type','gallons','cost_per_gallon_cents','total_cost_cents','odometer_reading','hours_reading','is_full_fill','state_code','fuel_card_number','station_name','project_id','budget_line_item_id','notes'] as const;
        for (const col of cols) {
          if (col in fields) { sets.push(`${col} = $${i++}`); params.push((fields as any)[col] ?? null); }
        }
        params.push(req.params.fid, version);
        const res = await client.query(`UPDATE asset_fuel_logs SET ${sets.join(', ')} WHERE id = $${i++} AND version = $${i++} AND deleted_at IS NULL RETURNING *`, params);
        if (res.rows.length === 0) return reply.status(409).send({ error: { code: 'VERSION_CONFLICT', message: 'Fuel log was modified by another user.' } });
        return reply.send(res.rows[0]);
      });
    },
  );
}
