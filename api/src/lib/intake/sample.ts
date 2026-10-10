// intake/sample.ts — seeded generator of VALID specs straight from step data (guard-test fuzzing, demo
// data). Walks the intake in order so visibility is honored exactly as the validator sees it.

import { FIELD_HANDLERS, seededRng, type Rng } from './fields.js';
import { allFields, evalCond, sanitizeValues } from './spec.js';
import type { FieldDef, SpecValues, StepDef } from './types.js';

export function generateValues(steps: readonly StepDef[], r: Rng, opts: { fillOptional?: number } = {}): SpecValues {
  const fill = opts.fillOptional ?? 0.6;
  const values: SpecValues = {};
  for (const { step, field } of allFields(steps)) {
    const visible = (step.visible_when ?? []).every((c) => evalCond(c, values))
      && (field.visible_when ?? []).every((c) => evalCond(c, values));
    if (!visible) continue;
    if (!field.required && r() > fill) continue;
    values[field.id] = (FIELD_HANDLERS[field.type] as { sample(d: FieldDef, r: Rng): SpecValues[string] }).sample(field, r);
  }
  // Round-trip through the validator so callers always get the canonical (sanitized) form.
  return sanitizeValues(steps, values).values;
}

export function generateMany(steps: readonly StepDef[], n: number, seed = 1): SpecValues[] {
  const r = seededRng(seed);
  return Array.from({ length: n }, () => generateValues(steps, r));
}
