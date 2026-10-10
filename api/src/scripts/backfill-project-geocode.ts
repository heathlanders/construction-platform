// scripts/backfill-project-geocode.ts — geocode existing projects for the Project Map (Doc 20 §1).
//
// Iterates every tenant (RLS via withTenantContext), finds projects with no coordinates
// (latitude IS NULL), and runs them through the same geocode-worker handler used on create —
// Census address geocode → county-centroid fallback → failed. Idempotent: a project already
// geocoded (latitude set) is skipped, so re-runs only pick up new/failed ones.
//
//   Dry-run (default):  npm run backfill:project-geocode
//   Apply:              npm run backfill:project-geocode -- --apply
//
// Polite to the free Census API: a short delay between calls in --apply mode.

import { pgPool } from '../lib/db.js';
import { withTenantContext } from '../lib/tenant-context.js';
import { handleGeocodeProject } from '../workers/geocode-worker.js';

const APPLY = process.argv.includes('--apply');

interface Candidate {
  tenant_id: string;
  project_id: string;
  name: string;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function collectCandidates(): Promise<Candidate[]> {
  const { rows: tenants } = await pgPool.query<{ id: string }>(
    `SELECT id FROM tenants WHERE deleted_at IS NULL`,
  );
  const out: Candidate[] = [];
  for (const t of tenants) {
    const rows = await withTenantContext(t.id, async (client) => {
      const res = await client.query<{ project_id: string; name: string }>(
        `SELECT id AS project_id, name
         FROM projects
         WHERE deleted_at IS NULL AND latitude IS NULL`,
      );
      return res.rows;
    });
    for (const r of rows) {
      out.push({ tenant_id: t.id, project_id: r.project_id, name: r.name });
    }
  }
  return out;
}

async function run(): Promise<void> {
  console.log(`\nProject-geocode backfill — ${APPLY ? 'APPLY (writing)' : 'DRY-RUN (no writes)'}\n`);

  const candidates = await collectCandidates();
  console.log(`Found ${candidates.length} project(s) with no coordinates.\n`);

  if (!APPLY) {
    for (const c of candidates) console.log(`  • ${c.project_id}  "${c.name}"`);
    if (candidates.length > 0) console.log(`\nRe-run with --apply to geocode these.`);
    return;
  }

  let done = 0;
  for (const c of candidates) {
    try {
      await handleGeocodeProject(c.tenant_id, { project_id: c.project_id });
      done++;
    } catch (err) {
      console.warn(`  ✗ ${c.project_id}  geocode failed: ${(err as Error).message}`);
    }
    await sleep(200); // rate-limit courtesy to the Census API
  }
  console.log(`\n✅ Geocoded ${done}/${candidates.length} project(s).`);
}

run()
  .then(() => pgPool.end())
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('backfill failed:', err);
    void pgPool.end();
    process.exit(1);
  });
