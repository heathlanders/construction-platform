// routes/v1/asset-damage.ts — Damage incidents, authorize-repair, resolve
// Locked decisions: T-56 (Business+ gate), T-12 (optimistic locking)
// OOS sync: damage with status='pending_repair' should be reflected in asset status

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

const IncidentCreateSchema = z.object({
  incident_date: z.string().date(),
  description: z.string().min(1),
  severity: z.enum(['minor', 'moderate', 'major', 'totaled']),
  reported_by_name: z.string().optional().nullable(),
  project_id: z.string().uuid().optional().nullable(),
  estimated_repair_cents: z.number().int().min(0).optional().nullable(),
  insurance_claim_id: z.string().uuid().optional().nullable(),
  notes: z.string().optional().nullable(),
});

const IncidentUpdateSchema = z.object({
  version: z.number().int().positive(),
  description: z.string().min(1).optional(),
  severity: z.enum(['minor', 'moderate', 'major', 'totaled']).optional(),
  estimated_repair_cents: z.number().int().min(0).optional().nullable(),
  insurance_claim_id: z.string().uuid().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function assetDamageRoutes(app: FastifyInstance): Promise<void> {

  // ── Damage Incidents ───────────────────────────────────────────────────────

  app.get('/assets/:id/damage-incidents', { preHandler: [authenticate, requireRole('OWNER', 'PROJECT_MANAGER', 'FOREMAN')] },
    async (req: any, reply: FastifyReply) => {
      const tenant_id = await guardTier(req, reply);
      if (!tenant_id) return;
      return withTenantContext(tenant_id, async (client) => {
        const res = await client.query(`SELECT * FROM asset_damage_incidents WHERE asset_id = $1 AND deleted_at IS NULL ORDER BY incident_date DESC`, [req.params.id]);
        return reply.send({ items: res.rows });
      });
    },
  );

  app.post('/assets/:id/damage-incidents', { preHandler: [authenticate, requireRole('OWNER', 'PROJECT_MANAGER', 'FOREMAN')] },
    async (req: any, reply: FastifyReply) => {
      const tenant_id = await guardTier(req, reply);
      if (!tenant_id) return;
      const body = IncidentCreateSchema.safeParse(req.body);
      if (!body.success) return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: body.error.issues[0]?.message } });
      const { user_id, email, role } = (req as any).jwt;
      const d = body.data;
      return withTenantContext(tenant_id, async (client) => {
        const res = await client.query(
          `INSERT INTO asset_damage_incidents (tenant_id, asset_id, incident_date, description, severity, status, reported_by_name, project_id, estimated_repair_cents, insurance_claim_id, notes, created_by) VALUES (current_setting('app.current_tenant_id')::uuid,$1,$2,$3,$4,'reported',$5,$6,$7,$8,$9,$10) RETURNING *`,
          [req.params.id, d.incident_date, d.description, d.severity, d.reported_by_name ?? null, d.project_id ?? null, d.estimated_repair_cents ?? null, d.insurance_claim_id ?? null, d.notes ?? null, user_id]
        );
        const incident = res.rows[0];
        await writeAuditEntry(client, { tenantId: tenant_id, category: 'data', action: 'asset.damage_reported', actorId: user_id, actorEmail: email, actorRole: role, resourceType: 'asset_damage_incident', resourceId: incident.id, payload: { asset_id: req.params.id, severity: d.severity, incident_date: d.incident_date }, ipAddress: (req as any).ip });
        return reply.status(201).send(incident);
      });
    },
  );

  app.patch('/assets/:id/damage-incidents/:did', { preHandler: [authenticate, requireRole('OWNER', 'PROJECT_MANAGER')] },
    async (req: any, reply: FastifyReply) => {
      const tenant_id = await guardTier(req, reply);
      if (!tenant_id) return;
      const body = IncidentUpdateSchema.safeParse(req.body);
      if (!body.success) return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: body.error.issues[0]?.message } });
      const { version, ...fields } = body.data;
      return withTenantContext(tenant_id, async (client) => {
        const existing = await client.query(`SELECT id FROM asset_damage_incidents WHERE id = $1 AND asset_id = $2 AND deleted_at IS NULL`, [req.params.did, req.params.id]);
        if (existing.rows.length === 0) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Damage incident not found' } });
        const sets: string[] = ['updated_at = NOW()']; const params: unknown[] = []; let i = 1;
        const cols = ['description','severity','estimated_repair_cents','insurance_claim_id','notes'] as const;
        for (const col of cols) {
          if (col in fields) { sets.push(`${col} = $${i++}`); params.push((fields as any)[col] ?? null); }
        }
        params.push(req.params.did, version);
        const res = await client.query(`UPDATE asset_damage_incidents SET ${sets.join(', ')} WHERE id = $${i++} AND version = $${i++} AND deleted_at IS NULL RETURNING *`, params);
        if (res.rows.length === 0) return reply.status(409).send({ error: { code: 'VERSION_CONFLICT', message: 'Incident was modified by another user.' } });
        return reply.send(res.rows[0]);
      });
    },
  );

  // ── Damage Workflow Actions ────────────────────────────────────────────────

  app.post('/assets/:id/damage-incidents/:did/authorize-repair', { preHandler: [authenticate, requireRole('OWNER', 'PROJECT_MANAGER')] },
    async (req: any, reply: FastifyReply) => {
      const tenant_id = await guardTier(req, reply);
      if (!tenant_id) return;
      const body = z.object({
        approved_repair_cents: z.number().int().min(0).optional().nullable(),
        notes: z.string().optional().nullable(),
      }).safeParse(req.body);
      if (!body.success) return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: body.error.issues[0]?.message } });
      const { user_id, email, role } = (req as any).jwt;
      return withTenantContext(tenant_id, async (client) => {
        const existing = await client.query(`SELECT id, status FROM asset_damage_incidents WHERE id = $1 AND asset_id = $2 AND deleted_at IS NULL`, [req.params.did, req.params.id]);
        if (existing.rows.length === 0) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Damage incident not found' } });
        if (!['reported', 'assessed'].includes(existing.rows[0].status)) {
          return reply.status(422).send({ error: { code: 'INVALID_STATUS', message: `Cannot authorize repair from status '${existing.rows[0].status}'.` } });
        }
        const d = body.data;
        const res = await client.query(
          `UPDATE asset_damage_incidents SET status = 'repair_authorized', approved_repair_cents = $1, repair_authorized_by = $2, repair_authorized_at = NOW(), notes = COALESCE($3, notes), updated_at = NOW() WHERE id = $4 RETURNING *`,
          [d.approved_repair_cents ?? null, user_id, d.notes ?? null, req.params.did]
        );
        // Set asset to out_of_service while repair is authorized
        await client.query(`UPDATE company_assets SET status = 'out_of_service', updated_at = NOW() WHERE id = $1 AND deleted_at IS NULL`, [req.params.id]);
        await writeAuditEntry(client, { tenantId: tenant_id, category: 'data', action: 'asset.repair_authorized', actorId: user_id, actorEmail: email, actorRole: role, resourceType: 'asset_damage_incident', resourceId: req.params.did, payload: { asset_id: req.params.id, approved_repair_cents: d.approved_repair_cents }, ipAddress: (req as any).ip });
        return reply.send(res.rows[0]);
      });
    },
  );

  app.post('/assets/:id/damage-incidents/:did/resolve', { preHandler: [authenticate, requireRole('OWNER', 'PROJECT_MANAGER')] },
    async (req: any, reply: FastifyReply) => {
      const tenant_id = await guardTier(req, reply);
      if (!tenant_id) return;
      const body = z.object({
        actual_repair_cents: z.number().int().min(0).optional().nullable(),
        service_record_id: z.string().uuid().optional().nullable(),
        notes: z.string().optional().nullable(),
      }).safeParse(req.body);
      if (!body.success) return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: body.error.issues[0]?.message } });
      const { user_id, email, role } = (req as any).jwt;
      return withTenantContext(tenant_id, async (client) => {
        const existing = await client.query(`SELECT id FROM asset_damage_incidents WHERE id = $1 AND asset_id = $2 AND deleted_at IS NULL`, [req.params.did, req.params.id]);
        if (existing.rows.length === 0) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Damage incident not found' } });
        const d = body.data;
        const res = await client.query(
          `UPDATE asset_damage_incidents SET status = 'resolved', actual_repair_cents = $1, service_record_id = COALESCE($2, service_record_id), resolved_at = NOW(), notes = COALESCE($3, notes), updated_at = NOW() WHERE id = $4 RETURNING *`,
          [d.actual_repair_cents ?? null, d.service_record_id ?? null, d.notes ?? null, req.params.did]
        );
        // Return asset to available
        await client.query(`UPDATE company_assets SET status = 'available', updated_at = NOW() WHERE id = $1 AND status = 'out_of_service' AND deleted_at IS NULL`, [req.params.id]);
        await writeAuditEntry(client, { tenantId: tenant_id, category: 'data', action: 'asset.damage_resolved', actorId: user_id, actorEmail: email, actorRole: role, resourceType: 'asset_damage_incident', resourceId: req.params.did, payload: { asset_id: req.params.id, actual_repair_cents: d.actual_repair_cents }, ipAddress: (req as any).ip });
        return reply.send(res.rows[0]);
      });
    },
  );
}
