'use client';

import { type ReactNode } from 'react';

export interface TabItem {
  key: string;
  label: ReactNode;
}

/** Controlled underline tabs (accessible tablist). */
export function Tabs({
  items,
  value,
  onChange,
  className = '',
}: {
  items: TabItem[];
  value: string;
  onChange: (key: string) => void;
  className?: string;
}) {
  return (
    <div role="tablist" className={`flex items-center gap-1 border-b border-line ${className}`}>
      {items.map((it) => {
        const selected = it.key === value;
        return (
          <button
            key={it.key}
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(it.key)}
            className={[
              '-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-t',
              selected
                ? 'border-brand-600 text-ink'
                : 'border-transparent text-muted hover:text-ink hover:border-line',
            ].join(' ')}
          >
            {it.label}
          </button>
        );
      })}
    </div>
  );
}
