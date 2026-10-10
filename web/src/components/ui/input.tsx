'use client';

import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({ label, error, className = '', id, ...props }, ref) => {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-ink">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
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
});
Input.displayName = 'Input';
