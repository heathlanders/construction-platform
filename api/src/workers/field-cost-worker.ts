// workers/field-cost-worker.ts — Reconciliation job handlers
// Handles 4 job types that automatically propagate changes across financial domains
// Locked decisions: T-10, A-14
//
// Job types handled:
//   reconciliation.field_cost_rollup        — triggered by time_entry create/update
//   reconciliation.schedule_cost_projection — triggered by schedule_task percent_complete change
//   reconciliation.budget_co_adjustment     — triggered by change_order approval
//   reconciliation.budget_variance_alert    — triggered nightly per tenant
//
// Registration model: handlers are exported and called from the combined
// boss.work('jobs', ...) handler in stripe-worker.ts to avoid competing consumers
// on the same pg-boss queue.
//
// Nightly scan: boss.work('reconciliation.budget_variance_scan', ...) runs on its
// own named queue and dispatches per-tenant budget_variance_alert jobs.

import { getQueue, sendJob } from '../lib/queue.js';
import { withTenantContext } from '../lib/tenant-context.js';
import { pgPool } from '../lib/db.js';
import { createNotification } from '../lib/notify.js';

// ─── Individual job handlers ─────────────────────────────────────────────────

/**
 * reconciliation.field_cost_rollup
 * Re-aggregates actual_cents on a budget_line_item from all linked time entries.
 * Triggered: POST/PATCH /v1/time-entries when budget_line_item_id is set
 */
export async function handleFieldCostRollup(
  tenantId: string,
  payload: Record<string, unknown>
): Promise<void> {
  const budget_line_item_id = payload.budget_line_item_id as string | undefined;
  if (!budget_line_item_id) {
    console.info({ tenantId }, 'field_cost_rollup: no budget_line_item_id — skipping');
    return;
  }

  await withTenantContext(tenantId, async (client) => {
    await client.query(
      `UPDATE budget_line_items
       SET actual_cents = (
         SELECT COALESCE(
           SUM(FLOOR(hours_worked::numeric * COALESCE(hourly_rate_cents, 0))::int),
           0
         )
         FROM time_entries
         WHERE budget_line_item_id = $1
           AND deleted_at IS NULL
       ),
       updated_at = NOW()
       WHERE id = $1 AND deleted_at IS NULL`,
      [budget_line_item_id]
    );
  });

  console.info({ tenantId, budget_line_item_id }, 'field_cost_rollup: actual_cents updated');
}

/**
 * reconciliation.schedule_cost_projection
 * Projects final cost on budget line items linked (via bid_packages) to a schedule task.
 * Triggered: PATCH /v1/schedule-tasks/:id when percent_complete changes
 *
 * Formula: projected_final_cents = actual_cents / (percent_complete / 100)
 * Falls back to budget_cents when percent_complete = 0 (no progress yet).
 */
export async function handleScheduleCostProjection(
  tenantId: string,
  payload: Record<string, unknown>
): Promise<void> {
  const schedule_task_id = payload.schedule_task_id as string | undefined;
  const percent_complete = payload.percent_complete as number | undefined;

  if (!schedule_task_id || percent_complete === undefined || percent_complete <= 0) {
    console.info({ tenantId, schedule_task_id, percent_complete }, 'schedule_cost_projection: skipping — no task or zero progress');
    return;
  }

  await withTenantContext(tenantId, async (client) => {
    // Find budget_line_items linked to bid_packages that reference this schedule task
    await client.query(
      `UPDATE budget_line_items bli
       SET projected_final_cents = CASE
         WHEN $1 > 0
         THEN FLOOR(actual_cents::float / ($1::float / 100.0))::int
         ELSE budget_cents
       END,
       updated_at = NOW()
       FROM bid_packages bp
       WHERE bp.schedule_task_id = $2
         AND bli.project_id = bp.project_id
         AND bli.deleted_at IS NULL
         AND bp.deleted_at IS NULL`,
      [percent_complete, schedule_task_id]
    );
  });

  console.info({ tenantId, schedule_task_id, percent_complete }, 'schedule_cost_projection: projected_final_cents updated');
}

/**
 * reconciliation.budget_co_adjustment
 * Updates contracts.approved_co_value_cents to sum of all approved change orders.
 * Triggered: POST /v1/change-orders/:id/approve when contract_id is set
 */
export async function handleBudgetCoAdjustment(
  tenantId: string,
  payload: Record<string, unknown>
): Promise<void> {
  const contract_id = payload.contract_id as string | undefined;
  if (!contract_id) {
    console.info({ tenantId }, 'budget_co_adjustment: no contract_id — skipping');
    return;
  }

  await withTenantContext(tenantId, async (client) => {
    await client.query(
      `UPDATE contracts
       SET approved_co_value_cents = (
         SELECT COALESCE(SUM(amount_cents), 0)
         FROM change_orders
         WHERE contract_id = $1
           AND status = 'approved'
           AND deleted_at IS NULL
       ),
       updated_at = NOW()
       WHERE id = $1 AND deleted_at IS NULL`,
      [contract_id]
    );
  });

  console.info({ tenantId, contract_id }, 'budget_co_adjustment: approved_co_value_cents updated');
}

/**
 * reconciliation.budget_variance_alert
 * Per-tenant nightly check: notify PMs of projects where projected final > budget by 10%+
 * Triggered: dispatched by nightly budget_variance_scan job (per tenant)
 */
export async function handleBudgetVarianceAlert(
  tenantId: string,
  _payload: Record<string, unknown>
): Promise<void> {
  await withTenantContext(tenantId, async (client) => {
    // Find over-budget projects and their PMs
    const { rows: overBudget } = await client.query(
      `SELECT DISTINCT
         bli.project_id,
         p.name AS project_name,
         u.id AS pm_user_id,
         u.language_preference
       FROM budget_line_items bli
       JOIN projects p ON p.id = bli.project_id
       JOIN project_members pm ON pm.project_id = p.id
         AND pm.role IN ('project_manager', 'owner')
       JOIN users u ON u.id = pm.user_id
         AND u.deleted_at IS NULL
         AND u.status = 'active'
       WHERE bli.deleted_at IS NULL
         AND p.deleted_at IS NULL
         AND p.status = 'active'
         AND bli.projected_final_cents > 0
         AND (bli.projected_final_cents - bli.budget_cents) > (bli.budget_cents * 0.1)`,
      []
    );

    for (const row of overBudget) {
      // De-duped per user per project per day via ON CONFLICT DO NOTHING
      // Uniqueness enforced by checking existing notification in last 24h
      const { rows: existing } = await client.query(
        `SELECT id FROM notifications
         WHERE tenant_id = $1
           AND user_id = $2
           AND category = 'financial'
           AND data->>'project_id' = $3
           AND created_at > NOW() - INTERVAL '24 hours'
         LIMIT 1`,
        [tenantId, row.pm_user_id, row.project_id]
      );
      if (existing.length > 0) continue;

      await createNotification(client, tenantId, {
        userId: row.pm_user_id,
        title: 'Budget Alert',
        body: `Project "${row.project_name}" is projected to exceed budget by more than 10%.`,
        category: 'financial',
        data: { project_id: row.project_id, type: 'budget_variance_alert' },
      });
    }
  });

  console.info({ tenantId }, 'budget_variance_alert: notifications written');
}

// ─── Worker registration ─────────────────────────────────────────────────────

export async function startFieldCostWorker(): Promise<void> {
  const boss = await getQueue();

  // Nightly budget variance scan — runs on its own named queue (T-10 compliant:
  // this queue name acts as the job type, no tenant_id required for the scan itself).
  // The handler queries all active tenants and dispatches per-tenant alert jobs.
  await boss.work('reconciliation.budget_variance_scan', async () => {
    const { rows: tenants } = await pgPool.query(
      `SELECT id FROM tenants WHERE deleted_at IS NULL AND status IN ('trial', 'active')`
    );
    for (const tenant of tenants) {
      await sendJob('reconciliation.budget_variance_alert', tenant.id, {});
    }
    console.info({ tenantCount: tenants.length }, 'budget_variance_scan: dispatched per-tenant jobs');
  });

  console.info('field-cost-worker: registered budget_variance_scan worker');
}
