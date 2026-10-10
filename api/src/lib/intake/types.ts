// intake/types.ts — the trade-generic intake contract for Design Studio (proposed T-65).
//
// A trade is ONE declarative module (steps/fields/options as data, labels EN+ES inline) plus a few pure
// functions (scopeToQuantities, permit rule, extra requirements). Everything else — the spec validator,
// the web wizard, the AI suggestion schema, the image prompt, the client summary — is generated from the
// step data by the shared field-type library. Adding a trade = one module + catalog rows; no new routes,
// tables or web code (mirrors T-59/T-64).
//
// Pure, no I/O, no AI. The image never drives scope or price: scope comes from validated answers only.

import type { QuantityInput } from '../estimating/types.js';

/** Inline bilingual text — same convention as taxonomy label/label_es (P-09). */
export interface Bi { en: string; es: string }
export type Lang = 'en' | 'es';

/**
 * Visibility condition (data, not a function, so it serializes to the web and can be guard-tested).
 * Refers to a field id that appears EARLIER in the intake. All conditions in a list must pass.
 *  - `in`:      value equals one of these (multichoice: any selected value is one of these)
 *  - `not_in`:  value is none of these
 *  - `truthy`:  value is set and non-empty/non-false (or, with false, unset/empty/false)
 */
export interface Cond { field: string; in?: readonly unknown[]; not_in?: readonly unknown[]; truthy?: boolean }

export interface Option {
  value: string;
  label: Bi;
  help?: Bi;
  /** CSS color for a swatch chip (color pickers). */
  swatch?: string;
  /** English image-prompt fragment. Absent = this choice doesn't change the render. */
  prompt?: string;
}

export type AreaShape = 'rect' | 'l_shape' | 'circle' | 'direct_sf';

interface FieldBase {
  id: string;
  label: Bi;
  help?: Bi;
  required?: boolean;
  visible_when?: readonly Cond[];
}

/** Fields the photo-assessment call may estimate (values come back tagged `photo_estimate`). */
interface Assessable { ai_assessable?: boolean }
/** Fields the "help me decide" call may suggest. */
interface Suggestible { ai_suggestible?: boolean }

export interface AreaField extends FieldBase, Assessable, Suggestible {
  type: 'area'; shapes: readonly AreaShape[]; min_sf: number; max_sf: number;
  /** Everyday-object yardstick for the image prompt's size wording (intake/scale.ts). Default 'outdoor'. */
  scale_ref?: 'outdoor' | 'indoor';
}
export interface LinearField extends FieldBase, Assessable, Suggestible {
  type: 'linear'; min_lf: number; max_lf: number;
}
export interface CountField extends FieldBase, Assessable, Suggestible {
  type: 'count'; min: number; max: number;
}
export interface NumberField extends FieldBase, Assessable, Suggestible {
  type: 'number'; unit: 'in' | 'ft' | 'pct'; min: number; max: number; step: number; default?: number;
}
export interface ChoiceField extends FieldBase, Assessable, Suggestible {
  type: 'choice'; options: readonly Option[]; default?: string;
}
export interface MultiChoiceField extends FieldBase, Assessable, Suggestible {
  type: 'multichoice'; options: readonly Option[]; max_select?: number;
}
export interface BooleanField extends FieldBase, Suggestible {
  type: 'boolean'; prompt_true?: string; default?: boolean;
}
/** Photo refs only (uploaded file ids). Never reaches a prompt or price. */
export interface PhotoField extends FieldBase {
  type: 'photo'; role: string; min: number; max: number;
}
/** Free text. NEVER reaches the image prompt (prompt-injection boundary). */
export interface TextField extends FieldBase {
  type: 'text'; max_len: number;
}

export type FieldDef =
  | AreaField | LinearField | CountField | NumberField | ChoiceField | MultiChoiceField
  | BooleanField | PhotoField | TextField;
export type FieldType = FieldDef['type'];

export interface StepDef {
  id: string;
  title: Bi;
  intro?: Bi;
  fields: readonly FieldDef[];
  visible_when?: readonly Cond[];
}

// ── Values ────────────────────────────────────────────────────────────────────

export type AreaValue =
  | { shape: 'rect'; length_ft: number; width_ft: number }
  | { shape: 'l_shape'; a_length_ft: number; a_width_ft: number; b_length_ft: number; b_width_ft: number }
  | { shape: 'circle'; diameter_ft: number }
  | { shape: 'direct_sf'; area_sf: number };

export type FieldValue = AreaValue | number | string | string[] | boolean;
export type SpecValues = Record<string, FieldValue>;

/**
 * Where a value came from. Quantity-driving `photo_estimate` values widen the price range. `default` =
 * pre-filled by the intake (field default / entry-point preset) and never touched by a person — the AI
 * may suggest over it; it never suggests over any other provenance.
 */
export type Provenance = 'default' | 'client' | 'ai_confirmed' | 'photo_estimate' | 'contractor';

/** The persisted scope spec (JSONB). */
export interface ScopeSpec {
  trade_key: string;
  intake_version: number;
  values: SpecValues;
  provenance: Record<string, Provenance>;
}

/** Numbers derived from values (area_sf, perimeter_lf, concrete_cy …) for quantities + requirements. */
export type Derived = Record<string, number>;

// ── Requirements checklist ("everything needed to get it done") ─────────────────

export type RequirementLevel = 'required' | 'likely' | 'info';
export interface RequirementItem {
  id: string;
  level: RequirementLevel;
  title: Bi;
  body: Bi;
  /** Who acts on it. */
  owner: 'client' | 'contractor';
  /** 'baseline' (framework) or the trade key that added it. */
  source: string;
}

/** Answers from the common (request-level) steps, see common-steps.ts. */
export interface CommonValues {
  property_type?: 'house' | 'townhome' | 'condo' | 'commercial';
  ownership?: 'own' | 'rent';
  hoa?: 'yes' | 'no' | 'unsure';
  [k: string]: FieldValue | undefined;
}

export interface AhjContact { name?: string | null; phone?: string | null; level?: string | null }

export interface ReqCtx {
  common: CommonValues;
  /** Matched permit office for the project's location, when the jurisdiction engine has one. */
  ahj: AhjContact | null;
}

export type PermitLikelihood = 'likely' | 'depends' | 'unlikely';

// ── The module ────────────────────────────────────────────────────────────────

export interface EntryPoint {
  /** Unique across ALL modules (guard-tested) — the picker's id. */
  id: string;
  label: Bi;
  keywords: { en: readonly string[]; es: readonly string[] };
  /** Values pre-filled when the client starts from this entry point. */
  preset: SpecValues;
}

export interface TradeIntakeModule {
  /** Canonical taxonomy key (lib/trades/taxonomy.ts), never an umbrella key. */
  trade_key: string;
  /** Bump on ANY change in field meaning/options; never reuse a field id. */
  intake_version: number;
  entry_points: readonly EntryPoint[];
  location: 'exterior' | 'interior' | 'either';
  /** Overrides the category-derived "call 811" rule (fence posts, deck footings …). */
  disturbs_ground?: boolean;
  capabilities: { priced: boolean; renderable: boolean; photo_assess: boolean };
  steps: readonly StepDef[];
  /** Every assembly code scopeToQuantities may emit — guard-tested against the system catalog. */
  catalog_codes: readonly string[];
  derive?(v: SpecValues): Derived;
  /** Leave `trade` unset on coded lines — the catalog row's trade wins. */
  scopeToQuantities(v: SpecValues, d: Derived): QuantityInput[];
  /** Image prompt: scene + one fragment per field id in `order` (option/boolean fragments only). */
  prompt: { scene: string; order: readonly string[]; suffix?: string };
  permit_rule?(v: SpecValues, d: Derived): PermitLikelihood;
  requirements?(v: SpecValues, d: Derived, ctx: ReqCtx): RequirementItem[];
  /** Range widening. Defaults: base 10%, unverified +15%. */
  range_policy?: { base_band_pct: number; unverified_band_pct: number };
  /** Short domain hint appended to the generic AI system prompt. */
  ai_hints?: string;
  /** upgrades[n] migrates values from version n to n+1. */
  upgrades: Readonly<Record<number, (old: SpecValues) => SpecValues>>;
  /** ≥3 at the current version + one per historical version (guard-tested). */
  fixtures: readonly { name: string; version: number; values: SpecValues }[];
}
