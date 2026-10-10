// intake/fields.ts — the shared field-type library. One handler per field type, used by EVERY trade:
// value validator (zod), AI JSON-schema fragment, client summary line, image-prompt fragment, and a
// seeded sample generator (guard-test fuzzing). The area/shape calculator lives here once.
//
// Pure, no I/O.

import { z } from 'zod';
import type {
  AreaField, AreaValue, FieldDef, FieldValue, Lang, Option,
} from './types.js';
import { describeArea, describeLength } from './scale.js';

/** Deterministic PRNG for fixture/fuzz generation (mulberry32). Returns [0,1). */
export type Rng = () => number;
export function seededRng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const pick = <T>(r: Rng, xs: readonly T[]): T => xs[Math.floor(r() * xs.length)]!;
const between = (r: Rng, lo: number, hi: number) => lo + r() * (hi - lo);
const round1 = (n: number) => Math.round(n * 10) / 10;

// ── Area / shape calculator ───────────────────────────────────────────────────

const dim = z.number().finite().positive().max(10_000);

export const areaValueSchema = z.discriminatedUnion('shape', [
  z.object({ shape: z.literal('rect'), length_ft: dim, width_ft: dim }).strip(),
  z.object({
    shape: z.literal('l_shape'), a_length_ft: dim, a_width_ft: dim, b_length_ft: dim, b_width_ft: dim,
  }).strip(),
  z.object({ shape: z.literal('circle'), diameter_ft: dim }).strip(),
  z.object({ shape: z.literal('direct_sf'), area_sf: z.number().finite().positive().max(10_000_000) }).strip(),
]);

/**
 * Area + perimeter of a shape. L-shape = two rectangles sharing a corner, legs measured to the outside
 * corner (perimeter = 2 × (overall length + overall width)). `direct_sf` has no shape → perimeter
 * estimated as a square's (labeled an assumption by callers).
 */
export function areaMetrics(v: AreaValue): { area_sf: number; perimeter_lf: number; perimeter_estimated: boolean } {
  switch (v.shape) {
    case 'rect':
      return { area_sf: v.length_ft * v.width_ft, perimeter_lf: 2 * (v.length_ft + v.width_ft), perimeter_estimated: false };
    case 'l_shape': {
      // Leg A runs the full length; leg B extends from A's end, sharing A's width.
      const area = v.a_length_ft * v.a_width_ft + v.b_length_ft * v.b_width_ft;
      const overallL = v.a_length_ft;
      const overallW = v.a_width_ft + v.b_width_ft;
      return { area_sf: area, perimeter_lf: 2 * (overallL + overallW), perimeter_estimated: false };
    }
    case 'circle': {
      const r = v.diameter_ft / 2;
      return { area_sf: Math.PI * r * r, perimeter_lf: Math.PI * v.diameter_ft, perimeter_estimated: false };
    }
    case 'direct_sf':
      return { area_sf: v.area_sf, perimeter_lf: 4 * Math.sqrt(v.area_sf), perimeter_estimated: true };
  }
}

// ── Per-type handlers ─────────────────────────────────────────────────────────

export interface FieldHandler<F extends FieldDef = FieldDef> {
  /** Value validator. Invalid values are STRIPPED by callers (never a hard reject). */
  zod(def: F): z.ZodTypeAny;
  /** JSON-schema fragment for AI structured output (enums + bounds). */
  aiSchema(def: F): Record<string, unknown>;
  /** One client-facing summary value. */
  summary(def: F, v: FieldValue, lang: Lang): string;
  /** English image-prompt fragment (option/boolean data only — never client text). */
  promptFragment(def: F, v: FieldValue): string | null;
  /** A random VALID value (fuzzing / fixtures). */
  sample(def: F, r: Rng): FieldValue;
  /** Does this value feed quantities (so a photo_estimate widens the range)? */
  quantityDriving: boolean;
}

const optionLabel = (opts: readonly Option[], value: string, lang: Lang) =>
  opts.find((o) => o.value === value)?.label[lang] ?? value;

const UNIT: Record<string, Record<Lang, string>> = {
  in: { en: 'in', es: 'pulg' }, ft: { en: 'ft', es: 'pies' }, pct: { en: '%', es: '%' },
  sf: { en: 'sq ft', es: 'pies²' }, lf: { en: 'lin ft', es: 'pies lin.' },
};
const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

const area: FieldHandler<AreaField> = {
  zod: (def) => areaValueSchema
    .refine((v) => def.shapes.includes(v.shape), 'shape not allowed')
    .refine((v) => {
      const { area_sf } = areaMetrics(v as AreaValue);
      return area_sf >= def.min_sf && area_sf <= def.max_sf;
    }, 'area out of range'),
  aiSchema: (def) => ({
    type: 'object',
    description: `Approximate area. Use shape "rect" with length_ft/width_ft (total ${def.min_sf}–${def.max_sf} sq ft).`,
    properties: { shape: { enum: ['rect'] }, length_ft: { type: 'number', minimum: 1 }, width_ft: { type: 'number', minimum: 1 } },
    required: ['shape', 'length_ft', 'width_ft'],
  }),
  summary: (_def, v, lang) => {
    const a = v as AreaValue;
    const { area_sf } = areaMetrics(a);
    const sf = `${Math.round(area_sf)} ${UNIT.sf![lang]}`;
    if (a.shape === 'rect') return `${fmt(a.length_ft)} × ${fmt(a.width_ft)} ${UNIT.ft![lang]} (${sf})`;
    if (a.shape === 'circle') return `⌀ ${fmt(a.diameter_ft)} ${UNIT.ft![lang]} (${sf})`;
    return sf;
  },
  promptFragment: (def, v) => describeArea(v as AreaValue, areaMetrics(v as AreaValue).area_sf, def.scale_ref),
  sample: (def, r) => {
    // Pick an allowed shape, then size it inside [min_sf, max_sf].
    const target = between(r, def.min_sf, Math.min(def.max_sf, def.min_sf * 20));
    const shape = pick(r, def.shapes);
    if (shape === 'circle') return { shape, diameter_ft: round1(Math.max(1, 2 * Math.sqrt(target / Math.PI))) };
    if (shape === 'direct_sf') return { shape, area_sf: Math.round(target) };
    const w = round1(Math.max(1, Math.sqrt(target) * between(r, 0.6, 1)));
    const l = round1(Math.max(1, target / w));
    if (shape === 'rect') return { shape, length_ft: l, width_ft: w };
    const aw = round1(Math.max(1, w * 0.6));
    return { shape, a_length_ft: l, a_width_ft: aw, b_length_ft: round1(Math.max(1, l * 0.4)), b_width_ft: round1(Math.max(1, w - aw)) };
  },
  quantityDriving: true,
};

function numeric<F extends FieldDef & { min?: number; max?: number }>(
  lo: (d: F) => number, hi: (d: F) => number, unit: (d: F) => string, integer: boolean,
  prompt: (v: number) => string | null = () => null,
): FieldHandler<F> {
  return {
    zod: (def) => {
      let s = z.number().finite().min(lo(def)).max(hi(def));
      if (integer) s = s.int();
      return s;
    },
    aiSchema: (def) => ({ type: integer ? 'integer' : 'number', minimum: lo(def), maximum: hi(def) }),
    summary: (def, v, lang) => {
      const u = unit(def);
      return u ? `${fmt(v as number)} ${UNIT[u]?.[lang] ?? u}` : fmt(v as number);
    },
    promptFragment: (_def, v) => prompt(v as number),
    sample: (def, r) => {
      const n = between(r, lo(def), hi(def));
      return integer ? Math.round(n) : round1(n);
    },
    quantityDriving: true,
  };
}

const choice: FieldHandler<Extract<FieldDef, { type: 'choice' }>> = {
  zod: (def) => z.enum(def.options.map((o) => o.value) as [string, ...string[]]),
  aiSchema: (def) => ({ enum: def.options.map((o) => o.value) }),
  summary: (def, v, lang) => optionLabel(def.options, v as string, lang),
  promptFragment: (def, v) => def.options.find((o) => o.value === v)?.prompt ?? null,
  sample: (def, r) => pick(r, def.options).value,
  quantityDriving: true,
};

const multichoice: FieldHandler<Extract<FieldDef, { type: 'multichoice' }>> = {
  zod: (def) => {
    const values = def.options.map((o) => o.value) as [string, ...string[]];
    return z.array(z.enum(values))
      .max(def.max_select ?? def.options.length)
      .transform((xs) => [...new Set(xs)]);
  },
  aiSchema: (def) => ({
    type: 'array', items: { enum: def.options.map((o) => o.value) }, maxItems: def.max_select ?? def.options.length,
  }),
  summary: (def, v, lang) => {
    const xs = v as string[];
    return xs.length ? xs.map((x) => optionLabel(def.options, x, lang)).join(', ') : (lang === 'es' ? 'Ninguno' : 'None');
  },
  promptFragment: (def, v) => {
    const frags = (v as string[]).map((x) => def.options.find((o) => o.value === x)?.prompt).filter(Boolean);
    return frags.length ? frags.join(', ') : null;
  },
  sample: (def, r) => {
    const cap = def.max_select ?? def.options.length;
    return def.options.filter(() => r() < 0.35).slice(0, cap).map((o) => o.value);
  },
  quantityDriving: true,
};

const boolean: FieldHandler<Extract<FieldDef, { type: 'boolean' }>> = {
  zod: () => z.boolean(),
  aiSchema: () => ({ type: 'boolean' }),
  summary: (_d, v, lang) => (v ? (lang === 'es' ? 'Sí' : 'Yes') : 'No'),
  promptFragment: (def, v) => (v && def.prompt_true ? def.prompt_true : null),
  sample: (_d, r) => r() < 0.5,
  quantityDriving: true,
};

const photo: FieldHandler<Extract<FieldDef, { type: 'photo' }>> = {
  zod: (def) => z.array(z.string().uuid()).min(def.min).max(def.max),
  aiSchema: () => ({}),
  summary: (_d, v, lang) => `${(v as string[]).length} ${lang === 'es' ? 'foto(s)' : 'photo(s)'}`,
  promptFragment: () => null,
  sample: (def, r) => Array.from({ length: Math.max(def.min, Math.min(def.max, 1 + Math.floor(r() * 3))) }, (_, i) =>
    `00000000-0000-4000-8000-${String(i).padStart(12, '0')}`),
  quantityDriving: false,
};

const text: FieldHandler<Extract<FieldDef, { type: 'text' }>> = {
  zod: (def) => z.string().transform((s) => s.replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, '').trim()).pipe(z.string().max(def.max_len)),
  aiSchema: () => ({}),
  summary: (_d, v) => v as string,
  promptFragment: () => null, // NEVER — prompt-injection boundary
  sample: (def, r) => 'Sample note '.repeat(1 + Math.floor(r() * 3)).trim().slice(0, def.max_len),
  quantityDriving: false,
};

export const FIELD_HANDLERS = {
  area,
  linear: numeric<Extract<FieldDef, { type: 'linear' }>>((d) => d.min_lf, (d) => d.max_lf, () => 'lf', false, describeLength),
  count: numeric<Extract<FieldDef, { type: 'count' }>>((d) => d.min, (d) => d.max, () => '', true),
  number: numeric<Extract<FieldDef, { type: 'number' }>>((d) => d.min, (d) => d.max, (d) => d.unit, false),
  choice,
  multichoice,
  boolean,
  photo,
  text,
} as const;

/** Handler for any field def (type-erased). */
export function handlerFor(def: FieldDef): FieldHandler {
  return FIELD_HANDLERS[def.type] as unknown as FieldHandler;
}

/** Fields the AI may fill (photo assess and/or help-me-decide). Photo/text never qualify. */
export function isAiField(def: FieldDef): boolean {
  if (def.type === 'photo' || def.type === 'text') return false;
  return Boolean((def as { ai_assessable?: boolean }).ai_assessable || (def as { ai_suggestible?: boolean }).ai_suggestible);
}
