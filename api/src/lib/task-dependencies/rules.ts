// lib/task-dependencies/rules.ts — deterministic prerequisite engine
//
// Pure functions (no DB / no I/O) so they are trivially unit-testable.
//
// Model — "parallel trade lanes + phase gate + convergence", guaranteed acyclic by construction:
//   1. Phases are ordered by PHASE_ORDER; unphased tasks bucket last.
//   2. Within a phase, tasks are split into per-trade "lanes" and chained in sort_order WITHIN a
//      lane only — different trades in the same phase run in PARALLEL (e.g. electrical, plumbing,
//      and HVAC rough-in are concurrent, not one 9-task serial chain). This is what keeps the
//      critical path realistic instead of "every task in series".
//   3. Phase gate: every previous-phase lane-tail gates every current-phase lane-head, so a phase
//      cannot start any trade until all of the prior phase is done (full cross-phase reachability).
//   4. Convergence rules add the few domain edges the lanes miss — e.g. EVERY MEP rough-in feeds
//      the "MEP rough-in inspection", not just the last one in sort order.
//
// All edges point strictly forward in (phaseRank, indexWithinPhase); a defensive
// isForward() guard drops any candidate edge that would point backward, so bad
// template data can never introduce a cycle.

import { PHASE_ORDER } from '../blueprint-templates/types.js';
import { normalizeTradeKey } from '../trades/taxonomy.js';
import { packFor } from '../trades/packs/runtime.js';
import { tradeToPermitTrade } from '../jurisdictions/trade-map.js';
import type { DepTask, DepEdge } from './types.js';

const UNPHASED = '_unphased';

/** Convergence rules: every source task in `fromPhase` matching `sourceMatch` depends-into
 *  the single target task in `toPhase` whose title matches `targetMatch`. */
interface ConvergenceRule {
  fromPhase: string;
  sourceMatch: (t: DepTask) => boolean;
  toPhase: string;
  targetMatch: RegExp;
}

const CONVERGENCE_RULES: ConvergenceRule[] = [
  // Each MEP rough-in must pass the MEP rough-in inspection before insulation/drywall.
  // Matched by PERMIT-TRADE FAMILY (T-64) so finer taxonomy trades (fire_sprinkler, fire_alarm,
  // low_voltage, ductwork, controls_bms, …) converge too — not just the 3 legacy umbrella keys.
  {
    fromPhase: 'rough_in',
    sourceMatch: (t) =>
      ['electrical', 'plumbing', 'mechanical'].includes(tradeToPermitTrade(t.trade_type) ?? ''),
    toPhase: 'inspections',
    targetMatch: /mep rough.?in inspection/i,
  },
  // All framing feeds the framing rough-in inspection.
  {
    fromPhase: 'framing',
    sourceMatch: () => true,
    toPhase: 'inspections',
    targetMatch: /framing.*inspection/i,
  },
];

// ─── ordering helpers ──────────────────────────────────────────────────────────

function phaseKey(phase: string | null): string {
  if (phase && (PHASE_ORDER as string[]).includes(phase)) return phase;
  return UNPHASED;
}

/** Build the ordered list of phases actually present (real phases in PHASE_ORDER, then unphased). */
function presentPhases(tasks: DepTask[]): string[] {
  const present = new Set(tasks.map((t) => phaseKey(t.phase)));
  const ordered = (PHASE_ORDER as string[]).filter((p) => present.has(p));
  if (present.has(UNPHASED)) ordered.push(UNPHASED);
  return ordered;
}

function sortInPhase(a: DepTask, b: DepTask): number {
  const sa = a.sort_order ?? Number.MAX_SAFE_INTEGER;
  const sb = b.sort_order ?? Number.MAX_SAFE_INTEGER;
  if (sa !== sb) return sa - sb;
  return a.title.localeCompare(b.title);
}

/** Map task id → numeric order key (phaseRank * 1e6 + indexWithinPhase). Strictly increasing
 *  along the schedule, so edge a→b is "forward" iff orderKey(b) > orderKey(a). */
function buildOrderKeys(tasks: DepTask[]): Map<string, number> {
  const phases = presentPhases(tasks);
  const phaseRank = new Map(phases.map((p, i) => [p, i]));
  const byPhase = new Map<string, DepTask[]>();
  for (const t of tasks) {
    const p = phaseKey(t.phase);
    (byPhase.get(p) ?? byPhase.set(p, []).get(p)!).push(t);
  }
  const keys = new Map<string, number>();
  for (const [p, group] of byPhase) {
    group.sort(sortInPhase);
    const rank = phaseRank.get(p) ?? phases.length;
    group.forEach((t, idx) => keys.set(t.id, rank * 1_000_000 + idx));
  }
  return keys;
}

// ─── public API ──────────────────────────────────────────────────────────────

/** True iff an edge pred→succ points strictly forward in schedule order. */
export function isForward(predId: string, succId: string, orderKeys: Map<string, number>): boolean {
  if (predId === succId) return false;
  const a = orderKeys.get(predId);
  const b = orderKeys.get(succId);
  if (a === undefined || b === undefined) return false;
  return b > a;
}

/** Compute the full prerequisite edge set for a task list. Deterministic + acyclic. */
export function computeDependencies(tasks: DepTask[]): DepEdge[] {
  if (tasks.length < 2) return [];
  const orderKeys = buildOrderKeys(tasks);

  // Group + sort by phase
  const phases = presentPhases(tasks);
  const byPhase = new Map<string, DepTask[]>();
  for (const t of tasks) {
    const p = phaseKey(t.phase);
    (byPhase.get(p) ?? byPhase.set(p, []).get(p)!).push(t);
  }
  for (const group of byPhase.values()) group.sort(sortInPhase);

  const seen = new Set<string>();
  const edges: DepEdge[] = [];
  const add = (predId: string, succId: string): void => {
    if (!isForward(predId, succId, orderKeys)) return;
    const key = `${predId}->${succId}`;
    if (seen.has(key)) return;
    seen.add(key);
    edges.push({ predecessor_id: predId, successor_id: succId, type: 'finish_to_start' });
  };

  // 1 + 2 + 3: per-trade lanes (parallel within a phase) + phase gate between phases.
  // Within a phase, tasks of the SAME trade chain in sort_order; different trades run in
  // parallel. Every previous-phase lane-tail gates every current-phase lane-head, so a phase
  // waits on all prior work while trades inside it stay concurrent — a realistic critical path
  // instead of a single 1-task-at-a-time line.
  const laneKey = (t: DepTask): string => String(t.trade_type ?? '_notrade');
  let prevTails: string[] = [];
  for (const p of phases) {
    const group = byPhase.get(p)!; // already sorted by sortInPhase
    if (group.length === 0) continue;
    const lanes = new Map<string, DepTask[]>();
    for (const t of group) (lanes.get(laneKey(t)) ?? lanes.set(laneKey(t), []).get(laneKey(t))!).push(t);
    const tails: string[] = [];
    for (const key of [...lanes.keys()].sort()) {        // deterministic lane order
      const lane = lanes.get(key)!;
      for (const pt of prevTails) add(pt, lane[0].id);   // phase gate: prior phase → this lane head
      for (let i = 1; i < lane.length; i++) add(lane[i - 1].id, lane[i].id); // intra-lane chain
      tails.push(lane[lane.length - 1].id);
    }
    prevTails = tails;                                   // each lane's tail gates the next phase
  }

  // 4: convergence rules (every matching source → the named inspection/gateway task)
  for (const rule of CONVERGENCE_RULES) {
    const target = (byPhase.get(rule.toPhase) ?? []).find((t) => rule.targetMatch.test(t.title));
    if (!target) continue;
    for (const src of byPhase.get(rule.fromPhase) ?? []) {
      if (rule.sourceMatch(src)) add(src.id, target.id);
    }
  }

  // 5: Trade Knowledge Pack dependency hints (Doc 23 §5). `after_trades`: every task of those trades
  // precedes this trade's tasks; `before_phase`: this trade's tasks precede the first task of that
  // phase. `add` keeps only forward edges, so hints can never create a cycle.
  const byTrade = new Map<string, DepTask[]>();
  for (const t of tasks) {
    const k = normalizeTradeKey(t.trade_type);
    if (k) (byTrade.get(k) ?? byTrade.set(k, []).get(k)!).push(t);
  }
  for (const [key, own] of byTrade) {
    for (const hint of packFor(key)?.dependency_hints ?? []) {
      for (const before of hint.after_trades ?? []) {
        const k = normalizeTradeKey(before);
        for (const pred of (k && byTrade.get(k)) || []) for (const t of own) add(pred.id, t.id);
      }
      if (hint.before_phase) {
        const first = (byPhase.get(hint.before_phase) ?? [])[0];
        if (first) for (const t of own) add(t.id, first.id);
      }
    }
  }

  return edges;
}

/** Pick one "primary" predecessor per successor — the most immediate (latest in schedule
 *  order). Used to backfill the legacy single-FK schedule_tasks.predecessor_task_id. */
export function computePrimaryPredecessors(
  tasks: DepTask[],
  edges: DepEdge[],
): Map<string, string> {
  const orderKeys = buildOrderKeys(tasks);
  const primary = new Map<string, string>();
  const bestKey = new Map<string, number>();
  for (const e of edges) {
    const k = orderKeys.get(e.predecessor_id) ?? -1;
    if (k > (bestKey.get(e.successor_id) ?? -Infinity)) {
      bestKey.set(e.successor_id, k);
      primary.set(e.successor_id, e.predecessor_id);
    }
  }
  return primary;
}

/** Would adding pred→succ to `edges` create a cycle? (i.e. is `pred` already reachable
 *  from `succ`?) Used by the manual POST endpoint before inserting a user edge. */
export function wouldCreateCycle(edges: DepEdge[], predId: string, succId: string): boolean {
  if (predId === succId) return true;
  const adj = new Map<string, string[]>();
  for (const e of edges) {
    (adj.get(e.predecessor_id) ?? adj.set(e.predecessor_id, []).get(e.predecessor_id)!).push(
      e.successor_id,
    );
  }
  // DFS from succ; if we reach pred, the new edge pred→succ closes a loop.
  const stack = [succId];
  const visited = new Set<string>();
  while (stack.length) {
    const node = stack.pop()!;
    if (node === predId) return true;
    if (visited.has(node)) continue;
    visited.add(node);
    for (const next of adj.get(node) ?? []) stack.push(next);
  }
  return false;
}
