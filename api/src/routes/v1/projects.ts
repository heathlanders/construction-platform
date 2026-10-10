// routes/v1/projects.ts — CRUD for projects + project members
// POST /v1/projects, GET /v1/projects, GET /v1/projects/:id
// GET /v1/projects/:id/members, POST /v1/projects/:id/members, DELETE /v1/projects/:id/members/:memberId
// Locked decisions: A-01, A-03, T-01, T-03, T-04, T-11
// See: api/CLAUDE.md, docs/Schema_Reference.md (Domain 3)

import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { withTenantContext } from '../../lib/tenant-context.js';
import { writeAuditEntry } from '../../lib/audit-log.js';
import { assertCanCreateProject } from '../../services/tier-enforcement.js';
import { authenticate, requireRole } from '../../plugins/auth-plugin.js';
import { sendJob } from '../../lib/queue.js';
import { publishProjectLocationForProject } from '../../lib/cross-tenant/bridge.js';

// ─── Schemas ──────────────────────────────────────────────────────────────────

const createProjectSchema = z.object({
  name: z.string().min(1).max(255),
  status: z.enum(['active', 'completed', 'on_hold', 'cancelled']).default('active'),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  address: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  state: z.string().length(2).optional(),
  zip: z.string().max(10).optional(),
  county_fips: z.string().regex(/^\d{5}$/).optional(),
  county_name: z.string().max(100).optional(),
});

const listProjectsSchema = z.object({
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['active', 'completed', 'on_hold', 'cancelled']).optional(),
});

// Manual pin-drop / correction (Project Map). Optimistic-locked (T-12).
const projectLocationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  version: z.number().int().positive(),
});

// Project Map — slim pins for the portfolio map viewport.
// bbox = "minLng,minLat,maxLng,maxLat" (server-side viewport filter).
const mapQuerySchema = z.object({
  bbox: z.string().regex(/^-?\d+(\.\d+)?(,-?\d+(\.\d+)?){3}$/).optional(),
  status: z.enum(['active', 'completed', 'on_hold', 'cancelled']).optional(),
  trade: z.string().max(40).optional(),
  pm: z.string().uuid().optional(),
});

// ─── Types for DB rows ────────────────────────────────────────────────────────

interface ProjectRow {
  id: string;
  tenant_id: string;
  name: string;
  status: string;
  start_date: string | null;
  end_date: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  county_fips: string | null;
  county_name: string | null;
  latitude: string | null;
  longitude: string | null;
  geocode_status: string;
  geocoded_at: string | null;
  connection_id?: string | null;
  version: number;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

// ─── Route plugin ─────────────────────────────────────────────────────────────

export async function projectRoutes(app: FastifyInstance): Promise<void> {
  /**
   * POST /v1/projects
   * Create a new project. Requires OWNER or PROJECT_MANAGER role.
   * Enforces tier project limit (PR-01, PR-02).
   */
  app.post(
    '/projects',
    { preHandler: [authenticate, requireRole('OWNER', 'PROJECT_MANAGER')] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const body = createProjectSchema.safeParse(req.body);
      if (!body.success) {
        return reply.status(422).send({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Request validation failed',
            fields: body.error.errors.map((e) => ({
              field: e.path.join('.'),
              message: e.message,
            })),
          },
        });
      }

      const { tenant_id, user_id, email, role } = req.jwt;

      // Tier enforcement — throws TierEnforcementError (→ 402) if limit reached
      await assertCanCreateProject(tenant_id);

      const project = await withTenantContext(tenant_id, async (client) => {
        const result = await client.query<ProjectRow>(
          `INSERT INTO projects
             (tenant_id, name, status, start_date, end_date, address, city, state, zip, county_fips, county_name, created_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
           RETURNING *`,
          [
            tenant_id,
            body.data.name,
            body.data.status,
            body.data.start_date ?? null,
            body.data.end_date ?? null,
            body.data.address ?? null,
            body.data.city ?? null,
            body.data.state ?? null,
            body.data.zip ?? null,
            body.data.county_fips ?? null,
            body.data.county_name ?? null,
            user_id,
          ]
        );

        await writeAuditEntry(client, {
          tenantId: tenant_id,
          category: 'data',
          action: 'project.created',
          actorId: user_id,
          actorEmail: email,
          actorRole: role,
          resourceType: 'project',
          resourceId: result.rows[0].id,
          payload: { name: body.data.name, status: body.data.status },
          ipAddress: req.ip,
        });

        return result.rows[0];
      });

      // Project Map: geocode the address in the background (T-10 envelope tenant_id).
      // Only when there's something to geocode; a queue hiccup must never fail creation.
      if (project.address || project.city || project.zip || project.county_fips) {
        try {
          await sendJob('geocode.project', tenant_id, { project_id: project.id });
        } catch (err) {
          req.log.warn({ err, project_id: project.id }, 'geocode.project enqueue failed');
        }
      }

      return reply.status(201).send({ project });
    }
  );

  /**
   * GET /v1/projects
   * List projects for the authenticated tenant.
   * Cursor-based pagination (T-01). RLS enforces tenant isolation (A-03).
   */
  app.get(
    '/projects',
    { preHandler: [authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const query = listProjectsSchema.safeParse(req.query);
      if (!query.success) {
        return reply.status(422).send({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid query parameters',
            fields: query.error.errors.map((e) => ({
              field: e.path.join('.'),
              message: e.message,
            })),
          },
        });
      }

      const { tenant_id } = req.jwt;
      const { cursor, limit, status } = query.data;

      const projects = await withTenantContext(tenant_id, async (client) => {
        // Cursor-based pagination: id is UUID v4, cursor is the last seen id
        // Use created_at + id for stable ordering (T-01)
        const params: unknown[] = [limit + 1]; // fetch +1 to detect has_more
        let paramIdx = 2;
        const conditions: string[] = ['deleted_at IS NULL'];

        if (cursor) {
          conditions.push(
            `(created_at, id) < (SELECT created_at, id FROM projects WHERE id = $${paramIdx})`
          );
          params.push(cursor);
          paramIdx++;
        }

        if (status) {
          conditions.push(`status = $${paramIdx}`);
          params.push(status);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        const result = await client.query<ProjectRow>(
          `SELECT id, tenant_id, name, status, start_date, end_date,
                  address, city, state, zip, county_fips, county_name, version, created_at, updated_at, created_by
           FROM projects
           ${whereClause}
           ORDER BY created_at DESC, id DESC
           LIMIT $1`,
          params
        );

        return result.rows;
      });

      // Determine if there are more pages
      const hasMore = projects.length > limit;
      const items = hasMore ? projects.slice(0, limit) : projects;
      const nextCursor = hasMore ? items[items.length - 1].id : null;

      return reply.status(200).send({
        projects: items,
        pagination: {
          has_more: hasMore,
          next_cursor: nextCursor,
        },
      });
    }
  );

  /**
   * GET /v1/projects/:id
   * Get a single project by ID.
   * RLS ensures the project belongs to the authenticated tenant (A-03).
   */
  app.get(
    '/projects/:id',
    { preHandler: [authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as { id: string };
      const { tenant_id } = req.jwt;

      const project = await withTenantContext(tenant_id, async (client) => {
        const result = await client.query<ProjectRow>(
          `SELECT id, tenant_id, name, status, start_date, end_date,
                  address, city, state, zip, county_fips, county_name,
                  latitude, longitude, geocode_status, geocoded_at,
                  version, created_at, updated_at, created_by
           FROM projects
           WHERE id = $1 AND deleted_at IS NULL`,
          [id]
        );
        return result.rows[0] ?? null;
      });

      if (!project) {
        return reply.status(404).send({
          error: { code: 'NOT_FOUND', message: 'Project not found' },
        });
      }

      return reply.status(200).send({ project });
    }
  );

  /**
   * GET /v1/projects/:id/overview
   * Aggregate for the Project Overview DAG: all schedule tasks, their prerequisite
   * edges, and summary stats (counts by phase/trade/status + critical-path length).
   * Tasks carry phase/trade via the blueprint_proposed_tasks that produced them.
   */
  app.get(
    '/projects/:id/overview',
    { preHandler: [authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as { id: string };
      const { tenant_id } = req.jwt;

      const data = await withTenantContext(tenant_id, async (client) => {
        const { rows: project } = await client.query(
          `SELECT id FROM projects WHERE id = $1 AND deleted_at IS NULL`,
          [id]
        );
        if (project.length === 0) return null;

        // Tasks — pull phase/trade/csi from the originating proposed task (if any)
        const { rows: tasks } = await client.query(
          `SELECT st.id, st.title, st.status, st.percent_complete,
                  st.planned_start, st.planned_end, st.predecessor_task_id, st.version,
                  bpt.phase, bpt.trade_type, bpt.csi_division, bpt.sort_order
           FROM schedule_tasks st
           LEFT JOIN blueprint_proposed_tasks bpt ON bpt.schedule_task_id = st.id
           WHERE st.project_id = $1 AND st.deleted_at IS NULL
           ORDER BY bpt.sort_order ASC NULLS LAST, st.created_at ASC, st.id ASC`,
          [id]
        );

        const { rows: dependencies } = await client.query(
          `SELECT td.id, td.predecessor_task_id, td.successor_task_id, td.dependency_type, td.origin
           FROM task_dependencies td
           JOIN schedule_tasks p ON p.id = td.predecessor_task_id AND p.deleted_at IS NULL
           JOIN schedule_tasks s ON s.id = td.successor_task_id   AND s.deleted_at IS NULL
           WHERE td.project_id = $1 AND td.deleted_at IS NULL`,
          [id]
        );

        return { tasks, dependencies };
      });

      if (!data) {
        return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Project not found' } });
      }

      // ── Summary stats (computed in app layer) ──
      const tally = (key: string) =>
        data.tasks.reduce<Record<string, number>>((acc, t) => {
          const k = (t as Record<string, unknown>)[key] as string | null;
          const label = k ?? 'unassigned';
          acc[label] = (acc[label] ?? 0) + 1;
          return acc;
        }, {});

      // Critical path = longest path by node count over the DAG (topo DP / memoized DFS)
      const adj = new Map<string, string[]>();
      for (const e of data.dependencies) {
        const list = adj.get(e.predecessor_task_id) ?? [];
        list.push(e.successor_task_id);
        adj.set(e.predecessor_task_id, list);
      }
      const memo = new Map<string, number>();
      const longestFrom = (node: string, stack: Set<string>): number => {
        if (memo.has(node)) return memo.get(node)!;
        if (stack.has(node)) return 0; // defensive: never expected (graph is acyclic)
        stack.add(node);
        let best = 1;
        for (const next of adj.get(node) ?? []) best = Math.max(best, 1 + longestFrom(next, stack));
        stack.delete(node);
        memo.set(node, best);
        return best;
      };
      let criticalPathLength = 0;
      for (const t of data.tasks) criticalPathLength = Math.max(criticalPathLength, longestFrom(t.id, new Set()));

      return reply.status(200).send({
        tasks: data.tasks,
        dependencies: data.dependencies,
        summary: {
          total_tasks: data.tasks.length,
          dependency_count: data.dependencies.length,
          by_phase: tally('phase'),
          by_trade: tally('trade_type'),
          by_status: tally('status'),
          critical_path_length: criticalPathLength,
        },
      });
    }
  );

  /**
   * GET /v1/projects/:id/members
   * List all members of a project with their user details.
   */
  app.get(
    '/projects/:id/members',
    { preHandler: [authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as { id: string };
      const { tenant_id } = req.jwt;

      const members = await withTenantContext(tenant_id, async (client) => {
        const result = await client.query(
          `SELECT pm.id, pm.project_id, pm.user_id, pm.role, pm.created_at,
                  u.first_name, u.last_name, u.email
           FROM project_members pm
           JOIN users u ON u.id = pm.user_id AND u.deleted_at IS NULL
           WHERE pm.project_id = $1
           ORDER BY pm.created_at ASC`,
          [id]
        );
        return result.rows;
      });

      return reply.status(200).send({ members });
    }
  );

  /**
   * POST /v1/projects/:id/members
   * Add a user to a project. User must belong to the same tenant.
   */
  app.post(
    '/projects/:id/members',
    { preHandler: [authenticate, requireRole('OWNER', 'PROJECT_MANAGER')] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as { id: string };
      const { tenant_id, user_id, email, role } = req.jwt;

      const addSchema = z.object({
        user_id: z.string().uuid(),
        role: z.enum(['owner', 'project_manager', 'estimator', 'foreman', 'field_tech', 'accountant', 'safety_officer']),
      });
      const body = addSchema.safeParse(req.body);
      if (!body.success) {
        return reply.status(422).send({
          error: { code: 'VALIDATION_ERROR', message: 'Validation failed' },
        });
      }

      const member = await withTenantContext(tenant_id, async (client) => {
        // Validate both project and user belong to this tenant (RLS enforces tenant_id)
        const { rows: projects } = await client.query(
          `SELECT id FROM projects WHERE id = $1 AND deleted_at IS NULL`,
          [id]
        );
        if (projects.length === 0) return null;

        const { rows: users } = await client.query(
          `SELECT id FROM users WHERE id = $1 AND deleted_at IS NULL`,
          [body.data.user_id]
        );
        if (users.length === 0) return { notFound: 'user' };

        const { rows } = await client.query(
          `INSERT INTO project_members (tenant_id, project_id, user_id, role)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT DO NOTHING
           RETURNING *`,
          [tenant_id, id, body.data.user_id, body.data.role]
        );

        await writeAuditEntry(client, {
          tenantId: tenant_id,
          category: 'data',
          action: 'project_member.added',
          actorId: user_id,
          actorEmail: email,
          actorRole: role,
          resourceType: 'project_member',
          resourceId: id,
          payload: { project_id: id, added_user_id: body.data.user_id, role: body.data.role },
          ipAddress: req.ip,
        });

        return rows[0] ?? null;
      });

      if (member === null) {
        return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Project not found' } });
      }

      return reply.status(201).send({ member });
    }
  );

  /**
   * GET /v1/projects/map
   * Slim geolocated pins for the portfolio map. Only projects with coordinates.
   * Query: bbox (viewport), status, trade, pm. Read = any authed org user (RLS scopes to tenant).
   * Returns a lightweight payload — NOT the full project record.
   */
  app.get(
    '/projects/map',
    { preHandler: [authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const query = mapQuerySchema.safeParse(req.query);
      if (!query.success) {
        return reply.status(422).send({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid query parameters',
            fields: query.error.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
          },
        });
      }

      const { tenant_id } = req.jwt;
      const { bbox, status, trade, pm } = query.data;

      const projects = await withTenantContext(tenant_id, async (client) => {
        const conditions: string[] = [
          'p.deleted_at IS NULL',
          'p.latitude IS NOT NULL',
          'p.longitude IS NOT NULL',
        ];
        const params: unknown[] = [];
        let i = 1;

        if (bbox) {
          const [minLng, minLat, maxLng, maxLat] = bbox.split(',').map(Number);
          conditions.push(`p.longitude BETWEEN $${i} AND $${i + 1}`);
          params.push(minLng, maxLng);
          i += 2;
          conditions.push(`p.latitude BETWEEN $${i} AND $${i + 1}`);
          params.push(minLat, maxLat);
          i += 2;
        }
        if (status) {
          conditions.push(`p.status = $${i}`);
          params.push(status);
          i++;
        }
        if (trade) {
          conditions.push(
            `EXISTS (SELECT 1 FROM schedule_tasks st
                     WHERE st.project_id = p.id AND st.trade_type = $${i} AND st.deleted_at IS NULL)`
          );
          params.push(trade);
          i++;
        }
        if (pm) {
          conditions.push(
            `EXISTS (SELECT 1 FROM project_members pmb
                     WHERE pmb.project_id = p.id AND pmb.user_id = $${i}
                       AND pmb.role IN ('project_manager', 'owner'))`
          );
          params.push(pm);
          i++;
        }

        const result = await client.query<{
          id: string; name: string; status: string;
          latitude: string; longitude: string; geocode_status: string;
          percent_complete: string | null;
        }>(
          `SELECT p.id, p.name, p.status, p.latitude, p.longitude, p.geocode_status,
                  p.county_name, p.city, p.state,
                  (SELECT ROUND(AVG(st.percent_complete), 1)
                   FROM schedule_tasks st
                   WHERE st.project_id = p.id AND st.deleted_at IS NULL) AS percent_complete
           FROM projects p
           WHERE ${conditions.join(' AND ')}
           ORDER BY p.created_at DESC
           LIMIT 5000`,
          params
        );

        return result.rows.map((r: any) => ({
          id: r.id,
          name: r.name,
          status: r.status,
          latitude: Number(r.latitude),
          longitude: Number(r.longitude),
          geocode_status: r.geocode_status,
          // Jurisdiction layer (Doc 20 Phase 5): county/city/state snapshot for the label + slide-over.
          county_name: r.county_name ?? null,
          city: r.city ?? null,
          state: r.state ?? null,
          percent_complete: r.percent_complete === null ? null : Number(r.percent_complete),
        }));
      });

      return reply.status(200).send({ projects });
    }
  );

  /**
   * PATCH /v1/projects/:id/location
   * Manual pin-drop / correction for the Project Map. Sets lat/lng directly,
   * marks geocode_status='exact', optimistic-locked (T-12), audited. OWNER/PM.
   */
  app.patch(
    '/projects/:id/location',
    { preHandler: [authenticate, requireRole('OWNER', 'PROJECT_MANAGER')] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const body = projectLocationSchema.safeParse(req.body);
      if (!body.success) {
        return reply.status(422).send({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Request validation failed',
            fields: body.error.errors.map((e) => ({
              field: e.path.join('.'),
              message: e.message,
            })),
          },
        });
      }

      const { id } = req.params as { id: string };
      const { tenant_id, user_id, email, role } = req.jwt;
      const { latitude, longitude, version } = body.data;

      const outcome = await withTenantContext(tenant_id, async (client) => {
        const current = await client.query<ProjectRow>(
          `SELECT id, tenant_id, name, status, start_date, end_date,
                  address, city, state, zip, county_fips, county_name, latitude, longitude, geocode_status, geocoded_at, connection_id, version, created_at, updated_at, created_by
           FROM projects WHERE id = $1 AND deleted_at IS NULL`,
          [id]
        );
        if (current.rows.length === 0) return { kind: 'not_found' as const };
        if (current.rows[0].version !== version) {
          return { kind: 'conflict' as const, server: current.rows[0] };
        }

        const updated = await client.query<ProjectRow>(
          `UPDATE projects
           SET latitude = $1, longitude = $2, geocode_status = 'exact', geocoded_at = NOW(),
               version = version + 1, updated_at = NOW()
           WHERE id = $3 AND version = $4 AND deleted_at IS NULL
           RETURNING id, tenant_id, name, status, start_date, end_date,
                     address, city, state, zip, county_fips, county_name, latitude, longitude, geocode_status, geocoded_at, connection_id, version, created_at, updated_at, created_by`,
          [latitude, longitude, id, version]
        );
        if (updated.rows.length === 0) {
          // Lost the race between SELECT and UPDATE — re-read for the server_record.
          const reread = await client.query<ProjectRow>(
            `SELECT id, tenant_id, name, status, start_date, end_date,
                    address, city, state, zip, county_fips, county_name, latitude, longitude, geocode_status, geocoded_at, connection_id, version, created_at, updated_at, created_by
             FROM projects WHERE id = $1 AND deleted_at IS NULL`,
            [id]
          );
          return { kind: 'conflict' as const, server: reread.rows[0] ?? null };
        }

        await writeAuditEntry(client, {
          tenantId: tenant_id,
          category: 'data',
          action: 'project.location_updated',
          actorId: user_id,
          actorEmail: email,
          actorRole: role,
          resourceType: 'project',
          resourceId: id,
          payload: { latitude, longitude },
          ipAddress: req.ip,
        });

        return { kind: 'ok' as const, project: updated.rows[0] };
      });

      if (outcome.kind === 'not_found') {
        return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Project not found' } });
      }
      if (outcome.kind === 'conflict') {
        return reply.status(409).send({
          error: { code: 'VERSION_CONFLICT', message: 'Project was modified — reload and retry' },
          server_record: outcome.server,
        });
      }

      // Cross-tenant map layer (Doc 20 Phase 6b): fan the new pin out to any active
      // connections sharing this project. Best-effort — never blocks the pin-drop.
      void publishProjectLocationForProject(tenant_id, id, outcome.project);

      return reply.status(200).send({ project: outcome.project });
    }
  );

  /**
   * DELETE /v1/projects/:id/members/:memberId
   * Remove a member from a project.
   */
  app.delete(
    '/projects/:id/members/:memberId',
    { preHandler: [authenticate, requireRole('OWNER', 'PROJECT_MANAGER')] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id, memberId } = req.params as { id: string; memberId: string };
      const { tenant_id, user_id, email, role } = req.jwt;

      const deleted = await withTenantContext(tenant_id, async (client) => {
        const { rows } = await client.query(
          `DELETE FROM project_members WHERE id = $1 AND project_id = $2 RETURNING id, user_id`,
          [memberId, id]
        );
        if (rows.length > 0) {
          await writeAuditEntry(client, {
            tenantId: tenant_id,
            category: 'data',
            action: 'project_member.removed',
            actorId: user_id,
            actorEmail: email,
            actorRole: role,
            resourceType: 'project_member',
            resourceId: id,
            payload: { project_id: id, removed_member_id: memberId },
            ipAddress: req.ip,
          });
        }
        return rows[0] ?? null;
      });

      if (!deleted) {
        return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Member not found' } });
      }

      return reply.status(204).send();
    }
  );
}
