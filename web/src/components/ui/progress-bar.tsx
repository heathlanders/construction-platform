import { statusKey, STATUS_DOT } from '@/lib/status';

/** Thin progress bar. Defaults to brand; pass `status` to color by a domain state. */
export function ProgressBar({
  value,
  status,
  className = '',
}: {
  value: number; // 0–100
  status?: string;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(100, value));
  const fill = status ? STATUS_DOT[statusKey(status)] : 'bg-brand-600';
  return (
    <div
      className={`h-2 overflow-hidden rounded-full bg-surface-alt ${className}`}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className={`h-full rounded-full ${fill}`} style={{ width: `${pct}%` }} />
    </div>
  );
}
