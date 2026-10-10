'use client';

import { useCallback, useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

const FOCUSABLE =
  'a[href],button:not([disabled]),textarea,input,select,[tabindex]:not([tabindex="-1"])';

interface OverlayProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  /** center = Modal, side = right SlideOver. */
  variant?: 'center' | 'side';
  width?: string; // tailwind width class for the panel
  className?: string;
}

/**
 * Accessible dialog base — role="dialog" + aria-modal, focus trap, Escape to close,
 * body scroll lock, focus restore on close, scrim click to dismiss. Portals to
 * <body> so it escapes overflow/stacking contexts. Replaces the ~26 hand-rolled
 * inline slide-overs (DESIGN.md §4).
 */
function Overlay({ open, onClose, title, children, footer, variant = 'center', width, className = '' }: OverlayProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);
  const titleId = useRef(`dlg-${Math.random().toString(36).slice(2, 8)}`).current;

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== 'Tab' || !panelRef.current) return;
      const nodes = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (n) => n.offsetParent !== null || n === document.activeElement,
      );
      if (nodes.length === 0) {
        e.preventDefault();
        panelRef.current.focus();
        return;
      }
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey && (active === first || active === panelRef.current)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    },
    [onClose],
  );

  useEffect(() => {
    if (!open) return;
    restoreRef.current = document.activeElement as HTMLElement | null;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeyDown, true);
    // focus the panel (or its first focusable) next tick
    const id = window.setTimeout(() => {
      const el = panelRef.current?.querySelector<HTMLElement>(FOCUSABLE) ?? panelRef.current;
      el?.focus();
    }, 0);
    return () => {
      window.clearTimeout(id);
      document.removeEventListener('keydown', onKeyDown, true);
      document.body.style.overflow = overflow;
      restoreRef.current?.focus?.();
    };
  }, [open, onKeyDown]);

  if (!open || typeof document === 'undefined') return null;

  const isSide = variant === 'side';
  const panelBase = 'flex max-h-full flex-col bg-surface shadow-2xl outline-none';
  const panelShape = isSide
    ? `h-full w-full ${width ?? 'max-w-md'} border-l border-line`
    : `w-full ${width ?? 'max-w-lg'} rounded-lg border border-line my-8`;

  return createPortal(
    <div
      className={`fixed inset-0 z-50 flex ${isSide ? 'justify-end' : 'items-start justify-center overflow-y-auto'} bg-overlay p-0 ${isSide ? '' : 'sm:p-4'}`}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
        className={`${panelBase} ${panelShape} ${className}`}
      >
        {title && (
          <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3">
            <h2 id={titleId} className="text-base font-semibold text-ink">{title}</h2>
            <button
              onClick={onClose}
              aria-label="Close"
              className="rounded-md p-1 text-muted hover:bg-surface-alt hover:text-ink focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75">
                <path strokeLinecap="round" d="M6 6l8 8M14 6l-8 8" />
              </svg>
            </button>
          </div>
        )}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex items-center justify-end gap-2 border-t border-line px-5 py-3">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

export function Modal(props: Omit<OverlayProps, 'variant'>) {
  return <Overlay {...props} variant="center" />;
}

export function SlideOver(props: Omit<OverlayProps, 'variant'>) {
  return <Overlay {...props} variant="side" />;
}
