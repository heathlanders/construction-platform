// intake/spec.ts — spec validation + versioning, generated from a module's step data.
//
// Validation is STRIP-don't-reject (vision.ts pattern): invalid values and values of hidden fields are
// dropped, never a hard failure — a draft is always saveable. Completeness is a separate question
// (`missingRequired`) asked at submit time. Invariant 7: the spec is only ever written through
// `sanitizeValues`; AI output is merely a suggestion run through the same validators.

import { z } from 'zod';
import { handlerFor } from './fields.js';
import type {
  Cond, FieldDef, FieldValue, Provenance, ScopeSpec, SpecValues, StepDef, TradeIntakeModule,
} from './types.js';

/** All fields in intake order, with the step they belong to. */
export function allFields(steps: readonly StepDef[]): { step: StepDef; field: FieldDef }[] {
  return steps.flatMap((step) => step.fields.map((field) => ({ step, field })));
}

function isEmpty(v: unknown): boolean {
  return v === undefined || v === null || v === '' || v === false || (Array.isArray(v) && v.length === 0);
}

/** Evaluate one visibility condition against already-sanitized values. */
export function evalCond(c: Cond, values: SpecValues): boolean {
  const v = values[c.field];
  if (c.truthy !== undefined && isEmpty(v) === c.truthy) return false;
  const hits = (xs: readonly unknown[]) => (Array.isArray(v) ? v.some((x) => xs.includes(x)) : xs.includes(v));
  if (c.in && !hits(c.in)) return false;
  if (c.not_in && v !== undefined && hits(c.not_in)) return false;
  return true;
}

const allPass = (conds: readonly Cond[] | undefined, values: SpecValues) =>
  (conds ?? []).every((c) => evalCond(c, values));

/** Validate one value against its field definition. Returns undefined when invalid. */
export function validateFieldValue(def: FieldDef, raw: unknown): FieldValue | undefined {
  if (raw === undefined || raw === null) return undefined;
  const r = handlerFor(def).zod(def).safeParse(raw);
  return r.success ? (r.data as FieldValue) : undefined;
}

export interface SanitizeResult {
  values: SpecValues;
  /** Field ids whose submitted value was dropped (invalid or hidden). */
  dropped: string[];
}

/**
 * Keep only valid values of VISIBLE fields, walking in intake order so visibility is evaluated against
 * earlier sanitized answers. Unknown keys are dropped. Never throws.
 */
export function sanitizeValues(steps: readonly StepDef[], raw: unknown): SanitizeResult {
  const input = (raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {}) as Record<string, unknown>;
  const values: SpecValues = {};
  const dropped: string[] = [];
  const known = new Set<string>();
  for (const { step, field } of allFields(steps)) {
    known.add(field.id);
    if (!(field.id in input)) continue;
    const visible = allPass(step.visible_when, values) && allPass(field.visible_when, values);
    const v = visible ? validateFieldValue(field, input[field.id]) : undefined;
    if (v === undefined) dropped.push(field.id);
    else values[field.id] = v;
  }
  for (const k of Object.keys(input)) if (!known.has(k)) dropped.push(k);
  return { values, dropped };
}

/** Is this field currently shown, given (sanitized) values? */
export function isFieldVisible(steps: readonly StepDef[], fieldId: string, values: SpecValues): boolean {
  const hit = allFields(steps).find((x) => x.field.id === fieldId);
  return !!hit && allPass(hit.step.visible_when, values) && allPass(hit.field.visible_when, values);
}

/** Required + visible fields that have no value. Empty list = complete. */
export function missingRequired(steps: readonly StepDef[], values: SpecValues): string[] {
  return allFields(steps)
    .filter(({ step, field }) => field.required
      && allPass(step.visible_when, values) && allPass(field.visible_when, values)
      && isEmpty(values[field.id]) && !(field.type === 'boolean' && values[field.id] === false))
    .map(({ field }) => field.id);
}

/** Apply field defaults for visible, unset fields (wizard initial state). */
export function withDefaults(steps: readonly StepDef[], values: SpecValues): SpecValues {
  const out = { ...values };
  for (const { step, field } of allFields(steps)) {
    if (out[field.id] !== undefined) continue;
    if (!allPass(step.visible_when, out) || !allPass(field.visible_when, out)) continue;
    const d = (field as { default?: FieldValue }).default;
    if (d !== undefined) out[field.id] = d;
  }
  return out;
}

const PROVENANCE: readonly Provenance[] = ['default', 'client', 'ai_confirmed', 'photo_estimate', 'contractor'];

/** Persisted envelope shape (JSONB). Values are validated per-field separately (sanitizeValues). */
export const scopeSpecEnvelope = z.object({
  trade_key: z.string().min(1),
  intake_version: z.number().int().positive(),
  values: z.record(z.unknown()).default({}),
  provenance: z.record(z.enum(PROVENANCE as [Provenance, ...Provenance[]])).catch({}).default({}),
});

export class IntakeVersionError extends Error {
  constructor(public code: 'TRADE_MISMATCH' | 'FUTURE_VERSION' | 'MISSING_UPGRADE', message: string) {
    super(message);
  }
}

/**
 * Load a stored spec into the module's CURRENT version: run upgrades[n] for each version step, then
 * sanitize. Provenance is kept only for fields that survived. Throws IntakeVersionError on a spec that
 * can't be brought forward (wrong trade, a version newer than the code, or a gap in upgrades).
 */
export function loadSpec(module: TradeIntakeModule, raw: unknown): { spec: ScopeSpec; upgraded: boolean; dropped: string[] } {
  const env = scopeSpecEnvelope.parse(raw);
  if (env.trade_key !== module.trade_key) {
    throw new IntakeVersionError('TRADE_MISMATCH', `spec is for ${env.trade_key}, module is ${module.trade_key}`);
  }
  if (env.intake_version > module.intake_version) {
    throw new IntakeVersionError('FUTURE_VERSION', `spec v${env.intake_version} is newer than module v${module.intake_version}`);
  }
  let values = env.values as SpecValues;
  for (let v = env.intake_version; v < module.intake_version; v++) {
    const up = module.upgrades[v];
    if (!up) throw new IntakeVersionError('MISSING_UPGRADE', `${module.trade_key}: no upgrade from v${v}`);
    values = up(values);
  }
  const { values: clean, dropped } = sanitizeValues(module.steps, values);
  const provenance: Record<string, Provenance> = {};
  for (const [k, p] of Object.entries(env.provenance)) if (k in clean) provenance[k] = p;
  return {
    spec: { trade_key: module.trade_key, intake_version: module.intake_version, values: clean, provenance },
    upgraded: env.intake_version !== module.intake_version,
    dropped,
  };
}

/** A fresh spec for a module, optionally from an entry-point preset. Pre-filled values are `default`. */
export function newSpec(module: TradeIntakeModule, entryPointId?: string): ScopeSpec {
  const preset = module.entry_points.find((e) => e.id === entryPointId)?.preset ?? {};
  const { values } = sanitizeValues(module.steps, withDefaults(module.steps, preset));
  const provenance: Record<string, Provenance> = {};
  for (const k of Object.keys(values)) provenance[k] = 'default';
  return { trade_key: module.trade_key, intake_version: module.intake_version, values, provenance };
}

/**
 * Merge a client/AI/contractor patch into a spec. Each patched field takes `source` provenance; the
 * result is re-sanitized (a patch that hides a field drops its old value).
 */
export function applyPatch(module: TradeIntakeModule, spec: ScopeSpec, patch: Record<string, unknown>, source: Provenance): {
  spec: ScopeSpec; dropped: string[];
} {
  const merged: Record<string, unknown> = { ...spec.values };
  for (const [k, v] of Object.entries(patch)) {
    if (v === null) delete merged[k];
    else merged[k] = v;
  }
  const { values, dropped } = sanitizeValues(module.steps, merged);
  const provenance: Record<string, Provenance> = {};
  for (const k of Object.keys(values)) {
    provenance[k] = k in patch && !dropped.includes(k) ? source : (spec.provenance[k] ?? 'client');
  }
  return { spec: { ...spec, values, provenance }, dropped: dropped.filter((k) => k in patch) };
}
