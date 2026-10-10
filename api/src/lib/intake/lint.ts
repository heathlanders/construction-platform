// intake/lint.ts — structural guards for a trade intake module (pure). Returns a list of problems;
// empty = sound. Run by api/src/test/intake-registry.test.ts over EVERY registered module, so adding a
// trade can't silently ship a broken intake. DB-backed checks (catalog codes exist) and fuzzing live
// in the test file.

import { tradeDef } from '../trades/taxonomy.js';
import { isAiField } from './fields.js';
import { isSafeFragment } from './prompt.js';
import { allFields, loadSpec, sanitizeValues } from './spec.js';
import type { Bi, FieldDef, TradeIntakeModule } from './types.js';

/** Spanish strings allowed to equal English (cognates/symbols). Keep tiny. */
export const BI_SAME_ALLOWLIST = new Set(['No', '%', 'OK', 'Patio', 'Color']);

function biProblems(path: string, b: Bi | undefined, out: string[]) {
  if (!b) return;
  if (!b.en?.trim()) out.push(`${path}: empty en`);
  if (!b.es?.trim()) out.push(`${path}: empty es`);
  if (b.en && b.es && b.en === b.es && !BI_SAME_ALLOWLIST.has(b.en)) out.push(`${path}: es identical to en ("${b.en}")`);
}

function fieldBis(f: FieldDef, path: string, out: string[]) {
  biProblems(`${path}.label`, f.label, out);
  biProblems(`${path}.help`, f.help, out);
  if (f.type === 'choice' || f.type === 'multichoice') {
    f.options.forEach((o) => { biProblems(`${path}.${o.value}.label`, o.label, out); biProblems(`${path}.${o.value}.help`, o.help, out); });
  }
}

export function lintModule(m: TradeIntakeModule): string[] {
  const out: string[] = [];
  const p = m.trade_key;

  // 1. Taxonomy key, not umbrella.
  const def = tradeDef(m.trade_key);
  if (!def || def.key !== m.trade_key) out.push(`${p}: not a canonical taxonomy key`);
  else if (def.umbrella) out.push(`${p}: umbrella trade keys can't have an intake module`);
  if (!Number.isInteger(m.intake_version) || m.intake_version < 1) out.push(`${p}: bad intake_version`);

  // 5. Step integrity.
  const fields = allFields(m.steps);
  const ids = new Set<string>();
  const stepIds = new Set<string>();
  const optionsById = new Map<string, Set<string> | null>();
  for (const s of m.steps) {
    if (stepIds.has(s.id)) out.push(`${p}: duplicate step id ${s.id}`);
    stepIds.add(s.id);
    biProblems(`${p}.step.${s.id}.title`, s.title, out);
    biProblems(`${p}.step.${s.id}.intro`, s.intro, out);
    for (const c of s.visible_when ?? []) {
      if (!ids.has(c.field)) out.push(`${p}: step ${s.id} visible_when refs unknown/later field ${c.field}`);
    }
    for (const f of s.fields) {
      if (ids.has(f.id)) out.push(`${p}: duplicate field id ${f.id}`);
      if (!/^[a-z][a-z0-9_]*$/.test(f.id)) out.push(`${p}: field id ${f.id} not snake_case`);
      for (const c of f.visible_when ?? []) {
        if (!ids.has(c.field)) { out.push(`${p}: ${f.id} visible_when refs unknown/later field ${c.field}`); continue; }
        const opts = optionsById.get(c.field);
        for (const v of [...(c.in ?? []), ...(c.not_in ?? [])]) {
          if (opts && !opts.has(String(v))) out.push(`${p}: ${f.id} visible_when ${c.field} uses unknown option ${String(v)}`);
        }
      }
      fieldBis(f, `${p}.${f.id}`, out);
      if (f.type === 'choice' || f.type === 'multichoice') {
        const vals = f.options.map((o) => o.value);
        if (!vals.length) out.push(`${p}: ${f.id} has no options`);
        if (new Set(vals).size !== vals.length) out.push(`${p}: ${f.id} duplicate option values`);
        for (const o of f.options) if (o.prompt && !isSafeFragment(o.prompt)) out.push(`${p}: ${f.id}.${o.value} unsafe prompt fragment`);
        if (f.type === 'choice' && f.default !== undefined && !vals.includes(f.default)) out.push(`${p}: ${f.id} default not an option`);
        optionsById.set(f.id, new Set(vals));
      } else optionsById.set(f.id, null);
      if (f.type === 'boolean' && f.prompt_true && !isSafeFragment(f.prompt_true)) out.push(`${p}: ${f.id} unsafe prompt_true`);
      if (f.type === 'area' && (f.min_sf <= 0 || f.max_sf <= f.min_sf || !f.shapes.length)) out.push(`${p}: ${f.id} bad area bounds/shapes`);
      if (f.type === 'linear' && (f.min_lf < 0 || f.max_lf <= f.min_lf)) out.push(`${p}: ${f.id} bad linear bounds`);
      if ((f.type === 'count' || f.type === 'number') && f.max <= f.min) out.push(`${p}: ${f.id} bad bounds`);
      if (f.type === 'number' && f.default !== undefined && (f.default < f.min || f.default > f.max)) out.push(`${p}: ${f.id} default out of bounds`);
      if (f.type === 'photo' && (f.min < 0 || f.max < Math.max(1, f.min))) out.push(`${p}: ${f.id} bad photo bounds`);
      ids.add(f.id);
    }
  }

  // Prompt order refs real, prompt-capable fields.
  if (!isSafeFragment(m.prompt.scene)) out.push(`${p}: unsafe prompt scene`);
  if (m.prompt.suffix && !isSafeFragment(m.prompt.suffix)) out.push(`${p}: unsafe prompt suffix`);
  const fieldById = new Map(fields.map((x) => [x.field.id, x.field]));
  for (const id of m.prompt.order) {
    const f = fieldById.get(id);
    if (!f) out.push(`${p}: prompt.order refs unknown field ${id}`);
    else if (f.type === 'text' || f.type === 'photo') out.push(`${p}: prompt.order refs ${f.type} field ${id} (forbidden)`);
  }

  // 7. Capability consistency.
  if (m.capabilities.priced && !m.catalog_codes.length) out.push(`${p}: priced but no catalog_codes`);
  if (m.capabilities.renderable && !fields.some((x) => x.field.type === 'photo')) out.push(`${p}: renderable but no photo field`);
  if (m.capabilities.renderable && !m.prompt.scene.trim()) out.push(`${p}: renderable but empty prompt scene`);
  if (m.capabilities.photo_assess && !fields.some((x) => (x.field as { ai_assessable?: boolean }).ai_assessable && isAiField(x.field))) {
    out.push(`${p}: photo_assess but no ai_assessable field`);
  }
  if (new Set(m.catalog_codes).size !== m.catalog_codes.length) out.push(`${p}: duplicate catalog_codes`);

  // Entry points.
  for (const e of m.entry_points) {
    biProblems(`${p}.entry.${e.id}.label`, e.label, out);
    if (!e.keywords.en.length || !e.keywords.es.length) out.push(`${p}: entry ${e.id} needs en+es keywords`);
    const { dropped } = sanitizeValues(m.steps, e.preset);
    if (dropped.length) out.push(`${p}: entry ${e.id} preset has invalid/hidden fields ${dropped.join(',')}`);
  }
  if (!m.entry_points.length) out.push(`${p}: no entry points`);

  // 6. Fixtures: ≥3 at current version; one per historical version; all load with nothing dropped.
  const current = m.fixtures.filter((f) => f.version === m.intake_version);
  if (current.length < 3) out.push(`${p}: needs ≥3 fixtures at v${m.intake_version} (has ${current.length})`);
  for (let v = 1; v < m.intake_version; v++) {
    if (!m.upgrades[v]) out.push(`${p}: missing upgrade from v${v}`);
    if (!m.fixtures.some((f) => f.version === v)) out.push(`${p}: no fixture for historical v${v}`);
  }
  for (const fx of m.fixtures) {
    try {
      const { dropped } = loadSpec(m, { trade_key: m.trade_key, intake_version: fx.version, values: fx.values });
      if (dropped.length) out.push(`${p}: fixture "${fx.name}" drops ${dropped.join(',')}`);
    } catch (e) {
      out.push(`${p}: fixture "${fx.name}" fails to load: ${(e as Error).message}`);
    }
  }
  return out;
}

/** Cross-module checks: unique entry-point ids, registry key = module key. */
export function lintRegistry(entries: readonly [string, TradeIntakeModule][]): string[] {
  const out: string[] = [];
  const seenEntry = new Map<string, string>();
  for (const [key, m] of entries) {
    if (key !== m.trade_key) out.push(`registry key ${key} ≠ module ${m.trade_key}`);
    for (const e of m.entry_points) {
      const prev = seenEntry.get(e.id);
      if (prev) out.push(`entry point ${e.id} used by ${prev} and ${m.trade_key}`);
      seenEntry.set(e.id, m.trade_key);
    }
  }
  return out;
}
