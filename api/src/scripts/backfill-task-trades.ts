// scripts/backfill-task-trades.ts — retag existing schedule_tasks onto the T-64 trade taxonomy
// (blueprint trade reclassification, Doc 21). New analyses/imports get the finer trades from the
// templates automatically; this backfills projects imported before the retag.
//
//   Dry run (all tenants):   npx tsx --require dotenv/config src/scripts/backfill-task-trades.ts
//   Dry run (one project):   npx tsx ... src/scripts/backfill-task-trades.ts <projectId>
//   Apply:                   npx tsx ... src/scripts/backfill-task-trades.ts [projectId] --apply
//
// Matching: a schedule_task whose lowercased title EXACTLY equals a template task title gets that
// template's current trade_type (+csi_division) when they differ. The map is built from TEMPLATES
// at runtime — no hand-maintained duplicate. Titles that appear in multiple templates with
// CONFLICTING trades are skipped (ambiguous). After retagging, each touched project gets its work
// steps rebuilt (buildStepsForProjectTasks) and its DAG regenerated (recomputeProjectDependencies)
// — both idempotent, both preserve manual rows/edges.

import { pgPool } from '../lib/db.js';
import { withTenantContext } from '../lib/tenant-context.js';
import { loadReferenceCache } from '../lib/jurisdictions/reference-store.js';
import { buildStepsForProjectTasks, type BuildoutTaskRow } from '../services/task-steps.js';
import { recomputeProjectDependencies } from '../services/task-dependencies.js';
import { getTemplate, BUILDING_TYPES } from '../lib/blueprint-templates/index.js';

const args = process.argv.slice(2);
const apply = args.includes('--apply');
const projectArg = args.find((a) => !a.startsWith('--'));

interface Retag { trade_type: string; csi_division: string }

/** title(lowercased) → {trade, csi} from all 5 templates; conflicting titles dropped. */
function buildTitleMap(): Map<string, Retag> {
  const map = new Map<string, Retag>();
  const conflicts = new Set<string>();
  for (const bt of BUILDING_TYPES) {
    for (const task of getTemplate(bt)) {
      const key = task.title.trim().toLowerCase();
      const existing = map.get(key);
      if (existing && existing.trade_type !== task.trade_type) conflicts.add(key);
      else map.set(key, { trade_type: task.trade_type, csi_division: task.csi_division });
    }
  }
  for (const key of conflicts) map.delete(key);
  if (conflicts.size > 0) console.info(`(${conflicts.size} ambiguous cross-template titles skipped)`);
  return map;
}

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
  await loadReferenceCache(pgPool);
  const titleMap = buildTitleMap();
  const projects = await projectsToProcess();
  let totalRetagged = 0;

  for (const { tenant_id, project_id } of projects) {
    const retagged = await withTenantContext(tenant_id, async (client) => {
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

      const changes: { id: string; title: string; from: string | null; to: Retag }[] = [];
      for (const t of tasks) {
        const target = titleMap.get(String(t.title).trim().toLowerCase());
        if (target && t.trade_type !== target.trade_type) {
          changes.push({ id: t.id, title: t.title, from: t.trade_type, to: target });
        }
      }
      if (changes.length === 0) return 0;

      for (const c of changes) {
        console.info(`  ${apply ? 'RETAG' : 'would retag'} "${c.title}": ${c.from ?? '∅'} → ${c.to.trade_type}`);
        if (apply) {
          // Native cols only (never touches the blueprint snapshot); version bump via trigger.
          await client.query(
            `UPDATE schedule_tasks SET trade_type = $1, csi_division = $2, updated_at = NOW() WHERE id = $3`,
            [c.to.trade_type, c.to.csi_division, c.id],
          );
        }
      }

      if (apply) {
        // Rebuild work steps + DAG from the new trades (idempotent; preserve manual).
        const { rows: fresh } = await client.query(
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
        const stepCount = await buildStepsForProjectTasks(
          client, tenant_id, project_id, fresh as BuildoutTaskRow[], ba[0]?.id ?? null,
        );
        const edgeCount = await recomputeProjectDependencies(
          client, tenant_id, project_id, { userId: null, email: 'backfill-task-trades', role: 'SCRIPT' },
        );
        console.info(`  rebuilt: ${stepCount} steps, ${edgeCount} rule-engine edges`);
      }
      return changes.length;
    });

    if (retagged > 0) console.info(`project ${project_id}: ${retagged} task(s) ${apply ? 'retagged' : 'to retag'}`);
    totalRetagged += retagged;
  }

  console.info(`${apply ? 'Done' : 'Dry run'}. ${projects.length} project(s) scanned, ${totalRetagged} task(s) ${apply ? 'retagged' : 'would be retagged'}.`);
  if (!apply && totalRetagged > 0) console.info('Re-run with --apply to write.');
  await pgPool.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
