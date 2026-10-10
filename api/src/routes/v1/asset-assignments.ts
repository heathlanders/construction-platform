// routes/v1/asset-assignments.ts — Project assignments, operator assignments, checkouts, reservations
// Locked decisions: T-56 (Business+ gate), T-57 (operator cert check), T-58 (chain of custody audit)

import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { withTenantContext } from '../../lib/tenant-context.js';
import { writeAuditEntry } from '../../lib/audit-log.js';
import { authenticate, requireRole } from '../../plugins/auth-plugin.js';
import { assertTier, TierEnforcementError } from '../../services/tier-enforcement.js';
import type { PoolClient } from 'pg';

async function guardTier(request: FastifyRequest, reply: FastifyReply): Promise<string | null> {
  const { tenant_id } = (request as any).jwt;
  try { await assertTier(tenant_id, 'BUSINESS'); return tenant_id; }
  catch (e) {
    if (e instanceof TierEnforcementError) { reply.status(402).send({ error: { code: e.code, message: e.message, upgrade_to: e.upgradeToTier } }); return null; }
    throw e;
  }
}

// T-57: operator cert check — runs inside withTenantContext, returns true if allowed
async function checkCert(client: PoolClient, assetId: string, userId: string, reply: FastifyReply): Promise<boolean> {
  const assetRes = await client.query(`SELECT requires_operator_cert, required_cert_type FROM company_assets WHERE id = $1 AND deleted_at IS NULL`, [assetId]);
  if (assetRes.rows.length === 0) { reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Asset not found' } }); return false; }
  const asset = assetRes.rows[0];
  if (!asset.requires_operator_cert) return true;
  const certRes = await client.query(
    `SELECT id FROM safety_certifications WHERE tenant_id = current_setting('app.current_tenant_id')::uuid AND user_id = $1 AND cert_type = $2 AND deleted_at IS NULL AND (expires_at IS NULL OR expires_at > NOW())`,
    [userId, asset.required_cert_type],
  );
  if (certRes.rows.length === 0) {
    reply.status(403).send({ error: { code: 'OPERATOR_CERT_REQUIRED', message: `This equipment requires a valid ${asset.required_cert_type} certification.` } });
    return false;
  }
  return true;
}

export async function assetAssignmentRoutes(app: FastifyInstance): Promise<void> {

  // ── Project assignments ────────────────────────────────────────────────────

  app.get('/assets/:id/assignments', { preHandler: [authenticate, requireRole('OWNER', 'PROJECT_MANAGER', 'FOREMAN')] },
    async (req: any, reply: FastifyReply) => {
      const tenant_id = await guardTier(req, reply);
      if (!tenant_id) return;
      return withTenantContext(tenant_id, async (client) => {
        const res = await client.query(`SELECT apa.*, p.name AS project_name FROM asset_project_assignments apa LEFT JOIN projects p ON p.id = apa.project_id WHERE apa.asset_id = $1 ORDER BY apa.assigned_at DESC`, [req.params.id]);
        return reply.send({ items: res.rows });
      });
    },
  );

  app.post('/assets/:id/assignments', { preHandler: [authenticate, requireRole('OWNER', 'PROJECT_MANAGER')] },
    async (req: any, reply: FastifyReply) => {
      const tenant_id = await guardTier(req, reply);
      if (!tenant_id) return;
      const body = z.object({ project_id: z.string().uuid(), expected_return_date: z.string().date().optional().nullable(), notes: z.string().optional().nullable() }).safeParse(req.body);
      if (!body.success) return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: body.error.issues[0]?.message } });
      const { user_id, email, role } = (req as any).jwt;
      return withTenantContext(tenant_id, async (client) => {
        const res = await client.query(`INSERT INTO asset_project_assignments (tenant_id, asset_id, project_id, assigned_by, expected_return_date, notes) VALUES (current_setting('app.current_tenant_id')::uuid,$1,$2,$3,$4,$5) RETURNING *`, [req.params.id, body.data.project_id, user_id, body.data.expected_return_date ?? null, body.data.notes ?? null]);
        // T-58: chain of custody audit
        await writeAuditEntry(client, { tenantId: tenant_id, category: 'data', action: 'asset.project_assigned', actorId: user_id, actorEmail: email, actorRole: role, resourceType: 'asset_project_assignment', resourceId: res.rows[0].id, payload: { asset_id: req.params.id, project_id: body.data.project_id }, ipAddress: (req as any).ip });
        return reply.status(201).send(res.rows[0]);
      });
    },
  );

  app.patch('/assets/:id/assignments/:aid', { preHandler: [authenticate, requireRole('OWNER', 'PROJECT_MANAGER')] },
    async (req: any, reply: FastifyReply) => {
      const tenant_id = await guardTier(req, reply);
      if (!tenant_id) return;
      const body = z.object({ returned_at: z.boolean().optional(), return_condition: z.enum(['good','fair','damaged','needs_repair']).optional().nullable(), notes: z.string().optional().nullable() }).safeParse(req.body);
      if (!body.success) return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: body.error.issues[0]?.message } });
      const { user_id, email, role } = (req as any).jwt;
      return withTenantContext(tenant_id, async (client) => {
        const existing = await client.query(`SELECT * FROM asset_project_assignments WHERE id = $1`, [req.params.aid]);
        if (existing.rows.length === 0) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Assignment not found' } });
        const sets: string[] = ['updated_at = NOW()']; const params: unknown[] = []; let i = 1;
        if (body.data.returned_at) { sets.push(`returned_at = NOW()`); }
        if (body.data.return_condition !== undefined) { sets.push(`return_condition = $${i++}`); params.push(body.data.return_condition ?? null); }
        if (body.data.notes !== undefined) { sets.push(`notes = $${i++}`); params.push(body.data.notes ?? null); }
        params.push(req.params.aid);
        const res = await client.query(`UPDATE asset_project_assignments SET ${sets.join(', ')} WHERE id = $${i++} RETURNING *`, params);
        await writeAuditEntry(client, { tenantId: tenant_id, category: 'data', action: 'asset.project_returned', actorId: user_id, actorEmail: email, actorRole: role, resourceType: 'asset_project_assignment', resourceId: req.params.aid, payload: { asset_id: req.params.id }, ipAddress: (req as any).ip });
        return reply.send(res.rows[0]);
      });
    },
  );

  // ── Operator assignments ───────────────────────────────────────────────────

  app.get('/assets/:id/operator-assignments', { preHandler: [authenticate, requireRole('OWNER', 'PROJECT_MANAGER', 'FOREMAN')] },
    async (req: any, reply: FastifyReply) => {
      const tenant_id = await guardTier(req, reply);
      if (!tenant_id) return;
      return withTenantContext(tenant_id, async (client) => {
        const res = await client.query(`SELECT aoa.*, u.first_name, u.last_name, u.email AS user_email FROM asset_operator_assignments aoa JOIN users u ON u.id = aoa.user_id WHERE aoa.asset_id = $1 ORDER BY aoa.assigned_at DESC`, [req.params.id]);
        return reply.send({ items: res.rows });
      });
    },
  );

  app.post('/assets/:id/operator-assignments', { preHandler: [authenticate, requireRole('OWNER', 'PROJECT_MANAGER')] },
    async (req: any, reply: FastifyReply) => {
      const tenant_id = await guardTier(req, reply);
      if (!tenant_id) return;
      const body = z.object({ user_id: z.string().uuid(), notes: z.string().optional().nullable() }).safeParse(req.body);
      if (!body.success) return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: body.error.issues[0]?.message } });
      const { user_id: actorId, email, role } = (req as any).jwt;
      return withTenantContext(tenant_id, async (client) => {
        // T-57: cert check before inserting
        const allowed = await checkCert(client, req.params.id, body.data.user_id, reply);
        if (!allowed) return;
        const res = await client.query(`INSERT INTO asset_operator_assignments (tenant_id, asset_id, user_id, notes) VALUES (current_setting('app.current_tenant_id')::uuid,$1,$2,$3) RETURNING *`, [req.params.id, body.data.user_id, body.data.notes ?? null]);
        // T-58: chain of custody
        await writeAuditEntry(client, { tenantId: tenant_id, category: 'data', action: 'asset.operator_assigned', actorId: actorId, actorEmail: email, actorRole: role, resourceType: 'asset_operator_assignment', resourceId: res.rows[0].id, payload: { asset_id: req.params.id, user_id: body.data.user_id }, ipAddress: (req as any).ip });
        return reply.status(201).send(res.rows[0]);
      });
    },
  );

  app.patch('/assets/:id/operator-assignments/:oid', { preHandler: [authenticate, requireRole('OWNER', 'PROJECT_MANAGER')] },
    async (req: any, reply: FastifyReply) => {
      const tenant_id = await guardTier(req, reply);
      if (!tenant_id) return;
      const body = z.object({ released: z.boolean().optional(), notes: z.string().optional().nullable() }).safeParse(req.body);
      if (!body.success) return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: body.error.issues[0]?.message } });
      const { user_id, email, role } = (req as any).jwt;
      return withTenantContext(tenant_id, async (client) => {
        const existing = await client.query(`SELECT * FROM asset_operator_assignments WHERE id = $1`, [req.params.oid]);
        if (existing.rows.length === 0) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Operator assignment not found' } });
        const sets: string[] = ['updated_at = NOW()']; const params: unknown[] = []; let i = 1;
        if (body.data.released) { sets.push(`released_at = NOW()`); }
        if (body.data.notes !== undefined) { sets.push(`notes = $${i++}`); params.push(body.data.notes ?? null); }
        params.push(req.params.oid);
        const res = await client.query(`UPDATE asset_operator_assignments SET ${sets.join(', ')} WHERE id = $${i++} RETURNING *`, params);
        await writeAuditEntry(client, { tenantId: tenant_id, category: 'data', action: 'asset.operator_released', actorId: user_id, actorEmail: email, actorRole: role, resourceType: 'asset_operator_assignment', resourceId: req.params.oid, payload: { asset_id: req.params.id }, ipAddress: (req as any).ip });
        return reply.send(res.rows[0]);
      });
    },
  );

  // ── Checkouts ──────────────────────────────────────────────────────────────

  app.post('/assets/:id/checkout', { preHandler: [authenticate, requireRole('OWNER', 'PROJECT_MANAGER', 'FOREMAN', 'FIELD_TECH')] },
    async (req: any, reply: FastifyReply) => {
      const tenant_id = await guardTier(req, reply);
      if (!tenant_id) return;
      const body = z.object({ condition_out: z.enum(['good','fair','damaged','needs_repair']), expected_return_at: z.string().datetime().optional().nullable(), project_id: z.string().uuid().optional().nullable(), notes_out: z.string().optional().nullable(), qr_scan_out: z.boolean().default(false) }).safeParse(req.body);
      if (!body.success) return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: body.error.issues[0]?.message } });
      const { user_id, email, role } = (req as any).jwt;
      return withTenantContext(tenant_id, async (client) => {
        // T-57: cert check for the requesting user
        const allowed = await checkCert(client, req.params.id, user_id, reply);
        if (!allowed) return;
        const res = await client.query(`INSERT INTO asset_checkouts (tenant_id, asset_id, checked_out_by, expected_return_at, project_id, condition_out, notes_out, qr_scan_out) VALUES (current_setting('app.current_tenant_id')::uuid,$1,$2,$3,$4,$5,$6,$7) RETURNING *`, [req.params.id, user_id, body.data.expected_return_at ?? null, body.data.project_id ?? null, body.data.condition_out, body.data.notes_out ?? null, body.data.qr_scan_out]);
        // T-58: chain of custody
        await writeAuditEntry(client, { tenantId: tenant_id, category: 'data', action: 'asset.checked_out', actorId: user_id, actorEmail: email, actorRole: role, resourceType: 'asset_checkout', resourceId: res.rows[0].id, payload: { asset_id: req.params.id, project_id: body.data.project_id }, ipAddress: (req as any).ip });
        return reply.status(201).send(res.rows[0]);
      });
    },
  );

  app.post('/assets/:id/checkin', { preHandler: [authenticate, requireRole('OWNER', 'PROJECT_MANAGER', 'FOREMAN', 'FIELD_TECH')] },
    async (req: any, reply: FastifyReply) => {
      const tenant_id = await guardTier(req, reply);
      if (!tenant_id) return;
      const body = z.object({ condition_in: z.enum(['good','fair','damaged','needs_repair']), notes_in: z.string().optional().nullable(), qr_scan_in: z.boolean().default(false) }).safeParse(req.body);
      if (!body.success) return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: body.error.issues[0]?.message } });
      const { user_id, email, role } = (req as any).jwt;
      return withTenantContext(tenant_id, async (client) => {
        const open = await client.query(`SELECT id FROM asset_checkouts WHERE asset_id = $1 AND checked_in_at IS NULL ORDER BY checked_out_at DESC LIMIT 1`, [req.params.id]);
        if (open.rows.length === 0) return reply.status(404).send({ error: { code: 'NOT_CHECKED_OUT', message: 'No open checkout found for this asset.' } });
        const res = await client.query(`UPDATE asset_checkouts SET checked_in_at = NOW(), checked_in_by = $1, condition_in = $2, notes_in = $3, qr_scan_in = $4, updated_at = NOW() WHERE id = $5 RETURNING *`, [user_id, body.data.condition_in, body.data.notes_in ?? null, body.data.qr_scan_in, open.rows[0].id]);
        await writeAuditEntry(client, { tenantId: tenant_id, category: 'data', action: 'asset.checked_in', actorId: user_id, actorEmail: email, actorRole: role, resourceType: 'asset_checkout', resourceId: open.rows[0].id, payload: { asset_id: req.params.id, condition_in: body.data.condition_in }, ipAddress: (req as any).ip });
        return reply.send(res.rows[0]);
      });
    },
  );

  // ── Reservations ───────────────────────────────────────────────────────────

  app.get('/assets/:id/reservations', { preHandler: [authenticate, requireRole('OWNER', 'PROJECT_MANAGER', 'FOREMAN')] },
    async (req: any, reply: FastifyReply) => {
      const tenant_id = await guardTier(req, reply);
      if (!tenant_id) return;
      return withTenantContext(tenant_id, async (client) => {
        const res = await client.query(`SELECT ar.*, p.name AS project_name FROM asset_reservations ar LEFT JOIN projects p ON p.id = ar.project_id WHERE ar.asset_id = $1 AND ar.deleted_at IS NULL ORDER BY ar.start_date DESC`, [req.params.id]);
        return reply.send({ items: res.rows });
      });
    },
  );

  app.post('/assets/:id/reservations', { preHandler: [authenticate, requireRole('OWNER', 'PROJECT_MANAGER')] },
    async (req: any, reply: FastifyReply) => {
      const tenant_id = await guardTier(req, reply);
      if (!tenant_id) return;
      const body = z.object({ project_id: z.string().uuid().optional().nullable(), reserved_for_user_id: z.string().uuid().optional().nullable(), start_date: z.string().date(), end_date: z.string().date(), notes: z.string().optional().nullable() }).safeParse(req.body);
      if (!body.success) return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: body.error.issues[0]?.message } });
      const { user_id } = (req as any).jwt;
      return withTenantContext(tenant_id, async (client) => {
        const res = await client.query(`INSERT INTO asset_reservations (tenant_id, asset_id, project_id, reserved_by, reserved_for_user_id, start_date, end_date, notes, created_by) VALUES (current_setting('app.current_tenant_id')::uuid,$1,$2,$3,$4,$5,$6,$7,$3) RETURNING *`, [req.params.id, body.data.project_id ?? null, user_id, body.data.reserved_for_user_id ?? null, body.data.start_date, body.data.end_date, body.data.notes ?? null]);
        return reply.status(201).send(res.rows[0]);
      });
    },
  );

  app.patch('/assets/:id/reservations/:rid', { preHandler: [authenticate, requireRole('OWNER', 'PROJECT_MANAGER')] },
    async (req: any, reply: FastifyReply) => {
      const tenant_id = await guardTier(req, reply);
      if (!tenant_id) return;
      const body = z.object({ version: z.number().int().positive(), status: z.enum(['pending','confirmed','cancelled','completed']).optional(), start_date: z.string().date().optional(), end_date: z.string().date().optional(), notes: z.string().optional().nullable() }).safeParse(req.body);
      if (!body.success) return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: body.error.issues[0]?.message } });
      const { version, ...fields } = body.data;
      return withTenantContext(tenant_id, async (client) => {
        const existing = await client.query(`SELECT id FROM asset_reservations WHERE id = $1 AND deleted_at IS NULL`, [req.params.rid]);
        if (existing.rows.length === 0) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Reservation not found' } });
        const sets: string[] = ['updated_at = NOW()']; const params: unknown[] = []; let i = 1;
        if (fields.status) { sets.push(`status = $${i++}`); params.push(fields.status); }
        if (fields.start_date) { sets.push(`start_date = $${i++}`); params.push(fields.start_date); }
        if (fields.end_date) { sets.push(`end_date = $${i++}`); params.push(fields.end_date); }
        if ('notes' in fields) { sets.push(`notes = $${i++}`); params.push(fields.notes ?? null); }
        params.push(req.params.rid, version);
        const res = await client.query(`UPDATE asset_reservations SET ${sets.join(', ')} WHERE id = $${i++} AND version = $${i++} AND deleted_at IS NULL RETURNING *`, params);
        if (res.rows.length === 0) return reply.status(409).send({ error: { code: 'VERSION_CONFLICT', message: 'Reservation was modified by another user.' } });
        return reply.send(res.rows[0]);
      });
    },
  );

  app.delete('/assets/:id/reservations/:rid', { preHandler: [authenticate, requireRole('OWNER', 'PROJECT_MANAGER')] },
    async (req: any, reply: FastifyReply) => {
      const tenant_id = await guardTier(req, reply);
      if (!tenant_id) return;
      return withTenantContext(tenant_id, async (client) => {
        const res = await client.query(`UPDATE asset_reservations SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1 AND deleted_at IS NULL RETURNING id`, [req.params.rid]);
        if (res.rows.length === 0) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Reservation not found' } });
        return reply.status(204).send();
      });
    },
  );
}
