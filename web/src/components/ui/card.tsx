import type { ElementType, ReactNode } from 'react';

const PAD = { none: '', sm: 'p-3', md: 'p-4', lg: 'p-6' } as const;

/** Surface card — the one card shell. DESIGN.md §4/§5 (radius lg, flat, 1px border). */
export function Card({
  children,
  className = '',
  padding = 'md',
  as: As = 'div' as ElementType,
}: {
  children: ReactNode;
  className?: string;
  padding?: keyof typeof PAD;
  as?: ElementType;
}) {
  return <As className={`rounded-lg border border-line bg-surface ${PAD[padding]} ${className}`}>{children}</As>;
}

export function CardHeader({
  title,
  subtitle,
  action,
  className = '',
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex items-start justify-between gap-3 ${className}`}>
      <div>
        <h3 className="text-base font-semibold text-ink">{title}</h3>
        {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
