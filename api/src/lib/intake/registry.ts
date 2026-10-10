// intake/registry.ts — the trade intake modules the platform ships.
//
// Invariant 6 (T-65): the trades a client may request = the tenant's enabled offerings ∩ this registry
// (∩ capabilities.priced). Adding a trade = add a module file + register it here + its catalog rows —
// see docs/Client_Visualizer_v1_0.md "How to add a trade". Guard tests: api/src/test/intake-registry.test.ts.

import { normalizeTradeKey } from '../trades/taxonomy.js';
import type { TradeIntakeModule } from './types.js';
import { concreteFlatwork } from './trades/concrete_flatwork.js';

const MODULES: readonly TradeIntakeModule[] = [
  concreteFlatwork,
];

export const INTAKE_REGISTRY: ReadonlyMap<string, TradeIntakeModule> = new Map(MODULES.map((m) => [m.trade_key, m]));

/** Module for a trade key or alias, or null when the trade has no intake module yet. */
export function getIntakeModule(trade: string | null | undefined): TradeIntakeModule | null {
  const key = normalizeTradeKey(trade);
  return key ? INTAKE_REGISTRY.get(key) ?? null : null;
}

export function listIntakeModules(): TradeIntakeModule[] {
  return [...INTAKE_REGISTRY.values()];
}

/** Which of a tenant's enabled trade keys are actually offerable to a client. */
export function offerableTrades(enabledKeys: readonly string[]): TradeIntakeModule[] {
  const seen = new Set<string>();
  const out: TradeIntakeModule[] = [];
  for (const k of enabledKeys) {
    const m = getIntakeModule(k);
    if (m && m.capabilities.priced && !seen.has(m.trade_key)) {
      seen.add(m.trade_key);
      out.push(m);
    }
  }
  return out;
}
