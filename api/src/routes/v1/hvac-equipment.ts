// routes/v1/hvac-equipment.ts — Trade module: HVAC
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { withTenantContext } from '../../lib/tenant-context.js';
import { writeAuditEntry } from '../../lib/audit-log.js';
import { authenticate, requireRole } from '../../plugins/auth-plugin.js';

const EQUIPMENT_TYPES = ['furnace','ac_unit','heat_pump','air_handler','mini_split','duct_system','ventilation','other'] as const;
const STATUSES = ['planned','ordered','installed','commissioned','complete'] as const;
const W = ['OWNER','PROJECT_MANAGER','FOREMAN'] as const;

const CreateSchema = z.object({
  project_id: z.string().uuid(),
  equipment_type: z.enum(EQUIPMENT_TYPES),
  manufacturer: z.string().max(200).optional(),
  model: z.string().max(200).optional(),
  serial_number: z.string().max(200).optional(),
  tonnage: z.number().min(0).max(100).optional(),
  seer_rating: z.number().min(0).max(40).optional(),
  location: z.string().max(500).optional(),
  permit_number: z.string().max(100).optional(),
  install_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  status: z.enum(STATUSES).default('planned'),
  notes: z.string().optional(),
});
const UpdateSchema = z.object({
  equipment_type: z.enum(EQUIPMENT_TYPES).optional(),
  manufacturer: z.string().max(200).optional().nullable(),
  model: z.string().max(200).optional().nullable(),
  serial_number: z.string().max(200).optional().nullable(),
  tonnage: z.number().min(0).max(100).optional().nullable(),
  seer_rating: z.number().min(0).max(40).optional().nullable(),
  location: z.string().max(500).optional().nullable(),
  permit_number: z.string().max(100).optional().nullable(),
  install_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  status: z.enum(STATUSES).optional(),
  notes: z.string().optional().nullable(),
  version: z.number().int().min(1),
});
const ListQ = z.object({
  project_id: z.string().uuid(),
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export async function hvacEquipmentRoutes(app: FastifyInstance): Promise<void> {
  app.post('/hvac-equipment', { preHandler: [authenticate, requireRole(...W)] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const body = CreateSchema.safeParse(req.body);
      if (!body.success) return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: 'Validation failed', fields: body.error.errors.map(e => ({ field: e.path.join('.'), message: e.message })) } });
      const { tenant_id, user_id, email, role } = req.jwt;
      const { project_id, equipment_type, manufacturer, model, serial_number, tonnage, seer_rating, location, permit_number, install_date, status, notes } = body.data;
      const item = await withTenantContext(tenant_id, async (client) => {
        const { rows } = await client.query(
          `INSERT INTO hvac_equipment (tenant_id,project_id,equipment_type,manufacturer,model,serial_number,tonnage,seer_rating,location,permit_number,install_date,status,notes,created_by)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
          [tenant_id, project_id, equipment_type, manufacturer ?? null, model ?? null, serial_number ?? null, tonnage ?? null, seer_rating ?? null, location ?? null, permit_number ?? null, install_date ?? null, status, notes ?? null, user_id]
        );
        await writeAuditEntry(client, { tenantId: tenant_id, category: 'data', action: 'hvac_equipment.created', actorId: user_id, actorEmail: email, actorRole: role, resourceType: 'hvac_equipment', resourceId: rows[0].id, payload: { project_id, equipment_type }, ipAddress: req.ip });
        return rows[0];
      });
      return reply.status(201).send({ hvac_equipment: item });
    }
  );

  app.get('/hvac-equipment', { preHandler: [authenticate] },
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
          `SELECT * FROM hvac_equipment WHERE ${conds.join(' AND ')} ORDER BY equipment_type ASC, created_at DESC LIMIT $1`,
          params
        );
        return rows;
      });
      const hasMore = items.length > limit;
      const data = hasMore ? items.slice(0, limit) : items;
      return reply.status(200).send({ hvac_equipment: data, pagination: { has_more: hasMore, next_cursor: hasMore ? data[data.length - 1].id : null } });
    }
  );

  app.get('/hvac-equipment/:id', { preHandler: [authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as { id: string };
      const { tenant_id } = req.jwt;
      const item = await withTenantContext(tenant_id, async (client) => {
        const { rows } = await client.query(`SELECT * FROM hvac_equipment WHERE id=$1 AND deleted_at IS NULL`, [id]);
        return rows[0] ?? null;
      });
      if (!item) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'HVAC equipment not found' } });
      return reply.status(200).send({ hvac_equipment: item });
    }
  );

  app.patch('/hvac-equipment/:id', { preHandler: [authenticate, requireRole(...W)] },
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
        const fieldMap = { equipment_type: 'equipment_type', manufacturer: 'manufacturer', model: 'model', serial_number: 'serial_number', tonnage: 'tonnage', seer_rating: 'seer_rating', location: 'location', permit_number: 'permit_number', install_date: 'install_date', status: 'status', notes: 'notes' };
        for (const [key, col] of Object.entries(fieldMap)) {
          if (key in fields && (fields as any)[key] !== undefined) {
            params.push((fields as any)[key]);
            sets.push(`${col}=$${idx++}`);
          }
        }
        params.push(id, version);
        const { rows } = await client.query(
          `UPDATE hvac_equipment SET ${sets.join(',')} WHERE id=$${idx++} AND version=$${idx++} AND deleted_at IS NULL RETURNING *`,
          params
        );
        if (rows.length === 0) return null;
        await writeAuditEntry(client, { tenantId: tenant_id, category: 'data', action: 'hvac_equipment.updated', actorId: user_id, actorEmail: email, actorRole: role, resourceType: 'hvac_equipment', resourceId: id, payload: fields, ipAddress: req.ip });
        return rows[0];
      });
      if (!result) return reply.status(409).send({ error: { code: 'CONFLICT', message: 'HVAC equipment not found or version conflict' } });
      return reply.status(200).send({ hvac_equipment: result });
    }
  );

  app.delete('/hvac-equipment/:id', { preHandler: [authenticate, requireRole(...W)] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as { id: string };
      const { tenant_id, user_id, email, role } = req.jwt;
      await withTenantContext(tenant_id, async (client) => {
        await client.query(`UPDATE hvac_equipment SET deleted_at=NOW() WHERE id=$1 AND deleted_at IS NULL`, [id]);
        await writeAuditEntry(client, { tenantId: tenant_id, category: 'data', action: 'hvac_equipment.deleted', actorId: user_id, actorEmail: email, actorRole: role, resourceType: 'hvac_equipment', resourceId: id, payload: {}, ipAddress: req.ip });
      });
      return reply.status(204).send();
    }
  );
}
