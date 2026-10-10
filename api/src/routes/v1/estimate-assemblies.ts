// routes/v1/estimate-assemblies.ts — the estimating cost catalog.
//
// System rows (is_system, sentinel tenant) ship with the platform and are readable by every tenant.
// A tenant creates its own rows; a tenant row with the same (trade, code) OVERRIDES a system row in
// the engine's cascade. System rows are read-only to tenants (create an override instead). No tier gate.

import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { withTenantContext } from '../../lib/tenant-context.js';
import { writeAuditEntry } from '../../lib/audit-log.js';
import { getAssemblySuggestions } from '../../services/estimates.js';
import { authenticate, requireRole } from '../../plugins/auth-plugin.js';

const TRADES = ['electrical', 'plumbing', 'mechanical', 'building', 'general'] as const;
const W = ['OWNER', 'PROJECT_MANAGER', 'ESTIMATOR'] as const;

const CreateSchema = z.object({
  trade: z.enum(TRADES),
  code: z.string().min(1).max(64).regex(/^[A-Za-z0-9_-]+$/, 'code: letters/numbers/-/_ only'),
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  unit: z.string().min(1).max(20).default('EA'),
  csi_division: z.string().max(32).optional(),
  material_cost_cents: z.number().int().min(0).default(0),
  labor_hours_per_unit: z.number().min(0).max(10000).default(0),
  equipment_cost_cents: z.number().int().min(0).default(0),
  waste_pct: z.number().min(0).max(100).default(0),
});
const UpdateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional().nullable(),
  unit: z.string().min(1).max(20).optional(),
  csi_division: z.string().max(32).optional().nullable(),
  material_cost_cents: z.number().int().min(0).optional(),
  labor_hours_per_unit: z.number().min(0).max(10000).optional(),
  equipment_cost_cents: z.number().int().min(0).optional(),
  waste_pct: z.number().min(0).max(100).optional(),
  is_active: z.boolean().optional(),
  version: z.number().int().min(1),
});
const ListQ = z.object({ trade: z.enum(TRADES).optional() });

const val = (reply: FastifyReply, e: z.ZodError) =>
  reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: 'Validation failed', fields: e.errors.map((x) => ({ field: x.path.join('.'), message: x.message })) } });

export async function estimateAssemblyRoutes(app: FastifyInstance): Promise<void> {
  // List merged catalog (system + tenant). Tenant rows shadow system rows by (trade, code) client-side.
  app.get('/estimate-assemblies', { preHandler: [authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const q = ListQ.safeParse(req.query);
    if (!q.success) return val(reply, q.error);
    const { tenant_id } = req.jwt;
    const rows = await withTenantContext(tenant_id, async (client) => {
      const params: unknown[] = []; let where = `deleted_at IS NULL`;
      if (q.data.trade) { params.push(q.data.trade); where += ` AND trade = $1`; }
      const { rows } = await client.query(
        `SELECT * FROM estimate_assemblies WHERE ${where} ORDER BY trade, code`, params);
      return rows;
    });
    return reply.status(200).send({ assemblies: rows });
  });

  // Learn-from-actuals suggestions (Phase 2b) — advisory per-(trade, code) hints from tenant history.
  // Registered before /:id routes (static path wins). Read = any authed org user.
  app.get('/estimate-assemblies/suggestions', { preHandler: [authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const q = ListQ.safeParse(req.query);
    if (!q.success) return val(reply, q.error);
    const { tenant_id } = req.jwt;
    const suggestions = await withTenantContext(tenant_id, (client) => getAssemblySuggestions(client, q.data.trade));
    return reply.status(200).send({ suggestions });
  });

  app.post('/estimate-assemblies', { preHandler: [authenticate, requireRole(...W)] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const body = CreateSchema.safeParse(req.body);
    if (!body.success) return val(reply, body.error);
    const { tenant_id, user_id, email, role } = req.jwt;
    const d = body.data;
    try {
      const row = await withTenantContext(tenant_id, async (client) => {
        const { rows } = await client.query(
          `INSERT INTO estimate_assemblies
             (tenant_id, trade, code, name, description, unit, csi_division, material_cost_cents,
              labor_hours_per_unit, equipment_cost_cents, waste_pct, is_system, source, created_by)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,FALSE,'tenant',$12) RETURNING *`,
          [tenant_id, d.trade, d.code, d.name, d.description ?? null, d.unit, d.csi_division ?? null,
           d.material_cost_cents, d.labor_hours_per_unit, d.equipment_cost_cents, d.waste_pct, user_id]);
        await writeAuditEntry(client, { tenantId: tenant_id, category: 'data', action: 'estimate_assembly.created', actorId: user_id, actorEmail: email, actorRole: role, resourceType: 'estimate_assembly', resourceId: rows[0].id, payload: { trade: d.trade, code: d.code }, ipAddress: req.ip });
        return rows[0];
      });
      return reply.status(201).send({ assembly: row });
    } catch (e) {
      if ((e as { code?: string }).code === '23505') return reply.status(409).send({ error: { code: 'DUPLICATE_CODE', message: `An assembly with code "${d.code}" already exists for ${d.trade}.` } });
      throw e;
    }
  });

  app.patch('/estimate-assemblies/:id', { preHandler: [authenticate, requireRole(...W)] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    const body = UpdateSchema.safeParse(req.body);
    if (!body.success) return val(reply, body.error);
    const { tenant_id, user_id, email, role } = req.jwt;
    const d = body.data;
    const result = await withTenantContext(tenant_id, async (client) => {
      const { rows: cur } = await client.query(`SELECT is_system FROM estimate_assemblies WHERE id=$1 AND deleted_at IS NULL`, [id]);
      if (cur.length === 0) return { status: 'not_found' as const, row: null };
      if (cur[0].is_system) return { status: 'system' as const, row: null };
      const sets = ['version=version+1', 'updated_at=NOW()']; const params: unknown[] = []; let idx = 1;
      for (const k of ['name', 'description', 'unit', 'csi_division', 'material_cost_cents', 'labor_hours_per_unit', 'equipment_cost_cents', 'waste_pct', 'is_active'] as const) {
        if (d[k] !== undefined) { params.push(d[k]); sets.push(`${k}=$${idx++}`); }
      }
      params.push(id, d.version);
      const { rows } = await client.query(`UPDATE estimate_assemblies SET ${sets.join(',')} WHERE id=$${idx} AND version=$${idx + 1} AND deleted_at IS NULL RETURNING *`, params);
      if (rows.length > 0) {
        await writeAuditEntry(client, { tenantId: tenant_id, category: 'data', action: 'estimate_assembly.updated', actorId: user_id, actorEmail: email, actorRole: role, resourceType: 'estimate_assembly', resourceId: id, payload: d, ipAddress: req.ip });
        return { status: 'ok' as const, row: rows[0] };
      }
      return { status: 'conflict' as const, row: null };
    });
    if (result.status === 'not_found') return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Assembly not found' } });
    if (result.status === 'system') return reply.status(403).send({ error: { code: 'SYSTEM_ASSEMBLY_READONLY', message: 'System assemblies are read-only. Create a tenant assembly with the same code to override it.' } });
    if (result.status === 'conflict') return reply.status(409).send({ error: { code: 'VERSION_CONFLICT', message: 'Version conflict' } });
    return reply.status(200).send({ assembly: result.row });
  });

  app.delete('/estimate-assemblies/:id', { preHandler: [authenticate, requireRole(...W)] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    const { tenant_id, user_id, email, role } = req.jwt;
    const result = await withTenantContext(tenant_id, async (client) => {
      const { rows: cur } = await client.query(`SELECT is_system FROM estimate_assemblies WHERE id=$1 AND deleted_at IS NULL`, [id]);
      if (cur.length === 0) return 'not_found';
      if (cur[0].is_system) return 'system';
      await client.query(`UPDATE estimate_assemblies SET deleted_at=NOW() WHERE id=$1`, [id]);
      await writeAuditEntry(client, { tenantId: tenant_id, category: 'data', action: 'estimate_assembly.deleted', actorId: user_id, actorEmail: email, actorRole: role, resourceType: 'estimate_assembly', resourceId: id, payload: {}, ipAddress: req.ip });
      return 'ok';
    });
    if (result === 'not_found') return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Assembly not found' } });
    if (result === 'system') return reply.status(403).send({ error: { code: 'SYSTEM_ASSEMBLY_READONLY', message: 'System assemblies cannot be deleted.' } });
    return reply.status(204).send();
  });
}
