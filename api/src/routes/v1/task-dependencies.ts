// routes/v1/task-dependencies.ts — prerequisite edges between schedule_tasks
// GET    /v1/task-dependencies?project_id=  — list edges for a project
// POST   /v1/task-dependencies              — add a manual edge (cycle-checked)
// DELETE /v1/task-dependencies/:id          — soft-delete an edge
// Locked decisions: T-01, T-03, A-03, T-42

import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { withTenantContext } from '../../lib/tenant-context.js';
import { writeAuditEntry } from '../../lib/audit-log.js';
import { authenticate, requireRole } from '../../plugins/auth-plugin.js';
import { wouldCreateCycle } from '../../lib/task-dependencies/rules.js';
import type { DepEdge } from '../../lib/task-dependencies/types.js';

const WRITE_ROLES = ['OWNER', 'PROJECT_MANAGER'] as const;

const ListQuerySchema = z.object({ project_id: z.string().uuid() });

const CreateSchema = z.object({
  project_id:          z.string().uuid(),
  predecessor_task_id: z.string().uuid(),
  successor_task_id:   z.string().uuid(),
  dependency_type:     z.enum(['finish_to_start', 'start_to_start', 'finish_to_finish', 'start_to_finish']).default('finish_to_start'),
});

export async function taskDependencyRoutes(app: FastifyInstance): Promise<void> {
  // ── GET /task-dependencies?project_id= ──────────────────────────────────────
  app.get('/task-dependencies', { preHandler: [authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const query = ListQuerySchema.safeParse(req.query);
      if (!query.success) {
        return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: 'project_id required', fields: query.error.errors.map((e) => ({ field: e.path.join('.'), message: e.message })) } });
      }
      const { tenant_id } = req.jwt;
      const { project_id } = query.data;

      const dependencies = await withTenantContext(tenant_id, async (client) => {
        const { rows } = await client.query(
          `SELECT td.id, td.project_id, td.predecessor_task_id, td.successor_task_id,
                  td.dependency_type, td.origin, td.created_at
           FROM task_dependencies td
           JOIN schedule_tasks p ON p.id = td.predecessor_task_id AND p.deleted_at IS NULL
           JOIN schedule_tasks s ON s.id = td.successor_task_id   AND s.deleted_at IS NULL
           WHERE td.project_id = $1 AND td.deleted_at IS NULL
           ORDER BY td.created_at ASC`,
          [project_id],
        );
        return rows;
      });

      return reply.status(200).send({ dependencies });
    },
  );

  // ── POST /task-dependencies (manual edge) ───────────────────────────────────
  app.post('/task-dependencies', { preHandler: [authenticate, requireRole(...WRITE_ROLES)] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const body = CreateSchema.safeParse(req.body);
      if (!body.success) {
        return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: 'Validation failed', fields: body.error.errors.map((e) => ({ field: e.path.join('.'), message: e.message })) } });
      }
      const { tenant_id, user_id, email, role } = req.jwt;
      const { project_id, predecessor_task_id, successor_task_id, dependency_type } = body.data;

      if (predecessor_task_id === successor_task_id) {
        return reply.status(422).send({ error: { code: 'SELF_DEPENDENCY', message: 'A task cannot depend on itself' } });
      }

      const result = await withTenantContext(tenant_id, async (client) => {
        // Both tasks must exist in this project (RLS enforces tenant)
        const { rows: tasks } = await client.query(
          `SELECT id FROM schedule_tasks WHERE id = ANY($1::uuid[]) AND project_id = $2 AND deleted_at IS NULL`,
          [[predecessor_task_id, successor_task_id], project_id],
        );
        if (tasks.length < 2) return { status: 'task_not_found' };

        // Load existing live edges + cycle check
        const { rows: existing } = await client.query(
          `SELECT predecessor_task_id, successor_task_id FROM task_dependencies
           WHERE project_id = $1 AND deleted_at IS NULL`,
          [project_id],
        );
        const edges: DepEdge[] = existing.map((r) => ({
          predecessor_id: r.predecessor_task_id as string,
          successor_id: r.successor_task_id as string,
          type: 'finish_to_start',
        }));
        if (wouldCreateCycle(edges, predecessor_task_id, successor_task_id)) {
          return { status: 'cycle' };
        }

        const { rows } = await client.query(
          `INSERT INTO task_dependencies
             (tenant_id, project_id, predecessor_task_id, successor_task_id, dependency_type, origin, created_by)
           VALUES ($1, $2, $3, $4, $5, 'manual', $6)
           ON CONFLICT (tenant_id, predecessor_task_id, successor_task_id) WHERE deleted_at IS NULL DO NOTHING
           RETURNING *`,
          [tenant_id, project_id, predecessor_task_id, successor_task_id, dependency_type, user_id],
        );
        if (rows.length === 0) return { status: 'duplicate' };

        await writeAuditEntry(client, {
          tenantId: tenant_id, category: 'data', action: 'task_dependency.created',
          actorId: user_id, actorEmail: email, actorRole: role,
          resourceType: 'task_dependency', resourceId: rows[0].id as string,
          payload: { project_id, predecessor_task_id, successor_task_id },
          ipAddress: req.ip,
        });
        return { status: 'ok', row: rows[0] };
      });

      if (result.status === 'task_not_found') return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'One or both tasks not found in this project' } });
      if (result.status === 'cycle') return reply.status(409).send({ error: { code: 'DEPENDENCY_CYCLE', message: 'This dependency would create a cycle' } });
      if (result.status === 'duplicate') return reply.status(409).send({ error: { code: 'DEPENDENCY_EXISTS', message: 'This dependency already exists' } });
      return reply.status(201).send({ dependency: result.row });
    },
  );

  // ── DELETE /task-dependencies/:id ───────────────────────────────────────────
  app.delete('/task-dependencies/:id', { preHandler: [authenticate, requireRole(...WRITE_ROLES)] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as { id: string };
      const { tenant_id, user_id, email, role } = req.jwt;
      const deleted = await withTenantContext(tenant_id, async (client) => {
        const { rows } = await client.query(
          `UPDATE task_dependencies SET deleted_at = NOW(), updated_at = NOW()
           WHERE id = $1 AND deleted_at IS NULL RETURNING id`,
          [id],
        );
        if (rows.length > 0) {
          await writeAuditEntry(client, {
            tenantId: tenant_id, category: 'data', action: 'task_dependency.deleted',
            actorId: user_id, actorEmail: email, actorRole: role,
            resourceType: 'task_dependency', resourceId: id, payload: {}, ipAddress: req.ip,
          });
        }
        return rows[0] ?? null;
      });
      if (!deleted) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Dependency not found' } });
      return reply.status(204).send();
    },
  );
}
