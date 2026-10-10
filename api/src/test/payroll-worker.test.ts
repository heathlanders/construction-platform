// payroll-worker.test.ts — CSV export worker math
// Exercises handlePayrollCsvExport() directly (no queue, no Fastify):
//   - rate resolution: per-entry AVG(hourly_rate_cents) overrides user_payroll_settings default
//   - regular/OT split: regularHours = min(total, 40); OT pay = ot_hours × rate × multiplier
//   - dollar formatting + CSV row shape
//   - audit_log row on completion
// Locked decisions: T-02 (cents), T-60/T-62.
//
// Storage (S3) is mocked so we capture the uploaded CSV body; SendGrid is left
// unconfigured so the email step is skipped (graceful path in the worker).
// withTenantContext() runs against the real pool; fixtures seeded via testPool (BYPASSRLS).

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { randomUUID } from 'node:crypto';

vi.mock('../lib/storage.js', () => ({
  storageClient: { send: vi.fn().mockResolvedValue({}) },
  generateDownloadUrl: vi.fn().mockResolvedValue('https://signed.example/payroll.csv'),
}));

import { testPool } from './setup.js';
import { storageClient } from '../lib/storage.js';
import { handlePayrollCsvExport } from '../workers/payroll-worker.js';

const sendMock = storageClient.send as unknown as ReturnType<typeof vi.fn>;

// ─── Fixtures ───────────────────────────────────────────────────────────────
const tenantId = randomUUID();
const ownerId = randomUUID();
const workerId = randomUUID();      // default-rate worker
const worker2Id = randomUUID();     // per-entry-rate worker
const projectId = randomUUID();
const slug = `pwk-${tenantId.slice(0, 8)}`;

// Distinct Mondays — one per scenario.
const WEEK_DEFAULT = '2026-06-01';  // default-rate path, OT
const WEEK_AVG = '2026-06-08';      // per-entry rate overrides default

/** Last uploaded CSV content (string), or '' if nothing uploaded. */
function lastCsv(): string {
  const calls = sendMock.mock.calls;
  if (calls.length === 0) return '';
  const cmd = calls[calls.length - 1][0];
  return String(cmd.input.Body);
}

/** Parse the CSV body into a row keyed by employee name. */
function rowFor(csv: string, name: string): string[] | null {
  const line = csv.split('\n').find((l) => l.startsWith(name + ','));
  return line ? line.split(',') : null;
}

beforeAll(async () => {
  delete process.env.SENDGRID_API_KEY; // skip email path

  await testPool.query(
    `INSERT INTO tenants (id, name, slug, tier, status)
     VALUES ($1, 'Payroll Worker Tenant', $2, 'professional', 'active')`,
    [tenantId, slug],
  );
  await testPool.query(
    `INSERT INTO users (id, tenant_id, email, password_hash, first_name, last_name, role, status)
     VALUES ($1,$2,$3,'x','Olive','Owner','owner','active'),
            ($4,$2,$5,'x','Wally','Worker','field_tech','active'),
            ($6,$2,$7,'x','Vera','Vendor','field_tech','active')`,
    [ownerId, tenantId, `pwk-owner-${ownerId.slice(0, 8)}@ex.com`,
     workerId, `pwk-w1-${workerId.slice(0, 8)}@ex.com`,
     worker2Id, `pwk-w2-${worker2Id.slice(0, 8)}@ex.com`],
  );
  await testPool.query(
    `INSERT INTO projects (id, tenant_id, name, status) VALUES ($1,$2,'PWK Project','active')`,
    [projectId, tenantId],
  );

  // Worker 1: W-2, default rate $50/hr, OT mult 1.5. No per-entry rate → falls back to default.
  await testPool.query(
    `INSERT INTO user_payroll_settings
       (id, tenant_id, user_id, employment_type, default_hourly_rate_cents, overtime_multiplier)
     VALUES ($1,$2,$3,'w2',5000,1.50)`,
    [randomUUID(), tenantId, workerId],
  );
  // Worker 2: 1099, default rate $40/hr — but per-entry rate $60/hr should win.
  await testPool.query(
    `INSERT INTO user_payroll_settings
       (id, tenant_id, user_id, employment_type, default_hourly_rate_cents, overtime_multiplier)
     VALUES ($1,$2,$3,'contractor_1099',4000,1.50)`,
    [randomUUID(), tenantId, worker2Id],
  );

  // Approved timecards: worker1 45h/5 OT (WEEK_DEFAULT); worker2 40h/0 OT (WEEK_AVG).
  await testPool.query(
    `INSERT INTO timecards (id, tenant_id, user_id, week_start, status, total_hours, overtime_hours)
     VALUES ($1,$2,$3,$4,'approved',45,5),
            ($5,$2,$6,$7,'approved',40,0)`,
    [randomUUID(), tenantId, workerId, WEEK_DEFAULT,
     randomUUID(), worker2Id, WEEK_AVG],
  );

  // Worker2's week has time_entries carrying an explicit $60/hr rate.
  await testPool.query(
    `INSERT INTO time_entries (id, tenant_id, project_id, user_id, date, hours_worked, hourly_rate_cents)
     VALUES ($1,$2,$3,$4,$5,8,6000),
            ($6,$2,$3,$4,$7,8,6000)`,
    [randomUUID(), tenantId, projectId, worker2Id, WEEK_AVG,
     randomUUID(), WEEK_AVG],
  );
});

afterAll(async () => {
  await testPool.query(`DELETE FROM audit_log WHERE tenant_id = $1`, [tenantId]);
  await testPool.query(`DELETE FROM time_entries WHERE tenant_id = $1`, [tenantId]);
  await testPool.query(`DELETE FROM timecards WHERE tenant_id = $1`, [tenantId]);
  await testPool.query(`DELETE FROM user_payroll_settings WHERE tenant_id = $1`, [tenantId]);
  await testPool.query(`DELETE FROM projects WHERE id = $1`, [projectId]);
  await testPool.query(`DELETE FROM users WHERE tenant_id = $1`, [tenantId]);
  await testPool.query(`DELETE FROM tenants WHERE id = $1`, [tenantId]);
});

describe('handlePayrollCsvExport — CSV math (T-62)', () => {
  it('uses the default rate, splits regular/OT, and formats dollars', async () => {
    sendMock.mockClear();
    await handlePayrollCsvExport({ week_start: WEEK_DEFAULT }, tenantId);

    expect(sendMock).toHaveBeenCalledTimes(1);
    const csv = lastCsv();
    expect(csv.split('\n')[0]).toBe(
      'Employee,Email,Employment Type,Week Start,Regular Hrs,OT Hrs,Rate ($/hr),OT Rate ($/hr),Regular Pay,OT Pay,Gross Pay',
    );

    const row = rowFor(csv, 'Wally Worker');
    expect(row).not.toBeNull();
    // [name,email,type,week,regHrs,otHrs,rate,otRate,regPay,otPay,gross]
    expect(row![2]).toBe('W-2');
    expect(row![3]).toBe(WEEK_DEFAULT);
    expect(row![4]).toBe('40.00');      // regular = min(45, 40)
    expect(row![5]).toBe('5.00');       // OT
    expect(row![6]).toBe('$50.00');     // default rate
    expect(row![7]).toBe('$75.00');     // OT rate = 50 × 1.5
    expect(row![8]).toBe('$2000.00');   // 40 × $50
    expect(row![9]).toBe('$375.00');    // 5 × $50 × 1.5
    expect(row![10]).toBe('$2375.00');  // gross
  });

  it('prefers the AVG per-entry rate over the payroll-settings default', async () => {
    sendMock.mockClear();
    await handlePayrollCsvExport({ week_start: WEEK_AVG }, tenantId);

    const csv = lastCsv();
    const row = rowFor(csv, 'Vera Vendor');
    expect(row).not.toBeNull();
    expect(row![2]).toBe('1099');
    expect(row![4]).toBe('40.00');
    expect(row![5]).toBe('0.00');
    expect(row![6]).toBe('$60.00');     // per-entry $60/hr beats $40 default
    expect(row![8]).toBe('$2400.00');   // 40 × $60
    expect(row![9]).toBe('$0.00');      // no OT
    expect(row![10]).toBe('$2400.00');
  });

  it('writes a payroll.csv_exported audit entry with the employee count', async () => {
    await handlePayrollCsvExport({ week_start: WEEK_DEFAULT }, tenantId);
    const { rows } = await testPool.query(
      `SELECT action, payload FROM audit_log
       WHERE tenant_id = $1 AND action = 'payroll.csv_exported'
       ORDER BY created_at DESC LIMIT 1`,
      [tenantId],
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].payload.week_start).toBe(WEEK_DEFAULT);
    expect(rows[0].payload.employee_count).toBe(1);
  });
});
