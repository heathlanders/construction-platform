'use client';

// Trade picker backed by the canonical trade taxonomy (T-64) — GET /api/v1/trades.
// Grouped by category; a "Custom…" option preserves free-text entry for trades the
// taxonomy doesn't cover (unknown values are stored as typed, never rejected).
// Trade labels are English data (ES = v1.1, like task titles); category labels are chrome.

import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { groupByCategory, tradeDisplayLabel, useTradeTaxonomy, type TaxonomyTrade } from '@/components/trades/use-trade-taxonomy';

// Re-export for existing consumers (vendors list page imports the hook from here).
export { useTradeTaxonomy };
export type { TaxonomyTrade };

const CUSTOM = '__custom__';

export function TradeSelect({
  value,
  onChange,
  allowEmpty = true,
  className,
}: {
  value: string;
  onChange: (trade: string) => void;
  allowEmpty?: boolean;
  className?: string;
}) {
  const { t, i18n } = useTranslation('financial');
  const trades = useTradeTaxonomy();
  const [customMode, setCustomMode] = useState(false);

  const byCategory = useMemo(() => groupByCategory(trades), [trades]);

  const isKnown = value === '' || trades.some((tr) => tr.key === value);
  const showCustom = customMode || (!isKnown && trades.length > 0);

  const selectClass = className ??
    'block w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand-500';

  return (
    <div className="space-y-2">
      <select
        className={selectClass}
        value={showCustom ? CUSTOM : value}
        onChange={(e) => {
          if (e.target.value === CUSTOM) { setCustomMode(true); return; }
          setCustomMode(false);
          onChange(e.target.value);
        }}
      >
        {allowEmpty && <option value="">{t('vendors.trade_none')}</option>}
        {byCategory.map((g) => (
          <optgroup key={g.category} label={t(`vendors.trade_categories.${g.category}`)}>
            {g.trades.map((tr) => (
              <option key={tr.key} value={tr.key}>{tradeDisplayLabel(tr, i18n.language)}</option>
            ))}
          </optgroup>
        ))}
        <option value={CUSTOM}>{t('vendors.trade_custom')}</option>
      </select>
      {showCustom && (
        <input
          className={selectClass}
          placeholder={t('vendors.trade_custom_placeholder')}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  );
}
