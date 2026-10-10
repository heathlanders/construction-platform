// blueprint-template-trades.test.ts — T-64 blueprint trade reclassification guards (pure, no DB).
// (a) Every template trade_type resolves in the canonical taxonomy (the TradeType-union invariant).
// (b) Spot-check retags. (c) Every template still carries the permit-family anchors so
// injectPermitInspectionMilestones' taxonomy-driven trigger can fire.

import { describe, it, expect } from 'vitest';
import { getTemplate, BUILDING_TYPES } from '../lib/blueprint-templates/index.js';
import { tradeDef } from '../lib/trades/taxonomy.js';
import { tradeToPermitTrade } from '../lib/jurisdictions/trade-map.js';

const byTitle = (bt: (typeof BUILDING_TYPES)[number], title: string) =>
  getTemplate(bt).find((t) => t.title === title);

describe('template trades ⊆ taxonomy', () => {
  for (const bt of BUILDING_TYPES) {
    it(`${bt}: every trade_type resolves via tradeDef()`, () => {
      for (const task of getTemplate(bt)) {
        expect(tradeDef(task.trade_type), `${bt} "${task.title}" → ${task.trade_type}`).not.toBeNull();
      }
    });
  }
});

describe('retag spot-checks (titles unchanged)', () => {
  it('residential_sf finish trades are split', () => {
    expect(byTitle('residential_sf', 'Interior painting')?.trade_type).toBe('painting');
    expect(byTitle('residential_sf', 'Cabinet & countertop installation')?.trade_type).toBe('cabinetry');
    expect(byTitle('residential_sf', 'Siding & exterior cladding')?.trade_type).toBe('siding');
    expect(byTitle('residential_sf', 'Gutters, downspouts & flashing')?.trade_type).toBe('gutters');
    expect(byTitle('residential_sf', 'Final grading, seeding & landscaping')?.trade_type).toBe('landscaping');
  });

  it('commercial MEP specialties are split', () => {
    expect(byTitle('commercial', 'Fire suppression sprinkler rough-in')?.trade_type).toBe('fire_sprinkler');
    expect(byTitle('commercial', 'HVAC test, adjust & balance (TAB)')?.trade_type).toBe('test_balance');
    expect(byTitle('commercial', 'Structural steel erection')?.trade_type).toBe('structural_steel');
  });

  it('industrial + pole_barn', () => {
    expect(byTitle('industrial', 'Production floor epoxy coating & joint fill')?.trade_type).toBe('flooring_epoxy');
    expect(byTitle('industrial', 'Deep foundations (piers, piles or caissons)')?.trade_type).toBe('deep_foundations');
    expect(byTitle('pole_barn', 'Set post-frame columns / poles & plumb')?.trade_type).toBe('post_frame');
  });

  it('core MEP rough-in anchors stay on legacy keys', () => {
    expect(byTitle('residential_sf', 'HVAC ductwork rough-in')?.trade_type).toBe('hvac');
    expect(byTitle('residential_sf', 'Supply & drain rough-in — bathrooms')?.trade_type).toBe('plumbing');
    expect(byTitle('residential_sf', 'Service entrance & main panel')?.trade_type).toBe('electrical');
  });
});

describe('permit-injection anchors survive per template', () => {
  const familiesOf = (bt: (typeof BUILDING_TYPES)[number]) =>
    new Set(getTemplate(bt).map((t) => tradeToPermitTrade(t.trade_type)).filter(Boolean));

  it('full-building templates trigger all four permit families', () => {
    for (const bt of ['residential_sf', 'residential_mf', 'commercial', 'industrial'] as const) {
      const fams = familiesOf(bt);
      for (const f of ['electrical', 'plumbing', 'mechanical', 'building']) {
        expect(fams, `${bt} missing ${f}`).toContain(f);
      }
    }
  });

  it('pole_barn (no HVAC/plumbing scope) still triggers electrical + building', () => {
    const fams = familiesOf('pole_barn');
    expect(fams).toContain('electrical');
    expect(fams).toContain('building');
  });
});
