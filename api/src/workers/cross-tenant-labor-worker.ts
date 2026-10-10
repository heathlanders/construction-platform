// workers/cross-tenant-labor-worker.ts — nightly labor-summary fan-out (Doc 07 §5 labor_visibility)
//   cross_tenant.labor_summary_scan  — platform-level scan (own scheduled queue, dedicated
//                                      boss.work consumer — the 'jobs' switch never sees
//                                      scheduled queues; mirrors field-cost-worker)
//   cross_tenant.labor_summary       — per-connection job (rides sendJob → 'jobs' switch);
//                                      envelope tenant = the SUB (owner of the time_entries, T-10)
//
// Publishes ONE labor.summary event per active connection per day, aggregated from the sub's
// time_entries on its mirror project(s), field-filtered by the connection's labor_visibility
// flags (fail-closed — flags default false; costs NEVER cross, no cents field exists in the
// payload shape). Zero entries → no event, no noise.

import { getQueue, sendJob } from '../lib/queue.js';
import { withTenantContext } from '../lib/tenant-context.js';
import { pgPool } from '../lib/db.js';
import {
  validateConnectionMembership,
  publishIfActive,
  notifyCounterparty,
  buildLaborSummaryPayload,
  laborSummaryAlreadyPublished,
  type LaborSummaryAgg,
} from '../lib/cross-tenant/bridge.js';

export async function startLaborSummaryScanWorker(): Promise<void> {
  const boss = await getQueue();
  await boss.work('cross_tenant.labor_summary_scan', async () => {
    const date = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10); // yesterday UTC
    const { rows } = await pgPool.query<{ id: string; sub_tenant_id: string }>(
      `SELECT id, sub_tenant_id FROM tenant_connections WHERE status = 'active'`,
    );
    for (const c of rows) {
      await sendJob('cross_tenant.labor_summary', c.sub_tenant_id, { connection_id: c.id, date });
    }
    console.info({ count: rows.length, date }, 'cross_tenant.labor_summary_scan: enqueued per-connection jobs');
  });
  console.info('cross-tenant-labor-worker: registered labor_summary_scan worker');
}

export async function handleCrossTenantLaborSummary(
  subTenantId: string,
  payload: Record<string, unknown>,
): Promise<void> {
  const { connection_id, date } = payload as { connection_id: string; date: string };
  if (!connection_id || !date) return;

  const conn = await validateConnectionMembership(connection_id, subTenantId);
  if (!conn || conn.status !== 'active') return; // revoked/completed between scan and run
  const lv = conn.permissions?.labor_visibility;
  // Cheap early-out; the fail-closed labor gate is re-checked inside publishIfActive.
  if (lv?.show_total_hours !== true && lv?.show_crew_names !== true) return;
  if (await laborSummaryAlreadyPublished(connection_id, date)) return; // pg-boss retry dedupe

  const agg = await withTenantContext(subTenantId, async (client): Promise<LaborSummaryAgg | null> => {
    const { rows: mirrors } = await client.query<{ id: string }>(
      `SELECT id FROM projects WHERE connection_id = $1 AND deleted_at IS NULL`,
      [connection_id],
    );
    if (mirrors.length === 0) return null;
    const { rows } = await client.query<{ name: string; hours: string }>(
      `SELECT u.first_name || ' ' || u.last_name AS name, SUM(te.hours_worked)::numeric AS hours
         FROM time_entries te
         JOIN users u ON u.id = te.user_id AND u.deleted_at IS NULL
        WHERE te.project_id = ANY($1) AND te.date = $2 AND te.deleted_at IS NULL
        GROUP BY te.user_id, u.first_name, u.last_name
        ORDER BY name`,
      [mirrors.map((m) => m.id), date],
    );
    if (rows.length === 0) return null; // no field labor that day → no event
    const crew = rows.map((r) => ({ name: r.name, hours: Math.round(parseFloat(r.hours) * 100) / 100 }));
    return {
      date,
      total_hours: Math.round(crew.reduce((s, w) => s + w.hours, 0) * 100) / 100,
      worker_count: crew.length,
      crew,
    };
  });
  if (!agg) return;

  const p = buildLaborSummaryPayload(agg, lv); // field-level filtering — never any *_cents
  const ev = await publishIfActive(connection_id, subTenantId, 'labor.summary', p);
  if (ev) await notifyCounterparty(connection_id, subTenantId, 'labor.summary', p);
}
