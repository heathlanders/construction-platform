import type { ReactNode } from 'react';

/** Consistent empty state — replaces the scattered bare "No data" one-liners. */
export function EmptyState({
  title,
  description,
  icon,
  action,
  className = '',
}: {
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col items-center justify-center rounded-lg border border-dashed border-line bg-surface px-6 py-14 text-center ${className}`}>
      {icon && <div className="mb-3 text-3xl text-muted" aria-hidden="true">{icon}</div>}
      <p className="text-sm font-semibold text-ink">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
