// lib/tileManifest.ts — single source of truth for role-based navigation.
// Every project tile + global/header action is declared here with the roles allowed to see it.
// Mobile Enterprise Plan §A (role-aware experience). Gating is UX-only / defense-in-depth —
// the API still enforces every permission. Roles are the LOWERCASE user_role enum values
// (owner, project_manager, …) exactly as they arrive in the JWT — never uppercase to compare.

import type { RootStackParamList } from '@/navigation/AppNavigator';

export type Role =
  | 'owner'
  | 'project_manager'
  | 'estimator'
  | 'foreman'
  | 'field_tech'
  | 'accountant'
  | 'safety_officer'
  | 'client_portal'
  | 'sub_portal';

export type TileScope = 'project' | 'global';

export interface TileDef {
  /** i18n key. Project tiles use the FLAT `projects` ns key (e.g. 'actions.log_time');
   *  global actions use a `common` ns key (e.g. 'nav.clock'). See `tileLabelNs`. */
  key: string;
  /** i18n namespace the `key` lives in. */
  ns: 'projects' | 'common';
  route: keyof RootStackParamList;
  /** Accent color (left border on the project grid / icon tint). */
  color: string;
  /** Emoji icon (matches the existing header icon style). */
  icon: string;
  /** Permission gate — a user preference can never widen this. */
  allowedRoles: Role[];
  scope: TileScope;
  /** Render as a header icon button (subset of global actions). */
  headerAction?: boolean;
  /** Informational only — not filtered client-side (no tier claim in the JWT; API 402s). */
  requiresTier?: 'BUSINESS';
  /** Project tiles: does the destination route also need `projectName` in its params? */
  needsProjectName?: boolean;
  /** Project-scope route that takes NO project params (e.g. AssetCheckout → {}). */
  noProjectParams?: boolean;
}

// Convenience role groups.
const FIELD: Role[] = ['foreman', 'field_tech'];
const OFFICE: Role[] = ['owner', 'project_manager'];

export const TILES: TileDef[] = [
  // ── Project-scope tiles (rendered in ProjectDetailScreen) ──────────────────
  {
    key: 'actions.tasks', ns: 'projects', route: 'Tasks', color: '#0d9488', icon: '🗂️',
    scope: 'project', needsProjectName: true,
    allowedRoles: ['owner', 'project_manager', 'foreman', 'field_tech', 'safety_officer', 'client_portal'],
  },
  {
    key: 'actions.log_time', ns: 'projects', route: 'TimeEntry', color: '#1e40af', icon: '⏱️',
    scope: 'project',
    allowedRoles: ['owner', 'project_manager', 'foreman', 'field_tech', 'accountant'],
  },
  {
    key: 'actions.daily_report', ns: 'projects', route: 'DailyReport', color: '#065f46', icon: '📋',
    scope: 'project',
    allowedRoles: ['owner', 'project_manager', 'foreman', 'field_tech', 'safety_officer'],
  },
  {
    key: 'actions.punch_list', ns: 'projects', route: 'PunchList', color: '#7c3aed', icon: '✅',
    scope: 'project', needsProjectName: true,
    allowedRoles: ['owner', 'project_manager', 'foreman', 'field_tech'],
  },
  {
    key: 'actions.documents', ns: 'projects', route: 'Documents', color: '#b45309', icon: '📁',
    scope: 'project', needsProjectName: true,
    allowedRoles: ['owner', 'project_manager', 'estimator', 'foreman', 'field_tech', 'accountant', 'safety_officer', 'client_portal'],
  },
  {
    key: 'actions.rfis', ns: 'projects', route: 'Rfis', color: '#0e7490', icon: '❓',
    scope: 'project', needsProjectName: true,
    allowedRoles: ['owner', 'project_manager', 'estimator', 'foreman', 'field_tech'],
  },
  {
    key: 'actions.submittals', ns: 'projects', route: 'Submittals', color: '#0369a1', icon: '📑',
    scope: 'project', needsProjectName: true,
    allowedRoles: ['owner', 'project_manager', 'estimator', 'foreman'],
  },
  {
    key: 'actions.milestones', ns: 'projects', route: 'Milestones', color: '#9333ea', icon: '🏁',
    scope: 'project', needsProjectName: true,
    allowedRoles: ['owner', 'project_manager', 'foreman', 'field_tech'],
  },
  {
    key: 'actions.crew', ns: 'projects', route: 'Crew', color: '#0891b2', icon: '👷',
    scope: 'project', needsProjectName: true,
    allowedRoles: ['owner', 'project_manager', 'foreman'],
  },
  {
    key: 'actions.safety', ns: 'projects', route: 'Safety', color: '#b91c1c', icon: '🦺',
    scope: 'project', needsProjectName: true,
    allowedRoles: ['owner', 'project_manager', 'foreman', 'field_tech', 'safety_officer'],
  },
  {
    key: 'actions.trade', ns: 'projects', route: 'Trade', color: '#0f766e', icon: '🔧',
    scope: 'project', needsProjectName: true,
    allowedRoles: ['owner', 'project_manager', 'estimator', 'foreman', 'field_tech'],
  },
  {
    key: 'actions.permits', ns: 'projects', route: 'Permits', color: '#b45309', icon: '📜',
    scope: 'project', needsProjectName: true,
    allowedRoles: ['owner', 'project_manager', 'foreman', 'field_tech'],
  },
  {
    key: 'actions.structural', ns: 'projects', route: 'Structural', color: '#57534e', icon: '🏗️',
    scope: 'project', needsProjectName: true,
    allowedRoles: ['owner', 'project_manager', 'estimator', 'foreman', 'field_tech', 'safety_officer'],
  },
  {
    key: 'actions.jsa', ns: 'projects', route: 'JSA', color: '#ea580c', icon: '🦺',
    scope: 'project', needsProjectName: true,
    // API W: OWNER/PM/SAFETY_OFFICER/FOREMAN. Field tech can't run a JSA briefing.
    allowedRoles: ['owner', 'project_manager', 'safety_officer', 'foreman'],
  },
  {
    key: 'actions.inspections', ns: 'projects', route: 'Inspections', color: '#0891b2', icon: '🔍',
    scope: 'project', needsProjectName: true,
    allowedRoles: ['owner', 'project_manager', 'foreman', 'field_tech', 'safety_officer'],
  },
  {
    key: 'actions.assets', ns: 'projects', route: 'AssetCheckout', color: '#7c3aed', icon: '📦',
    scope: 'project', noProjectParams: true, requiresTier: 'BUSINESS',
    allowedRoles: ['owner', 'project_manager', 'foreman', 'field_tech', 'accountant', 'safety_officer'],
  },

  // ── Global / header actions (ProjectsScreen quick-strip + header icons) ─────
  {
    key: 'nav.clock', ns: 'common', route: 'Clock', color: '#1e40af', icon: '⏱️',
    scope: 'global', headerAction: true,
    allowedRoles: FIELD,
  },
  {
    key: 'nav.timecard', ns: 'common', route: 'Timecard', color: '#0d9488', icon: '🗓️',
    scope: 'global', headerAction: true,
    // Own weekly timecard — every authenticated user can open/submit their own (API: any authed).
    allowedRoles: ['owner', 'project_manager', 'estimator', 'foreman', 'field_tech', 'accountant', 'safety_officer', 'client_portal', 'sub_portal'],
  },
  {
    key: 'nav.warranties', ns: 'common', route: 'WarrantyList', color: '#9333ea', icon: '🛡️',
    scope: 'global', requiresTier: 'BUSINESS',
    allowedRoles: ['owner', 'project_manager', 'accountant'],
  },
  {
    // Cross-tenant bridge (P-02) — GC↔Sub connections. API addon-gates (PR-08); the
    // screen renders an upgrade note on 402, so no requiresTier here.
    key: 'nav.connections', ns: 'common', route: 'Connections', color: '#7c3aed', icon: '🔗',
    scope: 'global',
    allowedRoles: ['owner', 'project_manager'],
  },
  {
    key: 'nav.safety_certs', ns: 'common', route: 'SafetyCerts', color: '#b91c1c', icon: '🪪',
    scope: 'global',
    allowedRoles: ['owner', 'project_manager', 'foreman', 'field_tech', 'safety_officer'],
  },
  {
    // Near-me project map (Doc 20 Phase 4) — field-first, office roles benefit too.
    key: 'nav.map', ns: 'common', route: 'NearMe', color: '#0e7490', icon: '🗺',
    scope: 'global', headerAction: true,
    allowedRoles: ['owner', 'project_manager', 'foreman', 'field_tech'],
  },
  {
    key: 'nav.notifications', ns: 'common', route: 'Notifications', color: '#374151', icon: '🔔',
    scope: 'global', headerAction: true,
    allowedRoles: ['owner', 'project_manager', 'estimator', 'foreman', 'field_tech', 'accountant', 'safety_officer', 'client_portal', 'sub_portal'],
  },
  {
    key: 'nav.settings', ns: 'common', route: 'Settings', color: '#374151', icon: '⚙️',
    scope: 'global', headerAction: true,
    allowedRoles: ['owner', 'project_manager', 'estimator', 'foreman', 'field_tech', 'accountant', 'safety_officer', 'client_portal', 'sub_portal'],
  },
];

/** True when `role` is in `allowed`. Lowercase compare — JWT role is lowercase. */
export function hasRole(role: string | undefined, allowed: Role[]): boolean {
  // The API issues the JWT role claim UPPERCASE (auth.ts issueToken → user.role.toUpperCase()),
  // but allowedRoles here are lowercase user_role enum values. Normalize so the match is
  // case-insensitive — an exact compare silently filtered every tile out → empty grids.
  return !!role && (allowed as string[]).includes(role.toLowerCase());
}

/** Tiles of a given scope that this role is allowed to see (manifest order preserved). */
export function tilesForRole(role: string | undefined, scope: TileScope): TileDef[] {
  return TILES.filter((t) => t.scope === scope && hasRole(role, t.allowedRoles));
}

/** Global actions that render as header icon buttons for this role. */
export function headerActionsForRole(role: string | undefined): TileDef[] {
  return TILES.filter((t) => t.scope === 'global' && t.headerAction && hasRole(role, t.allowedRoles));
}

/** Look up a single tile by its i18n key (for preference UIs). */
export function tileByKey(key: string): TileDef | undefined {
  return TILES.find((t) => t.key === key);
}
