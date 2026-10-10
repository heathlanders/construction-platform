// theme.test.ts — canonical color helpers (M1 — Mobile Design Parity).
// Guards the STATUS_MAP / STATUS / SEVERITY contract the UI kit depends on.

import {
  STATUS,
  STATUS_MAP,
  statusColor,
  SEVERITY,
  severityColor,
  type StatusTone,
} from '../theme';

describe('status colors', () => {
  it('every STATUS_MAP value is a valid STATUS tone', () => {
    for (const [state, tone] of Object.entries(STATUS_MAP)) {
      expect(STATUS[tone as StatusTone]).toBeDefined();
      // sanity: state key is lowercase snake (domain enum shape)
      expect(state).toBe(state.toLowerCase());
    }
  });

  it('every STATUS tone has fg + bg hex', () => {
    for (const tone of Object.keys(STATUS) as StatusTone[]) {
      expect(STATUS[tone].fg).toMatch(/^#[0-9a-f]{6}$/i);
      expect(STATUS[tone].bg).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it('statusColor resolves known states and falls back to neutral', () => {
    expect(statusColor('active')).toEqual(STATUS.success);
    expect(statusColor('rejected')).toEqual(STATUS.danger);
    expect(statusColor('draft')).toEqual(STATUS.neutral);
    expect(statusColor('nonexistent_state')).toEqual(STATUS.neutral);
    expect(statusColor(null)).toEqual(STATUS.neutral);
    expect(statusColor(undefined)).toEqual(STATUS.neutral);
  });
});

describe('severity colors', () => {
  it('covers all 5 OSHA severities with hex', () => {
    for (const s of ['near_miss', 'first_aid', 'recordable', 'lost_time', 'fatality']) {
      expect(SEVERITY[s]).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it('severityColor falls back to neutral for unknown/null', () => {
    expect(severityColor('near_miss')).toBe(SEVERITY.near_miss);
    expect(severityColor('bogus')).toBe('#6b7280');
    expect(severityColor(null)).toBe('#6b7280');
  });
});
