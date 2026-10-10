// routes/v1/framing-correction-items.ts — Punch items raised by a framing inspection.
// Child of framing_inspections. Tracked open → in_progress → resolved.
// Mirrors the concrete-test-records child-CRUD pattern. T-12 (versioning), T-42.

import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { withTenantContext } from '../../lib/tenant-context.js';
import { writeAuditEntry } from '../../lib/audit-log.js';
import { authenticate, requireRole } from '../../plugins/auth-plugin.js';

const SEVERITIES = ['minor', 'major', 'safety'] as const;
const STATUSES = ['open', 'in_progress', 'resolved'] as const;
const W = ['OWNER', 'PROJECT_MANAGER', 'FOREMAN'] as const;

const CreateSchema = z.object({
  framing_inspection_id: z.string().uuid(),
  description:           z.string().min(1).max(1000),
  location:             z.string().max(300).optional(),
  severity:             z.enum(SEVERITIES).default('minor'),
  status:               z.enum(STATUSES).default('open'),
  notes:                z.string().optional(),
});

const UpdateSchema = z.object({
  description: z.string().min(1).max(1000).optional(),
  location:    z.string().max(300).optional().nullable(),
  severity:    z.enum(SEVERITIES).optional(),
  status:      z.enum(STATUSES).optional(),
  notes:       z.string().optional().nullable(),
  version:     z.number().int().min(1),
});

const ListQ = z.object({
  framing_inspection_id: z.string().uuid(),
  cursor:                z.string().uuid().optional(),
  limit:                 z.coerce.number().int().min(1).max(100).default(50),
});

export async function framingCorrectionItemRoutes(app: FastifyInstance): Promise<void> {

  app.post('/framing-correction-items', { preHandler: [authenticate, requireRole(...W)] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const body = CreateSchema.safeParse(req.body);
      if (!body.success) return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: 'Validation failed', fields: body.error.errors.map(e => ({ field: e.path.join('.'), message: e.message })) } });
      const { tenant_id, user_id, email, role } = req.jwt;
      const d = body.data;
      // resolved on creation → stamp resolved_at/by
      const resolvedAt = d.status === 'resolved' ? new Date().toISOString() : null;
      const resolvedBy = d.status === 'resolved' ? user_id : null;

      const item = await withTenantContext(tenant_id, async (client) => {
        const { rows: parent } = await client.query(`SELECT id FROM framing_inspections WHERE id=$1 AND deleted_at IS NULL`, [d.framing_inspection_id]);
        if (parent.length === 0) return null;
        const { rows } = await client.query(
          `INSERT INTO framing_correction_items
             (tenant_id, framing_inspection_id, description, location, severity, status, resolved_at, resolved_by, notes, created_by)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
          [tenant_id, d.framing_inspection_id, d.description, d.location ?? null, d.severity, d.status, resolvedAt, resolvedBy, d.notes ?? null, user_id]
        );
        await writeAuditEntry(client, { tenantId: tenant_id, category: 'data', action: 'framing_correction_item.created', actorId: user_id, actorEmail: email, actorRole: role, resourceType: 'framing_correction_item', resourceId: rows[0].id, payload: { framing_inspection_id: d.framing_inspection_id, severity: d.severity, status: d.status }, ipAddress: req.ip });
        return rows[0];
      });

      if (!item) return reply.status(422).send({ error: { code: 'INVALID_FRAMING_INSPECTION', message: 'Framing inspection not found or does not belong to this tenant' } });
      return reply.status(201).send({ framing_correction_item: item });
    }
  );

  app.get('/framing-correction-items', { preHandler: [authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const q = ListQ.safeParse(req.query);
      if (!q.success) return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: 'framing_inspection_id required' } });
      const { tenant_id } = req.jwt;
      const { framing_inspection_id, cursor, limit } = q.data;

      const items = await withTenantContext(tenant_id, async (client) => {
        const params: unknown[] = [limit + 1, framing_inspection_id];
        const conds = ['deleted_at IS NULL', 'framing_inspection_id=$2'];
        let idx = 3;
        if (cursor) { conds.push(`(created_at,id)<(SELECT created_at,id FROM framing_correction_items WHERE id=$${idx++})`); params.push(cursor); }
        const { rows } = await client.query(
          `SELECT * FROM framing_correction_items WHERE ${conds.join(' AND ')} ORDER BY created_at DESC LIMIT $1`, params
        );
        return rows;
      });

      const hasMore = items.length > limit;
      const data = hasMore ? items.slice(0, limit) : items;
      return reply.status(200).send({ framing_correction_items: data, pagination: { has_more: hasMore, next_cursor: hasMore ? data[data.length - 1].id : null } });
    }
  );

  app.patch('/framing-correction-items/:id', { preHandler: [authenticate, requireRole(...W)] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as { id: string };
      const body = UpdateSchema.safeParse(req.body);
      if (!body.success) return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: 'Validation failed', fields: body.error.errors.map(e => ({ field: e.path.join('.'), message: e.message })) } });
      const { tenant_id, user_id, email, role } = req.jwt;
      const { version, ...fields } = body.data;

      const result = await withTenantContext(tenant_id, async (client) => {
        const sets = ['version=version+1', 'updated_at=NOW()'];
        const params: unknown[] = [];
        let idx = 1;
        for (const [k, v] of Object.entries(fields)) { if (v !== undefined) { params.push(v); sets.push(`${k}=$${idx++}`); } }
        // Auto-stamp resolution when transitioning to 'resolved' (only if not already set).
        if (fields.status === 'resolved') {
          sets.push(`resolved_at=COALESCE(resolved_at, NOW())`);
          params.push(user_id); sets.push(`resolved_by=COALESCE(resolved_by, $${idx++})`);
        } else if (fields.status !== undefined) {
          // Un-resolve (status → open / in_progress): clear stale resolution stamps so a
          // re-opened item never carries a resolved_at/resolved_by from a prior resolution.
          sets.push(`resolved_at=NULL`, `resolved_by=NULL`);
        }
        params.push(id, version);
        const { rows } = await client.query(`UPDATE framing_correction_items SET ${sets.join(',')} WHERE id=$${idx} AND version=$${idx + 1} AND deleted_at IS NULL RETURNING *`, params);
        if (rows.length > 0) {
          await writeAuditEntry(client, { tenantId: tenant_id, category: 'data', action: 'framing_correction_item.updated', actorId: user_id, actorEmail: email, actorRole: role, resourceType: 'framing_correction_item', resourceId: id, payload: body.data, ipAddress: req.ip });
          return { row: rows[0], status: 'ok' as const };
        }
        const { rows: c } = await client.query(`SELECT id FROM framing_correction_items WHERE id=$1 AND deleted_at IS NULL`, [id]);
        return { row: null, status: c.length === 0 ? 'not_found' as const : 'conflict' as const };
      });

      if (result.status === 'not_found') return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Correction item not found' } });
      if (result.status === 'conflict')  return reply.status(409).send({ error: { code: 'VERSION_CONFLICT', message: 'Version conflict' } });
      return reply.status(200).send({ framing_correction_item: result.row });
    }
  );

  app.delete('/framing-correction-items/:id', { preHandler: [authenticate, requireRole(...W)] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as { id: string };
      const { tenant_id, user_id, email, role } = req.jwt;
      const deleted = await withTenantContext(tenant_id, async (client) => {
        const { rows } = await client.query(`UPDATE framing_correction_items SET deleted_at=NOW() WHERE id=$1 AND deleted_at IS NULL RETURNING id`, [id]);
        if (rows.length > 0) await writeAuditEntry(client, { tenantId: tenant_id, category: 'data', action: 'framing_correction_item.deleted', actorId: user_id, actorEmail: email, actorRole: role, resourceType: 'framing_correction_item', resourceId: id, payload: {}, ipAddress: req.ip });
        return rows[0] ?? null;
      });
      if (!deleted) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Correction item not found' } });
      return reply.status(204).send();
    }
  );
}
