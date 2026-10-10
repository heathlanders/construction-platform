// workers/time-punch-worker.ts — Midnight auto-clockout job handlers
//
// Job types:
//   time_punches.auto_clockout_scan  — platform-level scan, enqueues per-tenant jobs
//   time_punches.auto_clockout       — per-tenant: close all open punches at 23:55 UTC
//
// Pattern mirrors field-cost-worker.ts (scan → per-tenant fan-out).
// Scheduled via boss.schedule in index.ts start().
//
// Locked decisions: T-10 (tenant_id in envelope), T-42 (withTenantContext), A-14 (pg-boss)

import { sendJob } from '../lib/queue.js';
import { withTenantContext } from '../lib/tenant-context.js';
import { createNotification } from '../lib/notify.js';
import { writeAuditEntry } from '../lib/audit-log.js';
import { pgPool } from '../lib/db.js';

// ─── Platform-level scan ──────────────────────────────────────────────────────

/**
 * time_punches.auto_clockout_scan
 * Reads all active tenants (no tenant context — platform-level query) and
 * enqueues a per-tenant auto_clockout job for each.
 */
export async function handleTimePunchAutoClockoutScan(
  _payload: Record<string, unknown>,
): Promise<void> {
  const client = await pgPool.connect();
  try {
    const { rows: tenants } = await client.query<{ id: string }>(
      `SELECT id FROM tenants
       WHERE status IN ('trial', 'active', 'grace_period')
         AND deleted_at IS NULL`,
    );

    for (const tenant of tenants) {
      await sendJob('time_punches.auto_clockout', tenant.id, { triggered_by: 'cron' });
    }

    console.info({ count: tenants.length }, 'time_punches.auto_clockout_scan: enqueued per-tenant jobs');
  } finally {
    client.release();
  }
}

// ─── Per-tenant handler ───────────────────────────────────────────────────────

/**
 * time_punches.auto_clockout
 * Finds all open punches for the tenant and closes them at current time.
 * Creates time_entry for each closed punch (if project_id is set).
 * Sends in-app notification to each affected employee.
 */
export async function handleTimePunchAutoClockout(
  tenantId: string,
  _payload: Record<string, unknown>,
): Promise<void> {
  await withTenantContext(tenantId, async (client) => {
    // Find all open punches and lock rows
    const { rows: openPunches } = await client.query(
      `SELECT tp.*, u.id AS worker_id
       FROM time_punches tp
       JOIN users u ON u.id = tp.user_id AND u.deleted_at IS NULL
       WHERE tp.tenant_id = $1 AND tp.clock_out_at IS NULL AND tp.deleted_at IS NULL
       FOR UPDATE`,
      [tenantId]
    );

    if (openPunches.length === 0) {
      return;
    }

    const clockOutAt = new Date();
    let closedCount = 0;

    for (const punch of openPunches) {
      const clockInAt = new Date(punch.clock_in_at);
      const raw = (clockOutAt.getTime() - clockInAt.getTime()) / 3_600_000;
      const hoursWorked = Math.max(0.25, Math.round(raw * 100) / 100);

      let timeEntryId: string | null = null;

      // Only create time_entry if project_id is set
      if (punch.project_id) {
        try {
          const date = clockInAt.toISOString().slice(0, 10);

          // Check for existing clock-in-out entry for same user+project+date
          const { rows: existing } = await client.query(
            `SELECT id, hours_worked, notes, version FROM time_entries
             WHERE tenant_id = $1 AND user_id = $2 AND project_id = $3
               AND date = $4 AND deleted_at IS NULL
             FOR UPDATE`,
            [tenantId, punch.user_id, punch.project_id, date]
          );

          if (existing.length > 0 && (existing[0].notes ?? '').includes('Via clock in/out')) {
            const { rows: updated } = await client.query(
              `UPDATE time_entries
               SET hours_worked = hours_worked + $2, updated_at = NOW()
               WHERE id = $1
               RETURNING id`,
              [existing[0].id, hoursWorked]
            );
            timeEntryId = updated[0]?.id ?? null;
          } else {
            const { rows: inserted } = await client.query(
              `INSERT INTO time_entries
                 (tenant_id, project_id, user_id, date, hours_worked,
                  cost_code_id, notes, hourly_rate_cents, created_by)
               VALUES ($1, $2, $3, $4, $5, $6, 'Via clock in/out', NULL, $3)
               RETURNING id`,
              [tenantId, punch.project_id, punch.user_id, date,
               hoursWorked, punch.cost_code_id ?? null]
            );
            timeEntryId = inserted[0]?.id ?? null;
          }
        } catch (err) {
          console.warn({ tenantId, punchId: punch.id, err }, 'auto_clockout: failed to create time_entry — continuing');
        }
      }

      // Close the punch
      await client.query(
        `UPDATE time_punches
         SET clock_out_at    = $2,
             hours_worked    = $3,
             auto_clocked_out = TRUE,
             time_entry_id   = $4
         WHERE id = $1`,
        [punch.id, clockOutAt.toISOString(), hoursWorked, timeEntryId]
      );

      // Notify the employee
      await createNotification(client, tenantId, {
        userId: punch.user_id,
        title: 'Auto Clock-Out',
        body: 'You were automatically clocked out at end of day. Please review your timecard.',
        category: 'system',
        data: { punch_id: punch.id, hours_worked: hoursWorked },
      });

      closedCount++;
    }

    await writeAuditEntry(client, {
      tenantId,
      category: 'data',
      action: 'time_punch.auto_clockout_batch',
      actorId: undefined,
      actorEmail: 'system',
      actorRole: 'system',
      resourceType: 'time_punch',
      resourceId: undefined,
      payload: { count: closedCount },
      ipAddress: undefined,
    });

    console.info({ tenantId, closedCount }, 'time_punches.auto_clockout: closed open punches');
  });
}
