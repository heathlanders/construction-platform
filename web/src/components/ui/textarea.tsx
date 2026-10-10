'use client';

import { forwardRef, type TextareaHTMLAttributes } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

/** Styled textarea (label + error), tokenized + brand focus ring. */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = '', id, ...props }, ref) => {
    const areaId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={areaId} className="text-sm font-medium text-ink">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={areaId}
          className={[
            'block w-full rounded-md border px-3 py-2 text-sm text-ink',
            'placeholder:text-muted/70',
            'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500',
            error ? 'border-status-danger bg-status-danger-bg' : 'border-line bg-surface',
            className,
          ].join(' ')}
          {...props}
        />
        {error && <p className="text-xs text-status-danger">{error}</p>}
      </div>
    );
  },
);
Textarea.displayName = 'Textarea';
