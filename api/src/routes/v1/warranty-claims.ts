// routes/v1/warranty-claims.ts — Warranty claim CRUD + status transitions
// Every status change appends to warranty_claim_status_history (append-only).
// Sub-liability routing fires warranty.sub_notify background job.

import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { withTenantContext } from '../../lib/tenant-context.js';
import { writeAuditEntry } from '../../lib/audit-log.js';
import { authenticate, requireRole } from '../../plugins/auth-plugin.js';
import { assertTier, TierEnforcementError } from '../../services/tier-enforcement.js';
import { sendJob as enqueueJob } from '../../lib/queue.js';

async function guardTier(request: FastifyRequest, reply: FastifyReply): Promise<string | null> {
  const { tenant_id } = (request as any).jwt;
  try { await assertTier(tenant_id, 'BUSINESS'); return tenant_id; }
  catch (e) {
    if (e instanceof TierEnforcementError) { reply.status(402).send({ error: { code: e.code, message: e.message, upgrade_to: e.upgradeToTier } }); return null; }
    throw e;
  }
}

const ClaimCreateSchema = z.object({
  coverage_item_id: z.string().uuid().optional().nullable(),
  title: z.string().min(1),
  description: z.string().min(1),
  category: z.enum(['workmanship', 'systems', 'structural', 'other']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  scheduled_repair_date: z.string().date().optional().nullable(),
  is_sub_liable: z.boolean().default(false),
  sub_vendor_ids: z.array(z.string().uuid()).optional().nullable(),
});

const ClaimUpdateSchema = z.object({
  version: z.number().int().positive(),
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  category: z.enum(['workmanship', 'systems', 'structural', 'other']).optional(),
  status: z.enum(['submitted', 'acknowledged', 'under_investigation', 'repair_scheduled', 'repair_complete', 'denied', 'closed']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  scheduled_repair_date: z.string().date().optional().nullable(),
  resolution_notes: z.string().optional().nullable(),
  is_sub_liable: z.boolean().optional(),
  status_notes: z.string().optional().nullable(),
});

const SubLiabilitySchema = z.object({
  vendor_id: z.string().uuid(),
  liability_amount_cents: z.number().int().min(0).default(0),
  resolution_notes: z.string().optional().nullable(),
});

export async function warrantyClaimRoutes(app: FastifyInstance): Promise<void> {

  // ── Platform-level claim list (across all warranties) ─────────────────────

  app.get('/warranty-claims', { preHandler: [authenticate, requireRole('OWNER', 'PROJECT_MANAGER')] },
    async (req: any, reply: FastifyReply) => {
      const tenant_id = await guardTier(req, reply);
      if (!tenant_id) return;
      const { status, priority, warranty_id } = req.query as Record<string, string>;
      return withTenantContext(tenant_id, async (client) => {
        const conditions = ['wc.deleted_at IS NULL'];
        const params: unknown[] = [];
        let i = 1;
        if (status) { conditions.push(`wc.status = $${i++}`); params.push(status); }
        if (priority) { conditions.push(`wc.priority = $${i++}`); params.push(priority); }
        if (warranty_id) { conditions.push(`wc.warranty_id = $${i++}`); params.push(warranty_id); }
        const res = await client.query(
          `SELECT wc.*, bw.title AS warranty_title, bw.property_address
           FROM warranty_claims wc
           JOIN builder_warranties bw ON bw.id = wc.warranty_id
           WHERE ${conditions.join(' AND ')}
           ORDER BY CASE wc.priority WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END, wc.created_at DESC`,
          params
        );
        return reply.send({ items: res.rows });
      });
    },
  );

  // ── Per-warranty claims ────────────────────────────────────────────────────

  app.get('/builder-warranties/:id/claims', { preHandler: [authenticate, requireRole('OWNER', 'PROJECT_MANAGER', 'FOREMAN')] },
    async (req: any, reply: FastifyReply) => {
      const tenant_id = await guardTier(req, reply);
      if (!tenant_id) return;
      return withTenantContext(tenant_id, async (client) => {
        const res = await client.query(
          `SELECT wc.*, wci.title AS coverage_item_title
           FROM warranty_claims wc
           LEFT JOIN warranty_coverage_items wci ON wci.id = wc.coverage_item_id
           WHERE wc.warranty_id = $1 AND wc.deleted_at IS NULL
           ORDER BY CASE wc.priority WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END, wc.created_at DESC`,
          [req.params.id]
        );
        return reply.send({ items: res.rows });
      });
    },
  );

  app.post('/builder-warranties/:id/claims', { preHandler: [authenticate, requireRole('OWNER', 'PROJECT_MANAGER')] },
    async (req: any, reply: FastifyReply) => {
      const tenant_id = await guardTier(req, reply);
      if (!tenant_id) return;
      const body = ClaimCreateSchema.safeParse(req.body);
      if (!body.success) return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: body.error.issues[0]?.message } });
      const { user_id, email, role } = (req as any).jwt;
      const d = body.data;

      return withTenantContext(tenant_id, async (client) => {
        const wRes = await client.query(
          `SELECT id FROM builder_warranties WHERE id = $1 AND deleted_at IS NULL`, [req.params.id]
        );
        if (wRes.rows.length === 0) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Warranty not found' } });

        const cRes = await client.query(
          `INSERT INTO warranty_claims
             (tenant_id, warranty_id, coverage_item_id, submitted_by_user_id,
              title, description, category, priority, scheduled_repair_date, is_sub_liable, created_by)
           VALUES (current_setting('app.current_tenant_id')::uuid,$1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
           RETURNING *`,
          [req.params.id, d.coverage_item_id ?? null, user_id, d.title,
           d.description, d.category, d.priority, d.scheduled_repair_date ?? null,
           d.is_sub_liable, user_id]
        );
        const claim = cRes.rows[0];

        // Initial status history entry
        await client.query(
          `INSERT INTO warranty_claim_status_history (tenant_id, claim_id, from_status, to_status, changed_by_user_id)
           VALUES (current_setting('app.current_tenant_id')::uuid,$1,NULL,'submitted',$2)`,
          [claim.id, user_id]
        );

        // Audit event
        await client.query(
          `INSERT INTO warranty_audit_events (tenant_id, warranty_id, claim_id, event_type, actor_id, actor_type, description)
           VALUES (current_setting('app.current_tenant_id')::uuid,$1,$2,'claim_created',$3,'staff',$4)`,
          [req.params.id, claim.id, user_id, `Claim created: ${d.title}`]
        );

        // Sub liability routing
        if (d.is_sub_liable && d.sub_vendor_ids?.length) {
          for (const vendorId of d.sub_vendor_ids) {
            await client.query(
              `INSERT INTO warranty_sub_liability_items (tenant_id, claim_id, vendor_id, created_by)
               VALUES (current_setting('app.current_tenant_id')::uuid,$1,$2,$3)`,
              [claim.id, vendorId, user_id]
            );
            await enqueueJob(tenant_id, 'warranty.sub_notify', { claim_id: claim.id, vendor_id: vendorId });
          }
        }

        await writeAuditEntry(client, {
          tenantId: tenant_id, category: 'data', action: 'warranty.claim_created',
          actorId: user_id, actorEmail: email, actorRole: role,
          resourceType: 'warranty_claim', resourceId: claim.id,
          payload: { warranty_id: req.params.id, category: d.category }, ipAddress: (req as any).ip,
        });

        return reply.status(201).send(claim);
      });
    },
  );

  app.get('/builder-warranties/:id/claims/:cid', { preHandler: [authenticate, requireRole('OWNER', 'PROJECT_MANAGER', 'FOREMAN')] },
    async (req: any, reply: FastifyReply) => {
      const tenant_id = await guardTier(req, reply);
      if (!tenant_id) return;
      return withTenantContext(tenant_id, async (client) => {
        const cRes = await client.query(
          `SELECT wc.*, wci.title AS coverage_item_title FROM warranty_claims wc
           LEFT JOIN warranty_coverage_items wci ON wci.id = wc.coverage_item_id
           WHERE wc.id = $1 AND wc.warranty_id = $2 AND wc.deleted_at IS NULL`,
          [req.params.cid, req.params.id]
        );
        if (cRes.rows.length === 0) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Claim not found' } });

        const [history, photos, subItems] = await Promise.all([
          client.query(`SELECT * FROM warranty_claim_status_history WHERE claim_id = $1 ORDER BY changed_at ASC`, [req.params.cid]),
          client.query(`SELECT * FROM warranty_claim_photos WHERE claim_id = $1 ORDER BY created_at ASC`, [req.params.cid]),
          client.query(
            `SELECT wsli.*, v.name AS vendor_name FROM warranty_sub_liability_items wsli
             JOIN vendors v ON v.id = wsli.vendor_id WHERE wsli.claim_id = $1`,
            [req.params.cid]
          ),
        ]);
        return reply.send({ ...cRes.rows[0], status_history: history.rows, photos: photos.rows, sub_liability_items: subItems.rows });
      });
    },
  );

  app.patch('/builder-warranties/:id/claims/:cid', { preHandler: [authenticate, requireRole('OWNER', 'PROJECT_MANAGER')] },
    async (req: any, reply: FastifyReply) => {
      const tenant_id = await guardTier(req, reply);
      if (!tenant_id) return;
      const body = ClaimUpdateSchema.safeParse(req.body);
      if (!body.success) return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: body.error.issues[0]?.message } });
      const { version, status_notes, ...fields } = body.data;
      const { user_id, email, role } = (req as any).jwt;

      return withTenantContext(tenant_id, async (client) => {
        const existing = await client.query(
          `SELECT id, status FROM warranty_claims WHERE id = $1 AND warranty_id = $2 AND deleted_at IS NULL`,
          [req.params.cid, req.params.id]
        );
        if (existing.rows.length === 0) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Claim not found' } });
        const oldStatus = existing.rows[0].status;

        // Set completed_at when moving to repair_complete
        if (fields.status === 'repair_complete' && oldStatus !== 'repair_complete') {
          (fields as any).completed_at = new Date().toISOString();
        }

        const sets: string[] = ['updated_at = NOW()']; const params: unknown[] = []; let i = 1;
        const cols = ['title','description','category','status','priority','scheduled_repair_date','resolution_notes','is_sub_liable','completed_at'] as const;
        for (const col of cols) {
          if (col in fields) { sets.push(`${col} = $${i++}`); params.push((fields as any)[col] ?? null); }
        }
        params.push(req.params.cid, version);
        const res = await client.query(
          `UPDATE warranty_claims SET ${sets.join(', ')} WHERE id = $${i++} AND version = $${i++} AND deleted_at IS NULL RETURNING *`,
          params
        );
        if (res.rows.length === 0) return reply.status(409).send({ error: { code: 'VERSION_CONFLICT', message: 'Claim was modified by another user.' } });

        // Record status transition
        if (fields.status && fields.status !== oldStatus) {
          await client.query(
            `INSERT INTO warranty_claim_status_history (tenant_id, claim_id, from_status, to_status, changed_by_user_id, notes)
             VALUES (current_setting('app.current_tenant_id')::uuid,$1,$2,$3,$4,$5)`,
            [req.params.cid, oldStatus, fields.status, user_id, status_notes ?? null]
          );
          await client.query(
            `INSERT INTO warranty_audit_events (tenant_id, warranty_id, claim_id, event_type, actor_id, actor_type, description, payload)
             VALUES (current_setting('app.current_tenant_id')::uuid,$1,$2,'status_changed',$3,'staff',$4,$5)`,
            [req.params.id, req.params.cid, user_id, `Status: ${oldStatus} → ${fields.status}`,
             JSON.stringify({ from: oldStatus, to: fields.status })]
          );
        }

        await writeAuditEntry(client, {
          tenantId: tenant_id, category: 'data', action: 'warranty.claim_updated',
          actorId: user_id, actorEmail: email, actorRole: role,
          resourceType: 'warranty_claim', resourceId: req.params.cid,
          payload: { warranty_id: req.params.id, status_change: fields.status ? { from: oldStatus, to: fields.status } : null },
          ipAddress: (req as any).ip,
        });

        return reply.send(res.rows[0]);
      });
    },
  );

  // ── Sub liability routing ──────────────────────────────────────────────────

  app.post('/builder-warranties/:id/claims/:cid/sub-liability', { preHandler: [authenticate, requireRole('OWNER', 'PROJECT_MANAGER')] },
    async (req: any, reply: FastifyReply) => {
      const tenant_id = await guardTier(req, reply);
      if (!tenant_id) return;
      const body = SubLiabilitySchema.safeParse(req.body);
      if (!body.success) return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: body.error.issues[0]?.message } });
      const { user_id } = (req as any).jwt;
      const d = body.data;

      return withTenantContext(tenant_id, async (client) => {
        const claimRes = await client.query(
          `SELECT id FROM warranty_claims WHERE id = $1 AND warranty_id = $2 AND deleted_at IS NULL`,
          [req.params.cid, req.params.id]
        );
        if (claimRes.rows.length === 0) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Claim not found' } });

        const res = await client.query(
          `INSERT INTO warranty_sub_liability_items (tenant_id, claim_id, vendor_id, liability_amount_cents, resolution_notes, created_by)
           VALUES (current_setting('app.current_tenant_id')::uuid,$1,$2,$3,$4,$5) RETURNING *`,
          [req.params.cid, d.vendor_id, d.liability_amount_cents, d.resolution_notes ?? null, user_id]
        );

        // Update claim is_sub_liable flag
        await client.query(
          `UPDATE warranty_claims SET is_sub_liable = TRUE, updated_at = NOW() WHERE id = $1`, [req.params.cid]
        );

        await enqueueJob(tenant_id, 'warranty.sub_notify', { claim_id: req.params.cid, vendor_id: d.vendor_id });

        return reply.status(201).send(res.rows[0]);
      });
    },
  );
}
