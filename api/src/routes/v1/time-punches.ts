// routes/v1/time-punches.ts — Clock in/out for W2 employees
//
// POST   /v1/time-punches/clock-in   — start a punch (project optional at clock-in)
// POST   /v1/time-punches/clock-out  — end punch, calc hours, auto-create/update time_entry
// GET    /v1/time-punches/active     — live "who's on the clock" board (OWNER/PM only)
// GET    /v1/time-punches            — list punches with filters
// PATCH  /v1/time-punches/:id        — admin correction (OWNER/PM only)
//
// Static sub-paths registered BEFORE /:id to avoid Fastify path shadowing.
//
// Locked decisions: T-01 (cursor pagination), T-02 (cents), T-03 (UUID),
//   T-04 (TIMESTAMPTZ), T-12 (optimistic lock), A-03 (RLS / withTenantContext)

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import type { PoolClient } from 'pg';
import { z } from 'zod';
import { withTenantContext } from '../../lib/tenant-context.js';
import { writeAuditEntry } from '../../lib/audit-log.js';
import { authenticate, requireRole } from '../../plugins/auth-plugin.js';

const MANAGER_ROLES = ['OWNER', 'PROJECT_MANAGER'] as const;
const WORKER_ROLES  = ['OWNER', 'PROJECT_MANAGER', 'FOREMAN', 'FIELD_TECH'] as const;
// Roles that may add/edit/delete ANOTHER user's punches. Everyone else = self only.
const EDIT_ANY_ROLES = ['OWNER', 'PROJECT_MANAGER'];
const canEditAny = (role: string) => EDIT_ANY_ROLES.includes(role);

// ─── Schemas ─────────────────────────────────────────────────────────────────

const ClockInSchema = z.object({
  project_id:   z.string().uuid().optional(),
  cost_code_id: z.string().uuid().optional(),
  notes:        z.string().max(1000).optional(),
  // OQ-17 additive half (Doc 20 Phase 6a): device GPS at clock-in. Optional — GPS denied/absent
  // never blocks a punch. Both-or-neither enforced below.
  clock_in_lat: z.number().min(-90).max(90).optional(),
  clock_in_lng: z.number().min(-180).max(180).optional(),
}).refine((d) => (d.clock_in_lat === undefined) === (d.clock_in_lng === undefined), {
  message: 'clock_in_lat and clock_in_lng must be provided together',
});

const ClockOutSchema = z.object({
  punch_id:     z.string().uuid().optional(), // omit to auto-resolve current user's open punch
  project_id:   z.string().uuid().optional(), // overrides clock-in project_id
  cost_code_id: z.string().uuid().optional(),
  notes:        z.string().max(1000).optional(),
  version:      z.number().int().min(0),
});

const ListQuerySchema = z.object({
  user_id:   z.string().uuid().optional(),
  date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  date_to:   z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  status:    z.enum(['open', 'closed']).optional(),
  project_id: z.string().uuid().optional(),
  cursor:    z.string().uuid().optional(),
  limit:     z.coerce.number().int().min(1).max(100).default(20),
});

const PatchSchema = z.object({
  project_id:   z.string().uuid().nullable().optional(),
  cost_code_id: z.string().uuid().nullable().optional(),
  clock_in_at:  z.string().datetime().optional(),
  clock_out_at: z.string().datetime().optional(),
  notes:        z.string().max(1000).optional(),
  version:      z.number().int().min(1),
});

// Add a completed ("missed") punch with explicit in/out timestamps — enterprise
// self-service for a forgotten clock, or a manager entering a crew member's time.
const CreatePunchSchema = z.object({
  user_id:      z.string().uuid().optional(),   // managers only; defaults to self
  project_id:   z.string().uuid().optional(),   // optional
  cost_code_id: z.string().uuid().optional(),
  clock_in_at:  z.string().datetime(),
  clock_out_at: z.string().datetime(),
  notes:        z.string().max(1000).optional(),
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Round hours to 2 dp; enforce 0.25h minimum */
function calcHours(clockInAt: Date, clockOutAt: Date): number {
  const raw = (clockOutAt.getTime() - clockInAt.getTime()) / 3_600_000;
  const rounded = Math.round(raw * 100) / 100;
  return Math.max(0.25, rounded);
}

/** UTC calendar date (YYYY-MM-DD) of a timestamp — matches clock_in_at::date grouping. */
const CLOCK_ENTRY_MARKER = 'Via clock in/out';
function utcDate(ts: string | Date): string {
  return new Date(ts).toISOString().slice(0, 10);
}

/**
 * recomputeClockDay — the enterprise, edit-safe day rollup.
 *
 * The clock-in/out time_entry for a (user, date, project) is ALWAYS the SUM of
 * that day's CLOSED, non-deleted punches for that project. Recomputed from
 * scratch on every clock-out / missed-punch / edit / delete, so multiple
 * timestamps, corrections, and deletions all stay correct. Only touches entries
 * marked `${CLOCK_ENTRY_MARKER}` — manual time entries are never modified.
 * Clock entries whose punches all went away are soft-deleted.
 *
 * Runs inside the caller's transaction on the same PoolClient.
 */
async function recomputeClockDay(
  client: PoolClient,
  tenantId: string,
  userId: string,
  date: string,          // YYYY-MM-DD
  createdBy: string,
): Promise<void> {
  const hourlyRateCents = await getHourlyRate(client, userId);

  // Sum closed punches for the day, grouped by project (null-safe).
  const { rows: groups } = await client.query(
    `SELECT project_id,
            COALESCE(SUM(hours_worked), 0)::numeric  AS hours,
            MIN(cost_code_id::text)::uuid            AS cost_code_id
       FROM time_punches
      WHERE tenant_id = $1 AND user_id = $2
        AND clock_out_at IS NOT NULL AND deleted_at IS NULL
        AND (clock_in_at AT TIME ZONE 'UTC')::date = $3::date
      GROUP BY project_id`,
    [tenantId, userId, date]
  );

  const seen: (string | null)[] = [];
  for (const g of groups) {
    const pid = (g.project_id as string | null) ?? null;
    seen.push(pid);
    const hours = Number(g.hours);

    const { rows: existing } = await client.query(
      `SELECT id FROM time_entries
        WHERE tenant_id = $1 AND user_id = $2 AND date = $3
          AND project_id IS NOT DISTINCT FROM $4
          AND notes = $5 AND deleted_at IS NULL
        FOR UPDATE`,
      [tenantId, userId, date, pid, CLOCK_ENTRY_MARKER]
    );

    if (existing.length > 0) {
      await client.query(
        `UPDATE time_entries
            SET hours_worked = $2,
                hourly_rate_cents = COALESCE($3, hourly_rate_cents),
                updated_at = NOW()
          WHERE id = $1`,
        [existing[0].id, hours, hourlyRateCents]
      );
    } else {
      await client.query(
        `INSERT INTO time_entries
           (tenant_id, project_id, user_id, date, hours_worked,
            cost_code_id, notes, hourly_rate_cents, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [tenantId, pid, userId, date, hours,
         (g.cost_code_id as string | null) ?? null, CLOCK_ENTRY_MARKER, hourlyRateCents, createdBy]
      );
    }
  }

  // Soft-delete clock entries for this day whose project no longer has punches.
  const { rows: clockEntries } = await client.query(
    `SELECT id, project_id FROM time_entries
      WHERE tenant_id = $1 AND user_id = $2 AND date = $3
        AND notes = $4 AND deleted_at IS NULL`,
    [tenantId, userId, date, CLOCK_ENTRY_MARKER]
  );
  for (const e of clockEntries) {
    const pid = (e.project_id as string | null) ?? null;
    if (!seen.some((p) => p === pid)) {
      await client.query(
        `UPDATE time_entries SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1`,
        [e.id]
      );
    }
  }
}

/** Id of the clock time_entry for (user, date, project) after a recompute, if any. */
async function findClockEntryId(
  client: PoolClient, tenantId: string, userId: string, date: string, projectId: string | null,
): Promise<string | null> {
  const { rows } = await client.query(
    `SELECT id FROM time_entries
      WHERE tenant_id = $1 AND user_id = $2 AND date = $3
        AND project_id IS NOT DISTINCT FROM $4
        AND notes = $5 AND deleted_at IS NULL`,
    [tenantId, userId, date, projectId, CLOCK_ENTRY_MARKER]
  );
  return (rows[0]?.id as string | undefined) ?? null;
}

/** Fetch hourly_rate_cents from user_payroll_settings; returns null if none */
async function getHourlyRate(
  client: PoolClient,
  userId: string,
): Promise<number | null> {
  const { rows } = await client.query(
    `SELECT default_hourly_rate_cents FROM user_payroll_settings
     WHERE user_id = $1 AND deleted_at IS NULL`,
    [userId]
  );
  return rows[0]?.default_hourly_rate_cents ?? null;
}

/** Assert tenant is in clock_in_out mode */
async function assertClockInOutMode(
  client: PoolClient,
  tenantId: string,
): Promise<void> {
  const { rows } = await client.query(
    `SELECT time_tracking_mode FROM tenant_settings WHERE tenant_id = $1`,
    [tenantId]
  );
  const mode = rows[0]?.time_tracking_mode ?? 'manual';
  if (mode !== 'clock_in_out') {
    const err = new Error('TIME_TRACKING_MODE_MISMATCH');
    (err as NodeJS.ErrnoException).code = 'TIME_TRACKING_MODE_MISMATCH';
    throw err;
  }
}

// ─── Routes ───────────────────────────────────────────────────────────────────

export async function timePunchRoutes(app: FastifyInstance): Promise<void> {

  // ── POST /time-punches/clock-in ──────────────────────────────────────────
  app.post('/time-punches/clock-in', { preHandler: [authenticate, requireRole(...WORKER_ROLES)] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const body = ClockInSchema.safeParse(req.body);
      if (!body.success) {
        return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: 'Invalid request body' } });
      }
      const { tenant_id, user_id } = req.jwt;
      const { project_id, cost_code_id, notes, clock_in_lat, clock_in_lng } = body.data;

      const result = await withTenantContext(tenant_id, async (client) => {
        // Assert mode
        await assertClockInOutMode(client, tenant_id);

        // Assert no open punch for this user
        const { rows: open } = await client.query(
          `SELECT id, project_id, clock_in_at FROM time_punches
           WHERE tenant_id = $1 AND user_id = $2
             AND clock_out_at IS NULL AND deleted_at IS NULL`,
          [tenant_id, user_id]
        );
        if (open.length > 0) {
          return { error: 'PUNCH_ALREADY_OPEN', existing_punch: open[0] };
        }

        const { rows } = await client.query(
          `INSERT INTO time_punches
             (tenant_id, user_id, project_id, cost_code_id, notes, clock_in_lat, clock_in_lng, created_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           RETURNING *`,
          [tenant_id, user_id, project_id ?? null, cost_code_id ?? null, notes ?? null,
           clock_in_lat ?? null, clock_in_lng ?? null, user_id]
        );

        await writeAuditEntry(client, {
          tenantId: tenant_id,
          category: 'data',
          action: 'time_punch.clock_in',
          actorId: user_id,
          resourceType: 'time_punch',
          resourceId: rows[0].id,
          payload: { project_id: project_id ?? null },
        });

        return { punch: rows[0] };
      });

      if ('error' in result && result.error === 'PUNCH_ALREADY_OPEN') {
        return reply.status(409).send({
          error: {
            code: 'PUNCH_ALREADY_OPEN',
            message: 'You are already clocked in. Clock out first.',
          },
          existing_punch: result.existing_punch,
        });
      }
      if ('error' in result && (result.error as string) === 'TIME_TRACKING_MODE_MISMATCH') {
        return reply.status(422).send({
          error: { code: 'TIME_TRACKING_MODE_MISMATCH', message: 'Clock in/out is not enabled for this organization.' },
        });
      }

      return reply.status(201).send(result);
    }
  );

  // ── POST /time-punches/clock-out ─────────────────────────────────────────
  app.post('/time-punches/clock-out', { preHandler: [authenticate, requireRole(...WORKER_ROLES)] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const body = ClockOutSchema.safeParse(req.body);
      if (!body.success) {
        return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: 'version is required' } });
      }
      const { tenant_id, user_id } = req.jwt;
      const { punch_id, project_id, cost_code_id, notes, version } = body.data;

      const result = await withTenantContext(tenant_id, async (client) => {
        // Resolve the open punch
        let punchRow: Record<string, unknown>;
        if (punch_id) {
          const { rows } = await client.query(
            `SELECT * FROM time_punches
             WHERE id = $1 AND tenant_id = $2 AND user_id = $3
               AND clock_out_at IS NULL AND deleted_at IS NULL
             FOR UPDATE`,
            [punch_id, tenant_id, user_id]
          );
          if (!rows[0]) return 'not_found';
          punchRow = rows[0];
        } else {
          const { rows } = await client.query(
            `SELECT * FROM time_punches
             WHERE tenant_id = $1 AND user_id = $2
               AND clock_out_at IS NULL AND deleted_at IS NULL
             FOR UPDATE`,
            [tenant_id, user_id]
          );
          if (!rows[0]) return 'not_found';
          punchRow = rows[0];
        }

        // Optimistic lock
        if ((punchRow.version as number) !== version) {
          return 'conflict';
        }

        // Project is OPTIONAL — a worker may just clock time. Body overrides clock-in value.
        const finalProjectId = (project_id ?? (punchRow.project_id as string | null)) ?? null;
        const finalCostCodeId = (cost_code_id ?? (punchRow.cost_code_id as string | null)) ?? null;

        const clockInAt  = new Date(punchRow.clock_in_at as string);
        const clockOutAt = new Date();
        const hoursWorked = calcHours(clockInAt, clockOutAt);
        const date = utcDate(clockInAt);

        // Close the punch first (final project/cost so the recompute groups it correctly).
        const { rows: updated } = await client.query(
          `UPDATE time_punches
              SET clock_out_at = NOW(),
                  hours_worked = $2,
                  project_id   = $3,
                  cost_code_id = $4,
                  notes        = COALESCE($5, notes)
            WHERE id = $1
            RETURNING *`,
          [punchRow.id, hoursWorked, finalProjectId, finalCostCodeId, notes ?? null]
        );

        // Recompute the day's clock entries from ALL closed punches, then link this punch.
        await recomputeClockDay(client, tenant_id, user_id, date, user_id);
        const entryId = await findClockEntryId(client, tenant_id, user_id, date, finalProjectId);
        if (entryId) {
          await client.query(`UPDATE time_punches SET time_entry_id = $2 WHERE id = $1`, [punchRow.id, entryId]);
        }

        await writeAuditEntry(client, {
          tenantId: tenant_id,
          category: 'data',
          action: 'time_punch.clock_out',
          actorId: user_id,
          resourceType: 'time_punch',
          resourceId: punchRow.id as string,
          payload: { hours_worked: hoursWorked, project_id: finalProjectId },
        });

        // Return the FINAL row (version trigger bumps version on the link update).
        const { rows: fin } = await client.query(`SELECT * FROM time_punches WHERE id = $1`, [punchRow.id]);
        return { time_punch: fin[0], time_entry_id: entryId };
      });

      if (result === 'not_found') {
        return reply.status(404).send({ error: { code: 'NO_OPEN_PUNCH', message: 'No open punch found. You may not be clocked in.' } });
      }
      if (result === 'conflict') {
        return reply.status(409).send({ error: { code: 'VERSION_CONFLICT', message: 'Punch was modified. Refresh and try again.' } });
      }

      return reply.status(200).send(result);
    }
  );

  // ── POST /time-punches — add a completed ("missed") punch ────────────────
  // Enterprise self-service: a worker adds a forgotten in/out for themselves;
  // a manager may add for anyone. Recomputes the day so totals stay correct.
  app.post('/time-punches', { preHandler: [authenticate, requireRole(...WORKER_ROLES)] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const body = CreatePunchSchema.safeParse(req.body);
      if (!body.success) {
        return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: 'clock_in_at and clock_out_at are required (ISO 8601)' } });
      }
      const { tenant_id, user_id: actorId, role } = req.jwt;
      const d = body.data;
      const targetUserId = canEditAny(role) ? (d.user_id ?? actorId) : actorId;
      if (!canEditAny(role) && d.user_id && d.user_id !== actorId) {
        return reply.status(403).send({ error: { code: 'FORBIDDEN', message: 'You can only add your own time.' } });
      }
      const inAt = new Date(d.clock_in_at);
      const outAt = new Date(d.clock_out_at);
      if (!(outAt.getTime() > inAt.getTime())) {
        return reply.status(422).send({ error: { code: 'INVALID_RANGE', message: 'Clock-out must be after clock-in.' } });
      }

      const result = await withTenantContext(tenant_id, async (client) => {
        const { rows: modeRows } = await client.query(
          `SELECT time_tracking_mode FROM tenant_settings WHERE tenant_id = $1`, [tenant_id]);
        if ((modeRows[0]?.time_tracking_mode ?? 'manual') !== 'clock_in_out') return 'mode_mismatch';
        const hoursWorked = calcHours(inAt, outAt);
        const { rows } = await client.query(
          `INSERT INTO time_punches
             (tenant_id, user_id, project_id, cost_code_id, clock_in_at, clock_out_at, hours_worked, notes, created_by)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
           RETURNING *`,
          [tenant_id, targetUserId, d.project_id ?? null, d.cost_code_id ?? null,
           d.clock_in_at, d.clock_out_at, hoursWorked, d.notes ?? null, actorId]
        );
        const date = utcDate(inAt);
        await recomputeClockDay(client, tenant_id, targetUserId, date, actorId);
        const entryId = await findClockEntryId(client, tenant_id, targetUserId, date, d.project_id ?? null);
        if (entryId) {
          await client.query(`UPDATE time_punches SET time_entry_id = $2 WHERE id = $1`, [rows[0].id, entryId]);
        }
        await writeAuditEntry(client, {
          tenantId: tenant_id, category: 'data', action: 'time_punch.added',
          actorId, resourceType: 'time_punch', resourceId: rows[0].id as string,
          payload: { user_id: targetUserId, hours_worked: hoursWorked, project_id: d.project_id ?? null },
        });
        // Return the FINAL row — a version trigger bumps version on the link update.
        const { rows: fin } = await client.query(`SELECT * FROM time_punches WHERE id = $1`, [rows[0].id]);
        return { time_punch: fin[0] };
      });

      if (result === 'mode_mismatch') {
        return reply.status(422).send({ error: { code: 'TIME_TRACKING_MODE_MISMATCH', message: 'Clock in/out is not enabled for this organization.' } });
      }
      return reply.status(201).send(result);
    }
  );

  // ── GET /time-punches/active ─────────────────────────────────────────────
  app.get('/time-punches/active', { preHandler: [authenticate, requireRole(...MANAGER_ROLES)] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { tenant_id } = req.jwt;

      const active = await withTenantContext(tenant_id, async (client) => {
        const { rows } = await client.query(
          `SELECT
             tp.*,
             u.first_name, u.last_name, u.email,
             p.name AS project_name,
             ROUND(
               EXTRACT(EPOCH FROM (NOW() - tp.clock_in_at)) / 3600.0,
               2
             ) AS elapsed_hours
           FROM time_punches tp
           JOIN users u ON u.id = tp.user_id AND u.deleted_at IS NULL
           LEFT JOIN projects p ON p.id = tp.project_id AND p.deleted_at IS NULL
           WHERE tp.clock_out_at IS NULL AND tp.deleted_at IS NULL
           ORDER BY tp.clock_in_at ASC`,
          []
        );
        return rows;
      });

      return reply.status(200).send({ active_punches: active, count: active.length });
    }
  );

  // ── GET /time-punches ────────────────────────────────────────────────────
  app.get('/time-punches', { preHandler: [authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const query = ListQuerySchema.safeParse(req.query);
      if (!query.success) {
        return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: 'Invalid query parameters' } });
      }
      const { tenant_id, user_id: jwt_user_id, role } = req.jwt;
      const { user_id, date_from, date_to, status, project_id, cursor, limit } = query.data;

      // Scope: workers can only see their own punches
      const isManager = role === 'OWNER' || role === 'PROJECT_MANAGER';
      const effectiveUserId = isManager ? (user_id ?? null) : jwt_user_id;

      if (!isManager && user_id && user_id !== jwt_user_id) {
        return reply.status(403).send({ error: { code: 'FORBIDDEN', message: 'You may only view your own punches.' } });
      }

      const rows = await withTenantContext(tenant_id, async (client) => {
        const params: unknown[] = [limit + 1];
        const conditions: string[] = ['tp.deleted_at IS NULL'];

        if (effectiveUserId) {
          params.push(effectiveUserId);
          conditions.push(`tp.user_id = $${params.length}`);
        }
        if (date_from) {
          params.push(date_from);
          conditions.push(`tp.clock_in_at >= $${params.length}::date`);
        }
        if (date_to) {
          params.push(date_to);
          conditions.push(`tp.clock_in_at < ($${params.length}::date + interval '1 day')`);
        }
        if (status === 'open') {
          conditions.push('tp.clock_out_at IS NULL');
        } else if (status === 'closed') {
          conditions.push('tp.clock_out_at IS NOT NULL');
        }
        if (project_id) {
          params.push(project_id);
          conditions.push(`tp.project_id = $${params.length}`);
        }
        if (cursor) {
          params.push(cursor);
          conditions.push(`tp.id > $${params.length}`);
        }

        const where = `WHERE ${conditions.join(' AND ')}`;
        const { rows } = await client.query(
          `SELECT tp.*, u.first_name, u.last_name, p.name AS project_name
           FROM time_punches tp
           JOIN users u ON u.id = tp.user_id AND u.deleted_at IS NULL
           LEFT JOIN projects p ON p.id = tp.project_id AND p.deleted_at IS NULL
           ${where}
           ORDER BY tp.clock_in_at DESC, tp.id ASC
           LIMIT $1`,
          params
        );
        return rows;
      });

      const hasMore = rows.length > limit;
      const items = hasMore ? rows.slice(0, limit) : rows;
      return reply.status(200).send({
        time_punches: items,
        pagination: {
          has_more: hasMore,
          next_cursor: hasMore ? items[items.length - 1]?.id ?? null : null,
        },
      });
    }
  );

  // ── PATCH /time-punches/:id — correction (self or manager) ───────────────
  app.patch('/time-punches/:id', { preHandler: [authenticate, requireRole(...WORKER_ROLES)] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as { id: string };
      const body = PatchSchema.safeParse(req.body);
      if (!body.success) {
        return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: 'version is required' } });
      }
      const { tenant_id, user_id, role } = req.jwt;
      const { project_id, cost_code_id, clock_in_at, clock_out_at, notes, version } = body.data;

      const result = await withTenantContext(tenant_id, async (client) => {
        // Fetch current row
        const { rows: current } = await client.query(
          `SELECT * FROM time_punches WHERE id = $1 AND deleted_at IS NULL FOR UPDATE`,
          [id]
        );
        if (!current[0]) return 'not_found';
        // Field techs / foremen may only correct their OWN punches.
        if (!canEditAny(role) && (current[0].user_id as string) !== user_id) return 'forbidden';
        if ((current[0].version as number) !== version) return 'conflict';

        const before = { ...current[0] };

        // Build dynamic SET clause
        const sets: string[] = [];
        const params: unknown[] = [id];

        if (project_id !== undefined)  { params.push(project_id);  sets.push(`project_id = $${params.length}`); }
        if (cost_code_id !== undefined) { params.push(cost_code_id); sets.push(`cost_code_id = $${params.length}`); }
        if (clock_in_at !== undefined)  { params.push(clock_in_at);  sets.push(`clock_in_at = $${params.length}`); }
        if (clock_out_at !== undefined) { params.push(clock_out_at); sets.push(`clock_out_at = $${params.length}`); }
        if (notes !== undefined)        { params.push(notes);        sets.push(`notes = $${params.length}`); }

        if (sets.length === 0) {
          return current[0]; // No changes
        }

        const { rows: updated } = await client.query(
          `UPDATE time_punches SET ${sets.join(', ')} WHERE id = $1 RETURNING *`,
          params
        );
        const punch = updated[0];

        // Recompute hours from the (possibly edited) timestamps on a closed punch.
        if (punch.clock_out_at && (clock_in_at !== undefined || clock_out_at !== undefined)) {
          const newHours = calcHours(new Date(punch.clock_in_at as string), new Date(punch.clock_out_at as string));
          await client.query(`UPDATE time_punches SET hours_worked = $2 WHERE id = $1`, [id, newHours]);
          punch.hours_worked = newHours;
        }

        // Recompute the day rollup for every date/user the edit could have touched
        // (old + new date, and old + new user if a manager moved it). Robust to
        // project/time changes because the entry is re-summed from punches.
        const affected = new Set<string>();
        const beforeUser = before.user_id as string;
        const afterUser = punch.user_id as string;
        if (before.clock_out_at) affected.add(`${beforeUser}|${utcDate(before.clock_in_at as string)}`);
        if (punch.clock_out_at) affected.add(`${afterUser}|${utcDate(punch.clock_in_at as string)}`);
        for (const key of affected) {
          const [uid, dt] = key.split('|');
          await recomputeClockDay(client, tenant_id, uid, dt, user_id);
        }
        // Re-link this punch to its recomputed day entry.
        if (punch.clock_out_at) {
          const entryId = await findClockEntryId(client, tenant_id, afterUser, utcDate(punch.clock_in_at as string), (punch.project_id as string | null) ?? null);
          await client.query(`UPDATE time_punches SET time_entry_id = $2 WHERE id = $1`, [id, entryId]);
        }

        await writeAuditEntry(client, {
          tenantId: tenant_id,
          category: 'data',
          action: 'time_punch.corrected',
          actorId: user_id,
          resourceType: 'time_punch',
          resourceId: id,
          payload: { before, after: punch },
        });

        // Return the FINAL row (multiple UPDATEs above each bump version via trigger).
        const { rows: fin } = await client.query(`SELECT * FROM time_punches WHERE id = $1`, [id]);
        return fin[0];
      });

      if (result === 'not_found') return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Punch not found' } });
      if (result === 'forbidden') return reply.status(403).send({ error: { code: 'FORBIDDEN', message: 'You may only edit your own punches.' } });
      if (result === 'conflict')  return reply.status(409).send({ error: { code: 'VERSION_CONFLICT', message: 'Punch was modified. Refresh and try again.' } });

      return reply.status(200).send({ time_punch: result });
    }
  );

  // ── DELETE /time-punches/:id — remove a punch (self or manager) ──────────
  app.delete('/time-punches/:id', { preHandler: [authenticate, requireRole(...WORKER_ROLES)] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as { id: string };
      const { tenant_id, user_id, role } = req.jwt;

      const result = await withTenantContext(tenant_id, async (client) => {
        const { rows } = await client.query(
          `SELECT * FROM time_punches WHERE id = $1 AND deleted_at IS NULL FOR UPDATE`, [id]);
        if (!rows[0]) return 'not_found';
        const punch = rows[0];
        if (!canEditAny(role) && (punch.user_id as string) !== user_id) return 'forbidden';

        await client.query(`UPDATE time_punches SET deleted_at = NOW() WHERE id = $1`, [id]);

        // A closed punch contributed to a day rollup — recompute so the total drops.
        if (punch.clock_out_at) {
          await recomputeClockDay(client, tenant_id, punch.user_id as string, utcDate(punch.clock_in_at as string), user_id);
        }
        await writeAuditEntry(client, {
          tenantId: tenant_id, category: 'data', action: 'time_punch.deleted',
          actorId: user_id, resourceType: 'time_punch', resourceId: id,
          payload: { user_id: punch.user_id, hours_worked: punch.hours_worked },
        });
        return 'ok';
      });

      if (result === 'not_found') return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Punch not found' } });
      if (result === 'forbidden') return reply.status(403).send({ error: { code: 'FORBIDDEN', message: 'You may only delete your own punches.' } });
      return reply.status(204).send();
    }
  );
}
