'use client';

import { Button } from './button';

/** Cursor-friendly prev/next pager (the APIs are cursor-paginated). */
export function Pagination({
  onPrev,
  onNext,
  hasPrev,
  hasNext,
  label,
  className = '',
}: {
  onPrev?: () => void;
  onNext?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
  label?: string;
  className?: string;
}) {
  return (
    <div className={`flex items-center justify-between gap-3 ${className}`}>
      <span className="text-xs text-muted">{label}</span>
      <div className="flex items-center gap-2">
        <Button variant="secondary" size="sm" onClick={onPrev} disabled={!hasPrev}>
          ← Prev
        </Button>
        <Button variant="secondary" size="sm" onClick={onNext} disabled={!hasNext}>
          Next →
        </Button>
      </div>
    </div>
  );
}
