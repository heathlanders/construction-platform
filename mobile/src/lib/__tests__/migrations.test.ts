// migrations.test.ts — guard for the highest-consequence mobile bug class.
//
// Bumping `schema.ts` version WITHOUT adding a migration step makes WatermelonDB
// UNSAFE-RESET the local database: every `pending` offline row a field worker has
// not synced yet is silently destroyed. It's invisible in review (both files look
// fine on their own) and invisible in CI (tsc passes) — so assert the invariant.

import { schema } from '../schema';
import { migrations } from '../migrations';

// WatermelonDB's schemaMigrations() returns { sortedMigrations, minVersion, maxVersion }.
const sorted = (migrations as unknown as { sortedMigrations: { toVersion: number }[] }).sortedMigrations;
const versions = sorted.map((m) => m.toVersion).sort((a, b) => a - b);

describe('schema ↔ migrations', () => {
  it('has a migration step for the CURRENT schema version', () => {
    // The live install base sits at the last version that shipped; the newest bump
    // is exactly the one that needs a step.
    expect(versions).toContain(schema.version);
  });

  it('has no gap between migration steps', () => {
    // A gap means a device on the missing version can't step forward → unsafe reset.
    for (let i = 1; i < versions.length; i++) {
      expect(versions[i]).toBe(versions[i - 1] + 1);
    }
  });

  it('never declares a migration ahead of the schema', () => {
    expect(Math.max(...versions)).toBeLessThanOrEqual(schema.version);
  });

  it('every migration step actually does something', () => {
    for (const m of sorted) {
      const steps = (m as unknown as { steps: unknown[] }).steps;
      expect(Array.isArray(steps) && steps.length > 0).toBe(true);
    }
  });
});
