// intake/ai-schema.ts — the AI guide, generated generically FROM a module's step data.
//
// Same discipline as blueprint vision.ts: ONE source (the step definitions) builds both the model's
// structured-output schema and the validator applied to its reply, so they can't drift. Every
// suggestion is checked against its own field validator; bad ones are dropped, the rest kept; any
// structural failure returns null and the deterministic wizard continues. AI output is SUGGESTIONS
// ONLY — the client accepts a chip, which writes through applyPatch (invariant 7).

import { z } from 'zod';
import { handlerFor, isAiField } from './fields.js';
import { allFields, isFieldVisible, validateFieldValue } from './spec.js';
import type { FieldDef, FieldValue, Provenance, ScopeSpec, SpecValues, TradeIntakeModule } from './types.js';

export type AiMode = 'assess' | 'guide';

export interface AiSuggestion {
  field: string;
  value: FieldValue;
  confidence: number;
  reason: { en: string; es: string };
  /** Provenance the value takes IF accepted: photo estimates stay unverified. */
  provenance: Provenance;
}

export interface AiGuideResult {
  suggestions: AiSuggestion[];
  next_field: string | null;
  /** Suggestions the validator removed (telemetry only). */
  stripped: number;
}

const REASON_MAX = 280;

/** Fields eligible for a mode: assess = ai_assessable, guide = ai_suggestible (both: visible ones). */
export function aiFieldsFor(module: TradeIntakeModule, mode: AiMode, values: SpecValues): FieldDef[] {
  return allFields(module.steps)
    .map((x) => x.field)
    .filter((f) => isAiField(f))
    .filter((f) => (mode === 'assess'
      ? (f as { ai_assessable?: boolean }).ai_assessable
      : (f as { ai_suggestible?: boolean }).ai_suggestible))
    .filter((f) => isFieldVisible(module.steps, f.id, values));
}

/**
 * JSON schema for the model's structured output. `value` is a oneOf keyed by field — a model that
 * ignores it is still caught by `validateAiReply`.
 */
export function compileAiSchema(module: TradeIntakeModule, mode: AiMode, values: SpecValues): Record<string, unknown> {
  const fields = aiFieldsFor(module, mode, values);
  const ids = fields.map((f) => f.id);
  return {
    type: 'object',
    properties: {
      suggestions: {
        type: 'array',
        maxItems: Math.max(1, fields.length),
        items: {
          oneOf: fields.map((f) => ({
            type: 'object',
            properties: {
              field: { const: f.id },
              value: handlerFor(f).aiSchema(f),
              confidence: { type: 'number', minimum: 0, maximum: 1 },
              reason_en: { type: 'string', maxLength: REASON_MAX },
              reason_es: { type: 'string', maxLength: REASON_MAX },
            },
            required: ['field', 'value', 'confidence', 'reason_en', 'reason_es'],
          })),
        },
      },
      next_field: ids.length ? { enum: [...ids, null] } : { type: 'null' },
    },
    required: ['suggestions'],
  };
}

/** Human-readable field guide for the system prompt (English; ids + options/bounds from the data). */
export function describeFieldsForAi(module: TradeIntakeModule, mode: AiMode, values: SpecValues): string {
  return aiFieldsFor(module, mode, values).map((f) => {
    let detail = '';
    if (f.type === 'choice' || f.type === 'multichoice') detail = ` options: ${f.options.map((o) => `${o.value} (${o.label.en})`).join(', ')}`;
    else if (f.type === 'area') detail = ` area ${f.min_sf}–${f.max_sf} sq ft`;
    else if (f.type === 'linear') detail = ` ${f.min_lf}–${f.max_lf} linear ft`;
    else if (f.type === 'count' || f.type === 'number') detail = ` ${f.min}–${f.max}`;
    const cur = values[f.id] === undefined ? '' : ` [current: ${JSON.stringify(values[f.id])}]`;
    return `- ${f.id}: ${f.label.en}.${detail}${cur}`;
  }).join('\n');
}

/** System prompt for either mode. Client free text goes ONLY in the user turn (never here). */
export function aiSystemPrompt(module: TradeIntakeModule, mode: AiMode, values: SpecValues): string {
  const task = mode === 'assess'
    ? 'Look at the site photos and estimate only what is clearly visible. Omit any field you cannot see.'
    : 'Help a homeowner decide. Suggest values only for fields their message gives you a reason for, and name the single most useful next field to ask about.';
  return [
    `You assist with a ${module.trade_key.replace(/_/g, ' ')} project request.`,
    task,
    'Only use the field ids and option values listed. Give each reason in English (reason_en) and Spanish (reason_es), one short sentence each.',
    'Never invent prices, measurements you cannot see, or fields not listed.',
    module.ai_hints ?? '',
    'Fields:',
    describeFieldsForAi(module, mode, values),
  ].filter(Boolean).join('\n');
}

const replyShape = z.object({
  suggestions: z.array(z.object({
    field: z.string(),
    value: z.unknown(),
    confidence: z.number().catch(0.5),
    reason_en: z.string().catch(''),
    reason_es: z.string().catch(''),
  }).passthrough()).catch([]),
  next_field: z.string().nullable().catch(null).optional(),
}).passthrough();

/**
 * Validate a model reply against the module. Per-suggestion strip; structural garbage → null.
 * Never throws. A suggestion is dropped when the field already holds a value a PERSON set (any
 * provenance but `default`) — the AI never overwrites a human answer, but it may improve on an
 * intake default the client hasn't touched.
 */
export function validateAiReply(
  module: TradeIntakeModule, mode: AiMode, spec: Pick<ScopeSpec, 'values' | 'provenance'>, raw: unknown,
): AiGuideResult | null {
  const { values, provenance } = spec;
  let obj: unknown = raw;
  try {
    if (typeof raw === 'string') obj = JSON.parse(raw);
  } catch {
    return null;
  }
  const parsed = replyShape.safeParse(obj);
  if (!parsed.success) return null;

  const eligible = new Map(aiFieldsFor(module, mode, values).map((f) => [f.id, f]));
  const out: AiSuggestion[] = [];
  const seen = new Set<string>();
  let stripped = 0;
  for (const s of parsed.data.suggestions) {
    const def = eligible.get(s.field);
    const value = def ? validateFieldValue(def, s.value) : undefined;
    const humanSet = values[s.field] !== undefined && (provenance[s.field] ?? 'client') !== 'default';
    if (!def || value === undefined || seen.has(s.field) || humanSet || JSON.stringify(values[s.field]) === JSON.stringify(value)) {
      stripped++;
      continue;
    }
    seen.add(s.field);
    out.push({
      field: s.field,
      value,
      confidence: Math.min(1, Math.max(0, s.confidence)),
      reason: { en: s.reason_en.slice(0, REASON_MAX), es: s.reason_es.slice(0, REASON_MAX) },
      provenance: mode === 'assess' ? 'photo_estimate' : 'ai_confirmed',
    });
  }
  const nf = parsed.data.next_field ?? null;
  return { suggestions: out, next_field: nf && eligible.has(nf) ? nf : null, stripped };
}
