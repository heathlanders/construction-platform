// task-buildout-trades.test.ts — T-64 Phase 3: recipe coverage for taxonomy trades.
// Pure engine tests (no DB). Building-permit trade branches (masonry, asphalt, siding, drywall)
// + no-permit trade recipes (painting, tile, flooring, cabinetry, striping) + fallbacks.

import { describe, it, expect } from 'vitest';
import { buildTaskSteps, EMPTY_FACTS } from '../lib/task-buildout/index.js';
import type { BuildContext } from '../lib/task-buildout/types.js';
import type { ResolvedTradeCode } from '../lib/jurisdictions/types.js';

const RESOLVED_BUILDING: ResolvedTradeCode = {
  code_type: 'IRC', code_edition: '2021', nec_edition: null, jurisdiction_notes: null,
  steps: ['footing', 'foundation', 'framing', 'sheathing', 'roof_dry_in', 'insulation', 'final']
    .map((t, i) => ({ inspection_type: t, sequence_order: i + 1, title: t, csi_division: null, description: '' })) as any,
};

const EMPTY_RESOLVED: ResolvedTradeCode = {
  code_type: '', code_edition: null, nec_edition: null, jurisdiction_notes: null, steps: [],
};

function ctx(trade: string, title: string, phase: string | null, resolved = RESOLVED_BUILDING): BuildContext {
  return {
    task: { trade_type: trade, phase, csi_division: null, title, description: null },
    resolved, buildingType: 'residential_sf', facts: { ...EMPTY_FACTS },
  };
}

describe('building-permit trade branches', () => {
  it('masonry gets lay + veneer-flashing steps with R606/R703.8 refs', () => {
    const steps = buildTaskSteps(ctx('masonry', 'CMU foundation walls', 'foundation'));
    expect(steps).toHaveLength(2);
    expect(steps[0].code_refs.map((r) => r.section)).toContain('R606');
    expect(steps[1].code_refs.map((r) => r.section)).toContain('R703.8');
  });

  it('asphalt paving gets base-prep + pave steps, no inspection gate, no code refs', () => {
    const steps = buildTaskSteps(ctx('asphalt_paving', 'Pave parking lot', 'sitework'));
    expect(steps).toHaveLength(2);
    expect(steps[1].title.toLowerCase()).toContain('asphalt');
    for (const s of steps) {
      expect(s.code_refs).toEqual([]);
      expect(s.gating_inspection_type).toBeUndefined();
    }
  });

  it('concrete flatwork variant pours instead of paves', () => {
    const steps = buildTaskSteps(ctx('concrete_flatwork', 'Driveway and walks', 'sitework'));
    expect(steps[1].title.toLowerCase()).toContain('flatwork');
  });

  it('siding gets WRB step then cladding gated on final', () => {
    const steps = buildTaskSteps(ctx('siding', 'Install fiber cement siding', 'finishes_exterior'));
    expect(steps).toHaveLength(2);
    expect(steps[0].instruction.toLowerCase()).toContain('water-resistive barrier');
    expect(steps[1].gating_inspection_type).toBe('final');
  });

  it('drywall gets hang + tape/finish with an R702 ref (no gate in base ICC sequence)', () => {
    const steps = buildTaskSteps(ctx('drywall', 'Hang and finish drywall', 'drywall'));
    expect(steps).toHaveLength(2);
    expect(steps[0].code_refs.map((r) => r.section)).toContain('R702');
    expect(steps[0].gating_inspection_type).toBeUndefined();
  });

  it('trade branch wins over the phase branch (asphalt in sitework phase ≠ generic site work)', () => {
    const generic = buildTaskSteps(ctx('civil', 'Site work', 'sitework'));
    const asphalt = buildTaskSteps(ctx('asphalt_paving', 'Asphalt drive', 'sitework'));
    expect(generic).toHaveLength(1);
    expect(asphalt).toHaveLength(2);
  });
});

describe('no-permit trade recipes (permit_trade null)', () => {
  it('painting gets prep + finish-coat steps with no code refs and no gate', () => {
    const steps = buildTaskSteps(ctx('painting', 'Paint interior', 'finishes_interior', EMPTY_RESOLVED));
    expect(steps).toHaveLength(2);
    for (const s of steps) {
      expect(s.code_refs).toEqual([]);
      expect(s.gating_inspection_type).toBeUndefined();
    }
  });

  it('tile gets substrate/waterproofing + set/grout steps', () => {
    const steps = buildTaskSteps(ctx('tile', 'Tile master shower', 'finishes_interior', EMPTY_RESOLVED));
    expect(steps).toHaveLength(2);
    expect(steps[0].instruction.toLowerCase()).toContain('waterproof');
  });

  it('flooring keys share the prep + install recipe', () => {
    for (const t of ['flooring_wood', 'flooring_resilient', 'flooring_carpet']) {
      const steps = buildTaskSteps(ctx(t, 'Install flooring', 'finishes_interior', EMPTY_RESOLVED));
      expect(steps, t).toHaveLength(2);
      expect(steps[0].instruction.toLowerCase()).toContain('moisture');
    }
  });

  it('cabinetry (and alias cabinet_installation) gets layout + install/scribe steps', () => {
    const steps = buildTaskSteps(ctx('cabinet_installation', 'Install kitchen cabinets', 'finishes_interior', EMPTY_RESOLVED));
    expect(steps).toHaveLength(2);
    expect(steps[1].instruction.toLowerCase()).toContain('scribe');
  });

  it('pavement marking gets a striping step incl. ADA layout', () => {
    const steps = buildTaskSteps(ctx('striping', 'Stripe parking stalls', 'sitework', EMPTY_RESOLVED));
    expect(steps).toHaveLength(1);
    expect(steps[0].instruction).toContain('ADA');
  });

  it('a known no-permit trade without a dedicated recipe gets one generic step', () => {
    const steps = buildTaskSteps(ctx('surveying', 'Stake the lot', 'site_prep', EMPTY_RESOLVED));
    expect(steps).toHaveLength(1);
    expect(steps[0].code_refs).toEqual([]);
  });

  it('no trade at all still yields no steps', () => {
    const steps = buildTaskSteps({
      task: { trade_type: null, phase: null, csi_division: null, title: 'Misc', description: null },
      resolved: EMPTY_RESOLVED, buildingType: 'residential_sf', facts: { ...EMPTY_FACTS },
    });
    expect(steps).toEqual([]);
  });
});
