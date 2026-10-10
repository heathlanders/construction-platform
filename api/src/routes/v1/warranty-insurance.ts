// routes/v1/warranty-insurance.ts — Builder warranty insurance policies + claims
// Business+ gate. HOW, 2-10 HBW policy tracking.

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

const PolicyCreateSchema = z.object({
  policy_type: z.enum(['how', '2_10_hbw', 'builder_risk', 'other']),
  policy_name: z.string().min(1),
  carrier_name: z.string().min(1),
  policy_number: z.string().min(1),
  coverage_description: z.string().optional().nullable(),
  coverage_limit_cents: z.number().int().min(0).optional().nullable(),
  deductible_cents: z.number().int().min(0).optional().nullable(),
  annual_premium_cents: z.number().int().min(0).optional().nullable(),
  effective_date: z.string().date(),
  expiry_date: z.string().date(),
  contact_name: z.string().optional().nullable(),
  contact_email: z.string().email().optional().nullable(),
  contact_phone: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

const PolicyUpdateSchema = z.object({
  version: z.number().int().positive(),
  policy_name: z.string().min(1).optional(),
  carrier_name: z.string().min(1).optional(),
  policy_number: z.string().min(1).optional(),
  coverage_description: z.string().optional().nullable(),
  coverage_limit_cents: z.number().int().min(0).optional().nullable(),
  deductible_cents: z.number().int().min(0).optional().nullable(),
  annual_premium_cents: z.number().int().min(0).optional().nullable(),
  effective_date: z.string().date().optional(),
  expiry_date: z.string().date().optional(),
  contact_name: z.string().optional().nullable(),
  contact_email: z.string().email().optional().nullable(),
  contact_phone: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

const InsuranceClaimCreateSchema = z.object({
  warranty_id: z.string().uuid(),
  claim_id: z.string().uuid().optional().nullable(),
  incident_date: z.string().date(),
  description: z.string().min(1),
  claim_amount_cents: z.number().int().min(0).default(0),
  adjuster_name: z.string().optional().nullable(),
  adjuster_contact: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

const InsuranceClaimUpdateSchema = z.object({
  version: z.number().int().positive(),
  status: z.enum(['reported', 'under_review', 'approved', 'denied', 'paid', 'closed']).optional(),
  approved_amount_cents: z.number().int().min(0).optional().nullable(),
  adjuster_name: z.string().optional().nullable(),
  adjuster_contact: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function warrantyInsuranceRoutes(app: FastifyInstance): Promise<void> {

  // ── Insurance Policies ─────────────────────────────────────────────────────

  app.get('/warranty-insurance-policies', { preHandler: [authenticate, requireRole('OWNER', 'PROJECT_MANAGER')] },
    async (req: any, reply: FastifyReply) => {
      const tenant_id = await guardTier(req, reply);
      if (!tenant_id) return;
      return withTenantContext(tenant_id, async (client) => {
        const res = await client.query(
          `SELECT * FROM warranty_insurance_policies WHERE deleted_at IS NULL ORDER BY expiry_date ASC`
        );
        return reply.send({ items: res.rows });
      });
    },
  );

  app.post('/warranty-insurance-policies', { preHandler: [authenticate, requireRole('OWNER', 'PROJECT_MANAGER')] },
    async (req: any, reply: FastifyReply) => {
      const tenant_id = await guardTier(req, reply);
      if (!tenant_id) return;
      const body = PolicyCreateSchema.safeParse(req.body);
      if (!body.success) return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: body.error.issues[0]?.message } });
      const { user_id } = (req as any).jwt;
      const d = body.data;
      return withTenantContext(tenant_id, async (client) => {
        const res = await client.query(
          `INSERT INTO warranty_insurance_policies
             (tenant_id, policy_type, policy_name, carrier_name, policy_number, coverage_description,
              coverage_limit_cents, deductible_cents, annual_premium_cents, effective_date, expiry_date,
              contact_name, contact_email, contact_phone, notes, created_by)
           VALUES (current_setting('app.current_tenant_id')::uuid,$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
           RETURNING *`,
          [d.policy_type, d.policy_name, d.carrier_name, d.policy_number,
           d.coverage_description ?? null, d.coverage_limit_cents ?? null,
           d.deductible_cents ?? null, d.annual_premium_cents ?? null,
           d.effective_date, d.expiry_date, d.contact_name ?? null,
           d.contact_email ?? null, d.contact_phone ?? null, d.notes ?? null, user_id]
        );
        return reply.status(201).send(res.rows[0]);
      });
    },
  );

  app.get('/warranty-insurance-policies/:pid', { preHandler: [authenticate, requireRole('OWNER', 'PROJECT_MANAGER')] },
    async (req: any, reply: FastifyReply) => {
      const tenant_id = await guardTier(req, reply);
      if (!tenant_id) return;
      return withTenantContext(tenant_id, async (client) => {
        const res = await client.query(
          `SELECT * FROM warranty_insurance_policies WHERE id = $1 AND deleted_at IS NULL`, [req.params.pid]
        );
        if (res.rows.length === 0) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Policy not found' } });
        const claims = await client.query(
          `SELECT * FROM warranty_insurance_claims WHERE policy_id = $1 AND deleted_at IS NULL ORDER BY incident_date DESC`,
          [req.params.pid]
        );
        return reply.send({ ...res.rows[0], insurance_claims: claims.rows });
      });
    },
  );

  app.patch('/warranty-insurance-policies/:pid', { preHandler: [authenticate, requireRole('OWNER', 'PROJECT_MANAGER')] },
    async (req: any, reply: FastifyReply) => {
      const tenant_id = await guardTier(req, reply);
      if (!tenant_id) return;
      const body = PolicyUpdateSchema.safeParse(req.body);
      if (!body.success) return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: body.error.issues[0]?.message } });
      const { version, ...fields } = body.data;
      return withTenantContext(tenant_id, async (client) => {
        const existing = await client.query(
          `SELECT id FROM warranty_insurance_policies WHERE id = $1 AND deleted_at IS NULL`, [req.params.pid]
        );
        if (existing.rows.length === 0) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Policy not found' } });
        const sets: string[] = ['updated_at = NOW()']; const params: unknown[] = []; let i = 1;
        const cols = ['policy_name','carrier_name','policy_number','coverage_description','coverage_limit_cents','deductible_cents','annual_premium_cents','effective_date','expiry_date','contact_name','contact_email','contact_phone','notes'] as const;
        for (const col of cols) {
          if (col in fields) { sets.push(`${col} = $${i++}`); params.push((fields as any)[col] ?? null); }
        }
        params.push(req.params.pid, version);
        const res = await client.query(
          `UPDATE warranty_insurance_policies SET ${sets.join(', ')} WHERE id = $${i++} AND version = $${i++} AND deleted_at IS NULL RETURNING *`,
          params
        );
        if (res.rows.length === 0) return reply.status(409).send({ error: { code: 'VERSION_CONFLICT', message: 'Policy was modified by another user.' } });
        return reply.send(res.rows[0]);
      });
    },
  );

  app.delete('/warranty-insurance-policies/:pid', { preHandler: [authenticate, requireRole('OWNER')] },
    async (req: any, reply: FastifyReply) => {
      const tenant_id = await guardTier(req, reply);
      if (!tenant_id) return;
      return withTenantContext(tenant_id, async (client) => {
        const res = await client.query(
          `UPDATE warranty_insurance_policies SET deleted_at = NOW(), updated_at = NOW()
           WHERE id = $1 AND deleted_at IS NULL RETURNING id`, [req.params.pid]
        );
        if (res.rows.length === 0) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Policy not found' } });
        return reply.status(204).send();
      });
    },
  );

  // ── Insurance Claims ───────────────────────────────────────────────────────

  app.get('/warranty-insurance-policies/:pid/claims', { preHandler: [authenticate, requireRole('OWNER', 'PROJECT_MANAGER')] },
    async (req: any, reply: FastifyReply) => {
      const tenant_id = await guardTier(req, reply);
      if (!tenant_id) return;
      return withTenantContext(tenant_id, async (client) => {
        const res = await client.query(
          `SELECT wic.*, bw.title AS warranty_title FROM warranty_insurance_claims wic
           JOIN builder_warranties bw ON bw.id = wic.warranty_id
           WHERE wic.policy_id = $1 AND wic.deleted_at IS NULL ORDER BY wic.incident_date DESC`,
          [req.params.pid]
        );
        return reply.send({ items: res.rows });
      });
    },
  );

  app.post('/warranty-insurance-policies/:pid/claims', { preHandler: [authenticate, requireRole('OWNER', 'PROJECT_MANAGER')] },
    async (req: any, reply: FastifyReply) => {
      const tenant_id = await guardTier(req, reply);
      if (!tenant_id) return;
      const body = InsuranceClaimCreateSchema.safeParse(req.body);
      if (!body.success) return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: body.error.issues[0]?.message } });
      const { user_id } = (req as any).jwt;
      const d = body.data;
      return withTenantContext(tenant_id, async (client) => {
        const pRes = await client.query(
          `SELECT id FROM warranty_insurance_policies WHERE id = $1 AND deleted_at IS NULL`, [req.params.pid]
        );
        if (pRes.rows.length === 0) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Policy not found' } });
        const res = await client.query(
          `INSERT INTO warranty_insurance_claims
             (tenant_id, policy_id, warranty_id, claim_id, incident_date, description,
              claim_amount_cents, adjuster_name, adjuster_contact, notes, created_by)
           VALUES (current_setting('app.current_tenant_id')::uuid,$1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
           RETURNING *`,
          [req.params.pid, d.warranty_id, d.claim_id ?? null, d.incident_date,
           d.description, d.claim_amount_cents, d.adjuster_name ?? null,
           d.adjuster_contact ?? null, d.notes ?? null, user_id]
        );
        return reply.status(201).send(res.rows[0]);
      });
    },
  );

  app.patch('/warranty-insurance-policies/:pid/claims/:icid', { preHandler: [authenticate, requireRole('OWNER', 'PROJECT_MANAGER')] },
    async (req: any, reply: FastifyReply) => {
      const tenant_id = await guardTier(req, reply);
      if (!tenant_id) return;
      const body = InsuranceClaimUpdateSchema.safeParse(req.body);
      if (!body.success) return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: body.error.issues[0]?.message } });
      const { version, ...fields } = body.data;
      return withTenantContext(tenant_id, async (client) => {
        const existing = await client.query(
          `SELECT id FROM warranty_insurance_claims WHERE id = $1 AND policy_id = $2 AND deleted_at IS NULL`,
          [req.params.icid, req.params.pid]
        );
        if (existing.rows.length === 0) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Insurance claim not found' } });
        const sets: string[] = ['updated_at = NOW()']; const params: unknown[] = []; let i = 1;
        for (const col of ['status', 'approved_amount_cents', 'adjuster_name', 'adjuster_contact', 'notes'] as const) {
          if (col in fields) { sets.push(`${col} = $${i++}`); params.push((fields as any)[col] ?? null); }
        }
        params.push(req.params.icid, version);
        const res = await client.query(
          `UPDATE warranty_insurance_claims SET ${sets.join(', ')} WHERE id = $${i++} AND version = $${i++} AND deleted_at IS NULL RETURNING *`,
          params
        );
        if (res.rows.length === 0) return reply.status(409).send({ error: { code: 'VERSION_CONFLICT', message: 'Insurance claim was modified by another user.' } });
        return reply.send(res.rows[0]);
      });
    },
  );
}
