// routes/v1/asset-inspections.ts — Asset inspections + inspection templates
// Locked decisions: T-56 (Business+ gate), T-12 (optimistic locking)
// OOS auto-sync: failed inspection → company_assets.status = 'out_of_service' in same tx

import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { withTenantContext } from '../../lib/tenant-context.js';
import { writeAuditEntry } from '../../lib/audit-log.js';
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

// Columns mirror migration 0010 asset_inspection_templates exactly (no `description`, no `version`).
const FREQ = ['pre_use', 'daily', 'weekly', 'monthly', 'annual'] as const;

const TemplateCreateSchema = z.object({
  name: z.string().min(1),
  asset_category: z.string().optional().nullable(),
  asset_type: z.string().optional().nullable(),
  inspection_frequency: z.enum(FREQ).default('pre_use'),
  is_osha_required: z.boolean().optional(),
  is_dot_required: z.boolean().optional(),
  is_system_template: z.boolean().optional(), // ignored — always FALSE on tenant create
  checklist_items: z.array(z.any()).min(1),
});

const TemplateUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  asset_category: z.string().optional().nullable(),
  asset_type: z.string().optional().nullable(),
  inspection_frequency: z.enum(FREQ).optional(),
  is_osha_required: z.boolean().optional(),
  is_dot_required: z.boolean().optional(),
  is_active: z.boolean().optional(),
  checklist_items: z.array(z.any()).optional(),
});

// Columns mirror migration 0010 asset_inspections exactly.
const InspectionCreateSchema = z.object({
  template_id: z.string().uuid().optional().nullable(),
  inspection_type: z.enum(['pre_use', 'daily', 'weekly', 'monthly', 'annual', 'osha', 'dot', 'return', 'calibration']).default('pre_use'),
  inspected_at: z.string().min(1), // ISO datetime
  meter_reading: z.number().optional().nullable(),
  result: z.enum(['pass', 'fail', 'conditional']),
  out_of_service: z.boolean().optional(),
  notes: z.string().optional().nullable(),
  checklist_responses: z.array(z.any()).optional().nullable(),
  defects_noted: z.array(z.any()).optional().nullable(),
});

export async function assetInspectionRoutes(app: FastifyInstance): Promise<void> {

  // ── Inspection Templates ───────────────────────────────────────────────────

  app.get('/asset-inspection-templates', { preHandler: [authenticate, requireRole('OWNER', 'PROJECT_MANAGER', 'FOREMAN')] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const tenant_id = await guardTier(req, reply);
      if (!tenant_id) return;
      return withTenantContext(tenant_id, async (client) => {
        // Return tenant templates + system templates
        const res = await client.query(
          `SELECT * FROM asset_inspection_templates WHERE (tenant_id = current_setting('app.current_tenant_id')::uuid OR is_system_template = TRUE) AND deleted_at IS NULL ORDER BY is_system_template DESC, name ASC`
        );
        return reply.send({ templates: res.rows });
      });
    },
  );

  app.post('/asset-inspection-templates', { preHandler: [authenticate, requireRole('OWNER', 'PROJECT_MANAGER')] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const tenant_id = await guardTier(req, reply);
      if (!tenant_id) return;
      const body = TemplateCreateSchema.safeParse(req.body);
      if (!body.success) return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: body.error.issues[0]?.message } });
      const { user_id, email, role } = (req as any).jwt;
      const d = body.data;
      return withTenantContext(tenant_id, async (client) => {
        const res = await client.query(
          `INSERT INTO asset_inspection_templates (tenant_id, name, asset_category, asset_type, inspection_frequency, is_osha_required, is_dot_required, checklist_items, is_system_template, created_by)
           VALUES (current_setting('app.current_tenant_id')::uuid,$1,$2,$3,$4,$5,$6,$7,FALSE,$8) RETURNING *`,
          [d.name, d.asset_category ?? null, d.asset_type ?? null, d.inspection_frequency, d.is_osha_required ?? false, d.is_dot_required ?? false, JSON.stringify(d.checklist_items), user_id]
        );
        await writeAuditEntry(client, { tenantId: tenant_id, category: 'data', action: 'asset_inspection_template.created', actorId: user_id, actorEmail: email, actorRole: role, resourceType: 'asset_inspection_template', resourceId: res.rows[0].id, payload: { name: d.name }, ipAddress: (req as any).ip });
        return reply.status(201).send(res.rows[0]);
      });
    },
  );

  app.patch('/asset-inspection-templates/:tid', { preHandler: [authenticate, requireRole('OWNER', 'PROJECT_MANAGER')] },
    async (req: any, reply: FastifyReply) => {
      const tenant_id = await guardTier(req, reply);
      if (!tenant_id) return;
      const body = TemplateUpdateSchema.safeParse(req.body);
      if (!body.success) return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: body.error.issues[0]?.message } });
      const fields = body.data;
      return withTenantContext(tenant_id, async (client) => {
        const existing = await client.query(`SELECT id, is_system_template FROM asset_inspection_templates WHERE id = $1 AND deleted_at IS NULL`, [req.params.tid]);
        if (existing.rows.length === 0) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Template not found' } });
        if (existing.rows[0].is_system_template) return reply.status(403).send({ error: { code: 'SYSTEM_TEMPLATE_READONLY', message: 'System templates cannot be modified.' } });
        const sets: string[] = ['updated_at = NOW()']; const params: unknown[] = []; let i = 1;
        if (fields.name !== undefined) { sets.push(`name = $${i++}`); params.push(fields.name); }
        if ('asset_category' in fields) { sets.push(`asset_category = $${i++}`); params.push(fields.asset_category ?? null); }
        if ('asset_type' in fields) { sets.push(`asset_type = $${i++}`); params.push(fields.asset_type ?? null); }
        if (fields.inspection_frequency !== undefined) { sets.push(`inspection_frequency = $${i++}`); params.push(fields.inspection_frequency); }
        if (fields.is_osha_required !== undefined) { sets.push(`is_osha_required = $${i++}`); params.push(fields.is_osha_required); }
        if (fields.is_dot_required !== undefined) { sets.push(`is_dot_required = $${i++}`); params.push(fields.is_dot_required); }
        if (fields.is_active !== undefined) { sets.push(`is_active = $${i++}`); params.push(fields.is_active); }
        if (fields.checklist_items !== undefined) { sets.push(`checklist_items = $${i++}`); params.push(JSON.stringify(fields.checklist_items)); }
        params.push(req.params.tid);
        const res = await client.query(`UPDATE asset_inspection_templates SET ${sets.join(', ')} WHERE id = $${i++} AND deleted_at IS NULL RETURNING *`, params);
        if (res.rows.length === 0) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Template not found' } });
        return reply.send(res.rows[0]);
      });
    },
  );

  app.delete('/asset-inspection-templates/:tid', { preHandler: [authenticate, requireRole('OWNER')] },
    async (req: any, reply: FastifyReply) => {
      const tenant_id = await guardTier(req, reply);
      if (!tenant_id) return;
      return withTenantContext(tenant_id, async (client) => {
        const existing = await client.query(`SELECT id, is_system_template FROM asset_inspection_templates WHERE id = $1 AND deleted_at IS NULL`, [req.params.tid]);
        if (existing.rows.length === 0) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Template not found' } });
        if (existing.rows[0].is_system_template) return reply.status(403).send({ error: { code: 'SYSTEM_TEMPLATE_READONLY', message: 'System templates cannot be deleted.' } });
        await client.query(`UPDATE asset_inspection_templates SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1`, [req.params.tid]);
        return reply.status(204).send();
      });
    },
  );

  // ── Asset Inspections ──────────────────────────────────────────────────────

  app.get('/assets/:id/inspections', { preHandler: [authenticate, requireRole('OWNER', 'PROJECT_MANAGER', 'FOREMAN')] },
    async (req: any, reply: FastifyReply) => {
      const tenant_id = await guardTier(req, reply);
      if (!tenant_id) return;
      return withTenantContext(tenant_id, async (client) => {
        const res = await client.query(
          `SELECT ai.*, ait.template_name FROM asset_inspections ai LEFT JOIN asset_inspection_templates ait ON ait.id = ai.template_id WHERE ai.asset_id = $1 AND ai.deleted_at IS NULL ORDER BY ai.inspected_at DESC`,
          [req.params.id]
        );
        return reply.send({ inspections: res.rows });
      });
    },
  );

  app.post('/assets/:id/inspections', { preHandler: [authenticate, requireRole('OWNER', 'PROJECT_MANAGER', 'FOREMAN')] },
    async (req: any, reply: FastifyReply) => {
      const tenant_id = await guardTier(req, reply);
      if (!tenant_id) return;
      const body = InspectionCreateSchema.safeParse(req.body);
      if (!body.success) return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: body.error.issues[0]?.message } });
      const { user_id, email, role } = (req as any).jwt;
      const d = body.data;
      return withTenantContext(tenant_id, async (client) => {
        const oos = d.out_of_service ?? d.result === 'fail';
        const res = await client.query(
          `INSERT INTO asset_inspections (tenant_id, asset_id, template_id, inspection_type, inspected_at, inspected_by, meter_reading, result, out_of_service, out_of_service_at, notes, checklist_responses, defects_noted)
           VALUES (current_setting('app.current_tenant_id')::uuid,$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
          [req.params.id, d.template_id ?? null, d.inspection_type, d.inspected_at, user_id, d.meter_reading ?? null, d.result, oos, oos ? d.inspected_at : null, d.notes ?? null, d.checklist_responses ? JSON.stringify(d.checklist_responses) : null, d.defects_noted ? JSON.stringify(d.defects_noted) : null]
        );
        const inspection = res.rows[0];
        // OOS auto-sync: failed/flagged inspection sets asset out_of_service in SAME tx
        if (oos) {
          await client.query(`UPDATE company_assets SET status = 'out_of_service', updated_at = NOW() WHERE id = $1 AND deleted_at IS NULL`, [req.params.id]);
          await writeAuditEntry(client, { tenantId: tenant_id, category: 'data', action: 'asset.oos_auto_set', actorId: user_id, actorEmail: email, actorRole: role, resourceType: 'company_asset', resourceId: req.params.id, payload: { reason: 'failed_inspection', inspection_id: inspection.id }, ipAddress: (req as any).ip });
        }
        await writeAuditEntry(client, { tenantId: tenant_id, category: 'data', action: 'asset.inspection_created', actorId: user_id, actorEmail: email, actorRole: role, resourceType: 'asset_inspection', resourceId: inspection.id, payload: { asset_id: req.params.id, result: d.result, inspected_at: d.inspected_at }, ipAddress: (req as any).ip });
        return reply.status(201).send(inspection);
      });
    },
  );

  app.get('/assets/:id/inspections/:iid', { preHandler: [authenticate, requireRole('OWNER', 'PROJECT_MANAGER', 'FOREMAN')] },
    async (req: any, reply: FastifyReply) => {
      const tenant_id = await guardTier(req, reply);
      if (!tenant_id) return;
      return withTenantContext(tenant_id, async (client) => {
        const res = await client.query(`SELECT ai.*, ait.template_name FROM asset_inspections ai LEFT JOIN asset_inspection_templates ait ON ait.id = ai.template_id WHERE ai.id = $1 AND ai.asset_id = $2 AND ai.deleted_at IS NULL`, [req.params.iid, req.params.id]);
        if (res.rows.length === 0) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Inspection not found' } });
        return reply.send(res.rows[0]);
      });
    },
  );

  app.post('/assets/:id/inspections/:iid/return-to-service', { preHandler: [authenticate, requireRole('OWNER', 'PROJECT_MANAGER')] },
    async (req: any, reply: FastifyReply) => {
      const tenant_id = await guardTier(req, reply);
      if (!tenant_id) return;
      const { user_id, email, role } = (req as any).jwt;
      return withTenantContext(tenant_id, async (client) => {
        const existing = await client.query(`SELECT id FROM asset_inspections WHERE id = $1 AND asset_id = $2 AND deleted_at IS NULL`, [req.params.iid, req.params.id]);
        if (existing.rows.length === 0) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Inspection not found' } });
        // Clear OOS status on the asset ('active' is the in-service status; 'available' is not a valid enum value)
        const assetRes = await client.query(`UPDATE company_assets SET status = 'active', updated_at = NOW() WHERE id = $1 AND status = 'out_of_service' AND deleted_at IS NULL RETURNING id`, [req.params.id]);
        if (assetRes.rows.length === 0) return reply.status(422).send({ error: { code: 'NOT_OUT_OF_SERVICE', message: 'Asset is not currently out of service.' } });
        await client.query(`UPDATE asset_inspections SET returned_to_service_at = NOW(), returned_to_service_by = $2, updated_at = NOW() WHERE id = $1`, [req.params.iid, user_id]);
        await writeAuditEntry(client, { tenantId: tenant_id, category: 'data', action: 'asset.returned_to_service', actorId: user_id, actorEmail: email, actorRole: role, resourceType: 'company_asset', resourceId: req.params.id, payload: { inspection_id: req.params.iid }, ipAddress: (req as any).ip });
        return reply.send({ asset_id: req.params.id, status: 'active' });
      });
    },
  );
}
