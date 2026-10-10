// trades/packs/runtime.ts — the ONE place pack data turns into engine output (Doc 23 §5).
// Pure, deterministic, no I/O. Precedence everywhere: pack (when its Match hits) → hand code → generic.

import { normalizeTradeKey } from '../taxonomy.js';
import { need, type EquipmentType } from '../../task-buildout/equipment-vocab.js';
import type { BlueprintFacts, BuildContext, EquipmentNeed, WorkStep } from '../../task-buildout/types.js';
import { PACKS } from './index.js';
import type { PackComponent, PackMatch, PackQtyRule, PackRecipe, TradePack, I18nText } from './schema.js';

export { PACKS };

/**
 * Trades whose work steps are already hand-coded (task-buildout/building.ts + nopermit.ts trade
 * branches, plus the legacy family keys whose permit-family recipes ARE their hand recipe). A pack
 * recipe only replaces these when it sets `supersedes_hand: true`.
 */
export const HAND_RECIPE_KEYS: ReadonlySet<string> = new Set([
  'masonry', 'asphalt_paving', 'concrete_flatwork', 'siding', 'stucco_eifs', 'drywall', 'plaster',
  'civil', 'concrete', 'framing', 'structural', 'roofing', 'insulation',
  'painting', 'tile', 'flooring_carpet', 'flooring_wood', 'flooring_resilient', 'flooring_epoxy', 'terrazzo',
  'cabinetry', 'millwork', 'countertops', 'finish_carpentry', 'doors_hardware', 'window_treatments',
  'pavement_marking', 'final_clean', 'landscaping',
  'electrical', 'plumbing', 'hvac',
]);

export function packFor(tradeKey: string | null | undefined): TradePack | null {
  const key = normalizeTradeKey(tradeKey);
  return key ? PACKS.get(key) ?? null : null;
}

// ── Matching ──────────────────────────────────────────────────────────────────

/** A blueprint fact token is present if it is a detected component, a true flag, or a fixture type. */
export function factPresent(facts: BlueprintFacts, token: string): boolean {
  return facts.components.includes(token) || facts.flags[token] === true || facts.fixtures.some((x) => x.type === token);
}

export function matchesWhen(match: PackMatch | undefined, ctx: BuildContext, extraText = ''): boolean {
  if (!match) return true;
  const phase = ctx.task.phase ?? '';
  if (match.phase && !match.phase.includes(phase as never)) return false;
  if (match.title_re) {
    const hay = `${ctx.task.title} ${ctx.task.description ?? ''} ${extraText}`;
    if (!new RegExp(match.title_re, 'i').test(hay)) return false;
  }
  if (match.facts_any && match.facts_any.length > 0) {
    if (!match.facts_any.some((f) => factPresent(ctx.facts, f))) return false;
  }
  if (match.building_types) {
    const bts = match.building_types as readonly string[];
    // A pack may target the plan type (pole_barn) or the codes-engine type it collapses to.
    if (!bts.includes(ctx.buildingType) && !(ctx.planBuildingType && bts.includes(ctx.planBuildingType))) return false;
  }
  return true;
}

export function pickRecipe(pack: TradePack, ctx: BuildContext): PackRecipe | null {
  let best: PackRecipe | null = null;
  for (const r of pack.recipes) {
    if (!matchesWhen(r.when, ctx)) continue;
    if (!best || (r.priority ?? 0) > (best.priority ?? 0)) best = r;
  }
  return best;
}

// ── Templates ─────────────────────────────────────────────────────────────────

export const TEMPLATE_PLACEHOLDERS = [
  'ct', 'ed', 'bt', 'facts.panel_amps', 'facts.window_count', 'facts.door_count', 'facts.room_count', 'facts.area_sf',
] as const;
const PLACEHOLDER_RE = /\$\{([a-z_.]+)\}/g;

export function templatePlaceholders(s: string): string[] {
  return [...s.matchAll(PLACEHOLDER_RE)].map((m) => m[1]);
}

function placeholderValue(name: string, ctx: BuildContext): string | null {
  const f = ctx.facts;
  switch (name) {
    case 'ct': return ctx.resolved.code_type || null;
    case 'ed': return ctx.resolved.code_edition;
    case 'bt': return ctx.buildingType.replace(/_/g, ' ');
    case 'facts.panel_amps': {
      const a = f.panels.map((p) => p.amperage).find((x) => x != null);
      return a != null ? `${a}A` : null;
    }
    case 'facts.window_count': return f.window_count ? String(f.window_count) : null;
    case 'facts.door_count': return f.door_count ? String(f.door_count) : null;
    case 'facts.room_count': return f.rooms.length ? String(f.rooms.length) : null;
    case 'facts.area_sf': {
      const sf = f.rooms.reduce((s, r) => s + (r.area_sf ?? 0), 0);
      return sf > 0 ? `${Math.round(sf)} SF` : null;
    }
    default: return null;
  }
}

/** Placeholders in `s` that have no value for this context (they would render as an em dash). */
export function unresolvedPlaceholders(s: string, ctx: BuildContext): string[] {
  return templatePlaceholders(s).filter((name) => placeholderValue(name, ctx) == null);
}

/** Fill `${…}` placeholders; anything unresolved renders as an em dash (guards reject unknown names). */
export function renderTemplate(s: string, ctx: BuildContext): string {
  return s.replace(PLACEHOLDER_RE, (_m, name: string) => placeholderValue(name, ctx) ?? '—');
}

// ── Steps ─────────────────────────────────────────────────────────────────────

function hazardLines(pack: TradePack, ids: string[]): string[] {
  const byId = new Map((pack.hazards ?? []).map((h) => [h.id, h]));
  return ids.map((id) => byId.get(id)).filter(Boolean).map((h) => `${h!.hazard} — ${h!.controls[0]} (OSHA ${h!.osha_ref})`);
}

function qaLine(pack: TradePack, ids: string[] | undefined): string | undefined {
  if (!ids || ids.length === 0) return undefined;
  const byId = new Map((pack.qa_checklist ?? []).map((q) => [q.id, q]));
  const items = ids.map((id) => byId.get(id)?.item).filter(Boolean) as string[];
  return items.length ? items.join(' · ') : undefined;
}

/**
 * The pack's work steps for this task, or [] when no recipe matches. `hasPermitPath` false → code refs
 * and gating dropped (the no-permit engine path). Equipment is attached by the caller.
 */
export function renderPackSteps(pack: TradePack, ctx: BuildContext, hasPermitPath: boolean): { steps: WorkStep[]; recipe: PackRecipe | null } {
  const recipe = pickRecipe(pack, ctx);
  if (!recipe) return { steps: [], recipe: null };
  const steps = recipe.steps.map((s, i): WorkStep => ({
    step_order: i + 1,
    title: renderTemplate(s.title, ctx),
    instruction: renderTemplate(s.instruction, ctx),
    ...(s.detail ? { detail: renderTemplate(s.detail, ctx) } : {}),
    code_refs: hasPermitPath
      ? (s.code_refs ?? []).map((c) => ({ code_type: c.code_type ?? ctx.resolved.code_type, section: c.section, note: c.note }))
      : [],
    tools: s.tools,
    materials: s.materials,
    safety: hazardLines(pack, s.safety_ids),
    ...(hasPermitPath && s.gating_inspection_type ? { gating_inspection_type: s.gating_inspection_type } : {}),
    ...(qaLine(pack, s.qa_ids) ? { qa_check: qaLine(pack, s.qa_ids) } : {}),
  }));
  return { steps, recipe };
}

/** Whether a pack recipe may be used for this trade (hand recipes win unless superseded). */
export function packMayReplace(tradeKey: string, recipe: PackRecipe | null): boolean {
  if (!recipe) return false;
  return !HAND_RECIPE_KEYS.has(tradeKey) || recipe.supersedes_hand === true;
}

export function packEquipment(pack: TradePack, ctx: BuildContext, stepTitle: string): EquipmentNeed[] {
  return (pack.equipment ?? [])
    .filter((e) => matchesWhen(e.when, ctx, stepTitle) && (!e.step_re || new RegExp(e.step_re, 'i').test(stepTitle)))
    .map((e) => need(e.type as EquipmentType, e.reason, e.optional ?? false));
}

/** Pack code refs for one inspection type (merged with the family map by code-refs.ts). */
export function packCodeRefs(tradeKey: string | null | undefined, inspectionType: string): { section: string; note: string; code_type?: string }[] {
  const pack = packFor(tradeKey);
  return (pack?.code_refs?.[inspectionType] ?? []).map((r) => ({ section: r.section, note: r.note, ...(r.code_type ? { code_type: r.code_type } : {}) }));
}

// ── Quantities ────────────────────────────────────────────────────────────────

/** Evaluate one quantity rule against blueprint facts. 0 = rule does not apply. */
export function evalQty(rule: PackQtyRule, facts: BlueprintFacts): number {
  const b = rule.qty.basis;
  let base: number;
  if (typeof b === 'string') {
    switch (b) {
      case 'rooms': base = facts.rooms.length; break;
      case 'windows': base = facts.window_count; break;
      case 'doors': base = facts.door_count; break;
      case 'panels': base = facts.panels.length; break;
      case 'area_sf_sum': base = facts.rooms.reduce((s, r) => s + (r.area_sf ?? 0), 0); break;
      case 'const': base = 1; break;
    }
  } else if ('fixture' in b) {
    base = facts.fixtures.filter((f) => f.type === b.fixture).reduce((s, f) => s + (f.count ?? 1), 0);
  } else {
    base = facts.components.includes(b.component) ? 1 : 0;
  }
  if (base <= 0) return 0;
  let q = base * (rule.qty.mul ?? 1) + (rule.qty.add ?? 0);
  if (rule.qty.round === 'ceil') q = Math.ceil(q);
  else if (rule.qty.round === 'round') q = Math.round(q);
  else q = Math.round(q * 100) / 100;
  return Math.max(0, q);
}

// ── Blueprint components ──────────────────────────────────────────────────────

export interface FlatPackComponent extends PackComponent { pack_key: string }

/** Every pack component, sorted by token for determinism. */
export function packComponents(): FlatPackComponent[] {
  const out: FlatPackComponent[] = [];
  for (const p of PACKS.values()) for (const c of p.components ?? []) out.push({ ...c, pack_key: p.key });
  return out.sort((a, b) => a.token.localeCompare(b.token));
}

// ── Knowledge payload (GET /v1/trades/:key/knowledge) ─────────────────────────

function es(t: I18nText): { text: string | null; es_pending: boolean } {
  return t.status === 'pending_human_translation' ? { text: null, es_pending: true } : { text: t.text, es_pending: false };
}

export function packKnowledge(pack: TradePack, lang: 'en' | 'es') {
  const isEs = lang === 'es';
  return {
    key: pack.key,
    pack_version: pack.pack_version,
    status: pack.status,
    summary: isEs ? pack.identity.summary_es : pack.identity.summary,
    glossary: pack.identity.glossary.map((g) => ({ term: isEs ? g.term_es : g.term, def: isEs ? g.def_es ?? g.def : g.def, def_es_pending: isEs && !g.def_es })),
    qa_checklist: (pack.qa_checklist ?? []).map((q) => {
      const t = isEs ? es(q.item_es) : { text: q.item, es_pending: false };
      return { id: q.id, phase: q.phase ?? null, item: t.text, item_en: q.item, es_pending: t.es_pending };
    }),
    hazards: (pack.hazards ?? []).map((h) => hazardPayload(pack, h.id, lang)!),
    inspection_checklists: Object.fromEntries(Object.entries(pack.inspection_checklists ?? {}).map(([k, items]) => [
      k, items.map((it) => {
        const t = isEs ? es(it.item_es) : { text: it.item, es_pending: false };
        return { item: t.text, item_en: it.item, ref: it.ref ?? null, es_pending: t.es_pending };
      }),
    ])),
  };
}

export function hazardPayload(pack: TradePack, hazardId: string, lang: 'en' | 'es') {
  const h = (pack.hazards ?? []).find((x) => x.id === hazardId);
  if (!h) return null;
  const isEs = lang === 'es';
  const hz = isEs ? es(h.hazard_es) : { text: h.hazard, es_pending: false };
  const ct = isEs ? es(h.controls_es) : { text: h.controls.join('; '), es_pending: false };
  return {
    hazard_id: `${pack.key}.${h.id}`,
    trade: pack.key,
    pack_version: pack.pack_version,
    hazard: hz.text, hazard_en: h.hazard,
    controls: ct.text, controls_en: h.controls,
    osha_ref: h.osha_ref,
    severity: h.severity,
    severity_label: (['low', 'medium', 'high', 'critical'] as const)[h.severity - 1],
    ppe: h.ppe ?? [],
    es_pending: hz.es_pending || ct.es_pending,
  };
}
