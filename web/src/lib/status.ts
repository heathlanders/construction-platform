// web/src/lib/status.ts — canonical status resolution for web.
// Mirrors mobile/src/lib/theme.ts STATUS_MAP (DESIGN.md §2.3). This is the ONE
// place a domain state → semantic color is decided on web; Badge/StatusPill/
// StatusDot resolve through it. Never redefine a status color per screen.

export type StatusKey = 'success' | 'danger' | 'info' | 'warning' | 'action' | 'neutral';

// Domain state → semantic key. Mirror of the mobile map, plus a web-only
// extension block for the richer web status vocabulary (invoices, submittals,
// connections, trade states) the mobile app doesn't surface.
export const STATUS_MAP: Record<string, StatusKey> = {
  // --- mirror of mobile STATUS_MAP ---
  active: 'success', passed: 'success', answered: 'success', awarded: 'success', valid: 'success',
  approved: 'success', complete: 'success',
  on_hold: 'warning', pending: 'warning', scheduled: 'warning', expiring: 'warning',
  in_repair: 'warning', in_progress: 'warning', submitted: 'warning',
  completed: 'info', open: 'info',
  cancelled: 'danger', failed: 'danger', expired: 'danger', overdue: 'danger',
  out_of_service: 'danger', stolen: 'danger', lost: 'danger', rejected: 'danger',
  requires_action: 'action', reserved: 'action',
  draft: 'neutral', closed: 'neutral', inactive: 'neutral',
  decommissioned: 'neutral', sold: 'neutral', voided: 'neutral',
  // --- web-only extension (keep in sync w/ DESIGN.md §2.3 if promoted) ---
  trial: 'action', not_started: 'neutral',
  sent: 'info', paid: 'success', void: 'neutral', // invoices
  under_review: 'warning', approved_as_noted: 'success', resubmit: 'warning', // submittals
  revoked: 'danger', declined: 'danger', // connections / bids
  rough_in: 'warning', roughed_in: 'warning', trimmed: 'warning', // trade phases
};

// Soft-pill Tailwind classes per semantic (theme-aware via the var-backed tokens).
export const STATUS_SOFT: Record<StatusKey, string> = {
  success: 'bg-status-success-bg text-status-success',
  danger: 'bg-status-danger-bg text-status-danger',
  info: 'bg-status-info-bg text-status-info',
  warning: 'bg-status-warning-bg text-status-warning',
  action: 'bg-status-action-bg text-status-action',
  neutral: 'bg-status-neutral-bg text-status-neutral',
};

// Solid dot/fill Tailwind class per semantic.
export const STATUS_DOT: Record<StatusKey, string> = {
  success: 'bg-status-success',
  danger: 'bg-status-danger',
  info: 'bg-status-info',
  warning: 'bg-status-warning',
  action: 'bg-status-action',
  neutral: 'bg-status-neutral',
};

export function statusKey(state: string | null | undefined): StatusKey {
  return (state && STATUS_MAP[state]) || 'neutral';
}

export function statusClasses(state: string | null | undefined): string {
  return STATUS_SOFT[statusKey(state)];
}

/** Humanize a snake_case state for display when no explicit label is given. */
export function statusLabel(state: string): string {
  return state.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
