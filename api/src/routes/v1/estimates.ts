// routes/v1/estimates.ts — sub-level job estimates.
//
// Header CRUD + line-item CRUD + deterministic generate (facts/parametric → priced lines) +
// convert-to-bid-package + award (seed budget_line_items). Markup params (overhead/profit/tax/
// contingency) live on the header and are applied by the engine. No tier gate (available every tier).
// Roles: read = any authed org user; write = OWNER / PROJECT_MANAGER / ESTIMATOR.

import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { withTenantContext } from '../../lib/tenant-context.js';
import { writeAuditEntry } from '../../lib/audit-log.js';
import { authenticate, requireRole } from '../../plugins/auth-plugin.js';
import { computeAmounts, type EstimateParams } from '../../lib/estimating/index.js';
import { generateEstimateLines, recomputeEstimateTotals } from '../../services/estimates.js';
import { renderProposalPdf } from '../../lib/estimate-pdf.js';
import { storageClient, generateDownloadUrl } from '../../lib/storage.js';
import { PutObjectCommand } from '@aws-sdk/client-s3';

const LIVE_BUCKET = process.env.STORAGE_LIVE_BUCKET!;
const PROPOSAL_URL_TTL = 7 * 24 * 60 * 60; // 7 days for emailed customer link (T-35 precedent)
const W = ['OWNER', 'PROJECT_MANAGER', 'ESTIMATOR'] as const;
const TRADES = ['electrical', 'plumbing', 'mechanical', 'building', 'general'] as const;

const pct = z.number().min(0).max(100);
const CreateSchema = z.object({
  name: z.string().min(1).max(200),
  project_id: z.string().uuid().optional(),
  trade: z.enum(TRADES).optional(),
  building_type: z.string().max(40).optional(),
  mode: z.enum(['assembly', 'parametric']).default('assembly'),
  labor_rate_cents: z.number().int().min(0).default(0),
  overhead_pct: pct.default(0),
  profit_pct: pct.default(0),
  tax_pct: pct.default(0),
  contingency_pct: pct.default(0),
  notes: z.string().max(4000).optional(),
});
const UpdateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  trade: z.enum(TRADES).optional().nullable(),
  mode: z.enum(['assembly', 'parametric']).optional(),
  status: z.enum(['draft', 'final', 'sent', 'lost']).optional(), // 'awarded' only via /award
  labor_rate_cents: z.number().int().min(0).optional(),
  overhead_pct: pct.optional(),
  profit_pct: pct.optional(),
  tax_pct: pct.optional(),
  contingency_pct: pct.optional(),
  notes: z.string().max(4000).optional().nullable(),
  version: z.number().int().min(1),
});
const GenerateSchema = z.object({ building_sf: z.number().min(0).optional(), from_takeoff: z.boolean().optional(), include_equipment: z.boolean().optional() });
const LineCreateSchema = z.object({
  description: z.string().min(1).max(400),
  trade: z.enum(TRADES).optional(),
  csi_division: z.string().max(32).optional(),
  unit: z.string().max(20).optional(),
  quantity: z.number().min(0).default(0),
  material_unit_cents: z.number().int().min(0).default(0),
  labor_hours_per_unit: z.number().min(0).max(10000).default(0),
  equipment_unit_cents: z.number().int().min(0).default(0),
  waste_pct: pct.default(0),
  assumptions: z.array(z.string().max(400)).max(50).optional(),
});
const LineUpdateSchema = z.object({
  description: z.string().min(1).max(400).optional(),
  csi_division: z.string().max(32).optional().nullable(),
  unit: z.string().max(20).optional().nullable(),
  quantity: z.number().min(0).optional(),
  material_unit_cents: z.number().int().min(0).optional(),
  labor_hours_per_unit: z.number().min(0).max(10000).optional(),
  equipment_unit_cents: z.number().int().min(0).optional(),
  waste_pct: pct.optional(),
  version: z.number().int().min(1),
});
const ProposalSchema = z.object({
  include_cost_breakdown: z.boolean().default(true),
  send: z.boolean().default(false),
  recipient_email: z.string().email().optional(),
  recipient_name: z.string().max(200).optional(),
});
const ListQ = z.object({
  project_id: z.string().uuid().optional(),
  status: z.enum(['draft', 'final', 'sent', 'awarded', 'lost']).optional(),
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const val = (reply: FastifyReply, e: z.ZodError) =>
  reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: 'Validation failed', fields: e.errors.map((x) => ({ field: x.path.join('.'), message: x.message })) } });

function estParams(e: Record<string, unknown>): EstimateParams {
  return {
    labor_rate_cents: Number(e.labor_rate_cents),
    overhead_pct: Number(e.overhead_pct), profit_pct: Number(e.profit_pct),
    tax_pct: Number(e.tax_pct), contingency_pct: Number(e.contingency_pct),
  };
}

export async function estimateRoutes(app: FastifyInstance): Promise<void> {
  // ── Create ───────────────────────────────────────────────────────────────
  app.post('/estimates', { preHandler: [authenticate, requireRole(...W)] }, async (req, reply) => {
    const body = CreateSchema.safeParse(req.body);
    if (!body.success) return val(reply, body.error);
    const { tenant_id, user_id, email, role } = req.jwt;
    const d = body.data;
    const row = await withTenantContext(tenant_id, async (client) => {
      const { rows } = await client.query(
        `INSERT INTO estimates
           (tenant_id, project_id, name, trade, building_type, mode, labor_rate_cents, overhead_pct, profit_pct, tax_pct, contingency_pct, notes, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
        [tenant_id, d.project_id ?? null, d.name, d.trade ?? null, d.building_type ?? null, d.mode, d.labor_rate_cents, d.overhead_pct, d.profit_pct, d.tax_pct, d.contingency_pct, d.notes ?? null, user_id]);
      await writeAuditEntry(client, { tenantId: tenant_id, category: 'data', action: 'estimate.created', actorId: user_id, actorEmail: email, actorRole: role, resourceType: 'estimate', resourceId: rows[0].id, payload: { name: d.name, mode: d.mode }, ipAddress: req.ip });
      return rows[0];
    });
    return reply.status(201).send({ estimate: row });
  });

  // ── List ─────────────────────────────────────────────────────────────────
  app.get('/estimates', { preHandler: [authenticate] }, async (req, reply) => {
    const q = ListQ.safeParse(req.query);
    if (!q.success) return val(reply, q.error);
    const { tenant_id } = req.jwt; const { project_id, status, cursor, limit } = q.data;
    const items = await withTenantContext(tenant_id, async (client) => {
      const params: unknown[] = [limit + 1]; const conds = ['deleted_at IS NULL']; let idx = 2;
      if (project_id) { conds.push(`project_id=$${idx++}`); params.push(project_id); }
      if (status) { conds.push(`status=$${idx++}`); params.push(status); }
      if (cursor) { conds.push(`(created_at,id)<(SELECT created_at,id FROM estimates WHERE id=$${idx++})`); params.push(cursor); }
      const { rows } = await client.query(`SELECT * FROM estimates WHERE ${conds.join(' AND ')} ORDER BY created_at DESC,id DESC LIMIT $1`, params);
      return rows;
    });
    const hasMore = items.length > limit; const data = hasMore ? items.slice(0, limit) : items;
    return reply.status(200).send({ estimates: data, pagination: { has_more: hasMore, next_cursor: hasMore ? data[data.length - 1].id : null } });
  });

  // ── Detail (header + lines) ────────────────────────────────────────────────
  app.get('/estimates/:id', { preHandler: [authenticate] }, async (req, reply) => {
    const { id } = req.params as { id: string }; const { tenant_id } = req.jwt;
    const result = await withTenantContext(tenant_id, async (client) => {
      const { rows } = await client.query(`SELECT * FROM estimates WHERE id=$1 AND deleted_at IS NULL`, [id]);
      if (rows.length === 0) return null;
      const { rows: lines } = await client.query(`SELECT * FROM estimate_line_items WHERE estimate_id=$1 AND deleted_at IS NULL ORDER BY sort_order, created_at`, [id]);
      return { estimate: rows[0], line_items: lines };
    });
    if (!result) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Estimate not found' } });
    return reply.status(200).send(result);
  });

  // ── Update header (params/status) → recompute totals ───────────────────────
  app.patch('/estimates/:id', { preHandler: [authenticate, requireRole(...W)] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const body = UpdateSchema.safeParse(req.body);
    if (!body.success) return val(reply, body.error);
    const { tenant_id, user_id, email, role } = req.jwt; const d = body.data;
    const result = await withTenantContext(tenant_id, async (client) => {
      const sets = ['version=version+1', 'updated_at=NOW()']; const params: unknown[] = []; let idx = 1;
      for (const k of ['name', 'trade', 'mode', 'status', 'labor_rate_cents', 'overhead_pct', 'profit_pct', 'tax_pct', 'contingency_pct', 'notes'] as const) {
        if (d[k] !== undefined) { params.push(d[k]); sets.push(`${k}=$${idx++}`); }
      }
      params.push(id, d.version);
      const { rows } = await client.query(`UPDATE estimates SET ${sets.join(',')} WHERE id=$${idx} AND version=$${idx + 1} AND deleted_at IS NULL AND status <> 'awarded' RETURNING *`, params);
      if (rows.length === 0) {
        const { rows: c } = await client.query(`SELECT status FROM estimates WHERE id=$1 AND deleted_at IS NULL`, [id]);
        if (c.length === 0) return { status: 'not_found' as const, row: null };
        if (c[0].status === 'awarded') return { status: 'locked' as const, row: null };
        return { status: 'conflict' as const, row: null };
      }
      await recomputeEstimateTotals(client, id);
      const { rows: fresh } = await client.query(`SELECT * FROM estimates WHERE id=$1`, [id]);
      await writeAuditEntry(client, { tenantId: tenant_id, category: 'data', action: 'estimate.updated', actorId: user_id, actorEmail: email, actorRole: role, resourceType: 'estimate', resourceId: id, payload: d, ipAddress: req.ip });
      return { status: 'ok' as const, row: fresh[0] };
    });
    if (result.status === 'not_found') return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Estimate not found' } });
    if (result.status === 'locked') return reply.status(409).send({ error: { code: 'ESTIMATE_AWARDED', message: 'An awarded estimate cannot be edited.' } });
    if (result.status === 'conflict') return reply.status(409).send({ error: { code: 'VERSION_CONFLICT', message: 'Version conflict' } });
    return reply.status(200).send({ estimate: result.row });
  });

  // ── Delete ────────────────────────────────────────────────────────────────
  app.delete('/estimates/:id', { preHandler: [authenticate, requireRole(...W)] }, async (req, reply) => {
    const { id } = req.params as { id: string }; const { tenant_id, user_id, email, role } = req.jwt;
    const deleted = await withTenantContext(tenant_id, async (client) => {
      const { rows } = await client.query(`UPDATE estimates SET deleted_at=NOW() WHERE id=$1 AND deleted_at IS NULL RETURNING id`, [id]);
      if (rows.length > 0) await writeAuditEntry(client, { tenantId: tenant_id, category: 'data', action: 'estimate.deleted', actorId: user_id, actorEmail: email, actorRole: role, resourceType: 'estimate', resourceId: id, payload: {}, ipAddress: req.ip });
      return rows[0] ?? null;
    });
    if (!deleted) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Estimate not found' } });
    return reply.status(204).send();
  });

  // ── Generate (deterministic) ───────────────────────────────────────────────
  app.post('/estimates/:id/generate', { preHandler: [authenticate, requireRole(...W)] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const body = GenerateSchema.safeParse(req.body ?? {});
    if (!body.success) return val(reply, body.error);
    const { tenant_id, user_id, email, role } = req.jwt;
    const result = await withTenantContext(tenant_id, async (client) => {
      const { rows } = await client.query(`SELECT id, status FROM estimates WHERE id=$1 AND deleted_at IS NULL`, [id]);
      if (rows.length === 0) return { status: 'not_found' as const };
      if (rows[0].status === 'awarded') return { status: 'locked' as const };
      const { line_count } = await generateEstimateLines(client, tenant_id, id, body.data);
      const { rows: fresh } = await client.query(`SELECT * FROM estimates WHERE id=$1`, [id]);
      const { rows: lines } = await client.query(`SELECT * FROM estimate_line_items WHERE estimate_id=$1 AND deleted_at IS NULL ORDER BY sort_order`, [id]);
      await writeAuditEntry(client, { tenantId: tenant_id, category: 'data', action: 'estimate.generated', actorId: user_id, actorEmail: email, actorRole: role, resourceType: 'estimate', resourceId: id, payload: { line_count, ...body.data }, ipAddress: req.ip });
      return { status: 'ok' as const, estimate: fresh[0], line_items: lines, line_count };
    });
    if (result.status === 'not_found') return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Estimate not found' } });
    if (result.status === 'locked') return reply.status(409).send({ error: { code: 'ESTIMATE_AWARDED', message: 'An awarded estimate cannot be regenerated.' } });
    return reply.status(200).send({ estimate: result.estimate, line_items: result.line_items, line_count: result.line_count });
  });

  // ── Add a manual line ──────────────────────────────────────────────────────
  app.post('/estimates/:id/line-items', { preHandler: [authenticate, requireRole(...W)] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const body = LineCreateSchema.safeParse(req.body);
    if (!body.success) return val(reply, body.error);
    const { tenant_id, user_id, email, role } = req.jwt; const d = body.data;
    const result = await withTenantContext(tenant_id, async (client) => {
      const { rows: er } = await client.query(`SELECT * FROM estimates WHERE id=$1 AND deleted_at IS NULL`, [id]);
      if (er.length === 0) return { status: 'not_found' as const, row: null };
      if (er[0].status === 'awarded') return { status: 'locked' as const, row: null };
      const a = computeAmounts({ quantity: d.quantity, material_unit_cents: d.material_unit_cents, labor_hours_per_unit: d.labor_hours_per_unit, equipment_unit_cents: d.equipment_unit_cents, waste_pct: d.waste_pct }, Number(er[0].labor_rate_cents));
      const { rows: so } = await client.query(`SELECT COALESCE(MAX(sort_order),0)+10 AS n FROM estimate_line_items WHERE estimate_id=$1 AND deleted_at IS NULL`, [id]);
      const { rows } = await client.query(
        `INSERT INTO estimate_line_items
           (tenant_id, estimate_id, trade, description, csi_division, unit, quantity, material_unit_cents,
            labor_hours_per_unit, equipment_unit_cents, waste_pct, material_cents, labor_hours, labor_cents,
            equipment_cents, extended_cents, assumptions, source, sort_order, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17::jsonb,'manual',$18,$19) RETURNING *`,
        [tenant_id, id, d.trade ?? er[0].trade ?? null, d.description, d.csi_division ?? null, d.unit ?? null, d.quantity, d.material_unit_cents,
         d.labor_hours_per_unit, d.equipment_unit_cents, d.waste_pct, a.material_cents, a.labor_hours, a.labor_cents,
         a.equipment_cents, a.extended_cents, JSON.stringify(d.assumptions ?? []), so[0].n, user_id]);
      await recomputeEstimateTotals(client, id);
      return { status: 'ok' as const, row: rows[0] };
    });
    if (result.status === 'not_found') return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Estimate not found' } });
    if (result.status === 'locked') return reply.status(409).send({ error: { code: 'ESTIMATE_AWARDED', message: 'An awarded estimate cannot be edited.' } });
    return reply.status(201).send({ line_item: result.row });
  });

  // ── Edit a line (optimistic lock) → recompute the line + header ─────────────
  app.patch('/estimates/:id/line-items/:lid', { preHandler: [authenticate, requireRole(...W)] }, async (req, reply) => {
    const { id, lid } = req.params as { id: string; lid: string };
    const body = LineUpdateSchema.safeParse(req.body);
    if (!body.success) return val(reply, body.error);
    const { tenant_id } = req.jwt; const d = body.data;
    const result = await withTenantContext(tenant_id, async (client) => {
      const { rows: er } = await client.query(`SELECT labor_rate_cents, status FROM estimates WHERE id=$1 AND deleted_at IS NULL`, [id]);
      if (er.length === 0) return { status: 'not_found' as const, row: null };
      if (er[0].status === 'awarded') return { status: 'locked' as const, row: null };
      const { rows: cur } = await client.query(`SELECT * FROM estimate_line_items WHERE id=$1 AND estimate_id=$2 AND deleted_at IS NULL`, [lid, id]);
      if (cur.length === 0) return { status: 'not_found' as const, row: null };
      if (cur[0].version !== d.version) return { status: 'conflict' as const, row: null };
      const merged = {
        quantity: d.quantity ?? Number(cur[0].quantity),
        material_unit_cents: d.material_unit_cents ?? cur[0].material_unit_cents,
        labor_hours_per_unit: d.labor_hours_per_unit ?? Number(cur[0].labor_hours_per_unit),
        equipment_unit_cents: d.equipment_unit_cents ?? cur[0].equipment_unit_cents,
        waste_pct: d.waste_pct ?? Number(cur[0].waste_pct),
      };
      const a = computeAmounts(merged, Number(er[0].labor_rate_cents));
      const { rows } = await client.query(
        `UPDATE estimate_line_items SET
           description=COALESCE($3,description), csi_division=$4, unit=$5,
           quantity=$6, material_unit_cents=$7, labor_hours_per_unit=$8, equipment_unit_cents=$9, waste_pct=$10,
           material_cents=$11, labor_hours=$12, labor_cents=$13, equipment_cents=$14, extended_cents=$15,
           version=version+1, updated_at=NOW()
         WHERE id=$1 AND estimate_id=$2 AND version=$16 AND deleted_at IS NULL RETURNING *`,
        [lid, id, d.description ?? null, d.csi_division ?? cur[0].csi_division, d.unit ?? cur[0].unit,
         merged.quantity, merged.material_unit_cents, merged.labor_hours_per_unit, merged.equipment_unit_cents, merged.waste_pct,
         a.material_cents, a.labor_hours, a.labor_cents, a.equipment_cents, a.extended_cents, d.version]);
      if (rows.length === 0) return { status: 'conflict' as const, row: null };
      await recomputeEstimateTotals(client, id);
      return { status: 'ok' as const, row: rows[0] };
    });
    if (result.status === 'not_found') return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Line item not found' } });
    if (result.status === 'locked') return reply.status(409).send({ error: { code: 'ESTIMATE_AWARDED', message: 'An awarded estimate cannot be edited.' } });
    if (result.status === 'conflict') return reply.status(409).send({ error: { code: 'VERSION_CONFLICT', message: 'Version conflict' } });
    return reply.status(200).send({ line_item: result.row });
  });

  // ── Delete a line ──────────────────────────────────────────────────────────
  app.delete('/estimates/:id/line-items/:lid', { preHandler: [authenticate, requireRole(...W)] }, async (req, reply) => {
    const { id, lid } = req.params as { id: string; lid: string }; const { tenant_id } = req.jwt;
    const result = await withTenantContext(tenant_id, async (client) => {
      const { rows: er } = await client.query(`SELECT status FROM estimates WHERE id=$1 AND deleted_at IS NULL`, [id]);
      if (er.length === 0) return 'not_found';
      if (er[0].status === 'awarded') return 'locked';
      const { rows } = await client.query(`UPDATE estimate_line_items SET deleted_at=NOW() WHERE id=$1 AND estimate_id=$2 AND deleted_at IS NULL RETURNING id`, [lid, id]);
      if (rows.length === 0) return 'not_found';
      await recomputeEstimateTotals(client, id);
      return 'ok';
    });
    if (result === 'not_found') return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Line item not found' } });
    if (result === 'locked') return reply.status(409).send({ error: { code: 'ESTIMATE_AWARDED', message: 'An awarded estimate cannot be edited.' } });
    return reply.status(204).send();
  });

  // ── Convert to a bid package (+ takeoff items) ─────────────────────────────
  app.post('/estimates/:id/to-bid-package', { preHandler: [authenticate, requireRole(...W)] }, async (req, reply) => {
    const { id } = req.params as { id: string }; const { tenant_id, user_id, email, role } = req.jwt;
    const result = await withTenantContext(tenant_id, async (client) => {
      const { rows: er } = await client.query(`SELECT * FROM estimates WHERE id=$1 AND deleted_at IS NULL`, [id]);
      if (er.length === 0) return { status: 'not_found' as const };
      if (!er[0].project_id) return { status: 'no_project' as const };
      const { rows: lines } = await client.query(`SELECT * FROM estimate_line_items WHERE estimate_id=$1 AND deleted_at IS NULL ORDER BY sort_order`, [id]);
      const { rows: bp } = await client.query(
        `INSERT INTO bid_packages (tenant_id, project_id, title, status, created_by) VALUES ($1,$2,$3,'draft',$4) RETURNING *`,
        [tenant_id, er[0].project_id, `${er[0].name} (from estimate)`, user_id]);
      for (const l of lines) {
        const unitCost = Number(l.quantity) > 0 ? Math.floor(l.extended_cents / Number(l.quantity)) : l.extended_cents;
        await client.query(
          `INSERT INTO takeoff_items (tenant_id, project_id, bid_package_id, description, quantity, unit, unit_cost_cents, assembly_code, created_by)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
          [tenant_id, er[0].project_id, bp[0].id, l.description, l.quantity, l.unit, unitCost, l.assembly_code ?? null, user_id]);
      }
      await writeAuditEntry(client, { tenantId: tenant_id, category: 'data', action: 'estimate.to_bid_package', actorId: user_id, actorEmail: email, actorRole: role, resourceType: 'estimate', resourceId: id, payload: { bid_package_id: bp[0].id, line_count: lines.length }, ipAddress: req.ip });
      return { status: 'ok' as const, bid_package: bp[0], takeoff_count: lines.length };
    });
    if (result.status === 'not_found') return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Estimate not found' } });
    if (result.status === 'no_project') return reply.status(422).send({ error: { code: 'PROJECT_REQUIRED', message: 'Attach the estimate to a project before creating a bid package.' } });
    return reply.status(201).send({ bid_package: result.bid_package, takeoff_count: result.takeoff_count });
  });

  // ── Award → seed budget_line_items + lock status ───────────────────────────
  app.post('/estimates/:id/award', { preHandler: [authenticate, requireRole(...W)] }, async (req, reply) => {
    const { id } = req.params as { id: string }; const { tenant_id, user_id, email, role } = req.jwt;
    const result = await withTenantContext(tenant_id, async (client) => {
      const { rows: er } = await client.query(`SELECT * FROM estimates WHERE id=$1 AND deleted_at IS NULL`, [id]);
      if (er.length === 0) return { status: 'not_found' as const };
      if (!er[0].project_id) return { status: 'no_project' as const };
      if (er[0].status === 'awarded') return { status: 'already' as const };
      const { rows: lines } = await client.query(`SELECT * FROM estimate_line_items WHERE estimate_id=$1 AND deleted_at IS NULL ORDER BY sort_order`, [id]);
      let seeded = 0;
      for (const l of lines) {
        await client.query(
          `INSERT INTO budget_line_items (tenant_id, project_id, description, budget_cents, assembly_code, created_by)
           VALUES ($1,$2,$3,$4,$5,$6)`,
          [tenant_id, er[0].project_id, l.description, l.extended_cents, l.assembly_code ?? null, user_id]);
        seeded++;
      }
      const { rows: upd } = await client.query(`UPDATE estimates SET status='awarded', updated_at=NOW(), version=version+1 WHERE id=$1 RETURNING *`, [id]);
      await writeAuditEntry(client, { tenantId: tenant_id, category: 'data', action: 'estimate.awarded', actorId: user_id, actorEmail: email, actorRole: role, resourceType: 'estimate', resourceId: id, payload: { budget_lines_seeded: seeded, total_cents: er[0].total_cents }, ipAddress: req.ip });
      return { status: 'ok' as const, estimate: upd[0], budget_lines_seeded: seeded };
    });
    if (result.status === 'not_found') return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Estimate not found' } });
    if (result.status === 'no_project') return reply.status(422).send({ error: { code: 'PROJECT_REQUIRED', message: 'Attach the estimate to a project before awarding.' } });
    if (result.status === 'already') return reply.status(409).send({ error: { code: 'ESTIMATE_AWARDED', message: 'Estimate is already awarded.' } });
    return reply.status(200).send({ estimate: result.estimate, budget_lines_seeded: result.budget_lines_seeded });
  });

  // ── Generate (+ optionally send) a customer proposal PDF ───────────────────
  app.post('/estimates/:id/proposal', { preHandler: [authenticate, requireRole(...W)] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const body = ProposalSchema.safeParse(req.body ?? {});
    if (!body.success) return val(reply, body.error);
    const d = body.data;
    if (d.send && !d.recipient_email) return reply.status(422).send({ error: { code: 'RECIPIENT_REQUIRED', message: 'A recipient email is required to send the proposal.' } });
    const { tenant_id, user_id, email, role } = req.jwt;
    const generatedOn = new Date().toISOString().slice(0, 10);

    const result = await withTenantContext(tenant_id, async (client) => {
      const { rows: er } = await client.query(`SELECT * FROM estimates WHERE id=$1 AND deleted_at IS NULL`, [id]);
      if (er.length === 0) return { status: 'not_found' as const };
      const estimate = er[0];
      const { rows: lines } = await client.query(`SELECT * FROM estimate_line_items WHERE estimate_id=$1 AND deleted_at IS NULL ORDER BY sort_order, created_at`, [id]);
      const { rows: tn } = await client.query(`SELECT name FROM tenants WHERE id=$1`, [tenant_id]);
      let projectName: string | null = null;
      if (estimate.project_id) {
        const { rows: pr } = await client.query(`SELECT name FROM projects WHERE id=$1 AND deleted_at IS NULL`, [estimate.project_id]);
        projectName = pr[0]?.name ?? null;
      }

      const pdf = await renderProposalPdf({
        tenantName: tn[0]?.name ?? 'Proposal',
        projectName,
        estimate,
        lineItems: lines,
        includeCostBreakdown: d.include_cost_breakdown,
        generatedOn,
      });

      const storagePath = `${tenant_id}/live/estimates/proposals/${id}.pdf`;
      await storageClient.send(new PutObjectCommand({ Bucket: LIVE_BUCKET, Key: storagePath, Body: pdf, ContentType: 'application/pdf' }));

      // Sending reuses the FSM 'sent' status; never downgrade awarded/lost/already-sent.
      const markSent = d.send && (estimate.status === 'draft' || estimate.status === 'final');
      const { rows: upd } = await client.query(
        `UPDATE estimates SET proposal_path=$2, proposal_generated_at=NOW(), updated_at=NOW()${markSent ? ", status='sent'" : ''} WHERE id=$1 RETURNING *`,
        [id, storagePath]);

      let sent = false;
      if (d.send && d.recipient_email) {
        try {
          const link = await generateDownloadUrl(storagePath, PROPOSAL_URL_TTL);
          const sendgridKey = process.env.SENDGRID_API_KEY;
          if (sendgridKey) {
            await fetch('https://api.sendgrid.com/v3/mail/send', {
              method: 'POST',
              headers: { Authorization: `Bearer ${sendgridKey}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({
                to: [{ email: d.recipient_email, name: d.recipient_name ?? undefined }],
                from: { email: process.env.SENDGRID_FROM_EMAIL ?? 'noreply@platform.app', name: tn[0]?.name ?? 'Proposal' },
                subject: `Proposal — ${estimate.name}`,
                content: [{ type: 'text/plain', value: `Hello${d.recipient_name ? ' ' + d.recipient_name : ''},\n\nPlease find our proposal "${estimate.name}" at the link below (valid for 7 days):\n\n${link}\n\nThank you,\n${tn[0]?.name ?? ''}\n` }],
              }),
            });
            sent = true;
          } else {
            console.info({ tenant_id, estimate_id: id, recipient: d.recipient_email }, 'estimates: proposal ready (SendGrid not configured — skipping email)');
          }
        } catch (err) {
          console.error({ err }, 'estimates: proposal email delivery failed');
        }
      }

      await writeAuditEntry(client, { tenantId: tenant_id, category: 'data', action: 'estimate.proposal_generated', actorId: user_id, actorEmail: email, actorRole: role, resourceType: 'estimate', resourceId: id, payload: { include_cost_breakdown: d.include_cost_breakdown, sent, marked_sent: markSent }, ipAddress: req.ip });
      const downloadUrl = await generateDownloadUrl(storagePath); // 15-min in-app link
      return { status: 'ok' as const, estimate: upd[0], download_url: downloadUrl, sent };
    });

    if (result.status === 'not_found') return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Estimate not found' } });
    return reply.status(200).send({ estimate: result.estimate, download_url: result.download_url, sent: result.sent });
  });

  // ── Fetch a fresh download URL for an already-generated proposal ────────────
  app.get('/estimates/:id/proposal', { preHandler: [authenticate] }, async (req, reply) => {
    const { id } = req.params as { id: string }; const { tenant_id } = req.jwt;
    const result = await withTenantContext(tenant_id, async (client) => {
      const { rows } = await client.query(`SELECT proposal_path, proposal_generated_at FROM estimates WHERE id=$1 AND deleted_at IS NULL`, [id]);
      if (rows.length === 0) return { status: 'not_found' as const };
      if (!rows[0].proposal_path) return { status: 'none' as const };
      const url = await generateDownloadUrl(rows[0].proposal_path);
      return { status: 'ok' as const, download_url: url, generated_at: rows[0].proposal_generated_at };
    });
    if (result.status === 'not_found') return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Estimate not found' } });
    if (result.status === 'none') return reply.status(404).send({ error: { code: 'PROPOSAL_NOT_GENERATED', message: 'No proposal has been generated for this estimate yet.' } });
    return reply.status(200).send({ download_url: result.download_url, generated_at: result.generated_at });
  });
}
