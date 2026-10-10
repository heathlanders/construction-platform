// routes/v1/concrete-pours.ts — Trade module: Concrete
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { withTenantContext } from '../../lib/tenant-context.js';
import { writeAuditEntry } from '../../lib/audit-log.js';
import { authenticate, requireRole } from '../../plugins/auth-plugin.js';

const POUR_STATUSES = ['planned','in_progress','complete','failed'] as const;
const POUR_TYPES = ['slab','footing','wall','column','driveway','other'] as const;
const W = ['OWNER','PROJECT_MANAGER','FOREMAN'] as const;

const CreateSchema = z.object({
  project_id: z.string().uuid(),
  pour_type: z.enum(POUR_TYPES),
  volume_cy: z.number().positive().optional(),
  mix_design: z.string().max(500).optional(),
  slump_inches: z.number().min(0).max(12).optional(),
  pour_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  status: z.enum(POUR_STATUSES).default('planned'),
  notes: z.string().optional(),
});
const UpdateSchema = z.object({
  pour_type: z.enum(POUR_TYPES).optional(),
  volume_cy: z.number().positive().optional().nullable(),
  mix_design: z.string().max(500).optional().nullable(),
  slump_inches: z.number().min(0).max(12).optional().nullable(),
  pour_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  status: z.enum(POUR_STATUSES).optional(),
  notes: z.string().optional().nullable(),
  version: z.number().int().min(1),
});
const ListQ = z.object({
  project_id: z.string().uuid(),
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export async function concretePourRoutes(app: FastifyInstance): Promise<void> {
  app.post('/concrete-pours', { preHandler: [authenticate, requireRole(...W)] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const body = CreateSchema.safeParse(req.body);
      if (!body.success) return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: 'Validation failed', fields: body.error.errors.map(e => ({ field: e.path.join('.'), message: e.message })) } });
      const { tenant_id, user_id, email, role } = req.jwt;
      const { project_id, pour_type, volume_cy, mix_design, slump_inches, pour_date, status, notes } = body.data;
      const item = await withTenantContext(tenant_id, async (client) => {
        const { rows } = await client.query(
          `INSERT INTO concrete_pours (tenant_id,project_id,pour_type,volume_cy,mix_design,slump_inches,pour_date,status,notes,created_by)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
          [tenant_id, project_id, pour_type, volume_cy ?? null, mix_design ?? null, slump_inches ?? null, pour_date ?? null, status, notes ?? null, user_id]
        );
        await writeAuditEntry(client, { tenantId: tenant_id, category: 'data', action: 'concrete_pour.created', actorId: user_id, actorEmail: email, actorRole: role, resourceType: 'concrete_pour', resourceId: rows[0].id, payload: { project_id, pour_type }, ipAddress: req.ip });
        return rows[0];
      });
      return reply.status(201).send({ concrete_pour: item });
    }
  );

  app.get('/concrete-pours', { preHandler: [authenticate] },
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
          `SELECT * FROM concrete_pours WHERE ${conds.join(' AND ')} ORDER BY COALESCE(pour_date,'9999-12-31') DESC, created_at DESC LIMIT $1`,
          params
        );
        return rows;
      });
      const hasMore = items.length > limit;
      const data = hasMore ? items.slice(0, limit) : items;
      return reply.status(200).send({ concrete_pours: data, pagination: { has_more: hasMore, next_cursor: hasMore ? data[data.length - 1].id : null } });
    }
  );

  app.get('/concrete-pours/:id', { preHandler: [authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as { id: string };
      const { tenant_id } = req.jwt;
      const item = await withTenantContext(tenant_id, async (client) => {
        const { rows } = await client.query(`SELECT * FROM concrete_pours WHERE id=$1 AND deleted_at IS NULL`, [id]);
        return rows[0] ?? null;
      });
      if (!item) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Concrete pour not found' } });
      return reply.status(200).send({ concrete_pour: item });
    }
  );

  app.patch('/concrete-pours/:id', { preHandler: [authenticate, requireRole(...W)] },
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
        const fieldMap: Record<string, string> = { pour_type: 'pour_type', volume_cy: 'volume_cy', mix_design: 'mix_design', slump_inches: 'slump_inches', pour_date: 'pour_date', status: 'status', notes: 'notes' };
        for (const [key, col] of Object.entries(fieldMap)) {
          if (key in fields && (fields as any)[key] !== undefined) {
            params.push((fields as any)[key]);
            sets.push(`${col}=$${idx++}`);
          }
        }
        params.push(id, version);
        const { rows } = await client.query(
          `UPDATE concrete_pours SET ${sets.join(',')} WHERE id=$${idx++} AND version=$${idx++} AND deleted_at IS NULL RETURNING *`,
          params
        );
        if (rows.length === 0) return null;
        await writeAuditEntry(client, { tenantId: tenant_id, category: 'data', action: 'concrete_pour.updated', actorId: user_id, actorEmail: email, actorRole: role, resourceType: 'concrete_pour', resourceId: id, payload: fields, ipAddress: req.ip });
        return rows[0];
      });
      if (!result) return reply.status(409).send({ error: { code: 'CONFLICT', message: 'Concrete pour not found or version conflict' } });
      return reply.status(200).send({ concrete_pour: result });
    }
  );

  app.delete('/concrete-pours/:id', { preHandler: [authenticate, requireRole(...W)] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as { id: string };
      const { tenant_id, user_id, email, role } = req.jwt;
      await withTenantContext(tenant_id, async (client) => {
        await client.query(`UPDATE concrete_pours SET deleted_at=NOW() WHERE id=$1 AND deleted_at IS NULL`, [id]);
        await writeAuditEntry(client, { tenantId: tenant_id, category: 'data', action: 'concrete_pour.deleted', actorId: user_id, actorEmail: email, actorRole: role, resourceType: 'concrete_pour', resourceId: id, payload: {}, ipAddress: req.ip });
      });
      return reply.status(204).send();
    }
  );
}
