// routes/v1/roofing-qa-records.ts — Roofing installation / warranty QA records.
// Child of roofing_systems. Deck, dry-in, flashing, seam-weld, fastener-pull, water test, etc.
// Mirrors the concrete-test-records child-CRUD pattern. T-12 (versioning), T-42.

import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { withTenantContext } from '../../lib/tenant-context.js';
import { writeAuditEntry } from '../../lib/audit-log.js';
import { authenticate, requireRole } from '../../plugins/auth-plugin.js';

const QA_TYPES = ['deck', 'underlayment_dry_in', 'flashing', 'seam_weld', 'fastener_pull', 'water_test', 'manufacturer_warranty', 'final', 'other'] as const;
const RESULTS = ['pass', 'fail', 'pending'] as const;
const W = ['OWNER', 'PROJECT_MANAGER', 'FOREMAN'] as const;

const CreateSchema = z.object({
  roofing_system_id: z.string().uuid(),
  qa_type:           z.enum(QA_TYPES),
  inspection_date:   z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  result:            z.enum(RESULTS).default('pending'),
  measured_value:    z.number().optional(),
  unit:              z.string().max(10).optional(),
  inspector_name:    z.string().max(200).optional(),
  notes:             z.string().optional(),
});

const UpdateSchema = z.object({
  qa_type:         z.enum(QA_TYPES).optional(),
  inspection_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  result:          z.enum(RESULTS).optional(),
  measured_value:  z.number().optional().nullable(),
  unit:            z.string().max(10).optional().nullable(),
  inspector_name:  z.string().max(200).optional().nullable(),
  notes:           z.string().optional().nullable(),
  version:         z.number().int().min(1),
});

const ListQ = z.object({
  roofing_system_id: z.string().uuid(),
  cursor:            z.string().uuid().optional(),
  limit:             z.coerce.number().int().min(1).max(100).default(50),
});

export async function roofingQaRecordRoutes(app: FastifyInstance): Promise<void> {

  app.post('/roofing-qa-records', { preHandler: [authenticate, requireRole(...W)] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const body = CreateSchema.safeParse(req.body);
      if (!body.success) return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: 'Validation failed', fields: body.error.errors.map(e => ({ field: e.path.join('.'), message: e.message })) } });
      const { tenant_id, user_id, email, role } = req.jwt;
      const d = body.data;

      const item = await withTenantContext(tenant_id, async (client) => {
        const { rows: parent } = await client.query(`SELECT id FROM roofing_systems WHERE id=$1 AND deleted_at IS NULL`, [d.roofing_system_id]);
        if (parent.length === 0) return null;
        const { rows } = await client.query(
          `INSERT INTO roofing_qa_records
             (tenant_id, roofing_system_id, qa_type, inspection_date, result, measured_value, unit, inspector_name, notes, created_by)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
          [tenant_id, d.roofing_system_id, d.qa_type, d.inspection_date ?? null, d.result, d.measured_value ?? null, d.unit ?? null, d.inspector_name ?? null, d.notes ?? null, user_id]
        );
        await writeAuditEntry(client, { tenantId: tenant_id, category: 'data', action: 'roofing_qa_record.created', actorId: user_id, actorEmail: email, actorRole: role, resourceType: 'roofing_qa_record', resourceId: rows[0].id, payload: { roofing_system_id: d.roofing_system_id, qa_type: d.qa_type, result: d.result }, ipAddress: req.ip });
        return rows[0];
      });

      if (!item) return reply.status(422).send({ error: { code: 'INVALID_ROOFING_SYSTEM', message: 'Roofing system not found or does not belong to this tenant' } });
      return reply.status(201).send({ roofing_qa_record: item });
    }
  );

  app.get('/roofing-qa-records', { preHandler: [authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const q = ListQ.safeParse(req.query);
      if (!q.success) return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: 'roofing_system_id required' } });
      const { tenant_id } = req.jwt;
      const { roofing_system_id, cursor, limit } = q.data;

      const items = await withTenantContext(tenant_id, async (client) => {
        const params: unknown[] = [limit + 1, roofing_system_id];
        const conds = ['deleted_at IS NULL', 'roofing_system_id=$2'];
        let idx = 3;
        if (cursor) { conds.push(`(created_at,id)<(SELECT created_at,id FROM roofing_qa_records WHERE id=$${idx++})`); params.push(cursor); }
        const { rows } = await client.query(
          `SELECT * FROM roofing_qa_records WHERE ${conds.join(' AND ')} ORDER BY COALESCE(inspection_date,'9999-12-31') DESC, created_at DESC LIMIT $1`, params
        );
        return rows;
      });

      const hasMore = items.length > limit;
      const data = hasMore ? items.slice(0, limit) : items;
      return reply.status(200).send({ roofing_qa_records: data, pagination: { has_more: hasMore, next_cursor: hasMore ? data[data.length - 1].id : null } });
    }
  );

  app.patch('/roofing-qa-records/:id', { preHandler: [authenticate, requireRole(...W)] },
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
        params.push(id, version);
        const { rows } = await client.query(`UPDATE roofing_qa_records SET ${sets.join(',')} WHERE id=$${idx} AND version=$${idx + 1} AND deleted_at IS NULL RETURNING *`, params);
        if (rows.length > 0) {
          await writeAuditEntry(client, { tenantId: tenant_id, category: 'data', action: 'roofing_qa_record.updated', actorId: user_id, actorEmail: email, actorRole: role, resourceType: 'roofing_qa_record', resourceId: id, payload: body.data, ipAddress: req.ip });
          return { row: rows[0], status: 'ok' as const };
        }
        const { rows: c } = await client.query(`SELECT id FROM roofing_qa_records WHERE id=$1 AND deleted_at IS NULL`, [id]);
        return { row: null, status: c.length === 0 ? 'not_found' as const : 'conflict' as const };
      });

      if (result.status === 'not_found') return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'QA record not found' } });
      if (result.status === 'conflict')  return reply.status(409).send({ error: { code: 'VERSION_CONFLICT', message: 'Version conflict' } });
      return reply.status(200).send({ roofing_qa_record: result.row });
    }
  );

  app.delete('/roofing-qa-records/:id', { preHandler: [authenticate, requireRole(...W)] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as { id: string };
      const { tenant_id, user_id, email, role } = req.jwt;
      const deleted = await withTenantContext(tenant_id, async (client) => {
        const { rows } = await client.query(`UPDATE roofing_qa_records SET deleted_at=NOW() WHERE id=$1 AND deleted_at IS NULL RETURNING id`, [id]);
        if (rows.length > 0) await writeAuditEntry(client, { tenantId: tenant_id, category: 'data', action: 'roofing_qa_record.deleted', actorId: user_id, actorEmail: email, actorRole: role, resourceType: 'roofing_qa_record', resourceId: id, payload: {}, ipAddress: req.ip });
        return rows[0] ?? null;
      });
      if (!deleted) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'QA record not found' } });
      return reply.status(204).send();
    }
  );
}
