// lib/theme.ts — light/dark palette tokens.
// Only background/surface/text/border/chrome tokens swap between modes. Semantic accent colors
// (tile colors, status/severity badges) stay literal at their call sites.

export type ThemeMode = 'system' | 'light' | 'dark';
export type Scheme = 'light' | 'dark';

export interface Palette {
  scheme: Scheme;
  background: string; // screen background
  surface: string;    // cards / tiles
  surfaceAlt: string; // inputs / subtle fills
  text: string;       // primary text
  textMuted: string;  // secondary text
  border: string;
  headerBg: string;   // nav header
  headerText: string;
  accent: string;     // primary action color
  overlay: string;    // modal scrim
}

export const LIGHT: Palette = {
  scheme: 'light',
  background: '#f9fafb',
  surface: '#ffffff',
  surfaceAlt: '#f3f4f6',
  text: '#111827',
  textMuted: '#6b7280',
  border: '#e5e7eb',
  headerBg: '#1e3a5f',
  headerText: '#ffffff',
  accent: '#1e40af',
  overlay: 'rgba(0,0,0,0.4)',
};

export const DARK: Palette = {
  scheme: 'dark',
  background: '#0b1220',
  surface: '#161e2e',
  surfaceAlt: '#1f2937',
  text: '#f3f4f6',
  textMuted: '#9ca3af',
  border: '#2d3748',
  headerBg: '#0f172a',
  headerText: '#f3f4f6',
  accent: '#3b82f6',
  overlay: 'rgba(0,0,0,0.6)',
};

export function paletteFor(scheme: Scheme): Palette {
  return scheme === 'dark' ? DARK : LIGHT;
}

// ---------------------------------------------------------------------------
// Canonical status + severity color helpers (M1 — Mobile Design Parity).
// ONE source of truth for state badge colors. Screens must route status →
// statusColor() and incident severity → severityColor(), never literal hex.
// Mirrors web web/src/lib/status.ts + DESIGN.md §2.3/2.4.
// ---------------------------------------------------------------------------

export type StatusTone = 'success' | 'danger' | 'info' | 'warning' | 'action' | 'neutral';

export interface StatusColors {
  fg: string; // text / icon
  bg: string; // badge fill
}

// Semantic tone → { fg, bg }. Badges read on both light + dark.
export const STATUS: Record<StatusTone, StatusColors> = {
  success: { fg: '#059669', bg: '#dcfce7' },
  danger: { fg: '#dc2626', bg: '#fee2e2' },
  info: { fg: '#2563eb', bg: '#dbeafe' },
  warning: { fg: '#d97706', bg: '#fef9c3' },
  action: { fg: '#7c3aed', bg: '#ede9fe' },
  neutral: { fg: '#6b7280', bg: '#f3f4f6' },
};

// Domain state string → semantic tone. Mirror web status.ts exactly.
export const STATUS_MAP: Record<string, StatusTone> = {
  // success
  active: 'success',
  passed: 'success',
  answered: 'success',
  awarded: 'success',
  valid: 'success',
  approved: 'success',
  complete: 'success',
  paid: 'success',
  approved_as_noted: 'success',
  // warning
  on_hold: 'warning',
  pending: 'warning',
  scheduled: 'warning',
  expiring: 'warning',
  in_repair: 'warning',
  in_progress: 'warning',
  submitted: 'warning',
  under_review: 'warning',
  resubmit: 'warning',
  rough_in: 'warning',
  roughed_in: 'warning',
  trimmed: 'warning',
  // info
  completed: 'info',
  open: 'info',
  sent: 'info',
  // danger
  cancelled: 'danger',
  failed: 'danger',
  expired: 'danger',
  overdue: 'danger',
  out_of_service: 'danger',
  stolen: 'danger',
  lost: 'danger',
  rejected: 'danger',
  revoked: 'danger',
  declined: 'danger',
  // action
  requires_action: 'action',
  reserved: 'action',
  trial: 'action',
  // neutral
  draft: 'neutral',
  closed: 'neutral',
  inactive: 'neutral',
  decommissioned: 'neutral',
  sold: 'neutral',
  voided: 'neutral',
  not_started: 'neutral',
  void: 'neutral',
};

// Resolve a domain status string → its { fg, bg }. Unknown → neutral.
export function statusColor(state: string | null | undefined): StatusColors {
  const tone = (state && STATUS_MAP[state]) || 'neutral';
  return STATUS[tone];
}

// Incident severity — ordered low→high (DESIGN §2.4). fg only (badge bg derives).
export const SEVERITY: Record<string, string> = {
  near_miss: '#6b7280',
  first_aid: '#d97706',
  recordable: '#ea580c',
  lost_time: '#dc2626',
  fatality: '#7f1d1d',
};

export function severityColor(s: string | null | undefined): string {
  return (s && SEVERITY[s]) || '#6b7280';
}
