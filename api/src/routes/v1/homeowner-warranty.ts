// routes/v1/homeowner-warranty.ts — Homeowner portal warranty + claim access
// Access scoped to warranty_homeowner_bindings — homeowner only sees their own warranty.
// Role: HOMEOWNER_PORTAL. No Business+ gate — homeowners don't have tier.

import { FastifyInstance, FastifyReply } from 'fastify';
import { z } from 'zod';
import { withTenantContext } from '../../lib/tenant-context.js';
import { requireAuth } from '../../middleware/auth.js';

function requireHomeowner() {
  return async (req: any, reply: FastifyReply): Promise<void> => {
    await requireAuth(req, reply);
    if ((reply as any).sent) return;
    if (req.jwt?.role?.toUpperCase() !== 'HOMEOWNER_PORTAL') {
      return reply.status(403).send({ error: { code: 'FORBIDDEN', message: 'Homeowner portal access required' } });
    }
  };
}

const ClaimSubmitSchema = z.object({
  coverage_item_id: z.string().uuid().optional().nullable(),
  title: z.string().min(1),
  description: z.string().min(1),
  category: z.enum(['workmanship', 'systems', 'structural', 'other']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
});

export async function homeownerWarrantyRoutes(app: FastifyInstance): Promise<void> {
  const authenticate = requireHomeowner();

  // ── Homeowner's warranties ─────────────────────────────────────────────────

  app.get('/homeowner/warranties', { preHandler: [authenticate] },
    async (req: any, reply: FastifyReply) => {
      const { tenant_id, user_id } = req.jwt;
      return withTenantContext(tenant_id, async (client) => {
        const res = await client.query(
          `SELECT bw.*, wci_agg.coverage_items
           FROM builder_warranties bw
           JOIN warranty_homeowner_bindings whb ON whb.warranty_id = bw.id AND whb.user_id = $1
           LEFT JOIN LATERAL (
             SELECT json_agg(wci ORDER BY wci.sort_order) AS coverage_items
             FROM warranty_coverage_items wci WHERE wci.warranty_id = bw.id
           ) wci_agg ON TRUE
           WHERE bw.deleted_at IS NULL
           ORDER BY bw.effective_date DESC`,
          [user_id]
        );
        return reply.send({ items: res.rows });
      });
    },
  );

  app.get('/homeowner/warranties/:id', { preHandler: [authenticate] },
    async (req: any, reply: FastifyReply) => {
      const { tenant_id, user_id } = req.jwt;
      return withTenantContext(tenant_id, async (client) => {
        // Verify binding
        const binding = await client.query(
          `SELECT 1 FROM warranty_homeowner_bindings WHERE warranty_id = $1 AND user_id = $2`,
          [req.params.id, user_id]
        );
        if (binding.rows.length === 0) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Warranty not found' } });

        const [wRes, coverageItems, recentClaims] = await Promise.all([
          client.query(`SELECT id, title, property_address, homeowner_name, effective_date, status, builder_contact_name, builder_contact_email, builder_contact_phone FROM builder_warranties WHERE id = $1 AND deleted_at IS NULL`, [req.params.id]),
          client.query(`SELECT * FROM warranty_coverage_items WHERE warranty_id = $1 ORDER BY sort_order`, [req.params.id]),
          client.query(`SELECT id, title, status, priority, created_at FROM warranty_claims WHERE warranty_id = $1 AND deleted_at IS NULL ORDER BY created_at DESC LIMIT 5`, [req.params.id]),
        ]);

        if (wRes.rows.length === 0) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Warranty not found' } });
        return reply.send({ ...wRes.rows[0], coverage_items: coverageItems.rows, recent_claims: recentClaims.rows });
      });
    },
  );

  // ── Homeowner claims ───────────────────────────────────────────────────────

  app.get('/homeowner/warranties/:id/claims', { preHandler: [authenticate] },
    async (req: any, reply: FastifyReply) => {
      const { tenant_id, user_id } = req.jwt;
      return withTenantContext(tenant_id, async (client) => {
        const binding = await client.query(
          `SELECT 1 FROM warranty_homeowner_bindings WHERE warranty_id = $1 AND user_id = $2`,
          [req.params.id, user_id]
        );
        if (binding.rows.length === 0) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Warranty not found' } });

        const res = await client.query(
          `SELECT wc.id, wc.title, wc.status, wc.priority, wc.category, wc.created_at, wc.updated_at
           FROM warranty_claims wc
           WHERE wc.warranty_id = $1 AND wc.deleted_at IS NULL ORDER BY wc.created_at DESC`,
          [req.params.id]
        );
        return reply.send({ items: res.rows });
      });
    },
  );

  app.post('/homeowner/warranties/:id/claims', { preHandler: [authenticate] },
    async (req: any, reply: FastifyReply) => {
      const { tenant_id, user_id } = req.jwt;
      const body = ClaimSubmitSchema.safeParse(req.body);
      if (!body.success) return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: body.error.issues[0]?.message } });
      const d = body.data;

      return withTenantContext(tenant_id, async (client) => {
        const binding = await client.query(
          `SELECT 1 FROM warranty_homeowner_bindings WHERE warranty_id = $1 AND user_id = $2`,
          [req.params.id, user_id]
        );
        if (binding.rows.length === 0) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Warranty not found' } });

        const cRes = await client.query(
          `INSERT INTO warranty_claims
             (tenant_id, warranty_id, coverage_item_id, submitted_by_user_id, submitted_by_homeowner,
              title, description, category, priority, created_by)
           VALUES (current_setting('app.current_tenant_id')::uuid,$1,$2,$3,TRUE,$4,$5,$6,$7,$3)
           RETURNING id, title, status, priority, category, created_at`,
          [req.params.id, d.coverage_item_id ?? null, user_id, d.title, d.description, d.category, d.priority]
        );
        const claim = cRes.rows[0];

        // Initial status history
        await client.query(
          `INSERT INTO warranty_claim_status_history (tenant_id, claim_id, from_status, to_status, changed_by_user_id)
           VALUES (current_setting('app.current_tenant_id')::uuid,$1,NULL,'submitted',$2)`,
          [claim.id, user_id]
        );

        // Audit event
        await client.query(
          `INSERT INTO warranty_audit_events (tenant_id, warranty_id, claim_id, event_type, actor_id, actor_type, description)
           VALUES (current_setting('app.current_tenant_id')::uuid,$1,$2,'claim_submitted_by_homeowner',$3,'homeowner',$4)`,
          [req.params.id, claim.id, user_id, `Homeowner submitted claim: ${d.title}`]
        );

        return reply.status(201).send(claim);
      });
    },
  );

  app.get('/homeowner/warranties/:id/claims/:cid', { preHandler: [authenticate] },
    async (req: any, reply: FastifyReply) => {
      const { tenant_id, user_id } = req.jwt;
      return withTenantContext(tenant_id, async (client) => {
        const binding = await client.query(
          `SELECT 1 FROM warranty_homeowner_bindings WHERE warranty_id = $1 AND user_id = $2`,
          [req.params.id, user_id]
        );
        if (binding.rows.length === 0) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Warranty not found' } });

        const cRes = await client.query(
          `SELECT wc.id, wc.title, wc.description, wc.status, wc.priority, wc.category,
                  wc.scheduled_repair_date, wc.completed_at, wc.resolution_notes, wc.created_at
           FROM warranty_claims wc
           WHERE wc.id = $1 AND wc.warranty_id = $2 AND wc.deleted_at IS NULL`,
          [req.params.cid, req.params.id]
        );
        if (cRes.rows.length === 0) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Claim not found' } });

        const [history, photos] = await Promise.all([
          client.query(`SELECT to_status, changed_at FROM warranty_claim_status_history WHERE claim_id = $1 ORDER BY changed_at ASC`, [req.params.cid]),
          client.query(`SELECT id, storage_path, created_at FROM warranty_claim_photos WHERE claim_id = $1 ORDER BY created_at ASC`, [req.params.cid]),
        ]);

        return reply.send({ ...cRes.rows[0], status_history: history.rows, photos: photos.rows });
      });
    },
  );
}
