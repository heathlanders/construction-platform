// routes/v1/asset-insurance.ts — Fleet insurance policies, policy-asset links, insurance claims
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

const PolicyCreateSchema = z.object({
  policy_type: z.enum(['fleet', 'inland_marine', 'liability', 'workers_comp', 'commercial_auto', 'other']),
  carrier_name: z.string().min(1),
  policy_number: z.string().min(1),
  agent_name: z.string().optional().nullable(),
  agent_phone: z.string().optional().nullable(),
  agent_email: z.string().email().optional().nullable(),
  coverage_description: z.string().optional().nullable(),
  start_date: z.string().date(),
  expiry_date: z.string().date().optional().nullable(),
  premium_cents: z.number().int().min(0).optional().nullable(),
  deductible_cents: z.number().int().min(0).optional().nullable(),
  coverage_limit_cents: z.number().int().min(0).optional().nullable(),
  notes: z.string().optional().nullable(),
});

const PolicyUpdateSchema = z.object({
  version: z.number().int().positive(),
  policy_type: z.enum(['fleet', 'inland_marine', 'liability', 'workers_comp', 'commercial_auto', 'other']).optional(),
  carrier_name: z.string().min(1).optional(),
  policy_number: z.string().min(1).optional(),
  agent_name: z.string().optional().nullable(),
  agent_phone: z.string().optional().nullable(),
  agent_email: z.string().email().optional().nullable(),
  coverage_description: z.string().optional().nullable(),
  start_date: z.string().date().optional(),
  expiry_date: z.string().date().optional().nullable(),
  premium_cents: z.number().int().min(0).optional().nullable(),
  deductible_cents: z.number().int().min(0).optional().nullable(),
  coverage_limit_cents: z.number().int().min(0).optional().nullable(),
  notes: z.string().optional().nullable(),
});

const ClaimCreateSchema = z.object({
  asset_id: z.string().uuid(),
  incident_id: z.string().uuid().optional().nullable(),
  claim_number: z.string().optional().nullable(),
  claim_date: z.string().date(),
  description: z.string().min(1),
  status: z.enum(['submitted', 'under_review', 'approved', 'denied', 'closed']).default('submitted'),
  claimed_amount_cents: z.number().int().min(0).optional().nullable(),
  approved_amount_cents: z.number().int().min(0).optional().nullable(),
  deductible_applied_cents: z.number().int().min(0).optional().nullable(),
  resolution_notes: z.string().optional().nullable(),
});

const ClaimUpdateSchema = z.object({
  version: z.number().int().positive(),
  claim_number: z.string().optional().nullable(),
  status: z.enum(['submitted', 'under_review', 'approved', 'denied', 'closed']).optional(),
  claimed_amount_cents: z.number().int().min(0).optional().nullable(),
  approved_amount_cents: z.number().int().min(0).optional().nullable(),
  deductible_applied_cents: z.number().int().min(0).optional().nullable(),
  resolution_notes: z.string().optional().nullable(),
});

export async function assetInsuranceRoutes(app: FastifyInstance): Promise<void> {

  // ── Insurance Policies ─────────────────────────────────────────────────────

  app.get('/asset-insurance-policies', { preHandler: [authenticate, requireRole('OWNER', 'PROJECT_MANAGER')] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const tenant_id = await guardTier(req, reply);
      if (!tenant_id) return;
      return withTenantContext(tenant_id, async (client) => {
        const res = await client.query(
          `SELECT aip.*, COUNT(aipa.asset_id) AS asset_count FROM asset_insurance_policies aip LEFT JOIN asset_insurance_policy_assets aipa ON aipa.policy_id = aip.id WHERE aip.deleted_at IS NULL GROUP BY aip.id ORDER BY aip.start_date DESC`
        );
        return reply.send({ items: res.rows });
      });
    },
  );

  app.post('/asset-insurance-policies', { preHandler: [authenticate, requireRole('OWNER', 'PROJECT_MANAGER')] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const tenant_id = await guardTier(req, reply);
      if (!tenant_id) return;
      const body = PolicyCreateSchema.safeParse(req.body);
      if (!body.success) return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: body.error.issues[0]?.message } });
      const { user_id, email, role } = (req as any).jwt;
      const d = body.data;
      return withTenantContext(tenant_id, async (client) => {
        const res = await client.query(
          `INSERT INTO asset_insurance_policies (tenant_id, policy_type, carrier_name, policy_number, agent_name, agent_phone, agent_email, coverage_description, start_date, expiry_date, premium_cents, deductible_cents, coverage_limit_cents, notes, created_by) VALUES (current_setting('app.current_tenant_id')::uuid,$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
          [d.policy_type, d.carrier_name, d.policy_number, d.agent_name ?? null, d.agent_phone ?? null, d.agent_email ?? null, d.coverage_description ?? null, d.start_date, d.expiry_date ?? null, d.premium_cents ?? null, d.deductible_cents ?? null, d.coverage_limit_cents ?? null, d.notes ?? null, user_id]
        );
        await writeAuditEntry(client, { tenantId: tenant_id, category: 'data', action: 'asset_insurance_policy.created', actorId: user_id, actorEmail: email, actorRole: role, resourceType: 'asset_insurance_policy', resourceId: res.rows[0].id, payload: { carrier_name: d.carrier_name, policy_number: d.policy_number }, ipAddress: (req as any).ip });
        return reply.status(201).send(res.rows[0]);
      });
    },
  );

  app.patch('/asset-insurance-policies/:pid', { preHandler: [authenticate, requireRole('OWNER', 'PROJECT_MANAGER')] },
    async (req: any, reply: FastifyReply) => {
      const tenant_id = await guardTier(req, reply);
      if (!tenant_id) return;
      const body = PolicyUpdateSchema.safeParse(req.body);
      if (!body.success) return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: body.error.issues[0]?.message } });
      const { version, ...fields } = body.data;
      return withTenantContext(tenant_id, async (client) => {
        const existing = await client.query(`SELECT id FROM asset_insurance_policies WHERE id = $1 AND deleted_at IS NULL`, [req.params.pid]);
        if (existing.rows.length === 0) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Policy not found' } });
        const sets: string[] = ['updated_at = NOW()']; const params: unknown[] = []; let i = 1;
        const cols = ['policy_type','carrier_name','policy_number','agent_name','agent_phone','agent_email','coverage_description','start_date','expiry_date','premium_cents','deductible_cents','coverage_limit_cents','notes'] as const;
        for (const col of cols) {
          if (col in fields) { sets.push(`${col} = $${i++}`); params.push((fields as any)[col] ?? null); }
        }
        params.push(req.params.pid, version);
        const res = await client.query(`UPDATE asset_insurance_policies SET ${sets.join(', ')} WHERE id = $${i++} AND version = $${i++} AND deleted_at IS NULL RETURNING *`, params);
        if (res.rows.length === 0) return reply.status(409).send({ error: { code: 'VERSION_CONFLICT', message: 'Policy was modified by another user.' } });
        return reply.send(res.rows[0]);
      });
    },
  );

  app.delete('/asset-insurance-policies/:pid', { preHandler: [authenticate, requireRole('OWNER')] },
    async (req: any, reply: FastifyReply) => {
      const tenant_id = await guardTier(req, reply);
      if (!tenant_id) return;
      return withTenantContext(tenant_id, async (client) => {
        const res = await client.query(`UPDATE asset_insurance_policies SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1 AND deleted_at IS NULL RETURNING id`, [req.params.pid]);
        if (res.rows.length === 0) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Policy not found' } });
        return reply.status(204).send();
      });
    },
  );

  // ── Policy Assets ──────────────────────────────────────────────────────────

  app.get('/asset-insurance-policies/:pid/assets', { preHandler: [authenticate, requireRole('OWNER', 'PROJECT_MANAGER')] },
    async (req: any, reply: FastifyReply) => {
      const tenant_id = await guardTier(req, reply);
      if (!tenant_id) return;
      return withTenantContext(tenant_id, async (client) => {
        const res = await client.query(
          `SELECT aipa.*, ca.asset_number, ca.name, ca.category FROM asset_insurance_policy_assets aipa JOIN company_assets ca ON ca.id = aipa.asset_id WHERE aipa.policy_id = $1 AND ca.deleted_at IS NULL ORDER BY ca.name ASC`,
          [req.params.pid]
        );
        return reply.send({ items: res.rows });
      });
    },
  );

  app.post('/asset-insurance-policies/:pid/assets', { preHandler: [authenticate, requireRole('OWNER', 'PROJECT_MANAGER')] },
    async (req: any, reply: FastifyReply) => {
      const tenant_id = await guardTier(req, reply);
      if (!tenant_id) return;
      const body = z.object({ asset_id: z.string().uuid() }).safeParse(req.body);
      if (!body.success) return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: body.error.issues[0]?.message } });
      return withTenantContext(tenant_id, async (client) => {
        const pRes = await client.query(`SELECT id FROM asset_insurance_policies WHERE id = $1 AND deleted_at IS NULL`, [req.params.pid]);
        if (pRes.rows.length === 0) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Policy not found' } });
        const aRes = await client.query(`SELECT id FROM company_assets WHERE id = $1 AND deleted_at IS NULL`, [body.data.asset_id]);
        if (aRes.rows.length === 0) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Asset not found' } });
        try {
          const res = await client.query(
            `INSERT INTO asset_insurance_policy_assets (tenant_id, policy_id, asset_id) VALUES (current_setting('app.current_tenant_id')::uuid,$1,$2) RETURNING *`,
            [req.params.pid, body.data.asset_id]
          );
          return reply.status(201).send(res.rows[0]);
        } catch (e: any) {
          if (e.code === '23505') return reply.status(409).send({ error: { code: 'ALREADY_LINKED', message: 'Asset is already on this policy.' } });
          throw e;
        }
      });
    },
  );

  app.delete('/asset-insurance-policies/:pid/assets/:aid', { preHandler: [authenticate, requireRole('OWNER', 'PROJECT_MANAGER')] },
    async (req: any, reply: FastifyReply) => {
      const tenant_id = await guardTier(req, reply);
      if (!tenant_id) return;
      return withTenantContext(tenant_id, async (client) => {
        const res = await client.query(`DELETE FROM asset_insurance_policy_assets WHERE policy_id = $1 AND asset_id = $2 RETURNING id`, [req.params.pid, req.params.aid]);
        if (res.rows.length === 0) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Asset not on this policy' } });
        return reply.status(204).send();
      });
    },
  );

  // ── Insurance Claims ───────────────────────────────────────────────────────

  app.get('/asset-insurance-policies/:pid/claims', { preHandler: [authenticate, requireRole('OWNER', 'PROJECT_MANAGER')] },
    async (req: any, reply: FastifyReply) => {
      const tenant_id = await guardTier(req, reply);
      if (!tenant_id) return;
      return withTenantContext(tenant_id, async (client) => {
        const res = await client.query(
          `SELECT aic.*, ca.asset_number, ca.name AS asset_name FROM asset_insurance_claims aic JOIN company_assets ca ON ca.id = aic.asset_id WHERE aic.policy_id = $1 AND aic.deleted_at IS NULL ORDER BY aic.claim_date DESC`,
          [req.params.pid]
        );
        return reply.send({ items: res.rows });
      });
    },
  );

  app.post('/asset-insurance-policies/:pid/claims', { preHandler: [authenticate, requireRole('OWNER', 'PROJECT_MANAGER')] },
    async (req: any, reply: FastifyReply) => {
      const tenant_id = await guardTier(req, reply);
      if (!tenant_id) return;
      const body = ClaimCreateSchema.safeParse(req.body);
      if (!body.success) return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: body.error.issues[0]?.message } });
      const { user_id, email, role } = (req as any).jwt;
      const d = body.data;
      return withTenantContext(tenant_id, async (client) => {
        const res = await client.query(
          `INSERT INTO asset_insurance_claims (tenant_id, policy_id, asset_id, damage_incident_id, claim_number, claim_date, description, status, claimed_amount_cents, approved_amount_cents, deductible_applied_cents, resolution_notes, created_by) VALUES (current_setting('app.current_tenant_id')::uuid,$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
          [req.params.pid, d.asset_id, d.incident_id ?? null, d.claim_number ?? null, d.claim_date, d.description, d.status, d.claimed_amount_cents ?? null, d.approved_amount_cents ?? null, d.deductible_applied_cents ?? null, d.resolution_notes ?? null, user_id]
        );
        await writeAuditEntry(client, { tenantId: tenant_id, category: 'data', action: 'asset_insurance_claim.created', actorId: user_id, actorEmail: email, actorRole: role, resourceType: 'asset_insurance_claim', resourceId: res.rows[0].id, payload: { policy_id: req.params.pid, asset_id: d.asset_id }, ipAddress: (req as any).ip });
        return reply.status(201).send(res.rows[0]);
      });
    },
  );

  app.patch('/asset-insurance-policies/:pid/claims/:cid', { preHandler: [authenticate, requireRole('OWNER', 'PROJECT_MANAGER')] },
    async (req: any, reply: FastifyReply) => {
      const tenant_id = await guardTier(req, reply);
      if (!tenant_id) return;
      const body = ClaimUpdateSchema.safeParse(req.body);
      if (!body.success) return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: body.error.issues[0]?.message } });
      const { version, ...fields } = body.data;
      return withTenantContext(tenant_id, async (client) => {
        const existing = await client.query(`SELECT id FROM asset_insurance_claims WHERE id = $1 AND policy_id = $2 AND deleted_at IS NULL`, [req.params.cid, req.params.pid]);
        if (existing.rows.length === 0) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Claim not found' } });
        const sets: string[] = ['updated_at = NOW()']; const params: unknown[] = []; let i = 1;
        const cols = ['claim_number','status','claimed_amount_cents','approved_amount_cents','deductible_applied_cents','resolution_notes'] as const;
        for (const col of cols) {
          if (col in fields) { sets.push(`${col} = $${i++}`); params.push((fields as any)[col] ?? null); }
        }
        params.push(req.params.cid, version);
        const res = await client.query(`UPDATE asset_insurance_claims SET ${sets.join(', ')} WHERE id = $${i++} AND version = $${i++} AND deleted_at IS NULL RETURNING *`, params);
        if (res.rows.length === 0) return reply.status(409).send({ error: { code: 'VERSION_CONFLICT', message: 'Claim was modified by another user.' } });
        return reply.send(res.rows[0]);
      });
    },
  );
}
