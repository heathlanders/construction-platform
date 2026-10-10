// trade-map.test.ts — unit tests for tradeToPermitTrade (pure, no DB).
// Mirrors the PERMIT_TRADES rule in blueprint-worker so the task-detail codes panel resolves
// the right code family per task trade.

import { describe, it, expect } from 'vitest';
import { tradeToPermitTrade } from '../lib/jurisdictions/trade-map.js';

describe('tradeToPermitTrade', () => {
  it('maps each MEP trade to its permit trade', () => {
    expect(tradeToPermitTrade('electrical')).toBe('electrical');
    expect(tradeToPermitTrade('plumbing')).toBe('plumbing');
    expect(tradeToPermitTrade('hvac')).toBe('mechanical');
    expect(tradeToPermitTrade('mechanical')).toBe('mechanical');
  });

  it('maps structural / building-envelope trades to the building permit', () => {
    for (const t of ['roofing', 'concrete', 'framing', 'structural', 'general', 'architectural', 'civil', 'insulation', 'drywall', 'finishes']) {
      expect(tradeToPermitTrade(t)).toBe('building');
    }
  });

  it('is case-insensitive and trims', () => {
    expect(tradeToPermitTrade('  Electrical ')).toBe('electrical');
    expect(tradeToPermitTrade('HVAC')).toBe('mechanical');
  });

  it('returns null when no trade is supplied', () => {
    expect(tradeToPermitTrade(null)).toBeNull();
    expect(tradeToPermitTrade(undefined)).toBeNull();
    expect(tradeToPermitTrade('')).toBeNull();
  });

  it('returns building for unknown free-text trades (safe default)', () => {
    expect(tradeToPermitTrade('underwater_basket_weaving')).toBe('building');
  });

  it('returns null for taxonomy no-permit service trades (T-64)', () => {
    expect(tradeToPermitTrade('surveying')).toBeNull();
    expect(tradeToPermitTrade('final_clean')).toBeNull();
  });
});
