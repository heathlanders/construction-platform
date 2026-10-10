/**
 * Timecard seed — comprehensive workflow test data for all roles.
 * Layers on: demo-seed → rich-seed → design-partner-seed → THIS.
 *
 * Covers:
 *   - All roles: OWNER, PM, FOREMAN, FIELD_TECH, ACCOUNTANT, SAFETY_OFFICER
 *   - All states: draft, submitted, approved, rejected, rejected→resubmitted→approved
 *   - Overtime: Dmitri week -4 (51h total, 11h OT)
 *   - Rejection + resubmit: Sarah week -2 with rejection note
 *   - Admin approval queue: 4 submitted timecards in week -1
 *   - BLI cost allocation: Marcus week -2 entries linked to Steel BLI
 *   - Payroll integration: QuickBooks active — approval enqueues push job
 *   - 4 weeks of history + current week in progress
 *
 * Run: pnpm seed:tc  (requires pnpm seed:all to have run first)
 * Idempotent — safe to run multiple times (ON CONFLICT DO NOTHING).
 */

import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// ── IDs from demo-seed ─────────────────────────────────────────────────────
const D = {
  tenant:      '11111111-0000-0000-0000-000000000001',
  marcus:      '22222222-0000-0000-0000-000000000001', // OWNER
  sarah:       '22222222-0000-0000-0000-000000000002', // PROJECT_MANAGER
  dmitri:      '22222222-0000-0000-0000-000000000004', // FOREMAN
  aaliyah:     '22222222-0000-0000-0000-000000000005', // FIELD_TECH
  patricia:    '22222222-0000-0000-0000-000000000006', // ACCOUNTANT
  riverside:   '33333333-0000-0000-0000-000000000001',
  lofts:       '33333333-0000-0000-0000-000000000002',
  cc_concrete: '44444444-0000-0000-0000-000000000001',
  cc_steel:    '44444444-0000-0000-0000-000000000002',
  cc_finishes: '44444444-0000-0000-0000-000000000003',
  bli_concrete:'55555555-0000-0000-0000-000000000001',
  bli_steel:   '55555555-0000-0000-0000-000000000002',
};

// ── New IDs for timecard-seed ──────────────────────────────────────────────
const TC = {
  rachel:         '22222222-0000-0000-0000-000000000008', // SAFETY_OFFICER
  qb_integration: 'ff000001-0000-0000-0000-000000000001',
  ups_rachel:     'ff010001-0000-0000-0000-000000000004',

  // Timecards tc7–tc21 (tc1–tc6 exist from demo/rich seeds)
  tc7:  'ffffffff-2000-0000-0000-000000000007', // Aaliyah  wk-4  approved
  tc8:  'ffffffff-2000-0000-0000-000000000008', // Dmitri   wk-4  approved OT
  tc9:  'ffffffff-2000-0000-0000-000000000009', // Marcus   wk-3  approved
  tc10: 'ffffffff-2000-0000-0000-000000000010', // Sarah    wk-3  approved
  tc11: 'ffffffff-2000-0000-0000-000000000011', // Patricia wk-3  approved
  tc12: 'ffffffff-2000-0000-0000-000000000012', // Rachel   wk-3  approved
  tc13: 'ffffffff-2000-0000-0000-000000000013', // Sarah    wk-2  rejected
  tc14: 'ffffffff-2000-0000-0000-000000000014', // Sarah    wk-2  approved (resubmit)
  tc15: 'ffffffff-2000-0000-0000-000000000015', // Marcus   wk-2  approved
  tc16: 'ffffffff-2000-0000-0000-000000000016', // Patricia wk-2  approved
  tc17: 'ffffffff-2000-0000-0000-000000000017', // Marcus   wk-1  submitted
  tc18: 'ffffffff-2000-0000-0000-000000000018', // Patricia wk-1  submitted
  tc19: 'ffffffff-2000-0000-0000-000000000019', // Rachel   wk-1  submitted
  tc20: 'ffffffff-2000-0000-0000-000000000020', // Sarah    wk-1  draft
  tc21: 'ffffffff-2000-0000-0000-000000000021', // Marcus   wk-0  draft
};

// Time entry UUIDs: ff110001-0000-0000-0000-{n padded to 12 hex digits}
// Batches by group:
//   te 1–5  : Week -4 Aaliyah (5 entries, 8h each)
//   te 6–11 : Week -4 Dmitri OT (6 entries: 5×9h + 1×6h)
//   te12–16 : Week -3 Marcus (5 entries, 8h each)
//   te17–21 : Week -3 Sarah (5 entries, 8h each)
//   te22–26 : Week -3 Patricia (5 entries, 8h each)
//   te27–31 : Week -3 Rachel (5 entries, 8h each, logged by Marcus)
//   te32–35 : Week -2 Sarah corrected (4 entries, 9h each = 36h)
//   te36–40 : Week -2 Marcus with BLI (5 entries, 8h; 3 linked to bli_steel)
//   te41–45 : Week -2 Patricia (5 entries, 8h each)
//   te46–50 : Week -1 Marcus (5 entries, 8h each)
//   te51–55 : Week -1 Patricia with BLI (5 entries, 8h; 2 linked to bli_concrete)
//   te56–60 : Week -1 Rachel (5 entries, 8h each, logged by Marcus)
//   te61–63 : Week -1 Sarah draft (3 entries, 8h each)
//   te64–66 : Current week Marcus draft (3 entries, 8h each)
//   te67–68 : Current week Patricia no-timecard (2 entries, 8h each)
function teId(n: number): string {
  return `ff110001-0000-0000-0000-${String(n).padStart(12, '0')}`;
}

// ── Date helpers ───────────────────────────────────────────────────────────
function daysAgo(n: number): string {
  return new Date(Date.now() - n * 86400000).toISOString();
}
/** Monday of the ISO week that contains the date N days ago. */
function weekOf(daysAgoStart: number): string {
  const d = new Date(Date.now() - daysAgoStart * 86400000);
  const day = d.getUTCDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().split('T')[0];
}
/** Date that is dayOffset days after a weekStart (Monday). */
function wd(weekStart: string, dayOffset: number): string {
  const d = new Date(weekStart + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + dayOffset);
  return d.toISOString().split('T')[0];
}

// ── Main ───────────────────────────────────────────────────────────────────
async function main() {
  const client = await pool.connect();
  try {
    console.log('🌱 Seeding timecard test data — all roles, all workflow states...\n');

    const pwHash = await bcrypt.hash('demo-password-2026', 12);

    // Week Monday dates
    const w4 = weekOf(28); // 4 weeks ago
    const w3 = weekOf(21); // 3 weeks ago
    const w2 = weekOf(14); // 2 weeks ago
    const w1 = weekOf(7);  // last week
    const w0 = weekOf(0);  // current week

    // Approval / submission timestamps
    const ts_approved4w = daysAgo(26);
    const ts_approved3w = daysAgo(19);
    const ts_approved2w = daysAgo(12);
    const ts_sub_marcus  = daysAgo(3);
    const ts_sub_patricia = daysAgo(4);
    const ts_sub_rachel  = daysAgo(2);

    // ── 1. Upgrade Apex Construction to ENTERPRISE ─────────────────────────
    console.log('  → Upgrading Apex to ENTERPRISE tier...');
    await client.query(`
      UPDATE tenants
      SET tier = 'enterprise', updated_at = NOW()
      WHERE id = $1
    `, [D.tenant]);
    await client.query(`
      UPDATE tenant_subscriptions
      SET tier = 'enterprise', addon_gc_module = TRUE, addon_cross_tenant = TRUE, updated_at = NOW()
      WHERE tenant_id = $1
    `, [D.tenant]);
    console.log('✓ Apex Construction → ENTERPRISE');

    // ── 2. Add Rachel Kim — SAFETY_OFFICER ────────────────────────────────
    console.log('  → Adding Rachel Kim (safety_officer)...');
    await client.query(`
      INSERT INTO users (id, tenant_id, email, password_hash, first_name, last_name, role, status, created_at, updated_at)
      VALUES ($1, $2, 'rachel@apexconstruction.demo', $3, 'Rachel', 'Kim', 'safety_officer', 'active', NOW(), NOW())
      ON CONFLICT (id) DO NOTHING
    `, [TC.rachel, D.tenant, pwHash]);
    console.log('✓ Rachel Kim (safety_officer) — rachel@apexconstruction.demo');

    // ── 3. QuickBooks payroll integration (active — triggers push on approval) ──
    console.log('  → QuickBooks payroll integration...');
    await client.query(`
      INSERT INTO tenant_integrations (id, tenant_id, provider, external_id, status, created_at, updated_at, created_by)
      VALUES ($1, $2, 'quickbooks', 'demo-realm-apex-123', 'active', NOW(), NOW(), $3)
      ON CONFLICT (tenant_id, provider) DO NOTHING
    `, [TC.qb_integration, D.tenant, D.marcus]);
    console.log('✓ QuickBooks integration: active (payroll.quickbooks_push fires on approval)');

    // ── 4. Payroll settings for Rachel (others set in rich-seed) ──────────
    console.log('  → Payroll settings for Rachel...');
    await client.query(`
      INSERT INTO user_payroll_settings (id, tenant_id, user_id, employment_type, default_hourly_rate_cents, overtime_multiplier, pay_frequency, created_at, updated_at, created_by)
      VALUES ($1, $2, $3, 'w2', 8000, 1.50, 'biweekly', NOW(), NOW(), $4)
      ON CONFLICT (user_id) DO NOTHING
    `, [TC.ups_rachel, D.tenant, TC.rachel, D.marcus]);
    console.log('✓ Rachel payroll settings: $80/hr, 1.5× OT, biweekly');

    // ── 5. Week -4: Aaliyah FIELD_TECH — Approved 40h ─────────────────────
    console.log('\n  → Week -4 time entries...');
    await client.query(`
      INSERT INTO time_entries (id, tenant_id, project_id, user_id, date, hours_worked, cost_code_id, notes, hourly_rate_cents, created_at, updated_at, created_by)
      VALUES
        ($1, $6, $7, $8, $11, 8.0, $9, 'Concrete formwork — Day 1',  8500, NOW(), NOW(), $10),
        ($2, $6, $7, $8, $12, 8.0, $9, 'Rebar placement',             8500, NOW(), NOW(), $10),
        ($3, $6, $7, $8, $13, 8.0, $9, 'Slab pour prep',              8500, NOW(), NOW(), $10),
        ($4, $6, $7, $8, $14, 8.0, $9, 'Slab pour — main section',    8500, NOW(), NOW(), $10),
        ($5, $6, $7, $8, $15, 8.0, $9, 'Cleanup and site inspection', 8500, NOW(), NOW(), $10)
      ON CONFLICT (id) DO NOTHING
    `, [
      teId(1), teId(2), teId(3), teId(4), teId(5),
      D.tenant, D.riverside, D.aaliyah, D.cc_concrete, D.dmitri,
      wd(w4,0), wd(w4,1), wd(w4,2), wd(w4,3), wd(w4,4),
    ]);

    // ── 6. Week -4: Dmitri FOREMAN — Approved 51h (11h overtime) ──────────
    await client.query(`
      INSERT INTO time_entries (id, tenant_id, project_id, user_id, date, hours_worked, cost_code_id, notes, hourly_rate_cents, created_at, updated_at, created_by)
      VALUES
        ($1, $7, $8, $9, $12, 9.0, $10, 'Foundation forming — extended shift',  9500, NOW(), NOW(), $9),
        ($2, $7, $8, $9, $13, 9.0, $10, 'Rebar tie and inspection',              9500, NOW(), NOW(), $9),
        ($3, $7, $8, $9, $14, 9.0, $10, 'Slab pour — south section',             9500, NOW(), NOW(), $9),
        ($4, $7, $8, $9, $15, 9.0, $11, 'Steel erection — Level 1',              9500, NOW(), NOW(), $9),
        ($5, $7, $8, $9, $16, 9.0, $11, 'Steel connections and bolt-up',         9500, NOW(), NOW(), $9),
        ($6, $7, $8, $9, $17, 6.0, $11, 'Saturday: steel inspection and punch',  9500, NOW(), NOW(), $9)
      ON CONFLICT (id) DO NOTHING
    `, [
      teId(6), teId(7), teId(8), teId(9), teId(10), teId(11),
      D.tenant, D.riverside, D.dmitri, D.cc_concrete, D.cc_steel,
      wd(w4,0), wd(w4,1), wd(w4,2), wd(w4,3), wd(w4,4), wd(w4,5),
    ]);

    // Timecards: week -4
    await client.query(`
      INSERT INTO timecards (id, tenant_id, user_id, week_start, status, total_hours, overtime_hours, submitted_at, approved_by, approved_at, created_at, updated_at, created_by)
      VALUES
        ($1, $3, $4, $5, 'approved', 40.0,  0.0, $6, $7, $6, NOW(), NOW(), $4),
        ($2, $3, $8, $5, 'approved', 51.0, 11.0, $6, $9, $6, NOW(), NOW(), $8)
      ON CONFLICT (id) DO NOTHING
    `, [
      TC.tc7, TC.tc8,  // $1, $2
      D.tenant,        // $3
      D.aaliyah,       // $4 — Aaliyah (tc7 user; Sarah approves her)
      w4,              // $5 — week_start
      ts_approved4w,   // $6
      D.sarah,         // $7 — Sarah approved Aaliyah's tc
      D.dmitri,        // $8 — Dmitri (tc8 user; Marcus approves him)
      D.marcus,        // $9 — Marcus approved Dmitri's tc
    ]);
    console.log('✓ Week -4: Aaliyah 40h approved; Dmitri 51h (11h OT) approved');

    // ── 7. Week -3: Marcus, Sarah, Patricia, Rachel — All approved ─────────
    console.log('  → Week -3 time entries...');

    // Marcus (OWNER) — Mon-Fri, alternating Riverside/Lofts, cc_steel
    await client.query(`
      INSERT INTO time_entries (id, tenant_id, project_id, user_id, date, hours_worked, cost_code_id, notes, hourly_rate_cents, created_at, updated_at, created_by)
      VALUES
        ($1, $6, $7, $8, $11, 8.0, $9, 'Owner site visit + structural review — Riverside',  12500, NOW(), NOW(), $8),
        ($2, $6, $10,$8, $12, 8.0, $9, 'PM coordination + schedule review — Lofts',          12500, NOW(), NOW(), $8),
        ($3, $6, $7, $8, $13, 8.0, $9, 'Subcontractor coordination — Riverside',             12500, NOW(), NOW(), $8),
        ($4, $6, $10,$8, $14, 8.0, $9, 'Change order review + estimating — Lofts',           12500, NOW(), NOW(), $8),
        ($5, $6, $7, $8, $15, 8.0, $9, 'Weekly site inspection + punch walk',                12500, NOW(), NOW(), $8)
      ON CONFLICT (id) DO NOTHING
    `, [
      teId(12), teId(13), teId(14), teId(15), teId(16),
      D.tenant, D.riverside, D.marcus, D.cc_steel, D.lofts,
      wd(w3,0), wd(w3,1), wd(w3,2), wd(w3,3), wd(w3,4),
    ]);

    // Sarah (PM) — Mon-Fri, Riverside, cc_finishes
    await client.query(`
      INSERT INTO time_entries (id, tenant_id, project_id, user_id, date, hours_worked, cost_code_id, notes, hourly_rate_cents, created_at, updated_at, created_by)
      VALUES
        ($1, $6, $7, $8, $10, 8.0, $9, 'RFI review and submittal processing',  11000, NOW(), NOW(), $8),
        ($2, $6, $7, $8, $11, 8.0, $9, 'Schedule update and look-ahead review', 11000, NOW(), NOW(), $8),
        ($3, $6, $7, $8, $12, 8.0, $9, 'Owner meeting and design coordination', 11000, NOW(), NOW(), $8),
        ($4, $6, $7, $8, $13, 8.0, $9, 'Punch list walk with architect',        11000, NOW(), NOW(), $8),
        ($5, $6, $7, $8, $14, 8.0, $9, 'Invoice review and cost reporting',     11000, NOW(), NOW(), $8)
      ON CONFLICT (id) DO NOTHING
    `, [
      teId(17), teId(18), teId(19), teId(20), teId(21),
      D.tenant, D.riverside, D.sarah, D.cc_finishes,
      wd(w3,0), wd(w3,1), wd(w3,2), wd(w3,3), wd(w3,4),
    ]);

    // Patricia (ACCOUNTANT) — Mon-Fri, Riverside, no cost code, rate $95/hr
    await client.query(`
      INSERT INTO time_entries (id, tenant_id, project_id, user_id, date, hours_worked, cost_code_id, notes, hourly_rate_cents, created_at, updated_at, created_by)
      VALUES
        ($1, $6, $7, $8, $9,  8.0, NULL, 'AP processing and vendor reconciliation', 9500, NOW(), NOW(), $8),
        ($2, $6, $7, $8, $10, 8.0, NULL, 'Payroll prep and hours review',           9500, NOW(), NOW(), $8),
        ($3, $6, $7, $8, $11, 8.0, NULL, 'QuickBooks sync and journal entries',     9500, NOW(), NOW(), $8),
        ($4, $6, $7, $8, $12, 8.0, NULL, 'Budget vs actual variance report',        9500, NOW(), NOW(), $8),
        ($5, $6, $7, $8, $13, 8.0, NULL, 'Month-end close prep',                   9500, NOW(), NOW(), $8)
      ON CONFLICT (id) DO NOTHING
    `, [
      teId(22), teId(23), teId(24), teId(25), teId(26),
      D.tenant, D.riverside, D.patricia,
      wd(w3,0), wd(w3,1), wd(w3,2), wd(w3,3), wd(w3,4),
    ]);

    // Rachel (SAFETY_OFFICER) — Mon-Fri, Riverside, no cost code, logged by Marcus
    await client.query(`
      INSERT INTO time_entries (id, tenant_id, project_id, user_id, date, hours_worked, cost_code_id, notes, hourly_rate_cents, created_at, updated_at, created_by)
      VALUES
        ($1, $6, $7, $8, $9,  8.0, NULL, 'Pre-task safety briefing and JSA review',     8000, NOW(), NOW(), $14),
        ($2, $6, $7, $8, $10, 8.0, NULL, 'Fall protection inspection — Levels 2–4',     8000, NOW(), NOW(), $14),
        ($3, $6, $7, $8, $11, 8.0, NULL, 'Safety audit and corrective action tracking', 8000, NOW(), NOW(), $14),
        ($4, $6, $7, $8, $12, 8.0, NULL, 'OSHA recordkeeping update and site walk',     8000, NOW(), NOW(), $14),
        ($5, $6, $7, $8, $13, 8.0, NULL, 'Toolbox talk + PPE compliance review',        8000, NOW(), NOW(), $14)
      ON CONFLICT (id) DO NOTHING
    `, [
      teId(27), teId(28), teId(29), teId(30), teId(31),
      D.tenant, D.riverside, TC.rachel,
      wd(w3,0), wd(w3,1), wd(w3,2), wd(w3,3), wd(w3,4),
      D.marcus,
    ]);

    // Timecards: week -3 (all approved)
    await client.query(`
      INSERT INTO timecards (id, tenant_id, user_id, week_start, status, total_hours, overtime_hours, submitted_at, approved_by, approved_at, created_at, updated_at, created_by)
      VALUES
        ($1, $5, $6, $9,  'approved', 40.0, 0.0, $10, $7,  $10, NOW(), NOW(), $6),
        ($2, $5, $7, $9,  'approved', 40.0, 0.0, $10, $6,  $10, NOW(), NOW(), $7),
        ($3, $5, $8, $9,  'approved', 40.0, 0.0, $10, $6,  $10, NOW(), NOW(), $8),
        ($4, $5, $11,$9,  'approved', 40.0, 0.0, $10, $6,  $10, NOW(), NOW(), $11)
      ON CONFLICT (id) DO NOTHING
    `, [
      TC.tc9, TC.tc10, TC.tc11, TC.tc12,
      D.tenant,
      D.marcus,   // $6 — Marcus (tc9 user; also approves Sarah/Patricia/Rachel)
      D.sarah,    // $7 — Sarah (tc10 user; approves Marcus's tc9)
      D.patricia, // $8 — Patricia (tc11 user)
      w3,         // $9 — week_start
      ts_approved3w,
      TC.rachel,  // $11 — Rachel (tc12 user)
    ]);
    console.log('✓ Week -3: Marcus, Sarah, Patricia, Rachel — all 40h approved');

    // ── 8. Week -2: Rejection + resubmit; Marcus BLI; Patricia ───────────
    console.log('  → Week -2 time entries...');

    // Sarah CORRECTED entries (4 × 9h = 36h after removing one incorrect day)
    await client.query(`
      INSERT INTO time_entries (id, tenant_id, project_id, user_id, date, hours_worked, cost_code_id, notes, hourly_rate_cents, created_at, updated_at, created_by)
      VALUES
        ($1, $5, $6, $7, $9,  9.0, $8, 'RFI responses and ASI review',            11000, NOW(), NOW(), $7),
        ($2, $5, $6, $7, $10, 9.0, $8, 'Subcontractor coordination meeting',       11000, NOW(), NOW(), $7),
        ($3, $5, $6, $7, $11, 9.0, $8, 'Cost report and owner billing package',    11000, NOW(), NOW(), $7),
        ($4, $5, $6, $7, $12, 9.0, $8, 'Punch list walk — corrected (was off-site)',11000,NOW(), NOW(), $7)
      ON CONFLICT (id) DO NOTHING
    `, [
      teId(32), teId(33), teId(34), teId(35),
      D.tenant, D.riverside, D.sarah, D.cc_finishes,
      wd(w2,0), wd(w2,1), wd(w2,2), wd(w2,3),
    ]);

    // Marcus entries — 5 days, 3 linked to bli_steel (cost allocation demo)
    await client.query(`
      INSERT INTO time_entries (id, tenant_id, project_id, user_id, date, hours_worked, cost_code_id, notes, hourly_rate_cents, budget_line_item_id, created_at, updated_at, created_by)
      VALUES
        ($1, $7, $8, $9, $11, 8.0, $10, 'Steel erection oversight — Level 2',         12500, $6, NOW(), NOW(), $9),
        ($2, $7, $8, $9, $12, 8.0, $10, 'Steel connections and bolt-up inspection',   12500, $6, NOW(), NOW(), $9),
        ($3, $7, $8, $9, $13, 8.0, $10, 'Steel deck install and survey',              12500, $6, NOW(), NOW(), $9),
        ($4, $7, $8, $9, $14, 8.0, $10, 'Owner coordination + change order review',  12500, NULL,NOW(), NOW(), $9),
        ($5, $7, $8, $9, $15, 8.0, $10, 'Schedule update and subcontractor walk',    12500, NULL,NOW(), NOW(), $9)
      ON CONFLICT (id) DO NOTHING
    `, [
      teId(36), teId(37), teId(38), teId(39), teId(40),
      D.bli_steel, // $6 — BLI for first 3 entries
      D.tenant, D.riverside, D.marcus, D.cc_steel,
      wd(w2,0), wd(w2,1), wd(w2,2), wd(w2,3), wd(w2,4),
    ]);

    // Patricia entries — 5 days, standard
    await client.query(`
      INSERT INTO time_entries (id, tenant_id, project_id, user_id, date, hours_worked, cost_code_id, notes, hourly_rate_cents, created_at, updated_at, created_by)
      VALUES
        ($1, $6, $7, $8, $9,  8.0, NULL, 'Invoice processing — Sparks Electric',     9500, NOW(), NOW(), $8),
        ($2, $6, $7, $8, $10, 8.0, NULL, 'Subcontract billing review',               9500, NOW(), NOW(), $8),
        ($3, $6, $7, $8, $11, 8.0, NULL, 'Payroll processing and OT verification',   9500, NOW(), NOW(), $8),
        ($4, $6, $7, $8, $12, 8.0, NULL, 'AR aging and lien waiver tracking',        9500, NOW(), NOW(), $8),
        ($5, $6, $7, $8, $13, 8.0, NULL, 'Cost forecast and budget vs actual update',9500, NOW(), NOW(), $8)
      ON CONFLICT (id) DO NOTHING
    `, [
      teId(41), teId(42), teId(43), teId(44), teId(45),
      D.tenant, D.riverside, D.patricia,
      wd(w2,0), wd(w2,1), wd(w2,2), wd(w2,3), wd(w2,4),
    ]);

    // Timecards: week -2
    // tc13: Sarah REJECTED — total_hours=40 (what was submitted before correction)
    // tc14: Sarah APPROVED (resubmit) — total_hours=36 (corrected)
    // tc15: Marcus APPROVED — total_hours=40, BLI entries show cost allocation
    // tc16: Patricia APPROVED — total_hours=40
    await client.query(`
      INSERT INTO timecards (id, tenant_id, user_id, week_start, status, total_hours, overtime_hours, submitted_at, approved_by, approved_at, rejection_note, created_at, updated_at, created_by)
      VALUES
        ($1, $5, $6, $9,  'rejected',  40.0, 0.0, $10, NULL, NULL,
          'Hours on Riverside on ${wd(w2,3)} (8h) do not match the site log — records show you were off-site. Please review your entries and resubmit.',
          NOW(), NOW(), $6),
        ($2, $5, $6, $9,  'approved',  36.0, 0.0, $11, $7,   $11, NULL, NOW(), NOW(), $6),
        ($3, $5, $7, $9,  'approved',  40.0, 0.0, $11, $6,   $11, NULL, NOW(), NOW(), $7),
        ($4, $5, $8, $9,  'approved',  40.0, 0.0, $11, $7,   $11, NULL, NOW(), NOW(), $8)
      ON CONFLICT (id) DO NOTHING
    `, [
      TC.tc13, TC.tc14, TC.tc15, TC.tc16,
      D.tenant,
      D.sarah,     // $6 — Sarah
      D.marcus,    // $7 — Marcus (approves others; Sarah approves his)
      D.patricia,  // $8 — Patricia
      w2,          // $9 — week_start
      daysAgo(14), // $10 — Sarah original submitted_at (before rejection)
      ts_approved2w,
    ]);
    console.log('✓ Week -2: Sarah rejected (40h) + resubmit approved (36h); Marcus approved w/ BLI; Patricia approved');

    // ── 9. Week -1: Admin approval queue ──────────────────────────────────
    console.log('  → Week -1 time entries...');

    // Marcus — 5 days, cc_steel
    await client.query(`
      INSERT INTO time_entries (id, tenant_id, project_id, user_id, date, hours_worked, cost_code_id, notes, hourly_rate_cents, created_at, updated_at, created_by)
      VALUES
        ($1, $6, $7, $8, $10, 8.0, $9, 'Steel Level 3 oversight and coordination', 12500, NOW(), NOW(), $8),
        ($2, $6, $7, $8, $11, 8.0, $9, 'Owner OAC meeting and action items',        12500, NOW(), NOW(), $8),
        ($3, $6, $7, $8, $12, 8.0, $9, 'Subcontractor schedule coordination',       12500, NOW(), NOW(), $8),
        ($4, $6, $7, $8, $13, 8.0, $9, 'RFI and submittal log review',             12500, NOW(), NOW(), $8),
        ($5, $6, $7, $8, $14, 8.0, $9, 'Weekly safety walk and close-out items',   12500, NOW(), NOW(), $8)
      ON CONFLICT (id) DO NOTHING
    `, [
      teId(46), teId(47), teId(48), teId(49), teId(50),
      D.tenant, D.riverside, D.marcus, D.cc_steel,
      wd(w1,0), wd(w1,1), wd(w1,2), wd(w1,3), wd(w1,4),
    ]);

    // Patricia — 5 days, 2 entries linked to bli_concrete
    await client.query(`
      INSERT INTO time_entries (id, tenant_id, project_id, user_id, date, hours_worked, cost_code_id, notes, hourly_rate_cents, budget_line_item_id, created_at, updated_at, created_by)
      VALUES
        ($1, $7, $8, $9, $10, 8.0, NULL, 'Concrete BLI reconciliation — cost actuals', 9500, $6, NOW(), NOW(), $9),
        ($2, $7, $8, $9, $11, 8.0, NULL, 'Concrete invoice matching and approval',      9500, $6, NOW(), NOW(), $9),
        ($3, $7, $8, $9, $12, 8.0, NULL, 'Payroll processing and OT calc review',       9500, NULL,NOW(), NOW(), $9),
        ($4, $7, $8, $9, $13, 8.0, NULL, 'QB sync — journal entries and bank rec',      9500, NULL,NOW(), NOW(), $9),
        ($5, $7, $8, $9, $14, 8.0, NULL, 'Cash flow forecast and draw schedule prep',   9500, NULL,NOW(), NOW(), $9)
      ON CONFLICT (id) DO NOTHING
    `, [
      teId(51), teId(52), teId(53), teId(54), teId(55),
      D.bli_concrete, // $6 — BLI for first 2 entries
      D.tenant, D.riverside, D.patricia,
      wd(w1,0), wd(w1,1), wd(w1,2), wd(w1,3), wd(w1,4),
    ]);

    // Rachel — 5 days, both projects, logged by Marcus
    await client.query(`
      INSERT INTO time_entries (id, tenant_id, project_id, user_id, date, hours_worked, cost_code_id, notes, hourly_rate_cents, created_at, updated_at, created_by)
      VALUES
        ($1, $6, $7, $8, $9,  8.0, NULL, 'Pre-task safety analysis — Riverside excavation', 8000, NOW(), NOW(), $14),
        ($2, $6, $7, $8, $10, 8.0, NULL, 'Fall arrest equipment inspection — Level 3',       8000, NOW(), NOW(), $14),
        ($3, $6, $7, $8, $11, 8.0, NULL, 'OSHA 300 log update and near-miss debrief',        8000, NOW(), NOW(), $14),
        ($4, $6, $7, $8, $12, 8.0, NULL, 'Safety orientation — 4 new hires',                 8000, NOW(), NOW(), $14),
        ($5, $6, $7, $8, $13, 8.0, NULL, 'Weekly safety report and corrective actions',      8000, NOW(), NOW(), $14)
      ON CONFLICT (id) DO NOTHING
    `, [
      teId(56), teId(57), teId(58), teId(59), teId(60),
      D.tenant, D.riverside, TC.rachel,
      wd(w1,0), wd(w1,1), wd(w1,2), wd(w1,3), wd(w1,4),
      D.marcus,
    ]);

    // Sarah — 3 days only (draft timecard, week not finished)
    await client.query(`
      INSERT INTO time_entries (id, tenant_id, project_id, user_id, date, hours_worked, cost_code_id, notes, hourly_rate_cents, created_at, updated_at, created_by)
      VALUES
        ($1, $4, $5, $6, $8, 8.0, $7, 'Submittal review and design meeting', 11000, NOW(), NOW(), $6),
        ($2, $4, $5, $6, $9, 8.0, $7, 'RFI log update and response drafting', 11000, NOW(), NOW(), $6),
        ($3, $4, $5, $6, $10, 8.0, $7, 'Punch list coordination with subs',   11000, NOW(), NOW(), $6)
      ON CONFLICT (id) DO NOTHING
    `, [
      teId(61), teId(62), teId(63),
      D.tenant, D.riverside, D.sarah, D.cc_finishes,
      wd(w1,0), wd(w1,1), wd(w1,2),
    ]);

    // Timecards: week -1 admin queue
    // tc17 Marcus submitted, tc18 Patricia submitted, tc19 Rachel submitted, tc20 Sarah draft
    await client.query(`
      INSERT INTO timecards (id, tenant_id, user_id, week_start, status, total_hours, overtime_hours, submitted_at, approved_by, approved_at, created_at, updated_at, created_by)
      VALUES
        ($1, $5, $6, $9, 'submitted', 40.0, 0.0, $10, NULL,NULL, NOW(), NOW(), $6),
        ($2, $5, $7, $9, 'submitted', 40.0, 0.0, $11, NULL,NULL, NOW(), NOW(), $7),
        ($3, $5, $8, $9, 'submitted', 40.0, 0.0, $12, NULL,NULL, NOW(), NOW(), $8),
        ($4, $5, $13,$9, 'draft',     24.0, 0.0, NULL,NULL,NULL, NOW(), NOW(), $13)
      ON CONFLICT (id) DO NOTHING
    `, [
      TC.tc17, TC.tc18, TC.tc19, TC.tc20,
      D.tenant,
      D.marcus,    // $6
      D.patricia,  // $7
      TC.rachel,   // $8
      w1,          // $9 — week_start
      ts_sub_marcus,
      ts_sub_patricia,
      ts_sub_rachel,
      D.sarah,     // $13 — Sarah draft
    ]);
    console.log('✓ Week -1: Marcus, Patricia, Rachel submitted (admin queue); Sarah draft (3 entries)');

    // ── 10. Current week: In progress ─────────────────────────────────────
    console.log('  → Current week entries...');

    // Marcus — 3 days (Mon/Tue/Wed), draft timecard
    await client.query(`
      INSERT INTO time_entries (id, tenant_id, project_id, user_id, date, hours_worked, cost_code_id, notes, hourly_rate_cents, created_at, updated_at, created_by)
      VALUES
        ($1, $4, $5, $6, $8, 8.0, $7, 'Weekly kickoff + site walk', 12500, NOW(), NOW(), $6),
        ($2, $4, $5, $6, $9, 8.0, $7, 'Owner meeting and RFI review',12500, NOW(), NOW(), $6),
        ($3, $4, $5, $6, $10, 8.0, $7, 'Subcontractor coordination', 12500, NOW(), NOW(), $6)
      ON CONFLICT (id) DO NOTHING
    `, [
      teId(64), teId(65), teId(66),
      D.tenant, D.riverside, D.marcus, D.cc_steel,
      wd(w0,0), wd(w0,1), wd(w0,2),
    ]);

    // Patricia — 2 days (Mon/Tue), NO timecard yet (tests "Open Timecard" button)
    await client.query(`
      INSERT INTO time_entries (id, tenant_id, project_id, user_id, date, hours_worked, cost_code_id, notes, hourly_rate_cents, created_at, updated_at, created_by)
      VALUES
        ($1, $3, $4, $5, $6,  8.0, NULL, 'AP processing — week open',      9500, NOW(), NOW(), $5),
        ($2, $3, $4, $5, $7, 8.0, NULL, 'Payroll prep and hours tracking', 9500, NOW(), NOW(), $5)
      ON CONFLICT (id) DO NOTHING
    `, [
      teId(67), teId(68),
      D.tenant, D.riverside, D.patricia,
      wd(w0,0), wd(w0,1),
    ]);

    // Marcus draft timecard for current week
    await client.query(`
      INSERT INTO timecards (id, tenant_id, user_id, week_start, status, total_hours, overtime_hours, created_at, updated_at, created_by)
      VALUES ($1, $2, $3, $4, 'draft', 24.0, 0.0, NOW(), NOW(), $3)
      ON CONFLICT (id) DO NOTHING
    `, [TC.tc21, D.tenant, D.marcus, w0]);
    console.log('✓ Current week: Marcus 24h draft; Patricia 16h entries (no timecard yet)');

    // ── 11. Audit log entries ──────────────────────────────────────────────
    console.log('  → Audit log entries...');
    const h0 = 'f'.repeat(64);
    const h1 = '1'.repeat(64);
    const h2 = '2'.repeat(64);
    const h3 = '3'.repeat(64);
    const h4 = '4'.repeat(64);
    const h5 = '5'.repeat(64);
    const h6 = '6'.repeat(64);

    await client.query(`
      INSERT INTO audit_log (id, tenant_id, category, action, actor_id, actor_email, actor_role, resource_type, resource_id, payload, ip_address, created_at, previous_hash, entry_hash)
      VALUES
        (gen_random_uuid(), $1, 'data', 'timecard.submitted',  $2, 'marcus@apexconstruction.demo',   'owner',           'timecard', $4,  '{}',                                                                          '127.0.0.1', $10, $13, $14),
        (gen_random_uuid(), $1, 'data', 'timecard.approved',   $2, 'marcus@apexconstruction.demo',   'owner',           'timecard', $5,  '{"approved_hours":51,"overtime_hours":11}',                                   '127.0.0.1', $11, $14, $15),
        (gen_random_uuid(), $1, 'data', 'timecard.rejected',   $2, 'marcus@apexconstruction.demo',   'owner',           'timecard', $6,  '{"rejection_note":"Hours on Riverside do not match site log — resubmit"}',   '127.0.0.1', $12, $15, $16),
        (gen_random_uuid(), $1, 'data', 'timecard.submitted',  $3, 'sarah@apexconstruction.demo',    'project_manager', 'timecard', $7,  '{"resubmission":true,"corrected_hours":36}',                                  '127.0.0.1', $12, $16, $17),
        (gen_random_uuid(), $1, 'data', 'timecard.approved',   $2, 'marcus@apexconstruction.demo',   'owner',           'timecard', $8,  '{"approved_hours":36}',                                                       '127.0.0.1', $12, $17, $18),
        (gen_random_uuid(), $1, 'data', 'payroll.push.queued', $2, 'marcus@apexconstruction.demo',   'owner',           'timecard', $9,  '{"provider":"quickbooks","realm_id":"demo-realm-apex-123"}',                  '127.0.0.1', $12, $18, $19)
      ON CONFLICT DO NOTHING
    `, [
      D.tenant,       // $1
      D.marcus,       // $2 — actor
      D.sarah,        // $3 — actor for resubmit
      // resources:
      TC.tc17,        // $4
      TC.tc8,         // $5
      TC.tc13,        // $6
      TC.tc14,        // $7
      TC.tc15,        // $8
      TC.tc16,        // $9
      // timestamps:
      ts_sub_marcus,  // $10
      ts_approved4w,  // $11
      ts_approved2w,  // $12 (reused for rows 3-6)
      // hashes:
      h0,             // $13
      h1,             // $14
      h2,             // $15
      h3,             // $16
      h4,             // $17
      h5,             // $18
      h6,             // $19
    ]);
    console.log('✓ Audit log: 6 timecard lifecycle entries');

    // ── Summary ────────────────────────────────────────────────────────────
    console.log(`
✅ Timecard seed complete!

Tenant:   Apex Construction → ENTERPRISE
New user: rachel@apexconstruction.demo (safety_officer)

Admin approval queue (/timecards) — 4 submitted timecards for last week:
  • Aaliyah Johnson — last week, 40h (existing from rich-seed)
  • Marcus Rivera   — last week, 40h (new)
  • Patricia Walsh  — last week, 40h with BLI links (new)
  • Rachel Kim      — last week, 40h (new)

Key scenarios to test:
  • Dmitri  wk-4: 51h total, 11h overtime (approved)
  • Sarah   wk-2: rejected tc + resubmit approved tc (rejection_note visible)
  • Marcus  wk-2: 3 entries linked to Steel BLI (cost allocation)
  • Patricia wk-1: 2 entries linked to Concrete BLI
  • Patricia current: 2 entries, no timecard opened (test "Open Timecard" button)
  • QuickBooks integration: active — approval enqueues payroll.quickbooks_push

Login credentials: demo-password-2026
`);
  } catch (err) {
    console.error('❌ Timecard seed failed:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
