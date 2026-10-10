import type { ReactNode } from 'react';
import { statusClasses, statusKey, statusLabel, STATUS_DOT } from '@/lib/status';

interface BadgeProps {
  /** Domain state (e.g. 'active', 'on_hold', 'overdue') — resolved via lib/status. */
  status?: string;
  className?: string;
  children?: ReactNode;
}

/**
 * Status pill. Color comes ONLY from the canonical map (DESIGN.md §2.3) — resolves
 * any domain state, no per-screen redefinition. Pass children to override the label.
 */
export function Badge({ status, className = '', children }: BadgeProps) {
  const cls = status ? statusClasses(status) : '';
  const label = children ?? (status ? statusLabel(status) : null);
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cls} ${className}`}>
      {label}
    </span>
  );
}

/** Small solid status dot — for dense tables / lists. */
export function StatusDot({ status, className = '' }: { status: string; className?: string }) {
  return <span className={`inline-block h-2 w-2 rounded-full ${STATUS_DOT[statusKey(status)]} ${className}`} aria-hidden="true" />;
}

/** Status pill with a leading dot. `solid` gives a filled pill (reserve for the hub). */
export function StatusPill({
  status,
  label,
  solid = false,
  className = '',
}: {
  status: string;
  label?: ReactNode;
  solid?: boolean;
  className?: string;
}) {
  const key = statusKey(status);
  const body = label ?? statusLabel(status);
  if (solid) {
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold text-white ${STATUS_DOT[key]} ${className}`}>
        <span className="h-1.5 w-1.5 rounded-full bg-white/85" aria-hidden="true" />
        {body}
      </span>
    );
  }
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusClasses(status)} ${className}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[key]}`} aria-hidden="true" />
      {body}
    </span>
  );
}
