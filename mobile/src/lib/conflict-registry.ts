// lib/conflict-registry.ts — one declarative description of every table that can
// produce a sync conflict, plus the pure merge/diff helpers the resolve screen uses.
//
// Before this, each conflict-capable table needed its own ~220-line resolve screen
// (time entries, punch items, safety incidents) — which is why offline writes could
// not be turned on for a new table: a Tier-2 conflict with no resolve screen is an
// invisible, permanently stuck row. Adding a table is now a registry entry.
//
// Pure: no WatermelonDB, no fetch, no AsyncStorage — unit-testable (§C1).

export type ConflictTier = 2 | 3;

/** How a value is rendered in the side-by-side diff. */
export type FieldKind = 'text' | 'hours' | 'money' | 'date' | 'status';

export interface ConflictField {
  /** Column name — identical on the local model and the server record. */
  key: string;
  /** i18n key under the `field` namespace. */
  labelKey: string;
  kind?: FieldKind;
}

export interface ConflictTableDef {
  table: string;
  /** REST collection for the resolving PATCH, e.g. '/time-entries'. */
  endpoint: string;
  /** Key the API wraps the updated row in, e.g. 'time_entry'. */
  responseKey: string;
  /** T-13 tier. 3 = safety-critical: only an authorized role may resolve. */
  tier: ConflictTier;
  /** Lowercase roles allowed to resolve (tier 3 only); undefined = anyone. */
  resolveRoles?: string[];
  /** Column shown as the row heading (inbox + resolve screen). */
  titleKey: string;
  /** i18n key (namespace `field`) for the table's display name in the inbox. */
  labelKey: string;
  fields: ConflictField[];
}

export const CONFLICT_TABLES: ConflictTableDef[] = [
  {
    table: 'time_entries',
    endpoint: '/time-entries',
    responseKey: 'time_entry',
    tier: 2,
    titleKey: 'date',
    labelKey: 'conflicts.kind_time_entry',
    fields: [
      { key: 'hours_worked', labelKey: 'conflicts.field_hours', kind: 'hours' },
      { key: 'hourly_rate_cents', labelKey: 'conflicts.field_rate', kind: 'money' },
      { key: 'cost_code_id', labelKey: 'conflicts.field_cost_code' },
      { key: 'budget_line_item_id', labelKey: 'conflicts.field_budget' },
      { key: 'notes', labelKey: 'conflicts.field_notes' },
    ],
  },
  {
    table: 'punch_list_items',
    endpoint: '/punch-list-items',
    responseKey: 'punch_list_item',
    tier: 2,
    titleKey: 'title',
    labelKey: 'conflicts.kind_punch',
    fields: [
      { key: 'title', labelKey: 'conflicts.field_title' },
      { key: 'description', labelKey: 'conflicts.field_description' },
      { key: 'status', labelKey: 'conflicts.field_status', kind: 'status' },
      { key: 'due_date', labelKey: 'conflicts.field_due_date', kind: 'date' },
    ],
  },
  {
    table: 'safety_incidents',
    endpoint: '/safety-incidents',
    responseKey: 'safety_incident',
    tier: 3, // T-13 Tier 3 — blocks until an authorized user resolves
    resolveRoles: ['owner', 'safety_officer'],
    titleKey: 'incident_date',
    labelKey: 'conflicts.kind_safety',
    fields: [
      { key: 'description', labelKey: 'conflicts.field_description' },
      { key: 'severity', labelKey: 'conflicts.field_severity', kind: 'status' },
      { key: 'status', labelKey: 'conflicts.field_status', kind: 'status' },
    ],
  },
    {
    // Tier 3 like safety incidents: a JSA is the legal record of the hazard briefing
    // people signed, so a losing offline edit waits for an authorized resolver rather
    // than being silently overwritten.
    table: 'jsa_records',
    endpoint: '/jsa-records',
    responseKey: 'jsa_record',
    tier: 3,
    resolveRoles: ['owner', 'safety_officer'],
    titleKey: 'title',
    labelKey: 'conflicts.kind_jsa',
    fields: [
      { key: 'title', labelKey: 'conflicts.field_title' },
      { key: 'conducted_at', labelKey: 'conflicts.field_date', kind: 'date' },
    ],
  },
  {
    table: 'concrete_test_records',
    endpoint: '/concrete-test-records',
    responseKey: 'concrete_test_record',
    tier: 2,
    titleKey: 'test_type',
    labelKey: 'conflicts.kind_concrete_test',
    fields: [
      { key: 'measured_value', labelKey: 'conflicts.field_measured' },
      { key: 'result', labelKey: 'conflicts.field_result', kind: 'status' },
      { key: 'notes', labelKey: 'conflicts.field_notes' },
    ],
  },
  {
    table: 'roofing_qa_records',
    endpoint: '/roofing-qa-records',
    responseKey: 'roofing_qa_record',
    tier: 2,
    titleKey: 'qa_type',
    labelKey: 'conflicts.kind_roofing_qa',
    fields: [
      { key: 'result', labelKey: 'conflicts.field_result', kind: 'status' },
      { key: 'measured_value', labelKey: 'conflicts.field_measured' },
      { key: 'notes', labelKey: 'conflicts.field_notes' },
    ],
  },
  {
    table: 'framing_correction_items',
    endpoint: '/framing-correction-items',
    responseKey: 'framing_correction_item',
    tier: 2,
    titleKey: 'description',
    labelKey: 'conflicts.kind_framing_correction',
    fields: [
      { key: 'status', labelKey: 'conflicts.field_status', kind: 'status' },
      { key: 'severity', labelKey: 'conflicts.field_severity' },
      { key: 'notes', labelKey: 'conflicts.field_notes' },
    ],
  },
  {
    table: 'electrical_circuits',
    endpoint: '/electrical-circuits',
    responseKey: 'electrical_circuit',
    tier: 2,
    titleKey: 'description',
    labelKey: 'conflicts.kind_circuit',
    fields: [
      { key: 'status', labelKey: 'conflicts.field_status', kind: 'status' },
      { key: 'description', labelKey: 'conflicts.field_description' },
    ],
  },
  {
    table: 'plumbing_fixtures',
    endpoint: '/plumbing-fixtures',
    responseKey: 'plumbing_fixture',
    tier: 2,
    titleKey: 'fixture_type',
    labelKey: 'conflicts.kind_fixture',
    fields: [
      { key: 'status', labelKey: 'conflicts.field_status', kind: 'status' },
      { key: 'location', labelKey: 'conflicts.field_location' },
    ],
  },
{
    table: 'inspections',
    endpoint: '/inspections',
    responseKey: 'inspection',
    tier: 2,
    titleKey: 'title',
    labelKey: 'conflicts.kind_inspection',
    fields: [
      { key: 'title', labelKey: 'conflicts.field_title' },
      { key: 'status', labelKey: 'conflicts.field_status', kind: 'status' },
      { key: 'inspection_date', labelKey: 'conflicts.field_date', kind: 'date' },
      { key: 'inspector_name', labelKey: 'conflicts.field_inspector' },
      { key: 'notes', labelKey: 'conflicts.field_notes' },
    ],
  },
];

export function conflictDef(table: string): ConflictTableDef | undefined {
  return CONFLICT_TABLES.find((d) => d.table === table);
}

/** Equality normalisation: undefined / null / '' are the same "empty". */
export function norm(v: unknown): string | number | null {
  if (v === undefined || v === null || v === '') return null;
  if (typeof v === 'number') return v;
  return String(v);
}

/** Human-readable value for the diff cards. */
export function displayValue(field: ConflictField, v: unknown): string {
  const n = norm(v);
  if (n === null) return '—';
  if (field.kind === 'money') return `$${(Number(n) / 100).toFixed(2)}`;
  if (field.kind === 'hours') return Number(n).toFixed(2);
  if (field.kind === 'date') return String(n).slice(0, 10);
  return String(n);
}

/** Fields whose local value differs from the server's — the only ones needing a choice. */
export function differingFields(
  fields: ConflictField[],
  local: Record<string, unknown>,
  server: Record<string, unknown>,
): ConflictField[] {
  return fields.filter((f) => norm(local[f.key]) !== norm(server[f.key]));
}

export type Choice = 'mine' | 'server';

/**
 * Build the merged row. Differing fields take the user's pick; identical fields keep
 * the value. T-14: the caller must ensure EVERY differing field has a choice — an
 * unresolved field here silently keeps the local value, which is exactly the
 * accidental-overwrite the locked decision forbids.
 */
export function mergeChoices(
  fields: ConflictField[],
  local: Record<string, unknown>,
  server: Record<string, unknown>,
  choices: Record<string, Choice | undefined>,
): Record<string, string | number | null> {
  const differing = new Set(differingFields(fields, local, server).map((f) => f.key));
  const merged: Record<string, string | number | null> = {};
  for (const f of fields) {
    const pick = differing.has(f.key) ? choices[f.key] : 'mine';
    merged[f.key] = pick === 'server' ? norm(server[f.key]) : norm(local[f.key]);
  }
  return merged;
}

/** T-14 gate: every differing field must have an explicit choice before submit. */
export function allResolved(
  fields: ConflictField[],
  local: Record<string, unknown>,
  server: Record<string, unknown>,
  choices: Record<string, Choice | undefined>,
): boolean {
  return differingFields(fields, local, server).every((f) => choices[f.key] != null);
}

/** Tier-3 gate: may this role resolve this table's conflicts? (UX gate; API enforces.) */
export function canResolve(def: ConflictTableDef, role: string | null | undefined): boolean {
  if (!def.resolveRoles) return true;
  return !!role && def.resolveRoles.includes(role.toLowerCase());
}
