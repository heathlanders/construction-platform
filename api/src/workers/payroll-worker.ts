// workers/payroll-worker.ts — payroll job handlers
// Job types: payroll.export_csv, payroll.quickbooks_push, payroll.gusto_push, payroll.adp_push
// Locked decisions: T-10, A-14, T-31, T-32

import { withTenantContext } from '../lib/tenant-context.js';
import { writeAuditEntry } from '../lib/audit-log.js';
import { storageClient, generateDownloadUrl } from '../lib/storage.js';
import { PutObjectCommand } from '@aws-sdk/client-s3';

const LIVE_BUCKET = process.env.STORAGE_LIVE_BUCKET!;

// ─── CSV Export ───────────────────────────────────────────────────────────────

interface TimecardRow {
  first_name: string;
  last_name: string;
  email: string;
  employment_type: string;
  total_hours: string;
  overtime_hours: string;
  default_rate: string;
  ot_multiplier: string;
  user_id: string;
}

interface RateRow {
  avg_rate: string | null;
}

function formatDollars(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatHours(hours: number): string {
  return hours.toFixed(2);
}

export async function handlePayrollCsvExport(
  payload: Record<string, unknown>,
  tenantId: string,
): Promise<void> {
  const weekStart = payload.week_start as string;
  if (!weekStart) throw new Error('payroll.export_csv: missing week_start in payload');

  // Week end = Monday + 6 days (ISO week, matches timecards.ts summation range)
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const weekEndStr = weekEnd.toISOString().slice(0, 10);

  let csvPath = '';
  let employeeCount = 0;

  await withTenantContext(tenantId, async (client) => {
    // 1. Query approved timecards for the week
    const { rows: timecards } = await client.query<TimecardRow>(
      `SELECT
         u.first_name, u.last_name, u.email, u.id AS user_id,
         COALESCE(ups.employment_type, 'w2') AS employment_type,
         t.total_hours, t.overtime_hours,
         COALESCE(ups.default_hourly_rate_cents, 0) AS default_rate,
         COALESCE(ups.overtime_multiplier, 1.50) AS ot_multiplier
       FROM timecards t
       JOIN users u ON u.id = t.user_id
       LEFT JOIN user_payroll_settings ups
         ON ups.user_id = t.user_id AND ups.deleted_at IS NULL
       WHERE t.week_start = $1
         AND t.status = 'approved'
         AND t.deleted_at IS NULL`,
      [weekStart],
    );

    employeeCount = timecards.length;

    // 2. Build CSV rows
    const csvRows: string[] = [
      'Employee,Email,Employment Type,Week Start,Regular Hrs,OT Hrs,Rate ($/hr),OT Rate ($/hr),Regular Pay,OT Pay,Gross Pay',
    ];

    for (const tc of timecards) {
      // Get average hourly rate from the week's time_entries (fall back to default_rate).
      // time_entries has no timecard_id — link by user + ISO week range, same as timecards.ts.
      const { rows: rateRows } = await client.query<RateRow>(
        `SELECT AVG(hourly_rate_cents)::numeric AS avg_rate
         FROM time_entries
         WHERE user_id = $1
           AND date >= $2 AND date <= $3
           AND hourly_rate_cents IS NOT NULL
           AND deleted_at IS NULL`,
        [tc.user_id, weekStart, weekEndStr],
      );

      const defaultRateCents = parseInt(tc.default_rate, 10);
      const avgRateCents = rateRows[0]?.avg_rate != null
        ? Math.round(parseFloat(rateRows[0].avg_rate))
        : null;
      const effectiveRateCents = avgRateCents ?? defaultRateCents;

      const totalHours = parseFloat(tc.total_hours);
      const overtimeHours = parseFloat(tc.overtime_hours);
      const otMultiplier = parseFloat(tc.ot_multiplier);

      const regularHours = Math.min(totalHours, 40);
      const regularPayCents = Math.round(regularHours * effectiveRateCents);
      const otPayCents = Math.round(overtimeHours * effectiveRateCents * otMultiplier);
      const grossPayCents = regularPayCents + otPayCents;

      const employmentTypeLabel = tc.employment_type === 'contractor_1099' ? '1099' : 'W-2';
      const otRateCents = Math.round(effectiveRateCents * otMultiplier);

      csvRows.push([
        `${tc.first_name} ${tc.last_name}`,
        tc.email,
        employmentTypeLabel,
        weekStart,
        formatHours(regularHours),
        formatHours(overtimeHours),
        formatDollars(effectiveRateCents),
        formatDollars(otRateCents),
        formatDollars(regularPayCents),
        formatDollars(otPayCents),
        formatDollars(grossPayCents),
      ].join(','));
    }

    const csvContent = csvRows.join('\n');
    csvPath = `${tenantId}/live/payroll/exports/${weekStart}.csv`;

    // 3. Upload CSV to live storage
    try {
      await storageClient.send(new PutObjectCommand({
        Bucket: LIVE_BUCKET,
        Key: csvPath,
        Body: csvContent,
        ContentType: 'text/csv',
      }));
    } catch (err) {
      // Log but don't fail — audit log still records the export
      console.error({ err, csvPath }, 'payroll-worker: S3 upload failed');
      csvPath = '';
    }

    // 4. Email OWNER + ACCOUNTANT users
    if (csvPath) {
      try {
        const downloadUrl = await generateDownloadUrl(csvPath);
        const { rows: ownerUsers } = await client.query<{ email: string; first_name: string }>(
          `SELECT email, first_name FROM users
           WHERE tenant_id = $1
             AND role IN ('owner', 'accountant')
             AND status = 'active'
             AND deleted_at IS NULL`,
          [tenantId],
        );

        // SendGrid email — graceful fallback if not configured
        const sendgridKey = process.env.SENDGRID_API_KEY;
        if (sendgridKey && ownerUsers.length > 0) {
          for (const user of ownerUsers) {
            await fetch('https://api.sendgrid.com/v3/mail/send', {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${sendgridKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                to: [{ email: user.email, name: user.first_name }],
                from: { email: process.env.SENDGRID_FROM_EMAIL ?? 'noreply@platform.app', name: 'Platform Payroll' },
                subject: `Payroll Export Ready — Week of ${weekStart}`,
                content: [{
                  type: 'text/plain',
                  value: `Hi ${user.first_name},\n\nYour payroll CSV export for the week of ${weekStart} is ready.\n\nDownload (expires in 15 minutes): ${downloadUrl}\n\nThis export contains ${employeeCount} employee(s).\n`,
                }],
              }),
            });
          }
        } else {
          console.info({ tenantId, weekStart, downloadUrl }, 'payroll-worker: export ready (SendGrid not configured — skipping email)');
        }
      } catch (err) {
        console.error({ err }, 'payroll-worker: email delivery failed');
      }
    }

    // 5. Write audit log
    await writeAuditEntry(client, {
      tenantId,
      category: 'data',
      action: 'payroll.csv_exported',
      actorId: payload.requested_by as string | undefined,
      resourceType: 'payroll_export',
      payload: { week_start: weekStart, employee_count: employeeCount, storage_path: csvPath },
    });
  });

  console.info({ tenantId, weekStart, employeeCount }, 'payroll-worker: CSV export complete');
}

// ─── QuickBooks push (stub) ───────────────────────────────────────────────────

export async function handlePayrollQbPush(
  payload: Record<string, unknown>,
  tenantId: string,
): Promise<void> {
  await withTenantContext(tenantId, async (client) => {
    await writeAuditEntry(client, {
      tenantId,
      category: 'data',
      action: 'payroll.qb_push.queued',
      actorId: undefined,
      resourceType: 'timecard',
      resourceId: payload.timecard_id as string | undefined,
      payload,
    });
  });
  console.info({ tenantId, payload }, 'payroll-worker: QuickBooks push (stub — full implementation pending)');
}

// ─── Gusto push (stub) ────────────────────────────────────────────────────────

export async function handlePayrollGustoPush(
  payload: Record<string, unknown>,
  tenantId: string,
): Promise<void> {
  await withTenantContext(tenantId, async (client) => {
    await writeAuditEntry(client, {
      tenantId,
      category: 'data',
      action: 'payroll.gusto_push.queued',
      actorId: undefined,
      resourceType: 'timecard',
      resourceId: payload.timecard_id as string | undefined,
      payload,
    });
  });
  console.info({ tenantId, payload }, 'payroll-worker: Gusto push (stub — full implementation pending)');
}

// ─── ADP push (stub) ──────────────────────────────────────────────────────────

export async function handlePayrollAdpPush(
  payload: Record<string, unknown>,
  tenantId: string,
): Promise<void> {
  await withTenantContext(tenantId, async (client) => {
    await writeAuditEntry(client, {
      tenantId,
      category: 'data',
      action: 'payroll.adp_push.queued',
      actorId: undefined,
      resourceType: 'timecard',
      resourceId: payload.timecard_id as string | undefined,
      payload,
    });
  });
  console.info({ tenantId, payload }, 'payroll-worker: ADP push (stub — full implementation pending)');
}
