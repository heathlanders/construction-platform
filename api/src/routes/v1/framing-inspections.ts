// routes/v1/framing-inspections.ts — Trade module: Framing
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { withTenantContext } from '../../lib/tenant-context.js';
import { writeAuditEntry } from '../../lib/audit-log.js';
import { authenticate, requireRole } from '../../plugins/auth-plugin.js';

const SECTIONS = ['exterior_walls','roof_trusses','floor_system','sheathing','interior_walls','other'] as const;
const STATUSES = ['pending','passed','failed','requires_correction'] as const;
const W = ['OWNER','PROJECT_MANAGER','FOREMAN'] as const;

const CreateSchema = z.object({
  project_id: z.string().uuid(),
  section: z.enum(SECTIONS),
  inspection_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  inspector_name: z.string().max(200).optional(),
  status: z.enum(STATUSES).default('pending'),
  correction_note: z.string().optional(),
  notes: z.string().optional(),
});
const UpdateSchema = z.object({
  section: z.enum(SECTIONS).optional(),
  inspection_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  inspector_name: z.string().max(200).optional().nullable(),
  status: z.enum(STATUSES).optional(),
  correction_note: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  version: z.number().int().min(1),
});
const ListQ = z.object({
  project_id: z.string().uuid(),
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export async function framingInspectionRoutes(app: FastifyInstance): Promise<void> {
  app.post('/framing-inspections', { preHandler: [authenticate, requireRole(...W)] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const body = CreateSchema.safeParse(req.body);
      if (!body.success) return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: 'Validation failed', fields: body.error.errors.map(e => ({ field: e.path.join('.'), message: e.message })) } });
      const { tenant_id, user_id, email, role } = req.jwt;
      const { project_id, section, inspection_date, inspector_name, status, correction_note, notes } = body.data;
      const item = await withTenantContext(tenant_id, async (client) => {
        const { rows } = await client.query(
          `INSERT INTO framing_inspections (tenant_id,project_id,section,inspection_date,inspector_name,status,correction_note,notes,created_by)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
          [tenant_id, project_id, section, inspection_date ?? null, inspector_name ?? null, status, correction_note ?? null, notes ?? null, user_id]
        );
        await writeAuditEntry(client, { tenantId: tenant_id, category: 'data', action: 'framing_inspection.created', actorId: user_id, actorEmail: email, actorRole: role, resourceType: 'framing_inspection', resourceId: rows[0].id, payload: { project_id, section }, ipAddress: req.ip });
        return rows[0];
      });
      return reply.status(201).send({ framing_inspection: item });
    }
  );

  app.get('/framing-inspections', { preHandler: [authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const q = ListQ.safeParse(req.query);
      if (!q.success) return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: 'project_id required' } });
      const { tenant_id } = req.jwt;
      const { project_id, cursor, limit } = q.data;
      const items = await withTenantContext(tenant_id, async (client) => {
        const params: unknown[] = [limit + 1, project_id];
        const conds = ['deleted_at IS NULL', 'project_id=$2'];
        let idx = 3;
        if (cursor) { conds.push(`id > $${idx++}`); params.push(cursor); }
        const { rows } = await client.query(
          `SELECT * FROM framing_inspections WHERE ${conds.join(' AND ')} ORDER BY COALESCE(inspection_date,'9999-12-31') DESC, created_at DESC LIMIT $1`,
          params
        );
        return rows;
      });
      const hasMore = items.length > limit;
      const data = hasMore ? items.slice(0, limit) : items;
      return reply.status(200).send({ framing_inspections: data, pagination: { has_more: hasMore, next_cursor: hasMore ? data[data.length - 1].id : null } });
    }
  );

  app.get('/framing-inspections/:id', { preHandler: [authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as { id: string };
      const { tenant_id } = req.jwt;
      const item = await withTenantContext(tenant_id, async (client) => {
        const { rows } = await client.query(`SELECT * FROM framing_inspections WHERE id=$1 AND deleted_at IS NULL`, [id]);
        return rows[0] ?? null;
      });
      if (!item) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Framing inspection not found' } });
      return reply.status(200).send({ framing_inspection: item });
    }
  );

  app.patch('/framing-inspections/:id', { preHandler: [authenticate, requireRole(...W)] },
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
        const fieldMap = { section: 'section', inspection_date: 'inspection_date', inspector_name: 'inspector_name', status: 'status', correction_note: 'correction_note', notes: 'notes' };
        for (const [key, col] of Object.entries(fieldMap)) {
          if (key in fields && (fields as any)[key] !== undefined) {
            params.push((fields as any)[key]);
            sets.push(`${col}=$${idx++}`);
          }
        }
        params.push(id, version);
        const { rows } = await client.query(
          `UPDATE framing_inspections SET ${sets.join(',')} WHERE id=$${idx++} AND version=$${idx++} AND deleted_at IS NULL RETURNING *`,
          params
        );
        if (rows.length === 0) return null;
        await writeAuditEntry(client, { tenantId: tenant_id, category: 'data', action: 'framing_inspection.updated', actorId: user_id, actorEmail: email, actorRole: role, resourceType: 'framing_inspection', resourceId: id, payload: fields, ipAddress: req.ip });
        return rows[0];
      });
      if (!result) return reply.status(409).send({ error: { code: 'CONFLICT', message: 'Framing inspection not found or version conflict' } });
      return reply.status(200).send({ framing_inspection: result });
    }
  );

  app.delete('/framing-inspections/:id', { preHandler: [authenticate, requireRole(...W)] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as { id: string };
      const { tenant_id, user_id, email, role } = req.jwt;
      await withTenantContext(tenant_id, async (client) => {
        await client.query(`UPDATE framing_inspections SET deleted_at=NOW() WHERE id=$1 AND deleted_at IS NULL`, [id]);
        await writeAuditEntry(client, { tenantId: tenant_id, category: 'data', action: 'framing_inspection.deleted', actorId: user_id, actorEmail: email, actorRole: role, resourceType: 'framing_inspection', resourceId: id, payload: {}, ipAddress: req.ip });
      });
      return reply.status(204).send();
    }
  );
}
