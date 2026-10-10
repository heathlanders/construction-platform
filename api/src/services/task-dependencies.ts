// services/task-dependencies.ts — recompute the rule-engine prerequisite edges for a project from
// its CURRENT schedule_tasks (phase/trade/sort_order), preserving any user-authored manual edges.
// The engine itself (lib/task-dependencies/rules.ts) is pure; this layer does the DB load + write.
// Used by blueprint import (fresh tasks) and the recompute-dependencies endpoint (after edits).

import type { PoolClient } from 'pg';
import { computeDependencies, computePrimaryPredecessors } from '../lib/task-dependencies/rules.js';
import type { DepTask } from '../lib/task-dependencies/types.js';
import { writeAuditEntry } from '../lib/audit-log.js';

/**
 * Replace this project's `origin='rule_engine'` dependency edges with a fresh computation from the
 * current schedule_tasks, preserving `origin='manual'` edges. Re-backfills the legacy single-FK
 * `schedule_tasks.predecessor_task_id` (only where NULL — never overwrites a user/edited value,
 * and no version bump). Returns the rule-engine edge count.
 */
export async function recomputeProjectDependencies(
  client: PoolClient,
  tenantId: string,
  projectId: string,
  actor: { userId: string | null; email: string | null; role: string | null },
): Promise<number> {
  // Load live tasks. COALESCE native cols ← blueprint snapshot so pre-0021/0023 rows still resolve.
  const { rows } = await client.query(
    `SELECT st.id, st.title,
            COALESCE(st.trade_type, bpt.trade_type)     AS trade_type,
            COALESCE(st.phase, bpt.phase)               AS phase,
            COALESCE(st.csi_division, bpt.csi_division) AS csi_division,
            COALESCE(st.sort_order, bpt.sort_order)     AS sort_order
     FROM schedule_tasks st
     LEFT JOIN blueprint_proposed_tasks bpt ON bpt.schedule_task_id = st.id
     WHERE st.project_id = $1 AND st.deleted_at IS NULL`,
    [projectId],
  );
  const tasks: DepTask[] = rows.map((t: Record<string, unknown>) => ({
    id: t.id as string,
    title: t.title as string,
    trade_type: (t.trade_type as string) ?? null,
    phase: (t.phase as string) ?? null,
    csi_division: (t.csi_division as string) ?? null,
    sort_order: (t.sort_order as number) ?? null,
  }));

  const edges = computeDependencies(tasks);
  const primary = computePrimaryPredecessors(tasks, edges);

  // Replace prior rule_engine edges (preserve manual).
  await client.query(
    `UPDATE task_dependencies SET deleted_at = NOW()
     WHERE project_id = $1 AND origin = 'rule_engine' AND deleted_at IS NULL`,
    [projectId],
  );
  for (const e of edges) {
    await client.query(
      `INSERT INTO task_dependencies
         (tenant_id, project_id, predecessor_task_id, successor_task_id, dependency_type, origin, created_by)
       VALUES ($1, $2, $3, $4, $5, 'rule_engine', $6)
       ON CONFLICT (tenant_id, predecessor_task_id, successor_task_id)
         WHERE deleted_at IS NULL DO NOTHING`,
      [tenantId, projectId, e.predecessor_id, e.successor_id, e.type, actor.userId],
    );
  }

  // Backfill the legacy single-FK only where unset (no version bump — system maintenance).
  for (const [successorId, predecessorId] of primary) {
    await client.query(
      `UPDATE schedule_tasks SET predecessor_task_id = $2, updated_at = NOW()
       WHERE id = $1 AND predecessor_task_id IS NULL AND deleted_at IS NULL`,
      [successorId, predecessorId],
    );
  }

  await writeAuditEntry(client, {
    tenantId,
    category: 'data',
    action: 'task_dependencies.recomputed',
    actorId: actor.userId ?? undefined,
    actorEmail: actor.email ?? undefined,
    actorRole: actor.role ?? undefined,
    resourceType: 'project',
    resourceId: projectId,
    payload: { edge_count: edges.length, task_count: tasks.length },
  });

  return edges.length;
}
