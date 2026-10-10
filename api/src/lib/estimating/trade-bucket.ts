// estimating/trade-bucket.ts — taxonomy trade key → estimating catalog bucket (EstTrade).
//
// DEFAULT ONLY: use it to place new seed rows and manual lines. For coded lines the catalog row's own
// trade wins (buildEstimateLines does `q.trade ?? item.trade`) — the taxonomy↔bucket mapping is not
// perfectly consistent historically (e.g. gutters has permit_trade null but B-GUTTER-LF is 'building').
// No-permit trades (permit_trade null) live in 'general', matching migration 0037.

import { tradeDef } from '../trades/taxonomy.js';
import { packFor } from '../trades/packs/runtime.js';
import type { EstTrade } from './types.js';

export function estTradeFor(tradeKey: string | null | undefined): EstTrade {
  // A Trade Knowledge Pack may pin its bucket explicitly (heavy civil → general, Doc 23 §2).
  return packFor(tradeKey)?.est_bucket ?? tradeDef(tradeKey)?.permit_trade ?? 'general';
}
