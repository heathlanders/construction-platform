// trades/packs/guards.ts — cross-file rules zod can't express (Doc 23 §6). Shared by
// api/src/test/trade-packs.test.ts and `npm run pack:check`. Pure: callers pass the catalog/token sets.

import { TRADE_BY_KEY } from '../taxonomy.js';
import { getInspectionSequence } from '../../electrical-codes/inspection-sequences.js';
import { getPlumbingInspectionSequence } from '../../plumbing-codes/inspection-sequences.js';
import { getMechanicalInspectionSequence } from '../../mechanical-codes/inspection-sequences.js';
import { getBuildingInspectionSequence } from '../../building-codes/inspection-sequences.js';
import { SOURCE_BY_ID } from './sources.js';
import { TradePackSchema, type TradePack, type Prov, type I18nText } from './schema.js';
import { TEMPLATE_PLACEHOLDERS, templatePlaceholders } from './runtime.js';

const BTS = ['residential_sf', 'residential_mf', 'commercial', 'industrial'] as const;
const union = (fn: (bt: typeof BTS[number]) => { inspection_type: string }[]) =>
  new Set(BTS.flatMap((bt) => fn(bt).map((s) => s.inspection_type)));

/** Inspection types each permit family can gate on (national-default sequences, all building types). */
export const FAMILY_INSPECTIONS: Record<string, ReadonlySet<string>> = {
  electrical: union(getInspectionSequence),
  plumbing: union(getPlumbingInspectionSequence),
  mechanical: union(getMechanicalInspectionSequence),
  building: union(getBuildingInspectionSequence),
};

const BUCKET_PREFIX: Record<string, string> = { electrical: 'E', plumbing: 'P', mechanical: 'M', building: 'B', general: 'G' };

export function packBucket(pack: TradePack): string {
  return pack.est_bucket ?? TRADE_BY_KEY.get(pack.key)?.permit_trade ?? 'general';
}

function provErrors(where: string, prov: Prov, opts: { cost?: boolean } = {}): string[] {
  const errs: string[] = [];
  const defs = prov.src.map((s) => ({ id: s, def: SOURCE_BY_ID[s] }));
  for (const d of defs) if (!d.def) errs.push(`${where}: unknown source id '${d.id}' (add it to packs/sources.ts)`);
  const known = defs.filter((d) => d.def);
  if (known.some((d) => d.def!.license === 'platform_estimate') && prov.confidence !== 'estimate') {
    errs.push(`${where}: cites platform-baseline so confidence must be 'estimate'`);
  }
  if (opts.cost && known.length > 0 && known.every((d) => d.def!.license === 'proprietary_ref_only')) {
    errs.push(`${where}: a cost number cannot come only from a proprietary source (RSMeans/NECA/ICC/NFPA…)`);
  }
  return errs;
}

const SHALL = /\bshall\b/i;
/** IRC residential section numbers (R301.2, N1102, M1411, E3901, G2415, P2503) and appendix sections (AF103, AH105). */
const IRC_SECTION = /^(?:[RNMEGP]\d{3,4}|A[A-Z]\d{3})/;

/** All rule violations for one pack. `catalogCodes` = every system assembly code already seeded. */
export function packErrors(pack: unknown, opts: { fileKey?: string; catalogCodes?: ReadonlySet<string> } = {}): string[] {
  const parsed = TradePackSchema.safeParse(pack);
  if (!parsed.success) {
    return parsed.error.issues.map((i) => `schema: ${i.path.join('.')}: ${i.message}`);
  }
  const p = parsed.data;
  const e: string[] = [];
  const def = TRADE_BY_KEY.get(p.key);
  if (!def) e.push(`key '${p.key}' is not in the trade taxonomy`);
  if (opts.fileKey && opts.fileKey !== p.key) e.push(`file name '${opts.fileKey}.ts' does not match key '${p.key}'`);

  if (p.status !== 'stub') {
    if (p.identity.glossary.length < 3) e.push('glossary: draft/reviewed packs need ≥ 3 terms');
    if (p.identity.summary_es.trim() === p.identity.summary.trim()) e.push('identity.summary_es is identical to the English summary');
  }

  // Permit family → gating + code refs
  const family = def?.permit_trade ?? null;
  const allowed = family ? FAMILY_INSPECTIONS[family] : new Set<string>();
  for (const r of p.recipes) {
    for (const [i, s] of r.steps.entries()) {
      const at = `recipe ${r.id} step ${i + 1}`;
      if (s.gating_inspection_type && !allowed.has(s.gating_inspection_type)) {
        e.push(`${at}: gating_inspection_type '${s.gating_inspection_type}' is not in the ${family ?? 'no-permit'} sequence`);
      }
      for (const c of s.code_refs ?? []) {
        if (SHALL.test(c.note)) e.push(`${at}: code_ref note must be our paraphrase (no "shall")`);
        if (family === 'building' && IRC_SECTION.test(c.section) && !c.code_type) e.push(`${at}: IRC section ${c.section} needs code_type 'IRC' (commercial jobs resolve to IBC and would print "IBC ${c.section}")`);
      }
      for (const field of [s.title, s.instruction, s.detail ?? '']) {
        for (const ph of templatePlaceholders(field)) {
          if (!(TEMPLATE_PLACEHOLDERS as readonly string[]).includes(ph)) e.push(`${at}: unknown placeholder \${${ph}}`);
        }
      }
    }
    if (r.when.title_re) {
      try {
        const re = new RegExp(r.when.title_re, 'i');
        if (r.example_title && !re.test(r.example_title)) e.push(`recipe ${r.id}: example_title does not match title_re`);
      } catch { e.push(`recipe ${r.id}: title_re does not compile`); }
      if (p.status !== 'stub' && !r.example_title) e.push(`recipe ${r.id}: add example_title (a real task title the recipe matches)`);
    }
    if (r.supersedes_hand && !r.supersedes_reason) e.push(`recipe ${r.id}: supersedes_hand needs supersedes_reason`);
  }
  for (const [insp, refs] of Object.entries(p.code_refs ?? {})) {
    if (!allowed.has(insp)) e.push(`code_refs: '${insp}' is not in the ${family ?? 'no-permit'} sequence`);
    for (const r of refs) {
      e.push(...provErrors(`code_refs.${insp}.${r.section}`, r.prov));
      if (family === 'building' && IRC_SECTION.test(r.section) && !r.code_type) e.push(`code_refs.${insp}.${r.section}: IRC section needs code_type 'IRC' (commercial jobs resolve to IBC)`);
      if (SHALL.test(r.note)) e.push(`code_refs.${insp}.${r.section}: note must be our paraphrase (no "shall")`);
    }
  }

  // ids resolve + unique
  const hz = new Set<string>(); const qa = new Set<string>();
  for (const h of p.hazards ?? []) { if (hz.has(h.id)) e.push(`hazard id '${h.id}' duplicated`); hz.add(h.id); e.push(...provErrors(`hazard ${h.id}`, h.prov)); }
  for (const q of p.qa_checklist ?? []) { if (qa.has(q.id)) e.push(`qa id '${q.id}' duplicated`); qa.add(q.id); e.push(...provErrors(`qa ${q.id}`, q.prov)); }
  for (const r of p.recipes) for (const s of r.steps) {
    for (const id of s.safety_ids) if (!hz.has(id)) e.push(`recipe ${r.id}: safety_id '${id}' has no hazard`);
    for (const id of s.qa_ids ?? []) if (!qa.has(id)) e.push(`recipe ${r.id}: qa_id '${id}' has no QA item`);
  }

  // Assemblies
  const bucket = packBucket(p);
  const ownCodes = new Set<string>();
  for (const a of p.assemblies ?? []) {
    if (ownCodes.has(a.code)) e.push(`assembly ${a.code} duplicated`);
    ownCodes.add(a.code);
    const prefix = a.code.split('-')[0];
    const okPrefix = prefix === BUCKET_PREFIX[bucket] || (prefix === 'HC' && bucket === 'general' && def?.category === 'heavy_civil');
    if (!okPrefix) e.push(`assembly ${a.code}: prefix must be ${BUCKET_PREFIX[bucket]}- for bucket '${bucket}'`);
    for (const f of ['material_cost_cents', 'labor_hours_per_unit', 'equipment_cost_cents', 'waste_pct'] as const) {
      e.push(...provErrors(`assembly ${a.code}.${f}`, a[f].prov, { cost: true }));
    }
    if (a.name_es.trim() === a.name.trim()) e.push(`assembly ${a.code}: name_es identical to name`);
  }
  for (const q of p.quantity_rules ?? []) {
    if (!ownCodes.has(q.code) && !(opts.catalogCodes?.has(q.code))) e.push(`quantity rule → unknown assembly code '${q.code}'`);
    // A fixed constant with no evidence would seed every project with the trade on its schedule —
    // scope it to a blueprint callout (when.facts_any) or building type. The estimator evaluates only
    // facts_any + building_types for quantities.
    if (q.qty.basis === 'const' && !(q.when?.facts_any?.length || q.when?.building_types?.length)) e.push(`quantity rule ${q.code}: 'const' basis needs when.facts_any or when.building_types — otherwise it guesses scope on every project`);
    if (q.when && (q.when.phase || q.when.title_re)) e.push(`quantity rule ${q.code}: phase/title_re are not evaluated for quantities — use facts_any / building_types`);
  }
  for (const [i, eq] of (p.equipment ?? []).entries()) {
    if (eq.step_re) { try { new RegExp(eq.step_re, 'i'); } catch { e.push(`equipment[${i}] ${eq.type}: step_re does not compile`); } }
  }

  // Components
  for (const c of p.components ?? []) {
    try {
      if (!new RegExp(c.re, 'i').test(c.example)) e.push(`component ${c.token}: regex does not match its example`);
    } catch { e.push(`component ${c.token}: regex does not compile`); }
  }

  // Safety text in Spanish is a professional translation or pending — never author-translated (T-08).
  const authored = (t: I18nText) => t.status === 'translated';
  for (const h of p.hazards ?? []) if (authored(h.hazard_es) || authored(h.controls_es)) e.push(`hazard ${h.id}: safety Spanish must be human_translated or pending_human_translation`);
  for (const q of p.qa_checklist ?? []) if (q.safety && authored(q.item_es)) e.push(`qa ${q.id}: safety Spanish must be human_translated or pending_human_translation`);

  // Reviewed packs may not carry pending Spanish safety text (T-08)
  if (p.status === 'reviewed') {
    const pending = (t: I18nText) => t.status === 'pending_human_translation';
    if ((p.hazards ?? []).some((h) => pending(h.hazard_es) || pending(h.controls_es))) e.push('reviewed pack has hazards pending human translation');
    if ((p.qa_checklist ?? []).some((q) => q.safety && pending(q.item_es))) e.push('reviewed pack has safety QA pending human translation');
  }
  return e;
}

/** Rules across all packs. `coreTokens` = built-in blueprint component tokens. */
export function crossPackErrors(packs: TradePack[], opts: { coreTokens: readonly string[]; foreignCodes: ReadonlySet<string> }): string[] {
  const e: string[] = [];
  const codeOwner = new Map<string, string>();
  const tokens = new Map<string, string>(opts.coreTokens.map((t) => [t, 'core']));
  for (const p of packs) {
    for (const a of p.assemblies ?? []) {
      if (codeOwner.has(a.code)) e.push(`assembly ${a.code} declared by both ${codeOwner.get(a.code)} and ${p.key}`);
      codeOwner.set(a.code, p.key);
      if (opts.foreignCodes.has(a.code)) e.push(`assembly ${a.code} (${p.key}) collides with an existing hand-seeded catalog code`);
    }
    for (const c of p.components ?? []) {
      if (tokens.has(c.token)) e.push(`component token '${c.token}' (${p.key}) already used by ${tokens.get(c.token)}`);
      tokens.set(c.token, p.key);
    }
  }
  return e;
}

export function coverage(packs: TradePack[]): Record<'stub' | 'draft' | 'reviewed', number> {
  const c = { stub: 0, draft: 0, reviewed: 0 };
  for (const p of packs) c[p.status]++;
  return c;
}
