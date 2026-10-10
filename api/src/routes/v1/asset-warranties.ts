// routes/v1/asset-warranties.ts — Warranties + warranty claims
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

const WarrantyCreateSchema = z.object({
  warranty_type: z.enum(['manufacturer', 'extended', 'dealer', 'third_party']),
  provider_name: z.string().min(1),
  coverage_description: z.string().optional().nullable(),
  start_date: z.string().date(),
  expiry_date: z.string().date().optional().nullable(),
  contact_name: z.string().optional().nullable(),
  contact_phone: z.string().optional().nullable(),
  contact_email: z.string().email().optional().nullable(),
  policy_number: z.string().optional().nullable(),
  coverage_amount_cents: z.number().int().min(0).optional().nullable(),
  notes: z.string().optional().nullable(),
});

const WarrantyUpdateSchema = z.object({
  version: z.number().int().positive(),
  warranty_type: z.enum(['manufacturer', 'extended', 'dealer', 'third_party']).optional(),
  provider_name: z.string().min(1).optional(),
  coverage_description: z.string().optional().nullable(),
  start_date: z.string().date().optional(),
  expiry_date: z.string().date().optional().nullable(),
  contact_name: z.string().optional().nullable(),
  contact_phone: z.string().optional().nullable(),
  contact_email: z.string().email().optional().nullable(),
  policy_number: z.string().optional().nullable(),
  coverage_amount_cents: z.number().int().min(0).optional().nullable(),
  notes: z.string().optional().nullable(),
});

const ClaimCreateSchema = z.object({
  claim_date: z.string().date(),
  description: z.string().min(1),
  status: z.enum(['submitted', 'under_review', 'approved', 'denied', 'closed']).default('submitted'),
  claimed_amount_cents: z.number().int().min(0).optional().nullable(),
  approved_amount_cents: z.number().int().min(0).optional().nullable(),
  resolution_notes: z.string().optional().nullable(),
});

const ClaimUpdateSchema = z.object({
  version: z.number().int().positive(),
  status: z.enum(['submitted', 'under_review', 'approved', 'denied', 'closed']).optional(),
  claimed_amount_cents: z.number().int().min(0).optional().nullable(),
  approved_amount_cents: z.number().int().min(0).optional().nullable(),
  resolution_notes: z.string().optional().nullable(),
});

export async function assetWarrantyRoutes(app: FastifyInstance): Promise<void> {

  // ── Warranties ─────────────────────────────────────────────────────────────

  app.get('/assets/:id/warranties', { preHandler: [authenticate, requireRole('OWNER', 'PROJECT_MANAGER', 'FOREMAN')] },
    async (req: any, reply: FastifyReply) => {
      const tenant_id = await guardTier(req, reply);
      if (!tenant_id) return;
      return withTenantContext(tenant_id, async (client) => {
        const res = await client.query(`SELECT * FROM asset_warranties WHERE asset_id = $1 AND deleted_at IS NULL ORDER BY start_date DESC`, [req.params.id]);
        return reply.send({ items: res.rows });
      });
    },
  );

  app.post('/assets/:id/warranties', { preHandler: [authenticate, requireRole('OWNER', 'PROJECT_MANAGER')] },
    async (req: any, reply: FastifyReply) => {
      const tenant_id = await guardTier(req, reply);
      if (!tenant_id) return;
      const body = WarrantyCreateSchema.safeParse(req.body);
      if (!body.success) return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: body.error.issues[0]?.message } });
      const { user_id, email, role } = (req as any).jwt;
      const d = body.data;
      return withTenantContext(tenant_id, async (client) => {
        const res = await client.query(
          `INSERT INTO asset_warranties (tenant_id, asset_id, warranty_type, provider_name, coverage_description, start_date, expiry_date, contact_name, contact_phone, contact_email, policy_number, coverage_amount_cents, notes, created_by) VALUES (current_setting('app.current_tenant_id')::uuid,$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
          [req.params.id, d.warranty_type, d.provider_name, d.coverage_description ?? null, d.start_date, d.expiry_date ?? null, d.contact_name ?? null, d.contact_phone ?? null, d.contact_email ?? null, d.policy_number ?? null, d.coverage_amount_cents ?? null, d.notes ?? null, user_id]
        );
        await writeAuditEntry(client, { tenantId: tenant_id, category: 'data', action: 'asset.warranty_created', actorId: user_id, actorEmail: email, actorRole: role, resourceType: 'asset_warranty', resourceId: res.rows[0].id, payload: { asset_id: req.params.id, provider_name: d.provider_name }, ipAddress: (req as any).ip });
        return reply.status(201).send(res.rows[0]);
      });
    },
  );

  app.patch('/assets/:id/warranties/:wid', { preHandler: [authenticate, requireRole('OWNER', 'PROJECT_MANAGER')] },
    async (req: any, reply: FastifyReply) => {
      const tenant_id = await guardTier(req, reply);
      if (!tenant_id) return;
      const body = WarrantyUpdateSchema.safeParse(req.body);
      if (!body.success) return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: body.error.issues[0]?.message } });
      const { version, ...fields } = body.data;
      return withTenantContext(tenant_id, async (client) => {
        const existing = await client.query(`SELECT id FROM asset_warranties WHERE id = $1 AND asset_id = $2 AND deleted_at IS NULL`, [req.params.wid, req.params.id]);
        if (existing.rows.length === 0) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Warranty not found' } });
        const sets: string[] = ['updated_at = NOW()']; const params: unknown[] = []; let i = 1;
        const cols = ['warranty_type','provider_name','coverage_description','start_date','expiry_date','contact_name','contact_phone','contact_email','policy_number','coverage_amount_cents','notes'] as const;
        for (const col of cols) {
          if (col in fields) { sets.push(`${col} = $${i++}`); params.push((fields as any)[col] ?? null); }
        }
        params.push(req.params.wid, version);
        const res = await client.query(`UPDATE asset_warranties SET ${sets.join(', ')} WHERE id = $${i++} AND version = $${i++} AND deleted_at IS NULL RETURNING *`, params);
        if (res.rows.length === 0) return reply.status(409).send({ error: { code: 'VERSION_CONFLICT', message: 'Warranty was modified by another user.' } });
        return reply.send(res.rows[0]);
      });
    },
  );

  app.delete('/assets/:id/warranties/:wid', { preHandler: [authenticate, requireRole('OWNER', 'PROJECT_MANAGER')] },
    async (req: any, reply: FastifyReply) => {
      const tenant_id = await guardTier(req, reply);
      if (!tenant_id) return;
      return withTenantContext(tenant_id, async (client) => {
        const res = await client.query(`UPDATE asset_warranties SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1 AND asset_id = $2 AND deleted_at IS NULL RETURNING id`, [req.params.wid, req.params.id]);
        if (res.rows.length === 0) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Warranty not found' } });
        return reply.status(204).send();
      });
    },
  );

  // ── Warranty Claims ────────────────────────────────────────────────────────

  app.get('/assets/:id/warranties/:wid/claims', { preHandler: [authenticate, requireRole('OWNER', 'PROJECT_MANAGER', 'FOREMAN')] },
    async (req: any, reply: FastifyReply) => {
      const tenant_id = await guardTier(req, reply);
      if (!tenant_id) return;
      return withTenantContext(tenant_id, async (client) => {
        const res = await client.query(`SELECT * FROM asset_warranty_claims WHERE warranty_id = $1 AND asset_id = $2 AND deleted_at IS NULL ORDER BY claim_date DESC`, [req.params.wid, req.params.id]);
        return reply.send({ items: res.rows });
      });
    },
  );

  app.post('/assets/:id/warranties/:wid/claims', { preHandler: [authenticate, requireRole('OWNER', 'PROJECT_MANAGER')] },
    async (req: any, reply: FastifyReply) => {
      const tenant_id = await guardTier(req, reply);
      if (!tenant_id) return;
      const body = ClaimCreateSchema.safeParse(req.body);
      if (!body.success) return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: body.error.issues[0]?.message } });
      const { user_id, email, role } = (req as any).jwt;
      const d = body.data;
      return withTenantContext(tenant_id, async (client) => {
        const wRes = await client.query(`SELECT id FROM asset_warranties WHERE id = $1 AND asset_id = $2 AND deleted_at IS NULL`, [req.params.wid, req.params.id]);
        if (wRes.rows.length === 0) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Warranty not found' } });
        const res = await client.query(
          `INSERT INTO asset_warranty_claims (tenant_id, warranty_id, asset_id, claim_date, description, status, claimed_amount_cents, approved_amount_cents, resolution_notes, created_by) VALUES (current_setting('app.current_tenant_id')::uuid,$1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
          [req.params.wid, req.params.id, d.claim_date, d.description, d.status, d.claimed_amount_cents ?? null, d.approved_amount_cents ?? null, d.resolution_notes ?? null, user_id]
        );
        await writeAuditEntry(client, { tenantId: tenant_id, category: 'data', action: 'asset.warranty_claim_created', actorId: user_id, actorEmail: email, actorRole: role, resourceType: 'asset_warranty_claim', resourceId: res.rows[0].id, payload: { asset_id: req.params.id, warranty_id: req.params.wid }, ipAddress: (req as any).ip });
        return reply.status(201).send(res.rows[0]);
      });
    },
  );

  app.patch('/assets/:id/warranties/:wid/claims/:cid', { preHandler: [authenticate, requireRole('OWNER', 'PROJECT_MANAGER')] },
    async (req: any, reply: FastifyReply) => {
      const tenant_id = await guardTier(req, reply);
      if (!tenant_id) return;
      const body = ClaimUpdateSchema.safeParse(req.body);
      if (!body.success) return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: body.error.issues[0]?.message } });
      const { version, ...fields } = body.data;
      return withTenantContext(tenant_id, async (client) => {
        const existing = await client.query(`SELECT id FROM asset_warranty_claims WHERE id = $1 AND warranty_id = $2 AND deleted_at IS NULL`, [req.params.cid, req.params.wid]);
        if (existing.rows.length === 0) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Claim not found' } });
        const sets: string[] = ['updated_at = NOW()']; const params: unknown[] = []; let i = 1;
        const cols = ['status','claimed_amount_cents','approved_amount_cents','resolution_notes'] as const;
        for (const col of cols) {
          if (col in fields) { sets.push(`${col} = $${i++}`); params.push((fields as any)[col] ?? null); }
        }
        params.push(req.params.cid, version);
        const res = await client.query(`UPDATE asset_warranty_claims SET ${sets.join(', ')} WHERE id = $${i++} AND version = $${i++} AND deleted_at IS NULL RETURNING *`, params);
        if (res.rows.length === 0) return reply.status(409).send({ error: { code: 'VERSION_CONFLICT', message: 'Claim was modified by another user.' } });
        return reply.send(res.rows[0]);
      });
    },
  );
}
