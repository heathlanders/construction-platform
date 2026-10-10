// routes/v1/roofing-systems.ts — Trade module: Roofing
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { withTenantContext } from '../../lib/tenant-context.js';
import { writeAuditEntry } from '../../lib/audit-log.js';
import { authenticate, requireRole } from '../../plugins/auth-plugin.js';

const ROOF_TYPES = ['asphalt_shingle','metal','flat_tpo','flat_epdm','tile','cedar_shake','other'] as const;
const STATUSES = ['planned','tear_off','decking','underlayment','installed','inspected','complete'] as const;
const W = ['OWNER','PROJECT_MANAGER','FOREMAN'] as const;

const CreateSchema = z.object({
  project_id: z.string().uuid(),
  roof_type: z.enum(ROOF_TYPES),
  total_squares: z.number().min(0).optional(),
  underlayment_type: z.string().max(200).optional(),
  manufacturer: z.string().max(200).optional(),
  product_line: z.string().max(200).optional(),
  color: z.string().max(100).optional(),
  warranty_years: z.number().int().min(0).max(100).optional(),
  install_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  status: z.enum(STATUSES).default('planned'),
  permit_number: z.string().max(100).optional(),
  notes: z.string().optional(),
});
const UpdateSchema = z.object({
  roof_type: z.enum(ROOF_TYPES).optional(),
  total_squares: z.number().min(0).optional().nullable(),
  underlayment_type: z.string().max(200).optional().nullable(),
  manufacturer: z.string().max(200).optional().nullable(),
  product_line: z.string().max(200).optional().nullable(),
  color: z.string().max(100).optional().nullable(),
  warranty_years: z.number().int().min(0).max(100).optional().nullable(),
  install_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  status: z.enum(STATUSES).optional(),
  permit_number: z.string().max(100).optional().nullable(),
  notes: z.string().optional().nullable(),
  version: z.number().int().min(1),
});
const ListQ = z.object({
  project_id: z.string().uuid(),
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export async function roofingSystemRoutes(app: FastifyInstance): Promise<void> {
  app.post('/roofing-systems', { preHandler: [authenticate, requireRole(...W)] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const body = CreateSchema.safeParse(req.body);
      if (!body.success) return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: 'Validation failed', fields: body.error.errors.map(e => ({ field: e.path.join('.'), message: e.message })) } });
      const { tenant_id, user_id, email, role } = req.jwt;
      const { project_id, roof_type, total_squares, underlayment_type, manufacturer, product_line, color, warranty_years, install_date, status, permit_number, notes } = body.data;
      const item = await withTenantContext(tenant_id, async (client) => {
        const { rows } = await client.query(
          `INSERT INTO roofing_systems (tenant_id,project_id,roof_type,total_squares,underlayment_type,manufacturer,product_line,color,warranty_years,install_date,status,permit_number,notes,created_by)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
          [tenant_id, project_id, roof_type, total_squares ?? null, underlayment_type ?? null, manufacturer ?? null, product_line ?? null, color ?? null, warranty_years ?? null, install_date ?? null, status, permit_number ?? null, notes ?? null, user_id]
        );
        await writeAuditEntry(client, { tenantId: tenant_id, category: 'data', action: 'roofing_system.created', actorId: user_id, actorEmail: email, actorRole: role, resourceType: 'roofing_system', resourceId: rows[0].id, payload: { project_id, roof_type }, ipAddress: req.ip });
        return rows[0];
      });
      return reply.status(201).send({ roofing_system: item });
    }
  );

  app.get('/roofing-systems', { preHandler: [authenticate] },
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
          `SELECT * FROM roofing_systems WHERE ${conds.join(' AND ')} ORDER BY COALESCE(install_date,'9999-12-31') DESC, created_at DESC LIMIT $1`,
          params
        );
        return rows;
      });
      const hasMore = items.length > limit;
      const data = hasMore ? items.slice(0, limit) : items;
      return reply.status(200).send({ roofing_systems: data, pagination: { has_more: hasMore, next_cursor: hasMore ? data[data.length - 1].id : null } });
    }
  );

  app.get('/roofing-systems/:id', { preHandler: [authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as { id: string };
      const { tenant_id } = req.jwt;
      const item = await withTenantContext(tenant_id, async (client) => {
        const { rows } = await client.query(`SELECT * FROM roofing_systems WHERE id=$1 AND deleted_at IS NULL`, [id]);
        return rows[0] ?? null;
      });
      if (!item) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Roofing system not found' } });
      return reply.status(200).send({ roofing_system: item });
    }
  );

  app.patch('/roofing-systems/:id', { preHandler: [authenticate, requireRole(...W)] },
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
        const fieldMap = { roof_type: 'roof_type', total_squares: 'total_squares', underlayment_type: 'underlayment_type', manufacturer: 'manufacturer', product_line: 'product_line', color: 'color', warranty_years: 'warranty_years', install_date: 'install_date', status: 'status', permit_number: 'permit_number', notes: 'notes' };
        for (const [key, col] of Object.entries(fieldMap)) {
          if (key in fields && (fields as any)[key] !== undefined) {
            params.push((fields as any)[key]);
            sets.push(`${col}=$${idx++}`);
          }
        }
        params.push(id, version);
        const { rows } = await client.query(
          `UPDATE roofing_systems SET ${sets.join(',')} WHERE id=$${idx++} AND version=$${idx++} AND deleted_at IS NULL RETURNING *`,
          params
        );
        if (rows.length === 0) return null;
        await writeAuditEntry(client, { tenantId: tenant_id, category: 'data', action: 'roofing_system.updated', actorId: user_id, actorEmail: email, actorRole: role, resourceType: 'roofing_system', resourceId: id, payload: fields, ipAddress: req.ip });
        return rows[0];
      });
      if (!result) return reply.status(409).send({ error: { code: 'CONFLICT', message: 'Roofing system not found or version conflict' } });
      return reply.status(200).send({ roofing_system: result });
    }
  );

  app.delete('/roofing-systems/:id', { preHandler: [authenticate, requireRole(...W)] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as { id: string };
      const { tenant_id, user_id, email, role } = req.jwt;
      await withTenantContext(tenant_id, async (client) => {
        await client.query(`UPDATE roofing_systems SET deleted_at=NOW() WHERE id=$1 AND deleted_at IS NULL`, [id]);
        await writeAuditEntry(client, { tenantId: tenant_id, category: 'data', action: 'roofing_system.deleted', actorId: user_id, actorEmail: email, actorRole: role, resourceType: 'roofing_system', resourceId: id, payload: {}, ipAddress: req.ip });
      });
      return reply.status(204).send();
    }
  );
}
