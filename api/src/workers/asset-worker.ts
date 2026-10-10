// workers/asset-worker.ts — Asset management background jobs
// Locked decisions: T-10 (tenant_id in envelope), T-56 (Business+)
// Jobs: daily_expiry_check, monthly_depreciation, sync_depreciation_to_qb, overdue_checkout_alert

import { PoolClient } from 'pg';
import { withTenantContext } from '../lib/tenant-context.js';

// ── Job Dispatcher ─────────────────────────────────────────────────────────

export async function dispatchAssetJob(
  jobType: string,
  tenantId: string,
  payload: Record<string, unknown>,
): Promise<void> {
  switch (jobType) {
    case 'asset.daily_expiry_check':
      await handleAssetDailyExpiryCheck(tenantId, payload);
      break;
    case 'asset.monthly_depreciation':
      await handleAssetMonthlyDepreciation(tenantId, payload);
      break;
    case 'asset.sync_depreciation_to_qb':
      await handleAssetSyncDepreciationToQB(tenantId, payload);
      break;
    case 'asset.overdue_checkout_alert':
      await handleAssetOverdueCheckoutAlert(tenantId, payload);
      break;
    default:
      throw new Error(`Unknown asset job type: ${jobType}`);
  }
}

// ── Daily Expiry Check ─────────────────────────────────────────────────────
// Fires notifications for items expiring in 60/30/14/7 days

export async function handleAssetDailyExpiryCheck(
  tenantId: string,
  _payload: Record<string, unknown>,
): Promise<void> {
  const ALERT_DAYS = [60, 30, 14, 7];

  await withTenantContext(tenantId, async (client: PoolClient) => {
    for (const days of ALERT_DAYS) {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + days);
      const dateStr = targetDate.toISOString().split('T')[0];

      // Check warranties expiring on this day
      const warranties = await client.query(
        `SELECT aw.id, aw.provider_name, ca.id AS asset_id, ca.name AS asset_name, ca.asset_number
         FROM asset_warranties aw JOIN company_assets ca ON ca.id = aw.asset_id
         WHERE aw.expiry_date = $1 AND aw.deleted_at IS NULL AND ca.deleted_at IS NULL`,
        [dateStr]
      );
      for (const row of warranties.rows) {
        await insertExpiryNotification(client, tenantId, 'warranty_expiring', row, days);
      }

      // Check registrations expiring on this day
      const registrations = await client.query(
        `SELECT ar.id, ar.registration_number, ca.id AS asset_id, ca.name AS asset_name, ca.asset_number
         FROM asset_registrations ar JOIN company_assets ca ON ca.id = ar.asset_id
         WHERE ar.expiry_date = $1 AND ar.deleted_at IS NULL AND ca.deleted_at IS NULL`,
        [dateStr]
      );
      for (const row of registrations.rows) {
        await insertExpiryNotification(client, tenantId, 'registration_expiring', row, days);
      }

      // Check insurance policies expiring on this day
      const policies = await client.query(
        `SELECT aip.id, aip.carrier_name, aip.policy_number FROM asset_insurance_policies aip
         WHERE aip.expiry_date = $1 AND aip.deleted_at IS NULL`,
        [dateStr]
      );
      for (const row of policies.rows) {
        await insertPolicyExpiryNotification(client, tenantId, row, days);
      }

      // Check calibration records due on this day
      const calibrations = await client.query(
        `SELECT acr.id, ca.id AS asset_id, ca.name AS asset_name, ca.asset_number
         FROM asset_calibration_records acr JOIN company_assets ca ON ca.id = acr.asset_id
         WHERE acr.next_calibration_due = $1 AND acr.deleted_at IS NULL AND ca.deleted_at IS NULL`,
        [dateStr]
      );
      for (const row of calibrations.rows) {
        await insertExpiryNotification(client, tenantId, 'calibration_due', row, days);
      }
    }
  });
}

async function insertExpiryNotification(
  client: PoolClient,
  tenantId: string,
  eventType: string,
  row: Record<string, unknown>,
  daysUntil: number,
): Promise<void> {
  // Notify all OWNER and PROJECT_MANAGER users for this tenant
  const users = await client.query(
    `SELECT id FROM users WHERE tenant_id = current_setting('app.current_tenant_id')::uuid AND role IN ('OWNER','PROJECT_MANAGER') AND status = 'active' AND deleted_at IS NULL`
  );
  for (const user of users.rows) {
    await client.query(
      `INSERT INTO notifications (tenant_id, user_id, title, body, category, data) VALUES ($1,$2,$3,$4,'project',$5)`,
      [
        tenantId,
        user.id,
        `Asset ${eventType.replace('_', ' ')} in ${daysUntil} days`,
        `${row.asset_name} (${row.asset_number}) — ${eventType.replace(/_/g, ' ')} in ${daysUntil} days`,
        JSON.stringify({ event_type: eventType, asset_id: row.asset_id, record_id: row.id, days_until: daysUntil }),
      ]
    );
  }
}

async function insertPolicyExpiryNotification(
  client: PoolClient,
  tenantId: string,
  row: Record<string, unknown>,
  daysUntil: number,
): Promise<void> {
  const users = await client.query(
    `SELECT id FROM users WHERE tenant_id = current_setting('app.current_tenant_id')::uuid AND role IN ('OWNER','PROJECT_MANAGER') AND status = 'active' AND deleted_at IS NULL`
  );
  for (const user of users.rows) {
    await client.query(
      `INSERT INTO notifications (tenant_id, user_id, title, body, category, data) VALUES ($1,$2,$3,$4,'project',$5)`,
      [
        tenantId,
        user.id,
        `Fleet insurance policy expiring in ${daysUntil} days`,
        `Policy ${row.policy_number} (${row.carrier_name}) expires in ${daysUntil} days`,
        JSON.stringify({ event_type: 'insurance_policy_expiring', policy_id: row.id, days_until: daysUntil }),
      ]
    );
  }
}

// ── Monthly Depreciation ───────────────────────────────────────────────────
// Creates depreciation entries for all assets with active schedules

export async function handleAssetMonthlyDepreciation(
  tenantId: string,
  payload: Record<string, unknown>,
): Promise<void> {
  const periodStart = (payload.period_start as string) ?? new Date().toISOString().split('T')[0].slice(0, 7) + '-01';
  const periodEnd = (payload.period_end as string) ?? getLastDayOfMonth(periodStart);

  await withTenantContext(tenantId, async (client: PoolClient) => {
    // Get all assets with active depreciation schedules
    const schedules = await client.query(
      `SELECT ads.id AS schedule_id, ads.asset_id, ads.method, ads.useful_life_years,
              ads.salvage_value_cents, ads.depreciation_rate,
              ca.purchase_price_cents, ca.current_book_value_cents
       FROM asset_depreciation_schedules ads
       JOIN company_assets ca ON ca.id = ads.asset_id
       WHERE ads.is_active = TRUE AND ads.deleted_at IS NULL AND ca.deleted_at IS NULL`
    );

    for (const sched of schedules.rows) {
      // Skip if entry already exists for this period
      const existing = await client.query(
        `SELECT id FROM asset_depreciation_entries WHERE schedule_id = $1 AND period_start = $2`,
        [sched.schedule_id, periodStart]
      );
      if (existing.rows.length > 0) continue;

      const depAmount = calculateMonthlyDepreciation(sched);
      if (depAmount <= 0) continue;

      const currentBook = sched.current_book_value_cents ?? sched.purchase_price_cents ?? 0;
      const bookAfter = Math.max(currentBook - depAmount, sched.salvage_value_cents ?? 0);

      await client.query(
        `INSERT INTO asset_depreciation_entries (tenant_id, schedule_id, asset_id, period_start, period_end, depreciation_amount_cents, book_value_after_cents) VALUES (current_setting('app.current_tenant_id')::uuid,$1,$2,$3,$4,$5,$6)`,
        [sched.schedule_id, sched.asset_id, periodStart, periodEnd, depAmount, bookAfter]
      );

      await client.query(
        `UPDATE company_assets SET current_book_value_cents = $1, updated_at = NOW() WHERE id = $2`,
        [bookAfter, sched.asset_id]
      );
    }
  });
}

function calculateMonthlyDepreciation(sched: {
  method: string;
  useful_life_years: number;
  salvage_value_cents: number;
  purchase_price_cents: number;
  current_book_value_cents: number | null;
  depreciation_rate: number | null;
}): number {
  const depreciable = (sched.purchase_price_cents ?? 0) - (sched.salvage_value_cents ?? 0);
  if (depreciable <= 0) return 0;

  switch (sched.method) {
    case 'straight_line':
      return Math.floor(depreciable / (sched.useful_life_years * 12));

    case 'declining_balance': {
      const rate = sched.depreciation_rate ?? (2 / sched.useful_life_years);
      const book = sched.current_book_value_cents ?? sched.purchase_price_cents;
      return Math.floor((book * rate) / 12);
    }

    case 'sum_of_years': {
      // Simplified: use straight line as approximation for monthly
      return Math.floor(depreciable / (sched.useful_life_years * 12));
    }

    case 'units_of_production':
      // Cannot calculate without usage data — skip; daily job handles this
      return 0;

    default:
      return 0;
  }
}

function getLastDayOfMonth(periodStart: string): string {
  const d = new Date(periodStart);
  d.setMonth(d.getMonth() + 1, 0);
  return d.toISOString().split('T')[0];
}

// ── Sync Depreciation to QuickBooks ────────────────────────────────────────
// Stub — pushes monthly depreciation journal entries to QB

export async function handleAssetSyncDepreciationToQB(
  tenantId: string,
  payload: Record<string, unknown>,
): Promise<void> {
  const periodStart = payload.period_start as string;
  if (!periodStart) throw new Error('period_start required in payload');

  await withTenantContext(tenantId, async (client: PoolClient) => {
    // Get entries for the period
    const entries = await client.query(
      `SELECT ade.*, ca.name AS asset_name, ca.asset_number
       FROM asset_depreciation_entries ade
       JOIN company_assets ca ON ca.id = ade.asset_id
       WHERE ade.period_start = $1`,
      [periodStart]
    );

    if (entries.rows.length === 0) return;

    // TODO: Integrate with QuickBooks API
    // For each entry, create a journal entry:
    //   DR Depreciation Expense (account from tenant QB config)
    //   CR Accumulated Depreciation (account from tenant QB config)
    // Using the same pattern as invoices sync in stripe-worker
    // Placeholder: log the sync intent
    for (const entry of entries.rows) {
      void entry; // will be used in QB integration
    }
  });
}

// ── Overdue Checkout Alert ─────────────────────────────────────────────────
// Fires notifications for tools not returned by expected_return_at

export async function handleAssetOverdueCheckoutAlert(
  tenantId: string,
  _payload: Record<string, unknown>,
): Promise<void> {
  await withTenantContext(tenantId, async (client: PoolClient) => {
    const overdue = await client.query(
      `SELECT ac.id, ac.asset_id, ac.checked_out_to, ac.expected_return_at,
              ca.name AS asset_name, ca.asset_number,
              u.first_name, u.last_name, u.email AS operator_email
       FROM asset_checkouts ac
       JOIN company_assets ca ON ca.id = ac.asset_id
       JOIN users u ON u.id = ac.checked_out_to
       WHERE ac.checked_in_at IS NULL
         AND ac.expected_return_at IS NOT NULL
         AND ac.expected_return_at < NOW()
         AND ca.deleted_at IS NULL`
    );

    if (overdue.rows.length === 0) return;

    // Notify Owner and PM users
    const managers = await client.query(
      `SELECT id FROM users WHERE tenant_id = current_setting('app.current_tenant_id')::uuid AND role IN ('OWNER','PROJECT_MANAGER') AND status = 'active' AND deleted_at IS NULL`
    );

    for (const checkout of overdue.rows) {
      for (const mgr of managers.rows) {
        await client.query(
          `INSERT INTO notifications (tenant_id, user_id, title, body, category, data) VALUES (current_setting('app.current_tenant_id')::uuid,$1,$2,$3,'project',$4)`,
          [
            mgr.id,
            `Overdue tool checkout`,
            `${checkout.asset_name} (${checkout.asset_number}) is overdue — checked out to ${checkout.first_name} ${checkout.last_name}`,
            JSON.stringify({ event_type: 'overdue_checkout', checkout_id: checkout.id, asset_id: checkout.asset_id, operator_email: checkout.operator_email }),
          ]
        );
      }
    }
  });
}
