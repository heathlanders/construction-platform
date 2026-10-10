// scripts/backfill-task-dependencies.ts — regenerate rule-engine prerequisite edges for existing
// projects (e.g. imports that predate the dependency engine, or projects split off another).
//
//   All tenants:  npx tsx --require dotenv/config src/scripts/backfill-task-dependencies.ts
//   One project:  npx tsx --require dotenv/config src/scripts/backfill-task-dependencies.ts <projectId>
//
// Idempotent: recomputeProjectDependencies soft-deletes prior origin='rule_engine' edges (preserves manual).

import { pgPool } from '../lib/db.js';
import { withTenantContext } from '../lib/tenant-context.js';
import { recomputeProjectDependencies } from '../services/task-dependencies.js';

const projectArg = process.argv[2];

async function main(): Promise<void> {
  const { rows: tenants } = await pgPool.query<{ id: string }>(`SELECT id FROM tenants WHERE deleted_at IS NULL`);
  let total = 0;
  for (const { id: tenant_id } of tenants) {
    await withTenantContext(tenant_id, async (client) => {
      const { rows: projects } = await client.query<{ id: string; name: string }>(
        `SELECT id, name FROM projects WHERE deleted_at IS NULL ${projectArg ? 'AND id = $1' : ''}`,
        projectArg ? [projectArg] : [],
      );
      for (const p of projects) {
        const edges = await recomputeProjectDependencies(client, tenant_id, p.id, {
          userId: null, email: 'backfill-script', role: 'system',
        });
        total += edges;
        console.log(`  ${p.name} (${p.id}) -> ${edges} edges`);
      }
    });
  }
  console.log(`Done. ${total} rule-engine edges across all matched projects.`);
  await pgPool.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
