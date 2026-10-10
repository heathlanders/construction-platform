// estimating-engine.test.ts — pure unit tests for the deterministic estimating engine.
// No DB, no I/O. Covers line math (waste/floor/labor), markup rollup, catalog hit/miss, and the
// blueprint-facts quantity seeders (assembly + parametric).

import { describe, it, expect } from 'vitest';
import {
  buildEstimateLines, computeAmounts, computeTotals, seedQuantities, seedParametricQuantities,
  seedEquipmentQuantities, equipmentCode,
  type CatalogItem, type EstimateParams,
} from '../lib/estimating/index.js';
import { EMPTY_FACTS, type BlueprintFacts } from '../lib/task-buildout/index.js';

const RATE = 8500; // $85/hr burdened

function cat(over: Partial<CatalogItem>): CatalogItem {
  return {
    id: 'a1', trade: 'electrical', code: 'X', name: 'X', unit: 'EA', csi_division: null,
    material_cost_cents: 0, labor_hours_per_unit: 0, equipment_cost_cents: 0, waste_pct: 0, ...over,
  };
}

describe('computeAmounts', () => {
  it('applies waste to material, floors cents, computes labor from rate', () => {
    const a = computeAmounts({ quantity: 10, material_unit_cents: 350, labor_hours_per_unit: 0.35, equipment_unit_cents: 0, waste_pct: 3 }, RATE);
    // material = floor(10 * 350 * 1.03) = floor(3605) = 3605
    expect(a.material_cents).toBe(3605);
    // labor_hours = 3.5, labor = floor(3.5 * 8500) = 29750
    expect(a.labor_hours).toBe(3.5);
    expect(a.labor_cents).toBe(29750);
    expect(a.equipment_cents).toBe(0);
    expect(a.extended_cents).toBe(3605 + 29750);
  });

  it('never produces fractional cents (FLOOR)', () => {
    const a = computeAmounts({ quantity: 3, material_unit_cents: 333, labor_hours_per_unit: 0.111, equipment_unit_cents: 0, waste_pct: 7 }, 8501);
    expect(Number.isInteger(a.material_cents)).toBe(true);
    expect(Number.isInteger(a.labor_cents)).toBe(true);
  });

  it('clamps negative quantity to zero', () => {
    const a = computeAmounts({ quantity: -5, material_unit_cents: 100, labor_hours_per_unit: 1, equipment_unit_cents: 10, waste_pct: 0 }, RATE);
    expect(a.extended_cents).toBe(0);
  });
});

describe('computeTotals — markup order', () => {
  const params: EstimateParams = { labor_rate_cents: RATE, overhead_pct: 10, profit_pct: 10, tax_pct: 5, contingency_pct: 0 };
  it('overhead on subtotal, profit on subtotal+overhead, tax on material only', () => {
    const lines = [{ material_cents: 100000, labor_cents: 50000, equipment_cents: 0 }];
    const t = computeTotals(lines, params);
    expect(t.subtotal_cents).toBe(150000);
    expect(t.overhead_cents).toBe(15000);                 // 150000 * 10%
    expect(t.profit_cents).toBe(16500);                   // (150000+15000) * 10%
    expect(t.tax_cents).toBe(5000);                       // material 100000 * 5%
    expect(t.contingency_cents).toBe(0);
    expect(t.markup_cents).toBe(15000 + 16500 + 5000);
    expect(t.total_cents).toBe(150000 + t.markup_cents);
  });
});

describe('buildEstimateLines', () => {
  const params: EstimateParams = { labor_rate_cents: RATE, overhead_pct: 0, profit_pct: 0, tax_pct: 0, contingency_pct: 0 };
  it('prices from the catalog and carries assembly identity', () => {
    const catalog = new Map<string, CatalogItem>([['E-RECEP-DUP', cat({ code: 'E-RECEP-DUP', name: 'Duplex receptacle', material_cost_cents: 350, labor_hours_per_unit: 0.35, waste_pct: 3 })]]);
    const [line] = buildEstimateLines([{ assembly_code: 'E-RECEP-DUP', trade: 'electrical', quantity: 10 }], catalog, params);
    expect(line.assembly_id).toBe('a1');
    expect(line.description).toBe('Duplex receptacle');
    expect(line.material_cents).toBe(3605);
    expect(line.labor_cents).toBe(29750);
    expect(line.source).toBe('rule_engine');
  });

  it('missing catalog code → zero-cost line + explicit assumption', () => {
    const [line] = buildEstimateLines([{ assembly_code: 'NOPE', trade: 'electrical', quantity: 5, description: 'Mystery' }], new Map(), params);
    expect(line.material_cents).toBe(0);
    expect(line.extended_cents).toBe(0);
    expect(line.assumptions.some((a) => a.includes('No catalog match'))).toBe(true);
  });

  it('drops zero-quantity quantities', () => {
    expect(buildEstimateLines([{ assembly_code: 'X', quantity: 0 }], new Map(), params)).toHaveLength(0);
  });
});

describe('seedQuantities — electrical', () => {
  const available = new Set(['E-PANEL-200', 'E-SERVICE-200', 'E-RECEP-DUP', 'E-SWITCH-1P', 'E-LIGHT-REC', 'E-SMOKE-CO', 'E-CIRCUIT-20']);
  it('seeds panel + service + per-room device counts from facts', () => {
    const facts: BlueprintFacts = {
      ...EMPTY_FACTS,
      panels: [{ amperage: 200, location: null }],
      rooms: [{ name: 'a' }, { name: 'b' }, { name: 'c' }],
      fixtures: [{ type: 'recessed_light', count: null }, { type: 'smoke_detector', count: null }],
    };
    const q = seedQuantities('electrical', facts, available);
    const byCode = Object.fromEntries(q.map((x) => [x.assembly_code, x.quantity]));
    expect(byCode['E-PANEL-200']).toBe(1);
    expect(byCode['E-SERVICE-200']).toBe(1);
    expect(byCode['E-RECEP-DUP']).toBe(18);   // 3 rooms * 6
    expect(byCode['E-SWITCH-1P']).toBe(6);    // 3 * 2
    expect(byCode['E-LIGHT-REC']).toBe(12);   // recessed → 3 * 4
    expect(byCode['E-SMOKE-CO']).toBe(3);
    expect(q.every((x) => (x.assumptions?.length ?? 0) > 0)).toBe(true);
  });

  it('emits nothing when facts are empty', () => {
    expect(seedQuantities('electrical', { ...EMPTY_FACTS }, available)).toHaveLength(0);
  });

  it('skips codes absent from the (tenant-merged) catalog', () => {
    const facts: BlueprintFacts = { ...EMPTY_FACTS, panels: [{ amperage: 200, location: null }] };
    const q = seedQuantities('electrical', facts, new Set()); // nothing available
    expect(q).toHaveLength(0);
  });
});

describe('seedQuantities — building (Phase 3 depth)', () => {
  const available = new Set(['B-WINDOW', 'B-DOOR-EXT', 'B-DOOR-INT', 'B-FRAME-SF', 'B-INSUL-SF', 'B-DRYWALL-SF']);
  it('seeds openings + envelope from window/door counts + room areas', () => {
    const facts: BlueprintFacts = {
      ...EMPTY_FACTS,
      window_count: 10, door_count: 8,
      rooms: [{ name: 'a', area_sf: 200 }, { name: 'b', area_sf: 300 }],
    };
    const q = seedQuantities('building', facts, available);
    const byCode = Object.fromEntries(q.map((x) => [x.assembly_code, x.quantity]));
    expect(byCode['B-WINDOW']).toBe(10);
    expect(byCode['B-DOOR-EXT']).toBe(2);       // round(8 * 0.25)
    expect(byCode['B-DOOR-INT']).toBe(6);       // 8 - 2
    expect(byCode['B-FRAME-SF']).toBe(500);     // 200 + 300
    expect(byCode['B-INSUL-SF']).toBe(500);
    expect(byCode['B-DRYWALL-SF']).toBe(1600);  // round(500 * 3.2)
    expect(q.every((x) => (x.assumptions?.length ?? 0) > 0)).toBe(true);
  });
  it('emits nothing when facts are empty', () => {
    expect(seedQuantities('building', { ...EMPTY_FACTS }, available)).toHaveLength(0);
  });
  it('skips codes absent from the catalog', () => {
    const facts: BlueprintFacts = { ...EMPTY_FACTS, window_count: 5 };
    expect(seedQuantities('building', facts, new Set())).toHaveLength(0);
  });
});

describe('seedEquipmentQuantities (Phase 3)', () => {
  const available = new Set(['EQUIP-EXCAVATOR', 'EQUIP-CRANE', 'EQUIP-SCISSOR_LIFT']);
  it('maps a canonical type to its EQUIP-{TYPE} code', () => {
    expect(equipmentCode('skid_steer')).toBe('EQUIP-SKID_STEER');
    expect(equipmentCode('crane')).toBe('EQUIP-CRANE');
  });
  it('one DAY line per equipment type, quantity = days, gated on available codes', () => {
    const q = seedEquipmentQuantities([{ type: 'excavator', days: 3 }, { type: 'crane', days: 1 }], available);
    const byCode = Object.fromEntries(q.map((x) => [x.assembly_code, x.quantity]));
    expect(byCode['EQUIP-EXCAVATOR']).toBe(3);
    expect(byCode['EQUIP-CRANE']).toBe(1);
    expect(q.every((x) => x.trade === 'general' && (x.assumptions?.length ?? 0) > 0)).toBe(true);
  });
  it('skips a type whose EQUIP code is not in the catalog', () => {
    const q = seedEquipmentQuantities([{ type: 'welder', days: 2 }], available); // EQUIP-WELDER absent
    expect(q).toHaveLength(0);
  });
  it('prices an equipment line entirely as equipment cost (material/labor = 0)', () => {
    const catalog = new Map<string, CatalogItem>([
      ['EQUIP-EXCAVATOR', cat({ code: 'EQUIP-EXCAVATOR', trade: 'general', name: 'Excavator', unit: 'DAY', equipment_cost_cents: 60000 })],
    ]);
    const params: EstimateParams = { labor_rate_cents: 9000, overhead_pct: 0, profit_pct: 0, tax_pct: 0, contingency_pct: 0 };
    const [line] = buildEstimateLines([{ assembly_code: 'EQUIP-EXCAVATOR', trade: 'general', quantity: 3, assumptions: [] }], catalog, params);
    expect(line.material_cents).toBe(0);
    expect(line.labor_cents).toBe(0);
    expect(line.equipment_cents).toBe(180000); // 60000 × 3
    expect(line.extended_cents).toBe(180000);
  });
});

describe('seedParametricQuantities', () => {
  it('one line per trade = SF × PARAM code, gated on available codes', () => {
    const q = seedParametricQuantities(2000, ['electrical', 'plumbing'], new Set(['PARAM-ELECTRICAL']));
    expect(q).toHaveLength(1);
    expect(q[0].assembly_code).toBe('PARAM-ELECTRICAL');
    expect(q[0].quantity).toBe(2000);
  });
  it('emits nothing for zero SF', () => {
    expect(seedParametricQuantities(0, ['electrical'], new Set(['PARAM-ELECTRICAL']))).toHaveLength(0);
  });
});
