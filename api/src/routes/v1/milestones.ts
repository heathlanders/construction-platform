// routes/v1/milestones.ts — Milestone CRUD scoped to a project
// Locked decisions: T-01, T-03, T-12, A-03

import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { withTenantContext } from '../../lib/tenant-context.js';
import { writeAuditEntry } from '../../lib/audit-log.js';
import { authenticate, requireRole } from '../../plugins/auth-plugin.js';

const WRITE_ROLES = ['OWNER', 'PROJECT_MANAGER', 'FOREMAN'] as const;

const ListQuerySchema = z.object({
  project_id: z.string().uuid(),
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const CreateSchema = z.object({
  project_id: z.string().uuid(),
  title: z.string().min(1).max(500),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  schedule_task_id: z.string().uuid().optional().nullable(),
});

const UpdateSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  schedule_task_id: z.string().uuid().optional().nullable(),
  completed_at: z.string().datetime().optional().nullable(),
  version: z.number().int().min(0),
});

export async function milestoneRoutes(app: FastifyInstance): Promise<void> {
  // GET /milestones?project_id=<uuid>
  app.get('/milestones', { preHandler: [authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const query = ListQuerySchema.safeParse(req.query);
      if (!query.success) {
        return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: 'project_id (UUID) is required', fields: query.error.errors.map(e => ({ field: e.path.join('.'), message: e.message })) } });
      }
      const { tenant_id } = req.jwt;
      const { project_id, cursor, limit } = query.data;

      const rows = await withTenantContext(tenant_id, async (client) => {
        const params: unknown[] = [project_id, limit + 1];
        let cursorClause = '';
        if (cursor) {
          params.push(cursor);
          cursorClause = `AND id > $${params.length}`;
        }
        const { rows } = await client.query(
          `SELECT * FROM milestones
           WHERE project_id = $1 AND deleted_at IS NULL ${cursorClause}
           ORDER BY id ASC LIMIT $2`,
          params
        );
        return rows;
      });

      const hasMore = rows.length > limit;
      const page = hasMore ? rows.slice(0, limit) : rows;
      return reply.status(200).send({
        milestones: page,
        pagination: { has_more: hasMore, next_cursor: hasMore ? page[page.length - 1].id : null },
      });
    }
  );

  // POST /milestones
  app.post('/milestones', { preHandler: [authenticate, requireRole(...WRITE_ROLES)] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const body = CreateSchema.safeParse(req.body);
      if (!body.success) {
        return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: 'Validation failed', fields: body.error.errors.map(e => ({ field: e.path.join('.'), message: e.message })) } });
      }
      const { tenant_id, user_id, email, role } = req.jwt;
      const { project_id, title, due_date, schedule_task_id } = body.data;

      const milestone = await withTenantContext(tenant_id, async (client) => {
        const { rows } = await client.query(
          `INSERT INTO milestones
             (tenant_id, project_id, title, due_date, schedule_task_id, created_by)
           VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
          [tenant_id, project_id, title, due_date ?? null, schedule_task_id ?? null, user_id]
        );
        await writeAuditEntry(client, {
          tenantId: tenant_id, category: 'data', action: 'milestone.created',
          actorId: user_id, actorEmail: email, actorRole: role,
          resourceType: 'milestone', resourceId: rows[0].id,
          payload: { project_id, title }, ipAddress: req.ip,
        });
        return rows[0];
      });

      return reply.status(201).send({ milestone });
    }
  );

  // PATCH /milestones/:id
  app.patch('/milestones/:id', { preHandler: [authenticate, requireRole(...WRITE_ROLES)] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const body = UpdateSchema.safeParse(req.body);
      if (!body.success) {
        return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: 'Validation failed', fields: body.error.errors.map(e => ({ field: e.path.join('.'), message: e.message })) } });
      }
      const { id } = req.params as { id: string };
      const { tenant_id, user_id, email, role } = req.jwt;
      const { version, ...fields } = body.data;

      const setClauses: string[] = [];
      const params: unknown[] = [];

      if (fields.title !== undefined)           { params.push(fields.title);           setClauses.push(`title = $${params.length}`); }
      if (fields.due_date !== undefined)         { params.push(fields.due_date);         setClauses.push(`due_date = $${params.length}`); }
      if (fields.schedule_task_id !== undefined) { params.push(fields.schedule_task_id); setClauses.push(`schedule_task_id = $${params.length}`); }
      if (fields.completed_at !== undefined)     { params.push(fields.completed_at);     setClauses.push(`completed_at = $${params.length}`); }

      if (setClauses.length === 0) {
        return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: 'No fields to update' } });
      }
      setClauses.push('updated_at = NOW()', 'version = version + 1');

      params.push(id);    const idIdx = params.length;
      params.push(version); const verIdx = params.length;

      const result = await withTenantContext(tenant_id, async (client) => {
        const exists = await client.query(
          `SELECT id FROM milestones WHERE id = $1 AND deleted_at IS NULL`, [id]
        );
        if (exists.rows.length === 0) return { status: 404 as const };

        const { rows } = await client.query(
          `UPDATE milestones SET ${setClauses.join(', ')}
           WHERE id = $${idIdx} AND version = $${verIdx} AND deleted_at IS NULL
           RETURNING *`,
          params
        );
        if (rows.length === 0) return { status: 409 as const };

        await writeAuditEntry(client, {
          tenantId: tenant_id, category: 'data', action: 'milestone.updated',
          actorId: user_id, actorEmail: email, actorRole: role,
          resourceType: 'milestone', resourceId: rows[0].id,
          payload: { after: rows[0] }, ipAddress: req.ip,
        });
        return { status: 200 as const, milestone: rows[0] };
      });

      if (result.status === 404) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Milestone not found' } });
      if (result.status === 409) return reply.status(409).send({ error: { code: 'VERSION_CONFLICT', message: 'Milestone was modified by another client. Refresh and try again.' } });
      return reply.status(200).send({ milestone: result.milestone });
    }
  );

  // DELETE /milestones/:id
  app.delete('/milestones/:id', { preHandler: [authenticate, requireRole(...WRITE_ROLES)] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as { id: string };
      const { tenant_id, user_id, email, role } = req.jwt;

      const deleted = await withTenantContext(tenant_id, async (client) => {
        const { rows } = await client.query(
          `UPDATE milestones SET deleted_at = NOW(), updated_at = NOW()
           WHERE id = $1 AND deleted_at IS NULL RETURNING id`,
          [id]
        );
        if (rows.length === 0) return null;
        await writeAuditEntry(client, {
          tenantId: tenant_id, category: 'data', action: 'milestone.deleted',
          actorId: user_id, actorEmail: email, actorRole: role,
          resourceType: 'milestone', resourceId: id, payload: {}, ipAddress: req.ip,
        });
        return rows[0];
      });

      if (!deleted) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Milestone not found' } });
      return reply.status(204).send();
    }
  );
}
