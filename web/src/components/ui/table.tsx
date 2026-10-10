import type { ReactNode, TdHTMLAttributes, ThHTMLAttributes } from 'react';

/**
 * Dense data table — one shared header/row style (DESIGN.md §4). Wraps in an
 * overflow-x container so wide tables scroll instead of breaking the page.
 */
export function Table({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className="w-full overflow-x-auto">
      <table className={`w-full text-sm ${className}`}>{children}</table>
    </div>
  );
}

export function THead({ children }: { children: ReactNode }) {
  return <thead>{children}</thead>;
}

export function TBody({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-line">{children}</tbody>;
}

export function TR({ children, className = '', ...rest }: { children: ReactNode; className?: string } & React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr className={`transition-colors hover:bg-surface-alt/60 ${className}`} {...rest}>
      {children}
    </tr>
  );
}

export function TH({ children, className = '', ...rest }: { children?: ReactNode } & ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={`border-b border-line px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted ${className}`}
      {...rest}
    >
      {children}
    </th>
  );
}

export function TD({ children, className = '', ...rest }: { children?: ReactNode } & TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={`px-3 py-2.5 align-middle text-ink ${className}`} {...rest}>
      {children}
    </td>
  );
}
