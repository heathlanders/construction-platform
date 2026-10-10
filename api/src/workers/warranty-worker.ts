// workers/warranty-worker.ts — Builder warranty background jobs
// Jobs: daily_expiry_scan (scheduled queue, dedicated consumer) → per-tenant
//       daily_expiry_check · sub_notify · homeowner_magic_link

import { PoolClient } from 'pg';
import { withTenantContext } from '../lib/tenant-context.js';
import { generateHomeownerMagicLinkToken, sendHomeownerMagicLinkEmail } from '../lib/password-reset.js';
import { pgPool } from '../lib/db.js';
import { getQueue, sendJob } from '../lib/queue.js';

// ── Job Dispatcher ─────────────────────────────────────────────────────────

export async function dispatchWarrantyJob(
  jobType: string,
  tenantId: string,
  payload: Record<string, unknown>,
): Promise<void> {
  switch (jobType) {
    case 'warranty.daily_expiry_check':
      await handleWarrantyDailyExpiryCheck(tenantId, payload);
      break;
    case 'warranty.sub_notify':
      await handleWarrantySubNotify(tenantId, payload);
      break;
    case 'warranty.homeowner_magic_link':
      await handleHomeownerMagicLink(tenantId, payload);
      break;
    default:
      throw new Error(`Unknown warranty job type: ${jobType}`);
  }
}

// ── Daily Expiry Scan (platform-wide → per-tenant fan-out) ─────────────────
// The 07:00 cron lands on the scheduled queue `warranty.daily_expiry_scan`, which
// (like every scheduled queue) needs its OWN boss.work consumer — the 'jobs' switch
// never receives it. The old schedule targeted `warranty.daily_expiry_check` directly
// with no consumer and no tenant_id: it never fired (jobs stuck `created` since
// 2026-04-18). The scan enqueues one per-tenant job that rides the existing
// 'jobs'-switch case (T-10 envelope tenant_id).

export async function handleWarrantyExpiryScan(): Promise<void> {
  const { rows: tenants } = await pgPool.query<{ id: string }>(
    `SELECT id FROM tenants WHERE deleted_at IS NULL AND status IN ('trial', 'active', 'grace_period')`,
  );
  for (const tenant of tenants) {
    await sendJob('warranty.daily_expiry_check', tenant.id, {});
  }
  console.info({ tenantCount: tenants.length }, 'warranty.daily_expiry_scan: dispatched per-tenant jobs');
}

export async function startWarrantyScanWorker(): Promise<void> {
  const boss = await getQueue();
  await boss.work('warranty.daily_expiry_scan', async () => {
    await handleWarrantyExpiryScan();
  });
  console.info('warranty-worker: registered daily_expiry_scan worker');
}

// ── Daily Expiry Check ─────────────────────────────────────────────────────
// Fires notifications for coverage items expiring in 90/30/7 days

export async function handleWarrantyDailyExpiryCheck(
  tenantId: string,
  _payload: Record<string, unknown>,
): Promise<void> {
  const ALERT_DAYS = [90, 30, 7];

  await withTenantContext(tenantId, async (client: PoolClient) => {
    for (const days of ALERT_DAYS) {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + days);
      const dateStr = targetDate.toISOString().split('T')[0];

      // Coverage items expiring on this date
      const items = await client.query(
        `SELECT wci.id, wci.title AS coverage_title, wci.coverage_type,
                bw.id AS warranty_id, bw.title AS warranty_title,
                bw.property_address, bw.homeowner_email
         FROM warranty_coverage_items wci
         JOIN builder_warranties bw ON bw.id = wci.warranty_id
         WHERE wci.expiry_date = $1 AND bw.deleted_at IS NULL AND bw.status = 'active'`,
        [dateStr]
      );

      for (const row of items.rows) {
        // Notify all Owner + PM users in tenant
        const users = await client.query(
          `SELECT id FROM users WHERE role IN ('owner','project_manager') AND status = 'active' AND deleted_at IS NULL`
        );
        for (const user of users.rows) {
          await client.query(
            `INSERT INTO notifications (tenant_id, user_id, title, body, category, data)
             VALUES (current_setting('app.current_tenant_id')::uuid,$1,$2,$3,'project',$4)`,
            [
              user.id,
              `Warranty Coverage Expiring in ${days} Days`,
              `${row.coverage_title} coverage for ${row.property_address} expires ${dateStr}`,
              JSON.stringify({ warranty_id: row.warranty_id, coverage_type: row.coverage_type }),
            ]
          );
        }
      }

      // Also check warranty insurance policies expiring
      const policies = await client.query(
        `SELECT id, policy_name, carrier_name, expiry_date
         FROM warranty_insurance_policies WHERE expiry_date = $1 AND deleted_at IS NULL`,
        [dateStr]
      );
      for (const policy of policies.rows) {
        const owners = await client.query(
          `SELECT id FROM users WHERE role IN ('owner','project_manager') AND status = 'active' AND deleted_at IS NULL`
        );
        for (const user of owners.rows) {
          await client.query(
            `INSERT INTO notifications (tenant_id, user_id, title, body, category, data)
             VALUES (current_setting('app.current_tenant_id')::uuid,$1,$2,$3,'project',$4)`,
            [
              user.id,
              `Warranty Insurance Expiring in ${days} Days`,
              `${policy.carrier_name} policy "${policy.policy_name}" expires ${dateStr}`,
              JSON.stringify({ policy_id: policy.id }),
            ]
          );
        }
      }
    }
  });
}

// ── Sub-Contractor Liability Notification ──────────────────────────────────

export async function handleWarrantySubNotify(
  tenantId: string,
  payload: Record<string, unknown>,
): Promise<void> {
  const { claim_id, vendor_id } = payload as { claim_id: string; vendor_id: string };

  await withTenantContext(tenantId, async (client: PoolClient) => {
    // Get claim + warranty + vendor info
    const res = await client.query(
      `SELECT wc.id AS claim_id, wc.title, wc.description, wc.category,
              bw.title AS warranty_title, bw.property_address,
              v.name AS vendor_name, v.contact_email AS vendor_email
       FROM warranty_claims wc
       JOIN builder_warranties bw ON bw.id = wc.warranty_id
       JOIN vendors v ON v.id = $2
       WHERE wc.id = $1 AND wc.deleted_at IS NULL`,
      [claim_id, vendor_id]
    );
    if (res.rows.length === 0) {
      console.warn({ tenantId, claim_id, vendor_id }, 'warranty.sub_notify: claim or vendor not found');
      return;
    }

    const row = res.rows[0];

    // Update notified_at on the sub liability item
    await client.query(
      `UPDATE warranty_sub_liability_items SET notified_at = NOW(), updated_at = NOW()
       WHERE claim_id = $1 AND vendor_id = $2 AND notified_at IS NULL`,
      [claim_id, vendor_id]
    );

    // Notify Owner + PM users in tenant
    const owners = await client.query(
      `SELECT id FROM users WHERE role IN ('owner','project_manager') AND status = 'active' AND deleted_at IS NULL`
    );
    for (const user of owners.rows) {
      await client.query(
        `INSERT INTO notifications (tenant_id, user_id, title, body, category, data)
         VALUES (current_setting('app.current_tenant_id')::uuid,$1,$2,$3,'project',$4)`,
        [
          user.id,
          `Sub Liability Claim Notified: ${row.vendor_name}`,
          `${row.vendor_name} has been notified of liability for claim "${row.title}" at ${row.property_address}`,
          JSON.stringify({ claim_id, vendor_id, warranty_title: row.warranty_title }),
        ]
      );
    }

    console.info({ tenantId, claim_id, vendor_id, vendor: row.vendor_name }, 'warranty.sub_notify: notified');
  });
}

// ── Homeowner Magic Link Email ─────────────────────────────────────────────

export async function handleHomeownerMagicLink(
  tenantId: string,
  payload: Record<string, unknown>,
): Promise<void> {
  const { user_id, email, name, warranty_id } = payload as {
    user_id: string;
    email: string;
    name: string;
    warranty_id: string;
  };

  const token = await generateHomeownerMagicLinkToken(user_id);
  await sendHomeownerMagicLinkEmail(email, name, token, warranty_id);

  console.info({ tenantId, user_id, email, warranty_id }, 'warranty.homeowner_magic_link: sent');
}
