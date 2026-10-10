// conflict-registry.test.ts — the pure half of the registry-driven conflict resolve
// (T-13 tiers, T-14 "resolve every differing field"). No DB, no fetch.

import {
  CONFLICT_TABLES, conflictDef, norm, displayValue, differingFields, mergeChoices,
  allResolved, canResolve, type ConflictField,
} from '../conflict-registry';

const FIELDS: ConflictField[] = [
  { key: 'hours_worked', labelKey: 'x', kind: 'hours' },
  { key: 'hourly_rate_cents', labelKey: 'x', kind: 'money' },
  { key: 'notes', labelKey: 'x' },
];

describe('registry shape', () => {
  it('every table has a def, an endpoint and at least one field', () => {
    for (const def of CONFLICT_TABLES) {
      expect(def.endpoint.startsWith('/')).toBe(true);
      expect(def.responseKey).toBeTruthy();
      expect(def.fields.length).toBeGreaterThan(0);
      expect([2, 3]).toContain(def.tier);
    }
  });

  it('tier-3 tables declare who may resolve (T-13)', () => {
    for (const def of CONFLICT_TABLES.filter((d) => d.tier === 3)) {
      expect(def.resolveRoles && def.resolveRoles.length).toBeTruthy();
    }
  });

  it('covers every offline-writable table that can conflict', () => {
    const tables = CONFLICT_TABLES.map((d) => d.table);
    // daily_reports is Tier 1 (last-write-wins) so it has no resolve screen by design.
    expect(tables).toEqual(
      expect.arrayContaining(['time_entries', 'punch_list_items', 'safety_incidents', 'inspections']),
    );
    expect(conflictDef('inspections')?.tier).toBe(2);
    expect(conflictDef('nope')).toBeUndefined();
  });
});

describe('norm / displayValue', () => {
  it('treats empty string, null and undefined as the same "empty"', () => {
    expect(norm('')).toBeNull();
    expect(norm(null)).toBeNull();
    expect(norm(undefined)).toBeNull();
    expect(norm(0)).toBe(0); // zero is a real value, not empty
  });

  it('formats by kind', () => {
    expect(displayValue({ key: 'r', labelKey: 'x', kind: 'money' }, 5500)).toBe('$55.00');
    expect(displayValue({ key: 'h', labelKey: 'x', kind: 'hours' }, 8)).toBe('8.00');
    expect(displayValue({ key: 'd', labelKey: 'x', kind: 'date' }, '2026-07-25T12:00:00Z')).toBe('2026-07-25');
    expect(displayValue({ key: 'n', labelKey: 'x' }, null)).toBe('—');
  });
});

describe('differingFields', () => {
  it('only reports genuinely different values', () => {
    const local = { hours_worked: 8, hourly_rate_cents: 5500, notes: '' };
    const server = { hours_worked: 9, hourly_rate_cents: 5500, notes: null };
    // notes '' vs null is NOT a difference; hours is.
    expect(differingFields(FIELDS, local, server).map((f) => f.key)).toEqual(['hours_worked']);
  });
});

describe('mergeChoices + allResolved (T-14)', () => {
  const local = { hours_worked: 8, hourly_rate_cents: 5500, notes: 'mine' };
  const server = { hours_worked: 9, hourly_rate_cents: 6000, notes: 'mine' };

  it('is not resolvable until EVERY differing field has a choice', () => {
    expect(allResolved(FIELDS, local, server, {})).toBe(false);
    expect(allResolved(FIELDS, local, server, { hours_worked: 'mine' })).toBe(false);
    expect(allResolved(FIELDS, local, server, { hours_worked: 'mine', hourly_rate_cents: 'server' })).toBe(true);
  });

  it('applies each pick and keeps identical fields untouched', () => {
    const merged = mergeChoices(FIELDS, local, server, { hours_worked: 'server', hourly_rate_cents: 'mine' });
    expect(merged).toEqual({ hours_worked: 9, hourly_rate_cents: 5500, notes: 'mine' });
  });

  it('normalises empties in the merged output', () => {
    const merged = mergeChoices(FIELDS, { ...local, notes: '' }, { ...server, notes: '' }, {
      hours_worked: 'mine', hourly_rate_cents: 'mine',
    });
    expect(merged.notes).toBeNull();
  });
});

describe('canResolve (tier-3 gate)', () => {
  const safety = conflictDef('safety_incidents')!;
  const timeEntries = conflictDef('time_entries')!;

  it('lets anyone resolve a tier-2 table', () => {
    expect(canResolve(timeEntries, 'FIELD_TECH')).toBe(true);
    expect(canResolve(timeEntries, null)).toBe(true);
  });

  it('restricts tier-3 to the authorized roles, case-insensitively (JWT role is UPPERCASE)', () => {
    expect(canResolve(safety, 'SAFETY_OFFICER')).toBe(true);
    expect(canResolve(safety, 'owner')).toBe(true);
    expect(canResolve(safety, 'FIELD_TECH')).toBe(false);
    expect(canResolve(safety, null)).toBe(false);
  });
});
