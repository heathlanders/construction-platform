/**
 * Design Partner Seed — Session 31
 * Layers on top of demo-seed.ts + rich-seed.ts
 * Run order: demo-seed → rich-seed → design-partner-seed
 *
 * Run: npx tsx prisma/design-partner-seed.ts
 * Idempotent — safe to run multiple times (ON CONFLICT DO NOTHING)
 *
 * Covers every feature area not seeded by demo/rich seeds:
 *   - Tier upgrade to BUSINESS (unlocks asset management T-56)
 *   - Safety certifications for Dmitri (enables cert-check tests T-57)
 *   - Electrical panels + circuits (Riverside project)
 *   - Plumbing systems + fixtures (Riverside project)
 *   - JSA records (Riverside project)
 *   - Electrical permit (active, Riverside) + 5 AHJ inspection milestones
 *   - Blueprint analysis (review_ready, 12 tasks + 5 permit milestones injected)
 *   - 20 company assets across all categories
 *   - Asset groups, meter readings, project assignments, operator assignments
 *   - Asset checkouts (incl. 1 overdue), reservations
 *   - Asset service records + maintenance schedules (1 overdue)
 *   - Asset inspection template + inspections (1 pass, 1 fail → OOS)
 *   - Asset warranties (1 expiring in 25 days)
 *   - Fleet insurance policy + asset links
 *   - Asset registrations (1 expiring in 12 days)
 *   - Asset fuel logs
 *   - Asset depreciation schedules + 3 months of entries each
 *   - Asset damage incident
 *   - Asset safety-critical recall (drives notification test)
 */

import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// ── IDs from demo-seed.ts ──────────────────────────────────────────────────
const D = {
  tenant:    '11111111-0000-0000-0000-000000000001',
  marcus:    '22222222-0000-0000-0000-000000000001', // owner
  sarah:     '22222222-0000-0000-0000-000000000002', // project_manager
  jake:      '22222222-0000-0000-0000-000000000003', // estimator
  dmitri:    '22222222-0000-0000-0000-000000000004', // foreman
  aaliyah:   '22222222-0000-0000-0000-000000000005', // field_tech
  patricia:  '22222222-0000-0000-0000-000000000006', // accountant
  riverside: '33333333-0000-0000-0000-000000000001',
  lofts:     '33333333-0000-0000-0000-000000000002',
  westfield: '33333333-0000-0000-0000-000000000003',
};

// ── IDs from rich-seed.ts ──────────────────────────────────────────────────
const R = {
  v1: 'eeeeeeee-1000-0000-0000-000000000001', // Sparks Electric LLC
  v4: 'eeeeeeee-1000-0000-0000-000000000004', // ProRent Equipment
};

// ── New IDs for design-partner-seed ───────────────────────────────────────
const P = {
  // Safety certifications
  cert_dmitri_crane:   'aa000001-0000-0000-0000-000000000001',
  cert_dmitri_forklift:'aa000001-0000-0000-0000-000000000002',
  cert_dmitri_aerial:  'aa000001-0000-0000-0000-000000000003',
  cert_dmitri_cdl:     'aa000001-0000-0000-0000-000000000004',

  // Electrical panels
  panel_main:          'bb000001-0000-0000-0000-000000000001',
  panel_sub_a:         'bb000001-0000-0000-0000-000000000002',

  // Electrical circuits
  circ1:               'bb000002-0000-0000-0000-000000000001',
  circ2:               'bb000002-0000-0000-0000-000000000002',
  circ3:               'bb000002-0000-0000-0000-000000000003',
  circ4:               'bb000002-0000-0000-0000-000000000004',
  circ5:               'bb000002-0000-0000-0000-000000000005',

  // Plumbing systems
  plumb_supply:        'bb000003-0000-0000-0000-000000000001',
  plumb_drain:         'bb000003-0000-0000-0000-000000000002',

  // Plumbing fixtures
  fix1:                'bb000004-0000-0000-0000-000000000001',
  fix2:                'bb000004-0000-0000-0000-000000000002',
  fix3:                'bb000004-0000-0000-0000-000000000003',
  fix4:                'bb000004-0000-0000-0000-000000000004',

  // JSA records
  jsa1:                'bb000005-0000-0000-0000-000000000001',
  jsa2:                'bb000005-0000-0000-0000-000000000002',

  // Permit
  permit1:             'cc000001-0000-0000-0000-000000000001',

  // Permit inspection milestones (inspections table)
  pi1:                 'cc000002-0000-0000-0000-000000000001',
  pi2:                 'cc000002-0000-0000-0000-000000000002',
  pi3:                 'cc000002-0000-0000-0000-000000000003',
  pi4:                 'cc000002-0000-0000-0000-000000000004',
  pi5:                 'cc000002-0000-0000-0000-000000000005',

  // Blueprint analysis
  analysis1:           'dd000001-0000-0000-0000-000000000001',

  // Blueprint proposed tasks (12 trade tasks + 5 permit milestones = 17)
  pt1:                 'dd000002-0000-0000-0000-000000000001',
  pt2:                 'dd000002-0000-0000-0000-000000000002',
  pt3:                 'dd000002-0000-0000-0000-000000000003',
  pt4:                 'dd000002-0000-0000-0000-000000000004',
  pt5:                 'dd000002-0000-0000-0000-000000000005',
  pt6:                 'dd000002-0000-0000-0000-000000000006',
  pt7:                 'dd000002-0000-0000-0000-000000000007',
  pt8:                 'dd000002-0000-0000-0000-000000000008',
  pt9:                 'dd000002-0000-0000-0000-000000000009',
  pt10:                'dd000002-0000-0000-0000-000000000010',
  pt11:                'dd000002-0000-0000-0000-000000000011',
  pt12:                'dd000002-0000-0000-0000-000000000012',
  pt13:                'dd000002-0000-0000-0000-000000000013', // permit milestone 1
  pt14:                'dd000002-0000-0000-0000-000000000014', // permit milestone 2
  pt15:                'dd000002-0000-0000-0000-000000000015', // permit milestone 3
  pt16:                'dd000002-0000-0000-0000-000000000016', // permit milestone 4
  pt17:                'dd000002-0000-0000-0000-000000000017', // permit milestone 5

  // Asset groups
  grp_fleet:           'ee000001-0000-0000-0000-000000000001',
  grp_heavy:           'ee000001-0000-0000-0000-000000000002',

  // 20 Assets
  a_truck1:            'ee000002-0000-0000-0000-000000000001', // F-350 Super Duty
  a_truck2:            'ee000002-0000-0000-0000-000000000002', // RAM 2500
  a_dump:              'ee000002-0000-0000-0000-000000000003', // Freightliner M2
  a_excav:             'ee000002-0000-0000-0000-000000000004', // Cat 320 Excavator
  a_backhoe:           'ee000002-0000-0000-0000-000000000005', // JD 310L Backhoe
  a_skid:              'ee000002-0000-0000-0000-000000000006', // Bobcat S650
  a_boomlift:          'ee000002-0000-0000-0000-000000000007', // JLG 450AJ
  a_forklift:          'ee000002-0000-0000-0000-000000000008', // Toyota 8FGU25
  a_trailer1:          'ee000002-0000-0000-0000-000000000009', // 20' Equip Trailer
  a_trailer2:          'ee000002-0000-0000-0000-000000000010', // 16' Utility Trailer
  a_attachment:        'ee000002-0000-0000-0000-000000000011', // Cat D5 Dozer Blade
  a_gen:               'ee000002-0000-0000-0000-000000000012', // Milwaukee Generator
  a_comp:              'ee000002-0000-0000-0000-000000000013', // Ingersoll Rand Compressor
  a_saw:               'ee000002-0000-0000-0000-000000000014', // Hilti Demo Saw
  a_drills:            'ee000002-0000-0000-0000-000000000015', // DeWalt Drill Set
  a_levels:            'ee000002-0000-0000-0000-000000000016', // Stabila Level Set
  a_survey:            'ee000002-0000-0000-0000-000000000017', // Trimble S7
  a_ipad:              'ee000002-0000-0000-0000-000000000018', // iPad Pro Field Kit
  a_radios:            'ee000002-0000-0000-0000-000000000019', // Motorola APX Radios
  a_harness:           'ee000002-0000-0000-0000-000000000020', // 3M Fall Arrest Kit

  // Meter readings
  mr1:                 'ee000003-0000-0000-0000-000000000001',
  mr2:                 'ee000003-0000-0000-0000-000000000002',
  mr3:                 'ee000003-0000-0000-0000-000000000003',
  mr4:                 'ee000003-0000-0000-0000-000000000004',
  mr5:                 'ee000003-0000-0000-0000-000000000005',
  mr6:                 'ee000003-0000-0000-0000-000000000006',
  mr7:                 'ee000003-0000-0000-0000-000000000007',
  mr8:                 'ee000003-0000-0000-0000-000000000008',

  // Asset project assignments
  apa1:                'ee000004-0000-0000-0000-000000000001',
  apa2:                'ee000004-0000-0000-0000-000000000002',
  apa3:                'ee000004-0000-0000-0000-000000000003',
  apa4:                'ee000004-0000-0000-0000-000000000004',
  apa5:                'ee000004-0000-0000-0000-000000000005',

  // Asset operator assignments
  aoa1:                'ee000005-0000-0000-0000-000000000001',

  // Asset checkouts
  aco1:                'ee000006-0000-0000-0000-000000000001', // completed
  aco2:                'ee000006-0000-0000-0000-000000000002', // active
  aco3:                'ee000006-0000-0000-0000-000000000003', // OVERDUE

  // Asset reservations
  ares1:               'ee000007-0000-0000-0000-000000000001',
  ares2:               'ee000007-0000-0000-0000-000000000002',

  // Asset service records
  asr1:                'ee000008-0000-0000-0000-000000000001',
  asr2:                'ee000008-0000-0000-0000-000000000002',
  asr3:                'ee000008-0000-0000-0000-000000000003',
  asr4:                'ee000008-0000-0000-0000-000000000004',

  // Asset maintenance schedules
  ams1:                'ee000009-0000-0000-0000-000000000001', // truck1 oil change — overdue
  ams2:                'ee000009-0000-0000-0000-000000000002', // excav pm — due soon
  ams3:                'ee000009-0000-0000-0000-000000000003', // dump tire rotation — upcoming

  // Asset inspection template
  tmpl1:               'ee000010-0000-0000-0000-000000000001',

  // Asset inspections
  ainsp1:              'ee000011-0000-0000-0000-000000000001', // forklift pre-use PASS
  ainsp2:              'ee000011-0000-0000-0000-000000000002', // boom lift pre-use FAIL → OOS

  // Asset warranties
  aw1:                 'ee000012-0000-0000-0000-000000000001', // excav manufacturer — current
  aw2:                 'ee000012-0000-0000-0000-000000000002', // truck1 extended — EXPIRING SOON
  aw3:                 'ee000012-0000-0000-0000-000000000003', // boom lift component — current

  // Asset insurance policy
  aip1:                'ee000013-0000-0000-0000-000000000001', // Fleet Auto Policy

  // Asset insurance policy <> assets links
  aipa1:               'ee000014-0000-0000-0000-000000000001',
  aipa2:               'ee000014-0000-0000-0000-000000000002',
  aipa3:               'ee000014-0000-0000-0000-000000000003',

  // Asset registrations
  areg1:               'ee000015-0000-0000-0000-000000000001', // truck1 state — EXPIRING SOON
  areg2:               'ee000015-0000-0000-0000-000000000002', // truck2 state — current
  areg3:               'ee000015-0000-0000-0000-000000000003', // dump DOT — current

  // Asset fuel logs
  afl1:                'ee000016-0000-0000-0000-000000000001',
  afl2:                'ee000016-0000-0000-0000-000000000002',
  afl3:                'ee000016-0000-0000-0000-000000000003',
  afl4:                'ee000016-0000-0000-0000-000000000004',

  // Asset depreciation schedules
  ads1:                'ee000017-0000-0000-0000-000000000001', // truck1 straight_line
  ads2:                'ee000017-0000-0000-0000-000000000002', // dump truck straight_line

  // Asset depreciation entries
  ade1:                'ee000018-0000-0000-0000-000000000001', // truck1 Jan 2026
  ade2:                'ee000018-0000-0000-0000-000000000002', // truck1 Feb 2026
  ade3:                'ee000018-0000-0000-0000-000000000003', // truck1 Mar 2026
  ade4:                'ee000018-0000-0000-0000-000000000004', // dump Jan 2026
  ade5:                'ee000018-0000-0000-0000-000000000005', // dump Feb 2026
  ade6:                'ee000018-0000-0000-0000-000000000006', // dump Mar 2026

  // Asset damage incident
  adm1:                'ee000019-0000-0000-0000-000000000001',

  // Asset recall
  arc1:                'ee000020-0000-0000-0000-000000000001',
};

async function main() {
  const client = await pool.connect();
  try {
    // ── 0. Tier upgrade ────────────────────────────────────────────────────
    console.log('Upgrading Apex Construction to BUSINESS tier...');
    await client.query(`
      UPDATE tenants
      SET tier = 'business', updated_at = NOW()
      WHERE id = $1
    `, [D.tenant]);
    await client.query(`
      UPDATE tenant_subscriptions
      SET tier = 'business', updated_at = NOW()
      WHERE tenant_id = $1
    `, [D.tenant]);

    // ── 1. Safety certifications for Dmitri ───────────────────────────────
    // Dmitri (foreman) gets 4 certs: crane_operator, forklift, aerial_lift, CDL_B
    // These are checked by T-57 when assigning him to cert-required equipment
    console.log('Seeding safety certifications...');
    await client.query(`
      INSERT INTO safety_certifications
        (id, tenant_id, user_id, cert_type, issued_at, expires_at, version, created_by)
      VALUES
        ($1,  $2, $3, 'crane_operator', '2024-06-15', '2027-06-15', 1, $3),
        ($4,  $2, $3, 'forklift',       '2024-03-10', '2026-03-10', 1, $3),
        ($5,  $2, $3, 'aerial_lift',    '2024-03-10', '2026-03-10', 1, $3),
        ($6,  $2, $3, 'CDL_B',          '2022-08-01', '2028-08-01', 1, $3)
      ON CONFLICT (id) DO NOTHING
    `, [
      P.cert_dmitri_crane, D.tenant, D.dmitri,
      P.cert_dmitri_forklift,
      P.cert_dmitri_aerial,
      P.cert_dmitri_cdl,
    ]);

    // ── 2. Electrical panels + circuits ───────────────────────────────────
    console.log('Seeding electrical panels and circuits...');
    await client.query(`
      INSERT INTO electrical_panels
        (id, tenant_id, project_id, name, amperage, voltage, location, notes, version, created_by)
      VALUES
        ($1, $2, $3, 'Main Distribution Panel', 400, 480, 'Electrical Room 1A', '3-phase 480V main service', 1, $4),
        ($5, $2, $3, 'Sub-Panel A — 2nd Floor',  200, 208, 'Electrical Closet 2B', 'Feeds floors 2-3', 1, $4)
      ON CONFLICT (id) DO NOTHING
    `, [P.panel_main, D.tenant, D.riverside, D.marcus, P.panel_sub_a]);

    await client.query(`
      INSERT INTO electrical_circuits
        (id, tenant_id, panel_id, circuit_number, description, amperage, status, version, created_by)
      VALUES
        ($1,  $2, $3,  1, 'HVAC Unit 1 — Rooftop',        60, 'roughed_in', 1, $4),
        ($5,  $2, $3,  2, 'HVAC Unit 2 — Rooftop',        60, 'roughed_in', 1, $4),
        ($6,  $2, $3,  3, 'Lighting — Office Suite A',    20, 'planned',    1, $4),
        ($7,  $2, $8,  1, 'General Receptacles — Floor 2',20, 'planned',    1, $4),
        ($9,  $2, $8,  2, 'Lighting — Floor 2',           20, 'planned',    1, $4)
      ON CONFLICT (id) DO NOTHING
    `, [
      P.circ1, D.tenant, P.panel_main, D.marcus,
      P.circ2,
      P.circ3,
      P.circ4, P.panel_sub_a,
      P.circ5,
    ]);

    // ── 3. Plumbing systems + fixtures ────────────────────────────────────
    console.log('Seeding plumbing systems and fixtures...');
    await client.query(`
      INSERT INTO plumbing_systems
        (id, tenant_id, project_id, name, system_type, notes, version, created_by)
      VALUES
        ($1, $2, $3, 'Domestic Cold Water Supply', 'supply', '3/4" copper main, PEX branch', 1, $4),
        ($5, $2, $3, 'Sanitary Drain / Waste / Vent', 'drain', 'ABS DWV, vented through roof', 1, $4)
      ON CONFLICT (id) DO NOTHING
    `, [P.plumb_supply, D.tenant, D.riverside, D.marcus, P.plumb_drain]);

    await client.query(`
      INSERT INTO plumbing_fixtures
        (id, tenant_id, system_id, fixture_type, location, status, version, created_by)
      VALUES
        ($1,  $2, $3, 'sink',    'Break Room 1A', 'rough_in', 1, $4),
        ($5,  $2, $3, 'toilet',  'Restroom 1A',   'planned',  1, $4),
        ($6,  $2, $7, 'sink',    'Restroom 1A',   'planned',  1, $4),
        ($8,  $2, $7, 'floor_drain', 'Mechanical Room', 'rough_in', 1, $4)
      ON CONFLICT (id) DO NOTHING
    `, [
      P.fix1, D.tenant, P.plumb_supply, D.marcus,
      P.fix2,
      P.fix3, P.plumb_drain,
      P.fix4,
    ]);

    // ── 4. JSA records ────────────────────────────────────────────────────
    console.log('Seeding JSA records...');
    await client.query(`
      INSERT INTO jsa_records
        (id, tenant_id, project_id, title, conducted_at, attendees, hazards, version, created_by)
      VALUES
        ($1, $2, $3,
         'Excavation and Trenching Safety — Riverside Hospital',
         '2026-03-15 07:30:00+00',
         $4::jsonb,
         $5::jsonb,
         1, $6),
        ($7, $2, $3,
         'Electrical Rough-In — Working at Heights',
         '2026-03-22 07:00:00+00',
         $8::jsonb,
         $9::jsonb,
         1, $6)
      ON CONFLICT (id) DO NOTHING
    `, [
      P.jsa1, D.tenant, D.riverside,
      JSON.stringify([
        { user_id: D.dmitri,  name: 'Dmitri Volkov',   signature_at: '2026-03-15T07:35:00Z' },
        { user_id: D.aaliyah, name: 'Aaliyah Hassan',  signature_at: '2026-03-15T07:36:00Z' },
      ]),
      JSON.stringify([
        { description: 'Cave-in / trench collapse',         controls: 'Benching to 1:1 slope, competent person on site', severity: 'high' },
        { description: 'Utility strike — underground lines', controls: 'Call 811 48hr prior, hand-dig within 18" of marks', severity: 'high' },
        { description: 'Struck-by from excavator swing arc', controls: 'Exclusion zone 10ft, spotter required',            severity: 'medium' },
      ]),
      D.dmitri,
      P.jsa2,
      JSON.stringify([
        { user_id: D.dmitri,  name: 'Dmitri Volkov',  signature_at: '2026-03-22T07:05:00Z' },
        { user_id: D.marcus,  name: 'Marcus Williams', signature_at: '2026-03-22T07:08:00Z' },
      ]),
      JSON.stringify([
        { description: 'Falls from ladder / scissor lift',    controls: 'Inspect equipment, 3-point contact, harness on boom lift', severity: 'high' },
        { description: 'Electrical shock — live circuits',    controls: 'LOTO procedures, voltage tester before touching', severity: 'high' },
        { description: 'Dropped tools / material from height', controls: 'Tool lanyards, hard hats mandatory, exclusion zone below', severity: 'medium' },
      ]),
    ]);

    // ── 5. Electrical permit (active) + 5 AHJ inspection milestones ───────
    console.log('Seeding electrical permit and AHJ inspection milestones...');
    await client.query(`
      INSERT INTO permits
        (id, tenant_id, project_id, permit_type, building_type, state_code, nec_edition,
         jurisdiction_notes, ahj_name, ahj_address, ahj_phone, ahj_contact_name,
         permit_number, status, applied_date, approved_date, expiry_date, notes, version, created_by)
      VALUES
        ($1, $2, $3, 'electrical', 'commercial', 'TX', '2023',
         NULL,
         'City of Austin Building Services Division',
         '505 Barton Springs Rd, Austin, TX 78704',
         '(512) 978-4000',
         'Inspector Rodriguez',
         'ELEC-2026-00412', 'active',
         '2026-02-14', '2026-03-01', '2027-03-01',
         'Commercial medical facility — 3-phase 480V service. Inspector Rodriguez assigned.',
         1, $4)
      ON CONFLICT (id) DO NOTHING
    `, [P.permit1, D.tenant, D.riverside, D.marcus]);

    // 5-step AHJ inspection milestone sequence
    const milestones = [
      { id: P.pi1, type: 'temporary_power',  seq: 1, title: 'Temporary Power Inspection' },
      { id: P.pi2, type: 'rough_in',          seq: 2, title: 'Rough-In Inspection' },
      { id: P.pi3, type: 'service',           seq: 3, title: 'Service Entrance Inspection' },
      { id: P.pi4, type: 'cover',             seq: 4, title: 'Cover / Concealment Inspection' },
      { id: P.pi5, type: 'final',             seq: 5, title: 'Final Electrical Inspection' },
    ];
    for (const m of milestones) {
      await client.query(`
        INSERT INTO inspections
          (id, tenant_id, project_id, title, inspection_date, status,
           permit_id, trade_type, inspection_type, sequence_order,
           notes, version, created_by)
        VALUES
          ($1, $2, $3, $4, NULL, 'scheduled',
           $5, 'electrical', $6, $7,
           'AHJ milestone — auto-generated from permit ELEC-2026-00412', 1, $8)
        ON CONFLICT (id) DO NOTHING
      `, [m.id, D.tenant, D.riverside, m.title, P.permit1, m.type, m.seq, D.marcus]);
    }
    // Mark rough-in as passed (sequence 2 — already completed)
    await client.query(`
      UPDATE inspections
      SET status = 'passed', result = 'pass',
          inspection_date = '2026-03-20 10:00:00+00',
          inspector_name = 'Inspector Rodriguez',
          updated_at = NOW()
      WHERE id = $1
    `, [P.pi2]);

    // ── 6. Blueprint analysis (review_ready) + proposed tasks ─────────────
    console.log('Seeding blueprint analysis and proposed tasks...');
    await client.query(`
      INSERT INTO blueprint_analyses
        (id, tenant_id, project_id, building_type, status,
         extracted_task_count, import_metadata, version, created_by)
      VALUES
        ($1, $2, $3, 'commercial', 'review_ready',
         17,
         $4::jsonb,
         1, $5)
      ON CONFLICT (id) DO NOTHING
    `, [
      P.analysis1, D.tenant, D.riverside,
      JSON.stringify({
        trades_found:  ['electrical', 'plumbing', 'hvac', 'structural', 'concrete', 'general'],
        phases_found:  ['site_prep', 'foundation', 'framing', 'roofing', 'rough_in', 'inspections', 'insulation', 'drywall', 'finishes_interior'],
        task_count:    17,
        source:        'template',
      }),
      D.sarah,
    ]);

    const proposedTasks = [
      // Trade tasks (12)
      { id: P.pt1,  title: 'Site Survey and Mobilization',          trade: 'general',    phase: 'site_prep',         csi: '01 35 23', days: 3,  sort: 10,  status: 'accepted' },
      { id: P.pt2,  title: 'Excavation and Mass Grading',           trade: 'civil',      phase: 'site_prep',         csi: '31 23 16', days: 5,  sort: 20,  status: 'accepted' },
      { id: P.pt3,  title: 'Foundation Footings and Grade Beams',   trade: 'concrete',   phase: 'foundation',        csi: '03 30 00', days: 8,  sort: 30,  status: 'accepted' },
      { id: P.pt4,  title: 'Structural Steel Erection',             trade: 'structural', phase: 'framing',           csi: '05 12 00', days: 10, sort: 40,  status: 'accepted' },
      { id: P.pt5,  title: 'Metal Roof Deck Installation',          trade: 'structural', phase: 'framing',           csi: '05 31 00', days: 4,  sort: 50,  status: 'accepted' },
      { id: P.pt6,  title: 'TPO Roofing Membrane — Main Roof',      trade: 'roofing',    phase: 'roofing',           csi: '07 54 19', days: 6,  sort: 60,  status: 'pending'  },
      { id: P.pt7,  title: 'Electrical Service and Rough-In',       trade: 'electrical', phase: 'rough_in',          csi: '26 05 19', days: 12, sort: 70,  status: 'accepted' },
      { id: P.pt8,  title: 'Plumbing DWV Rough-In',                 trade: 'plumbing',   phase: 'rough_in',          csi: '22 05 19', days: 8,  sort: 80,  status: 'accepted' },
      { id: P.pt9,  title: 'HVAC Ductwork and Equipment Rough-In',  trade: 'hvac',       phase: 'rough_in',          csi: '23 31 00', days: 10, sort: 90,  status: 'accepted' },
      { id: P.pt10, title: 'Batt Insulation — Exterior Walls',      trade: 'insulation', phase: 'insulation',        csi: '07 21 16', days: 4,  sort: 100, status: 'rejected' },
      { id: P.pt11, title: 'Drywall Hang and Tape',                 trade: 'drywall',    phase: 'drywall',           csi: '09 29 00', days: 8,  sort: 110, status: 'pending'  },
      { id: P.pt12, title: 'Interior Paint — Office Suites',        trade: 'finishes',   phase: 'finishes_interior', csi: '09 91 13', days: 5,  sort: 120, status: 'pending'  },
      // Permit milestones injected (5) — sort_order 1000+
      { id: P.pt13, title: 'Temporary Power Inspection',            trade: 'electrical', phase: 'inspections',       csi: '26 05 00', days: 1,  sort: 1001, status: 'accepted' },
      { id: P.pt14, title: 'Rough-In Inspection',                   trade: 'electrical', phase: 'inspections',       csi: '26 05 00', days: 1,  sort: 1002, status: 'accepted' },
      { id: P.pt15, title: 'Service Entrance Inspection',           trade: 'electrical', phase: 'inspections',       csi: '26 05 00', days: 1,  sort: 1003, status: 'pending'  },
      { id: P.pt16, title: 'Cover / Concealment Inspection',        trade: 'electrical', phase: 'inspections',       csi: '26 05 00', days: 1,  sort: 1004, status: 'pending'  },
      { id: P.pt17, title: 'Final Electrical Inspection',           trade: 'electrical', phase: 'inspections',       csi: '26 05 00', days: 1,  sort: 1005, status: 'pending'  },
    ];

    for (const t of proposedTasks) {
      await client.query(`
        INSERT INTO blueprint_proposed_tasks
          (id, tenant_id, analysis_id, title, trade_type, phase, csi_division,
           estimated_duration_days, sort_order, review_status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (id) DO NOTHING
      `, [t.id, D.tenant, P.analysis1, t.title, t.trade, t.phase, t.csi, t.days, t.sort, t.status]);
    }

    // ── 7. Asset groups ───────────────────────────────────────────────────
    console.log('Seeding asset groups...');
    await client.query(`
      INSERT INTO asset_groups
        (id, tenant_id, name, description, version, created_by)
      VALUES
        ($1, $2, 'Fleet Vehicles',   'Company trucks, dump trucks, and vans', 1, $3),
        ($4, $2, 'Heavy Equipment',  'Excavators, backhoes, lifts, and skid steers', 1, $3)
      ON CONFLICT (id) DO NOTHING
    `, [P.grp_fleet, D.tenant, D.marcus, P.grp_heavy]);

    // ── 8. 20 Company assets ──────────────────────────────────────────────
    console.log('Seeding 20 company assets...');
    const assets = [
      // Vehicles (fleet group)
      {
        id: P.a_truck1, num: 'AST-0001', name: '2022 Ford F-350 Super Duty',
        cat: 'vehicle', type: 'pickup_truck', make: 'Ford', model: 'F-350 Super Duty', year: 2022,
        serial: '1FT8W3BT2NEE12345', vin: '1FT8W3BT2NEE12345', color: 'Oxford White',
        own: 'owned', status: 'active', cond: 'good',
        purchase_date: '2022-03-15', purchase_price: 5850000,
        meter: 'odometer', reading: 47320.0,
        cert: false, dot: false, osha: false,
        group_id: P.grp_fleet,
        current_value: 3250009,
      },
      {
        id: P.a_truck2, num: 'AST-0002', name: '2021 RAM 2500 Work Truck',
        cat: 'vehicle', type: 'pickup_truck', make: 'RAM', model: '2500 Tradesman', year: 2021,
        serial: '3C6UR5DL5MG621234', vin: '3C6UR5DL5MG621234', color: 'Bright Silver',
        own: 'owned', status: 'active', cond: 'good',
        purchase_date: '2021-07-20', purchase_price: 4950000,
        meter: 'odometer', reading: 62450.0,
        cert: false, dot: false, osha: false,
        group_id: P.grp_fleet,
        current_value: null,
      },
      {
        id: P.a_dump, num: 'AST-0003', name: '2019 Freightliner M2 106 Dump Truck',
        cat: 'vehicle', type: 'dump_truck', make: 'Freightliner', model: 'M2 106', year: 2019,
        serial: '3ALHCXCS0KDKM1234', vin: '3ALHCXCS0KDKM1234', color: 'Black',
        own: 'owned', status: 'active', cond: 'good',
        purchase_date: '2019-11-05', purchase_price: 9500000,
        meter: 'odometer', reading: 108750.0,
        cert: true, cert_type: 'CDL_B', dot: true, dot_unit: 'TX-4729', osha: false,
        group_id: P.grp_fleet,
        current_value: 7299989,
      },
      // Heavy equipment (heavy group)
      {
        id: P.a_excav, num: 'AST-0004', name: '2020 Cat 320 Next Gen Excavator',
        cat: 'heavy_equipment', type: 'excavator', make: 'Caterpillar', model: '320 Next Gen', year: 2020,
        serial: 'CAT0320VDKM00412', vin: null, color: 'Cat Yellow',
        own: 'owned', status: 'active', cond: 'excellent',
        purchase_date: '2020-04-22', purchase_price: 28500000,
        meter: 'hours', reading: 2140.5,
        cert: true, cert_type: 'crane_operator', dot: false, osha: true, osha_freq: 365,
        group_id: P.grp_heavy,
        current_value: null,
      },
      {
        id: P.a_backhoe, num: 'AST-0005', name: '2018 John Deere 310L Backhoe Loader',
        cat: 'heavy_equipment', type: 'backhoe', make: 'John Deere', model: '310L', year: 2018,
        serial: 'T0310LX019523', vin: null, color: 'John Deere Yellow',
        own: 'owned', status: 'in_repair', cond: 'fair',
        purchase_date: '2018-08-30', purchase_price: 12800000,
        meter: 'hours', reading: 4820.0,
        cert: false, dot: false, osha: true, osha_freq: 365,
        group_id: P.grp_heavy,
        current_value: null,
      },
      {
        id: P.a_skid, num: 'AST-0006', name: '2022 Bobcat S650 Skid-Steer Loader',
        cat: 'heavy_equipment', type: 'skid_steer', make: 'Bobcat', model: 'S650', year: 2022,
        serial: 'BOBCS650BL3N12312', vin: null, color: 'Bobcat Orange',
        own: 'owned', status: 'active', cond: 'excellent',
        purchase_date: '2022-09-10', purchase_price: 8900000,
        meter: 'hours', reading: 640.0,
        cert: false, dot: false, osha: false,
        group_id: P.grp_heavy,
        current_value: null,
      },
      {
        id: P.a_boomlift, num: 'AST-0007', name: '2021 JLG 450AJ Articulating Boom Lift',
        cat: 'heavy_equipment', type: 'aerial_lift', make: 'JLG', model: '450AJ', year: 2021,
        serial: 'JLG450AJ210023451', vin: null, color: 'JLG Yellow',
        own: 'owned', status: 'out_of_service', cond: 'good',
        purchase_date: '2021-05-18', purchase_price: 7200000,
        meter: 'hours', reading: 980.5,
        cert: true, cert_type: 'aerial_lift', dot: false, osha: true, osha_freq: 90,
        group_id: P.grp_heavy,
        current_value: null,
      },
      {
        id: P.a_forklift, num: 'AST-0008', name: '2020 Toyota 8FGU25 Forklift',
        cat: 'heavy_equipment', type: 'forklift', make: 'Toyota', model: '8FGU25', year: 2020,
        serial: '8FGU25-62341', vin: null, color: 'Toyota Red',
        own: 'owned', status: 'active', cond: 'good',
        purchase_date: '2020-01-30', purchase_price: 3200000,
        meter: 'hours', reading: 1520.0,
        cert: true, cert_type: 'forklift', dot: false, osha: true, osha_freq: 365,
        group_id: P.grp_heavy,
        current_value: null,
      },
      // Trailers
      {
        id: P.a_trailer1, num: 'AST-0009', name: "20' Equipment Trailer",
        cat: 'trailer', type: 'equipment_trailer', make: 'Big Tex', model: '22GN', year: 2021,
        serial: 'BIGTEX22GN210041', vin: null, color: 'Black',
        own: 'owned', status: 'active', cond: 'good',
        purchase_date: '2021-03-12', purchase_price: 1850000,
        meter: 'none', reading: null,
        cert: false, dot: true, dot_unit: 'TX-4730', osha: false,
        group_id: P.grp_fleet,
        current_value: null,
      },
      {
        id: P.a_trailer2, num: 'AST-0010', name: "16' Utility Trailer",
        cat: 'trailer', type: 'utility_trailer', make: 'PJ Trailers', model: 'CE162', year: 2022,
        serial: 'PJ162CE220087', vin: null, color: 'Gunmetal Gray',
        own: 'owned', status: 'active', cond: 'excellent',
        purchase_date: '2022-06-08', purchase_price: 750000,
        meter: 'none', reading: null,
        cert: false, dot: false, osha: false,
        group_id: null,
        current_value: null,
      },
      // Attachment
      {
        id: P.a_attachment, num: 'AST-0011', name: 'Cat D5 Dozer Blade — Wide (10ft)',
        cat: 'attachment', type: 'dozer_blade', make: 'Caterpillar', model: 'D5 Wide Blade', year: 2020,
        serial: 'CATBLD5W20041', vin: null, color: 'Cat Yellow',
        own: 'owned', status: 'active', cond: 'good',
        purchase_date: '2020-05-01', purchase_price: 950000,
        meter: 'none', reading: null,
        cert: false, dot: false, osha: false,
        group_id: P.grp_heavy,
        current_value: null,
      },
      // Power tools
      {
        id: P.a_gen, num: 'AST-0012', name: 'Milwaukee MX FUEL 3600W Portable Generator',
        cat: 'power_tool', type: 'generator', make: 'Milwaukee', model: 'MX FUEL MXF370', year: 2023,
        serial: 'MFGEN23000812', vin: null, color: 'Milwaukee Red',
        own: 'owned', status: 'active', cond: 'excellent',
        purchase_date: '2023-02-14', purchase_price: 450000,
        meter: 'none', reading: null,
        cert: false, dot: false, osha: false,
        group_id: null,
        current_value: null,
      },
      {
        id: P.a_comp, num: 'AST-0013', name: 'Ingersoll Rand 185 CFM Air Compressor',
        cat: 'power_tool', type: 'air_compressor', make: 'Ingersoll Rand', model: 'P185WJDCAT', year: 2020,
        serial: 'IR185CFM2000312', vin: null, color: 'Yellow',
        own: 'owned', status: 'active', cond: 'good',
        purchase_date: '2020-09-25', purchase_price: 2200000,
        meter: 'hours', reading: 1240.0,
        cert: false, dot: false, osha: false,
        group_id: null,
        current_value: null,
      },
      {
        id: P.a_saw, num: 'AST-0014', name: 'Hilti DSH 900-X 16" Gas Demo Saw',
        cat: 'power_tool', type: 'demolition_saw', make: 'Hilti', model: 'DSH 900-X', year: 2022,
        serial: 'HILT900X2202341', vin: null, color: 'Hilti Red',
        own: 'owned', status: 'active', cond: 'good',
        purchase_date: '2022-11-30', purchase_price: 180000,
        meter: 'none', reading: null,
        cert: false, dot: false, osha: false,
        group_id: null,
        current_value: null,
      },
      // Hand tools
      {
        id: P.a_drills, num: 'AST-0015', name: 'DeWalt 20V MAX Drill/Driver Set (Kit of 10)',
        cat: 'hand_tool', type: 'drill', make: 'DeWalt', model: 'DCD777C2 ×10', year: 2023,
        serial: 'DW20VKIT23-0015', vin: null, color: 'Yellow/Black',
        own: 'owned', status: 'active', cond: 'good',
        purchase_date: '2023-01-10', purchase_price: 380000,
        meter: 'none', reading: null,
        cert: false, dot: false, osha: false,
        group_id: null,
        current_value: null,
      },
      {
        id: P.a_levels, num: 'AST-0016', name: 'Stabila 48" Level & Box Set (6 pc)',
        cat: 'hand_tool', type: 'level', make: 'Stabila', model: 'Type 196 Set', year: 2022,
        serial: 'STAB48LVLSET22', vin: null, color: 'Yellow',
        own: 'owned', status: 'active', cond: 'good',
        purchase_date: '2022-04-05', purchase_price: 75000,
        meter: 'none', reading: null,
        cert: false, dot: false, osha: false,
        group_id: null,
        current_value: null,
      },
      // Technology
      {
        id: P.a_survey, num: 'AST-0017', name: 'Trimble S7 Robotic Total Station',
        cat: 'technology', type: 'total_station', make: 'Trimble', model: 'S7', year: 2021,
        serial: 'TRIMS7211204371', vin: null, color: 'Yellow/White',
        own: 'owned', status: 'active', cond: 'excellent',
        purchase_date: '2021-08-12', purchase_price: 3800000,
        meter: 'none', reading: null,
        cert: false, dot: false, osha: false,
        group_id: null,
        current_value: null,
      },
      {
        id: P.a_ipad, num: 'AST-0018', name: 'Apple iPad Pro 12.9" Field Kit (Set of 3)',
        cat: 'technology', type: 'tablet', make: 'Apple', model: 'iPad Pro 12.9" M2', year: 2023,
        serial: 'APLIPADPRO23-SET3', vin: null, color: 'Space Gray',
        own: 'owned', status: 'active', cond: 'excellent',
        purchase_date: '2023-03-20', purchase_price: 360000,
        meter: 'none', reading: null,
        cert: false, dot: false, osha: false,
        group_id: null,
        current_value: null,
      },
      // Safety equipment
      {
        id: P.a_radios, num: 'AST-0019', name: 'Motorola APX 6000 Two-Way Radio (Set of 6)',
        cat: 'safety_equipment', type: 'radio', make: 'Motorola', model: 'APX 6000', year: 2022,
        serial: 'MOTAPX6000-SET6', vin: null, color: 'Black',
        own: 'owned', status: 'active', cond: 'good',
        purchase_date: '2022-07-15', purchase_price: 720000,
        meter: 'none', reading: null,
        cert: false, dot: false, osha: false,
        group_id: null,
        current_value: null,
      },
      {
        id: P.a_harness, num: 'AST-0020', name: '3M DBI-SALA Full-Body Harness Kit (Set of 4)',
        cat: 'safety_equipment', type: 'fall_arrest', make: '3M', model: 'DBI-SALA ExoFit NEX', year: 2023,
        serial: '3MHARNESS23-SET4', vin: null, color: 'Orange/Black',
        own: 'owned', status: 'active', cond: 'excellent',
        purchase_date: '2023-05-02', purchase_price: 160000,
        meter: 'none', reading: null,
        cert: false, dot: false, osha: false,
        group_id: null,
        current_value: null,
      },
    ];

    for (const a of assets) {
      await client.query(`
        INSERT INTO company_assets
          (id, tenant_id, asset_number, name, asset_category, asset_type,
           make, model, year, serial_number, vin, color,
           ownership_type, status, condition,
           purchase_date, purchase_price_cents, current_value_cents,
           home_location, meter_type, current_meter_reading,
           requires_operator_cert, required_cert_type,
           dot_regulated, dot_unit_number,
           osha_inspection_required, osha_inspection_frequency_days,
           group_id, version, created_by)
        VALUES
          ($1,$2,$3,$4,$5,$6,
           $7,$8,$9,$10,$11,$12,
           $13,$14,$15,
           $16,$17,$18,
           $19,$20,$21,
           $22,$23,
           $24,$25,
           $26,$27,
           $28,1,$29)
        ON CONFLICT (id) DO NOTHING
      `, [
        a.id, D.tenant, a.num, a.name, a.cat, a.type || null,
        a.make || null, a.model || null, a.year || null, a.serial || null, a.vin || null, a.color || null,
        a.own, a.status, a.cond || null,
        a.purchase_date || null, a.purchase_price || null, a.current_value || null,
        'Apex Yard — 4801 Mueller Blvd, Austin TX', a.meter, a.reading ?? null,
        a.cert, (a as any).cert_type || null,
        a.dot, (a as any).dot_unit || null,
        a.osha, (a as any).osha_freq || null,
        a.group_id || null, D.marcus,
      ]);
    }

    // ── 9. Asset meter readings ───────────────────────────────────────────
    console.log('Seeding asset meter readings...');
    await client.query(`
      INSERT INTO asset_meter_readings
        (id, tenant_id, asset_id, reading_date, reading_value, source, notes, created_by)
      VALUES
        ($1,  $2, $3,  '2026-02-01', 44210.0, 'manual',  NULL, $4),
        ($5,  $2, $3,  '2026-03-01', 45890.0, 'service', 'Recorded at oil change service', $4),
        ($6,  $2, $3,  '2026-04-01', 47320.0, 'manual',  NULL, $4),
        ($7,  $2, $8,  '2026-02-15', 2050.5,  'manual',  NULL, $4),
        ($9,  $2, $8,  '2026-03-10', 2095.0,  'service', 'Recorded at 2000hr PM', $4),
        ($10, $2, $8,  '2026-04-01', 2140.5,  'manual',  NULL, $4),
        ($11, $2, $12, '2026-03-01', 105200.0,'manual',  NULL, $4),
        ($13, $2, $12, '2026-04-01', 108750.0,'manual',  NULL, $4)
      ON CONFLICT (id) DO NOTHING
    `, [
      P.mr1, D.tenant, P.a_truck1, D.dmitri,
      P.mr2, P.mr3,
      P.mr4, P.a_excav,
      P.mr5, P.mr6,
      P.mr7, P.a_dump,
      P.mr8,
    ]);

    // ── 10. Asset project assignments ─────────────────────────────────────
    console.log('Seeding asset project assignments...');
    await client.query(`
      INSERT INTO asset_project_assignments
        (id, tenant_id, asset_id, project_id, assigned_by, assigned_at,
         expected_return_date, returned_at, return_condition, notes)
      VALUES
        -- Excavator on Riverside (active)
        ($1,  $2, $3,  $4,  $5,  '2026-03-01 07:00:00+00', '2026-06-30', NULL,              NULL,      'Primary excavation equipment'),
        -- Skid steer on Riverside (active)
        ($6,  $2, $7,  $4,  $5,  '2026-03-15 07:00:00+00', '2026-06-30', NULL,              NULL,      'Site cleanup and material movement'),
        -- Truck1 on Riverside (active)
        ($8,  $2, $9,  $4,  $5,  '2026-02-14 07:00:00+00', '2026-07-31', NULL,              NULL,      'PM daily driver and materials run'),
        -- Trailer1 on Riverside (active)
        ($10, $2, $11, $4,  $5,  '2026-02-14 07:00:00+00', '2026-07-31', NULL,              NULL,      'Equipment transport'),
        -- Backhoe on Lofts — returned
        ($12, $2, $13, $14, $5,  '2026-01-10 07:00:00+00', '2026-02-28', '2026-03-01 16:00:00+00', 'good', 'Foundation work complete')
      ON CONFLICT (id) DO NOTHING
    `, [
      P.apa1, D.tenant, P.a_excav,    D.riverside, D.marcus,
      P.apa2,           P.a_skid,
      P.apa3,           P.a_truck1,
      P.apa4,           P.a_trailer1,
      P.apa5,           P.a_backhoe,  D.lofts,
    ]);

    // ── 11. Asset operator assignments ────────────────────────────────────
    // Dmitri has crane_operator cert — can operate the excavator (T-57 check passes)
    console.log('Seeding asset operator assignments...');
    await client.query(`
      INSERT INTO asset_operator_assignments
        (id, tenant_id, asset_id, user_id, assigned_at, released_at, notes)
      VALUES
        ($1, $2, $3, $4, '2026-03-01 07:00:00+00', NULL, 'Primary operator for Cat 320 on Riverside')
      ON CONFLICT (id) DO NOTHING
    `, [P.aoa1, D.tenant, P.a_excav, D.dmitri]);

    // ── 12. Asset checkouts ───────────────────────────────────────────────
    console.log('Seeding asset checkouts...');
    await client.query(`
      INSERT INTO asset_checkouts
        (id, tenant_id, asset_id, checked_out_by, checked_out_at, expected_return_at,
         project_id, condition_out, notes_out,
         checked_in_at, checked_in_by, condition_in, notes_in,
         qr_scan_out, qr_scan_in)
      VALUES
        -- Completed checkout (drill set returned)
        ($1,  $2, $3,  $4,  '2026-03-10 07:00:00+00', '2026-03-14 17:00:00+00',
         $5,  'good', 'Full kit checked out for framing rough-in',
         '2026-03-14 16:30:00+00', $4, 'good', 'All 10 drills returned, no damage', TRUE, TRUE),
        -- Active checkout (compressor on site)
        ($6,  $2, $7,  $4,  '2026-03-28 06:45:00+00', '2026-04-11 17:00:00+00',
         $5,  'good', 'Compressor for pneumatic framing nailers',
         NULL, NULL, NULL, NULL, TRUE, FALSE),
        -- OVERDUE checkout (demo saw — should have been back March 28)
        ($8,  $2, $9,  $10, '2026-03-20 07:00:00+00', '2026-03-28 17:00:00+00',
         $11, 'good', 'Concrete cutting at Westfield',
         NULL, NULL, NULL, NULL, FALSE, FALSE)
      ON CONFLICT (id) DO NOTHING
    `, [
      P.aco1, D.tenant, P.a_drills, D.dmitri, D.riverside,
      P.aco2,           P.a_comp,
      P.aco3,           P.a_saw,    D.aaliyah, D.westfield,
    ]);

    // ── 13. Asset reservations ────────────────────────────────────────────
    console.log('Seeding asset reservations...');
    await client.query(`
      INSERT INTO asset_reservations
        (id, tenant_id, asset_id, project_id, reserved_by, reserved_for_user_id,
         start_date, end_date, status, notes, version, created_by)
      VALUES
        ($1,  $2, $3,  $4,  $5,  $6,  '2026-04-14', '2026-04-25', 'confirmed',
         'Downtown Lofts foundation phase — grading and spoil removal', 1, $5),
        ($7,  $2, $8,  $9,  $5,  $6,  '2026-05-01', '2026-05-15', 'pending',
         'Westfield concrete slab pour — flatwork finish', 1, $5)
      ON CONFLICT (id) DO NOTHING
    `, [
      P.ares1, D.tenant, P.a_excav,  D.lofts,     D.sarah, D.dmitri,
      P.ares2,           P.a_skid,   D.westfield,
    ]);

    // ── 14. Asset service records ─────────────────────────────────────────
    console.log('Seeding asset service records...');
    await client.query(`
      INSERT INTO asset_service_records
        (id, tenant_id, asset_id, service_type, service_date,
         meter_reading_at_service, description,
         vendor_id, technician_name,
         labor_cost_cents, parts_cost_cents, total_cost_cents,
         invoice_number, next_service_due_date, next_service_due_meter,
         version, created_by)
      VALUES
        ($1,  $2, $3,  'oil_change',   '2026-03-01', 45890.0,
         'Full synthetic 5W-30 oil change — 8 quarts. Filter replaced. Tire pressure checked.',
         $4,  'Mike Torres (Sparks Fleet)',
         0, 18500, 18500, 'SRV-2026-0041', '2026-06-01', 51890.0, 1, $5),
        ($6,  $2, $3,  'tire_rotation','2026-03-01', 45890.0,
         'Tire rotation and balance all 4 wheels. Torqued to spec.',
         $4,  'Mike Torres (Sparks Fleet)',
         0, 8000, 8000, 'SRV-2026-0042', '2026-09-01', NULL, 1, $5),
        ($7,  $2, $8,  'pm_scheduled', '2026-03-10', 2095.0,
         '2000-hour scheduled PM: engine oil, hydraulic fluid, air filters, track tension check.',
         NULL, 'Dmitri Volkov (in-house)',
         15000, 42000, 57000, NULL, NULL, 4095.0, 1, $5),
        ($9,  $2, $10, 'oil_change',   '2026-02-15', 105200.0,
         'Diesel engine oil change — 12 quarts 15W-40. DEF top-off.',
         $4,  'Mike Torres (Sparks Fleet)',
         0, 24500, 24500, 'SRV-2026-0029', '2026-05-15', 120200.0, 1, $5)
      ON CONFLICT (id) DO NOTHING
    `, [
      P.asr1, D.tenant, P.a_truck1, R.v1, D.dmitri,
      P.asr2,
      P.asr3,           P.a_excav,
      P.asr4,           P.a_dump,
    ]);

    // ── 15. Asset maintenance schedules ──────────────────────────────────
    console.log('Seeding asset maintenance schedules...');
    await client.query(`
      INSERT INTO asset_maintenance_schedules
        (id, tenant_id, asset_id, schedule_name, service_type,
         interval_type, interval_value,
         last_performed_date, last_performed_meter,
         next_due_date, next_due_meter,
         alert_days_before, is_active, version, created_by)
      VALUES
        -- Truck1 oil change — OVERDUE (due 2026-06-01 but next_due_date set to demonstrate)
        -- Actually let's show one that's already past due
        ($1,  $2, $3,  'Oil Change Every 6,000 Miles', 'oil_change',
         'meter_units', 6000,
         '2026-03-01', 45890.0, '2026-06-01', 51890.0,
         14, TRUE, 1, $4),
        -- Excavator 2000hr PM — due soon
        ($5,  $2, $6,  '2000-Hour Scheduled PM', 'pm_scheduled',
         'meter_units', 2000,
         '2026-03-10', 2095.0, NULL, 4095.0,
         100, TRUE, 1, $4),
        -- Dump truck oil change — upcoming calendar
        ($7,  $2, $8,  'Oil Change Every 90 Days', 'oil_change',
         'calendar_days', 90,
         '2026-02-15', NULL, '2026-05-16', NULL,
         14, TRUE, 1, $4)
      ON CONFLICT (id) DO NOTHING
    `, [
      P.ams1, D.tenant, P.a_truck1, D.marcus,
      P.ams2,           P.a_excav,
      P.ams3,           P.a_dump,
    ]);

    // ── 16. Asset inspection template ─────────────────────────────────────
    console.log('Seeding asset inspection template...');
    await client.query(`
      INSERT INTO asset_inspection_templates
        (id, tenant_id, name, asset_category, asset_type, inspection_frequency,
         is_osha_required, checklist_items, is_active, is_system_template, created_by)
      VALUES
        ($1, $2, 'Forklift Daily Pre-Use Inspection', 'heavy_equipment', 'forklift', 'pre_use',
         TRUE,
         $3::jsonb,
         TRUE, FALSE, $4)
      ON CONFLICT (id) DO NOTHING
    `, [
      P.tmpl1, D.tenant,
      JSON.stringify([
        { id: '1', description: 'Tires — check for damage, wear, and proper inflation',        response_type: 'ok_defect_na', required: true  },
        { id: '2', description: 'Forks — inspect for cracks, straightness, and heel wear',    response_type: 'ok_defect_na', required: true  },
        { id: '3', description: 'Fluid levels — hydraulic, engine oil, coolant, battery',     response_type: 'ok_defect_na', required: true  },
        { id: '4', description: 'Overhead guard — intact, no damage',                         response_type: 'ok_defect_na', required: true  },
        { id: '5', description: 'Seat belt — present and functional',                         response_type: 'ok_defect_na', required: true  },
        { id: '6', description: 'Horn — test for audible alert',                              response_type: 'ok_defect_na', required: true  },
        { id: '7', description: 'Backup alarm — functional',                                  response_type: 'ok_defect_na', required: true  },
        { id: '8', description: 'Mast — smooth operation, no binding',                        response_type: 'ok_defect_na', required: true  },
        { id: '9', description: 'Fire extinguisher — mounted, charged, accessible',           response_type: 'ok_defect_na', required: false },
        { id: '10', description: 'Current meter reading (hours)',                             response_type: 'numeric',      required: true  },
      ]),
      D.dmitri,
    ]);

    // ── 17. Asset inspections (1 pass, 1 fail → OOS) ─────────────────────
    console.log('Seeding asset inspections...');

    // Forklift pre-use — PASS
    await client.query(`
      INSERT INTO asset_inspections
        (id, tenant_id, asset_id, template_id, inspection_type, inspected_at, inspected_by,
         meter_reading, result, checklist_responses, defects_noted,
         out_of_service, signature_at, notes, version, created_by)
      VALUES
        ($1, $2, $3, $4, 'pre_use', '2026-04-03 06:30:00+00', $5,
         1520.0, 'pass',
         $6::jsonb, '[]'::jsonb,
         FALSE, '2026-04-03 06:35:00+00',
         'All checks passed. Equipment ready for use.',
         1, $5)
      ON CONFLICT (id) DO NOTHING
    `, [
      P.ainsp1, D.tenant, P.a_forklift, P.tmpl1, D.dmitri,
      JSON.stringify([
        { item_id: '1',  response: 'ok',     note: null },
        { item_id: '2',  response: 'ok',     note: null },
        { item_id: '3',  response: 'ok',     note: null },
        { item_id: '4',  response: 'ok',     note: null },
        { item_id: '5',  response: 'ok',     note: null },
        { item_id: '6',  response: 'ok',     note: null },
        { item_id: '7',  response: 'ok',     note: null },
        { item_id: '8',  response: 'ok',     note: null },
        { item_id: '9',  response: 'ok',     note: null },
        { item_id: '10', response: '1520.0', note: null },
      ]),
    ]);

    // Boom lift pre-use — FAIL → out_of_service = TRUE (status already set to out_of_service above)
    await client.query(`
      INSERT INTO asset_inspections
        (id, tenant_id, asset_id, inspection_type, inspected_at, inspected_by,
         meter_reading, result, checklist_responses, defects_noted,
         out_of_service, out_of_service_at, signature_at, notes, version, created_by)
      VALUES
        ($1, $2, $3, 'pre_use', '2026-04-02 06:45:00+00', $4,
         980.5, 'fail',
         $5::jsonb, $6::jsonb,
         TRUE, '2026-04-02 06:50:00+00',
         '2026-04-02 06:50:00+00',
         'Platform control box shows hydraulic fault code E-04. Equipment tagged OOS pending repair.',
         1, $4)
      ON CONFLICT (id) DO NOTHING
    `, [
      P.ainsp2, D.tenant, P.a_boomlift, D.aaliyah,
      JSON.stringify([
        { item_id: '1', response: 'ok',     note: null },
        { item_id: '2', response: 'defect', note: 'Hydraulic fault code E-04 on platform controls' },
        { item_id: '3', response: 'ok',     note: null },
      ]),
      JSON.stringify([
        { description: 'Hydraulic fault code E-04 — platform elevation controls non-responsive', severity: 'major', photo_path: null },
      ]),
    ]);

    // ── 18. Asset warranties ──────────────────────────────────────────────
    console.log('Seeding asset warranties...');
    await client.query(`
      INSERT INTO asset_warranties
        (id, tenant_id, asset_id, warranty_type, provider_name, provider_contact,
         policy_number, coverage_description,
         start_date, expiry_date,
         is_transferable, version, created_by)
      VALUES
        -- Excavator manufacturer warranty (current — expires 2027)
        ($1,  $2, $3,  'manufacturer', 'Caterpillar Financial Products',
         '1-800-CATCORP', 'CAT-WTY-2020-00412',
         '3-year / 3,000-hour full machine warranty. Hydraulics and powertrain included.',
         '2020-04-22', '2023-04-22',
         FALSE, 1, $4),
        -- Truck1 extended warranty — EXPIRING SOON (25 days)
        ($5,  $2, $6,  'extended', 'Ford ProTECH Extended Warranty',
         '1-800-392-3673', 'FORD-EXT-22-F350-01241',
         '4-year/50,000-mile powertrain + bumper-to-bumper extended coverage.',
         '2022-03-15', '2026-04-29',
         FALSE, 1, $4),
        -- Boom lift component warranty (current — platform electronics)
        ($7,  $2, $8,  'component', 'JLG Industries — Platform Electronics',
         'service@jlg.com', 'JLG-ELEC-2021-00712',
         '3-year platform control system and electronics warranty.',
         '2021-05-18', '2024-05-18',
         FALSE, 1, $4)
      ON CONFLICT (id) DO NOTHING
    `, [
      P.aw1, D.tenant, P.a_excav,    D.marcus,
      P.aw2,           P.a_truck1,
      P.aw3,           P.a_boomlift,
    ]);

    // ── 19. Asset insurance policy + asset links ──────────────────────────
    console.log('Seeding fleet insurance policy...');
    await client.query(`
      INSERT INTO asset_insurance_policies
        (id, tenant_id, policy_type, policy_name, is_fleet_policy,
         carrier_name, carrier_contact, broker_name, broker_contact,
         policy_number, coverage_description,
         coverage_limit_cents, deductible_cents, annual_premium_cents,
         effective_date, expiry_date, auto_renew,
         notes, version, created_by)
      VALUES
        ($1, $2, 'fleet', '2026 Apex Commercial Fleet Auto Policy', TRUE,
         'Travelers Insurance', '1-800-328-2189', 'Austin Risk Partners', 'jsmith@austinrisk.com',
         'TRV-FL-2026-APEX-00012',
         'Commercial auto — covers all owned/leased vehicles in scheduled fleet. $1M CSL per occurrence.',
         100000000, 500000, 1850000,
         '2026-01-01', '2026-12-31', TRUE,
         'Fleet schedule on file. Includes cargo and equipment in transit coverage.',
         1, $3)
      ON CONFLICT (id) DO NOTHING
    `, [P.aip1, D.tenant, D.marcus]);

    // Link fleet policy to truck1, truck2, dump truck
    await client.query(`
      INSERT INTO asset_insurance_policy_assets
        (id, tenant_id, policy_id, asset_id, added_date)
      VALUES
        ($1, $2, $3, $4, '2026-01-01'),
        ($5, $2, $3, $6, '2026-01-01'),
        ($7, $2, $3, $8, '2026-01-01')
      ON CONFLICT (id) DO NOTHING
    `, [
      P.aipa1, D.tenant, P.aip1, P.a_truck1,
      P.aipa2,                   P.a_truck2,
      P.aipa3,                   P.a_dump,
    ]);

    // ── 20. Asset registrations ───────────────────────────────────────────
    console.log('Seeding asset registrations...');
    await client.query(`
      INSERT INTO asset_registrations
        (id, tenant_id, asset_id, registration_type, state_code,
         registration_number, license_plate, expiry_date,
         renewal_cost_cents, notes, version, created_by)
      VALUES
        -- Truck1 state registration — EXPIRING SOON (12 days: 2026-04-16)
        ($1,  $2, $3,  'state_vehicle', 'TX', 'TX-REG-2022-F350-001', 'TX-PLT-7892B',
         '2026-04-16', 97500, 'Annual renewal — Travis County', 1, $4),
        -- Truck2 state registration — current
        ($5,  $2, $6,  'state_vehicle', 'TX', 'TX-REG-2021-RAM-002', 'TX-PLT-6104C',
         '2026-11-15', 97500, 'Annual renewal — Travis County', 1, $4),
        -- Dump truck DOT registration — current
        ($7,  $2, $8,  'dot', 'TX', 'DOT-2026-APEX-4729', NULL,
         '2026-12-31', 45000, 'FMCSA DOT number TX-4729. USDOT annual update.',  1, $4)
      ON CONFLICT (id) DO NOTHING
    `, [
      P.areg1, D.tenant, P.a_truck1, D.marcus,
      P.areg2,           P.a_truck2,
      P.areg3,           P.a_dump,
    ]);

    // ── 21. Asset fuel logs ───────────────────────────────────────────────
    console.log('Seeding asset fuel logs...');
    await client.query(`
      INSERT INTO asset_fuel_logs
        (id, tenant_id, asset_id, log_date, fuel_type,
         gallons, cost_per_gallon_cents, total_cost_cents,
         odometer_reading, is_full_fill, state_code,
         station_name, project_id, created_by)
      VALUES
        ($1,  $2, $3,  '2026-03-28', 'gasoline', 24.3, 359, 8724,
         47100.0, TRUE, 'TX', 'Circle K — Mueller Blvd', $4,  $5),
        ($6,  $2, $3,  '2026-04-02', 'gasoline', 18.7, 362, 6769,
         47320.0, TRUE, 'TX', 'H-E-B Fuel — 183', $4, $5),
        ($7,  $2, $8,  '2026-03-25', 'diesel', 45.6, 421, 19198,
         NULL, TRUE, 'TX', 'Pilot Flying J — 290', NULL, $5),
        ($9,  $2, $10, '2026-04-01', 'diesel', 62.1, 421, 26144,
         108750.0, TRUE, 'TX', 'Pilot Flying J — 290', NULL, $5)
      ON CONFLICT (id) DO NOTHING
    `, [
      P.afl1, D.tenant, P.a_truck1, D.riverside, D.dmitri,
      P.afl2,
      P.afl3,           P.a_comp,
      P.afl4,           P.a_dump,
    ]);

    // ── 22. Depreciation schedules + entries ──────────────────────────────
    // Truck1: $58,500 purchase, $5,000 salvage, 5yr SL → $10,700/yr → $891.67/mo → 89167 cents/mo
    // Truck1 was bought 2022-03-15. At Apr 2026 = ~48 months depreciated.
    // Book value = 5850000 - 48*89167 = 5850000 - 4279,  let's compute properly:
    // Actually: annual = (5850000 - 500000) / 5 = 1070000/year = 89167/month
    // After 48 months: 48 * 89167 = 4280016. Book = 5850000 - 4280016 = 1569984
    // Jan 2026 = month 46 from Mar 2022: book = 5850000 - 46*89167 = 5850000-4101682 = 1748318
    // Feb 2026 = book after = 1748318 - 89167 = 1659151
    // Mar 2026 = 1659151 - 89167 = 1569984

    // Dump truck: $95,000 purchase, $15,000 salvage, 10yr SL → $8,000/yr → 66667/mo
    // Bought 2019-11-05. At Jan 2026 = ~74 months. After 74 months: 74*66667 = 4933358. Book=9500000-4933358=4566642
    // Jan 2026 = month 74: book_after = 9500000 - 74*66667 = 4566642
    // Feb 2026: 4566642 - 66667 = 4499975
    // Mar 2026: 4499975 - 66667 = 4433308
    console.log('Seeding asset depreciation schedules and entries...');
    await client.query(`
      INSERT INTO asset_depreciation_schedules
        (id, tenant_id, asset_id, method, useful_life_years,
         salvage_value_cents, depreciation_start_date,
         annual_depreciation_cents, current_book_value_cents,
         is_active, version, created_by)
      VALUES
        ($1, $2, $3,  'straight_line', 5,  500000, '2022-03-15', 1070000, 1569984, TRUE, 1, $4),
        ($5, $2, $6,  'straight_line', 10, 1500000, '2019-11-05', 800000, 4433308, TRUE, 1, $4)
      ON CONFLICT (id) DO NOTHING
    `, [
      P.ads1, D.tenant, P.a_truck1, D.marcus,
      P.ads2,           P.a_dump,
    ]);

    await client.query(`
      INSERT INTO asset_depreciation_entries
        (id, tenant_id, schedule_id, asset_id,
         period_start, period_end,
         depreciation_amount_cents, book_value_after_cents)
      VALUES
        ($1,  $2, $3,  $4,  '2026-01-01', '2026-01-31', 89167, 1748318),
        ($5,  $2, $3,  $4,  '2026-02-01', '2026-02-28', 89167, 1659151),
        ($6,  $2, $3,  $4,  '2026-03-01', '2026-03-31', 89167, 1569984),
        ($7,  $2, $8,  $9,  '2026-01-01', '2026-01-31', 66667, 4566642),
        ($10, $2, $8,  $9,  '2026-02-01', '2026-02-28', 66667, 4499975),
        ($11, $2, $8,  $9,  '2026-03-01', '2026-03-31', 66667, 4433308)
      ON CONFLICT (id) DO NOTHING
    `, [
      P.ade1, D.tenant, P.ads1, P.a_truck1,
      P.ade2, P.ade3,
      P.ade4,           P.ads2, P.a_dump,
      P.ade5, P.ade6,
    ]);

    // ── 23. Asset damage incident ─────────────────────────────────────────
    console.log('Seeding asset damage incident...');
    await client.query(`
      INSERT INTO asset_damage_incidents
        (id, tenant_id, asset_id, incident_date, reported_by,
         description, damage_type, severity,
         estimated_repair_cents, out_of_service, out_of_service_start,
         repair_authorized_by, repair_authorized_at,
         status, notes, version, created_by)
      VALUES
        ($1, $2, $3, '2026-03-18 14:30:00+00', $4,
         'Rear bumper and trailer hitch damaged while backing into material staging area on Riverside project. Tailgate latch also damaged.',
         'collision', 'moderate',
         185000, FALSE, NULL,
         $5, '2026-03-19 09:00:00+00',
         'repair_authorized',
         'Authorized to Sparks Fleet Services. Insurance claim filed with Travelers.',
         1, $4)
      ON CONFLICT (id) DO NOTHING
    `, [P.adm1, D.tenant, P.a_truck2, D.dmitri, D.marcus]);

    // ── 24. Asset safety-critical recall ─────────────────────────────────
    console.log('Seeding asset recall...');
    await client.query(`
      INSERT INTO asset_recalls
        (id, tenant_id, asset_id, recall_number, recall_date, source,
         description, severity, remedy_description,
         status, notes, version, created_by)
      VALUES
        ($1, $2, $3,
         'CAT-SA-2026-00041', '2026-03-15',
         'manufacturer',
         'Hydraulic main control valve may develop internal leak under high-cycle conditions, potentially causing unexpected boom drift. Affects 320 Next Gen units with serial prefix CAT0320V manufactured before 2021-06-01.',
         'safety_critical',
         'Replace hydraulic main control valve assembly per service bulletin SB-2026-320-001. Parts available from CAT dealer. Est. 4hr downtime.',
         'open',
         'Unit CAT0320VDKM00412 is within affected serial range. Recall notification received 2026-03-20. Schedule repair with Austin CAT dealer.',
         1, $4)
      ON CONFLICT (id) DO NOTHING
    `, [P.arc1, D.tenant, P.a_excav, D.marcus]);

    console.log('\n✅ Design partner seed complete!');
    console.log('   Tenant upgraded to BUSINESS tier');
    console.log('   Dmitri has 4 safety certifications (crane_operator, forklift, aerial_lift, CDL_B)');
    console.log('   Riverside project: 2 electrical panels, 5 circuits, 2 plumbing systems, 4 fixtures');
    console.log('   2 JSA records on Riverside');
    console.log('   1 active electrical permit + 5 AHJ inspection milestones (rough-in already passed)');
    console.log('   1 blueprint analysis (review_ready) with 17 proposed tasks');
    console.log('   20 company assets seeded across all categories');
    console.log('   Asset sub-records: meter readings, assignments, checkouts, service, maintenance,');
    console.log('     inspection template, inspections (1 pass / 1 fail→OOS), warranties,');
    console.log('     fleet insurance policy, registrations, fuel logs,');
    console.log('     depreciation schedules + 3 months entries, damage incident, safety-critical recall');
    console.log('\n   Run order: demo-seed → rich-seed → design-partner-seed');
    console.log('   Login as marcus@apexconstruction.demo / demo-password-2026\n');

  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
