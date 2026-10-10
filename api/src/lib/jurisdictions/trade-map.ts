// trade-map.ts — map a schedule-task / blueprint trade_type to a jurisdiction-engine Trade.
//
// The codes engine resolves codes + inspection sequences for FOUR permit trades
// (electrical | plumbing | mechanical | building). Task/blueprint/vendor `trade_type` values are
// finer-grained (hvac, cabinetry, asphalt_paving, …). Since T-64 the collapse is data-driven:
// each entry in the canonical trade taxonomy (lib/trades/taxonomy.ts) carries its `permit_trade`,
// and this function is a thin lookup over it — the same rule encoded in blueprint-worker's
// PERMIT_TRADES, extracted so the task-detail endpoint and the worker agree.
//
//   electrical family (low-voltage, fire alarm, solar, …)   → electrical
//   plumbing family (fire sprinkler, gas, septic, …)        → plumbing
//   hvac/mechanical family (ductwork, controls, TAB, …)     → mechanical
//   structural/envelope/interior/specialty trades           → building (one ICC permit covers them)
//   professional/logistics services (surveying, cleaning …) → null (no AHJ permit path)
//   unknown free-text trade                                 → building (safe default — the
//                                                             build-out engine drops any gating
//                                                             inspection not in the AHJ sequence)
//
// Returns null when no trade is supplied or the trade is a no-permit service trade.

import type { Trade } from './types.js';
import { tradeDef } from '../trades/taxonomy.js';

export function tradeToPermitTrade(trade: string | null | undefined): Trade | null {
  if (!trade || !trade.trim()) return null;
  const def = tradeDef(trade);
  if (def) return def.permit_trade;
  // Unknown free-text trade: inspected under the general building (ICC IRC/IBC) permit.
  return 'building';
}
