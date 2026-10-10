// seed-e2e-tenant.ts — disposable tenant + one user per role for E2E / manual QA (§C4).
//
//   npx tsx --require dotenv/config src/scripts/seed-e2e-tenant.ts          # create/refresh
//   npx tsx --require dotenv/config src/scripts/seed-e2e-tenant.ts --purge  # delete it
//
// IDEMPOTENT: re-running resets passwords and leaves existing data alone, so a
// Maestro run can assume the accounts exist without fighting over state.
//
// The accounts are deliberately boring and well-known — this tenant is for tests,
// never for a customer. It is isolated from real tenants by RLS like any other.

import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { pgPool } from '../lib/db.js';
import { withTenantContext } from '../lib/tenant-context.js';

const TENANT_SLUG = 'e2e-test';
const TENANT_NAME = 'E2E Test Co';
// From the environment so no working password is committed (the repo is public).
const PASSWORD: string = process.env.E2E_PASSWORD ?? (() => {
  throw new Error('Set E2E_PASSWORD (see mobile/.maestro/README.md)');
})();
const DOMAIN = 'e2e.thejobsite.test';

/** One account per role the mobile app gates on (§A tile manifest). */
const ROLES = [
  'owner', 'project_manager', 'foreman', 'field_tech',
  'safety_officer', 'accountant', 'estimator',
] as const;

async function purge(): Promise<void> {
  const { rows } = await pgPool.query(`SELECT id FROM tenants WHERE slug=$1`, [TENANT_SLUG]);
  if (rows.length === 0) { console.log(`No '${TENANT_SLUG}' tenant — nothing to purge.`); return; }
  const tenantId = rows[0].id as string;

  // Tenant-scoped tables are RLS-protected — every delete runs inside the tenant
  // context (CLAUDE.md rule 1). Child rows first; `tenants` is the platform-scoped anchor.
  await withTenantContext(tenantId, async (client) => {
    // Order matters: inspections reference permits, so permits can't go first.
    for (const table of ['electrical_circuits', 'electrical_panels', 'plumbing_fixtures', 'plumbing_systems',
                         'roofing_qa_records', 'roofing_systems', 'framing_correction_items', 'framing_inspections',
                         'concrete_test_records', 'concrete_pours', 'jsa_records', 'time_entries', 'daily_reports', 'punch_list_items', 'safety_incidents',
                         'inspections', 'permits', 'company_assets', 'projects', 'audit_log', 'users']) {
      await client.query(`DELETE FROM ${table} WHERE tenant_id=$1`, [tenantId]).catch(() => { /* table may not exist */ });
    }
  });
  await pgPool.query(`DELETE FROM tenants WHERE id=$1`, [tenantId]);
  console.log(`Purged tenant '${TENANT_SLUG}' (${tenantId}).`);
}

async function seed(): Promise<void> {
  const passwordHash = await bcrypt.hash(PASSWORD, 12);

  const existing = await pgPool.query(`SELECT id FROM tenants WHERE slug=$1`, [TENANT_SLUG]);
  let tenantId: string;
  if (existing.rows.length > 0) {
    tenantId = existing.rows[0].id as string;
    // Keep it on a tier that exercises the Business+ gates (assets, warranties).
    await pgPool.query(`UPDATE tenants SET tier='business', status='active' WHERE id=$1`, [tenantId]);
    console.log(`Tenant '${TENANT_SLUG}' exists (${tenantId}) — refreshing.`);
  } else {
    tenantId = randomUUID();
    await pgPool.query(
      `INSERT INTO tenants (id,name,slug,tier,status) VALUES ($1,$2,$3,'business','active')`,
      [tenantId, TENANT_NAME, TENANT_SLUG],
    );
    console.log(`Created tenant '${TENANT_SLUG}' (${tenantId}).`);
  }

  // users + projects are RLS-protected — all of it inside the tenant context.
  await withTenantContext(tenantId, async (client) => {
    for (const role of ROLES) {
      const email = `${role}@${DOMAIN}`;
      const found = await client.query(`SELECT id FROM users WHERE tenant_id=$1 AND email=$2`, [tenantId, email]);
      if (found.rows.length > 0) {
        // Reset the password so a stale seed can't fail a run for a silly reason.
        await client.query(
          `UPDATE users SET password_hash=$1, status='active', deleted_at=NULL WHERE id=$2`,
          [passwordHash, found.rows[0].id],
        );
      } else {
        await client.query(
          `INSERT INTO users (id,tenant_id,email,password_hash,first_name,last_name,role,status)
           VALUES ($1,$2,$3,$4,$5,'Test',$6,'active')`,
          [randomUUID(), tenantId, email, passwordHash, role.replace(/_/g, ' '), role],
        );
      }
    }

    // One project so the app has something to land on after login.
    const proj = await client.query(
      `SELECT id FROM projects WHERE tenant_id=$1 AND name=$2 AND deleted_at IS NULL`,
      [tenantId, 'E2E Test Project'],
    );
    let projectId: string = proj.rows[0]?.id as string;
    if (!projectId) {
      projectId = randomUUID();
      await client.query(
        `INSERT INTO projects (id,tenant_id,name,status,address,city,state,zip)
         VALUES ($1,$2,'E2E Test Project','active','1 Test Way','Madison','WI','53703')`,
        [projectId, tenantId],
      );
    }

    // A planned pour, so the concrete QA flow has something to hang tests off.
    const pour = await client.query(
      `SELECT id FROM concrete_pours WHERE tenant_id=$1 AND project_id=$2 AND deleted_at IS NULL`,
      [tenantId, projectId],
    );
    if (pour.rows.length === 0) {
      await client.query(
        `INSERT INTO concrete_pours (id,tenant_id,project_id,pour_type,volume_cy,mix_design,pour_date,status,created_by)
         VALUES ($1,$2,$3,'slab',18.5,'4000 PSI, 3/4" aggregate',CURRENT_DATE,'planned',NULL)`,
        [randomUUID(), tenantId, projectId],
      );
    }

    // A panel + one circuit, so the electrical flow has a status to flip.
    const panel = await client.query(
      `SELECT id FROM electrical_panels WHERE tenant_id=$1 AND project_id=$2 AND deleted_at IS NULL`,
      [tenantId, projectId],
    );
    if (panel.rows.length === 0) {
      const panelId = randomUUID();
      await client.query(
        `INSERT INTO electrical_panels (id,tenant_id,project_id,name,amperage,voltage,location)
         VALUES ($1,$2,$3,'Main Panel',200,240,'Garage')`,
        [panelId, tenantId, projectId],
      );
      await client.query(
        `INSERT INTO electrical_circuits (id,tenant_id,panel_id,circuit_number,description,amperage,status)
         VALUES ($1,$2,$3,12,'Kitchen receptacles',20,'planned')`,
        [randomUUID(), tenantId, panelId],
      );
    }

    // A roof system + a framing inspection, so the structural QA flows have parents.
    const roof = await client.query(
      `SELECT id FROM roofing_systems WHERE tenant_id=$1 AND project_id=$2 AND deleted_at IS NULL`,
      [tenantId, projectId],
    );
    if (roof.rows.length === 0) {
      await client.query(
        `INSERT INTO roofing_systems (id,tenant_id,project_id,roof_type,total_squares,manufacturer,status)
         VALUES ($1,$2,$3,'asphalt_shingle',24.5,'OwensCorning','planned')`,
        [randomUUID(), tenantId, projectId],
      );
    }
    const framing = await client.query(
      `SELECT id FROM framing_inspections WHERE tenant_id=$1 AND project_id=$2 AND deleted_at IS NULL`,
      [tenantId, projectId],
    );
    if (framing.rows.length === 0) {
      await client.query(
        // ⚠️ `section` is enum-constrained by the API (SECTIONS in framing-inspections.ts)
        // but this insert goes straight to the DB, so it skips that check. 'walls' looked
        // fine and rendered as the raw i18n key `section_walls` — a seed can manufacture a
        // state the app can't label. Use a real enum value.
        `INSERT INTO framing_inspections (id,tenant_id,project_id,section,status)
         VALUES ($1,$2,$3,'exterior_walls','pending')`,
        [randomUUID(), tenantId, projectId],
      );
    }

    // An ACTIVE permit + its AHJ milestones, so the offline inspection-result flow has
    // something real to record against. Inserted directly (not through POST /v1/permits)
    // on purpose: the route resolves jurisdiction and auto-generates milestones, which
    // would make the seed depend on reference data being loaded.
    const permit = await client.query(
      `SELECT id FROM permits WHERE tenant_id=$1 AND project_id=$2 AND deleted_at IS NULL`,
      [tenantId, projectId],
    );
    if (permit.rows.length === 0) {
      const permitId = randomUUID();
      await client.query(
        `INSERT INTO permits (id,tenant_id,project_id,permit_type,building_type,state_code,status,permit_number,code_type,code_edition,ahj_name,ahj_level)
         VALUES ($1,$2,$3,'electrical','residential_sf','WI','active','E2E-PERMIT-1','NEC','2020','City of Madison','city')`,
        [permitId, tenantId, projectId],
      );
      const milestones: [string, string, number][] = [
        ['Temporary Power', 'temporary_power', 1],
        ['Rough-In Inspection', 'rough_in', 2],
        ['Final Inspection', 'final', 3],
      ];
      for (const [title, type, order] of milestones) {
        await client.query(
          `INSERT INTO inspections (id,tenant_id,project_id,title,status,permit_id,trade_type,inspection_type,sequence_order)
           VALUES ($1,$2,$3,$4,'scheduled',$5,'electrical',$6,$7)`,
          [randomUUID(), tenantId, projectId, title, permitId, type, order],
        );
      }
    }
  });

  console.log('\nAccounts (all share one password):');
  console.log(`  Company ID : ${TENANT_SLUG}`);
  console.log(`  Password   : ${PASSWORD}`);
  for (const role of ROLES) console.log(`  ${role.padEnd(16)} ${role}@${DOMAIN}`);
}

async function main(): Promise<void> {
  try {
    if (process.argv.includes('--purge')) await purge();
    else await seed();
  } finally {
    await pgPool.end();
  }
}

main().catch((err) => { console.error(err); process.exit(1); });
