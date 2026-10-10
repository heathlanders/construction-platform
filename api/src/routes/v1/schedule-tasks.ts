// routes/v1/schedule-tasks.ts — Basic project schedule CRUD
// schedule_cost_projection job dispatched when percent_complete changes
// Locked decisions: T-01, T-03, T-12, A-03

import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { withTenantContext } from '../../lib/tenant-context.js';
import { writeAuditEntry } from '../../lib/audit-log.js';
import { authenticate, requireRole } from '../../plugins/auth-plugin.js';
import { sendJob } from '../../lib/queue.js';
import { resolveJurisdiction } from '../../lib/jurisdictions/resolver.js';
import { tradeToPermitTrade } from '../../lib/jurisdictions/trade-map.js';
import type { BuildingType } from '../../lib/jurisdictions/types.js';
import { generateDownloadUrl } from '../../lib/storage.js';
import { buildStepsForProjectTasks, type BuildoutTaskRow } from '../../services/task-steps.js';
import { recomputeProjectDependencies } from '../../services/task-dependencies.js';
import { assertTier } from '../../services/tier-enforcement.js';

const JURIS_BUILDING_TYPES: readonly BuildingType[] = ['residential_sf', 'residential_mf', 'commercial', 'industrial'];

const CreateSchema = z.object({
  project_id: z.string().uuid(),
  title: z.string().min(1).max(500),
  description: z.string().optional(),
  status: z.enum(['not_started', 'in_progress', 'complete', 'on_hold']).default('not_started'),
  percent_complete: z.number().min(0).max(100).default(0),
  planned_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  planned_end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  actual_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  actual_end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  assigned_to_user_id: z.string().uuid().optional(),
  predecessor_task_id: z.string().uuid().optional(),
  show_in_client_portal: z.boolean().default(false),
  trade_type: z.string().max(50).optional(),
  phase: z.string().max(50).optional(),
  csi_division: z.string().max(50).optional(),
});

const UpdateSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().optional().nullable(),
  status: z.enum(['not_started', 'in_progress', 'complete', 'on_hold']).optional(),
  percent_complete: z.number().min(0).max(100).optional(),
  planned_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  planned_end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  actual_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  actual_end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  assigned_to_user_id: z.string().uuid().optional().nullable(),
  predecessor_task_id: z.string().uuid().optional().nullable(),
  show_in_client_portal: z.boolean().optional(),
  trade_type: z.string().max(50).optional().nullable(),
  phase: z.string().max(50).optional().nullable(),
  csi_division: z.string().max(50).optional().nullable(),
  sort_order: z.number().int().min(0).optional().nullable(),
  version: z.number().int().min(1),
});

const PhotoCreateSchema = z.object({
  file_id: z.string().uuid(),
  caption: z.string().max(500).optional(),
  photo_type: z.enum(['proof', 'qa', 'progress', 'defect']).default('proof'),
});

const PHOTO_UPLOAD_ROLES = ['OWNER', 'PROJECT_MANAGER', 'FOREMAN', 'FIELD_TECH', 'SAFETY_OFFICER'] as const;

const ListQuerySchema = z.object({
  project_id: z.string().uuid(),
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(20),
  status: z.enum(['not_started', 'in_progress', 'complete', 'on_hold']).optional(),
});

const WRITE_ROLES = ['OWNER', 'PROJECT_MANAGER'] as const;

export async function scheduleTaskRoutes(app: FastifyInstance): Promise<void> {
  app.post('/schedule-tasks', { preHandler: [authenticate, requireRole(...WRITE_ROLES)] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const body = CreateSchema.safeParse(req.body);
      if (!body.success) return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: 'Validation failed', fields: body.error.errors.map(e => ({ field: e.path.join('.'), message: e.message })) } });
      const { tenant_id, user_id, email, role } = req.jwt;
      const { project_id, title, description, status, percent_complete, planned_start, planned_end, actual_start, actual_end, assigned_to_user_id, predecessor_task_id, show_in_client_portal, trade_type, phase, csi_division } = body.data;

      const task = await withTenantContext(tenant_id, async (client) => {
        const { rows } = await client.query(
          `INSERT INTO schedule_tasks
             (tenant_id, project_id, title, description, status, percent_complete,
              planned_start, planned_end, actual_start, actual_end,
              assigned_to_user_id, predecessor_task_id, show_in_client_portal,
              trade_type, phase, csi_division, created_by)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17) RETURNING *`,
          [tenant_id, project_id, title, description ?? null, status, percent_complete,
           planned_start ?? null, planned_end ?? null, actual_start ?? null, actual_end ?? null,
           assigned_to_user_id ?? null, predecessor_task_id ?? null, show_in_client_portal,
           trade_type ?? null, phase ?? null, csi_division ?? null, user_id]
        );
        await writeAuditEntry(client, { tenantId: tenant_id, category: 'data', action: 'schedule_task.created', actorId: user_id, actorEmail: email, actorRole: role, resourceType: 'schedule_task', resourceId: rows[0].id, payload: { project_id, title }, ipAddress: req.ip });
        return rows[0];
      });
      return reply.status(201).send({ schedule_task: task });
    }
  );

  app.get('/schedule-tasks', { preHandler: [authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const query = ListQuerySchema.safeParse(req.query);
      if (!query.success) return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: 'project_id required', fields: query.error.errors.map(e => ({ field: e.path.join('.'), message: e.message })) } });
      const { tenant_id } = req.jwt;
      const { project_id, cursor, limit, status } = query.data;

      const tasks = await withTenantContext(tenant_id, async (client) => {
        const params: unknown[] = [limit + 1, project_id];
        const conditions = ['deleted_at IS NULL', 'project_id = $2'];
        let idx = 3;
        if (cursor) { conditions.push(`(created_at, id) < (SELECT created_at, id FROM schedule_tasks WHERE id = $${idx++})`); params.push(cursor); }
        if (status) { conditions.push(`status = $${idx++}`); params.push(status); }
        const { rows } = await client.query(
          `SELECT * FROM schedule_tasks WHERE ${conditions.join(' AND ')} ORDER BY planned_start ASC NULLS LAST, created_at ASC, id ASC LIMIT $1`,
          params
        );
        return rows;
      });

      const hasMore = tasks.length > limit;
      const items = hasMore ? tasks.slice(0, limit) : tasks;
      return reply.status(200).send({ schedule_tasks: items, pagination: { has_more: hasMore, next_cursor: hasMore ? items[items.length - 1].id : null } });
    }
  );

  app.get('/schedule-tasks/:id', { preHandler: [authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as { id: string };
      const { tenant_id } = req.jwt;
      const task = await withTenantContext(tenant_id, async (client) => {
        const { rows } = await client.query(`SELECT * FROM schedule_tasks WHERE id = $1 AND deleted_at IS NULL`, [id]);
        return rows[0] ?? null;
      });
      if (!task) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Schedule task not found' } });
      return reply.status(200).send({ schedule_task: task });
    }
  );

  app.patch('/schedule-tasks/:id', { preHandler: [authenticate, requireRole(...WRITE_ROLES)] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as { id: string };
      const body = UpdateSchema.safeParse(req.body);
      if (!body.success) return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: 'Validation failed', fields: body.error.errors.map(e => ({ field: e.path.join('.'), message: e.message })) } });
      const { tenant_id, user_id, email, role } = req.jwt;
      const { title, description, status, percent_complete, planned_start, planned_end, actual_start, actual_end, assigned_to_user_id, predecessor_task_id, show_in_client_portal, trade_type, phase, csi_division, sort_order, version } = body.data;

      const result = await withTenantContext(tenant_id, async (client) => {
        const sets = ['version = version + 1', 'updated_at = NOW()'];
        const params: unknown[] = [];
        let idx = 1;
        if (title !== undefined) { params.push(title); sets.push(`title = $${idx++}`); }
        if (description !== undefined) { params.push(description); sets.push(`description = $${idx++}`); }
        if (status !== undefined) { params.push(status); sets.push(`status = $${idx++}`); }
        if (percent_complete !== undefined) { params.push(percent_complete); sets.push(`percent_complete = $${idx++}`); }
        if (planned_start !== undefined) { params.push(planned_start); sets.push(`planned_start = $${idx++}`); }
        if (planned_end !== undefined) { params.push(planned_end); sets.push(`planned_end = $${idx++}`); }
        if (actual_start !== undefined) { params.push(actual_start); sets.push(`actual_start = $${idx++}`); }
        if (actual_end !== undefined) { params.push(actual_end); sets.push(`actual_end = $${idx++}`); }
        if (assigned_to_user_id !== undefined) { params.push(assigned_to_user_id); sets.push(`assigned_to_user_id = $${idx++}`); }
        if (predecessor_task_id !== undefined) { params.push(predecessor_task_id); sets.push(`predecessor_task_id = $${idx++}`); }
        if (show_in_client_portal !== undefined) { params.push(show_in_client_portal); sets.push(`show_in_client_portal = $${idx++}`); }
        if (trade_type !== undefined) { params.push(trade_type); sets.push(`trade_type = $${idx++}`); }
        if (phase !== undefined) { params.push(phase); sets.push(`phase = $${idx++}`); }
        if (csi_division !== undefined) { params.push(csi_division); sets.push(`csi_division = $${idx++}`); }
        if (sort_order !== undefined) { params.push(sort_order); sets.push(`sort_order = $${idx++}`); }
        params.push(id, version);
        const { rows } = await client.query(
          `UPDATE schedule_tasks SET ${sets.join(', ')} WHERE id = $${idx} AND version = $${idx + 1} AND deleted_at IS NULL RETURNING *`,
          params
        );
        if (rows.length > 0) {
          await writeAuditEntry(client, { tenantId: tenant_id, category: 'data', action: 'schedule_task.updated', actorId: user_id, actorEmail: email, actorRole: role, resourceType: 'schedule_task', resourceId: id, payload: body.data, ipAddress: req.ip });
          return { row: rows[0], status: 'ok' };
        }
        const { rows: check } = await client.query(`SELECT id FROM schedule_tasks WHERE id = $1 AND deleted_at IS NULL`, [id]);
        return { row: null, status: check.length === 0 ? 'not_found' : 'conflict' };
      });

      if (result.status === 'not_found') return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Schedule task not found' } });
      if (result.status === 'conflict') return reply.status(409).send({ error: { code: 'VERSION_CONFLICT', message: 'Version conflict — fetch the latest and retry' } });

      // Dispatch schedule_cost_projection job when percent_complete changes
      if (result.row && percent_complete !== undefined && percent_complete > 0) {
        await sendJob('reconciliation.schedule_cost_projection', tenant_id, {
          schedule_task_id: id,
          project_id: result.row.project_id,
          percent_complete,
        });
      }

      return reply.status(200).send({ schedule_task: result.row });
    }
  );

  app.delete('/schedule-tasks/:id', { preHandler: [authenticate, requireRole(...WRITE_ROLES)] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as { id: string };
      const { tenant_id, user_id, email, role } = req.jwt;
      const deleted = await withTenantContext(tenant_id, async (client) => {
        const { rows } = await client.query(`UPDATE schedule_tasks SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL RETURNING id`, [id]);
        if (rows.length > 0) await writeAuditEntry(client, { tenantId: tenant_id, category: 'data', action: 'schedule_task.deleted', actorId: user_id, actorEmail: email, actorRole: role, resourceType: 'schedule_task', resourceId: id, payload: {}, ipAddress: req.ip });
        return rows[0] ?? null;
      });
      if (!deleted) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Schedule task not found' } });
      return reply.status(204).send();
    }
  );

  // ─── GET /v1/schedule-tasks/:id/detail ──────────────────────────────────────────────────────
  // Rich aggregate for the task view/editor: the task, its governing code + inspection sequence
  // (resolved live for the project's jurisdiction), live AHJ inspection status for that trade,
  // prerequisite/successor edges, and QA photos. codes=null when the task has no trade.
  app.get('/schedule-tasks/:id/detail', { preHandler: [authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as { id: string };
      const { tenant_id } = req.jwt;

      const data = await withTenantContext(tenant_id, async (client) => {
        // Task — COALESCE native trade/phase/csi with the blueprint snapshot (pre-0021 rows).
        const { rows: taskRows } = await client.query(
          `SELECT st.*,
                  COALESCE(st.trade_type, bpt.trade_type)     AS trade_type,
                  COALESCE(st.phase, bpt.phase)               AS phase,
                  COALESCE(st.csi_division, bpt.csi_division) AS csi_division,
                  COALESCE(st.sort_order, bpt.sort_order)     AS sort_order
           FROM schedule_tasks st
           LEFT JOIN blueprint_proposed_tasks bpt ON bpt.schedule_task_id = st.id
           WHERE st.id = $1 AND st.deleted_at IS NULL`,
          [id]
        );
        if (taskRows.length === 0) return null;
        const task = taskRows[0];

        // Build-out work steps for this task (Task Build-Out Engine output).
        const { rows: steps } = await client.query(
          `SELECT id, step_order, title, instruction, detail, code_refs, tools, materials, safety, equipment,
                  gating_inspection_type, qa_check, source
           FROM task_steps WHERE task_id = $1 AND deleted_at IS NULL ORDER BY step_order ASC`,
          [id]
        );
        // Inspection types the task's steps actually gate — used to scope the compliance panel.
        const gatingTypes = new Set<string>(
          steps.map((s: { gating_inspection_type: string | null }) => s.gating_inspection_type).filter(Boolean) as string[]
        );

        // Project geo for jurisdiction resolution.
        const { rows: projRows } = await client.query(
          `SELECT id, state, city, county_fips, county_name FROM projects WHERE id = $1 AND deleted_at IS NULL`,
          [task.project_id]
        );
        const project = projRows[0] ?? null;

        // Building type from the latest blueprint analysis for the project (else residential_sf).
        let buildingType: BuildingType = 'residential_sf';
        const { rows: baRows } = await client.query(
          `SELECT building_type FROM blueprint_analyses
           WHERE project_id = $1 AND deleted_at IS NULL
           ORDER BY created_at DESC LIMIT 1`,
          [task.project_id]
        );
        if (baRows[0]?.building_type && JURIS_BUILDING_TYPES.includes(baRows[0].building_type)) {
          buildingType = baRows[0].building_type as BuildingType;
        }

        // ── Codes + live inspection status for the task's trade ──
        let codes: Record<string, unknown> | null = null;
        const permitTrade = tradeToPermitTrade(task.trade_type);
        if (permitTrade && project?.state) {
          const rj = resolveJurisdiction({
            state: project.state,
            county_fips: project.county_fips,
            county_name: project.county_name,
            city: project.city,
            building_type: buildingType,
          });
          const tc = rj.trades[permitTrade];

          // Live AHJ inspections for this trade's permit(s) on the project, keyed by inspection_type.
          const { rows: permitRows } = await client.query(
            `SELECT id FROM permits
             WHERE project_id = $1 AND permit_type = $2 AND deleted_at IS NULL`,
            [task.project_id, permitTrade]
          );
          const permitIds = permitRows.map((p: { id: string }) => p.id);
          const inspByType = new Map<string, Record<string, unknown>>();
          if (permitIds.length > 0) {
            const { rows: inspRows } = await client.query(
              `SELECT id, permit_id, inspection_type, status, result, inspection_date, inspector_name
               FROM inspections
               WHERE permit_id = ANY($1::uuid[]) AND deleted_at IS NULL
               ORDER BY sequence_order ASC NULLS LAST, created_at ASC`,
              [permitIds]
            );
            for (const r of inspRows) {
              if (r.inspection_type && !inspByType.has(r.inspection_type)) inspByType.set(r.inspection_type, r);
            }
          }

          const fullCompliance = tc.steps.map((step) => {
            const insp = inspByType.get(step.inspection_type);
            return {
              inspection_type: step.inspection_type,
              title: step.title,
              code_hint: step.description ?? null,
              csi_division: step.csi_division,
              required: !step.required_for_building_types || step.required_for_building_types.length === 0
                || step.required_for_building_types.includes(buildingType),
              status: insp ? (insp.status as string) : 'not_created',
              result: insp ? (insp.result as string | null) : null,
              inspection_date: insp ? (insp.inspection_date as string | null) : null,
              inspector_name: insp ? (insp.inspector_name as string | null) : null,
              permit_id: insp ? (insp.permit_id as string) : (permitIds[0] ?? null),
            };
          });
          // Scope to the inspections THIS task's steps gate. Fall back to the full sequence only
          // when the task has no steps yet (pre-build), so nothing regresses before steps exist.
          const compliance = gatingTypes.size > 0
            ? fullCompliance.filter((c) => gatingTypes.has(c.inspection_type))
            : fullCompliance;

          // Union of code refs across this task's steps (deduped by code_type+section).
          const seen = new Set<string>();
          const taskCodeRefs: { code_type: string; section: string; note?: string }[] = [];
          for (const s of steps as { code_refs: { code_type: string; section: string; note?: string }[] }[]) {
            for (const ref of s.code_refs ?? []) {
              const k = `${ref.code_type} ${ref.section}`;
              if (!seen.has(k)) { seen.add(k); taskCodeRefs.push(ref); }
            }
          }

          codes = {
            permit_trade: permitTrade,
            code_type: tc.code_type,
            code_edition: tc.code_edition,
            nec_edition: tc.nec_edition,
            jurisdiction_notes: tc.jurisdiction_notes,
            ahj: rj.ahj,
            task_code_refs: taskCodeRefs,
            compliance,
            has_permit: permitIds.length > 0,
            task_scoped: gatingTypes.size > 0,
          };
        }

        // ── Dependencies (predecessors + successors) ──
        const { rows: predecessors } = await client.query(
          `SELECT td.id, td.dependency_type, td.origin, p.id AS task_id, p.title, p.status
           FROM task_dependencies td
           JOIN schedule_tasks p ON p.id = td.predecessor_task_id AND p.deleted_at IS NULL
           WHERE td.successor_task_id = $1 AND td.deleted_at IS NULL`,
          [id]
        );
        const { rows: successors } = await client.query(
          `SELECT td.id, td.dependency_type, td.origin, s.id AS task_id, s.title, s.status
           FROM task_dependencies td
           JOIN schedule_tasks s ON s.id = td.successor_task_id AND s.deleted_at IS NULL
           WHERE td.predecessor_task_id = $1 AND td.deleted_at IS NULL`,
          [id]
        );

        // ── QA photos ──
        const { rows: photoRows } = await client.query(
          `SELECT stp.id, stp.storage_path, stp.caption, stp.photo_type, stp.uploaded_by, stp.created_at,
                  u.first_name, u.last_name
           FROM schedule_task_photos stp
           LEFT JOIN users u ON u.id = stp.uploaded_by
           WHERE stp.task_id = $1 AND stp.deleted_at IS NULL
           ORDER BY stp.created_at DESC`,
          [id]
        );

        // ── Equipment rollup (union across the task's steps, deduped by canonical type) ──
        type EquipItem = { type: string; category: string; reason: string; optional?: boolean;
          owned_count?: number; available_count?: number; asset_ids?: string[] };
        const equipByType = new Map<string, EquipItem>();
        for (const s of steps as { equipment?: EquipItem[] }[]) {
          for (const e of s.equipment ?? []) {
            const existing = equipByType.get(e.type);
            if (!existing) {
              equipByType.set(e.type, { type: e.type, category: e.category, reason: e.reason, optional: e.optional });
            } else if (!e.optional) {
              existing.optional = false; // required in any step ⇒ required overall
            }
          }
        }
        const taskEquipment = [...equipByType.values()];

        // ── EAM enrichment (Business+): match against the tenant's fleet by asset_type ──
        if (taskEquipment.length > 0) {
          let businessTier = false;
          try { await assertTier(tenant_id, 'BUSINESS'); businessTier = true; } catch { /* lower tier — recommend only */ }
          if (businessTier) {
            const { rows: fleet } = await client.query(
              `SELECT asset_type,
                      COUNT(*)::int AS owned,
                      COUNT(*) FILTER (WHERE status = 'active')::int AS available,
                      array_remove(array_agg(id) FILTER (WHERE status = 'active'), NULL) AS ids
               FROM company_assets
               WHERE asset_type = ANY($1::text[]) AND deleted_at IS NULL
               GROUP BY asset_type`,
              [taskEquipment.map((e) => e.type)]
            );
            const byType = new Map(fleet.map((r: { asset_type: string; owned: number; available: number; ids: string[] | null }) => [r.asset_type, r]));
            for (const e of taskEquipment) {
              const m = byType.get(e.type);
              e.owned_count = m ? m.owned : 0;
              e.available_count = m ? m.available : 0;
              e.asset_ids = m?.ids ?? [];
            }
          }
        }

        return { task, codes, steps, predecessors, successors, photos: photoRows, task_equipment: taskEquipment };
      });

      if (!data) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Schedule task not found' } });

      // Presigned download URLs for photos (outside the tenant txn — pure S3 signing).
      const photos = await Promise.all(
        data.photos.map(async (p: Record<string, unknown>) => {
          let download_url: string | null = null;
          try { download_url = await generateDownloadUrl(p.storage_path as string); } catch { /* non-fatal */ }
          return { ...p, download_url };
        })
      );

      return reply.status(200).send({
        task: data.task,
        codes: data.codes,
        steps: data.steps,
        task_equipment: data.task_equipment,
        predecessors: data.predecessors,
        successors: data.successors,
        photos,
      });
    }
  );

  // ─── POST /v1/schedule-tasks/:id/photos ─────────────────────────────────────────────────────
  // Attach an already-scanned file (from POST /v1/files/upload → live) to a task as a QA/proof photo.
  app.post('/schedule-tasks/:id/photos', { preHandler: [authenticate, requireRole(...PHOTO_UPLOAD_ROLES)] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as { id: string };
      const body = PhotoCreateSchema.safeParse(req.body);
      if (!body.success) return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: 'Validation failed', fields: body.error.errors.map(e => ({ field: e.path.join('.'), message: e.message })) } });
      const { tenant_id, user_id, email, role } = req.jwt;
      const { file_id, caption, photo_type } = body.data;

      const result = await withTenantContext(tenant_id, async (client) => {
        const { rows: taskRows } = await client.query(`SELECT id FROM schedule_tasks WHERE id = $1 AND deleted_at IS NULL`, [id]);
        if (taskRows.length === 0) return { status: 'task_not_found' as const };

        // File must exist, belong to the tenant, and have passed scanning (status ready + live path).
        const { rows: fileRows } = await client.query(
          `SELECT id, status, storage_path FROM files WHERE id = $1 AND deleted_at IS NULL`,
          [file_id]
        );
        const file = fileRows[0];
        if (!file) return { status: 'file_not_found' as const };
        if (file.status !== 'ready' || !file.storage_path) return { status: 'file_not_ready' as const };

        const { rows } = await client.query(
          `INSERT INTO schedule_task_photos (tenant_id, task_id, storage_path, caption, photo_type, uploaded_by)
           VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
          [tenant_id, id, file.storage_path, caption ?? null, photo_type, user_id]
        );
        await writeAuditEntry(client, { tenantId: tenant_id, category: 'data', action: 'task_photo.added', actorId: user_id, actorEmail: email, actorRole: role, resourceType: 'schedule_task', resourceId: id, payload: { photo_id: rows[0].id, photo_type }, ipAddress: req.ip });
        return { status: 'ok' as const, row: rows[0] };
      });

      if (result.status === 'task_not_found') return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Schedule task not found' } });
      if (result.status === 'file_not_found') return reply.status(404).send({ error: { code: 'FILE_NOT_FOUND', message: 'File not found' } });
      if (result.status === 'file_not_ready') return reply.status(409).send({ error: { code: 'FILE_NOT_READY', message: 'File is still scanning or was rejected' } });

      let download_url: string | null = null;
      try { download_url = await generateDownloadUrl(result.row.storage_path); } catch { /* non-fatal */ }
      return reply.status(201).send({ photo: { ...result.row, download_url } });
    }
  );

  // ─── GET /v1/schedule-tasks/:id/photos ──────────────────────────────────────────────────────
  app.get('/schedule-tasks/:id/photos', { preHandler: [authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as { id: string };
      const { tenant_id } = req.jwt;
      const rows = await withTenantContext(tenant_id, async (client) => {
        const { rows: r } = await client.query(
          `SELECT stp.id, stp.storage_path, stp.caption, stp.photo_type, stp.uploaded_by, stp.created_at,
                  u.first_name, u.last_name
           FROM schedule_task_photos stp
           LEFT JOIN users u ON u.id = stp.uploaded_by
           WHERE stp.task_id = $1 AND stp.deleted_at IS NULL
           ORDER BY stp.created_at DESC`,
          [id]
        );
        return r;
      });
      const photos = await Promise.all(rows.map(async (p: Record<string, unknown>) => {
        let download_url: string | null = null;
        try { download_url = await generateDownloadUrl(p.storage_path as string); } catch { /* non-fatal */ }
        return { ...p, download_url };
      }));
      return reply.status(200).send({ photos });
    }
  );

  // ─── DELETE /v1/schedule-tasks/:id/photos/:photoId ──────────────────────────────────────────
  // OWNER/PM may remove any photo; other roles only their own uploads.
  app.delete('/schedule-tasks/:id/photos/:photoId', { preHandler: [authenticate, requireRole(...PHOTO_UPLOAD_ROLES)] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id, photoId } = req.params as { id: string; photoId: string };
      const { tenant_id, user_id, email, role } = req.jwt;
      const isManager = role.toUpperCase() === 'OWNER' || role.toUpperCase() === 'PROJECT_MANAGER';

      const result = await withTenantContext(tenant_id, async (client) => {
        const { rows } = await client.query(
          `SELECT id, uploaded_by FROM schedule_task_photos WHERE id = $1 AND task_id = $2 AND deleted_at IS NULL`,
          [photoId, id]
        );
        if (rows.length === 0) return { status: 'not_found' as const };
        if (!isManager && rows[0].uploaded_by !== user_id) return { status: 'forbidden' as const };
        await client.query(`UPDATE schedule_task_photos SET deleted_at = NOW() WHERE id = $1`, [photoId]);
        await writeAuditEntry(client, { tenantId: tenant_id, category: 'data', action: 'task_photo.removed', actorId: user_id, actorEmail: email, actorRole: role, resourceType: 'schedule_task', resourceId: id, payload: { photo_id: photoId }, ipAddress: req.ip });
        return { status: 'ok' as const };
      });

      if (result.status === 'not_found') return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Photo not found' } });
      if (result.status === 'forbidden') return reply.status(403).send({ error: { code: 'FORBIDDEN', message: 'You can only remove your own photos' } });
      return reply.status(204).send();
    }
  );

  // ─── POST /v1/schedule-tasks/:id/build-steps ────────────────────────────────────────────────
  // (Re)build one task's work steps via the Task Build-Out Engine. OWNER/PM.
  app.post('/schedule-tasks/:id/build-steps', { preHandler: [authenticate, requireRole(...WRITE_ROLES)] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as { id: string };
      const { tenant_id } = req.jwt;
      const out = await withTenantContext(tenant_id, async (client) => {
        const { rows } = await client.query(
          `SELECT st.id, st.project_id, st.title, st.description,
                  COALESCE(st.trade_type, bpt.trade_type)     AS trade_type,
                  COALESCE(st.phase, bpt.phase)               AS phase,
                  COALESCE(st.csi_division, bpt.csi_division) AS csi_division
           FROM schedule_tasks st
           LEFT JOIN blueprint_proposed_tasks bpt ON bpt.schedule_task_id = st.id
           WHERE st.id = $1 AND st.deleted_at IS NULL`,
          [id]
        );
        if (rows.length === 0) return null;
        const task = rows[0];
        const { rows: ba } = await client.query(
          `SELECT id FROM blueprint_analyses WHERE project_id = $1 AND deleted_at IS NULL ORDER BY created_at DESC LIMIT 1`,
          [task.project_id]
        );
        const analysisId = ba[0]?.id ?? null;
        const taskRow: BuildoutTaskRow = {
          id: task.id, trade_type: task.trade_type, phase: task.phase,
          csi_division: task.csi_division, title: task.title, description: task.description,
        };
        const stepCount = await buildStepsForProjectTasks(client, tenant_id, task.project_id, [taskRow], analysisId);
        const { rows: steps } = await client.query(
          `SELECT id, step_order, title, instruction, detail, code_refs, tools, materials, safety, equipment,
                  gating_inspection_type, qa_check FROM task_steps
           WHERE task_id = $1 AND deleted_at IS NULL ORDER BY step_order ASC`,
          [id]
        );
        return { stepCount, steps };
      });
      if (!out) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Schedule task not found' } });
      return reply.status(200).send({ step_count: out.stepCount, steps: out.steps });
    }
  );

  // ─── POST /v1/schedule-tasks/project/:projectId/build-steps ─────────────────────────────────
  // Rebuild work steps for ALL of a project's tasks (backfills tasks created before the engine). OWNER/PM.
  app.post('/schedule-tasks/project/:projectId/build-steps', { preHandler: [authenticate, requireRole(...WRITE_ROLES)] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { projectId } = req.params as { projectId: string };
      const { tenant_id } = req.jwt;
      const out = await withTenantContext(tenant_id, async (client) => {
        const { rows: proj } = await client.query(`SELECT id FROM projects WHERE id = $1 AND deleted_at IS NULL`, [projectId]);
        if (proj.length === 0) return null;
        const { rows: tasks } = await client.query(
          `SELECT st.id, st.title, st.description,
                  COALESCE(st.trade_type, bpt.trade_type)     AS trade_type,
                  COALESCE(st.phase, bpt.phase)               AS phase,
                  COALESCE(st.csi_division, bpt.csi_division) AS csi_division
           FROM schedule_tasks st
           LEFT JOIN blueprint_proposed_tasks bpt ON bpt.schedule_task_id = st.id
           WHERE st.project_id = $1 AND st.deleted_at IS NULL`,
          [projectId]
        );
        const { rows: ba } = await client.query(
          `SELECT id FROM blueprint_analyses WHERE project_id = $1 AND deleted_at IS NULL ORDER BY created_at DESC LIMIT 1`,
          [projectId]
        );
        const analysisId = ba[0]?.id ?? null;
        const taskRows: BuildoutTaskRow[] = tasks.map((t: BuildoutTaskRow) => ({
          id: t.id, trade_type: t.trade_type, phase: t.phase, csi_division: t.csi_division, title: t.title, description: t.description,
        }));
        const stepCount = await buildStepsForProjectTasks(client, tenant_id, projectId, taskRows, analysisId);
        return { stepCount, taskCount: taskRows.length };
      });
      if (!out) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Project not found' } });
      return reply.status(200).send({ step_count: out.stepCount, task_count: out.taskCount });
    }
  );

  // ─── POST /v1/schedule-tasks/project/:projectId/recompute-dependencies ───────────────────────
  // Re-run the prerequisite rule engine over the project's CURRENT tasks (after the user edited
  // phase / trade / sort_order). Replaces origin='rule_engine' edges, PRESERVES manual edges. OWNER/PM.
  app.post('/schedule-tasks/project/:projectId/recompute-dependencies', { preHandler: [authenticate, requireRole(...WRITE_ROLES)] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { projectId } = req.params as { projectId: string };
      const { tenant_id, user_id, email, role } = req.jwt;
      const out = await withTenantContext(tenant_id, async (client) => {
        const { rows: proj } = await client.query(`SELECT id FROM projects WHERE id = $1 AND deleted_at IS NULL`, [projectId]);
        if (proj.length === 0) return null;
        const count = await recomputeProjectDependencies(client, tenant_id, projectId, { userId: user_id, email, role });
        return { count };
      });
      if (!out) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Project not found' } });
      return reply.status(200).send({ dependency_count: out.count });
    }
  );
}
