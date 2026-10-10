import { describe, it, expect } from 'vitest';
import { composeProjectName } from '../lib/blueprint-pdf/project-name.js';
import { extractTitleBlock } from '../lib/blueprint-pdf/title-block.js';

describe('composeProjectName', () => {
  it('full: lot + street + city', () => {
    expect(composeProjectName({ lot_number: '25', street_address: '437 Maple St', city: 'MADISON' }))
      .toBe('Lot 25 - 437 Maple St, Madison');
  });

  it('lot + city only', () => {
    expect(composeProjectName({ lot_number: '25', street_address: null, city: 'MADISON' }))
      .toBe('Lot 25 - Madison');
  });

  it('street + city, no lot', () => {
    expect(composeProjectName({ lot_number: null, street_address: '437 Maple St', city: 'MADISON' }))
      .toBe('437 Maple St, Madison');
  });

  it('city only', () => {
    expect(composeProjectName({ lot_number: null, street_address: null, city: 'MADISON' }))
      .toBe('Madison');
  });

  it('lot only', () => {
    expect(composeProjectName({ lot_number: '12B', street_address: null, city: null }))
      .toBe('Lot 12B');
  });

  it('all null → null (keep existing name)', () => {
    expect(composeProjectName({ lot_number: null, street_address: null, city: null })).toBeNull();
  });
});

describe('title-block street + lot extraction', () => {
  // Title blocks repeat on every sheet — duplicate the line so the cross-match vote is stable.
  const sample = `
    EXAMPLE DRAFTING SERVICES
    LOT 25  437 MAPLE ST
    COTTAGE GROVE WI 53527
    LOT 25  437 MAPLE ST
    COTTAGE GROVE WI 53527
  `;

  it('extracts the lot number (digits only, not the word LOT)', () => {
    expect(extractTitleBlock(sample).lot_number).toBe('25');
  });

  it('extracts and Title-Cases the street address', () => {
    const tb = extractTitleBlock(sample);
    expect(tb.street_address).toContain('437');
    expect(tb.street_address).toBe('437 Maple St');
  });
});
