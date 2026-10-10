// task-dependencies.test.ts — unit tests for the deterministic prerequisite engine.
// Pure functions, no DB. Feeds the residential single-family template through the engine.

import { describe, it, expect } from 'vitest';
import { residentialSfTasks } from '../lib/blueprint-templates/residential-sf.js';
import {
  computeDependencies,
  computePrimaryPredecessors,
  wouldCreateCycle,
  isForward,
} from '../lib/task-dependencies/rules.js';
import type { DepTask, DepEdge } from '../lib/task-dependencies/types.js';

// Map template tasks → DepTask[] with stable synthetic ids
const tasks: DepTask[] = residentialSfTasks.map((t) => ({
  id: `task-${t.sort_order}`,
  title: t.title,
  trade_type: t.trade_type,
  phase: t.phase,
  csi_division: t.csi_division,
  sort_order: t.sort_order,
}));

const idByTitle = (frag: string): string => {
  const m = tasks.find((t) => t.title.toLowerCase().includes(frag.toLowerCase()));
  if (!m) throw new Error(`no task matching "${frag}"`);
  return m.id;
};

// Is `target` reachable from `start` following edges? (transitive prerequisite check)
function reachable(edges: DepEdge[], start: string, target: string): boolean {
  const adj = new Map<string, string[]>();
  for (const e of edges) (adj.get(e.predecessor_id) ?? adj.set(e.predecessor_id, []).get(e.predecessor_id)!).push(e.successor_id);
  const stack = [start];
  const seen = new Set<string>();
  while (stack.length) {
    const n = stack.pop()!;
    if (n === target) return true;
    if (seen.has(n)) continue;
    seen.add(n);
    for (const x of adj.get(n) ?? []) stack.push(x);
  }
  return false;
}

describe('computeDependencies (residential single-family)', () => {
  const edges = computeDependencies(tasks);

  it('produces a non-empty edge set', () => {
    expect(edges.length).toBeGreaterThan(0);
  });

  it('has no self-edges', () => {
    expect(edges.every((e) => e.predecessor_id !== e.successor_id)).toBe(true);
  });

  it('has no duplicate edges', () => {
    const keys = edges.map((e) => `${e.predecessor_id}->${e.successor_id}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('is acyclic — adding any edge in reverse would be detectable', () => {
    // Every edge must point strictly forward; reverse of a real edge would close a cycle.
    for (const e of edges) {
      expect(wouldCreateCycle(edges, e.successor_id, e.predecessor_id)).toBe(true);
    }
  });

  it('orders foundation work: footings before slab pour', () => {
    expect(reachable(edges, idByTitle('Form & pour footings'), idByTitle('slab-on-grade pour'))).toBe(true);
  });

  it('gates foundation on site prep: footings reachable from grading', () => {
    expect(reachable(edges, idByTitle('Excavation & rough grading'), idByTitle('Form & pour footings'))).toBe(true);
  });

  it('converges every MEP rough-in into the MEP rough-in inspection', () => {
    const inspection = idByTitle('MEP rough-in inspection');
    for (const frag of ['Service entrance & main panel', 'Supply & drain rough-in — bathrooms', 'HVAC ductwork rough-in']) {
      expect(edges.some((e) => e.predecessor_id === idByTitle(frag) && e.successor_id === inspection)).toBe(true);
    }
  });

  it('converges finer taxonomy MEP trades too (T-64 permit-family match)', () => {
    // 'Low-voltage (data, AV, security) rough-in' is trade low_voltage since the retag —
    // permit family electrical → it must still feed the MEP inspection.
    const inspection = idByTitle('MEP rough-in inspection');
    expect(edges.some((e) => e.predecessor_id === idByTitle('Low-voltage') && e.successor_id === inspection)).toBe(true);

    // Synthetic fire_sprinkler task (plumbing family) converges as well.
    const synth: DepTask[] = [
      { id: 'fs-1', title: 'Fire sprinkler rough-in', trade_type: 'fire_sprinkler', phase: 'rough_in', csi_division: null, sort_order: 1 },
      { id: 'insp-1', title: 'MEP rough-in inspection', trade_type: 'general', phase: 'inspections', csi_division: null, sort_order: 1 },
      { id: 'paint-1', title: 'Interior painting', trade_type: 'painting', phase: 'rough_in', csi_division: null, sort_order: 2 },
    ];
    const synthEdges = computeDependencies(synth);
    expect(synthEdges.some((e) => e.predecessor_id === 'fs-1' && e.successor_id === 'insp-1')).toBe(true);
  });

  it('splits finish trades into parallel lanes (painting vs cabinetry vs flooring)', () => {
    const paint = idByTitle('Interior painting');
    const cab = idByTitle('Cabinet & countertop installation');
    const floor = idByTitle('Flooring installation');
    expect(reachable(edges, paint, cab)).toBe(false);
    expect(reachable(edges, cab, paint)).toBe(false);
    // Trade Knowledge Packs (wave 3): carpet / resilient / wood flooring declare after_trades: painting —
    // standard practice, so painting now precedes flooring; flooring never precedes painting.
    expect(reachable(edges, floor, paint)).toBe(false);
  });

  it('pack dependency hints order flooring after painting', () => {
    expect(reachable(edges, idByTitle('Interior painting'), idByTitle('Flooring installation'))).toBe(true);
  });

  it('gates drywall on the rough-in inspection (transitively)', () => {
    expect(reachable(edges, idByTitle('MEP rough-in inspection'), idByTitle('Drywall hang'))).toBe(true);
  });

  it('runs different trades in the same phase in parallel (not one serial chain)', () => {
    // electrical and plumbing rough-in are independent trades — neither should be a
    // prerequisite of the other (they only converge later at the MEP inspection).
    const elec = idByTitle('Branch circuits — bedrooms & living areas'); // electrical, rough_in
    const plumb = idByTitle('Supply & drain rough-in — bathrooms');       // plumbing, rough_in
    expect(reachable(edges, elec, plumb)).toBe(false);
    expect(reachable(edges, plumb, elec)).toBe(false);
  });

  it('critical path is shorter than the total task count (real parallelism)', () => {
    // longest prerequisite chain by node count
    const adj = new Map<string, string[]>();
    for (const e of edges) (adj.get(e.predecessor_id) ?? adj.set(e.predecessor_id, []).get(e.predecessor_id)!).push(e.successor_id);
    const memo = new Map<string, number>();
    const longest = (n: string): number => {
      if (memo.has(n)) return memo.get(n)!;
      let best = 1;
      for (const nx of adj.get(n) ?? []) best = Math.max(best, 1 + longest(nx));
      memo.set(n, best);
      return best;
    };
    let crit = 0;
    for (const t of tasks) crit = Math.max(crit, longest(t.id));
    expect(crit).toBeLessThan(tasks.length); // was === tasks.length when fully serial
  });
});

describe('computePrimaryPredecessors', () => {
  const edges = computeDependencies(tasks);
  const primary = computePrimaryPredecessors(tasks, edges);

  it('gives drywall hang a single most-immediate predecessor (insulation)', () => {
    const pred = primary.get(idByTitle('Drywall hang'));
    expect(pred).toBeDefined();
    const predTask = tasks.find((t) => t.id === pred);
    expect(predTask?.phase).toBe('insulation');
  });

  it('every primary predecessor edge points forward', () => {
    // Reuse the engine's order via a fresh computation is internal; assert via edges set.
    for (const [succ, pred] of primary) {
      expect(edges.some((e) => e.predecessor_id === pred && e.successor_id === succ)).toBe(true);
    }
  });
});

describe('wouldCreateCycle', () => {
  const edges = computeDependencies(tasks);

  it('flags a back-edge from the last phase to the first', () => {
    expect(wouldCreateCycle(edges, idByTitle('certificate of occupancy'), idByTitle('Survey & stake'))).toBe(true);
  });

  it('allows a fresh forward edge', () => {
    // site_prep survey → punch walkthrough: forward, not yet present
    expect(wouldCreateCycle(edges, idByTitle('Survey & stake'), idByTitle('Punch list walkthrough'))).toBe(false);
  });

  it('treats a self edge as a cycle', () => {
    const x = idByTitle('Drywall hang');
    expect(wouldCreateCycle(edges, x, x)).toBe(true);
  });
});

describe('isForward', () => {
  it('respects schedule order', () => {
    const edges = computeDependencies(tasks);
    // Build order keys indirectly: any produced edge is forward by construction
    expect(edges.length).toBeGreaterThan(0);
    // unknown ids are never forward
    const orderKeys = new Map<string, number>([['a', 1], ['b', 2]]);
    expect(isForward('a', 'b', orderKeys)).toBe(true);
    expect(isForward('b', 'a', orderKeys)).toBe(false);
    expect(isForward('a', 'zzz', orderKeys)).toBe(false);
  });
});
