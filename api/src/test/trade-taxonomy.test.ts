// trade-taxonomy.test.ts — unit tests for the canonical trade taxonomy (pure, no DB). T-64.

import { describe, it, expect } from 'vitest';
import {
  TRADE_TAXONOMY,
  TRADE_BY_KEY,
  TRADE_ALIAS_MAP,
  tradeDef,
  normalizeTradeKey,
} from '../lib/trades/taxonomy.js';
import { tradeToPermitTrade } from '../lib/jurisdictions/trade-map.js';
import { TRADES } from '../lib/jurisdictions/types.js';

// The 13 legacy blueprint TradeType keys — must exist forever (free-text columns store them).
const LEGACY_TRADES = [
  'general', 'civil', 'structural', 'concrete', 'framing', 'roofing', 'architectural',
  'electrical', 'plumbing', 'hvac', 'insulation', 'drywall', 'finishes',
];

describe('trade taxonomy integrity', () => {
  it('has unique keys', () => {
    const keys = TRADE_TAXONOMY.map((d) => d.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('every trade has a non-empty Spanish label (Phase 5 — P-09)', () => {
    for (const d of TRADE_TAXONOMY) {
      expect(d.label_es?.trim().length, d.key).toBeGreaterThan(0);
    }
  });

  it('keys are stable snake_case', () => {
    for (const d of TRADE_TAXONOMY) {
      expect(d.key).toMatch(/^[a-z][a-z0-9_]*$/);
    }
  });

  it('no alias collides with a key or another alias', () => {
    const keys = new Set(TRADE_TAXONOMY.map((d) => d.key));
    const seenAliases = new Set<string>();
    for (const d of TRADE_TAXONOMY) {
      for (const a of d.aliases ?? []) {
        expect(keys.has(a)).toBe(false);
        expect(seenAliases.has(a)).toBe(false);
        seenAliases.add(a);
      }
    }
    expect(TRADE_ALIAS_MAP.size).toBe(seenAliases.size);
  });

  it('contains every legacy blueprint TradeType key, marked legacy', () => {
    for (const key of LEGACY_TRADES) {
      const d = TRADE_BY_KEY.get(key);
      expect(d, key).toBeDefined();
      expect(d!.legacy, key).toBe(true);
    }
  });

  it('every permit_trade is a valid jurisdiction Trade or null', () => {
    for (const d of TRADE_TAXONOMY) {
      if (d.permit_trade !== null) {
        expect(TRADES, d.key).toContain(d.permit_trade);
      }
    }
  });

  it('covers all four permit trades and the no-permit service class', () => {
    const permits = new Set(TRADE_TAXONOMY.map((d) => d.permit_trade));
    for (const t of TRADES) expect(permits).toContain(t);
    expect(permits).toContain(null);
  });
});

describe('tradeDef / normalizeTradeKey', () => {
  it('resolves keys directly, case-insensitive with whitespace', () => {
    expect(tradeDef('asphalt_paving')?.key).toBe('asphalt_paving');
    expect(tradeDef('  Cabinetry ')?.key).toBe('cabinetry');
  });

  it('resolves aliases to the canonical key', () => {
    expect(normalizeTradeKey('mechanical')).toBe('hvac');
    expect(normalizeTradeKey('striping')).toBe('pavement_marking');
    expect(normalizeTradeKey('cabinet_installation')).toBe('cabinetry');
    expect(normalizeTradeKey('sprinkler')).toBe('fire_sprinkler');
  });

  it('returns null for unknown / empty input', () => {
    expect(tradeDef('underwater_basket_weaving')).toBeNull();
    expect(tradeDef('')).toBeNull();
    expect(tradeDef(null)).toBeNull();
  });
});

describe('taxonomy → permit-trade collapse (via tradeToPermitTrade)', () => {
  it('routes electrical-family trades to the electrical permit', () => {
    for (const t of ['low_voltage', 'fire_alarm', 'security_access', 'solar_pv', 'ev_charging', 'generators']) {
      expect(tradeToPermitTrade(t), t).toBe('electrical');
    }
  });

  it('routes plumbing-family trades to the plumbing permit', () => {
    for (const t of ['fire_sprinkler', 'gas_piping', 'medical_gas', 'septic', 'site_utilities', 'irrigation']) {
      expect(tradeToPermitTrade(t), t).toBe('plumbing');
    }
  });

  it('routes mechanical-family trades to the mechanical permit', () => {
    for (const t of ['ductwork', 'refrigeration', 'boilers_hydronic', 'controls_bms', 'cold_storage']) {
      expect(tradeToPermitTrade(t), t).toBe('mechanical');
    }
  });

  it('routes structural / envelope / interior trades to the building permit', () => {
    for (const t of ['asphalt_paving', 'masonry', 'structural_steel', 'siding', 'drywall', 'stairs_railings', 'pools_spas']) {
      expect(tradeToPermitTrade(t), t).toBe('building');
    }
  });

  it('service trades have no permit path (null)', () => {
    for (const t of ['surveying', 'final_clean', 'painting', 'cabinetry', 'pavement_marking', 'landscaping']) {
      expect(tradeToPermitTrade(t), t).toBeNull();
    }
  });

  it('aliases collapse identically', () => {
    expect(tradeToPermitTrade('blacktop')).toBe('building');
    expect(tradeToPermitTrade('tab')).toBe('mechanical');
  });
});

// Trade Knowledge Packs Wave 0a (2026-10-08) — taxonomy completed against CSLB license classes,
// NAICS 236/237/238, BLS SOC 47 and CSI MasterFormat. See docs/Trade_Knowledge_Packs_v1_0.md §1.
describe('taxonomy expansion (Wave 0a)', () => {
  it('has 183 trades', () => {
    expect(TRADE_TAXONOMY.length).toBe(183);
  });

  it('every heavy_civil trade is DOT/owner-inspected — no AHJ permit path', () => {
    const hc = TRADE_TAXONOMY.filter((d) => d.category === 'heavy_civil');
    expect(hc.length).toBe(12);
    for (const d of hc) expect(d.permit_trade, d.key).toBeNull();
  });

  it('every services trade has no permit path', () => {
    for (const d of TRADE_TAXONOMY.filter((x) => x.category === 'services')) {
      expect(d.permit_trade, d.key).toBeNull();
    }
  });

  it('covers each group the source review found missing', () => {
    for (const key of [
      'decks', 'hardscape_pavers', 'remodeling', 'restoration', 'manufactured_modular', // residential/remodel
      'formwork', 'pemb', 'specialties', 'battery_storage', 'kitchen_exhaust',          // commercial
      'pipeline', 'power_line', 'highway_bridge', 'rail_track',                         // heavy civil
      'architect', 'engineering', 'utility_locating', 'equipment_rental',               // services
    ]) {
      expect(TRADE_BY_KEY.has(key), key).toBe(true);
    }
  });

  it('hardscape now means pavers, not retaining walls', () => {
    expect(normalizeTradeKey('hardscape')).toBe('hardscape_pavers');
    expect(normalizeTradeKey('segmental_retaining_wall')).toBe('retaining_walls');
  });

  it('alias-only trades resolve to the right key', () => {
    const cases: Record<string, string> = {
      lead_paint: 'abatement', locksmith: 'security_access', backflow: 'plumbing',
      fiber: 'low_voltage', handyman: 'remodeling', land_clearing: 'tree_service',
      cement_mason: 'concrete', duct_cleaning: 'hvac', wheelchair_lift: 'elevator',
    };
    for (const [alias, key] of Object.entries(cases)) expect(normalizeTradeKey(alias), alias).toBe(key);
  });
});
