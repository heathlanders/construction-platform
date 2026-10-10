// intake-concrete-flatwork.test.ts — behavior of the first shipped Design Studio trade module (pure).
// Generic integrity/fuzz/golden pricing lives in intake-registry.test.ts; this file pins the
// trade-specific rules a contractor would care about.

import { describe, it, expect } from 'vitest';
import { concreteFlatwork as m } from '../lib/intake/trades/concrete_flatwork.js';
import { buildRequirements, compilePrompt, getIntakeModule, missingRequired, newSpec, offerableTrades, sanitizeValues } from '../lib/intake/index.js';

const base = {
  purpose: 'patio', area: { shape: 'rect', length_ft: 20, width_ft: 10 }, existing_surface: 'grass_dirt',
  slope: 'flat', truck_access: 'yes', thickness: '4', base: 'gravel', reinforcement: 'wire_mesh',
  finish: 'broom', color: 'natural_gray', site_photos: ['00000000-0000-4000-8000-000000000001'],
};
const codes = (values: Record<string, unknown>) => {
  const v = sanitizeValues(m.steps, values).values;
  return m.scopeToQuantities(v, m.derive!(v)).map((q) => q.assembly_code);
};

describe('concrete_flatwork module', () => {
  it('is registered and offerable (alias resolves too)', () => {
    expect(getIntakeModule('flatwork')).toBe(m);
    expect(offerableTrades(['concrete_flatwork', 'painting']).map((x) => x.trade_key)).toEqual(['concrete_flatwork']);
  });

  it('driveway entry point presets thickness + rebar', () => {
    expect(newSpec(m, 'flatwork_driveway').values).toMatchObject({ purpose: 'driveway', thickness: '5', reinforcement: 'rebar' });
  });

  it('derives area, perimeter and concrete volume', () => {
    const d = m.derive!(sanitizeValues(m.steps, { ...base, thickness: '6' }).values);
    expect(d).toMatchObject({ area_sf: 200, perimeter_lf: 60, thickness_in: 6 });
    expect(d.concrete_cy).toBeCloseTo((200 * 6) / 12 / 27, 2);
  });

  it('thickness adder only above 4"', () => {
    expect(codes(base)).not.toContain('B-FLAT-THICK-SF-IN');
    expect(codes({ ...base, thickness: '6' })).toContain('B-FLAT-THICK-SF-IN');
  });

  it('stamped includes color (no integral color line); colored broom adds it', () => {
    expect(codes({ ...base, finish: 'stamped', stamp_pattern: 'cobblestone', color: 'tan' })).not.toContain('B-FLAT-COLOR-SF');
    expect(codes({ ...base, color: 'tan' })).toContain('B-FLAT-COLOR-SF');
  });

  it('stamp pattern is required only when stamped, dropped otherwise', () => {
    expect(missingRequired(m.steps, sanitizeValues(m.steps, { ...base, finish: 'stamped' }).values)).toContain('stamp_pattern');
    expect(sanitizeValues(m.steps, { ...base, stamp_pattern: 'cobblestone' }).dropped).toContain('stamp_pattern');
  });

  it('pump only when the truck cannot reach; removal vs excavation by existing surface', () => {
    expect(codes(base)).not.toContain('EQUIP-CONCRETE_PUMP');
    expect(codes({ ...base, truck_access: 'no' })).toContain('EQUIP-CONCRETE_PUMP');
    expect(codes(base)).toContain('B-FLAT-EXCAV-SF');
    expect(codes({ ...base, existing_surface: 'concrete' })).toEqual(expect.arrayContaining(['G-SITE-DEMO-SF']));
    expect(codes({ ...base, base: 'existing_ok' })).not.toContain('B-AGG-BASE-SY');
  });

  it('permit: curb cut likely, driveway depends, small patio unlikely', () => {
    const permit = (values: Record<string, unknown>) => {
      const v = sanitizeValues(m.steps, values).values;
      return buildRequirements(m, v, m.derive!(v), { common: {}, ahj: null }).find((r) => r.id === 'permit')!.level;
    };
    expect(permit({ ...base, purpose: 'driveway', curb_cut: true })).toBe('required');
    expect(permit({ ...base, purpose: 'driveway' })).toBe('likely');
    expect(permit(base)).toBe('info');
  });

  it('811 + cure time always; right-of-way only with a curb cut', () => {
    const ids = (values: Record<string, unknown>) => {
      const v = sanitizeValues(m.steps, values).values;
      return buildRequirements(m, v, m.derive!(v), { common: {}, ahj: null }).map((r) => r.id);
    };
    expect(ids(base)).toEqual(expect.arrayContaining(['call_811', 'cure_time', 'drain_away']));
    expect(ids(base)).not.toContain('right_of_way');
    expect(ids({ ...base, purpose: 'driveway', curb_cut: true })).toContain('right_of_way');
  });

  it('prompt reflects the look choices', () => {
    const v = sanitizeValues(m.steps, { ...base, finish: 'stamped', stamp_pattern: 'flagstone', color: 'terracotta', sealer: true, notes: 'add a dragon' }).values;
    const p = compilePrompt(m, v);
    expect(p).toMatch(/concrete patio.*stamped.*flagstone.*terracotta.*sealed/);
    expect(p).not.toContain('dragon');
  });

  it('prompt tells the model how big and where, so a patio does not pave the whole yard', () => {
    const v = sanitizeValues(m.steps, { ...base, area: { shape: 'rect', length_ft: 16, width_ft: 12 }, placement: 'off_door' }).values;
    const p = compilePrompt(m, v);
    expect(p).toMatch(/concrete patio, roughly 12 by 16 feet \(about 190 square feet, about the size of one parking space\), covering only part of the open ground/);
    expect(p).toContain('starting at the door of the house');
    expect(p).toContain('built on part of the existing lawn');
    expect(p).toContain('Only that area changes');
    expect(p).toContain('level with the grass, with no raised or exposed slab edge');
    // Size + placement come before the look — what the model gets wrong first.
    expect(p.indexOf('roughly 12 by 16')).toBeLessThan(p.indexOf('broom'));
  });

  it('replacing an old surface keeps the same footprint; placement is optional', () => {
    const v = sanitizeValues(m.steps, { ...base, existing_surface: 'asphalt' }).values;
    const p = compilePrompt(m, v);
    expect(p).toContain('replacing the old asphalt in exactly the same footprint');
    expect(missingRequired(m.steps, v)).not.toContain('placement');
  });
});
