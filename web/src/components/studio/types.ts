// components/studio/types.ts — client-side shapes for Design Studio + the visibility rule.
//
// The wizard is TRADE-AGNOSTIC: it renders whatever localized steps the API returns
// (GET /v1/client-portal/studio/trades/:key/intake). `evalCond` mirrors api/src/lib/intake/spec.ts —
// the server re-validates everything (strip-don't-reject), so this only drives show/hide.

export type FieldValue = unknown;
export type Values = Record<string, FieldValue>;

export interface Cond { field: string; in?: unknown[]; not_in?: unknown[]; truthy?: boolean }
export interface OptionDef { value: string; label: string; help?: string; swatch?: string }

export interface FieldDef {
  id: string;
  type: 'area' | 'linear' | 'count' | 'number' | 'choice' | 'multichoice' | 'boolean' | 'photo' | 'text';
  label: string;
  help?: string;
  required?: boolean;
  visible_when?: Cond[];
  options?: OptionDef[];
  shapes?: ('rect' | 'l_shape' | 'circle' | 'direct_sf')[];
  min_sf?: number; max_sf?: number; min_lf?: number; max_lf?: number;
  min?: number; max?: number; step?: number; unit?: string; default?: unknown;
  max_select?: number; max_len?: number; role?: string;
  ai_assessable?: boolean; ai_suggestible?: boolean;
}

export interface StepDef { id: string; title: string; intro?: string; visible_when?: Cond[]; fields: FieldDef[] }

export interface Intake {
  trade_key: string;
  intake_version: number;
  common_steps: StepDef[];
  steps: StepDef[];
  features: { renders: boolean; ai_guide: boolean; photo_assess: boolean };
}

export interface Bi { en: string; es: string }
export interface Suggestion { field: string; value: unknown; confidence: number; reason: Bi; provenance: string }
export interface Requirement { id: string; level: 'required' | 'likely' | 'info'; title: Bi; body: Bi; owner: 'client' | 'contractor'; source: string }
export interface RenderDto { id: string; status: string; url: string | null; created_at: string }
export interface PhotoDto { id: string; status: string; url: string | null }

export interface ScopeDto {
  id: string;
  trade_key: string;
  status: string;
  values: Values;
  provenance: Record<string, string>;
  missing: string[];
  summary: { field: string; label: Bi; value: Bi }[];
  range: { low_cents: number; high_cents: number } | null;
  requirements: Requirement[];
  ai_suggestions: Suggestion[];
  photos: PhotoDto[];
  renders: RenderDto[];
  selected_render_id: string | null;
  version: number;
}

export interface RequestDto {
  id: string;
  status: 'draft' | 'submitted' | 'reviewed' | 'converted' | 'declined';
  title: string | null;
  site: Record<string, string>;
  common_values: Values;
  project_id: string | null;
  submitted_at: string | null;
  created_at: string;
  version: number;
  range: { low_cents: number; high_cents: number } | null;
}

function isEmpty(v: unknown) {
  return v === undefined || v === null || v === '' || v === false || (Array.isArray(v) && v.length === 0);
}

export function evalCond(c: Cond, values: Values): boolean {
  const v = values[c.field];
  if (c.truthy !== undefined && isEmpty(v) === c.truthy) return false;
  const hits = (xs: unknown[]) => (Array.isArray(v) ? v.some((x) => xs.includes(x)) : xs.includes(v));
  if (c.in && !hits(c.in)) return false;
  if (c.not_in && v !== undefined && hits(c.not_in)) return false;
  return true;
}

export const visible = (conds: Cond[] | undefined, values: Values) => (conds ?? []).every((c) => evalCond(c, values));

/** Visible required fields of a step that have no answer. */
export function missingInStep(step: StepDef, values: Values): string[] {
  if (!visible(step.visible_when, values)) return [];
  return step.fields
    .filter((f) => f.required && visible(f.visible_when, values) && f.type !== 'boolean' && isEmpty(values[f.id]))
    .map((f) => f.id);
}

export function money(cents: number, lang: string): string {
  return new Intl.NumberFormat(lang === 'es' ? 'es-US' : 'en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(cents / 100);
}

export const bi = (b: Bi | undefined, lang: string) => (b ? (lang === 'es' ? b.es : b.en) : '');

/** Read an API error message from a failed fetch Response. */
export async function apiError(res: Response, fallback: string): Promise<string> {
  try {
    const d = await res.json();
    return d?.error?.message ?? fallback;
  } catch {
    return fallback;
  }
}
