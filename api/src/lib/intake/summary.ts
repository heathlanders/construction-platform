// intake/summary.ts — client-facing views generated from step data: the localized intake schema the
// trade-agnostic web wizard renders, and the human summary of a spec (frozen at submit).

import { handlerFor } from './fields.js';
import { allFields, isFieldVisible } from './spec.js';
import type { Bi, FieldDef, Lang, SpecValues, StepDef } from './types.js';

const pickLang = (b: Bi | undefined, lang: Lang) => (b ? b[lang] : undefined);

/**
 * Steps with every Bi resolved to one language. Option `prompt` fragments are internal and stripped;
 * visibility conditions are kept so the web can show/hide live.
 */
export function localizeSteps(steps: readonly StepDef[], lang: Lang) {
  return steps.map((s) => ({
    id: s.id,
    title: s.title[lang],
    intro: pickLang(s.intro, lang),
    visible_when: s.visible_when ?? [],
    fields: s.fields.map((f) => localizeField(f, lang)),
  }));
}

function localizeField(f: FieldDef, lang: Lang) {
  const { label, help, ...rest } = f as FieldDef & { prompt_true?: string };
  const out: Record<string, unknown> = { ...rest, label: label[lang], help: pickLang(help, lang) };
  delete out.prompt_true;
  if (f.type === 'choice' || f.type === 'multichoice') {
    out.options = f.options.map((o) => ({ value: o.value, label: o.label[lang], help: pickLang(o.help, lang), swatch: o.swatch }));
  }
  return out;
}

export interface SummaryLine { field: string; label: Bi; value: Bi }

/** Visible answered fields as bilingual label/value pairs, in intake order. */
export function summarizeSpec(steps: readonly StepDef[], values: SpecValues): SummaryLine[] {
  return allFields(steps)
    .filter(({ field }) => values[field.id] !== undefined && field.type !== 'photo' && isFieldVisible(steps, field.id, values))
    .map(({ field }) => {
      const h = handlerFor(field);
      const v = values[field.id]!;
      return { field: field.id, label: field.label, value: { en: h.summary(field, v, 'en'), es: h.summary(field, v, 'es') } };
    });
}
