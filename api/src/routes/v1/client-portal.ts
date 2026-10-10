// routes/v1/client-portal.ts — scoped, read-only surface for CLIENT_PORTAL users (the project owner).
//
// SECURITY BOUNDARY (ultrathink) — mirrors sub-portal.ts:
//   A client_portal user lives INSIDE the builder's tenant, so tenant RLS alone would expose the
//   whole tenant. Two layers close that:
//     1. middleware/portal-gate.ts confines a CLIENT_PORTAL token to GET /v1/client-portal/* (+ /users/me,
//        logout) — it cannot reach the general /v1/projects, /v1/invoices, … routes at all.
//     2. Every endpoint here re-derives the caller's project_ids from `project_members` and
//        authorizes on it. No query is unscoped.
//   What a client sees is decided HERE, server-side — never in a web proxy (a token is just as usable
//   against api.thejobsite.app directly, which has no browser gate):
//     - projects: identity + dates + address only
//     - schedule: only tasks the builder flagged `show_in_client_portal`
//     - invoices: never drafts, never cross-tenant (`connection_id` = a sub billing its GC), no
//       retainage / payment-provider ids
//   Non-member → 403 without revealing whether the project exists.

import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import type { PoolClient } from 'pg';
import { withTenantContext } from '../../lib/tenant-context.js';
import { authenticate, requireRole } from '../../plugins/auth-plugin.js';

const PROJECT_COLS = 'id, name, status, start_date, end_date, address, city, state';

async function isMember(client: PoolClient, userId: string, projectId: string): Promise<boolean> {
  const res = await client.query(
    `SELECT 1 FROM project_members pm
       JOIN projects p ON p.id = pm.project_id AND p.deleted_at IS NULL
      WHERE pm.user_id = $1 AND pm.project_id = $2 LIMIT 1`,
    [userId, projectId],
  );
  return res.rows.length > 0;
}

const notMember = (reply: FastifyReply) =>
  reply.status(403).send({ error: { code: 'FORBIDDEN', message: 'Not a member of this project' } });

export async function clientPortalRoutes(app: FastifyInstance): Promise<void> {
  const requireClient = [authenticate, requireRole('CLIENT_PORTAL')];

  // ── GET /v1/client-portal/projects — the projects this client is a member of ─────────────
  app.get('/client-portal/projects', { preHandler: requireClient }, async (req: FastifyRequest, reply: FastifyReply) => {
    const { tenant_id, user_id } = req.jwt;
    const projects = await withTenantContext(tenant_id, async (client) => {
      const res = await client.query(
        `SELECT ${PROJECT_COLS.split(', ').map((c) => `p.${c}`).join(', ')}
           FROM projects p
          WHERE p.deleted_at IS NULL
            AND p.id IN (SELECT project_id FROM project_members WHERE user_id = $1)
          ORDER BY p.name`,
        [user_id],
      );
      return res.rows;
    });
    return reply.send({ projects });
  });

  // ── GET /v1/client-portal/projects/:id — project + milestones + client-visible schedule ──
  app.get('/client-portal/projects/:id', { preHandler: requireClient }, async (req: FastifyRequest, reply: FastifyReply) => {
    const { tenant_id, user_id } = req.jwt;
    const { id } = req.params as { id: string };
    if (!/^[0-9a-f-]{36}$/i.test(id)) return notMember(reply);

    const bundle = await withTenantContext(tenant_id, async (client) => {
      if (!(await isMember(client, user_id, id))) return null;
      const [project, milestones, tasks] = await Promise.all([
        client.query(`SELECT ${PROJECT_COLS} FROM projects WHERE id = $1 AND deleted_at IS NULL`, [id]),
        client.query(
          `SELECT id, title, due_date, completed_at FROM milestones
            WHERE project_id = $1 AND deleted_at IS NULL ORDER BY due_date NULLS LAST, created_at LIMIT 100`,
          [id],
        ),
        client.query(
          `SELECT id, title, status, planned_start, planned_end, percent_complete FROM schedule_tasks
            WHERE project_id = $1 AND deleted_at IS NULL AND show_in_client_portal = TRUE
            ORDER BY planned_start NULLS LAST, created_at LIMIT 200`,
          [id],
        ),
      ]);
      return { project: project.rows[0], milestones: milestones.rows, tasks: tasks.rows };
    });

    if (!bundle) return notMember(reply);
    return reply.send(bundle);
  });

  // ── GET /v1/client-portal/projects/:id/invoices — billed invoices for this project ───────
  app.get('/client-portal/projects/:id/invoices', { preHandler: requireClient }, async (req: FastifyRequest, reply: FastifyReply) => {
    const { tenant_id, user_id } = req.jwt;
    const { id } = req.params as { id: string };
    if (!/^[0-9a-f-]{36}$/i.test(id)) return notMember(reply);

    const invoices = await withTenantContext(tenant_id, async (client) => {
      if (!(await isMember(client, user_id, id))) return null;
      const res = await client.query(
        `SELECT id, amount_cents, status, due_date, created_at FROM invoices
          WHERE project_id = $1 AND deleted_at IS NULL
            AND status <> 'draft' AND connection_id IS NULL
          ORDER BY created_at DESC LIMIT 200`,
        [id],
      );
      return res.rows;
    });

    if (!invoices) return notMember(reply);
    return reply.send({ invoices });
  });
}
