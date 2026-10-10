// trade-packs-integration.test.ts — packs flowing through the real engines (Doc 23 §5): work steps,
// precedence vs hand recipes, code refs, estimating, blueprint components, dependency hints, endpoints.

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { randomUUID } from 'node:crypto';
import Fastify from 'fastify';
import jwt from 'jsonwebtoken';
import { buildTaskSteps, EMPTY_FACTS } from '../lib/task-buildout/index.js';
import type { BuildContext } from '../lib/task-buildout/types.js';
import type { ResolvedTradeCode } from '../lib/jurisdictions/types.js';
import { PACKS } from '../lib/trades/packs/index.js';
import { renderPackSteps, matchesWhen, packEquipment, packMayReplace, evalQty, packKnowledge, HAND_RECIPE_KEYS } from '../lib/trades/packs/runtime.js';
import { seedFromPacks } from '../lib/estimating/quantities.js';
import { estTradeFor } from '../lib/estimating/trade-bucket.js';
import { parseSheetText, COMPONENT_TOKENS } from '../lib/blueprint-pdf/parse-sheets.js';
import { computeDependencies } from '../lib/task-dependencies/rules.js';
import { tradeRoutes } from '../routes/v1/trades.js';
import { registerErrorHandler } from '../plugins/error-handler.js';

const RESOLVED: ResolvedTradeCode = {
  code_type: 'IRC', code_edition: '2021', nec_edition: null, jurisdiction_notes: null,
  steps: ['footing', 'foundation', 'framing', 'sheathing', 'roof_dry_in', 'insulation', 'final']
    .map((t, i) => ({ inspection_type: t, sequence_order: i + 1, title: t, csi_division: null, description: '' })) as never,
};
const ctx = (trade: string, title: string, phase: string | null): BuildContext => ({
  task: { trade_type: trade, phase, csi_division: null, title, description: null },
  resolved: RESOLVED, buildingType: 'residential_sf', facts: { ...EMPTY_FACTS },
});

describe('work steps', () => {
  it('a pack-only trade (decks) gets the pack recipe with gates + code refs', () => {
    const steps = buildTaskSteps(ctx('decks', 'Build rear deck', 'finishes_exterior'));
    expect(steps).toHaveLength(5);
    expect(steps.map((s) => s.gating_inspection_type).filter(Boolean)).toEqual(['footing', 'framing', 'final']);
    expect(steps[1].code_refs.map((c) => `${c.code_type} ${c.section}`)).toContain('IRC R703.8');
    expect(steps[0].safety.join(' ')).toMatch(/OSHA 1926\.651\(b\)\(1\)/);
    expect(steps[0].qa_check).toMatch(/undisturbed soil/);
  });

  it('a gate the AHJ sequence does not contain is dropped', () => {
    const c = ctx('decks', 'Build deck', 'finishes_exterior');
    c.resolved = { ...RESOLVED, steps: RESOLVED.steps.filter((s) => s.inspection_type !== 'framing') };
    expect(buildTaskSteps(c).map((s) => s.gating_inspection_type).filter(Boolean)).toEqual(['footing', 'final']);
  });

  it('a complement pack (concrete) leaves the hand recipe in charge', () => {
    expect(HAND_RECIPE_KEYS.has('concrete')).toBe(true);
    expect(PACKS.get('concrete')!.recipes).toEqual([]);
    const steps = buildTaskSteps(ctx('concrete', 'Pour footings', 'foundation'));
    expect(steps.length).toBeGreaterThan(0);
    expect(steps.some((s) => /deck/i.test(s.title))).toBe(false);
  });

  it('a hand-recipe trade only yields to a pack recipe that supersedes it', () => {
    const recipe = PACKS.get('decks')!.recipes[0];
    expect(packMayReplace('decks', recipe)).toBe(true);
    expect(packMayReplace('framing', recipe)).toBe(false);
    expect(packMayReplace('framing', { ...recipe, supersedes_hand: true })).toBe(true);
  });

  it('pack-recipe steps use only the pack equipment (no phase-keyed family misfires)', () => {
    // abatement defaults to site_prep — the family rules would put an excavator on asbestos removal
    const steps = buildTaskSteps(ctx('abatement', 'Asbestos abatement — pipe insulation, floor tile and popcorn ceiling', 'site_prep'));
    expect(steps.length).toBeGreaterThan(0);
    const types = steps.flatMap((s) => (s.equipment ?? []).map((e) => e.type));
    for (const t of ['excavator', 'skid_steer', 'compactor', 'dump_truck']) expect(types).not.toContain(t);
  });

  it('a recipe that does not match yields no pack steps (falls through)', () => {
    const { steps } = renderPackSteps(PACKS.get('decks')!, ctx('decks', 'Order lumber', 'framing'), true);
    expect(steps).toEqual([]);
  });

  it('on a no-permit path pack steps carry no code refs or gates', () => {
    const { steps } = renderPackSteps(PACKS.get('decks')!, ctx('decks', 'Deck', 'finishes_exterior'), false);
    for (const s of steps) { expect(s.code_refs).toEqual([]); expect(s.gating_inspection_type).toBeUndefined(); }
  });
});

describe('estimating', () => {
  const facts = { ...EMPTY_FACTS, components: ['deck'] };
  const available = new Set((PACKS.get('decks')!.assemblies ?? []).map((a) => a.code));

  it('seeds deck quantities from the component callout, tagged with pack + confidence', () => {
    const q = seedFromPacks(['decks'], facts, available, ['building']);
    expect(q.map((x) => x.assembly_code)).toContain('B-DECK-FRAME-SF');
    expect(q[0].assumptions![0]).toMatch(/^\[pack decks@\d+\.\d+\.\d+ · estimate\]/);
  });

  it('respects bucket filter, catalog gating and hand-seeded codes', () => {
    expect(seedFromPacks(['decks'], facts, available, ['general'])).toEqual([]);
    expect(seedFromPacks(['decks'], facts, new Set(), ['building'])).toEqual([]);
    const q = seedFromPacks(['decks'], facts, available, ['building'], new Set(['B-DECK-FRAME-SF']));
    expect(q.map((x) => x.assembly_code)).not.toContain('B-DECK-FRAME-SF');
  });

  it('building_types-scoped rules only fire for that estimate building type', () => {
    const avail = new Set(['B-INS-AIRSEAL-EA']);
    expect(seedFromPacks(['insulation'], EMPTY_FACTS, avail, ['building'], new Set(), 'residential_sf').map((q) => q.assembly_code)).toEqual(['B-INS-AIRSEAL-EA']);
    expect(seedFromPacks(['insulation'], EMPTY_FACTS, avail, ['building'], new Set(), 'commercial')).toEqual([]);
    expect(seedFromPacks(['insulation'], EMPTY_FACTS, avail, ['building'])).toEqual([]);
  });

  it('pole_barn plan type: estimate building_type scopes rules; steps match via planBuildingType', () => {
    const f = { ...EMPTY_FACTS, rooms: [{ name: 'BARN', area_sf: 2400 }] } as never;
    const avail = new Set(['B-PF-SECFRAME-SF']);
    expect(seedFromPacks(['post_frame'], f, avail, ['building'], new Set(), 'pole_barn').map((q) => q.assembly_code)).toEqual(['B-PF-SECFRAME-SF']);
    expect(seedFromPacks(['post_frame'], f, avail, ['building'], new Set(), 'residential_sf')).toEqual([]);
    const c = ctx('post_frame', 'Set columns', 'framing');
    expect(matchesWhen({ building_types: ['pole_barn'] }, c)).toBe(false);
    expect(matchesWhen({ building_types: ['pole_barn'] }, { ...c, planBuildingType: 'pole_barn' })).toBe(true);
    expect(matchesWhen({ building_types: ['residential_sf'] }, { ...c, planBuildingType: 'pole_barn' })).toBe(true);
  });

  it('equipment step_re scopes a rule to one step (task-title match alone hits every step)', () => {
    const pack = { ...PACKS.get('decks')!, equipment: [{ when: { title_re: 'deck' }, step_re: 'footing', type: 'skid_steer', reason: 'auger' }] } as never;
    const c = ctx('decks', 'Build rear deck', 'finishes_exterior');
    expect(packEquipment(pack, c, 'Dig footings').map((x) => x.type)).toEqual(['skid_steer']);
    expect(packEquipment(pack, c, 'Install decking boards')).toEqual([]);
  });

  it('facts_any matches fixture types too (forced-air unit → hvac rules fire)', () => {
    const f = { ...EMPTY_FACTS, fixtures: [{ type: 'fau', count: 1 }] };
    const q = seedFromPacks(['hvac', 'ductwork'], f, new Set(['M-HV-STARTUP', 'M-DU-LEAK-TEST']), ['mechanical'], new Set(), 'residential_sf');
    expect(q.map((x) => x.assembly_code).sort()).toEqual(['M-DU-LEAK-TEST', 'M-HV-STARTUP']);
    expect(seedFromPacks(['hvac'], EMPTY_FACTS, new Set(['M-HV-STARTUP']), ['mechanical'], new Set(), 'residential_sf')).toEqual([]);
  });

  it('no deck callout → no deck lines', () => {
    expect(seedFromPacks(['decks'], EMPTY_FACTS, available, ['building'])).toEqual([]);
  });

  it('evalQty bases + rounding', () => {
    const f = { ...EMPTY_FACTS, rooms: [{ name: 'A', area_sf: 100.4 }, { name: 'B', area_sf: 50 }], window_count: 3 };
    expect(evalQty({ code: 'X', assumption: 'a', qty: { basis: 'rooms', mul: 2 } }, f)).toBe(4);
    expect(evalQty({ code: 'X', assumption: 'a', qty: { basis: 'area_sf_sum', round: 'ceil' } }, f)).toBe(151);
    expect(evalQty({ code: 'X', assumption: 'a', qty: { basis: 'windows', add: 1 } }, f)).toBe(4);
    expect(evalQty({ code: 'X', assumption: 'a', qty: { basis: 'doors', add: 5 } }, f)).toBe(0);
  });

  it('heavy civil trades price in the general bucket', () => {
    expect(estTradeFor('pipeline')).toBe('general');
    expect(estTradeFor('decks')).toBe('building');
  });
});

describe('blueprint components + dependencies', () => {
  it('a deck callout on a sheet is detected; a steel roof deck is not', () => {
    expect(COMPONENT_TOKENS).toContain('deck');
    expect(parseSheetText('architectural', "NEW 12'x16' COMPOSITE DECK W/ STAIRS").components).toContain('deck');
    expect(parseSheetText('architectural', '1-1/2" METAL ROOF DECK').components ?? []).not.toContain('deck');
  });

  it('dependency hint: siding precedes deck tasks', () => {
    const edges = computeDependencies([
      { id: 's', title: 'Siding', trade_type: 'siding', phase: 'finishes_exterior', csi_division: null, sort_order: 1 },
      { id: 'd', title: 'Deck', trade_type: 'decks', phase: 'finishes_exterior', csi_division: null, sort_order: 2 },
    ]);
    expect(edges.some((e) => e.predecessor_id === 's' && e.successor_id === 'd')).toBe(true);
  });
});

describe('knowledge payload', () => {
  it('ES never shows English as Spanish for pending safety text', () => {
    const es = packKnowledge(PACKS.get('decks')!, 'es');
    const h = es.hazards[0];
    expect(h.hazard).toBeNull();
    expect(h.es_pending).toBe(true);
    expect(h.hazard_en.length).toBeGreaterThan(0);
    expect(es.summary).toMatch(/Terrazas/);
  });
});

// ── Endpoints ────────────────────────────────────────────────────────────────
const app = Fastify({ logger: false });
const token = () => jwt.sign(
  { jti: randomUUID(), user_id: randomUUID(), tenant_id: randomUUID(), role: 'FIELD_TECH', email: 'ft@tp.test', preferred_language: 'en' },
  process.env.JWT_SECRET ?? 'dev-secret-change-in-production', { expiresIn: 86400 });
const H = () => ({ 'user-agent': 'test-runner/1.0', authorization: `Bearer ${token()}` });

describe('GET /v1/trades/:key/knowledge + /v1/trades/hazards', () => {
  beforeAll(async () => { registerErrorHandler(app); await app.register(tradeRoutes, { prefix: '/v1' }); await app.ready(); });
  afterAll(async () => { await app.close(); });

  it('knowledge requires auth, resolves aliases, sets an ETag and honors If-None-Match', async () => {
    expect((await app.inject({ method: 'GET', url: '/v1/trades/decks/knowledge', headers: { 'user-agent': 't/1' } })).statusCode).toBe(401);
    const res = await app.inject({ method: 'GET', url: '/v1/trades/deck_builder/knowledge?lang=es', headers: H() });
    expect(res.statusCode).toBe(200);
    expect(res.json().knowledge.key).toBe('decks');
    const etag = res.headers.etag as string;
    const again = await app.inject({ method: 'GET', url: '/v1/trades/decks/knowledge?lang=es', headers: { ...H(), 'if-none-match': etag } });
    expect(again.statusCode).toBe(304);
    expect((await app.inject({ method: 'GET', url: '/v1/trades/nope/knowledge', headers: H() })).statusCode).toBe(404);
  });

  it('hazards merges trades, dedupes aliases, sorts by severity, caps keys', async () => {
    const res = await app.inject({ method: 'GET', url: '/v1/trades/hazards?keys=decks,deck,concrete', headers: H() });
    expect(res.statusCode).toBe(200);
    const { hazards } = res.json();
    const ids = hazards.map((h: { hazard_id: string }) => h.hazard_id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.some((i: string) => i.startsWith('concrete.'))).toBe(true);
    expect(hazards[0].severity).toBe(4);
    expect(hazards[0].severity_label).toBe('critical');
    const many = Array.from({ length: 21 }, (_, i) => `k${i}`).join(',');
    expect((await app.inject({ method: 'GET', url: `/v1/trades/hazards?keys=${many}`, headers: H() })).statusCode).toBe(422);
    expect((await app.inject({ method: 'GET', url: '/v1/trades/hazards', headers: H() })).statusCode).toBe(422);
  });

  it('existing /trades/:key still resolves', async () => {
    expect((await app.inject({ method: 'GET', url: '/v1/trades/striping', headers: H() })).json().trade.key).toBe('pavement_marking');
  });
});
