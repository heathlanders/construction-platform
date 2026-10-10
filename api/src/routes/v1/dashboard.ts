// routes/v1/dashboard.ts — Aggregated dashboard summary
// Returns KPIs + recent projects + activity feed for the home dashboard
// Cached in Redis for 60s per tenant to keep load < 300ms

import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { withTenantContext } from '../../lib/tenant-context.js';
import { authenticate } from '../../plugins/auth-plugin.js';
import { redis } from '../../lib/redis.js';

export async function dashboardRoutes(app: FastifyInstance): Promise<void> {
  app.get('/dashboard/summary', { preHandler: [authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { tenant_id } = req.jwt;
      const cacheKey = `dashboard:summary:${tenant_id}`;

      // Return cached result if fresh
      try {
        const cached = await redis.get(cacheKey);
        if (cached) {
          return reply.status(200).send(JSON.parse(cached));
        }
      } catch {
        // Redis miss — fall through to DB query
      }

      const result = await withTenantContext(tenant_id, async (client) => {
        // Single query for all KPI counts
        const { rows: kpis } = await client.query<{
          active_projects: string;
          open_punch_items: string;
          pending_timecards: string;
          overdue_tasks: string;
        }>(`
          SELECT
            (SELECT COUNT(*) FROM projects
             WHERE deleted_at IS NULL AND status = 'active') AS active_projects,
            (SELECT COUNT(*) FROM punch_list_items
             WHERE deleted_at IS NULL AND status != 'complete') AS open_punch_items,
            (SELECT COUNT(*) FROM timecards
             WHERE status = 'submitted') AS pending_timecards,
            (SELECT COUNT(*) FROM schedule_tasks
             WHERE deleted_at IS NULL
               AND status NOT IN ('complete')
               AND planned_end < NOW()::date) AS overdue_tasks
        `);

        // Recent projects (last 5 active/modified)
        const { rows: projects } = await client.query<{
          id: string;
          name: string;
          status: string;
          updated_at: string;
          budget_cents: string;
          actual_cents: string;
          crew_count: string;
        }>(`
          SELECT
            p.id,
            p.name,
            p.status,
            p.updated_at,
            COALESCE(SUM(b.budget_cents), 0) AS budget_cents,
            COALESCE(SUM(b.actual_cents), 0) AS actual_cents,
            (SELECT COUNT(DISTINCT ca.user_id)
             FROM crew_assignments ca
             WHERE ca.project_id = p.id
               AND ca.deleted_at IS NULL
               AND ca.end_date >= NOW()::date) AS crew_count
          FROM projects p
          LEFT JOIN budget_line_items b
            ON b.project_id = p.id AND b.deleted_at IS NULL
          WHERE p.deleted_at IS NULL AND p.status = 'active'
          GROUP BY p.id
          ORDER BY p.updated_at DESC
          LIMIT 5
        `);

        // Recent activity (last 15 audit log entries for this tenant)
        const { rows: activity } = await client.query<{
          id: string;
          action: string;
          category: string;
          actor_email: string;
          resource_type: string;
          created_at: string;
        }>(`
          SELECT id, action, category, actor_email, resource_type, created_at
          FROM audit_log
          WHERE tenant_id = current_setting('app.current_tenant_id', true)
          ORDER BY created_at DESC
          LIMIT 15
        `);

        return { kpis: kpis[0], projects, activity };
      });

      const kpi = result.kpis;
      const summary = {
        kpis: {
          active_projects: parseInt(kpi.active_projects ?? '0'),
          open_punch_items: parseInt(kpi.open_punch_items ?? '0'),
          pending_timecards: parseInt(kpi.pending_timecards ?? '0'),
          overdue_tasks: parseInt(kpi.overdue_tasks ?? '0'),
        },
        recent_projects: result.projects.map((p) => ({
          id: p.id,
          name: p.name,
          status: p.status,
          updated_at: p.updated_at,
          budget_cents: parseInt(p.budget_cents ?? '0'),
          actual_cents: parseInt(p.actual_cents ?? '0'),
          crew_count: parseInt(p.crew_count ?? '0'),
          budget_pct_used: parseInt(p.budget_cents ?? '0') > 0
            ? Math.round((parseInt(p.actual_cents ?? '0') / parseInt(p.budget_cents ?? '0')) * 100)
            : 0,
        })),
        activity: result.activity,
      };

      // Cache for 60s
      try {
        await redis.set(cacheKey, JSON.stringify(summary), 'EX', 60);
      } catch {
        // Cache write failure is non-fatal
      }

      return reply.status(200).send(summary);
    }
  );
}
