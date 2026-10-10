import type { ReactNode } from 'react';

/** Bold KPI tile for the dashboard / project hub (Hybrid — DESIGN.md §4). */
export function KpiTile({
  label,
  value,
  delta,
  deltaTone = 'up',
  hint,
  className = '',
}: {
  label: ReactNode;
  value: ReactNode;
  delta?: ReactNode;
  deltaTone?: 'up' | 'down' | 'flat';
  hint?: ReactNode;
  className?: string;
}) {
  const deltaCls =
    deltaTone === 'up'
      ? 'bg-status-success-bg text-status-success'
      : deltaTone === 'down'
        ? 'bg-status-danger-bg text-status-danger'
        : 'bg-status-neutral-bg text-status-neutral';
  return (
    <div className={`rounded-lg border border-line bg-surface p-4 ${className}`}>
      <div className="text-sm font-medium text-muted">{label}</div>
      <div className="mt-2 text-3xl font-bold tracking-tight text-ink tabular-nums">{value}</div>
      {(delta || hint) && (
        <div className="mt-2 flex items-center gap-2">
          {delta && (
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${deltaCls}`}>
              {deltaTone === 'up' ? '▲' : deltaTone === 'down' ? '▼' : '•'} {delta}
            </span>
          )}
          {hint && <span className="text-xs text-muted">{hint}</span>}
        </div>
      )}
    </div>
  );
}
