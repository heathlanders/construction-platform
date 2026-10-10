// routes/v1/builder-warranties.ts — Builder warranty CRUD + homeowner portal management
// Business+ gate. Creates coverage snapshot at issuance — template changes don't affect active warranties.

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

const WarrantyCreateSchema = z.object({
  project_id: z.string().uuid().optional().nullable(),
  template_id: z.string().uuid().optional().nullable(),
  title: z.string().min(1),
  property_address: z.string().min(1),
  homeowner_name: z.string().min(1),
  homeowner_email: z.string().email(),
  homeowner_phone: z.string().optional().nullable(),
  effective_date: z.string().date(),
  builder_contact_name: z.string().optional().nullable(),
  builder_contact_email: z.string().email().optional().nullable(),
  builder_contact_phone: z.string().optional().nullable(),
  status: z.enum(['draft', 'active', 'expired', 'voided', 'closed']).default('active'),
  notes: z.string().optional().nullable(),
  create_homeowner_portal_user: z.boolean().default(true),
});

const WarrantyUpdateSchema = z.object({
  version: z.number().int().positive(),
  title: z.string().min(1).optional(),
  property_address: z.string().min(1).optional(),
  homeowner_name: z.string().min(1).optional(),
  homeowner_email: z.string().email().optional(),
  homeowner_phone: z.string().optional().nullable(),
  effective_date: z.string().date().optional(),
  builder_contact_name: z.string().optional().nullable(),
  builder_contact_email: z.string().email().optional().nullable(),
  builder_contact_phone: z.string().optional().nullable(),
  status: z.enum(['draft', 'active', 'expired', 'voided', 'closed']).optional(),
  notes: z.string().optional().nullable(),
});

export async function builderWarrantyRoutes(app: FastifyInstance): Promise<void> {

  // ── List warranties ────────────────────────────────────────────────────────

  app.get('/builder-warranties', { preHandler: [authenticate, requireRole('OWNER', 'PROJECT_MANAGER', 'FOREMAN')] },
    async (req: any, reply: FastifyReply) => {
      const tenant_id = await guardTier(req, reply);
      if (!tenant_id) return;
      const { status, project_id } = req.query as Record<string, string>;
      return withTenantContext(tenant_id, async (client) => {
        const conditions = ['bw.deleted_at IS NULL'];
        const params: unknown[] = [];
        let i = 1;
        if (status) { conditions.push(`bw.status = $${i++}`); params.push(status); }
        if (project_id) { conditions.push(`bw.project_id = $${i++}`); params.push(project_id); }
        const res = await client.query(
          `SELECT bw.*,
             (SELECT COUNT(*) FROM warranty_claims wc WHERE wc.warranty_id = bw.id AND wc.deleted_at IS NULL AND wc.status NOT IN ('closed','denied')) AS open_claim_count
           FROM builder_warranties bw
           WHERE ${conditions.join(' AND ')}
           ORDER BY bw.created_at DESC`,
          params
        );
        return reply.send({ items: res.rows });
      });
    },
  );

  // ── Dashboard summary ──────────────────────────────────────────────────────

  app.get('/builder-warranties/dashboard', { preHandler: [authenticate, requireRole('OWNER', 'PROJECT_MANAGER')] },
    async (req: any, reply: FastifyReply) => {
      const tenant_id = await guardTier(req, reply);
      if (!tenant_id) return;
      return withTenantContext(tenant_id, async (client) => {
        const [summary, expiring, openClaims] = await Promise.all([
          client.query(
            `SELECT status, COUNT(*) AS count FROM builder_warranties
             WHERE deleted_at IS NULL GROUP BY status`
          ),
          client.query(
            `SELECT COUNT(*) AS count FROM warranty_coverage_items wci
             JOIN builder_warranties bw ON bw.id = wci.warranty_id
             WHERE bw.deleted_at IS NULL AND bw.status = 'active'
               AND wci.expiry_date BETWEEN NOW() AND NOW() + INTERVAL '90 days'`
          ),
          client.query(
            `SELECT COUNT(*) AS count FROM warranty_claims wc
             WHERE wc.deleted_at IS NULL AND wc.status NOT IN ('closed','denied')`
          ),
        ]);
        return reply.send({ status_counts: summary.rows, expiring_coverage_count: expiring.rows[0]?.count ?? 0, open_claim_count: openClaims.rows[0]?.count ?? 0 });
      });
    },
  );

  // ── Create warranty ────────────────────────────────────────────────────────

  app.post('/builder-warranties', { preHandler: [authenticate, requireRole('OWNER', 'PROJECT_MANAGER')] },
    async (req: any, reply: FastifyReply) => {
      const tenant_id = await guardTier(req, reply);
      if (!tenant_id) return;
      const body = WarrantyCreateSchema.safeParse(req.body);
      if (!body.success) return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: body.error.issues[0]?.message } });
      const { user_id, email, role } = (req as any).jwt;
      const d = body.data;

      return withTenantContext(tenant_id, async (client) => {
        // Create warranty
        const wRes = await client.query(
          `INSERT INTO builder_warranties
             (tenant_id, project_id, template_id, title, property_address, homeowner_name,
              homeowner_email, homeowner_phone, effective_date, builder_contact_name,
              builder_contact_email, builder_contact_phone, status, notes, created_by)
           VALUES (current_setting('app.current_tenant_id')::uuid,$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
           RETURNING *`,
          [d.project_id ?? null, d.template_id ?? null, d.title, d.property_address,
           d.homeowner_name, d.homeowner_email, d.homeowner_phone ?? null, d.effective_date,
           d.builder_contact_name ?? null, d.builder_contact_email ?? null,
           d.builder_contact_phone ?? null, d.status, d.notes ?? null, user_id]
        );
        const warranty = wRes.rows[0];

        // Copy template items as snapshot
        if (d.template_id) {
          const items = await client.query(
            `SELECT * FROM warranty_coverage_template_items
             WHERE template_id = $1 AND deleted_at IS NULL ORDER BY sort_order`,
            [d.template_id]
          );
          for (const item of items.rows) {
            const expiryDate = new Date(d.effective_date);
            expiryDate.setMonth(expiryDate.getMonth() + item.duration_months);
            await client.query(
              `INSERT INTO warranty_coverage_items
                 (tenant_id, warranty_id, coverage_type, title, description, duration_months, expiry_date, sort_order)
               VALUES (current_setting('app.current_tenant_id')::uuid,$1,$2,$3,$4,$5,$6,$7)`,
              [warranty.id, item.coverage_type, item.title, item.description,
               item.duration_months, expiryDate.toISOString().split('T')[0], item.sort_order]
            );
          }
        }

        // Optionally create homeowner portal user + binding
        if (d.create_homeowner_portal_user) {
          // Check if homeowner user already exists
          let homeownerUserId: string | null = null;
          const existing = await client.query(
            `SELECT id FROM users WHERE email = $1 AND role = 'homeowner_portal' AND deleted_at IS NULL`,
            [d.homeowner_email]
          );
          if (existing.rows.length > 0) {
            homeownerUserId = existing.rows[0].id;
          } else {
            const nameParts = d.homeowner_name.split(' ');
            const firstName = nameParts[0] ?? d.homeowner_name;
            const lastName = nameParts.slice(1).join(' ') || '-';
            const uRes = await client.query(
              `INSERT INTO users (tenant_id, email, first_name, last_name, role, status, created_by)
               VALUES (current_setting('app.current_tenant_id')::uuid,$1,$2,$3,'homeowner_portal','active',$4)
               RETURNING id`,
              [d.homeowner_email, firstName, lastName, user_id]
            );
            homeownerUserId = uRes.rows[0].id;
          }
          await client.query(
            `INSERT INTO warranty_homeowner_bindings (tenant_id, warranty_id, user_id)
             VALUES (current_setting('app.current_tenant_id')::uuid,$1,$2)
             ON CONFLICT (tenant_id, warranty_id, user_id) DO NOTHING`,
            [warranty.id, homeownerUserId]
          );
        }

        await writeAuditEntry(client, {
          tenantId: tenant_id, category: 'data', action: 'warranty.created',
          actorId: user_id, actorEmail: email, actorRole: role,
          resourceType: 'builder_warranty', resourceId: warranty.id,
          payload: { title: d.title, homeowner_email: d.homeowner_email }, ipAddress: (req as any).ip,
        });

        return reply.status(201).send(warranty);
      });
    },
  );

  // ── Get warranty detail ────────────────────────────────────────────────────

  app.get('/builder-warranties/:id', { preHandler: [authenticate, requireRole('OWNER', 'PROJECT_MANAGER', 'FOREMAN')] },
    async (req: any, reply: FastifyReply) => {
      const tenant_id = await guardTier(req, reply);
      if (!tenant_id) return;
      return withTenantContext(tenant_id, async (client) => {
        const wRes = await client.query(
          `SELECT * FROM builder_warranties WHERE id = $1 AND deleted_at IS NULL`,
          [req.params.id]
        );
        if (wRes.rows.length === 0) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Warranty not found' } });
        const [coverageItems, claims] = await Promise.all([
          client.query(`SELECT * FROM warranty_coverage_items WHERE warranty_id = $1 ORDER BY sort_order`, [req.params.id]),
          client.query(`SELECT id, title, status, priority, created_at FROM warranty_claims WHERE warranty_id = $1 AND deleted_at IS NULL ORDER BY created_at DESC LIMIT 10`, [req.params.id]),
        ]);
        return reply.send({ ...wRes.rows[0], coverage_items: coverageItems.rows, recent_claims: claims.rows });
      });
    },
  );

  // ── Update warranty ────────────────────────────────────────────────────────

  app.patch('/builder-warranties/:id', { preHandler: [authenticate, requireRole('OWNER', 'PROJECT_MANAGER')] },
    async (req: any, reply: FastifyReply) => {
      const tenant_id = await guardTier(req, reply);
      if (!tenant_id) return;
      const body = WarrantyUpdateSchema.safeParse(req.body);
      if (!body.success) return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: body.error.issues[0]?.message } });
      const { version, ...fields } = body.data;
      return withTenantContext(tenant_id, async (client) => {
        const existing = await client.query(
          `SELECT id FROM builder_warranties WHERE id = $1 AND deleted_at IS NULL`, [req.params.id]
        );
        if (existing.rows.length === 0) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Warranty not found' } });
        const sets: string[] = ['updated_at = NOW()']; const params: unknown[] = []; let i = 1;
        const cols = ['title','property_address','homeowner_name','homeowner_email','homeowner_phone','effective_date','builder_contact_name','builder_contact_email','builder_contact_phone','status','notes'] as const;
        for (const col of cols) {
          if (col in fields) { sets.push(`${col} = $${i++}`); params.push((fields as any)[col] ?? null); }
        }
        params.push(req.params.id, version);
        const res = await client.query(
          `UPDATE builder_warranties SET ${sets.join(', ')} WHERE id = $${i++} AND version = $${i++} AND deleted_at IS NULL RETURNING *`,
          params
        );
        if (res.rows.length === 0) return reply.status(409).send({ error: { code: 'VERSION_CONFLICT', message: 'Warranty was modified by another user.' } });
        return reply.send(res.rows[0]);
      });
    },
  );

  // ── Delete warranty ────────────────────────────────────────────────────────

  app.delete('/builder-warranties/:id', { preHandler: [authenticate, requireRole('OWNER')] },
    async (req: any, reply: FastifyReply) => {
      const tenant_id = await guardTier(req, reply);
      if (!tenant_id) return;
      return withTenantContext(tenant_id, async (client) => {
        const res = await client.query(
          `UPDATE builder_warranties SET deleted_at = NOW(), updated_at = NOW()
           WHERE id = $1 AND deleted_at IS NULL RETURNING id`,
          [req.params.id]
        );
        if (res.rows.length === 0) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Warranty not found' } });
        return reply.status(204).send();
      });
    },
  );

  // ── Send homeowner magic link ──────────────────────────────────────────────

  app.post('/builder-warranties/:id/send-magic-link', { preHandler: [authenticate, requireRole('OWNER', 'PROJECT_MANAGER')] },
    async (req: any, reply: FastifyReply) => {
      const tenant_id = await guardTier(req, reply);
      if (!tenant_id) return;
      return withTenantContext(tenant_id, async (client) => {
        const wRes = await client.query(
          `SELECT bw.id, bw.homeowner_email, bw.homeowner_name, whb.user_id
           FROM builder_warranties bw
           JOIN warranty_homeowner_bindings whb ON whb.warranty_id = bw.id
           WHERE bw.id = $1 AND bw.deleted_at IS NULL`,
          [req.params.id]
        );
        if (wRes.rows.length === 0) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Warranty or homeowner binding not found' } });
        const { homeowner_email, homeowner_name, user_id: homeownerUserId } = wRes.rows[0];

        await enqueueJob(tenant_id, 'warranty.homeowner_magic_link', {
          user_id: homeownerUserId,
          email: homeowner_email,
          name: homeowner_name,
          warranty_id: req.params.id,
        });

        // Update last sent timestamp
        await client.query(
          `UPDATE warranty_homeowner_bindings SET magic_link_last_sent = NOW(), updated_at = NOW()
           WHERE warranty_id = $1 AND user_id = $2`,
          [req.params.id, homeownerUserId]
        );

        return reply.send({ ok: true, sent_to: homeowner_email });
      });
    },
  );
}
