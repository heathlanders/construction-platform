/**
 * Demo seed — Design Partner readiness
 * Run: npx tsx prisma/demo-seed.ts
 * Idempotent — safe to run multiple times (all UUIDs are fixed)
 */

import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// ── Fixed UUIDs (deterministic, idempotent) ────────────────────────────────
const IDS = {
  // Tenant
  tenant: '11111111-0000-0000-0000-000000000001',

  // Users
  marcus:   '22222222-0000-0000-0000-000000000001',
  sarah:    '22222222-0000-0000-0000-000000000002',
  jake:     '22222222-0000-0000-0000-000000000003',
  dmitri:   '22222222-0000-0000-0000-000000000004',
  aaliyah:  '22222222-0000-0000-0000-000000000005',
  patricia: '22222222-0000-0000-0000-000000000006',
  helen:    '22222222-0000-0000-0000-000000000007',   // client_portal

  // Projects
  riverside: '33333333-0000-0000-0000-000000000001',
  lofts:     '33333333-0000-0000-0000-000000000002',
  westfield: '33333333-0000-0000-0000-000000000003',

  // Cost codes
  cc_concrete:  '44444444-0000-0000-0000-000000000001',
  cc_steel:     '44444444-0000-0000-0000-000000000002',
  cc_finishes:  '44444444-0000-0000-0000-000000000003',
  cc_mech:      '44444444-0000-0000-0000-000000000004',
  cc_elec:      '44444444-0000-0000-0000-000000000005',

  // Budget line items
  bli_concrete: '55555555-0000-0000-0000-000000000001',
  bli_steel:    '55555555-0000-0000-0000-000000000002',
  bli_finishes: '55555555-0000-0000-0000-000000000003',
  bli_mech:     '55555555-0000-0000-0000-000000000004',
  bli_elec:     '55555555-0000-0000-0000-000000000005',

  // Change orders
  co1: '66666666-0000-0000-0000-000000000001',
  co2: '66666666-0000-0000-0000-000000000002',
  co3: '66666666-0000-0000-0000-000000000003',

  // Invoices
  inv1: '77777777-0000-0000-0000-000000000001',
  inv2: '77777777-0000-0000-0000-000000000002',

  // Time entries
  te1: '88888888-0000-0000-0000-000000000001',
  te2: '88888888-0000-0000-0000-000000000002',
  te3: '88888888-0000-0000-0000-000000000003',
  te4: '88888888-0000-0000-0000-000000000004',

  // Daily report
  dr1: '99999999-0000-0000-0000-000000000001',

  // Punch list
  pl1: 'aaaaaaaa-0000-0000-0000-000000000001',
  pl2: 'aaaaaaaa-0000-0000-0000-000000000002',
  pl3: 'aaaaaaaa-0000-0000-0000-000000000003',

  // RFI
  rfi1: 'bbbbbbbb-0000-0000-0000-000000000001',

  // Safety incident
  si1: 'cccccccc-0000-0000-0000-000000000001',

  // Bid package + takeoffs
  bp1: 'dddddddd-0000-0000-0000-000000000001',
  to1: 'eeeeeeee-0000-0000-0000-000000000001',
  to2: 'eeeeeeee-0000-0000-0000-000000000002',
  to3: 'eeeeeeee-0000-0000-0000-000000000003',

  // Schedule tasks (Riverside — drives Kanban + Gantt demo)
  st1: 'ffffffff-0000-0000-0000-000000000001',
  st2: 'ffffffff-0000-0000-0000-000000000002',
  st3: 'ffffffff-0000-0000-0000-000000000003',
  st4: 'ffffffff-0000-0000-0000-000000000004',
  st5: 'ffffffff-0000-0000-0000-000000000005',
  st6: 'ffffffff-0000-0000-0000-000000000006',

  // Milestones
  ms1: 'ffffffff-1000-0000-0000-000000000001',
  ms2: 'ffffffff-1000-0000-0000-000000000002',
  ms3: 'ffffffff-1000-0000-0000-000000000003',

  // Timecard (Dmitri — submitted, in PM review queue)
  tc1: 'ffffffff-2000-0000-0000-000000000001',

  // Safety certifications
  cert1: 'ffffffff-3000-0000-0000-000000000001',
  cert2: 'ffffffff-3000-0000-0000-000000000002',

  // Crew assignments
  ca1: 'ffffffff-4000-0000-0000-000000000001',
  ca2: 'ffffffff-4000-0000-0000-000000000002',

  // Concrete pours
  cp1: 'ffffffff-5000-0000-0000-000000000001',
  cp2: 'ffffffff-5000-0000-0000-000000000002',

  // Framing inspections
  fi1: 'ffffffff-6000-0000-0000-000000000001',
  fi2: 'ffffffff-6000-0000-0000-000000000002',

  // HVAC equipment
  hv1: 'ffffffff-7000-0000-0000-000000000001',
  hv2: 'ffffffff-7000-0000-0000-000000000002',

  // Roofing system
  rs1: 'ffffffff-8000-0000-0000-000000000001',
};

async function main() {
  const client = await pool.connect();
  try {
    console.log('🌱 Seeding demo data — Apex Construction...\n');

    const pwHash = await bcrypt.hash('demo-password-2026', 12);
    const trialEnd = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
    const now = new Date();
    const yesterday = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString();

    // 1. Tenant
    await client.query(`
      INSERT INTO tenants (id, name, slug, tier, status, trial_ends_at, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name, slug = EXCLUDED.slug, tier = EXCLUDED.tier,
        status = EXCLUDED.status, trial_ends_at = EXCLUDED.trial_ends_at,
        updated_at = NOW()
    `, [IDS.tenant, 'Apex Construction', 'apex-construction', 'professional', 'trial', trialEnd]);
    console.log('✓ Tenant: Apex Construction');

    // 2. Users
    const users = [
      [IDS.marcus,   'marcus@apexconstruction.demo',   'Marcus',   'Rivera',   'owner'],
      [IDS.sarah,    'sarah@apexconstruction.demo',    'Sarah',    'Chen',     'project_manager'],
      [IDS.jake,     'jake@apexconstruction.demo',     'Jake',     'Torres',   'estimator'],
      [IDS.dmitri,   'dmitri@apexconstruction.demo',   'Dmitri',   'Volkov',   'foreman'],
      [IDS.aaliyah,  'aaliyah@apexconstruction.demo',  'Aaliyah',  'Johnson',  'field_tech'],
      [IDS.patricia, 'patricia@apexconstruction.demo', 'Patricia', 'Walsh',    'accountant'],
    ];
    for (const [id, email, first, last, role] of users) {
      await client.query(`
        INSERT INTO users (id, tenant_id, email, password_hash, first_name, last_name, role, status, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'active', NOW(), NOW())
        ON CONFLICT (id) DO UPDATE SET
          email = EXCLUDED.email, password_hash = EXCLUDED.password_hash,
          first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name,
          role = EXCLUDED.role, updated_at = NOW()
      `, [id, IDS.tenant, email, pwHash, first, last, role]);
    }
    console.log('✓ Users: 6 team members');

    // 3. Projects
    const projects = [
      [IDS.riverside, 'Riverside Medical Center Expansion', 'active',  '2026-01-15', 'Austin',      'TX'],
      [IDS.lofts,     'Downtown Lofts — Phase 2',           'active',  '2026-02-01', 'Austin',      'TX'],
      [IDS.westfield, 'Westfield Elementary Renovation',    'on_hold', '2025-11-01', 'Round Rock',  'TX'],
    ];
    for (const [id, name, status, start, city, state] of projects) {
      await client.query(`
        INSERT INTO projects (id, tenant_id, name, status, start_date, city, state, created_by, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name, status = EXCLUDED.status, updated_at = NOW()
      `, [id, IDS.tenant, name, status, start, city, state, IDS.marcus]);
    }
    console.log('✓ Projects: 3 (Riverside, Lofts, Westfield)');

    // 4. Cost codes (for Riverside)
    const costCodes = [
      [IDS.cc_concrete, '03-000', 'Concrete',          'Materials'],
      [IDS.cc_steel,    '05-000', 'Structural Steel',  'Materials'],
      [IDS.cc_finishes, '09-000', 'Finishes',          'Labor'],
      [IDS.cc_mech,     '15-000', 'Mechanical',        'Equipment'],
      [IDS.cc_elec,     '16-000', 'Electrical',        'Labor'],
    ];
    for (const [id, code, name, category] of costCodes) {
      await client.query(`
        INSERT INTO cost_codes (id, tenant_id, code, name, category, created_by, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
        ON CONFLICT (id) DO UPDATE SET
          code = EXCLUDED.code, name = EXCLUDED.name, category = EXCLUDED.category,
          updated_at = NOW()
      `, [id, IDS.tenant, code, name, category, IDS.marcus]);
    }
    console.log('✓ Cost codes: 5');

    // 5. Budget line items (amounts in cents, T-02)
    const budgetItems = [
      [IDS.bli_concrete, IDS.cc_concrete, 'Concrete Work',                28500000, 14200000],
      [IDS.bli_steel,    IDS.cc_steel,    'Structural Steel',             42000000, 38800000],
      [IDS.bli_finishes, IDS.cc_finishes, 'Interior Finishes',           17500000,  2200000],
      [IDS.bli_mech,     IDS.cc_mech,     'Mechanical Systems',          31000000, 15500000],
      [IDS.bli_elec,     IDS.cc_elec,     'Electrical Systems',          26500000,  8900000],
    ];
    for (const [id, ccId, desc, budget, actual] of budgetItems) {
      await client.query(`
        INSERT INTO budget_line_items (id, tenant_id, project_id, cost_code_id, description, budget_cents, actual_cents, created_by, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
        ON CONFLICT (id) DO UPDATE SET
          description = EXCLUDED.description, budget_cents = EXCLUDED.budget_cents,
          actual_cents = EXCLUDED.actual_cents, updated_at = NOW()
      `, [id, IDS.tenant, IDS.riverside, ccId, desc, budget, actual, IDS.marcus]);
    }
    console.log('✓ Budget line items: 5');

    // 6. Change orders (amounts in cents)
    const changeOrders = [
      [IDS.co1, 'Structural steel grade upgrade',           4850000, 'approved'],
      [IDS.co2, 'Owner-requested lobby finishes upgrade',   2200000, 'pending'],
      [IDS.co3, 'Weather delay remediation',                 875000, 'rejected'],
    ];
    for (const [id, title, amount, status] of changeOrders) {
      await client.query(`
        INSERT INTO change_orders (id, tenant_id, project_id, title, amount_cents, status, created_by, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title, amount_cents = EXCLUDED.amount_cents,
          status = EXCLUDED.status, updated_at = NOW()
      `, [id, IDS.tenant, IDS.riverside, title, amount, status, IDS.sarah]);
    }
    console.log('✓ Change orders: 3');

    // 7. Invoices (amounts in cents)
    await client.query(`
      INSERT INTO invoices (id, tenant_id, project_id, amount_cents, status, due_date, created_by, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET
        amount_cents = EXCLUDED.amount_cents, status = EXCLUDED.status,
        due_date = EXCLUDED.due_date, updated_at = NOW()
    `, [IDS.inv1, IDS.tenant, IDS.riverside, 37500000, 'paid', '2026-02-28', IDS.patricia]);

    await client.query(`
      INSERT INTO invoices (id, tenant_id, project_id, amount_cents, status, due_date, created_by, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET
        amount_cents = EXCLUDED.amount_cents, status = EXCLUDED.status,
        due_date = EXCLUDED.due_date, updated_at = NOW()
    `, [IDS.inv2, IDS.tenant, IDS.riverside, 28500000, 'sent', '2026-03-31', IDS.patricia]);
    console.log('✓ Invoices: 2');

    // 8. Time entries
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const sixDaysAgo = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const timeEntries = [
      [IDS.te1, IDS.dmitri,  sevenDaysAgo, 8.0,  IDS.cc_concrete, 'Form work and pour'],
      [IDS.te2, IDS.dmitri,  sixDaysAgo,   8.0,  IDS.cc_steel,    'Steel beam installation'],
      [IDS.te3, IDS.aaliyah, twoDaysAgo,   8.0,  IDS.cc_finishes, 'Finish inspection walkthrough'],
      [IDS.te4, IDS.dmitri,  yesterday,    8.0,  IDS.cc_steel,    'Steel connection detail review'],
    ];
    for (const [id, userId, date, hours, ccId, notes] of timeEntries) {
      await client.query(`
        INSERT INTO time_entries (id, tenant_id, project_id, user_id, date, hours_worked, cost_code_id, notes, created_by, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
        ON CONFLICT (id) DO UPDATE SET
          hours_worked = EXCLUDED.hours_worked, notes = EXCLUDED.notes, updated_at = NOW()
      `, [id, IDS.tenant, IDS.riverside, userId, date, hours, ccId, notes, userId]);
    }
    console.log('✓ Time entries: 4');

    // 9. Daily report
    await client.query(`
      INSERT INTO daily_reports (id, tenant_id, project_id, report_date, weather, notes, created_by, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET
        weather = EXCLUDED.weather, notes = EXCLUDED.notes, updated_at = NOW()
    `, [
      IDS.dr1, IDS.tenant, IDS.riverside, yesterday,
      JSON.stringify({ condition: 'Clear', temp_f: 72, humidity_pct: 45 }),
      'Structural steel installation 85% complete. Crew of 14 on site. No safety incidents.',
      IDS.dmitri,
    ]);
    console.log('✓ Daily report: 1');

    // 10. Punch list items
    const punchItems = [
      [IDS.pl1, 'Lobby ceiling tiles misaligned',    'open',        IDS.dmitri],
      [IDS.pl2, 'HVAC duct exposed in Suite 204',    'in_progress', IDS.dmitri],
      [IDS.pl3, 'Exit sign missing in stairwell B',  'open',        IDS.aaliyah],
    ];
    for (const [id, title, status, assignee] of punchItems) {
      await client.query(`
        INSERT INTO punch_list_items (id, tenant_id, project_id, title, status, assigned_to, created_by, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title, status = EXCLUDED.status, updated_at = NOW()
      `, [id, IDS.tenant, IDS.riverside, title, status, assignee, IDS.sarah]);
    }
    console.log('✓ Punch list items: 3');

    // 11. RFI
    await client.query(`
      INSERT INTO rfis (id, tenant_id, project_id, number, subject, status, assignee_id, created_by, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET
        subject = EXCLUDED.subject, status = EXCLUDED.status, updated_at = NOW()
    `, [
      IDS.rfi1, IDS.tenant, IDS.riverside, 1,
      'Clarification on structural beam connection detail at grid C4',
      'open', IDS.sarah, IDS.sarah,
    ]);
    console.log('✓ RFI: 1');

    // 12. Safety incident
    await client.query(`
      INSERT INTO safety_incidents (id, tenant_id, project_id, incident_date, description, severity, status, created_by, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET
        description = EXCLUDED.description, severity = EXCLUDED.severity,
        status = EXCLUDED.status, updated_at = NOW()
    `, [
      IDS.si1, IDS.tenant, IDS.riverside, fiveDaysAgo,
      'Worker slipped on wet concrete surface near loading dock. No injury. Area marked and dried.',
      'near_miss', 'closed', IDS.dmitri,
    ]);
    console.log('✓ Safety incident: 1 (near miss, closed)');

    // 13. Bid package (Downtown Lofts) + takeoff items
    await client.query(`
      INSERT INTO bid_packages (id, tenant_id, project_id, title, status, due_date, created_by, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title, status = EXCLUDED.status, updated_at = NOW()
    `, [IDS.bp1, IDS.tenant, IDS.lofts, 'Electrical Subcontract — Phase 2', 'open', '2026-04-15', IDS.jake]);

    const takeoffs = [
      [IDS.to1, 'Panel installation',   8,    'EA', 120000],
      [IDS.to2, 'Wire pulls',          2400, 'LF',    450],
      [IDS.to3, 'Fixture installation', 185, 'EA',   8500],
    ];
    for (const [id, desc, qty, unit, unitCost] of takeoffs) {
      await client.query(`
        INSERT INTO takeoff_items (id, tenant_id, project_id, bid_package_id, description, quantity, unit, unit_cost_cents, created_by, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
        ON CONFLICT (id) DO UPDATE SET
          description = EXCLUDED.description, quantity = EXCLUDED.quantity,
          unit = EXCLUDED.unit, unit_cost_cents = EXCLUDED.unit_cost_cents, updated_at = NOW()
      `, [id, IDS.tenant, IDS.lofts, IDS.bp1, desc, qty, unit, unitCost, IDS.jake]);
    }
    console.log('✓ Bid package: 1 with 3 takeoff items');

    // ── Date helpers for new sections ──────────────────────────────────────────
    // Week-start (Monday) of the week containing the time entries (7 days ago)
    const sevenDaysAgoDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const dow = sevenDaysAgoDate.getDay(); // 0=Sun
    const daysToMonday = dow === 0 ? 6 : dow - 1;
    const weekStartDate = new Date(sevenDaysAgoDate.getTime() - daysToMonday * 24 * 60 * 60 * 1000);
    const weekStartStr = weekStartDate.toISOString().split('T')[0];

    // Safety cert expiry — 20 days from now (shows "Expiring Soon" banner)
    const expiringSoon = new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // 14. Schedule tasks (Riverside — feeds Kanban board + Gantt timeline)
    const scheduleTasks = [
      // [id, title, status, pct, plannedStart, plannedEnd, assignedTo, predecessorId, showPortal]
      [IDS.st1, 'Site Preparation',        'complete',     100, '2026-01-15', '2026-02-07', IDS.dmitri,  null,    true],
      [IDS.st2, 'Foundation Work',         'complete',     100, '2026-02-03', '2026-02-28', IDS.dmitri,  IDS.st1, true],
      [IDS.st3, 'Structural Steel',        'in_progress',   60, '2026-03-01', '2026-04-30', IDS.dmitri,  IDS.st2, true],
      [IDS.st4, 'Mechanical Rough-in',     'not_started',    0, '2026-04-01', '2026-05-31', IDS.aaliyah, IDS.st3, false],
      [IDS.st5, 'Electrical Rough-in',     'not_started',    0, '2026-04-15', '2026-05-31', IDS.aaliyah, IDS.st3, false],
      [IDS.st6, 'Exterior Finishes',       'on_hold',        0, '2026-05-01', '2026-06-30', IDS.dmitri,  null,    false],
    ];
    for (const [id, title, status, pct, ps, pe, assignedTo, predId, showPortal] of scheduleTasks) {
      await client.query(`
        INSERT INTO schedule_tasks (
          id, tenant_id, project_id, title, status, percent_complete,
          planned_start, planned_end, assigned_to_user_id, predecessor_task_id,
          show_in_client_portal, created_by, created_at, updated_at
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NOW(),NOW())
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title, status = EXCLUDED.status,
          percent_complete = EXCLUDED.percent_complete, updated_at = NOW()
      `, [id, IDS.tenant, IDS.riverside, title, status, pct, ps, pe, assignedTo, predId, showPortal, IDS.sarah]);
    }
    console.log('✓ Schedule tasks: 6 (2 complete, 1 in-progress, 2 not-started, 1 on-hold)');

    // 15. Milestones (Riverside — appear as diamonds on Gantt, visible in portal)
    const milestones = [
      // [id, title, dueDate, completedAt]
      [IDS.ms1, 'Foundation Complete',         '2026-02-28', '2026-02-28T16:00:00Z'],
      [IDS.ms2, 'Steel Structure Topped Out',   '2026-04-30', null],
      [IDS.ms3, 'Certificate of Occupancy',     '2026-08-15', null],
    ];
    for (const [id, title, dueDate, completedAt] of milestones) {
      await client.query(`
        INSERT INTO milestones (id, tenant_id, project_id, title, due_date, completed_at, created_by, created_at, updated_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,NOW(),NOW())
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title, due_date = EXCLUDED.due_date,
          completed_at = EXCLUDED.completed_at, updated_at = NOW()
      `, [id, IDS.tenant, IDS.riverside, title, dueDate, completedAt, IDS.sarah]);
    }
    console.log('✓ Milestones: 3 (1 completed, 2 upcoming)');

    // 16. Timecard — Dmitri, last full week, submitted (shows in PM approval queue)
    await client.query(`
      INSERT INTO timecards (
        id, tenant_id, user_id, week_start, status, total_hours, overtime_hours,
        submitted_at, created_by, created_at, updated_at
      )
      VALUES ($1,$2,$3,$4,'submitted',$5,0,NOW(),$3,NOW(),NOW())
      ON CONFLICT (id) DO UPDATE SET
        status = EXCLUDED.status, total_hours = EXCLUDED.total_hours,
        submitted_at = EXCLUDED.submitted_at, updated_at = NOW()
    `, [IDS.tc1, IDS.tenant, IDS.dmitri, weekStartStr, 32.0]);
    console.log(`✓ Timecard: Dmitri — week ${weekStartStr}, 32h submitted, awaiting approval`);

    // 17. Safety certifications
    const certs = [
      // [id, userId, certType, issuedAt, expiresAt]
      [IDS.cert1, IDS.dmitri,  'OSHA_30',   '2023-03-15', expiringSoon],  // expiring soon
      [IDS.cert2, IDS.aaliyah, 'First Aid', '2025-01-20', '2027-01-20'],   // valid
    ];
    for (const [id, userId, certType, issuedAt, expiresAt] of certs) {
      await client.query(`
        INSERT INTO safety_certifications (
          id, tenant_id, user_id, cert_type, issued_at, expires_at, created_by, created_at, updated_at
        )
        VALUES ($1,$2,$3,$4,$5,$6,$3,NOW(),NOW())
        ON CONFLICT (id) DO UPDATE SET
          cert_type = EXCLUDED.cert_type, expires_at = EXCLUDED.expires_at, updated_at = NOW()
      `, [id, IDS.tenant, userId, certType, issuedAt, expiresAt]);
    }
    console.log(`✓ Safety certs: Dmitri OSHA-30 expiring ${expiringSoon}, Aaliyah First Aid valid`);

    // 18. Crew assignments (Riverside)
    const crewAssignments = [
      // [id, userId, startDate, endDate, role]
      [IDS.ca1, IDS.dmitri,  '2026-01-15', '2026-08-15', 'Lead Foreman'],
      [IDS.ca2, IDS.aaliyah, '2026-02-01', '2026-06-30', 'Field Technician'],
    ];
    for (const [id, userId, startDate, endDate, role] of crewAssignments) {
      await client.query(`
        INSERT INTO crew_assignments (
          id, tenant_id, project_id, user_id, start_date, end_date, role_on_task, created_by, created_at, updated_at
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW(),NOW())
        ON CONFLICT (id) DO UPDATE SET
          role_on_task = EXCLUDED.role_on_task, end_date = EXCLUDED.end_date, updated_at = NOW()
      `, [id, IDS.tenant, IDS.riverside, userId, startDate, endDate, role, IDS.sarah]);
    }
    console.log('✓ Crew assignments: Dmitri + Aaliyah on Riverside');

    // 19. Concrete pours (Riverside)
    await client.query(`
      INSERT INTO concrete_pours (
        id, tenant_id, project_id, pour_type, volume_cy, mix_design, slump_inches,
        pour_date, status, notes, created_by, created_at, updated_at
      )
      VALUES ($1,$2,$3,'footing',125.0,'4000 PSI, 3/4" aggregate',4.5,'2026-02-10','complete',
        'All footings poured successfully. No slump issues. Cured 28 days.',$4,NOW(),NOW())
      ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, updated_at = NOW()
    `, [IDS.cp1, IDS.tenant, IDS.riverside, IDS.dmitri]);

    await client.query(`
      INSERT INTO concrete_pours (
        id, tenant_id, project_id, pour_type, volume_cy, mix_design, slump_inches,
        pour_date, status, notes, created_by, created_at, updated_at
      )
      VALUES ($1,$2,$3,'slab',85.0,'3500 PSI lightweight','',  '2026-05-15','planned',
        'Slab on grade for first floor — scheduled after mechanical rough-in.',$4,NOW(),NOW())
      ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, updated_at = NOW()
    `, [IDS.cp2, IDS.tenant, IDS.riverside, IDS.dmitri]);
    console.log('✓ Concrete pours: 1 complete, 1 planned');

    // 20. Framing inspections (Riverside)
    await client.query(`
      INSERT INTO framing_inspections (
        id, tenant_id, project_id, section, inspection_date, inspector_name,
        status, notes, created_by, created_at, updated_at
      )
      VALUES ($1,$2,$3,'exterior_walls','2026-02-25','City Inspector — J. Martinez',
        'passed','All exterior wall framing passed. Shear panel nailing verified.',$4,NOW(),NOW())
      ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, updated_at = NOW()
    `, [IDS.fi1, IDS.tenant, IDS.riverside, IDS.dmitri]);

    await client.query(`
      INSERT INTO framing_inspections (
        id, tenant_id, project_id, section, inspection_date, inspector_name,
        status, notes, created_by, created_at, updated_at
      )
      VALUES ($1,$2,$3,'roof_trusses','2026-04-28',null,
        'pending','Scheduled for 4/28 — truss installation must be 100% complete first.',$4,NOW(),NOW())
      ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, updated_at = NOW()
    `, [IDS.fi2, IDS.tenant, IDS.riverside, IDS.dmitri]);
    console.log('✓ Framing inspections: 1 passed, 1 pending');

    // 21. HVAC equipment (Riverside)
    await client.query(`
      INSERT INTO hvac_equipment (
        id, tenant_id, project_id, equipment_type, manufacturer, model, tonnage,
        seer_rating, location, status, notes, created_by, created_at, updated_at
      )
      VALUES ($1,$2,$3,'ac_unit','Carrier','48XC-025',25.0,16.0,'Rooftop Zone 1',
        'installed','Main rooftop unit installed. Startup pending electrical connection.',$4,NOW(),NOW())
      ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, updated_at = NOW()
    `, [IDS.hv1, IDS.tenant, IDS.riverside, IDS.aaliyah]);

    await client.query(`
      INSERT INTO hvac_equipment (
        id, tenant_id, project_id, equipment_type, manufacturer, model, tonnage,
        seer_rating, location, status, notes, created_by, created_at, updated_at
      )
      VALUES ($1,$2,$3,'air_handler','Carrier','FV4C','',0,'Mechanical Room B',
        'planned','Air handler for east wing. Delivery expected 2026-04-10.',$4,NOW(),NOW())
      ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, updated_at = NOW()
    `, [IDS.hv2, IDS.tenant, IDS.riverside, IDS.aaliyah]);
    console.log('✓ HVAC equipment: 1 installed, 1 planned');

    // 22. Roofing system (Riverside)
    await client.query(`
      INSERT INTO roofing_systems (
        id, tenant_id, project_id, roof_type, total_squares, underlayment_type,
        manufacturer, product_line, color, warranty_years, status, notes, created_by, created_at, updated_at
      )
      VALUES ($1,$2,$3,'flat_tpo',128.0,'TPO 60-mil fully adhered',
        'Carlisle','Sure-Weld TPO','White',20,'planned',
        'Medical-grade TPO membrane. Slip-sheet required over steel deck.',$4,NOW(),NOW())
      ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, updated_at = NOW()
    `, [IDS.rs1, IDS.tenant, IDS.riverside, IDS.dmitri]);
    console.log('✓ Roofing system: 1 (TPO flat roof, planned)');

    // 23. Client portal user (homeowner / client login for portal demo)
    const pwHashPortal = await bcrypt.hash('portal-demo-2026', 12);
    await client.query(`
      INSERT INTO users (
        id, tenant_id, email, password_hash, first_name, last_name, role, status, created_at, updated_at
      )
      VALUES ($1,$2,$3,$4,'Helen','Foster','client_portal','active',NOW(),NOW())
      ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email, password_hash = EXCLUDED.password_hash,
        first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name,
        role = EXCLUDED.role, updated_at = NOW()
    `, [IDS.helen, IDS.tenant, 'helen@riverside-hospital.demo', pwHashPortal]);
    console.log('✓ Client portal user: Helen Foster (Riverside Hospital facilities manager)');

    console.log('\n' + '─'.repeat(50));
    console.log('✅ Demo seed complete — Apex Construction\n');
    console.log('Login credentials:');
    console.log('  Password: demo-password-2026  (all staff accounts)');
    console.log('  Password: portal-demo-2026    (client portal)\n');
    console.log('  marcus@apexconstruction.demo   — Owner');
    console.log('  sarah@apexconstruction.demo    — Project Manager');
    console.log('  jake@apexconstruction.demo     — Estimator');
    console.log('  dmitri@apexconstruction.demo   — Foreman');
    console.log('  aaliyah@apexconstruction.demo  — Field Tech');
    console.log('  patricia@apexconstruction.demo — Accountant');
    console.log('  helen@riverside-hospital.demo  — Client Portal (→ /portal)');
    console.log('─'.repeat(50));

  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error('Demo seed failed:', err);
  process.exit(1);
});
