// routes/v1/vendors.ts — Vendor CRUD
// Subcontractors, suppliers, equipment vendors
// Locked decisions: T-01, T-03, T-12, A-03

import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { withTenantContext } from '../../lib/tenant-context.js';
import { writeAuditEntry } from '../../lib/audit-log.js';
import { authenticate, requireRole } from '../../plugins/auth-plugin.js';
import { normalizeTradeKey, tradeDef } from '../../lib/trades/taxonomy.js';

// T-64: collapse a raw trade string onto its canonical taxonomy key when it resolves
// (aliases fold in: 'striping' → pavement_marking). Unknown free text is preserved as
// typed — warned via pickers, never rejected (existing vendor data stays valid).
function canonicalTrade(raw: string | null | undefined): string | null {
  if (raw === null || raw === undefined) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  return normalizeTradeKey(trimmed) ?? trimmed;
}

// Case-insensitive match set for a trade filter: canonical key + its aliases cover rows
// written before normalization (e.g. stored 'mechanical' vs filter 'hvac'), plus the raw
// input itself for unknown free-text values.
function tradeMatchSet(raw: string): string[] {
  const def = tradeDef(raw);
  const set = new Set<string>([raw.trim().toLowerCase()]);
  if (def) {
    set.add(def.key);
    for (const a of def.aliases ?? []) set.add(a.toLowerCase());
  }
  return [...set];
}

const CreateSchema = z.object({
  name: z.string().min(1).max(500),
  vendor_type: z.enum(['subcontractor', 'supplier', 'equipment', 'other']).default('subcontractor'),
  trade_type: z.string().optional(),
  contact_name: z.string().optional(),
  contact_email: z.string().email().optional(),
  contact_phone: z.string().optional(),
  is_preferred: z.boolean().default(false),
  is_prequalified: z.boolean().default(false),
  performance_notes: z.string().optional(),
});

const UpdateSchema = z.object({
  name: z.string().min(1).max(500).optional(),
  vendor_type: z.enum(['subcontractor', 'supplier', 'equipment', 'other']).optional(),
  trade_type: z.string().optional().nullable(),
  contact_name: z.string().optional().nullable(),
  contact_email: z.string().email().optional().nullable(),
  contact_phone: z.string().optional().nullable(),
  is_preferred: z.boolean().optional(),
  is_prequalified: z.boolean().optional(),
  performance_notes: z.string().optional().nullable(),
  version: z.number().int().min(1),
});

const ListQuerySchema = z.object({
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  vendor_type: z.enum(['subcontractor', 'supplier', 'equipment', 'other']).optional(),
  trade_type: z.string().min(1).max(100).optional(),
  is_preferred: z.coerce.boolean().optional(),
});

const WRITE_ROLES = ['OWNER', 'PROJECT_MANAGER', 'ESTIMATOR'] as const;

export async function vendorRoutes(app: FastifyInstance): Promise<void> {
  app.post('/vendors', { preHandler: [authenticate, requireRole(...WRITE_ROLES)] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const body = CreateSchema.safeParse(req.body);
      if (!body.success) return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: 'Validation failed', fields: body.error.errors.map(e => ({ field: e.path.join('.'), message: e.message })) } });
      const { tenant_id, user_id, email, role } = req.jwt;
      const { name, vendor_type, trade_type, contact_name, contact_email, contact_phone, is_preferred, is_prequalified, performance_notes } = body.data;

      const vendor = await withTenantContext(tenant_id, async (client) => {
        const { rows } = await client.query(
          `INSERT INTO vendors
             (tenant_id, name, vendor_type, trade_type, contact_name, contact_email,
              contact_phone, is_preferred, is_prequalified, performance_notes, created_by)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
          [tenant_id, name, vendor_type, canonicalTrade(trade_type), contact_name ?? null,
           contact_email ?? null, contact_phone ?? null, is_preferred, is_prequalified,
           performance_notes ?? null, user_id]
        );
        await writeAuditEntry(client, { tenantId: tenant_id, category: 'data', action: 'vendor.created', actorId: user_id, actorEmail: email, actorRole: role, resourceType: 'vendor', resourceId: rows[0].id, payload: { name, vendor_type }, ipAddress: req.ip });
        return rows[0];
      });
      return reply.status(201).send({ vendor });
    }
  );

  app.get('/vendors', { preHandler: [authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const query = ListQuerySchema.safeParse(req.query);
      if (!query.success) return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: 'Invalid query', fields: query.error.errors.map(e => ({ field: e.path.join('.'), message: e.message })) } });
      const { tenant_id } = req.jwt;
      const { cursor, limit, vendor_type, trade_type, is_preferred } = query.data;

      const vendors = await withTenantContext(tenant_id, async (client) => {
        const params: unknown[] = [limit + 1];
        const conditions = ['deleted_at IS NULL'];
        let idx = 2;
        if (cursor) { conditions.push(`(created_at, id) < (SELECT created_at, id FROM vendors WHERE id = $${idx++})`); params.push(cursor); }
        if (vendor_type) { conditions.push(`vendor_type = $${idx++}`); params.push(vendor_type); }
        if (trade_type) { conditions.push(`LOWER(trade_type) = ANY($${idx++})`); params.push(tradeMatchSet(trade_type)); }
        if (is_preferred !== undefined) { conditions.push(`is_preferred = $${idx++}`); params.push(is_preferred); }
        const { rows } = await client.query(`SELECT * FROM vendors WHERE ${conditions.join(' AND ')} ORDER BY name ASC, id DESC LIMIT $1`, params);
        return rows;
      });

      const hasMore = vendors.length > limit;
      const items = hasMore ? vendors.slice(0, limit) : vendors;
      return reply.status(200).send({ vendors: items, pagination: { has_more: hasMore, next_cursor: hasMore ? items[items.length - 1].id : null } });
    }
  );

  app.get('/vendors/:id', { preHandler: [authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as { id: string };
      const { tenant_id } = req.jwt;
      const vendor = await withTenantContext(tenant_id, async (client) => {
        const { rows } = await client.query(`SELECT * FROM vendors WHERE id = $1 AND deleted_at IS NULL`, [id]);
        return rows[0] ?? null;
      });
      if (!vendor) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Vendor not found' } });
      return reply.status(200).send({ vendor });
    }
  );

  app.patch('/vendors/:id', { preHandler: [authenticate, requireRole(...WRITE_ROLES)] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as { id: string };
      const body = UpdateSchema.safeParse(req.body);
      if (!body.success) return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: 'Validation failed', fields: body.error.errors.map(e => ({ field: e.path.join('.'), message: e.message })) } });
      const { tenant_id, user_id, email, role } = req.jwt;
      const { name, vendor_type, trade_type, contact_name, contact_email, contact_phone, is_preferred, is_prequalified, performance_notes, version } = body.data;

      const result = await withTenantContext(tenant_id, async (client) => {
        const sets = ['version = version + 1', 'updated_at = NOW()'];
        const params: unknown[] = [];
        let idx = 1;
        if (name !== undefined) { params.push(name); sets.push(`name = $${idx++}`); }
        if (vendor_type !== undefined) { params.push(vendor_type); sets.push(`vendor_type = $${idx++}`); }
        if (trade_type !== undefined) { params.push(canonicalTrade(trade_type)); sets.push(`trade_type = $${idx++}`); }
        if (contact_name !== undefined) { params.push(contact_name); sets.push(`contact_name = $${idx++}`); }
        if (contact_email !== undefined) { params.push(contact_email); sets.push(`contact_email = $${idx++}`); }
        if (contact_phone !== undefined) { params.push(contact_phone); sets.push(`contact_phone = $${idx++}`); }
        if (is_preferred !== undefined) { params.push(is_preferred); sets.push(`is_preferred = $${idx++}`); }
        if (is_prequalified !== undefined) { params.push(is_prequalified); sets.push(`is_prequalified = $${idx++}`); }
        if (performance_notes !== undefined) { params.push(performance_notes); sets.push(`performance_notes = $${idx++}`); }
        params.push(id, version);
        const { rows } = await client.query(`UPDATE vendors SET ${sets.join(', ')} WHERE id = $${idx} AND version = $${idx + 1} AND deleted_at IS NULL RETURNING *`, params);
        if (rows.length > 0) {
          await writeAuditEntry(client, { tenantId: tenant_id, category: 'data', action: 'vendor.updated', actorId: user_id, actorEmail: email, actorRole: role, resourceType: 'vendor', resourceId: id, payload: body.data, ipAddress: req.ip });
          return { row: rows[0], status: 'ok' };
        }
        const { rows: check } = await client.query(`SELECT id FROM vendors WHERE id = $1 AND deleted_at IS NULL`, [id]);
        return { row: null, status: check.length === 0 ? 'not_found' : 'conflict' };
      });

      if (result.status === 'not_found') return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Vendor not found' } });
      if (result.status === 'conflict') return reply.status(409).send({ error: { code: 'VERSION_CONFLICT', message: 'Version conflict — fetch the latest and retry' } });
      return reply.status(200).send({ vendor: result.row });
    }
  );

  app.delete('/vendors/:id', { preHandler: [authenticate, requireRole(...WRITE_ROLES)] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as { id: string };
      const { tenant_id, user_id, email, role } = req.jwt;
      const deleted = await withTenantContext(tenant_id, async (client) => {
        const { rows } = await client.query(`UPDATE vendors SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL RETURNING id`, [id]);
        if (rows.length > 0) await writeAuditEntry(client, { tenantId: tenant_id, category: 'data', action: 'vendor.deleted', actorId: user_id, actorEmail: email, actorRole: role, resourceType: 'vendor', resourceId: id, payload: {}, ipAddress: req.ip });
        return rows[0] ?? null;
      });
      if (!deleted) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Vendor not found' } });
      return reply.status(204).send();
    }
  );
}
