// studio/metering.ts — AI usage metering + caps (invariant 4: all AI spend metered).
//
// Every provider call writes one append-only ai_usage_events row (ok / failed / blocked) inside the
// caller's tenant context. Caps are env-tunable and conservative until tier pricing is decided:
//   renders: STUDIO_MAX_RENDERS_PER_{SCOPE (6), USER_DAY (20), TENANT_MONTH (200)}
//   assistant: STUDIO_MAX_AI_CALLS_PER_{SCOPE (20), USER_DAY (60), TENANT_MONTH (1000)}
// Scope caps alone are not enough — a client can open new requests/scopes — so every feature also
// has a per-user and per-tenant cap.
// Failed/blocked calls count toward caps (they still cost us / signal abuse).

import type { PoolClient } from 'pg';
import { redis } from '../redis.js';

/** In-flight reservation TTL — longer than any LLM timeout, short enough to self-heal. */
const INFLIGHT_TTL_SECONDS = 600;

export type AiFeature = 'studio.render' | 'studio.assess' | 'studio.guide';

const num = (k: string, d: number) => {
  const n = Number(process.env[k]);
  return Number.isFinite(n) && n >= 0 ? n : d;
};
export const studioCaps = () => ({
  rendersPerScope: num('STUDIO_MAX_RENDERS_PER_SCOPE', 6),
  rendersPerUserDay: num('STUDIO_MAX_RENDERS_PER_USER_DAY', 20),
  rendersPerTenantMonth: num('STUDIO_MAX_RENDERS_PER_TENANT_MONTH', 200),
  aiCallsPerScope: num('STUDIO_MAX_AI_CALLS_PER_SCOPE', 20),
  aiCallsPerUserDay: num('STUDIO_MAX_AI_CALLS_PER_USER_DAY', 60),
  aiCallsPerTenantMonth: num('STUDIO_MAX_AI_CALLS_PER_TENANT_MONTH', 1000),
});

export async function recordUsage(client: PoolClient, e: {
  tenantId: string; userId: string | null; feature: AiFeature; provider: string; model?: string | null;
  units?: number; unitKind?: 'call' | 'image' | 'token'; costMicroUsd?: number;
  subjectType?: string; subjectId?: string; status: 'ok' | 'failed' | 'blocked';
}): Promise<string> {
  const { rows } = await client.query<{ id: string }>(
    `INSERT INTO ai_usage_events
       (tenant_id, user_id, feature, provider, model, units, unit_kind, cost_micro_usd, subject_type, subject_id, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id`,
    [e.tenantId, e.userId, e.feature, e.provider, e.model ?? null, e.units ?? 1, e.unitKind ?? 'call',
      Math.max(0, Math.round(e.costMicroUsd ?? 0)), e.subjectType ?? null, e.subjectId ?? null, e.status],
  );
  return rows[0]!.id;
}

export type StudioCapCode =
  | 'RENDER_CAP_REACHED' | 'USER_RENDER_CAP_REACHED' | 'TENANT_RENDER_CAP_REACHED'
  | 'AI_CAP_REACHED' | 'USER_AI_CAP_REACHED' | 'TENANT_AI_CAP_REACHED';

export class StudioCapError extends Error {
  constructor(public code: StudioCapCode, message: string) { super(message); }
}

const count = async (client: PoolClient, sql: string, params: unknown[]): Promise<number> =>
  (await client.query<{ n: number }>(sql, params)).rows[0]?.n ?? 0;

/**
 * Render caps — per scope, per user/day, per tenant/month. The design_renders row (inserted by the
 * caller in the SAME transaction, at request time) IS the reservation, so counting design_renders
 * rather than ai_usage_events (written only when a render finishes) sees queued/running renders too.
 * A per-tenant transaction advisory lock serializes check → insert, so parallel requests can't all
 * pass the same count. The lock is held until the caller's transaction commits.
 */
export async function assertRenderCaps(client: PoolClient, tenantId: string, userId: string, scopeId: string): Promise<void> {
  const caps = studioCaps();
  await client.query(`SELECT pg_advisory_xact_lock(hashtext('studio.render:' || $1::text))`, [tenantId]);
  if (await count(client, `SELECT COUNT(*)::int AS n FROM design_renders WHERE scope_id = $1`, [scopeId]) >= caps.rendersPerScope) {
    throw new StudioCapError('RENDER_CAP_REACHED', `Up to ${caps.rendersPerScope} pictures per project.`);
  }
  if (await count(client, `SELECT COUNT(*)::int AS n FROM design_renders WHERE created_by = $1 AND created_at >= NOW() - INTERVAL '1 day'`, [userId]) >= caps.rendersPerUserDay) {
    throw new StudioCapError('USER_RENDER_CAP_REACHED', 'Picture limit reached for today — try again tomorrow.');
  }
  if (await count(client, `SELECT COUNT(*)::int AS n FROM design_renders WHERE created_at >= date_trunc('month', NOW())`, []) >= caps.rendersPerTenantMonth) {
    throw new StudioCapError('TENANT_RENDER_CAP_REACHED', 'Picture limit reached for this month.');
  }
}

/**
 * Assistant (assess/guide) caps — per scope, per user/day, per tenant/month. The model call runs
 * between two transactions, so the usage row lands only AFTER the call; an atomic Redis in-flight
 * counter per bucket closes the gap (INCR first, then compare committed + in-flight against the cap).
 * Returns a release function the caller MUST run (finally) after its metering transaction commits.
 * Counting committed rows before the DECR only over-counts briefly — the conservative direction.
 */
export async function reserveAiCall(
  client: PoolClient, tenantId: string, userId: string, scopeId: string,
): Promise<() => Promise<void>> {
  const caps = studioCaps();
  const AI = `feature IN ('studio.assess','studio.guide')`;
  const buckets: { key: string; cap: number; code: StudioCapCode; message: string; sql: string; params: unknown[] }[] = [
    { key: `studio:ai_inflight:scope:${scopeId}`, cap: caps.aiCallsPerScope, code: 'AI_CAP_REACHED',
      message: 'Assistant limit reached for this project.',
      sql: `SELECT COUNT(*)::int AS n FROM ai_usage_events WHERE subject_type = 'design_scope' AND subject_id = $1 AND ${AI}`, params: [scopeId] },
    { key: `studio:ai_inflight:user:${userId}`, cap: caps.aiCallsPerUserDay, code: 'USER_AI_CAP_REACHED',
      message: 'Assistant limit reached for today — try again tomorrow.',
      sql: `SELECT COUNT(*)::int AS n FROM ai_usage_events WHERE user_id = $1 AND ${AI} AND created_at >= NOW() - INTERVAL '1 day'`, params: [userId] },
    { key: `studio:ai_inflight:tenant:${tenantId}`, cap: caps.aiCallsPerTenantMonth, code: 'TENANT_AI_CAP_REACHED',
      message: 'Assistant limit reached for this month.',
      sql: `SELECT COUNT(*)::int AS n FROM ai_usage_events WHERE ${AI} AND created_at >= date_trunc('month', NOW())`, params: [] },
  ];
  const taken: string[] = [];
  const release = async () => {
    for (const k of taken.splice(0)) await redis.decr(k).catch(() => undefined);
  };
  try {
    for (const b of buckets) {
      const inflight = await redis.incr(b.key);
      taken.push(b.key);
      await redis.expire(b.key, INFLIGHT_TTL_SECONDS); // a crashed request can't pin the bucket forever
      if ((await count(client, b.sql, b.params)) + inflight > b.cap) throw new StudioCapError(b.code, b.message);
    }
  } catch (err) {
    await release();
    throw err;
  }
  return release;
}
