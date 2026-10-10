// task-buildout/code-refs.ts — map a (permit trade, inspection_type) to concrete code-section refs.
//
// Sourced from the model-code families the jurisdiction engine resolves (NEC/IPC/UPC/IMC/UMC/IRC/IBC)
// and the section hints already embedded in the *-codes/inspection-sequences.ts descriptions. The
// engine passes the resolved code_type so refs carry the right family (e.g. IPC vs UPC). Sections are
// stable model-code references; jurisdiction amendments are surfaced separately via jurisdiction_notes.

import type { Trade } from '../jurisdictions/types.js';
import { packCodeRefs } from '../trades/packs/runtime.js';
import type { CodeRef } from './types.js';

type SectionMap = Record<string, { section: string; note: string }[]>;

// Per-trade, keyed by inspection_type. code_type is filled from the resolved code at call time.
const SECTIONS: Record<Trade, SectionMap> = {
  electrical: {
    temporary_power: [{ section: 'Art. 590', note: 'Temporary installations' }],
    rough_in: [
      { section: '300', note: 'Wiring methods' },
      { section: '310', note: 'Conductors for general wiring' },
      { section: '314', note: 'Outlet, device & junction boxes' },
    ],
    service: [
      { section: '230', note: 'Services' },
      { section: '240', note: 'Overcurrent protection' },
      { section: '250', note: 'Grounding & bonding' },
    ],
    cover: [{ section: '300.4', note: 'Protection against physical damage before cover' }],
    final: [
      { section: '210.12', note: 'AFCI protection' },
      { section: '210.8', note: 'GFCI protection' },
      { section: '210.52', note: 'Receptacle placement' },
    ],
  },
  plumbing: {
    underground: [{ section: 'Ch. 7', note: 'Sanitary drainage (DWV) underground' }],
    rough_in: [
      { section: 'Ch. 6', note: 'Water supply & distribution' },
      { section: 'Ch. 7', note: 'Sanitary drainage' },
      { section: 'Ch. 9', note: 'Vents' },
    ],
    water_supply: [{ section: '312.5', note: 'Water-supply system test' }],
    gas_test: [{ section: 'Fuel Gas', note: 'Fuel-gas piping pressure test (IFGC/UPC)' }],
    final: [
      { section: 'Ch. 4', note: 'Fixtures' },
      { section: '1002', note: 'Traps & cleanouts' },
    ],
  },
  mechanical: {
    rough_in: [
      { section: 'Ch. 6', note: 'Duct systems' },
      { section: 'Ch. 3', note: 'General regulations / clearances' },
    ],
    duct_leakage: [{ section: 'IECC 403', note: 'Duct sealing & leakage' }],
    equipment_set: [{ section: 'Ch. 3', note: 'Equipment installation & access' }],
    gas_refrigerant_test: [{ section: 'Ch. 11', note: 'Refrigeration / gas piping test' }],
    final: [{ section: 'Ch. 5', note: 'Exhaust systems & combustion air' }],
  },
  building: {
    footing: [{ section: 'R403', note: 'Footings' }],
    foundation: [
      { section: 'R404', note: 'Foundation walls' },
      { section: 'R406', note: 'Foundation waterproofing/damp-proofing' },
    ],
    framing: [
      { section: 'R602', note: 'Wood wall framing' },
      { section: 'R802', note: 'Roof-ceiling framing' },
    ],
    sheathing: [{ section: 'R602.10', note: 'Braced walls / shear nailing' }],
    roof_dry_in: [{ section: 'R905', note: 'Roof covering & underlayment' }],
    insulation: [{ section: 'N1102', note: 'Building thermal envelope (R-values)' }],
    final: [{ section: 'R310', note: 'Emergency escape & egress' }, { section: 'R312', note: 'Guards & handrails' }],
  },
};

/**
 * Concrete code refs for one inspection_type under the resolved code family, plus any refs the
 * task's Trade Knowledge Pack adds for that inspection (deduped by section, family map first).
 */
export function codeRefsFor(trade: Trade, inspectionType: string, codeType: string, tradeKey?: string | null): CodeRef[] {
  const rows: { section: string; note: string; code_type?: string }[] = [...(SECTIONS[trade]?.[inspectionType] ?? [])];
  if (tradeKey) {
    const seen = new Set(rows.map((r) => r.section));
    for (const r of packCodeRefs(tradeKey, inspectionType)) if (!seen.has(r.section)) { rows.push(r); seen.add(r.section); }
  }
  return rows.map((r) => ({ code_type: r.code_type ?? codeType, section: r.section, note: r.note }));
}
