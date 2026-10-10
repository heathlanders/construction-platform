// routes/v1/asset-compliance.ts — Registrations, recalls (safety_critical notify), calibration
// Locked decisions: T-56 (Business+ gate), T-12 (optimistic locking)

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

const RegistrationCreateSchema = z.object({
  registration_type: z.enum(['state_vehicle', 'dot_number', 'ifta', 'oversize_permit', 'other']),
  registration_number: z.string().min(1),
  issuing_authority: z.string().optional().nullable(),
  state_code: z.string().length(2).optional().nullable(),
  issue_date: z.string().date().optional().nullable(),
  expiry_date: z.string().date().optional().nullable(),
  notes: z.string().optional().nullable(),
});

const RegistrationUpdateSchema = z.object({
  version: z.number().int().positive(),
  registration_type: z.enum(['state_vehicle', 'dot_number', 'ifta', 'oversize_permit', 'other']).optional(),
  registration_number: z.string().min(1).optional(),
  issuing_authority: z.string().optional().nullable(),
  state_code: z.string().length(2).optional().nullable(),
  issue_date: z.string().date().optional().nullable(),
  expiry_date: z.string().date().optional().nullable(),
  notes: z.string().optional().nullable(),
});

const RecallCreateSchema = z.object({
  recall_number: z.string().min(1),
  issuing_authority: z.string().optional().nullable(),
  recall_date: z.string().date(),
  description: z.string().min(1),
  severity: z.enum(['safety_critical', 'high', 'medium', 'low']),
  status: z.enum(['open', 'scheduled', 'completed', 'not_applicable']).default('open'),
  remedy_description: z.string().optional().nullable(),
  completed_date: z.string().date().optional().nullable(),
  service_record_id: z.string().uuid().optional().nullable(),
  notes: z.string().optional().nullable(),
});

const RecallUpdateSchema = z.object({
  version: z.number().int().positive(),
  status: z.enum(['open', 'scheduled', 'completed', 'not_applicable']).optional(),
  remedy_description: z.string().optional().nullable(),
  completed_date: z.string().date().optional().nullable(),
  service_record_id: z.string().uuid().optional().nullable(),
  notes: z.string().optional().nullable(),
});

const CalibrationCreateSchema = z.object({
  calibration_date: z.string().date(),
  calibrated_by: z.string().optional().nullable(),
  calibration_standard: z.string().optional().nullable(),
  result: z.enum(['pass', 'fail', 'adjusted']),
  next_calibration_due: z.string().date().optional().nullable(),
  certificate_number: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

const CalibrationUpdateSchema = z.object({
  version: z.number().int().positive(),
  calibrated_by: z.string().optional().nullable(),
  calibration_standard: z.string().optional().nullable(),
  result: z.enum(['pass', 'fail', 'adjusted']).optional(),
  next_calibration_due: z.string().date().optional().nullable(),
  certificate_number: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function assetComplianceRoutes(app: FastifyInstance): Promise<void> {

  // ── Registrations ──────────────────────────────────────────────────────────

  app.get('/assets/:id/registrations', { preHandler: [authenticate, requireRole('OWNER', 'PROJECT_MANAGER', 'FOREMAN')] },
    async (req: any, reply: FastifyReply) => {
      const tenant_id = await guardTier(req, reply);
      if (!tenant_id) return;
      return withTenantContext(tenant_id, async (client) => {
        const res = await client.query(`SELECT * FROM asset_registrations WHERE asset_id = $1 AND deleted_at IS NULL ORDER BY expiry_date ASC NULLS LAST`, [req.params.id]);
        return reply.send({ items: res.rows });
      });
    },
  );

  app.post('/assets/:id/registrations', { preHandler: [authenticate, requireRole('OWNER', 'PROJECT_MANAGER')] },
    async (req: any, reply: FastifyReply) => {
      const tenant_id = await guardTier(req, reply);
      if (!tenant_id) return;
      const body = RegistrationCreateSchema.safeParse(req.body);
      if (!body.success) return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: body.error.issues[0]?.message } });
      const { user_id } = (req as any).jwt;
      const d = body.data;
      return withTenantContext(tenant_id, async (client) => {
        const res = await client.query(
          `INSERT INTO asset_registrations (tenant_id, asset_id, registration_type, registration_number, issuing_authority, state_code, issue_date, expiry_date, notes, created_by) VALUES (current_setting('app.current_tenant_id')::uuid,$1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
          [req.params.id, d.registration_type, d.registration_number, d.issuing_authority ?? null, d.state_code ?? null, d.issue_date ?? null, d.expiry_date ?? null, d.notes ?? null, user_id]
        );
        return reply.status(201).send(res.rows[0]);
      });
    },
  );

  app.patch('/assets/:id/registrations/:rid', { preHandler: [authenticate, requireRole('OWNER', 'PROJECT_MANAGER')] },
    async (req: any, reply: FastifyReply) => {
      const tenant_id = await guardTier(req, reply);
      if (!tenant_id) return;
      const body = RegistrationUpdateSchema.safeParse(req.body);
      if (!body.success) return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: body.error.issues[0]?.message } });
      const { version, ...fields } = body.data;
      return withTenantContext(tenant_id, async (client) => {
        const existing = await client.query(`SELECT id FROM asset_registrations WHERE id = $1 AND asset_id = $2 AND deleted_at IS NULL`, [req.params.rid, req.params.id]);
        if (existing.rows.length === 0) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Registration not found' } });
        const sets: string[] = ['updated_at = NOW()']; const params: unknown[] = []; let i = 1;
        const cols = ['registration_type','registration_number','issuing_authority','state_code','issue_date','expiry_date','notes'] as const;
        for (const col of cols) {
          if (col in fields) { sets.push(`${col} = $${i++}`); params.push((fields as any)[col] ?? null); }
        }
        params.push(req.params.rid, version);
        const res = await client.query(`UPDATE asset_registrations SET ${sets.join(', ')} WHERE id = $${i++} AND version = $${i++} AND deleted_at IS NULL RETURNING *`, params);
        if (res.rows.length === 0) return reply.status(409).send({ error: { code: 'VERSION_CONFLICT', message: 'Registration was modified by another user.' } });
        return reply.send(res.rows[0]);
      });
    },
  );

  app.delete('/assets/:id/registrations/:rid', { preHandler: [authenticate, requireRole('OWNER', 'PROJECT_MANAGER')] },
    async (req: any, reply: FastifyReply) => {
      const tenant_id = await guardTier(req, reply);
      if (!tenant_id) return;
      return withTenantContext(tenant_id, async (client) => {
        const res = await client.query(`UPDATE asset_registrations SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1 AND asset_id = $2 AND deleted_at IS NULL RETURNING id`, [req.params.rid, req.params.id]);
        if (res.rows.length === 0) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Registration not found' } });
        return reply.status(204).send();
      });
    },
  );

  // ── Recalls ────────────────────────────────────────────────────────────────

  app.get('/assets/:id/recalls', { preHandler: [authenticate, requireRole('OWNER', 'PROJECT_MANAGER', 'FOREMAN')] },
    async (req: any, reply: FastifyReply) => {
      const tenant_id = await guardTier(req, reply);
      if (!tenant_id) return;
      return withTenantContext(tenant_id, async (client) => {
        const res = await client.query(`SELECT * FROM asset_recalls WHERE asset_id = $1 AND deleted_at IS NULL ORDER BY recall_date DESC`, [req.params.id]);
        return reply.send({ items: res.rows });
      });
    },
  );

  app.post('/assets/:id/recalls', { preHandler: [authenticate, requireRole('OWNER', 'PROJECT_MANAGER')] },
    async (req: any, reply: FastifyReply) => {
      const tenant_id = await guardTier(req, reply);
      if (!tenant_id) return;
      const body = RecallCreateSchema.safeParse(req.body);
      if (!body.success) return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: body.error.issues[0]?.message } });
      const { user_id, email, role } = (req as any).jwt;
      const d = body.data;
      return withTenantContext(tenant_id, async (client) => {
        const res = await client.query(
          `INSERT INTO asset_recalls (tenant_id, asset_id, recall_number, issuing_authority, recall_date, description, severity, status, remedy_description, completed_date, service_record_id, notes, created_by) VALUES (current_setting('app.current_tenant_id')::uuid,$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
          [req.params.id, d.recall_number, d.issuing_authority ?? null, d.recall_date, d.description, d.severity, d.status, d.remedy_description ?? null, d.completed_date ?? null, d.service_record_id ?? null, d.notes ?? null, user_id]
        );
        const recall = res.rows[0];
        // Safety-critical recalls: write audit entry with elevated action for notification trigger
        if (d.severity === 'safety_critical') {
          await writeAuditEntry(client, { tenantId: tenant_id, category: 'data', action: 'asset.safety_critical_recall_added', actorId: user_id, actorEmail: email, actorRole: role, resourceType: 'asset_recall', resourceId: recall.id, payload: { asset_id: req.params.id, recall_number: d.recall_number, severity: d.severity }, ipAddress: (req as any).ip });
        }
        return reply.status(201).send(recall);
      });
    },
  );

  app.patch('/assets/:id/recalls/:rcid', { preHandler: [authenticate, requireRole('OWNER', 'PROJECT_MANAGER')] },
    async (req: any, reply: FastifyReply) => {
      const tenant_id = await guardTier(req, reply);
      if (!tenant_id) return;
      const body = RecallUpdateSchema.safeParse(req.body);
      if (!body.success) return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: body.error.issues[0]?.message } });
      const { version, ...fields } = body.data;
      return withTenantContext(tenant_id, async (client) => {
        const existing = await client.query(`SELECT id FROM asset_recalls WHERE id = $1 AND asset_id = $2 AND deleted_at IS NULL`, [req.params.rcid, req.params.id]);
        if (existing.rows.length === 0) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Recall not found' } });
        const sets: string[] = ['updated_at = NOW()']; const params: unknown[] = []; let i = 1;
        const cols = ['status','remedy_description','completed_date','service_record_id','notes'] as const;
        for (const col of cols) {
          if (col in fields) { sets.push(`${col} = $${i++}`); params.push((fields as any)[col] ?? null); }
        }
        params.push(req.params.rcid, version);
        const res = await client.query(`UPDATE asset_recalls SET ${sets.join(', ')} WHERE id = $${i++} AND version = $${i++} AND deleted_at IS NULL RETURNING *`, params);
        if (res.rows.length === 0) return reply.status(409).send({ error: { code: 'VERSION_CONFLICT', message: 'Recall was modified by another user.' } });
        return reply.send(res.rows[0]);
      });
    },
  );

  // ── Calibration Records ────────────────────────────────────────────────────

  app.get('/assets/:id/calibration-records', { preHandler: [authenticate, requireRole('OWNER', 'PROJECT_MANAGER', 'FOREMAN')] },
    async (req: any, reply: FastifyReply) => {
      const tenant_id = await guardTier(req, reply);
      if (!tenant_id) return;
      return withTenantContext(tenant_id, async (client) => {
        const res = await client.query(`SELECT * FROM asset_calibration_records WHERE asset_id = $1 AND deleted_at IS NULL ORDER BY calibration_date DESC`, [req.params.id]);
        return reply.send({ items: res.rows });
      });
    },
  );

  app.post('/assets/:id/calibration-records', { preHandler: [authenticate, requireRole('OWNER', 'PROJECT_MANAGER', 'FOREMAN')] },
    async (req: any, reply: FastifyReply) => {
      const tenant_id = await guardTier(req, reply);
      if (!tenant_id) return;
      const body = CalibrationCreateSchema.safeParse(req.body);
      if (!body.success) return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: body.error.issues[0]?.message } });
      const { user_id } = (req as any).jwt;
      const d = body.data;
      return withTenantContext(tenant_id, async (client) => {
        const res = await client.query(
          `INSERT INTO asset_calibration_records (tenant_id, asset_id, calibration_date, calibrated_by, calibration_standard, result, next_calibration_due, certificate_number, notes, created_by) VALUES (current_setting('app.current_tenant_id')::uuid,$1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
          [req.params.id, d.calibration_date, d.calibrated_by ?? null, d.calibration_standard ?? null, d.result, d.next_calibration_due ?? null, d.certificate_number ?? null, d.notes ?? null, user_id]
        );
        return reply.status(201).send(res.rows[0]);
      });
    },
  );

  app.patch('/assets/:id/calibration-records/:cid', { preHandler: [authenticate, requireRole('OWNER', 'PROJECT_MANAGER')] },
    async (req: any, reply: FastifyReply) => {
      const tenant_id = await guardTier(req, reply);
      if (!tenant_id) return;
      const body = CalibrationUpdateSchema.safeParse(req.body);
      if (!body.success) return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: body.error.issues[0]?.message } });
      const { version, ...fields } = body.data;
      return withTenantContext(tenant_id, async (client) => {
        const existing = await client.query(`SELECT id FROM asset_calibration_records WHERE id = $1 AND asset_id = $2 AND deleted_at IS NULL`, [req.params.cid, req.params.id]);
        if (existing.rows.length === 0) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Calibration record not found' } });
        const sets: string[] = ['updated_at = NOW()']; const params: unknown[] = []; let i = 1;
        const cols = ['calibrated_by','calibration_standard','result','next_calibration_due','certificate_number','notes'] as const;
        for (const col of cols) {
          if (col in fields) { sets.push(`${col} = $${i++}`); params.push((fields as any)[col] ?? null); }
        }
        params.push(req.params.cid, version);
        const res = await client.query(`UPDATE asset_calibration_records SET ${sets.join(', ')} WHERE id = $${i++} AND version = $${i++} AND deleted_at IS NULL RETURNING *`, params);
        if (res.rows.length === 0) return reply.status(409).send({ error: { code: 'VERSION_CONFLICT', message: 'Calibration record was modified by another user.' } });
        return reply.send(res.rows[0]);
      });
    },
  );
}
