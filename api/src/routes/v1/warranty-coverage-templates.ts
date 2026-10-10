// routes/v1/warranty-coverage-templates.ts — Builder warranty coverage templates
// Business+ gate (same pattern as asset management)

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

const TemplateCreateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  is_active: z.boolean().default(true),
});

const TemplateUpdateSchema = z.object({
  version: z.number().int().positive(),
  name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  is_active: z.boolean().optional(),
});

const TemplateItemSchema = z.object({
  coverage_type: z.enum(['workmanship', 'systems', 'structural', 'custom']),
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  duration_months: z.number().int().positive(),
  sort_order: z.number().int().default(0),
});

const TemplateItemUpdateSchema = z.object({
  coverage_type: z.enum(['workmanship', 'systems', 'structural', 'custom']).optional(),
  title: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  duration_months: z.number().int().positive().optional(),
  sort_order: z.number().int().optional(),
});

export async function warrantyCoverageTemplateRoutes(app: FastifyInstance): Promise<void> {

  // ── Templates ──────────────────────────────────────────────────────────────

  app.get('/warranty-coverage-templates', { preHandler: [authenticate, requireRole('OWNER', 'PROJECT_MANAGER')] },
    async (req: any, reply: FastifyReply) => {
      const tenant_id = await guardTier(req, reply);
      if (!tenant_id) return;
      return withTenantContext(tenant_id, async (client) => {
        const res = await client.query(
          `SELECT * FROM warranty_coverage_templates
           WHERE (tenant_id = $1 OR is_system_template = TRUE) AND deleted_at IS NULL
           ORDER BY is_system_template DESC, name ASC`,
          [tenant_id]
        );
        return reply.send({ items: res.rows });
      });
    },
  );

  app.post('/warranty-coverage-templates', { preHandler: [authenticate, requireRole('OWNER', 'PROJECT_MANAGER')] },
    async (req: any, reply: FastifyReply) => {
      const tenant_id = await guardTier(req, reply);
      if (!tenant_id) return;
      const body = TemplateCreateSchema.safeParse(req.body);
      if (!body.success) return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: body.error.issues[0]?.message } });
      const { user_id } = (req as any).jwt;
      const d = body.data;
      return withTenantContext(tenant_id, async (client) => {
        const res = await client.query(
          `INSERT INTO warranty_coverage_templates (tenant_id, name, description, is_active, created_by)
           VALUES (current_setting('app.current_tenant_id')::uuid, $1, $2, $3, $4) RETURNING *`,
          [d.name, d.description ?? null, d.is_active, user_id]
        );
        return reply.status(201).send(res.rows[0]);
      });
    },
  );

  app.get('/warranty-coverage-templates/:id', { preHandler: [authenticate, requireRole('OWNER', 'PROJECT_MANAGER')] },
    async (req: any, reply: FastifyReply) => {
      const tenant_id = await guardTier(req, reply);
      if (!tenant_id) return;
      return withTenantContext(tenant_id, async (client) => {
        const tmpl = await client.query(
          `SELECT * FROM warranty_coverage_templates
           WHERE id = $1 AND (tenant_id = $2 OR is_system_template = TRUE) AND deleted_at IS NULL`,
          [req.params.id, tenant_id]
        );
        if (tmpl.rows.length === 0) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Template not found' } });
        const items = await client.query(
          `SELECT * FROM warranty_coverage_template_items WHERE template_id = $1 AND deleted_at IS NULL ORDER BY sort_order`,
          [req.params.id]
        );
        return reply.send({ ...tmpl.rows[0], items: items.rows });
      });
    },
  );

  app.patch('/warranty-coverage-templates/:id', { preHandler: [authenticate, requireRole('OWNER', 'PROJECT_MANAGER')] },
    async (req: any, reply: FastifyReply) => {
      const tenant_id = await guardTier(req, reply);
      if (!tenant_id) return;
      const body = TemplateUpdateSchema.safeParse(req.body);
      if (!body.success) return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: body.error.issues[0]?.message } });
      const { version, ...fields } = body.data;
      return withTenantContext(tenant_id, async (client) => {
        const existing = await client.query(
          `SELECT id, is_system_template FROM warranty_coverage_templates WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL`,
          [req.params.id, tenant_id]
        );
        if (existing.rows.length === 0) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Template not found' } });
        if (existing.rows[0].is_system_template) return reply.status(403).send({ error: { code: 'FORBIDDEN', message: 'System templates are read-only' } });
        const sets: string[] = ['updated_at = NOW()']; const params: unknown[] = []; let i = 1;
        for (const col of ['name', 'description', 'is_active'] as const) {
          if (col in fields) { sets.push(`${col} = $${i++}`); params.push((fields as any)[col] ?? null); }
        }
        params.push(req.params.id, version);
        const res = await client.query(
          `UPDATE warranty_coverage_templates SET ${sets.join(', ')} WHERE id = $${i++} AND version = $${i++} AND deleted_at IS NULL RETURNING *`,
          params
        );
        if (res.rows.length === 0) return reply.status(409).send({ error: { code: 'VERSION_CONFLICT', message: 'Template was modified by another user.' } });
        return reply.send(res.rows[0]);
      });
    },
  );

  app.delete('/warranty-coverage-templates/:id', { preHandler: [authenticate, requireRole('OWNER')] },
    async (req: any, reply: FastifyReply) => {
      const tenant_id = await guardTier(req, reply);
      if (!tenant_id) return;
      return withTenantContext(tenant_id, async (client) => {
        const existing = await client.query(
          `SELECT id, is_system_template FROM warranty_coverage_templates WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL`,
          [req.params.id, tenant_id]
        );
        if (existing.rows.length === 0) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Template not found' } });
        if (existing.rows[0].is_system_template) return reply.status(403).send({ error: { code: 'FORBIDDEN', message: 'System templates cannot be deleted' } });
        await client.query(
          `UPDATE warranty_coverage_templates SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1`,
          [req.params.id]
        );
        return reply.status(204).send();
      });
    },
  );

  // ── Template Items ─────────────────────────────────────────────────────────

  app.post('/warranty-coverage-templates/:id/items', { preHandler: [authenticate, requireRole('OWNER', 'PROJECT_MANAGER')] },
    async (req: any, reply: FastifyReply) => {
      const tenant_id = await guardTier(req, reply);
      if (!tenant_id) return;
      const body = TemplateItemSchema.safeParse(req.body);
      if (!body.success) return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: body.error.issues[0]?.message } });
      const { user_id } = (req as any).jwt;
      const d = body.data;
      return withTenantContext(tenant_id, async (client) => {
        const tmpl = await client.query(
          `SELECT id, is_system_template FROM warranty_coverage_templates WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL`,
          [req.params.id, tenant_id]
        );
        if (tmpl.rows.length === 0) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Template not found' } });
        if (tmpl.rows[0].is_system_template) return reply.status(403).send({ error: { code: 'FORBIDDEN', message: 'System templates are read-only' } });
        const res = await client.query(
          `INSERT INTO warranty_coverage_template_items (tenant_id, template_id, coverage_type, title, description, duration_months, sort_order, created_by)
           VALUES (current_setting('app.current_tenant_id')::uuid, $1, $2, $3, $4, $5, $6, $7) RETURNING *`,
          [req.params.id, d.coverage_type, d.title, d.description ?? null, d.duration_months, d.sort_order, user_id]
        );
        return reply.status(201).send(res.rows[0]);
      });
    },
  );

  app.patch('/warranty-coverage-templates/:id/items/:iid', { preHandler: [authenticate, requireRole('OWNER', 'PROJECT_MANAGER')] },
    async (req: any, reply: FastifyReply) => {
      const tenant_id = await guardTier(req, reply);
      if (!tenant_id) return;
      const body = TemplateItemUpdateSchema.safeParse(req.body);
      if (!body.success) return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: body.error.issues[0]?.message } });
      return withTenantContext(tenant_id, async (client) => {
        const existing = await client.query(
          `SELECT wcti.id FROM warranty_coverage_template_items wcti
           JOIN warranty_coverage_templates wct ON wct.id = wcti.template_id
           WHERE wcti.id = $1 AND wcti.template_id = $2 AND wct.tenant_id = $3
             AND wct.is_system_template = FALSE AND wcti.deleted_at IS NULL`,
          [req.params.iid, req.params.id, tenant_id]
        );
        if (existing.rows.length === 0) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Template item not found' } });
        const sets: string[] = ['updated_at = NOW()']; const params: unknown[] = []; let i = 1;
        for (const col of ['coverage_type', 'title', 'description', 'duration_months', 'sort_order'] as const) {
          if (col in body.data) { sets.push(`${col} = $${i++}`); params.push((body.data as any)[col] ?? null); }
        }
        params.push(req.params.iid);
        const res = await client.query(
          `UPDATE warranty_coverage_template_items SET ${sets.join(', ')} WHERE id = $${i++} AND deleted_at IS NULL RETURNING *`,
          params
        );
        return reply.send(res.rows[0]);
      });
    },
  );

  app.delete('/warranty-coverage-templates/:id/items/:iid', { preHandler: [authenticate, requireRole('OWNER', 'PROJECT_MANAGER')] },
    async (req: any, reply: FastifyReply) => {
      const tenant_id = await guardTier(req, reply);
      if (!tenant_id) return;
      return withTenantContext(tenant_id, async (client) => {
        const res = await client.query(
          `UPDATE warranty_coverage_template_items wcti SET deleted_at = NOW(), updated_at = NOW()
           FROM warranty_coverage_templates wct
           WHERE wcti.id = $1 AND wcti.template_id = $2 AND wct.id = wcti.template_id
             AND wct.tenant_id = $3 AND wct.is_system_template = FALSE AND wcti.deleted_at IS NULL
           RETURNING wcti.id`,
          [req.params.iid, req.params.id, tenant_id]
        );
        if (res.rows.length === 0) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Template item not found' } });
        return reply.status(204).send();
      });
    },
  );
}
