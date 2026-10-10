// routes/v1/concrete-test-records.ts — Concrete QA test records (child of concrete_pours).
// Cylinder compressive breaks, slump, air content, temperature. ACI 318 / IBC Ch.19.
// Mirrors the electrical-circuits child-CRUD pattern: FK to parent, optimistic locking,
// audit trail, soft delete. Locked decisions: T-12 (versioning), T-42 (withTenantContext).

import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { withTenantContext } from '../../lib/tenant-context.js';
import { writeAuditEntry } from '../../lib/audit-log.js';
import { authenticate, requireRole } from '../../plugins/auth-plugin.js';

const TEST_TYPES = ['cylinder_compressive', 'slump', 'air_content', 'temperature', 'other'] as const;
const RESULTS = ['pass', 'fail', 'pending'] as const;

const W = ['OWNER', 'PROJECT_MANAGER', 'FOREMAN'] as const;

const CreateSchema = z.object({
  pour_id:          z.string().uuid(),
  test_type:        z.enum(TEST_TYPES),
  test_date:        z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  age_days:         z.number().int().min(0).max(365).optional(),
  specified_value:  z.number().min(0).optional(),
  measured_value:   z.number().min(0).optional(),
  unit:             z.string().max(10).optional(),
  result:           z.enum(RESULTS).optional(),
  sample_id:        z.string().max(100).optional(),
  lab_name:         z.string().max(200).optional(),
  notes:            z.string().optional(),
});

const UpdateSchema = z.object({
  test_type:        z.enum(TEST_TYPES).optional(),
  test_date:        z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  age_days:         z.number().int().min(0).max(365).optional().nullable(),
  specified_value:  z.number().min(0).optional().nullable(),
  measured_value:   z.number().min(0).optional().nullable(),
  unit:             z.string().max(10).optional().nullable(),
  result:           z.enum(RESULTS).optional(),
  sample_id:        z.string().max(100).optional().nullable(),
  lab_name:         z.string().max(200).optional().nullable(),
  notes:            z.string().optional().nullable(),
  version:          z.number().int().min(1),
});

const ListQ = z.object({
  pour_id: z.string().uuid(),
  cursor:  z.string().uuid().optional(),
  limit:   z.coerce.number().int().min(1).max(100).default(50),
});

// Cylinder breaks have a clear spec test (measured f'c >= specified f'c). For other test
// types tolerance is context-dependent, so the result must be set explicitly.
function autoResult(testType: string, specified?: number, measured?: number): 'pass' | 'fail' | 'pending' {
  if (testType === 'cylinder_compressive' && typeof specified === 'number' && typeof measured === 'number') {
    return measured >= specified ? 'pass' : 'fail';
  }
  return 'pending';
}

export async function concreteTestRecordRoutes(app: FastifyInstance): Promise<void> {

  // ─── POST /concrete-test-records ──────────────────────────────────────────
  app.post('/concrete-test-records', { preHandler: [authenticate, requireRole(...W)] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const body = CreateSchema.safeParse(req.body);
      if (!body.success) return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: 'Validation failed', fields: body.error.errors.map(e => ({ field: e.path.join('.'), message: e.message })) } });

      const { tenant_id, user_id, email, role } = req.jwt;
      const d = body.data;
      const result = d.result ?? autoResult(d.test_type, d.specified_value, d.measured_value);

      try {
        const item = await withTenantContext(tenant_id, async (client) => {
          // Validate parent pour belongs to tenant (RLS already scopes; explicit check → clean 422)
          const { rows: pour } = await client.query(
            `SELECT id FROM concrete_pours WHERE id=$1 AND deleted_at IS NULL`, [d.pour_id]
          );
          if (pour.length === 0) return null;

          const { rows } = await client.query(
            `INSERT INTO concrete_test_records
               (tenant_id, pour_id, test_type, test_date, age_days, specified_value,
                measured_value, unit, result, sample_id, lab_name, notes, created_by)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
             RETURNING *`,
            [tenant_id, d.pour_id, d.test_type, d.test_date ?? null, d.age_days ?? null,
             d.specified_value ?? null, d.measured_value ?? null, d.unit ?? null, result,
             d.sample_id ?? null, d.lab_name ?? null, d.notes ?? null, user_id]
          );
          await writeAuditEntry(client, { tenantId: tenant_id, category: 'data', action: 'concrete_test_record.created', actorId: user_id, actorEmail: email, actorRole: role, resourceType: 'concrete_test_record', resourceId: rows[0].id, payload: { pour_id: d.pour_id, test_type: d.test_type, result }, ipAddress: req.ip });
          return rows[0];
        });

        if (!item) return reply.status(422).send({ error: { code: 'INVALID_POUR', message: 'Pour not found or does not belong to this tenant' } });
        return reply.status(201).send({ concrete_test_record: item });
      } catch (err) {
        throw err;
      }
    }
  );

  // ─── GET /concrete-test-records ───────────────────────────────────────────
  app.get('/concrete-test-records', { preHandler: [authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const q = ListQ.safeParse(req.query);
      if (!q.success) return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: 'pour_id required' } });

      const { tenant_id } = req.jwt;
      const { pour_id, cursor, limit } = q.data;

      const items = await withTenantContext(tenant_id, async (client) => {
        const params: unknown[] = [limit + 1, pour_id];
        const conds = ['deleted_at IS NULL', 'pour_id=$2'];
        let idx = 3;
        if (cursor) { conds.push(`(created_at,id)<(SELECT created_at,id FROM concrete_test_records WHERE id=$${idx++})`); params.push(cursor); }
        const { rows } = await client.query(
          `SELECT * FROM concrete_test_records WHERE ${conds.join(' AND ')}
           ORDER BY COALESCE(test_date,'9999-12-31') DESC, age_days ASC NULLS LAST, created_at DESC LIMIT $1`,
          params
        );
        return rows;
      });

      const hasMore = items.length > limit;
      const data = hasMore ? items.slice(0, limit) : items;
      return reply.status(200).send({ concrete_test_records: data, pagination: { has_more: hasMore, next_cursor: hasMore ? data[data.length - 1].id : null } });
    }
  );

  // ─── PATCH /concrete-test-records/:id ─────────────────────────────────────
  app.patch('/concrete-test-records/:id', { preHandler: [authenticate, requireRole(...W)] },
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
        for (const [k, v] of Object.entries(fields)) {
          if (v !== undefined) { params.push(v); sets.push(`${k}=$${idx++}`); }
        }
        params.push(id, version);
        const { rows } = await client.query(
          `UPDATE concrete_test_records SET ${sets.join(',')} WHERE id=$${idx} AND version=$${idx + 1} AND deleted_at IS NULL RETURNING *`,
          params
        );
        if (rows.length > 0) {
          await writeAuditEntry(client, { tenantId: tenant_id, category: 'data', action: 'concrete_test_record.updated', actorId: user_id, actorEmail: email, actorRole: role, resourceType: 'concrete_test_record', resourceId: id, payload: body.data, ipAddress: req.ip });
          return { row: rows[0], status: 'ok' as const };
        }
        const { rows: c } = await client.query(`SELECT id FROM concrete_test_records WHERE id=$1 AND deleted_at IS NULL`, [id]);
        return { row: null, status: c.length === 0 ? 'not_found' as const : 'conflict' as const };
      });

      if (result.status === 'not_found') return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Test record not found' } });
      if (result.status === 'conflict')  return reply.status(409).send({ error: { code: 'VERSION_CONFLICT', message: 'Version conflict' } });
      return reply.status(200).send({ concrete_test_record: result.row });
    }
  );

  // ─── DELETE /concrete-test-records/:id ────────────────────────────────────
  app.delete('/concrete-test-records/:id', { preHandler: [authenticate, requireRole(...W)] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as { id: string };
      const { tenant_id, user_id, email, role } = req.jwt;

      const deleted = await withTenantContext(tenant_id, async (client) => {
        const { rows } = await client.query(
          `UPDATE concrete_test_records SET deleted_at=NOW() WHERE id=$1 AND deleted_at IS NULL RETURNING id`, [id]
        );
        if (rows.length > 0) {
          await writeAuditEntry(client, { tenantId: tenant_id, category: 'data', action: 'concrete_test_record.deleted', actorId: user_id, actorEmail: email, actorRole: role, resourceType: 'concrete_test_record', resourceId: id, payload: {}, ipAddress: req.ip });
        }
        return rows[0] ?? null;
      });

      if (!deleted) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Test record not found' } });
      return reply.status(204).send();
    }
  );
}
