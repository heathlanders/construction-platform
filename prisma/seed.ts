// prisma/seed.ts — development database seed
// Run with: pnpm db:seed  (or: tsx prisma/seed.ts)
// Creates a dev tenant, users, project, and rich domain data for local development.

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ─── Fixed IDs for idempotent re-seeding ──────────────────────────────────────

const DEV_TENANT_ID          = '00000000-0000-0000-0000-000000000001';
const DEV_USER_ID            = '00000000-0000-0000-0000-000000000002';
const DEV_PM_USER_ID         = '00000000-0000-0000-0000-000000000003';
const DEV_FOREMAN_USER_ID    = '00000000-0000-0000-0000-000000000004';
const DEV_PROJECT_ID         = '00000000-0000-0000-0000-000000000010';

const DEV_COST_CODE_LABOR_ID     = '00000000-0000-0000-0000-000000000020';
const DEV_COST_CODE_MATERIALS_ID = '00000000-0000-0000-0000-000000000021';
const DEV_COST_CODE_EQUIPMENT_ID = '00000000-0000-0000-0000-000000000022';

const DEV_SCHEDULE_TASK_1_ID = '00000000-0000-0000-0000-000000000030';
const DEV_SCHEDULE_TASK_2_ID = '00000000-0000-0000-0000-000000000031';
const DEV_SCHEDULE_TASK_3_ID = '00000000-0000-0000-0000-000000000032';
const DEV_SCHEDULE_TASK_4_ID = '00000000-0000-0000-0000-000000000033';
const DEV_SCHEDULE_TASK_5_ID = '00000000-0000-0000-0000-000000000034';

const DEV_TIME_ENTRY_1_ID    = '00000000-0000-0000-0000-000000000040';
const DEV_TIME_ENTRY_2_ID    = '00000000-0000-0000-0000-000000000041';
const DEV_TIME_ENTRY_3_ID    = '00000000-0000-0000-0000-000000000042';

const DEV_DAILY_REPORT_1_ID  = '00000000-0000-0000-0000-000000000050';
const DEV_DAILY_REPORT_2_ID  = '00000000-0000-0000-0000-000000000051';

const DEV_SAFETY_INCIDENT_1_ID = '00000000-0000-0000-0000-000000000060';
const DEV_SAFETY_INCIDENT_2_ID = '00000000-0000-0000-0000-000000000061';

const DEV_BUDGET_LINE_1_ID   = '00000000-0000-0000-0000-000000000070';
const DEV_BUDGET_LINE_2_ID   = '00000000-0000-0000-0000-000000000071';
const DEV_BUDGET_LINE_3_ID   = '00000000-0000-0000-0000-000000000072';

const DEV_VENDOR_ID          = '00000000-0000-0000-0000-000000000080';
const DEV_CONTRACT_ID        = '00000000-0000-0000-0000-000000000081';

const DEV_BID_PACKAGE_ID     = '00000000-0000-0000-0000-000000000090';
const DEV_TAKEOFF_1_ID       = '00000000-0000-0000-0000-000000000091';
const DEV_TAKEOFF_2_ID       = '00000000-0000-0000-0000-000000000092';
const DEV_TAKEOFF_3_ID       = '00000000-0000-0000-0000-000000000093';

const DEV_PANEL_ID           = '00000000-0000-0000-0000-0000000000a0';
const DEV_CIRCUIT_1_ID       = '00000000-0000-0000-0000-0000000000a1';
const DEV_CIRCUIT_2_ID       = '00000000-0000-0000-0000-0000000000a2';

const DEV_PLUMBING_SYSTEM_ID    = '00000000-0000-0000-0000-0000000000b0';
const DEV_PLUMBING_FIXTURE_1_ID = '00000000-0000-0000-0000-0000000000b1';
const DEV_PLUMBING_FIXTURE_2_ID = '00000000-0000-0000-0000-0000000000b2';

const DEV_BLUEPRINT_ANALYSIS_ID = '00000000-0000-0000-0000-0000000000c0';

const DEV_PERMIT_ID          = '00000000-0000-0000-0000-0000000000e0';

// ─── Proposed task IDs ────────────────────────────────────────────────────────

const PROPOSED_TASKS = [
  { id: '00000000-0000-0000-0000-0000000000d1', title: 'Site Clearing and Grubbing',         tradeType: 'general',    phase: 'site_prep',         csiDivision: '31 10 00', estimatedDurationDays: 5,  sortOrder: 10 },
  { id: '00000000-0000-0000-0000-0000000000d2', title: 'Concrete Foundation Footings',       tradeType: 'concrete',   phase: 'foundation',        csiDivision: '03 10 00', estimatedDurationDays: 7,  sortOrder: 20 },
  { id: '00000000-0000-0000-0000-0000000000d3', title: 'Structural Steel Erection',          tradeType: 'structural', phase: 'framing',           csiDivision: '05 12 00', estimatedDurationDays: 14, sortOrder: 30 },
  { id: '00000000-0000-0000-0000-0000000000d4', title: 'Roofing — TPO Membrane System',      tradeType: 'roofing',    phase: 'roofing',           csiDivision: '07 54 23', estimatedDurationDays: 5,  sortOrder: 40 },
  { id: '00000000-0000-0000-0000-0000000000d5', title: 'Electrical Service Entrance',        tradeType: 'electrical', phase: 'rough_in',          csiDivision: '26 24 13', estimatedDurationDays: 3,  sortOrder: 50 },
  { id: '00000000-0000-0000-0000-0000000000d6', title: 'Electrical Branch Circuit Rough-In', tradeType: 'electrical', phase: 'rough_in',          csiDivision: '26 27 26', estimatedDurationDays: 7,  sortOrder: 60 },
  { id: '00000000-0000-0000-0000-0000000000d7', title: 'Plumbing Rough-In (Supply & Drain)', tradeType: 'plumbing',   phase: 'rough_in',          csiDivision: '22 10 00', estimatedDurationDays: 5,  sortOrder: 70 },
  { id: '00000000-0000-0000-0000-0000000000d8', title: 'HVAC Ductwork Installation',         tradeType: 'hvac',       phase: 'rough_in',          csiDivision: '23 31 00', estimatedDurationDays: 7,  sortOrder: 80 },
  { id: '00000000-0000-0000-0000-0000000000d9', title: 'Drywall Hanging and Taping',         tradeType: 'drywall',    phase: 'drywall',           csiDivision: '09 29 00', estimatedDurationDays: 10, sortOrder: 90 },
  { id: '00000000-0000-0000-0000-0000000000da', title: 'Interior Paint and Wall Finishes',   tradeType: 'finishes',   phase: 'finishes_interior', csiDivision: '09 91 00', estimatedDurationDays: 7,  sortOrder: 100 },
];

async function main() {
  console.log('Seeding development database...');

  // ─── Platform records ──────────────────────────────────────────────────────

  // Dev tenant
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'dev-tenant' },
    update: {},
    create: {
      id: DEV_TENANT_ID,
      name: 'Dev Construction Co.',
      slug: 'dev-tenant',
      tier: 'business',
      status: 'active',
    },
  });
  console.log(`✓ Tenant: ${tenant.name} (${tenant.id})`);

  // Dev owner user
  // password hash = bcrypt('devpassword', 10) — NEVER use in production
  const user = await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: 'owner@dev.local' } },
    update: {},
    create: {
      id: DEV_USER_ID,
      tenantId: tenant.id,
      email: 'owner@dev.local',
      passwordHash:
        '$2b$10$K7L1OJ45/4Y2nIvhRVpCe.FSmhDdWoXehVzJptJ/op0lSsvqNu9Su',
      firstName: 'Dev',
      lastName: 'Owner',
      role: 'owner',
      status: 'active',
      languagePreference: 'en',
    },
  });
  console.log(`✓ User: ${user.email} (role: ${user.role})`);

  // PM user
  const pm = await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: 'pm@dev.local' } },
    update: {},
    create: {
      id: DEV_PM_USER_ID,
      tenantId: tenant.id,
      email: 'pm@dev.local',
      passwordHash:
        '$2b$10$K7L1OJ45/4Y2nIvhRVpCe.FSmhDdWoXehVzJptJ/op0lSsvqNu9Su',
      firstName: 'Jordan',
      lastName: 'Smith',
      role: 'project_manager',
      status: 'active',
      languagePreference: 'en',
    },
  });
  console.log(`✓ User: ${pm.email} (role: ${pm.role})`);

  // Foreman user
  const foreman = await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: 'foreman@dev.local' } },
    update: {},
    create: {
      id: DEV_FOREMAN_USER_ID,
      tenantId: tenant.id,
      email: 'foreman@dev.local',
      passwordHash:
        '$2b$10$K7L1OJ45/4Y2nIvhRVpCe.FSmhDdWoXehVzJptJ/op0lSsvqNu9Su',
      firstName: 'Mike',
      lastName: 'Torres',
      role: 'foreman',
      status: 'active',
      languagePreference: 'en',
    },
  });
  console.log(`✓ User: ${foreman.email} (role: ${foreman.role})`);

  // Dev project
  const project = await prisma.project.upsert({
    where: { id: DEV_PROJECT_ID },
    update: {},
    create: {
      id: DEV_PROJECT_ID,
      tenantId: tenant.id,
      name: 'Dev Project Alpha',
      status: 'active',
      address: '123 Main St',
      city: 'Austin',
      state: 'TX',
      zip: '78701',
      createdBy: user.id,
    },
  });
  console.log(`✓ Project: ${project.name} (${project.id})`);

  // Dev subscription (Business tier — enables assets, warranties, and all Business+ features)
  await prisma.tenantSubscription.upsert({
    where: { tenantId: tenant.id },
    update: {},
    create: {
      tenantId: tenant.id,
      tier: 'business',
      status: 'active',
      addonGcModule: true,
      addonCrossTenant: true,
    },
  });
  console.log(`✓ Subscription: business (active)`);

  // Dev storage usage record
  await prisma.tenantStorageUsage.upsert({
    where: { tenantId: tenant.id },
    update: {},
    create: {
      tenantId: tenant.id,
      bytesUsed: BigInt(0),
    },
  });
  console.log(`✓ Storage usage initialized`);

  // ─── Cost codes ────────────────────────────────────────────────────────────

  await prisma.costCode.upsert({
    where: { id: DEV_COST_CODE_LABOR_ID },
    update: {},
    create: {
      id: DEV_COST_CODE_LABOR_ID,
      tenantId: tenant.id,
      code: '01-001',
      name: 'General Labor',
      category: 'Labor',
      createdBy: user.id,
    },
  });
  await prisma.costCode.upsert({
    where: { id: DEV_COST_CODE_MATERIALS_ID },
    update: {},
    create: {
      id: DEV_COST_CODE_MATERIALS_ID,
      tenantId: tenant.id,
      code: '03-001',
      name: 'Concrete & Masonry Materials',
      category: 'Materials',
      createdBy: user.id,
    },
  });
  await prisma.costCode.upsert({
    where: { id: DEV_COST_CODE_EQUIPMENT_ID },
    update: {},
    create: {
      id: DEV_COST_CODE_EQUIPMENT_ID,
      tenantId: tenant.id,
      code: '15-001',
      name: 'Equipment Rental',
      category: 'Equipment',
      createdBy: user.id,
    },
  });
  console.log(`✓ Cost codes: Labor (01-001), Materials (03-001), Equipment (15-001)`);

  // ─── Schedule tasks ─────────────────────────────────────────────────────────

  await prisma.scheduleTask.upsert({
    where: { id: DEV_SCHEDULE_TASK_1_ID },
    update: {},
    create: {
      id: DEV_SCHEDULE_TASK_1_ID,
      tenantId: tenant.id,
      projectId: project.id,
      title: 'Site Preparation & Demolition',
      status: 'complete',
      percentComplete: 100,
      plannedStart: new Date('2026-01-15'),
      plannedEnd: new Date('2026-02-01'),
      actualStart: new Date('2026-01-15'),
      actualEnd: new Date('2026-01-31'),
      assignedToUserId: DEV_FOREMAN_USER_ID,
      createdBy: user.id,
    },
  });
  await prisma.scheduleTask.upsert({
    where: { id: DEV_SCHEDULE_TASK_2_ID },
    update: {},
    create: {
      id: DEV_SCHEDULE_TASK_2_ID,
      tenantId: tenant.id,
      projectId: project.id,
      title: 'Foundation & Concrete Pour',
      status: 'complete',
      percentComplete: 100,
      plannedStart: new Date('2026-02-03'),
      plannedEnd: new Date('2026-02-15'),
      actualStart: new Date('2026-02-03'),
      actualEnd: new Date('2026-02-14'),
      assignedToUserId: DEV_FOREMAN_USER_ID,
      createdBy: user.id,
    },
  });
  await prisma.scheduleTask.upsert({
    where: { id: DEV_SCHEDULE_TASK_3_ID },
    update: {},
    create: {
      id: DEV_SCHEDULE_TASK_3_ID,
      tenantId: tenant.id,
      projectId: project.id,
      title: 'Structural Framing',
      status: 'in_progress',
      percentComplete: 60,
      plannedStart: new Date('2026-02-17'),
      plannedEnd: new Date('2026-03-15'),
      actualStart: new Date('2026-02-17'),
      assignedToUserId: DEV_FOREMAN_USER_ID,
      createdBy: user.id,
    },
  });
  await prisma.scheduleTask.upsert({
    where: { id: DEV_SCHEDULE_TASK_4_ID },
    update: {},
    create: {
      id: DEV_SCHEDULE_TASK_4_ID,
      tenantId: tenant.id,
      projectId: project.id,
      title: 'Electrical Rough-In',
      status: 'not_started',
      percentComplete: 0,
      plannedStart: new Date('2026-03-17'),
      plannedEnd: new Date('2026-04-01'),
      assignedToUserId: DEV_PM_USER_ID,
      createdBy: user.id,
    },
  });
  await prisma.scheduleTask.upsert({
    where: { id: DEV_SCHEDULE_TASK_5_ID },
    update: {},
    create: {
      id: DEV_SCHEDULE_TASK_5_ID,
      tenantId: tenant.id,
      projectId: project.id,
      title: 'Drywall Installation',
      status: 'not_started',
      percentComplete: 0,
      plannedStart: new Date('2026-04-03'),
      plannedEnd: new Date('2026-04-20'),
      createdBy: user.id,
    },
  });
  console.log(`✓ Schedule tasks: 5 tasks (site_prep→drywall; 2 complete, 1 in_progress, 2 not_started)`);

  // ─── Time entries ───────────────────────────────────────────────────────────

  await prisma.timeEntry.upsert({
    where: { id: DEV_TIME_ENTRY_1_ID },
    update: {},
    create: {
      id: DEV_TIME_ENTRY_1_ID,
      tenantId: tenant.id,
      projectId: project.id,
      userId: DEV_FOREMAN_USER_ID,
      date: new Date('2026-04-07'),
      hoursWorked: 8.0,
      costCodeId: DEV_COST_CODE_LABOR_ID,
      notes: 'Framing north wall — structural steel erection',
      createdBy: DEV_FOREMAN_USER_ID,
    },
  });
  await prisma.timeEntry.upsert({
    where: { id: DEV_TIME_ENTRY_2_ID },
    update: {},
    create: {
      id: DEV_TIME_ENTRY_2_ID,
      tenantId: tenant.id,
      projectId: project.id,
      userId: DEV_FOREMAN_USER_ID,
      date: new Date('2026-04-08'),
      hoursWorked: 8.0,
      costCodeId: DEV_COST_CODE_LABOR_ID,
      notes: 'Framing east and west walls',
      createdBy: DEV_FOREMAN_USER_ID,
    },
  });
  await prisma.timeEntry.upsert({
    where: { id: DEV_TIME_ENTRY_3_ID },
    update: {},
    create: {
      id: DEV_TIME_ENTRY_3_ID,
      tenantId: tenant.id,
      projectId: project.id,
      userId: DEV_PM_USER_ID,
      date: new Date('2026-04-08'),
      hoursWorked: 4.0,
      costCodeId: DEV_COST_CODE_LABOR_ID,
      notes: 'Site coordination and framing inspection review',
      createdBy: DEV_PM_USER_ID,
    },
  });
  console.log(`✓ Time entries: 3 entries (foreman ×2 @ 8h, PM ×1 @ 4h)`);

  // ─── Daily reports ──────────────────────────────────────────────────────────

  await prisma.dailyReport.upsert({
    where: { id: DEV_DAILY_REPORT_1_ID },
    update: {},
    create: {
      id: DEV_DAILY_REPORT_1_ID,
      tenantId: tenant.id,
      projectId: project.id,
      reportDate: new Date('2026-04-07'),
      weather: { condition: 'Clear', temp_f: 72, wind_mph: 8 },
      notes: '12-man crew on site. Structural framing on north wall progressing well. No incidents. Concrete footer inspection passed.',
      createdBy: DEV_FOREMAN_USER_ID,
    },
  });
  await prisma.dailyReport.upsert({
    where: { id: DEV_DAILY_REPORT_2_ID },
    update: {},
    create: {
      id: DEV_DAILY_REPORT_2_ID,
      tenantId: tenant.id,
      projectId: project.id,
      reportDate: new Date('2026-04-08'),
      weather: { condition: 'Partly Cloudy', temp_f: 68, wind_mph: 12 },
      notes: 'Continued framing east and west walls. Delay: steel delivery arrived 2 hours late. PM coordinated with vendor to expedite remaining materials. Crew worked late to recover schedule.',
      createdBy: DEV_FOREMAN_USER_ID,
    },
  });
  console.log(`✓ Daily reports: 2 reports (Apr 7–8)`);

  // ─── Safety incidents ───────────────────────────────────────────────────────

  await prisma.safetyIncident.upsert({
    where: { id: DEV_SAFETY_INCIDENT_1_ID },
    update: {},
    create: {
      id: DEV_SAFETY_INCIDENT_1_ID,
      tenantId: tenant.id,
      projectId: project.id,
      incidentDate: new Date('2026-03-20T10:15:00Z'),
      description: 'Worker nearly struck by falling conduit during material staging. No injuries. Area was not properly barricaded.',
      severity: 'near_miss',
      status: 'closed',
      createdBy: DEV_FOREMAN_USER_ID,
    },
  });
  await prisma.safetyIncident.upsert({
    where: { id: DEV_SAFETY_INCIDENT_2_ID },
    update: {},
    create: {
      id: DEV_SAFETY_INCIDENT_2_ID,
      tenantId: tenant.id,
      projectId: project.id,
      incidentDate: new Date('2026-04-05T14:30:00Z'),
      description: 'Worker sustained minor laceration on right hand while handling metal stud framing without cut-resistant gloves. Wound cleaned and bandaged on site. No medical treatment required.',
      severity: 'first_aid',
      status: 'open',
      createdBy: DEV_FOREMAN_USER_ID,
    },
  });
  console.log(`✓ Safety incidents: near_miss (closed) + first_aid (open)`);

  // ─── Budget line items ──────────────────────────────────────────────────────

  await prisma.budgetLineItem.upsert({
    where: { id: DEV_BUDGET_LINE_1_ID },
    update: {},
    create: {
      id: DEV_BUDGET_LINE_1_ID,
      tenantId: tenant.id,
      projectId: project.id,
      costCodeId: DEV_COST_CODE_LABOR_ID,
      description: 'General Labor — All Phases',
      budgetCents: 7500000,   // $75,000
      actualCents: 340000,    // $3,400 to date
      createdBy: user.id,
    },
  });
  await prisma.budgetLineItem.upsert({
    where: { id: DEV_BUDGET_LINE_2_ID },
    update: {},
    create: {
      id: DEV_BUDGET_LINE_2_ID,
      tenantId: tenant.id,
      projectId: project.id,
      costCodeId: DEV_COST_CODE_MATERIALS_ID,
      description: 'Structural Steel & Concrete Materials',
      budgetCents: 12000000,  // $120,000
      actualCents: 4850000,   // $48,500 to date
      createdBy: user.id,
    },
  });
  await prisma.budgetLineItem.upsert({
    where: { id: DEV_BUDGET_LINE_3_ID },
    update: {},
    create: {
      id: DEV_BUDGET_LINE_3_ID,
      tenantId: tenant.id,
      projectId: project.id,
      costCodeId: DEV_COST_CODE_EQUIPMENT_ID,
      description: 'Heavy Equipment Rental — Crane & Excavator',
      budgetCents: 4500000,   // $45,000
      actualCents: 1200000,   // $12,000 to date
      createdBy: user.id,
    },
  });
  console.log(`✓ Budget: Labor $75k, Materials $120k, Equipment $45k`);

  // ─── Vendor + contract ──────────────────────────────────────────────────────

  await prisma.vendor.upsert({
    where: { id: DEV_VENDOR_ID },
    update: {},
    create: {
      id: DEV_VENDOR_ID,
      tenantId: tenant.id,
      name: 'Austin Electric LLC',
      vendorType: 'subcontractor',
      tradeType: 'electrical',
      contactName: 'Sarah Johnson',
      contactEmail: 'sarah@austinelectric.dev',
      contactPhone: '512-555-0142',
      isPreferred: true,
      isPrequalified: true,
      createdBy: user.id,
    },
  });
  await prisma.contract.upsert({
    where: { id: DEV_CONTRACT_ID },
    update: {},
    create: {
      id: DEV_CONTRACT_ID,
      tenantId: tenant.id,
      projectId: project.id,
      contractType: 'subcontract',
      vendorId: DEV_VENDOR_ID,
      originalValueCents: 8500000,  // $85,000
      approvedCoValueCents: 0,
      status: 'executed',
      retainagePct: 10.0,
      executedAt: new Date('2026-01-20T09:00:00Z'),
      createdBy: user.id,
    },
  });
  console.log(`✓ Vendor: Austin Electric LLC + subcontract $85k (executed, 10% retainage)`);

  // ─── Bid package + takeoff items ─────────────────────────────────────────────

  await prisma.bidPackage.upsert({
    where: { id: DEV_BID_PACKAGE_ID },
    update: {},
    create: {
      id: DEV_BID_PACKAGE_ID,
      tenantId: tenant.id,
      projectId: project.id,
      title: 'Electrical Rough-In Package',
      status: 'awarded',
      dueDate: new Date('2026-01-10'),
      scheduleTaskId: DEV_SCHEDULE_TASK_4_ID,
      createdBy: user.id,
    },
  });
  await prisma.takeoffItem.upsert({
    where: { id: DEV_TAKEOFF_1_ID },
    update: {},
    create: {
      id: DEV_TAKEOFF_1_ID,
      tenantId: tenant.id,
      projectId: project.id,
      bidPackageId: DEV_BID_PACKAGE_ID,
      description: 'EMT Conduit 3/4"',
      quantity: 1200,
      unit: 'LF',
      unitCostCents: 350,     // $3.50/LF
      createdBy: user.id,
    },
  });
  await prisma.takeoffItem.upsert({
    where: { id: DEV_TAKEOFF_2_ID },
    update: {},
    create: {
      id: DEV_TAKEOFF_2_ID,
      tenantId: tenant.id,
      projectId: project.id,
      bidPackageId: DEV_BID_PACKAGE_ID,
      description: 'THWN-2 Wire #12 AWG',
      quantity: 4800,
      unit: 'LF',
      unitCostCents: 65,      // $0.65/LF
      createdBy: user.id,
    },
  });
  await prisma.takeoffItem.upsert({
    where: { id: DEV_TAKEOFF_3_ID },
    update: {},
    create: {
      id: DEV_TAKEOFF_3_ID,
      tenantId: tenant.id,
      projectId: project.id,
      bidPackageId: DEV_BID_PACKAGE_ID,
      description: '200A Main Breaker Panel',
      quantity: 1,
      unit: 'EA',
      unitCostCents: 185000,  // $1,850
      createdBy: user.id,
    },
  });
  console.log(`✓ Bid package: Electrical Rough-In (awarded) + 3 takeoff items`);

  // ─── Electrical panel + circuits ─────────────────────────────────────────────

  await prisma.electricalPanel.upsert({
    where: { id: DEV_PANEL_ID },
    update: {},
    create: {
      id: DEV_PANEL_ID,
      tenantId: tenant.id,
      projectId: project.id,
      name: 'Main Distribution Panel',
      amperage: 200,
      voltage: 240,
      location: 'Electrical Room — Ground Floor',
      createdBy: user.id,
    },
  });
  await prisma.electricalCircuit.upsert({
    where: { id: DEV_CIRCUIT_1_ID },
    update: {},
    create: {
      id: DEV_CIRCUIT_1_ID,
      tenantId: tenant.id,
      panelId: DEV_PANEL_ID,
      circuitNumber: 1,
      description: 'General Receptacles — Office Suite A',
      amperage: 20,
      status: 'planned',
      createdBy: user.id,
    },
  });
  await prisma.electricalCircuit.upsert({
    where: { id: DEV_CIRCUIT_2_ID },
    update: {},
    create: {
      id: DEV_CIRCUIT_2_ID,
      tenantId: tenant.id,
      panelId: DEV_PANEL_ID,
      circuitNumber: 3,
      description: 'Lighting — Open Floor Plan',
      amperage: 20,
      status: 'planned',
      createdBy: user.id,
    },
  });
  console.log(`✓ Electrical: 200A/240V panel + 2 circuits (planned)`);

  // ─── Plumbing system + fixtures ───────────────────────────────────────────────

  await prisma.plumbingSystem.upsert({
    where: { id: DEV_PLUMBING_SYSTEM_ID },
    update: {},
    create: {
      id: DEV_PLUMBING_SYSTEM_ID,
      tenantId: tenant.id,
      projectId: project.id,
      name: 'Domestic Water Supply',
      systemType: 'supply',
      notes: '3/4" copper main with 1/2" branch lines to restrooms and breakroom',
      createdBy: user.id,
    },
  });
  await prisma.plumbingFixture.upsert({
    where: { id: DEV_PLUMBING_FIXTURE_1_ID },
    update: {},
    create: {
      id: DEV_PLUMBING_FIXTURE_1_ID,
      tenantId: tenant.id,
      systemId: DEV_PLUMBING_SYSTEM_ID,
      fixtureType: 'toilet',
      location: "Men's Restroom — Stall 1",
      status: 'planned',
      createdBy: user.id,
    },
  });
  await prisma.plumbingFixture.upsert({
    where: { id: DEV_PLUMBING_FIXTURE_2_ID },
    update: {},
    create: {
      id: DEV_PLUMBING_FIXTURE_2_ID,
      tenantId: tenant.id,
      systemId: DEV_PLUMBING_SYSTEM_ID,
      fixtureType: 'sink',
      location: 'Breakroom',
      status: 'planned',
      createdBy: user.id,
    },
  });
  console.log(`✓ Plumbing: domestic supply system + 2 fixtures (planned)`);

  // ─── Blueprint analysis + 10 proposed tasks ───────────────────────────────────

  await prisma.blueprintAnalysis.upsert({
    where: { id: DEV_BLUEPRINT_ANALYSIS_ID },
    update: {},
    create: {
      id: DEV_BLUEPRINT_ANALYSIS_ID,
      tenantId: tenant.id,
      projectId: project.id,
      buildingType: 'commercial',
      status: 'review_ready',
      extractedTaskCount: PROPOSED_TASKS.length,
      importMetadata: {
        trades_found: ['general', 'concrete', 'structural', 'roofing', 'electrical', 'plumbing', 'hvac', 'drywall', 'finishes'],
        phases_found: ['site_prep', 'foundation', 'framing', 'roofing', 'rough_in', 'drywall', 'finishes_interior'],
        task_count: PROPOSED_TASKS.length,
        source: 'template',
      },
      createdBy: user.id,
    },
  });

  for (const task of PROPOSED_TASKS) {
    await prisma.blueprintProposedTask.upsert({
      where: { id: task.id },
      update: {},
      create: {
        id: task.id,
        tenantId: tenant.id,
        analysisId: DEV_BLUEPRINT_ANALYSIS_ID,
        title: task.title,
        tradeType: task.tradeType,
        phase: task.phase,
        csiDivision: task.csiDivision,
        estimatedDurationDays: task.estimatedDurationDays,
        sortOrder: task.sortOrder,
        reviewStatus: 'pending',
      },
    });
  }
  console.log(`✓ Blueprint analysis: commercial template (review_ready) + ${PROPOSED_TASKS.length} proposed tasks`);

  // ─── Electrical permit ─────────────────────────────────────────────────────

  await prisma.permit.upsert({
    where: { id: DEV_PERMIT_ID },
    update: {},
    create: {
      id: DEV_PERMIT_ID,
      tenantId: tenant.id,
      projectId: project.id,
      permitType: 'electrical',
      buildingType: 'commercial',
      stateCode: 'TX',
      necEdition: '2020',
      ahjName: 'Austin Building & Development Services',
      ahjPhone: '512-978-4000',
      permitNumber: 'E-2026-00123',
      status: 'active',
      appliedDate: new Date('2026-01-15'),
      approvedDate: new Date('2026-02-01'),
      expiryDate: new Date('2027-02-01'),
      createdBy: user.id,
    },
  });
  console.log(`✓ Permit: E-2026-00123 (electrical, TX 2020 NEC, active)`);

  // ─── Done ──────────────────────────────────────────────────────────────────

  console.log('\nSeed complete. Dev credentials:');
  console.log('  URL:      http://localhost:3001');
  console.log('  Email:    owner@dev.local    / devpassword  (Owner)');
  console.log('  Email:    pm@dev.local        / devpassword  (Project Manager)');
  console.log('  Email:    foreman@dev.local   / devpassword  (Foreman)');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
