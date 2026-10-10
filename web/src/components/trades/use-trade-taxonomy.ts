'use client';

// Shared hook: the canonical trade taxonomy (T-64) from GET /api/v1/trades.
// Consumers: vendors/trade-select.tsx (vendor picker) + tasks/task-detail-panel.tsx (trade
// dropdown). Trade labels are English data (ES = v1.1, like task titles).

import { useEffect, useState } from 'react';

export interface TaxonomyTrade {
  key: string;
  label: string;
  label_es: string;
  category: string;
  csi_division: string;
  default_phase: string;
  permit_trade: string | null;
  legacy: boolean;
  umbrella: boolean;
  aliases: string[];
}

export const TRADE_CATEGORY_ORDER = [
  'sitework', 'concrete_masonry', 'structural', 'envelope', 'electrical_systems',
  'plumbing_systems', 'mechanical_systems', 'interior', 'specialty', 'heavy_civil', 'services',
];

export function useTradeTaxonomy(): TaxonomyTrade[] {
  const [trades, setTrades] = useState<TaxonomyTrade[]>([]);
  useEffect(() => {
    fetch('/api/v1/trades')
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d.trades)) setTrades(d.trades as TaxonomyTrade[]); })
      .catch(() => {});
  }, []);
  return trades;
}

/** Display label for a trade in the active UI language ('es' → label_es, else EN). */
export function tradeDisplayLabel(trade: TaxonomyTrade, language: string): string {
  return language?.startsWith('es') && trade.label_es ? trade.label_es : trade.label;
}

/** Group trades by category, in canonical category order. */
export function groupByCategory(trades: TaxonomyTrade[]): { category: string; trades: TaxonomyTrade[] }[] {
  const groups = new Map<string, TaxonomyTrade[]>();
  for (const tr of trades) {
    if (!groups.has(tr.category)) groups.set(tr.category, []);
    groups.get(tr.category)!.push(tr);
  }
  return TRADE_CATEGORY_ORDER.filter((c) => groups.has(c)).map((c) => ({ category: c, trades: groups.get(c)! }));
}
