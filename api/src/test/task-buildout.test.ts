// task-buildout.test.ts — unit tests for the deterministic per-trade work-step engine (pure, no DB).

import { describe, it, expect } from 'vitest';
import { PACKS } from '../lib/trades/packs/index.js';
import { buildTaskSteps, EMPTY_FACTS, type BuildContext } from '../lib/task-buildout/index.js';
import type { ResolvedTradeCode, InspectionStepDef } from '../lib/jurisdictions/types.js';

function insp(types: string[]): InspectionStepDef[] {
  return types.map((inspection_type, i) => ({
    sequence_order: i + 1, inspection_type, title: inspection_type, csi_division: '00 00 00', estimated_duration_days: 1,
  }));
}
const NEC: ResolvedTradeCode = { code_type: 'NEC', code_edition: '2023', nec_edition: '2023', jurisdiction_notes: null, steps: insp(['temporary_power', 'rough_in', 'service', 'cover', 'final']) };
const IRC: ResolvedTradeCode = { code_type: 'IRC', code_edition: '2021', nec_edition: null, jurisdiction_notes: null, steps: insp(['footing', 'foundation', 'framing', 'sheathing', 'roof_dry_in', 'insulation', 'final']) };
const IPC: ResolvedTradeCode = { code_type: 'IPC', code_edition: '2021', nec_edition: null, jurisdiction_notes: null, steps: insp(['underground', 'rough_in', 'water_supply', 'gas_test', 'final']) };

function ctx(over: Partial<BuildContext>): BuildContext {
  return {
    task: { trade_type: 'electrical', phase: 'rough_in', csi_division: '26 24 16', title: 'Lighting & receptacle rough-in', description: null },
    resolved: NEC, buildingType: 'residential_sf', facts: { ...EMPTY_FACTS },
    ...over,
  } as BuildContext;
}

describe('buildTaskSteps — electrical', () => {
  it('rough-in produces steps gating rough_in with NEC wiring sections', () => {
    const steps = buildTaskSteps(ctx({}));
    expect(steps.length).toBeGreaterThan(0);
    expect(steps.every((s) => s.step_order >= 1)).toBe(true);
    expect(steps.some((s) => s.gating_inspection_type === 'rough_in')).toBe(true);
    const sections = steps.flatMap((s) => s.code_refs.map((r) => r.section));
    expect(sections).toEqual(expect.arrayContaining(['300', '310', '314']));
    // Family refs are NEC; a Trade Knowledge Pack may add refs from another code with an explicit
    // code_type override (e.g. IRC R314.4 smoke-alarm interconnection) — only those are non-NEC.
    const packTypes = new Set(Object.values(PACKS.get('electrical')?.code_refs ?? {}).flat().map((r) => r.code_type).filter(Boolean));
    expect(steps.every((s) => s.code_refs.every((r) => r.code_type === 'NEC' || packTypes.has(r.code_type)))).toBe(true);
  });

  it('parameterizes the panel amperage when facts carry it', () => {
    const withAmp = buildTaskSteps(ctx({
      task: { trade_type: 'electrical', phase: 'service', csi_division: null, title: 'Service entrance & panel', description: null },
      facts: { ...EMPTY_FACTS, panels: [{ amperage: 200, location: null }] },
    }));
    expect(withAmp.some((s) => s.instruction.includes('200A'))).toBe(true);
    expect(withAmp.some((s) => s.gating_inspection_type === 'service')).toBe(true);

    const noAmp = buildTaskSteps(ctx({
      task: { trade_type: 'electrical', phase: 'service', csi_division: null, title: 'Service entrance & panel', description: null },
    }));
    expect(noAmp.some((s) => s.instruction.includes('200A'))).toBe(false);
    expect(noAmp.length).toBeGreaterThan(0); // still valid generic steps
  });

  it('drops a gating inspection the resolved sequence does not contain', () => {
    const resolvedNoService: ResolvedTradeCode = { ...NEC, steps: insp(['rough_in', 'final']) };
    const steps = buildTaskSteps(ctx({
      task: { trade_type: 'electrical', phase: 'service', csi_division: null, title: 'Service entrance & panel', description: null },
      resolved: resolvedNoService,
    }));
    expect(steps.some((s) => s.gating_inspection_type === 'service')).toBe(false);
  });
});

describe('buildTaskSteps — building branches', () => {
  it('framing task gates framing + sheathing and uses trusses from components', () => {
    const steps = buildTaskSteps(ctx({
      task: { trade_type: 'framing', phase: 'framing', csi_division: '06 10 00', title: 'Frame walls & roof', description: null },
      resolved: IRC,
      facts: { ...EMPTY_FACTS, components: ['engineered_trusses', 'lvl_beam'] },
    }));
    const gates = steps.map((s) => s.gating_inspection_type);
    expect(gates).toEqual(expect.arrayContaining(['framing', 'sheathing']));
    expect(steps.some((s) => /truss/i.test(s.instruction))).toBe(true);
  });

  it('roofing task gates roof_dry_in', () => {
    const steps = buildTaskSteps(ctx({
      task: { trade_type: 'roofing', phase: 'roofing', csi_division: '07 30 00', title: 'Install roof', description: null },
      resolved: IRC, facts: { ...EMPTY_FACTS, components: ['asphalt_shingle'] },
    }));
    expect(steps.some((s) => s.gating_inspection_type === 'roof_dry_in')).toBe(true);
  });

  it('site-prep / excavation task carries NO framing code refs and no gating inspection', () => {
    const steps = buildTaskSteps(ctx({
      task: { trade_type: 'general', phase: 'site_prep', csi_division: '31 00 00', title: 'Excavation & rough grading', description: null },
      resolved: IRC,
    }));
    expect(steps.length).toBeGreaterThan(0);
    // regression: excavation used to fall through to the framing fallback (IRC R602/R802)
    const sections = steps.flatMap((s) => s.code_refs.map((r) => r.section));
    expect(sections).not.toContain('R602');
    expect(sections).not.toContain('R802');
    expect(steps.every((s) => s.code_refs.length === 0)).toBe(true);
    expect(steps.every((s) => s.gating_inspection_type === undefined)).toBe(true);
  });
});

describe('buildTaskSteps — plumbing gas gating', () => {
  it('adds a gas_test step only when a gas flag is set', () => {
    const base = { task: { trade_type: 'plumbing', phase: 'rough_in', csi_division: '22 11 00', title: 'Plumbing rough-in', description: null }, resolved: IPC };
    const noGas = buildTaskSteps(ctx({ ...base }));
    expect(noGas.some((s) => s.gating_inspection_type === 'gas_test')).toBe(false);
    const gas = buildTaskSteps(ctx({ ...base, facts: { ...EMPTY_FACTS, flags: { has_natural_gas: true } } }));
    expect(gas.some((s) => s.gating_inspection_type === 'gas_test')).toBe(true);
  });
});

describe('buildTaskSteps — no trade', () => {
  it('returns [] when the task has no trade', () => {
    expect(buildTaskSteps(ctx({ task: { trade_type: null, phase: null, csi_division: null, title: 'x', description: null } }))).toEqual([]);
  });
});

describe('buildTaskSteps — equipment recommendation', () => {
  const types = (steps: ReturnType<typeof buildTaskSteps>) =>
    steps.flatMap((s) => (s.equipment ?? []).map((e) => e.type));

  it('every step carries an equipment array (possibly empty)', () => {
    const steps = buildTaskSteps(ctx({}));
    expect(steps.every((s) => Array.isArray(s.equipment))).toBe(true);
  });

  it('site prep / excavation recommends earthwork equipment', () => {
    const steps = buildTaskSteps(ctx({
      task: { trade_type: 'general', phase: 'site_prep', csi_division: '31 00 00', title: 'Excavation & rough grading', description: null },
      resolved: IRC,
    }));
    expect(types(steps)).toEqual(expect.arrayContaining(['excavator', 'compactor']));
  });

  it('foundation recommends a concrete pump on a large-scale (commercial) job but not a small SFR', () => {
    const base = { task: { trade_type: 'concrete', phase: 'foundation', csi_division: '03 30 00', title: 'Foundation & slab', description: null }, resolved: IRC };
    const comm = buildTaskSteps(ctx({ ...base, buildingType: 'commercial' }));
    expect(types(comm)).toContain('concrete_pump');
    const sfr = buildTaskSteps(ctx({ ...base, buildingType: 'residential_sf' }));
    expect(types(sfr)).not.toContain('concrete_pump');
  });

  it('framing with engineered trusses recommends a crane', () => {
    const steps = buildTaskSteps(ctx({
      task: { trade_type: 'framing', phase: 'framing', csi_division: '06 10 00', title: 'Frame walls & roof', description: null },
      resolved: IRC, facts: { ...EMPTY_FACTS, components: ['engineered_trusses'] },
    }));
    expect(types(steps)).toContain('crane');
  });

  it('a bare electrical rough-in on a small house needs no special equipment', () => {
    const steps = buildTaskSteps(ctx({})); // residential_sf electrical rough_in
    expect(types(steps)).toEqual([]);
  });

  it('equipment types are canonical + carry a reason', () => {
    const steps = buildTaskSteps(ctx({
      task: { trade_type: 'general', phase: 'site_prep', csi_division: '31 00 00', title: 'Excavation', description: null },
      resolved: IRC,
    }));
    for (const s of steps) for (const e of s.equipment ?? []) {
      expect(typeof e.type).toBe('string');
      expect(e.reason.length).toBeGreaterThan(0);
      expect(['heavy_equipment', 'power_tool', 'vehicle', 'trailer', 'attachment']).toContain(e.category);
    }
  });
});
