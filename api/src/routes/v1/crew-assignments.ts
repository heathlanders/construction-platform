// routes/v1/crew-assignments.ts — Crew assignment CRUD scoped to a project
// Locked decisions: T-01, T-03, T-12, A-03

import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { withTenantContext } from '../../lib/tenant-context.js';
import { writeAuditEntry } from '../../lib/audit-log.js';
import { authenticate, requireRole } from '../../plugins/auth-plugin.js';

const CreateSchema = z.object({
  project_id: z.string().uuid(),
  user_id: z.string().uuid(),
  schedule_task_id: z.string().uuid().optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  role_on_task: z.string().max(200).optional(),
});

const UpdateSchema = z.object({
  schedule_task_id: z.string().uuid().optional().nullable(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  role_on_task: z.string().max(200).optional().nullable(),
  version: z.number().int().min(1),
});

const ListQuerySchema = z.object({
  project_id: z.string().uuid(),
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const WRITE_ROLES = ['OWNER', 'PROJECT_MANAGER', 'FOREMAN'] as const;

export async function crewAssignmentRoutes(app: FastifyInstance): Promise<void> {

  app.post('/crew-assignments', { preHandler: [authenticate, requireRole(...WRITE_ROLES)] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const body = CreateSchema.safeParse(req.body);
      if (!body.success) return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: 'Validation failed', fields: body.error.errors.map(e => ({ field: e.path.join('.'), message: e.message })) } });
      const { tenant_id, user_id, email, role } = req.jwt;
      const { project_id, user_id: assigned_user_id, schedule_task_id, start_date, end_date, role_on_task } = body.data;

      const assignment = await withTenantContext(tenant_id, async (client) => {
        const { rows } = await client.query(
          `INSERT INTO crew_assignments
             (tenant_id, project_id, user_id, schedule_task_id, start_date, end_date, role_on_task, created_by)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
          [tenant_id, project_id, assigned_user_id, schedule_task_id ?? null, start_date ?? null, end_date ?? null, role_on_task ?? null, user_id]
        );
        await writeAuditEntry(client, { tenantId: tenant_id, category: 'data', action: 'crew_assignment.created', actorId: user_id, actorEmail: email, actorRole: role, resourceType: 'crew_assignment', resourceId: rows[0].id, payload: { project_id, assigned_user_id }, ipAddress: req.ip });
        return rows[0];
      });
      return reply.status(201).send({ crew_assignment: assignment });
    }
  );

  app.get('/crew-assignments', { preHandler: [authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const query = ListQuerySchema.safeParse(req.query);
      if (!query.success) return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: 'project_id required', fields: query.error.errors.map(e => ({ field: e.path.join('.'), message: e.message })) } });
      const { tenant_id } = req.jwt;
      const { project_id, cursor, limit } = query.data;

      const assignments = await withTenantContext(tenant_id, async (client) => {
        const params: unknown[] = [limit + 1, project_id];
        const conditions = ['ca.deleted_at IS NULL', 'ca.project_id = $2'];
        let idx = 3;
        if (cursor) { conditions.push(`(ca.created_at, ca.id) < (SELECT created_at, id FROM crew_assignments WHERE id = $${idx++})`); params.push(cursor); }
        const { rows } = await client.query(
          `SELECT ca.*, u.first_name, u.last_name, u.email as user_email, u.role as user_role
           FROM crew_assignments ca
           JOIN users u ON u.id = ca.user_id
           WHERE ${conditions.join(' AND ')}
           ORDER BY ca.start_date ASC NULLS LAST, ca.created_at ASC, ca.id ASC LIMIT $1`,
          params
        );
        return rows;
      });

      const hasMore = assignments.length > limit;
      const items = hasMore ? assignments.slice(0, limit) : assignments;
      return reply.status(200).send({ crew_assignments: items, pagination: { has_more: hasMore, next_cursor: hasMore ? items[items.length - 1].id : null } });
    }
  );

  app.patch('/crew-assignments/:id', { preHandler: [authenticate, requireRole(...WRITE_ROLES)] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as { id: string };
      const body = UpdateSchema.safeParse(req.body);
      if (!body.success) return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: 'Validation failed', fields: body.error.errors.map(e => ({ field: e.path.join('.'), message: e.message })) } });
      const { tenant_id, user_id, email, role } = req.jwt;
      const { schedule_task_id, start_date, end_date, role_on_task, version } = body.data;

      const result = await withTenantContext(tenant_id, async (client) => {
        const sets = ['version = version + 1', 'updated_at = NOW()'];
        const params: unknown[] = [];
        let idx = 1;
        if (schedule_task_id !== undefined) { params.push(schedule_task_id); sets.push(`schedule_task_id = $${idx++}`); }
        if (start_date !== undefined) { params.push(start_date); sets.push(`start_date = $${idx++}`); }
        if (end_date !== undefined) { params.push(end_date); sets.push(`end_date = $${idx++}`); }
        if (role_on_task !== undefined) { params.push(role_on_task); sets.push(`role_on_task = $${idx++}`); }
        params.push(id, version);
        const { rows } = await client.query(
          `UPDATE crew_assignments SET ${sets.join(', ')} WHERE id = $${idx} AND version = $${idx + 1} AND deleted_at IS NULL RETURNING *`,
          params
        );
        if (rows.length > 0) {
          await writeAuditEntry(client, { tenantId: tenant_id, category: 'data', action: 'crew_assignment.updated', actorId: user_id, actorEmail: email, actorRole: role, resourceType: 'crew_assignment', resourceId: id, payload: body.data, ipAddress: req.ip });
          return { row: rows[0], status: 'ok' };
        }
        const { rows: check } = await client.query(`SELECT id FROM crew_assignments WHERE id = $1 AND deleted_at IS NULL`, [id]);
        return { row: null, status: check.length === 0 ? 'not_found' : 'conflict' };
      });

      if (result.status === 'not_found') return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Crew assignment not found' } });
      if (result.status === 'conflict') return reply.status(409).send({ error: { code: 'VERSION_CONFLICT', message: 'Version conflict — fetch the latest and retry' } });
      return reply.status(200).send({ crew_assignment: result.row });
    }
  );

  app.delete('/crew-assignments/:id', { preHandler: [authenticate, requireRole(...WRITE_ROLES)] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as { id: string };
      const { tenant_id, user_id, email, role } = req.jwt;
      const deleted = await withTenantContext(tenant_id, async (client) => {
        const { rows } = await client.query(`UPDATE crew_assignments SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL RETURNING id`, [id]);
        if (rows.length > 0) await writeAuditEntry(client, { tenantId: tenant_id, category: 'data', action: 'crew_assignment.deleted', actorId: user_id, actorEmail: email, actorRole: role, resourceType: 'crew_assignment', resourceId: id, payload: {}, ipAddress: req.ip });
        return rows[0] ?? null;
      });
      if (!deleted) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Crew assignment not found' } });
      return reply.status(204).send();
    }
  );
}
