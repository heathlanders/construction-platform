// scripts/backfill-task-steps.ts — generate task_steps for existing schedule_tasks (Task Build-Out
// Engine). New imports build steps automatically; this backfills projects created before the engine.
//
//   All tenants:        npx tsx --require dotenv/config src/scripts/backfill-task-steps.ts
//   One project:        npx tsx --require dotenv/config src/scripts/backfill-task-steps.ts <projectId>
//
// Idempotent: buildStepsForProjectTasks soft-deletes prior source='rule_engine' steps before insert.

import { pgPool } from '../lib/db.js';
import { withTenantContext } from '../lib/tenant-context.js';
import { loadReferenceCache } from '../lib/jurisdictions/reference-store.js';
import { buildStepsForProjectTasks, type BuildoutTaskRow } from '../services/task-steps.js';

const projectArg = process.argv[2];

// projects is RLS-protected — discover per tenant inside withTenantContext (tenants has no RLS).
async function projectsToProcess(): Promise<{ tenant_id: string; project_id: string }[]> {
  const { rows: tenants } = await pgPool.query<{ id: string }>(`SELECT id FROM tenants WHERE deleted_at IS NULL`);
  const out: { tenant_id: string; project_id: string }[] = [];
  for (const { id: tenant_id } of tenants) {
    const projects = await withTenantContext(tenant_id, async (client) => {
      const { rows } = await client.query<{ id: string }>(
        `SELECT id FROM projects WHERE deleted_at IS NULL ${projectArg ? 'AND id = $1' : ''}`,
        projectArg ? [projectArg] : [],
      );
      return rows;
    });
    for (const p of projects) out.push({ tenant_id, project_id: p.id });
  }
  return out;
}

async function main(): Promise<void> {
  await loadReferenceCache(pgPool);  // jurisdiction engine cache (loaded at server boot in prod)
  const projects = await projectsToProcess();
  let totalSteps = 0;
  for (const { tenant_id, project_id } of projects) {
    const count = await withTenantContext(tenant_id, async (client) => {
      const { rows: tasks } = await client.query(
        `SELECT st.id, st.title, st.description,
                COALESCE(st.trade_type, bpt.trade_type)     AS trade_type,
                COALESCE(st.phase, bpt.phase)               AS phase,
                COALESCE(st.csi_division, bpt.csi_division) AS csi_division
         FROM schedule_tasks st
         LEFT JOIN blueprint_proposed_tasks bpt ON bpt.schedule_task_id = st.id
         WHERE st.project_id = $1 AND st.deleted_at IS NULL`,
        [project_id],
      );
      const { rows: ba } = await client.query(
        `SELECT id FROM blueprint_analyses WHERE project_id = $1 AND deleted_at IS NULL ORDER BY created_at DESC LIMIT 1`,
        [project_id],
      );
      const taskRows: BuildoutTaskRow[] = tasks.map((t: BuildoutTaskRow) => ({
        id: t.id, trade_type: t.trade_type, phase: t.phase, csi_division: t.csi_division, title: t.title, description: t.description,
      }));
      return buildStepsForProjectTasks(client, tenant_id, project_id, taskRows, ba[0]?.id ?? null);
    });
    totalSteps += count;
    console.info(`project ${project_id}: ${count} steps`);
  }
  console.info(`Done. ${projects.length} project(s), ${totalSteps} steps built.`);
  await pgPool.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
