// routes/v1/blueprints.ts — Blueprint Intelligence endpoints
// POST /v1/blueprints/analyze       — start analysis (template or PDF)
// GET  /v1/blueprints/templates/:bt — preview template task list
// GET  /v1/blueprints/:id           — poll analysis status
// GET  /v1/blueprints/:id/tasks     — list proposed tasks (filterable)
// PATCH /v1/blueprints/:id/tasks/:tid — review a proposed task
// POST /v1/blueprints/:id/import    — import accepted tasks → schedule_tasks
// Locked decisions: T-01, T-03, T-10, T-42, A-03

import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { withTenantContext } from '../../lib/tenant-context.js';
import { writeAuditEntry } from '../../lib/audit-log.js';
import { authenticate, requireRole } from '../../plugins/auth-plugin.js';
import { sendJob } from '../../lib/queue.js';
import {
  getTemplate,
  isValidBuildingType,
  BUILDING_TYPE_LABELS,
  BUILDING_TYPES,
  groupByPhase,
  PHASE_ORDER,
  PHASE_LABELS,
} from '../../lib/blueprint-templates/index.js';
import type { DepTask } from '../../lib/task-dependencies/types.js';
import { recomputeProjectDependencies } from '../../services/task-dependencies.js';
import { buildStepsForProjectTasks } from '../../services/task-steps.js';

const WRITE_ROLES = ['OWNER', 'PROJECT_MANAGER'] as const;
const READ_ROLES  = ['OWNER', 'PROJECT_MANAGER', 'FOREMAN'] as const;

// Resource bound (B2.6): plans larger than this are rejected at analyze time (before a job is
// enqueued). Defaults to the 250MB CAD/plan upload ceiling (T-29). Override via env.
const MAX_PDF_BYTES = Number(process.env.BLUEPRINT_MAX_PDF_BYTES ?? 250 * 1024 * 1024);

// ─── Schemas ──────────────────────────────────────────────────────────────────

const AnalyzeSchema = z.object({
  project_id:    z.string().uuid(),
  building_type: z.enum(BUILDING_TYPES),
  document_id:   z.string().uuid().optional(),  // omit for template-only run
});

const TaskListQuerySchema = z.object({
  cursor:        z.string().uuid().optional(),
  limit:         z.coerce.number().int().min(1).max(100).default(50),
  trade_type:    z.string().optional(),
  phase:         z.string().optional(),
  review_status: z.enum(['pending', 'accepted', 'rejected', 'modified']).optional(),
});

const AnalysisListQuerySchema = z.object({
  project_id: z.string().uuid(),
  cursor:     z.string().uuid().optional(),
  limit:      z.coerce.number().int().min(1).max(100).default(20),
});

const TaskUpdateSchema = z.object({
  review_status: z.enum(['pending', 'accepted', 'rejected', 'modified']).optional(),
  title:         z.string().min(1).max(500).optional(),
  description:   z.string().nullable().optional(),
});

const BulkReviewSchema = z.object({
  review_status: z.enum(['accepted', 'rejected', 'pending']),
  // Omit task_ids to apply to every currently-pending task of the analysis (accept-all/reject-all).
  task_ids:      z.array(z.string().uuid()).min(1).max(2000).optional(),
});

const ImportSchema = z.object({
  planned_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  project_name: z.string().min(1).max(255).optional(),  // rename project from blueprint address (advisory, PM-confirmed)
});

// ─── Route registration ───────────────────────────────────────────────────────

export async function blueprintRoutes(app: FastifyInstance): Promise<void> {

  // ── GET /blueprints/templates/:building_type — preview template (no DB write)
  app.get('/blueprints/templates/:building_type', { preHandler: [authenticate, requireRole(...WRITE_ROLES)] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { building_type } = req.params as { building_type: string };
      if (!isValidBuildingType(building_type)) {
        return reply.status(422).send({ error: { code: 'INVALID_BUILDING_TYPE', message: `building_type must be one of: ${Object.keys(BUILDING_TYPE_LABELS).join(', ')}` } });
      }
      const tasks = getTemplate(building_type);
      const grouped = groupByPhase(tasks);
      const phases = PHASE_ORDER.filter((p) => grouped[p]?.length);

      return reply.status(200).send({
        building_type,
        label: BUILDING_TYPE_LABELS[building_type],
        total_tasks: tasks.length,
        phases: phases.map((p) => ({
          phase: p,
          label: PHASE_LABELS[p],
          tasks: grouped[p],
        })),
      });
    },
  );

  // ── POST /blueprints/analyze — start analysis
  app.post('/blueprints/analyze', { preHandler: [authenticate, requireRole(...WRITE_ROLES)] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const body = AnalyzeSchema.safeParse(req.body);
      if (!body.success) {
        return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: 'Validation failed', fields: body.error.errors.map((e) => ({ field: e.path.join('.'), message: e.message })) } });
      }
      const { tenant_id, user_id, email, role } = req.jwt;
      const { project_id, building_type, document_id } = body.data;

      const analysis = await withTenantContext(tenant_id, async (client) => {
        // Verify project belongs to tenant
        const { rows: proj } = await client.query(
          `SELECT id FROM projects WHERE id = $1 AND deleted_at IS NULL`,
          [project_id],
        );
        if (proj.length === 0) return null;

        // If document_id provided, verify it's a scan-passed PDF plan file (`files` row)
        // that BELONGS TO THIS PROJECT. The on-ramp unified onto `files` — the orphaned
        // `documents` table is no longer used for the blueprint picker. Only a 'ready'
        // (scan-passed) file is analyzable, and only for its own project (B2.1 — the worker
        // would otherwise download a file the caller doesn't own on this project).
        if (document_id) {
          const { rows: doc } = await client.query(
            `SELECT id, filename, status, project_id, file_size_bytes FROM files WHERE id = $1 AND deleted_at IS NULL`,
            [document_id],
          );
          if (doc.length === 0) return { _error: 'document_not_found' };
          // File must be on the project the analysis targets (RLS already scopes to tenant).
          if ((doc[0].project_id as string | null) !== project_id) return { _error: 'document_not_found' };
          if ((doc[0].status as string) !== 'ready') return { _error: 'document_not_ready' };
          const fname = (doc[0].filename as string | null) ?? '';
          if (!fname.toLowerCase().endsWith('.pdf')) {
            return { _error: 'document_not_pdf' };
          }
          // Resource bound (B2.6): reject a plan too large to process before we enqueue a job.
          const bytes = Number(doc[0].file_size_bytes ?? 0);
          if (bytes > MAX_PDF_BYTES) return { _error: 'document_too_large' };
        }

        // Create analysis record
        const { rows } = await client.query(
          `INSERT INTO blueprint_analyses
             (tenant_id, project_id, document_id, building_type, status, created_by)
           VALUES ($1, $2, $3, $4, 'pending', $5) RETURNING *`,
          [tenant_id, project_id, document_id ?? null, building_type, user_id],
        );

        await writeAuditEntry(client, {
          tenantId: tenant_id, category: 'data', action: 'blueprint_analysis.created',
          actorId: user_id, actorEmail: email, actorRole: role,
          resourceType: 'blueprint_analysis', resourceId: rows[0].id as string,
          payload: { project_id, building_type, document_id: document_id ?? null },
          ipAddress: req.ip,
        });

        return rows[0];
      });

      if (!analysis) {
        return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Project not found' } });
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const errCode = (analysis as any)._error;
      if (errCode === 'document_not_found') {
        return reply.status(404).send({ error: { code: 'DOCUMENT_NOT_FOUND', message: 'Document not found' } });
      }
      if (errCode === 'document_not_ready') {
        return reply.status(409).send({ error: { code: 'DOCUMENT_NOT_READY', message: 'Plan file is still scanning. Wait for the scan to finish, then start analysis.' } });
      }
      if (errCode === 'document_not_pdf') {
        return reply.status(422).send({ error: { code: 'DOCUMENT_NOT_PDF', message: 'document_id must reference a .pdf file' } });
      }
      if (errCode === 'document_too_large') {
        return reply.status(422).send({ error: { code: 'PDF_TOO_LARGE', message: `Plan exceeds the ${Math.round(MAX_PDF_BYTES / (1024 * 1024))}MB analysis limit. Split it into smaller sets.` } });
      }

      // Dispatch analysis job
      await sendJob('blueprint.analyze', tenant_id, {
        analysis_id:   analysis.id,
        document_id:   document_id ?? null,
        project_id,
        building_type,
        user_id,
      });

      // analysis_mode tells the client which path the worker will run
      const analysis_mode: 'template' | 'text_extraction' = document_id ? 'text_extraction' : 'template';
      return reply.status(201).send({ analysis, analysis_mode });
    },
  );

  // ── GET /blueprints — list a project's analyses (history for the hub)
  app.get('/blueprints', { preHandler: [authenticate, requireRole(...READ_ROLES)] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const query = AnalysisListQuerySchema.safeParse(req.query);
      if (!query.success) {
        return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: 'project_id required', fields: query.error.errors.map((e) => ({ field: e.path.join('.'), message: e.message })) } });
      }
      const { tenant_id } = req.jwt;
      const { project_id, cursor, limit } = query.data;

      const rows = await withTenantContext(tenant_id, async (client) => {
        const params: unknown[] = [limit + 1, project_id];
        const conditions = ['project_id = $2', 'deleted_at IS NULL'];
        let idx = 3;
        if (cursor) {
          conditions.push(`(created_at, id) < (SELECT created_at, id FROM blueprint_analyses WHERE id = $${idx++})`);
          params.push(cursor);
        }
        const { rows } = await client.query(
          `SELECT id, status, building_type, document_id, sheet_count, extracted_task_count,
                  import_metadata->>'source' AS source, created_at, updated_at
           FROM blueprint_analyses
           WHERE ${conditions.join(' AND ')}
           ORDER BY created_at DESC, id DESC
           LIMIT $1`,
          params,
        );
        return rows;
      });

      const hasMore = rows.length > limit;
      const items = hasMore ? rows.slice(0, limit) : rows;
      return reply.status(200).send({
        analyses: items,
        pagination: { has_more: hasMore, next_cursor: hasMore ? items[items.length - 1].id : null },
      });
    },
  );

  // ── GET /blueprints/:id — poll status
  app.get('/blueprints/:id', { preHandler: [authenticate, requireRole(...READ_ROLES)] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as { id: string };
      const { tenant_id } = req.jwt;

      const analysis = await withTenantContext(tenant_id, async (client) => {
        const { rows } = await client.query(
          `SELECT * FROM blueprint_analyses WHERE id = $1 AND deleted_at IS NULL`,
          [id],
        );
        return rows[0] ?? null;
      });

      if (!analysis) {
        return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Analysis not found' } });
      }
      return reply.status(200).send({ analysis });
    },
  );

  // ── DELETE /blueprints/:id — soft-delete an analysis (failed run cleanup / start over)
  app.delete('/blueprints/:id', { preHandler: [authenticate, requireRole(...WRITE_ROLES)] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as { id: string };
      const { tenant_id, user_id, email, role } = req.jwt;

      const deleted = await withTenantContext(tenant_id, async (client) => {
        // Imported analyses stay — their proposed tasks link to live schedule_tasks.
        const { rows } = await client.query(
          `UPDATE blueprint_analyses SET deleted_at = NOW(), updated_at = NOW()
           WHERE id = $1 AND deleted_at IS NULL AND status != 'imported'
           RETURNING id, project_id, status`,
          [id],
        );
        if (rows.length === 0) return null;

        await writeAuditEntry(client, {
          tenantId: tenant_id, category: 'data', action: 'blueprint_analysis.deleted',
          actorId: user_id, actorEmail: email, actorRole: role,
          resourceType: 'blueprint_analysis', resourceId: id,
          payload: { project_id: rows[0].project_id, status_at_delete: rows[0].status },
          ipAddress: req.ip,
        });
        return rows[0];
      });

      if (!deleted) {
        // Distinguish imported (409) from missing (404) for a useful client message.
        const existing = await withTenantContext(tenant_id, async (client) => {
          const { rows } = await client.query(
            `SELECT status FROM blueprint_analyses WHERE id = $1 AND deleted_at IS NULL`, [id],
          );
          return rows[0] ?? null;
        });
        if (existing?.status === 'imported') {
          return reply.status(409).send({ error: { code: 'ANALYSIS_IMPORTED', message: 'This analysis was already imported to the schedule and cannot be deleted.' } });
        }
        return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Analysis not found' } });
      }
      return reply.status(200).send({ deleted: true });
    },
  );

  // ── GET /blueprints/:id/tasks — list proposed tasks (filterable, paginated)
  app.get('/blueprints/:id/tasks', { preHandler: [authenticate, requireRole(...READ_ROLES)] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as { id: string };
      const query = TaskListQuerySchema.safeParse(req.query);
      if (!query.success) {
        return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: 'Validation failed', fields: query.error.errors.map((e) => ({ field: e.path.join('.'), message: e.message })) } });
      }
      const { tenant_id } = req.jwt;
      const { cursor, limit, trade_type, phase, review_status } = query.data;

      const tasks = await withTenantContext(tenant_id, async (client) => {
        // Soft-delete consistency (B3.6): a deleted analysis must not leave its proposed tasks
        // listable. Gate on the parent analysis being live before returning any rows.
        const { rows: live } = await client.query(
          `SELECT 1 FROM blueprint_analyses WHERE id = $1 AND deleted_at IS NULL`,
          [id],
        );
        if (live.length === 0) return null;

        const params: unknown[] = [limit + 1, id];
        const conditions = ['analysis_id = $2'];
        let idx = 3;

        if (cursor) {
          conditions.push(`(sort_order, id) > (SELECT sort_order, id FROM blueprint_proposed_tasks WHERE id = $${idx++})`);
          params.push(cursor);
        }
        if (trade_type) { conditions.push(`trade_type = $${idx++}`); params.push(trade_type); }
        if (phase)       { conditions.push(`phase = $${idx++}`); params.push(phase); }
        if (review_status) { conditions.push(`review_status = $${idx++}`); params.push(review_status); }

        const { rows } = await client.query(
          `SELECT * FROM blueprint_proposed_tasks WHERE ${conditions.join(' AND ')} ORDER BY sort_order ASC, id ASC LIMIT $1`,
          params,
        );
        return rows;
      });

      if (tasks === null) {
        return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Analysis not found' } });
      }
      const hasMore = tasks.length > limit;
      const items = hasMore ? tasks.slice(0, limit) : tasks;
      return reply.status(200).send({
        tasks: items,
        pagination: { has_more: hasMore, next_cursor: hasMore ? items[items.length - 1].id : null },
      });
    },
  );

  // ── PATCH /blueprints/:id/tasks/:task_id — review a single task
  app.patch('/blueprints/:id/tasks/:task_id', { preHandler: [authenticate, requireRole(...WRITE_ROLES)] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id, task_id } = req.params as { id: string; task_id: string };
      const body = TaskUpdateSchema.safeParse(req.body);
      if (!body.success) {
        return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: 'Validation failed', fields: body.error.errors.map((e) => ({ field: e.path.join('.'), message: e.message })) } });
      }
      const { tenant_id, user_id, email, role } = req.jwt;
      const { review_status, title, description } = body.data;

      const task = await withTenantContext(tenant_id, async (client) => {
        // An imported analysis is terminal — its proposed tasks are locked (they already became
        // schedule_tasks). Block edits with a distinct sentinel so the route returns 409, not 404.
        const { rows: a } = await client.query(
          `SELECT status FROM blueprint_analyses WHERE id = $1 AND deleted_at IS NULL`,
          [id],
        );
        if (a.length === 0) return { _sentinel: 'not_found' as const };
        if ((a[0].status as string) === 'imported') return { _sentinel: 'imported' as const };

        const sets = ['updated_at = NOW()'];
        const params: unknown[] = [];
        let idx = 1;
        if (review_status !== undefined) { params.push(review_status); sets.push(`review_status = $${idx++}`); }
        if (title !== undefined) { params.push(title); sets.push(`title = $${idx++}`); }
        if (description !== undefined) { params.push(description); sets.push(`description = $${idx++}`); }

        if (params.length === 0) return null;

        params.push(task_id, id);
        const { rows } = await client.query(
          `UPDATE blueprint_proposed_tasks SET ${sets.join(', ')} WHERE id = $${idx} AND analysis_id = $${idx + 1} RETURNING *`,
          params,
        );
        if (!rows[0]) return null;

        await writeAuditEntry(client, {
          tenantId: tenant_id, category: 'data', action: 'blueprint_task.reviewed',
          actorId: user_id, actorEmail: email, actorRole: role,
          resourceType: 'blueprint_proposed_task', resourceId: task_id,
          payload: {
            analysis_id: id,
            ...(review_status !== undefined ? { review_status } : {}),
            ...(title !== undefined ? { title_edited: true } : {}),
            ...(description !== undefined ? { description_edited: true } : {}),
          },
          ipAddress: req.ip,
        });
        return rows[0];
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sentinel = (task as any)?._sentinel;
      if (sentinel === 'imported') {
        return reply.status(409).send({ error: { code: 'ANALYSIS_IMPORTED', message: 'This analysis was already imported — its tasks are locked.' } });
      }
      if (!task || sentinel === 'not_found') {
        return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Task not found' } });
      }
      return reply.status(200).send({ task });
    },
  );

  // ── POST /blueprints/:id/tasks/bulk-review — accept/reject many tasks in one call
  // Replaces the review UI's N-parallel PATCH accept-all (errors were swallowed) and adds
  // reject-all. Omit task_ids to apply to every currently-pending task of the analysis.
  app.post('/blueprints/:id/tasks/bulk-review', { preHandler: [authenticate, requireRole(...WRITE_ROLES)] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as { id: string };
      const body = BulkReviewSchema.safeParse(req.body);
      if (!body.success) {
        return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: 'Validation failed', fields: body.error.errors.map((e) => ({ field: e.path.join('.'), message: e.message })) } });
      }
      const { tenant_id, user_id, email, role } = req.jwt;
      const { review_status, task_ids } = body.data;

      const result = await withTenantContext(tenant_id, async (client) => {
        const { rows: a } = await client.query(
          `SELECT status FROM blueprint_analyses WHERE id = $1 AND deleted_at IS NULL`,
          [id],
        );
        if (a.length === 0) return { status: 'not_found' as const };
        if ((a[0].status as string) === 'imported') return { status: 'imported' as const };

        // Scope to the analysis. With no task_ids, target only currently-pending tasks
        // (accept-all / reject-all). With task_ids, target exactly those in this analysis.
        const params: unknown[] = [review_status, id];
        let where = `analysis_id = $2`;
        if (task_ids && task_ids.length > 0) {
          params.push(task_ids);
          where += ` AND id = ANY($3::uuid[])`;
        } else {
          where += ` AND review_status = 'pending'`;
        }
        const { rows } = await client.query(
          `UPDATE blueprint_proposed_tasks SET review_status = $1, updated_at = NOW()
           WHERE ${where} RETURNING id`,
          params,
        );

        await writeAuditEntry(client, {
          tenantId: tenant_id, category: 'data', action: 'blueprint_task.bulk_reviewed',
          actorId: user_id, actorEmail: email, actorRole: role,
          resourceType: 'blueprint_analysis', resourceId: id,
          payload: { review_status, updated_count: rows.length, scoped: !!(task_ids && task_ids.length) },
          ipAddress: req.ip,
        });
        return { status: 'ok' as const, updated_count: rows.length };
      });

      if (result.status === 'not_found') {
        return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Analysis not found' } });
      }
      if (result.status === 'imported') {
        return reply.status(409).send({ error: { code: 'ANALYSIS_IMPORTED', message: 'This analysis was already imported — its tasks are locked.' } });
      }
      return reply.status(200).send({ updated_count: result.updated_count });
    },
  );

  // ── POST /blueprints/:id/import — batch-import accepted tasks → schedule_tasks
  app.post('/blueprints/:id/import', { preHandler: [authenticate, requireRole(...WRITE_ROLES)] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as { id: string };
      const body = ImportSchema.safeParse(req.body ?? {});
      if (!body.success) {
        return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: 'Validation failed', fields: body.error.errors.map((e) => ({ field: e.path.join('.'), message: e.message })) } });
      }
      const { tenant_id, user_id, email, role } = req.jwt;
      const { planned_start } = body.data;

      const result = await withTenantContext(tenant_id, async (client) => {
        // Lock the analysis row FOR UPDATE so two concurrent imports serialize: the
        // second blocks here, then re-reads status='imported' below and bails. Only
        // 'review_ready' may import — 'imported' is terminal (dropped from the allow
        // list, closing the double-import race that duplicated the schedule).
        const { rows: analysisRows } = await client.query(
          `SELECT id, project_id, status FROM blueprint_analyses WHERE id = $1 AND deleted_at IS NULL FOR UPDATE`,
          [id],
        );
        if (analysisRows.length === 0) return { status: 'not_found' };
        const analysis = analysisRows[0] as { id: string; project_id: string; status: string };
        if (analysis.status !== 'review_ready') {
          return { status: 'not_ready', analysis_status: analysis.status };
        }

        // Fetch accepted proposed tasks not yet imported — schedule_task_id IS NULL
        // makes re-import idempotent (a second POST /import must not duplicate tasks).
        const { rows: acceptedTasks } = await client.query(
          `SELECT * FROM blueprint_proposed_tasks
           WHERE analysis_id = $1 AND review_status = 'accepted' AND schedule_task_id IS NULL
           ORDER BY sort_order ASC`,
          [id],
        );

        if (acceptedTasks.length === 0) {
          return { status: 'no_accepted_tasks', imported_count: 0 };
        }

        let importedCount = 0;
        const created: DepTask[] = [];
        for (const task of acceptedTasks as Record<string, unknown>[]) {
          // Create schedule_task. planned_end = planned_start + estimated_duration_days
          // (both present) so imported tasks aren't zero-length on the Gantt — the
          // extracted/template duration used to be silently discarded.
          const { rows: newTask } = await client.query(
            `INSERT INTO schedule_tasks
               (tenant_id, project_id, title, description, status,
                planned_start, planned_end, trade_type, phase, csi_division, sort_order, version, created_by)
             VALUES ($1, $2, $3, $4, 'not_started',
                $5,
                CASE WHEN $5::date IS NOT NULL AND $6::int IS NOT NULL AND $6::int > 0
                     THEN ($5::date + ($6::int * INTERVAL '1 day'))::date ELSE NULL END,
                $7, $8, $9, $10, 1, $11)
             RETURNING id`,
            [
              tenant_id,
              analysis.project_id,
              task.title,
              task.description ?? null,
              planned_start ?? null,
              (task.estimated_duration_days as number) ?? null,
              task.trade_type ?? null,
              task.phase ?? null,
              task.csi_division ?? null,
              (task.sort_order as number) ?? null,
              user_id,
            ],
          );

          // Link back to proposed task
          await client.query(
            `UPDATE blueprint_proposed_tasks
             SET schedule_task_id = $2, updated_at = NOW()
             WHERE id = $1`,
            [task.id, newTask[0].id],
          );

          created.push({
            id: newTask[0].id as string,
            title: String(task.title),
            trade_type: (task.trade_type as string) ?? null,
            phase: (task.phase as string) ?? null,
            csi_division: (task.csi_division as string) ?? null,
            sort_order: (task.sort_order as number) ?? null,
          });
          importedCount++;
        }

        // ── Generate prerequisite dependency graph (deterministic rule engine) ──
        // Recompute from the just-inserted schedule_tasks; preserves any manual edges,
        // replaces rule_engine edges, and backfills predecessor_task_id (shared with the
        // recompute-dependencies endpoint so both paths stay identical).
        const dependencyCount = await recomputeProjectDependencies(
          client, tenant_id, analysis.project_id, { userId: user_id, email, role },
        );

        // ── Build per-task work steps (Task Build-Out Engine) ──
        // Deterministic per-trade steps referencing the resolved codes + this analysis's facts.
        const stepCount = await buildStepsForProjectTasks(
          client,
          tenant_id,
          analysis.project_id,
          created.map((c) => ({
            id: c.id, trade_type: c.trade_type, phase: c.phase,
            csi_division: c.csi_division, title: c.title, description: null,
          })),
          analysis.id,
        );

        // Optional: rename the project from the blueprint-derived build address (PM-confirmed).
        let renamedTo: string | null = null;
        const pname = body.data.project_name?.trim();
        if (pname) {
          const { rows: projRows } = await client.query(
            `SELECT name FROM projects WHERE id = $1 AND deleted_at IS NULL`,
            [analysis.project_id],
          );
          const oldName = projRows[0]?.name as string | undefined;
          if (projRows.length > 0 && oldName !== pname) {
            await client.query(
              `UPDATE projects SET name = $1, version = version + 1, updated_at = NOW()
               WHERE id = $2 AND deleted_at IS NULL`,
              [pname, analysis.project_id],
            );
            renamedTo = pname;
            await writeAuditEntry(client, {
              tenantId: tenant_id, category: 'data', action: 'project.renamed',
              actorId: user_id, actorEmail: email, actorRole: role,
              resourceType: 'project', resourceId: analysis.project_id,
              payload: { from: oldName ?? null, to: pname, source: 'blueprint_import' },
              ipAddress: req.ip,
            });
          }
        }

        // Mark analysis as imported
        await client.query(
          `UPDATE blueprint_analyses
           SET status = 'imported', updated_at = NOW()
           WHERE id = $1`,
          [id],
        );

        await writeAuditEntry(client, {
          tenantId: tenant_id, category: 'data', action: 'blueprint_analysis.imported',
          actorId: user_id, actorEmail: email, actorRole: role,
          resourceType: 'blueprint_analysis', resourceId: id,
          payload: { imported_count: importedCount, dependency_count: dependencyCount, project_id: analysis.project_id },
          ipAddress: req.ip,
        });

        // Notify owner/PM that a schedule was imported (review-ready notified; import didn't).
        const { rows: projRow } = await client.query(
          `SELECT name FROM projects WHERE id = $1 AND deleted_at IS NULL`, [analysis.project_id]);
        const projName = (projRow[0]?.name as string | undefined) ?? 'the project';
        const { rows: pmUsers } = await client.query(
          `SELECT id FROM users
           WHERE tenant_id = $1 AND role IN ('owner', 'project_manager') AND status = 'active' AND deleted_at IS NULL`,
          [tenant_id],
        );
        for (const u of pmUsers as { id: string }[]) {
          await client.query(
            `INSERT INTO notifications (tenant_id, user_id, title, body, category, data)
             VALUES ($1, $2, $3, $4, 'project', $5)`,
            [
              tenant_id, u.id,
              'Blueprint tasks imported to schedule',
              `${importedCount} tasks imported to ${projName}'s schedule.`,
              JSON.stringify({ analysis_id: id, project_id: analysis.project_id, type: 'blueprint_imported' }),
            ],
          );
        }

        // Dispatch schedule cost projection for the project
        await sendJob('reconciliation.schedule_cost_projection', tenant_id, {
          project_id: analysis.project_id,
          triggered_by: 'blueprint_import',
        });

        return { status: 'ok', imported_count: importedCount, dependency_count: dependencyCount, step_count: stepCount, project_id: analysis.project_id, project_name: renamedTo };
      });

      if (result.status === 'not_found') {
        return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Analysis not found' } });
      }
      if (result.status === 'not_ready') {
        return reply.status(409).send({ error: { code: 'ANALYSIS_NOT_READY', message: `Analysis is in status '${result.analysis_status}'. Only 'review_ready' analyses can be imported.` } });
      }

      return reply.status(200).send({
        imported_count: result.imported_count,
        dependency_count: result.dependency_count ?? 0,
        step_count: result.step_count ?? 0,
        project_id: result.project_id,
        project_name: result.project_name ?? null,
        message: `${result.imported_count} tasks imported to project schedule`,
      });
    },
  );
}
