/**
 * Rich test data seed — fills all pages with realistic data.
 * Runs on top of demo-seed.ts (must run demo-seed first).
 * Idempotent — safe to run multiple times (ON CONFLICT DO NOTHING).
 *
 * Run: npx tsx prisma/rich-seed.ts
 */

import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// ── Existing IDs from demo-seed.ts ─────────────────────────────────────────
const D = {
  tenant:    '11111111-0000-0000-0000-000000000001',
  marcus:    '22222222-0000-0000-0000-000000000001',
  sarah:     '22222222-0000-0000-0000-000000000002',
  jake:      '22222222-0000-0000-0000-000000000003',
  dmitri:    '22222222-0000-0000-0000-000000000004',
  aaliyah:   '22222222-0000-0000-0000-000000000005',
  patricia:  '22222222-0000-0000-0000-000000000006',
  riverside: '33333333-0000-0000-0000-000000000001',
  lofts:     '33333333-0000-0000-0000-000000000002',
  westfield: '33333333-0000-0000-0000-000000000003',
  cc_concrete: '44444444-0000-0000-0000-000000000001',
  cc_steel:    '44444444-0000-0000-0000-000000000002',
  cc_finishes: '44444444-0000-0000-0000-000000000003',
  cc_mech:     '44444444-0000-0000-0000-000000000004',
  cc_elec:     '44444444-0000-0000-0000-000000000005',
  bli_concrete:'55555555-0000-0000-0000-000000000001',
  bli_steel:   '55555555-0000-0000-0000-000000000002',
  bli_elec:    '55555555-0000-0000-0000-000000000005',
  bp1:         'dddddddd-0000-0000-0000-000000000001',
  to1:         'eeeeeeee-0000-0000-0000-000000000001',
  to2:         'eeeeeeee-0000-0000-0000-000000000002',
  to3:         'eeeeeeee-0000-0000-0000-000000000003',
  st1:         'ffffffff-0000-0000-0000-000000000001',
  st2:         'ffffffff-0000-0000-0000-000000000002',
  tc1:         'ffffffff-2000-0000-0000-000000000001',
};

// ── New IDs for rich-seed ───────────────────────────────────────────────────
const R = {
  // Sub-contractor tenant + users + connection
  subTenant:   '11111112-0000-0000-0000-000000000001',
  subUser1:    '22222223-0000-0000-0000-000000000001', // owner
  subUser2:    '22222223-0000-0000-0000-000000000002', // foreman
  connection1: '33333334-0000-0000-0000-000000000001',

  // Vendors
  v1: 'eeeeeeee-1000-0000-0000-000000000001', // Sparks Electric LLC
  v2: 'eeeeeeee-1000-0000-0000-000000000002', // BlueLine Plumbing
  v3: 'eeeeeeee-1000-0000-0000-000000000003', // Allied Steel Supply
  v4: 'eeeeeeee-1000-0000-0000-000000000004', // ProRent Equipment
  v5: 'eeeeeeee-1000-0000-0000-000000000005', // Sunrise Concrete
  v6: 'eeeeeeee-1000-0000-0000-000000000006', // Westside Finishes

  // Contracts
  con1: 'eeeeeeee-2000-0000-0000-000000000001', // Prime — Riverside
  con2: 'eeeeeeee-2000-0000-0000-000000000002', // Subcontract — electrical (Sparks)
  con3: 'eeeeeeee-2000-0000-0000-000000000003', // Subcontract — plumbing (BlueLine)

  // Vendor bids
  vb1: 'eeeeeeee-3000-0000-0000-000000000001',
  vb2: 'eeeeeeee-3000-0000-0000-000000000002',
  vb3: 'eeeeeeee-3000-0000-0000-000000000003',

  // Vendor bid line items
  vbli1: 'eeeeeeee-3100-0000-0000-000000000001',
  vbli2: 'eeeeeeee-3100-0000-0000-000000000002',
  vbli3: 'eeeeeeee-3100-0000-0000-000000000003',

  // Project members
  pm1: 'eeeeeeee-4000-0000-0000-000000000001',
  pm2: 'eeeeeeee-4000-0000-0000-000000000002',
  pm3: 'eeeeeeee-4000-0000-0000-000000000003',
  pm4: 'eeeeeeee-4000-0000-0000-000000000004',
  pm5: 'eeeeeeee-4000-0000-0000-000000000005',
  pm6: 'eeeeeeee-4000-0000-0000-000000000006',
  pm7: 'eeeeeeee-4000-0000-0000-000000000007',
  pm8: 'eeeeeeee-4000-0000-0000-000000000008',

  // Invoices (additional)
  inv3: 'eeeeeeee-5000-0000-0000-000000000001',
  inv4: 'eeeeeeee-5000-0000-0000-000000000002',
  inv5: 'eeeeeeee-5000-0000-0000-000000000003',

  // Markups
  mk1: 'eeeeeeee-6000-0000-0000-000000000001',
  mk2: 'eeeeeeee-6000-0000-0000-000000000002',
  mk3: 'eeeeeeee-6000-0000-0000-000000000003',

  // Submittals
  sub1: 'eeeeeeee-7000-0000-0000-000000000001',
  sub2: 'eeeeeeee-7000-0000-0000-000000000002',
  sub3: 'eeeeeeee-7000-0000-0000-000000000003',
  sub4: 'eeeeeeee-7000-0000-0000-000000000004',

  // Documents
  doc1: 'eeeeeeee-8000-0000-0000-000000000001',
  doc2: 'eeeeeeee-8000-0000-0000-000000000002',
  doc3: 'eeeeeeee-8000-0000-0000-000000000003',
  doc4: 'eeeeeeee-8000-0000-0000-000000000004',
  doc5: 'eeeeeeee-8000-0000-0000-000000000005',

  // JSA records
  jsa1: 'eeeeeeee-9000-0000-0000-000000000001',
  jsa2: 'eeeeeeee-9000-0000-0000-000000000002',

  // More timecards (various states)
  tc2: 'ffffffff-2000-0000-0000-000000000002',
  tc3: 'ffffffff-2000-0000-0000-000000000003',
  tc4: 'ffffffff-2000-0000-0000-000000000004',
  tc5: 'ffffffff-2000-0000-0000-000000000005',
  tc6: 'ffffffff-2000-0000-0000-000000000006',

  // More daily reports
  dr2: 'ffffffff-a000-0000-0000-000000000002',
  dr3: 'ffffffff-a000-0000-0000-000000000003',
  dr4: 'ffffffff-a000-0000-0000-000000000004',
  dr5: 'ffffffff-a000-0000-0000-000000000005',

  // More punch list
  pl4: 'ffffffff-b000-0000-0000-000000000004',
  pl5: 'ffffffff-b000-0000-0000-000000000005',
  pl6: 'ffffffff-b000-0000-0000-000000000006',
  pl7: 'ffffffff-b000-0000-0000-000000000007',

  // More time entries
  te5:  'ffffffff-c000-0000-0000-000000000005',
  te6:  'ffffffff-c000-0000-0000-000000000006',
  te7:  'ffffffff-c000-0000-0000-000000000007',
  te8:  'ffffffff-c000-0000-0000-000000000008',
  te9:  'ffffffff-c000-0000-0000-000000000009',
  te10: 'ffffffff-c000-0000-0000-000000000010',

  // Electrical
  ep1: 'ffffffff-d000-0000-0000-000000000001', // Main Panel
  ep2: 'ffffffff-d000-0000-0000-000000000002', // Sub-Panel A
  ec1: 'ffffffff-d100-0000-0000-000000000001',
  ec2: 'ffffffff-d100-0000-0000-000000000002',
  ec3: 'ffffffff-d100-0000-0000-000000000003',
  ec4: 'ffffffff-d100-0000-0000-000000000004',
  ec5: 'ffffffff-d100-0000-0000-000000000005',
  ec6: 'ffffffff-d100-0000-0000-000000000006',

  // Plumbing
  ps1: 'ffffffff-e000-0000-0000-000000000001', // Domestic Water Supply
  ps2: 'ffffffff-e000-0000-0000-000000000002', // Sanitary Drain
  pf1: 'ffffffff-e100-0000-0000-000000000001',
  pf2: 'ffffffff-e100-0000-0000-000000000002',
  pf3: 'ffffffff-e100-0000-0000-000000000003',
  pf4: 'ffffffff-e100-0000-0000-000000000004',
  pf5: 'ffffffff-e100-0000-0000-000000000005',
  pf6: 'ffffffff-e100-0000-0000-000000000006',

  // Notifications
  notif1: 'ffffffff-f000-0000-0000-000000000001',
  notif2: 'ffffffff-f000-0000-0000-000000000002',
  notif3: 'ffffffff-f000-0000-0000-000000000003',
  notif4: 'ffffffff-f000-0000-0000-000000000004',
  notif5: 'ffffffff-f000-0000-0000-000000000005',

  // User payroll settings
  ups1: 'ffffffff-0100-0000-0000-000000000001',
  ups2: 'ffffffff-0100-0000-0000-000000000002',
  ups3: 'ffffffff-0100-0000-0000-000000000003',
  ups4: 'ffffffff-0100-0000-0000-000000000004',
  ups5: 'ffffffff-0100-0000-0000-000000000005',
  ups6: 'ffffffff-0100-0000-0000-000000000006',

  // Tenant subscription
  ts1: 'ffffffff-0200-0000-0000-000000000001',
};

function daysAgo(n: number): string {
  return new Date(Date.now() - n * 86400000).toISOString();
}
function daysAgoDate(n: number): string {
  return new Date(Date.now() - n * 86400000).toISOString().split('T')[0];
}
function weekOf(daysAgoStart: number): string {
  const d = new Date(Date.now() - daysAgoStart * 86400000);
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().split('T')[0];
}

async function main() {
  const client = await pool.connect();
  try {
    console.log('🌱 Seeding rich test data...\n');

    // ── 1. Sub-contractor tenant ───────────────────────────────────────────
    console.log('  → Sub-contractor tenant...');
    await client.query(`
      INSERT INTO tenants (id, name, slug, tier, status, created_at, updated_at)
      VALUES ($1, 'Riverside Electric LLC', 'riverside-electric', 'starter', 'active', NOW(), NOW())
      ON CONFLICT (id) DO NOTHING
    `, [R.subTenant]);

    await client.query(`
      INSERT INTO users (id, tenant_id, email, password_hash, first_name, last_name, role, language_preference, status, created_at, updated_at)
      VALUES
        ($1, $2, 'tony@riverside-electric.demo', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uoHe', 'Tony', 'Morales', 'owner', 'en', 'active', NOW(), NOW()),
        ($3, $2, 'felix@riverside-electric.demo', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uoHe', 'Felix', 'Nguyen', 'foreman', 'en', 'active', NOW(), NOW())
      ON CONFLICT (id) DO NOTHING
    `, [R.subUser1, R.subTenant, R.subUser2]);

    // ── 2. Tenant connection (GC ↔ Sub) ──────────────────────────────────
    console.log('  → Tenant connection...');
    await client.query(`
      INSERT INTO tenant_connections (id, gc_tenant_id, sub_tenant_id, status, invited_by, created_at, updated_at)
      VALUES ($1, $2, $3, 'active', $4, NOW(), NOW())
      ON CONFLICT (id) DO NOTHING
    `, [R.connection1, D.tenant, R.subTenant, D.marcus]);

    // ── 3. Tenant subscription ─────────────────────────────────────────────
    console.log('  → Tenant subscription...');
    await client.query(`
      INSERT INTO tenant_subscriptions (id, tenant_id, tier, status, addon_gc_module, addon_cross_tenant, current_period_end, created_at, updated_at)
      VALUES ($1, $2, 'professional', 'active', true, true, $3, NOW(), NOW())
      ON CONFLICT (tenant_id) DO UPDATE SET
        tier = EXCLUDED.tier, status = EXCLUDED.status,
        addon_gc_module = EXCLUDED.addon_gc_module,
        addon_cross_tenant = EXCLUDED.addon_cross_tenant,
        current_period_end = EXCLUDED.current_period_end,
        updated_at = NOW()
    `, [R.ts1, D.tenant, daysAgo(-30)]);

    // ── 4. Project members ─────────────────────────────────────────────────
    console.log('  → Project members...');
    await client.query(`
      INSERT INTO project_members (id, tenant_id, project_id, user_id, role, created_at)
      VALUES
        ($1,  $9, $10, $11, 'project_manager', NOW()),
        ($2,  $9, $10, $12, 'foreman', NOW()),
        ($3,  $9, $10, $13, 'field_tech', NOW()),
        ($4,  $9, $14, $11, 'project_manager', NOW()),
        ($5,  $9, $14, $15, 'estimator', NOW()),
        ($6,  $9, $14, $16, 'accountant', NOW()),
        ($7,  $9, $17, $11, 'project_manager', NOW()),
        ($8,  $9, $17, $12, 'foreman', NOW())
      ON CONFLICT (id) DO NOTHING
    `, [
      R.pm1, R.pm2, R.pm3,
      R.pm4, R.pm5, R.pm6,
      R.pm7, R.pm8,
      D.tenant,
      D.riverside, D.sarah, D.dmitri, D.aaliyah,
      D.lofts,     D.jake,  D.patricia,
      D.westfield,
    ]);

    // ── 5. Vendors ──────────────────────────────────────────────────────────
    console.log('  → Vendors...');
    await client.query(`
      INSERT INTO vendors (id, tenant_id, name, vendor_type, trade_type, contact_name, contact_email, contact_phone, is_preferred, is_prequalified, created_at, updated_at, created_by)
      VALUES
        ($1,  $7, 'Sparks Electric LLC',    'subcontractor', 'electrical', 'Ray Sparks',   'ray@sparkselectric.com',    '555-0101', true,  true,  NOW(), NOW(), $8),
        ($2,  $7, 'BlueLine Plumbing',       'subcontractor', 'plumbing',  'Maria Torres', 'maria@bluelineplumbing.com', '555-0102', true,  true,  NOW(), NOW(), $8),
        ($3,  $7, 'Allied Steel Supply',     'supplier',      NULL,        'Jim Allan',    'jim@alliedsteel.com',        '555-0103', false, true,  NOW(), NOW(), $8),
        ($4,  $7, 'ProRent Equipment',       'equipment',     NULL,        'Dana Park',    'dana@prorent.com',           '555-0104', true,  false, NOW(), NOW(), $8),
        ($5,  $7, 'Sunrise Concrete Co.',    'subcontractor', 'concrete',  'Sam Riviera',  'sam@sunriseconcrete.com',    '555-0105', false, true,  NOW(), NOW(), $8),
        ($6,  $7, 'Westside Finishes Inc.',  'subcontractor', 'finishes',  'Kim West',     'kim@westsidefinishes.com',   '555-0106', false, false, NOW(), NOW(), $8)
      ON CONFLICT (id) DO NOTHING
    `, [R.v1, R.v2, R.v3, R.v4, R.v5, R.v6, D.tenant, D.marcus]);

    // ── 6. Contracts ───────────────────────────────────────────────────────
    console.log('  → Contracts...');
    await client.query(`
      INSERT INTO contracts (id, tenant_id, project_id, contract_type, vendor_id, original_value_cents, approved_co_value_cents, status, retainage_pct, executed_at, created_at, updated_at, created_by)
      VALUES
        ($1, $4, $5, 'prime_contract',  NULL,  485000000, 12500000, 'executed',          10, $6, NOW(), NOW(), $7),
        ($2, $4, $5, 'subcontract',     $8,     89500000,        0, 'executed',          10, $6, NOW(), NOW(), $7),
        ($3, $4, $5, 'subcontract',     $9,     42000000,   875000, 'pending_signature',  5, NULL, NOW(), NOW(), $7)
      ON CONFLICT (id) DO NOTHING
    `, [R.con1, R.con2, R.con3, D.tenant, D.riverside, daysAgo(45), D.marcus, R.v1, R.v2]);

    // ── 7. Vendor bids ─────────────────────────────────────────────────────
    console.log('  → Vendor bids...');
    await client.query(`
      INSERT INTO vendor_bids (id, tenant_id, bid_package_id, vendor_id, status, submitted_at, total_amount_cents, notes, created_at, updated_at, created_by)
      VALUES
        ($1, $4, $5, $6, 'awarded',   $7,  89500000, 'Best value bid, references verified',  NOW(), NOW(), $8),
        ($2, $4, $5, $9, 'submitted', $7,  97200000, 'Higher price but faster timeline',      NOW(), NOW(), $8),
        ($3, $4, $5, $10,'declined',  $7, 105000000, 'Out of budget range',                   NOW(), NOW(), $8)
      ON CONFLICT (id) DO NOTHING
    `, [R.vb1, R.vb2, R.vb3, D.tenant, D.bp1, R.v1, daysAgo(20), D.jake, R.v3, R.v4]);

    await client.query(`
      INSERT INTO vendor_bid_line_items (id, tenant_id, vendor_bid_id, takeoff_item_id, unit_cost_cents, total_cost_cents, notes, created_at, updated_at, created_by)
      VALUES
        ($1, $4, $5, $6,  285000, 28500000, 'Unit price per panel',     NOW(), NOW(), $9),
        ($2, $4, $5, $7,    1450,  7250000, 'Per linear foot installed', NOW(), NOW(), $9),
        ($3, $4, $5, $8,   9500, 14250000,  'Per fixture trimmed out',   NOW(), NOW(), $9)
      ON CONFLICT (id) DO NOTHING
    `, [R.vbli1, R.vbli2, R.vbli3, D.tenant, R.vb1, D.to1, D.to2, D.to3, D.marcus]);

    // ── 8. Additional invoices ─────────────────────────────────────────────
    console.log('  → Additional invoices...');
    await client.query(`
      INSERT INTO invoices (id, tenant_id, project_id, amount_cents, status, due_date, contract_id, created_at, updated_at, created_by)
      VALUES
        ($1, $4, $5,  24375000, 'sent',  $6, $7, NOW(), NOW(), $8),
        ($2, $4, $5,  24375000, 'paid',  $9, $7, $10,   NOW(), $8),
        ($3, $4, $11, 16750000, 'draft', $6, NULL, NOW(), NOW(), $8)
      ON CONFLICT (id) DO NOTHING
    `, [
      R.inv3, R.inv4, R.inv5,
      D.tenant,
      D.riverside, daysAgo(-15), R.con1, D.patricia, daysAgo(-45),
      daysAgo(30),
      D.lofts,
    ]);

    // ── 9. Markups ─────────────────────────────────────────────────────────
    console.log('  → Markups...');
    await client.query(`
      INSERT INTO markups (id, tenant_id, project_id, name, percentage, created_at, updated_at, created_by)
      VALUES
        ($1, $4, $5, 'Overhead & Profit', 15.00, NOW(), NOW(), $6),
        ($2, $4, $5, 'Sales Tax',          8.75, NOW(), NOW(), $6),
        ($3, $4, $7, 'Overhead & Profit', 15.00, NOW(), NOW(), $6)
      ON CONFLICT (id) DO NOTHING
    `, [R.mk1, R.mk2, R.mk3, D.tenant, D.riverside, D.jake, D.lofts]);

    // ── 10. Submittals ──────────────────────────────────────────────────────
    console.log('  → Submittals...');
    await client.query(`
      INSERT INTO submittals (id, tenant_id, project_id, number, title, status, spec_section, created_at, updated_at, created_by)
      VALUES
        ($1, $5, $6, 1, 'Structural Steel Shop Drawings',  'approved',        '05 12 00', NOW(), NOW(), $7),
        ($2, $5, $6, 2, 'Electrical Panel Submittals',     'submitted', '26 24 16', NOW(), NOW(), $7),
        ($3, $5, $6, 3, 'Plumbing Fixtures Cut Sheets',    'draft',     '22 40 00', NOW(), NOW(), $7),
        ($4, $5, $8, 1, 'Exterior Window Specifications',  'approved',  '08 50 00', NOW(), NOW(), $7)
      ON CONFLICT (id) DO NOTHING
    `, [R.sub1, R.sub2, R.sub3, R.sub4, D.tenant, D.riverside, D.sarah, D.lofts]);

    // ── 11. Documents ───────────────────────────────────────────────────────
    console.log('  → Documents...');
    await client.query(`
      INSERT INTO documents (id, tenant_id, project_id, doc_type, title, storage_path, file_size_bytes, status, created_at, updated_at, created_by)
      VALUES
        ($1, $6, $7, 'plan',     'Site Plan — Sheet A1.0',          $9,  2458624, 'active', NOW(), NOW(), $8),
        ($2, $6, $7, 'spec',     'Division 03 — Concrete Specs',    $10, 1024000, 'active', NOW(), NOW(), $8),
        ($3, $6, $7, 'contract', 'Prime Contract — Riverside Med',  $11, 3145728, 'active', NOW(), NOW(), $8),
        ($4, $6, $12,'plan',     'Floor Plan — Level 1',            $13, 1887436, 'active', NOW(), NOW(), $8),
        ($5, $6, $12,'rfi',      'RFI Response — Door Frame Detail', $14,  512000, 'active', NOW(), NOW(), $8)
      ON CONFLICT (id) DO NOTHING
    `, [
      R.doc1, R.doc2, R.doc3, R.doc4, R.doc5,
      D.tenant, D.riverside, D.sarah,
      `${D.tenant}/live/projects/${D.riverside}/plans/site-plan-a1.pdf`,
      `${D.tenant}/live/projects/${D.riverside}/specs/div03-concrete.pdf`,
      `${D.tenant}/live/projects/${D.riverside}/contracts/prime-contract.pdf`,
      D.lofts,
      `${D.tenant}/live/projects/${D.lofts}/plans/floor-plan-l1.pdf`,
      `${D.tenant}/live/projects/${D.lofts}/rfis/rfi-001-response.pdf`,
    ]);

    // ── 12. JSA records ──────────────────────────────────────────────────────
    console.log('  → JSA records...');
    const jsa1Attendees = JSON.stringify([
      { user_id: D.dmitri,  name: 'Dmitri Volkov',   signature_at: daysAgo(3) },
      { user_id: D.aaliyah, name: 'Aaliyah Johnson', signature_at: daysAgo(3) },
    ]);
    const jsa1Hazards = JSON.stringify([
      { description: 'Elevated work above 6 ft', controls: 'Fall protection harness required', severity: 'high' },
      { description: 'Power tools near water', controls: 'GFCI protection, rubber mats', severity: 'medium' },
      { description: 'Heavy materials overhead', controls: 'Hard hats mandatory, exclusion zone 10ft', severity: 'high' },
    ]);
    const jsa2Attendees = JSON.stringify([
      { user_id: D.dmitri, name: 'Dmitri Volkov', signature_at: daysAgo(10) },
    ]);
    const jsa2Hazards = JSON.stringify([
      { description: 'Confined space entry', controls: 'Air monitoring required, buddy system', severity: 'high' },
      { description: 'Chemical exposure — epoxy fumes', controls: 'N95 respirator, ventilation fans', severity: 'medium' },
    ]);

    await client.query(`
      INSERT INTO jsa_records (id, tenant_id, project_id, title, conducted_at, attendees, hazards, created_at, updated_at, created_by)
      VALUES
        ($1, $3, $4, 'Pre-Task JSA — Structural Steel Installation', $5, $6, $7, NOW(), NOW(), $8),
        ($2, $3, $4, 'Pre-Task JSA — Mechanical Room Entry',         $9, $10,$11,NOW(), NOW(), $8)
      ON CONFLICT (id) DO NOTHING
    `, [
      R.jsa1, R.jsa2,
      D.tenant, D.riverside,
      daysAgo(3), jsa1Attendees, jsa1Hazards, D.dmitri,
      daysAgo(10), jsa2Attendees, jsa2Hazards,
    ]);

    // ── 13. More timecards ──────────────────────────────────────────────────
    console.log('  → Additional timecards...');
    await client.query(`
      INSERT INTO timecards (id, tenant_id, user_id, week_start, status, total_hours, overtime_hours, submitted_at, approved_by, approved_at, created_at, updated_at, created_by)
      VALUES
        ($1,  $6, $7,  $9,  'approved',  40.0, 0.0, $10, $7,  $10, NOW(), NOW(), $7),
        ($2,  $6, $8,  $9,  'approved',  37.5, 0.0, $10, $7,  $10, NOW(), NOW(), $8),
        ($3,  $6, $8,  $11, 'submitted', 40.0, 0.0, $12, NULL,NULL, NOW(), NOW(), $8),
        ($4,  $6, $7,  $13, 'draft',      0.0, 0.0, NULL,NULL,NULL, NOW(), NOW(), $7),
        ($5,  $6, $8,  $13, 'draft',      0.0, 0.0, NULL,NULL,NULL, NOW(), NOW(), $8)
      ON CONFLICT (id) DO NOTHING
    `, [
      R.tc2, R.tc3, R.tc4, R.tc5, R.tc6,
      D.tenant,
      D.dmitri,   // $7
      D.aaliyah,  // $8
      weekOf(14), daysAgo(8),  // $9=2wk ago week, $10=approved ts
      weekOf(7),  daysAgo(3),  // $11=last week, $12=submitted ts
      weekOf(0),               // $13=this week
    ]);

    // ── 14. More daily reports ──────────────────────────────────────────────
    console.log('  → Additional daily reports...');
    const weatherSunny = JSON.stringify({ condition: 'Sunny', temp_f: 72, wind_mph: 5, humidity_pct: 45 });
    const weatherCloudy = JSON.stringify({ condition: 'Partly Cloudy', temp_f: 65, wind_mph: 12, humidity_pct: 60 });
    const weatherRain = JSON.stringify({ condition: 'Rain', temp_f: 58, wind_mph: 18, humidity_pct: 88 });

    await client.query(`
      INSERT INTO daily_reports (id, tenant_id, project_id, report_date, weather, notes, created_at, updated_at, created_by)
      VALUES
        ($1, $5, $6, $7, $8,  'Steel deck placement on Level 3 completed. Crew of 12 on site. No incidents.', NOW(), NOW(), $9),
        ($2, $5, $6, $10,$11, 'MEP rough-in continues — 60% complete on Level 2. Punch items reviewed with Sarah.', NOW(), NOW(), $9),
        ($3, $5, $6, $12,$13, 'Rain delay — work suspended at 11am. Site secured. Resumed tomorrow.', NOW(), NOW(), $9),
        ($4, $5, $6, $14,$8,  'Concrete pour for Column Line B complete. Strength test samples taken.', NOW(), NOW(), $9)
      ON CONFLICT (id) DO NOTHING
    `, [
      R.dr2, R.dr3, R.dr4, R.dr5,
      D.tenant, D.riverside,
      daysAgoDate(2), weatherSunny, D.dmitri,
      daysAgoDate(4), weatherCloudy,
      daysAgoDate(6), weatherRain,
      daysAgoDate(8),
    ]);

    // ── 15. More punch list items ───────────────────────────────────────────
    console.log('  → Additional punch list items...');
    await client.query(`
      INSERT INTO punch_list_items (id, tenant_id, project_id, title, description, status, assigned_to, due_date, created_at, updated_at, created_by)
      VALUES
        ($1, $5, $6, 'Caulk window perimeter — Room 212', 'Backer rod and sealant missing at sill', 'open',        $7, $8, NOW(), NOW(), $9),
        ($2, $5, $6, 'Replace cracked tile — Lobby', '3 tiles cracked near elevator bank', 'in_progress', $7, $8, NOW(), NOW(), $9),
        ($3, $5, $6, 'Touch-up paint — Stairwell B', 'Scuffs and drips on handrail wall', 'open',        $10,$11,NOW(), NOW(), $9),
        ($4, $5, $12,'Adjust door closer — Suite 101', 'Closes too fast, adjust to 3-second sweep', 'open',     $7, $13,NOW(), NOW(), $9)
      ON CONFLICT (id) DO NOTHING
    `, [
      R.pl4, R.pl5, R.pl6, R.pl7,
      D.tenant, D.riverside, D.aaliyah, daysAgo(-7), D.sarah,
      D.dmitri, daysAgo(-3),
      D.lofts, daysAgo(-5),
    ]);

    // ── 16. More time entries ───────────────────────────────────────────────
    console.log('  → Additional time entries...');
    await client.query(`
      INSERT INTO time_entries (id, tenant_id, project_id, user_id, date, hours_worked, cost_code_id, notes, hourly_rate_cents, created_at, updated_at, created_by)
      VALUES
        ($1,  $7, $8, $9,  $13, 8.0, $10, 'Foundation formwork', 9500, NOW(), NOW(), $9),
        ($2,  $7, $8, $9,  $14, 8.5, $10, 'Rebar placement',     9500, NOW(), NOW(), $9),
        ($3,  $7, $8, $11, $13, 8.0, $12, 'Conduit rough-in',    8500, NOW(), NOW(), $11),
        ($4,  $7, $8, $11, $14, 7.5, $12, 'Panel installation',  8500, NOW(), NOW(), $11),
        ($5,  $7, $15,$9,  $13, 8.0, $10, 'Slab pour',           9500, NOW(), NOW(), $9),
        ($6,  $7, $15,$11, $13, 8.0, $12, 'MEP coordination',    8500, NOW(), NOW(), $11)
      ON CONFLICT (id) DO NOTHING
    `, [
      R.te5, R.te6, R.te7, R.te8, R.te9, R.te10,
      D.tenant, D.riverside,
      D.dmitri, D.cc_concrete, D.aaliyah, D.cc_elec,
      daysAgoDate(5), daysAgoDate(4),
      D.lofts,
    ]);

    // ── 17. Electrical panels + circuits ──────────────────────────────────
    console.log('  → Electrical panels + circuits...');
    await client.query(`
      INSERT INTO electrical_panels (id, tenant_id, project_id, name, amperage, voltage, location, notes, created_at, updated_at, created_by)
      VALUES
        ($1, $3, $4, 'Main Distribution Panel', 400, 480, 'Electrical Room B1', 'Fed from utility transformer, 3-phase 4-wire', NOW(), NOW(), $5),
        ($2, $3, $4, 'Sub-Panel LP-1',          200, 240, 'Level 1 Electrical Closet', 'Feeds Levels 1-2 lighting and receptacles', NOW(), NOW(), $5)
      ON CONFLICT (id) DO NOTHING
    `, [R.ep1, R.ep2, D.tenant, D.riverside, D.aaliyah]);

    await client.query(`
      INSERT INTO electrical_circuits (id, tenant_id, panel_id, circuit_number, description, amperage, status, created_at, updated_at, created_by)
      VALUES
        ($1, $7, $8,  1, 'Lighting — OR Suite 1',         20, 'complete',   NOW(), NOW(), $9),
        ($2, $7, $8,  3, 'Lighting — OR Suite 2',         20, 'complete',   NOW(), NOW(), $9),
        ($3, $7, $8,  5, 'Receptacles — Nurses Station A',20, 'roughed_in', NOW(), NOW(), $9),
        ($4, $7, $8,  7, 'Medical Gas Panel Feed',        30, 'planned',    NOW(), NOW(), $9),
        ($5, $7, $10, 1, 'Lighting — Level 1 Corridor',   20, 'complete',   NOW(), NOW(), $9),
        ($6, $7, $10, 3, 'Receptacles — Reception',       20, 'roughed_in', NOW(), NOW(), $9)
      ON CONFLICT (id) DO NOTHING
    `, [R.ec1, R.ec2, R.ec3, R.ec4, R.ec5, R.ec6, D.tenant, R.ep1, D.aaliyah, R.ep2]);

    // ── 18. Plumbing systems + fixtures ──────────────────────────────────
    console.log('  → Plumbing systems + fixtures...');
    await client.query(`
      INSERT INTO plumbing_systems (id, tenant_id, project_id, name, system_type, notes, created_at, updated_at, created_by)
      VALUES
        ($1, $3, $4, 'Domestic Cold Water', 'supply', '3/4" copper main, branches to all fixtures', NOW(), NOW(), $5),
        ($2, $3, $4, 'Sanitary Drain', 'drain', '4" PVC main drain to city sewer connection', NOW(), NOW(), $5)
      ON CONFLICT (id) DO NOTHING
    `, [R.ps1, R.ps2, D.tenant, D.riverside, D.dmitri]);

    await client.query(`
      INSERT INTO plumbing_fixtures (id, tenant_id, system_id, fixture_type, location, status, created_at, updated_at, created_by)
      VALUES
        ($1,  $7, $8, 'sink',    'Break Room 101',     'complete',  NOW(), NOW(), $9),
        ($2,  $7, $8, 'sink',    'Patient Room 201',   'rough_in',  NOW(), NOW(), $9),
        ($3,  $7, $8, 'hose_bib','Exterior — East Wall','planned',  NOW(), NOW(), $9),
        ($4,  $7, $10,'toilet',  'Restroom A — Level 1','complete', NOW(), NOW(), $9),
        ($5,  $7, $10,'toilet',  'Restroom B — Level 1','complete', NOW(), NOW(), $9),
        ($6,  $7, $10,'shower',  'Patient Room 201',    'planned',  NOW(), NOW(), $9)
      ON CONFLICT (id) DO NOTHING
    `, [R.pf1, R.pf2, R.pf3, R.pf4, R.pf5, R.pf6, D.tenant, R.ps1, D.dmitri, R.ps2]);

    // ── 19. Schedule tasks + milestones ──────────────────────────────────
    console.log('  → Schedule tasks (Riverside Medical)...');
    const st = {
      // Riverside Medical — full project lifecycle
      r1: 'eeeeeeee-aa00-0000-0000-000000000001',
      r2: 'eeeeeeee-aa00-0000-0000-000000000002',
      r3: 'eeeeeeee-aa00-0000-0000-000000000003',
      r4: 'eeeeeeee-aa00-0000-0000-000000000004',
      r5: 'eeeeeeee-aa00-0000-0000-000000000005',
      r6: 'eeeeeeee-aa00-0000-0000-000000000006',
      // Downtown Lofts — 3 tasks
      l1: 'eeeeeeee-ab00-0000-0000-000000000001',
      l2: 'eeeeeeee-ab00-0000-0000-000000000002',
      l3: 'eeeeeeee-ab00-0000-0000-000000000003',
    };
    const ms = {
      m1: 'eeeeeeee-ac00-0000-0000-000000000001',
      m2: 'eeeeeeee-ac00-0000-0000-000000000002',
      m3: 'eeeeeeee-ac00-0000-0000-000000000003',
    };

    await client.query(`
      INSERT INTO schedule_tasks (id, tenant_id, project_id, title, status, percent_complete, planned_start, planned_end, actual_start, actual_end, assigned_to_user_id, predecessor_task_id, show_in_client_portal, created_at, updated_at, created_by)
      VALUES
        ($1,  $10, $11, 'Site Mobilization & Prep',       'complete',    100, $12, $13, $12, $13, $14, NULL, true,  NOW(), NOW(), $15),
        ($2,  $10, $11, 'Foundation & Structural Steel',  'complete',    100, $16, $17, $16, $17, $14, $1,  true,  NOW(), NOW(), $15),
        ($3,  $10, $11, 'MEP Rough-In (Levels 1–3)',      'in_progress',  65, $18, $19, $18, NULL,$14, $2,  false, NOW(), NOW(), $15),
        ($4,  $10, $11, 'Exterior Skin & Roofing',        'in_progress',  40, $20, $21, $20, NULL,$14, $2,  false, NOW(), NOW(), $15),
        ($5,  $10, $11, 'Interior Finishes & Millwork',   'not_started',   0, $22, $23, NULL,NULL,$15, $3,  false, NOW(), NOW(), $15),
        ($6,  $10, $11, 'Commissioning & Punch List',     'not_started',   0, $24, $25, NULL,NULL,$15, $5,  true,  NOW(), NOW(), $15),
        ($7,  $10, $26, 'Demo & Abatement',               'complete',    100, $27, $28, $27, $28, $14, NULL, false, NOW(), NOW(), $15),
        ($8,  $10, $26, 'Structural Framing',             'in_progress',  55, $29, $30, $29, NULL,$14, $7,  false, NOW(), NOW(), $15),
        ($9,  $10, $26, 'MEP Install',                    'not_started',   0, $31, $32, NULL,NULL,$14, $8,  false, NOW(), NOW(), $15)
      ON CONFLICT (id) DO NOTHING
    `, [
      st.r1, st.r2, st.r3, st.r4, st.r5, st.r6,
      st.l1, st.l2, st.l3,
      D.tenant,          // $10
      D.riverside,       // $11
      daysAgoDate(90), daysAgoDate(75),  // r1 start/end ($12,$13)
      D.dmitri,          // $14 assigned foreman
      D.sarah,           // $15 assigned PM
      daysAgoDate(74), daysAgoDate(50),  // r2 start/end ($16,$17)
      daysAgoDate(49), daysAgo(-10).split('T')[0],  // r3 start/end ($18,$19)
      daysAgoDate(20),   daysAgo(-20).split('T')[0], // r4 start/end ($20,$21)
      daysAgo(-5).split('T')[0],  daysAgo(-45).split('T')[0], // r5 start/end ($22,$23)
      daysAgo(-40).split('T')[0], daysAgo(-60).split('T')[0], // r6 start/end ($24,$25)
      D.lofts,           // $26
      daysAgoDate(60), daysAgoDate(40),  // l1 start/end ($27,$28)
      daysAgoDate(39), daysAgo(-15).split('T')[0],  // l2 start/end ($29,$30)
      daysAgo(-10).split('T')[0], daysAgo(-35).split('T')[0], // l3 start/end ($31,$32)
    ]);

    console.log('  → Milestones (Riverside Medical)...');
    await client.query(`
      INSERT INTO milestones (id, tenant_id, project_id, title, due_date, schedule_task_id, completed_at, created_at, updated_at, created_by)
      VALUES
        ($1, $4, $5, 'Foundation Complete',    $6::date, $7,  $6::timestamptz, NOW(), NOW(), $8),
        ($2, $4, $5, 'MEP Sign-Off',           $9, $10, NULL, NOW(), NOW(), $8),
        ($3, $4, $5, 'Substantial Completion', $11,$12, NULL, NOW(), NOW(), $8)
      ON CONFLICT (id) DO NOTHING
    `, [
      ms.m1, ms.m2, ms.m3,
      D.tenant, D.riverside,
      daysAgoDate(50), st.r2, D.sarah,  // m1: foundation complete ($6,$7,$8)
      daysAgo(-10).split('T')[0], st.r3, // m2: mep sign-off ($9,$10)
      daysAgo(-60).split('T')[0], st.r6, // m3: substantial completion ($11,$12)
    ]);

    // ── 19b. Notifications for Marcus ──────────────────────────────────────
    console.log('  → Notifications...');
    await client.query(`
      INSERT INTO notifications (id, tenant_id, user_id, title, body, category, read_at, data, created_at)
      VALUES
        ($1, $6, $7, 'Timecard Approved',         'Dmitri Volkov''s timecard for week of ${weekOf(14)} has been approved.',          'project',        $8, '{}', $9),
        ($2, $6, $7, 'New Change Order Submitted', 'Change Order #3 "Structural Steel Upgrade" requires your review.',                'financial',      NULL, '{}', $10),
        ($3, $6, $7, 'Safety Incident Filed',      'A near-miss incident was reported on Riverside Medical — review required.',       'safety',         NULL, '{}', $11),
        ($4, $6, $7, 'Submittal Approved',         'Submittal #1 "Structural Steel Shop Drawings" has been approved by the architect.','project',       $8,  '{}', $12),
        ($5, $6, $7, 'Invoice Overdue',            'Invoice #INV-003 for $243,750 on Riverside Medical is past due.',                 'financial',      NULL, '{}', $13)
      ON CONFLICT (id) DO NOTHING
    `, [
      R.notif1, R.notif2, R.notif3, R.notif4, R.notif5,
      D.tenant, D.marcus,
      daysAgo(0),         // read_at for read notifications
      daysAgo(1),         // notif1 created
      daysAgo(2),         // notif2 created
      daysAgo(3),         // notif3 created
      daysAgo(5),         // notif4 created
      daysAgo(7),         // notif5 created
    ]);

    // ── 20. User payroll settings ─────────────────────────────────────────
    console.log('  → User payroll settings...');
    await client.query(`
      INSERT INTO user_payroll_settings (id, tenant_id, user_id, employment_type, default_hourly_rate_cents, overtime_multiplier, pay_frequency, created_at, updated_at)
      VALUES
        ($1, $7, $8,  'w2',            11500, 1.50, 'biweekly',   NOW(), NOW()),
        ($2, $7, $9,  'w2',             9500, 1.50, 'biweekly',   NOW(), NOW()),
        ($3, $7, $10, 'w2',             8500, 1.50, 'biweekly',   NOW(), NOW()),
        ($4, $7, $11, 'w2',             8500, 1.50, 'biweekly',   NOW(), NOW()),
        ($5, $7, $12, 'w2',             9500, 1.50, 'biweekly',   NOW(), NOW()),
        ($6, $7, $13, 'contractor_1099',9000, 1.00, 'monthly',    NOW(), NOW())
      ON CONFLICT (id) DO NOTHING
    `, [
      R.ups1, R.ups2, R.ups3, R.ups4, R.ups5, R.ups6,
      D.tenant,
      D.marcus, D.sarah, D.jake, D.dmitri, D.aaliyah, D.patricia,
    ]);

    // ── 21. Audit log entries ─────────────────────────────────────────────
    console.log('  → Audit log...');
    const hash0 = 'a'.repeat(64);
    const hash1 = 'b'.repeat(64);
    const hash2 = 'c'.repeat(64);
    const hash3 = 'd'.repeat(64);
    const hash4 = 'e'.repeat(64);

    await client.query(`
      INSERT INTO audit_log (id, tenant_id, category, action, actor_id, actor_email, actor_role, resource_type, resource_id, payload, ip_address, created_at, previous_hash, entry_hash)
      VALUES
        (gen_random_uuid(), $1, 'auth',  'user.login',           $2, 'marcus@apexconstruction.demo', 'owner',           'user',    $2, '{}', '127.0.0.1', $7, $11, $11),
        (gen_random_uuid(), $1, 'data',  'project.created',      $2, 'marcus@apexconstruction.demo', 'owner',           'project', $3, '{}', '127.0.0.1', $8, $11, $12),
        (gen_random_uuid(), $1, 'data',  'invoice.sent',         $4, 'patricia@apexconstruction.demo','accountant',     'invoice', $5, '{}', '127.0.0.1', $9, $12, $13),
        (gen_random_uuid(), $1, 'data',  'timecard.approved',    $2, 'marcus@apexconstruction.demo', 'owner',           'timecard',$6, '{}', '127.0.0.1', $10,$13, $14),
        (gen_random_uuid(), $1, 'admin', 'change_order.approved',$2, 'marcus@apexconstruction.demo', 'owner',           'change_order',NULL,'{}','127.0.0.1',$10,$14,$15)
      ON CONFLICT DO NOTHING
    `, [
      D.tenant, D.marcus, D.riverside, D.patricia,
      R.inv3, D.tc1,
      daysAgo(10), daysAgo(8), daysAgo(5), daysAgo(2),
      hash0, hash1, hash2, hash3, hash4,
    ]);

    console.log('\n✅ Rich test data seeded successfully!\n');
    console.log('  Sub-tenant:     Riverside Electric LLC (slug: riverside-electric)');
    console.log('  Sub users:      tony@riverside-electric.demo / felix@riverside-electric.demo');
    console.log('  Password:       demo-password-2026');
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error('❌ Rich seed failed:', err);
  process.exit(1);
});
