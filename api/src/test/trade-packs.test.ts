// trade-packs.test.ts — guards for Trade Knowledge Packs (Doc 23 §6). Pure: no DB.
// Every pack passes schema + guards; cross-pack rules; barrel matches disk; every pack assembly is
// seeded by a migration; vision vocabulary stays capped. Mutation cases prove the guards bite.

import { describe, it, expect } from 'vitest';
import { PACK_FILES, PACKS } from '../lib/trades/packs/index.js';
import { packErrors, crossPackErrors, coverage, FAMILY_INSPECTIONS } from '../lib/trades/packs/guards.js';
import { seededCatalogCodes } from '../lib/trades/packs/catalog-scan.js';
import { CATALOG_MANIFEST } from '../lib/trades/packs/catalog-manifest.js';
import { TRADE_TAXONOMY } from '../lib/trades/taxonomy.js';
import { CORE_COMPONENT_TOKENS, COMPONENT_TOKENS, VISION_COMPONENT_TOKENS, VISION_TOKEN_CAP } from '../lib/blueprint-pdf/parse-sheets.js';
import { packFileKeys, renderBarrel } from '../scripts/pack-barrel.js';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PACKS_DIR } from '../scripts/pack-barrel.js';
import type { TradePack } from '../lib/trades/packs/schema.js';

const seeded = seededCatalogCodes();
const catalogCodes = new Set(seeded.keys());
const foreign = new Set([...seeded.keys()].filter((c) => !(c in CATALOG_MANIFEST)));
const decks = PACKS.get('decks')!;
const clone = (p: TradePack): TradePack => JSON.parse(JSON.stringify(p));

describe('every pack', () => {
  it('there is exactly one pack per taxonomy trade', () => {
    expect(PACK_FILES.length).toBe(TRADE_TAXONOMY.length);
    expect(new Set(PACKS.keys())).toEqual(new Set(TRADE_TAXONOMY.map((d) => d.key)));
  });

  it.each(PACK_FILES.map(([k, p]) => [k, p] as const))('%s passes schema + guards', (fileKey, pack) => {
    expect(packErrors(pack, { fileKey, catalogCodes })).toEqual([]);
  });

  it('cross-pack rules hold (codes, component tokens)', () => {
    expect(crossPackErrors(PACK_FILES.map(([, p]) => p), { coreTokens: CORE_COMPONENT_TOKENS, foreignCodes: foreign })).toEqual([]);
  });

  it('every pack assembly is seeded by a migration listed in the manifest', () => {
    for (const [, p] of PACK_FILES) for (const a of p.assemblies ?? []) {
      expect(CATALOG_MANIFEST[a.code], `${a.code} — run gen:catalog-migration`).toBeDefined();
      expect(seeded.get(a.code), a.code).toBe(CATALOG_MANIFEST[a.code]);
    }
  });

  it('packs/index.ts barrel matches the files on disk', () => {
    expect(readFileSync(join(PACKS_DIR, 'index.ts'), 'utf8')).toBe(renderBarrel(packFileKeys()));
  });

  it('vision vocabulary = core + opted-in pack tokens, capped', () => {
    expect(VISION_COMPONENT_TOKENS.length).toBeLessThanOrEqual(VISION_TOKEN_CAP);
    for (const t of CORE_COMPONENT_TOKENS) expect(VISION_COMPONENT_TOKENS).toContain(t);
    for (const t of VISION_COMPONENT_TOKENS) expect(COMPONENT_TOKENS).toContain(t);
  });

  it('reports coverage', () => {
    const c = coverage(PACK_FILES.map(([, p]) => p));
    expect(c.stub + c.draft + c.reviewed).toBe(TRADE_TAXONOMY.length);
    console.log('trade pack coverage:', c);
  });
});

describe('guards bite (mutation checks)', () => {
  const errs = (p: TradePack) => packErrors(p, { fileKey: p.key, catalogCodes });

  it('rejects a gating inspection outside the permit family', () => {
    const p = clone(decks); p.recipes[0].steps[0].gating_inspection_type = 'rough_in';
    expect(errs(p).join()).toMatch(/not in the building sequence/);
    expect(FAMILY_INSPECTIONS.building.has('footing')).toBe(true);
  });

  it('rejects an unknown source id and a platform estimate claimed as verified', () => {
    const p = clone(decks);
    p.hazards![0].prov.src = ['made-up-source'];
    p.assemblies![0].material_cost_cents.prov.confidence = 'verified';
    const e = errs(p).join('\n');
    expect(e).toMatch(/unknown source id 'made-up-source'/);
    expect(e).toMatch(/platform-baseline so confidence must be 'estimate'/);
  });

  it('rejects a cost sourced only from a proprietary code', () => {
    const p = clone(decks);
    p.assemblies![0].labor_hours_per_unit.prov = { src: ['icc-pa'], confidence: 'verified', last_verified: '2026-10-08' };
    expect(errs(p).join()).toMatch(/cannot come only from a proprietary source/);
  });

  it('rejects author-translated Spanish on safety text (T-08)', () => {
    const p = clone(decks);
    p.hazards![0].hazard_es = { status: 'translated', text: 'Caída' };
    expect(errs(p).join()).toMatch(/safety Spanish must be human_translated/);
  });

  it('rejects a reviewed pack with pending safety Spanish', () => {
    const p = clone(decks); p.status = 'reviewed';
    expect(errs(p).join()).toMatch(/reviewed pack has hazards pending/);
  });

  it('rejects dangling safety/qa ids, unknown placeholders and a wrong code prefix', () => {
    const p = clone(decks);
    p.recipes[0].steps[0].safety_ids.push('nope');
    p.recipes[0].steps[0].instruction += ' ${facts.nope}';
    p.assemblies![0].code = 'G-DECK-FRAME-SF';
    const e = errs(p).join('\n');
    expect(e).toMatch(/safety_id 'nope'/);
    expect(e).toMatch(/unknown placeholder/);
    expect(e).toMatch(/prefix must be B-/);
  });

  it('rejects a component regex that misses its own example', () => {
    const p = clone(decks); p.components![0].example = 'ROOF DECK';
    expect(errs(p).join()).toMatch(/does not match its example/);
  });

  it('rejects code-text quotes ("shall") in code-ref notes', () => {
    const p = clone(decks); p.code_refs!.final![0].note = 'Guards shall be provided';
    expect(errs(p).join()).toMatch(/paraphrase/);
  });

  it('rejects an unscoped const quantity rule and unevaluated phase/title filters', () => {
    const p = clone(decks);
    p.quantity_rules!.push({ code: 'B-DECK-FRAME-SF', assumption: 'guess', qty: { basis: 'const', mul: 100 } });
    p.quantity_rules!.push({ code: 'B-DECK-WOOD-SF', assumption: 'x', when: { phase: ['framing'] }, qty: { basis: 'rooms' } });
    const e = errs(p).join('\n');
    expect(e).toMatch(/'const' basis needs when.facts_any or when.building_types/);
    expect(e).toMatch(/phase\/title_re are not evaluated for quantities/);
  });

  it('cross-pack: duplicate assembly code and duplicate component token', () => {
    const a = clone(decks); const b = clone(decks); b.key = 'patio_covers_awnings';
    const e = crossPackErrors([a, b], { coreTokens: CORE_COMPONENT_TOKENS, foreignCodes: new Set() }).join('\n');
    expect(e).toMatch(/declared by both/);
    expect(e).toMatch(/component token 'deck'/);
  });

  it('cross-pack: a pack may not redeclare a hand-seeded catalog code', () => {
    const p = clone(decks); p.assemblies![0].code = 'B-FOOTING-LF';
    const e = crossPackErrors([p], { coreTokens: [], foreignCodes: new Set(['B-FOOTING-LF']) }).join();
    expect(e).toMatch(/collides with an existing hand-seeded/);
  });
});
