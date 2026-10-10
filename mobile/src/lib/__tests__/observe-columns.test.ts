/**
 * WatermelonDB's plain `query(...).observe()` emits when the record SET changes —
 * it says nothing when a field of a row already in the list changes.
 *
 * Every list screen we had was subscribed that way, so an in-place edit was invisible:
 * tapping "PASSED" on an inspection closed the sheet and left the card reading
 * SCHEDULED; a `sync_status` flip never showed the `•` pending marker; a pulled cert
 * renewal kept displaying the OLD expiry date on the one screen whose entire job is
 * expiry. Nothing errors — the UI just quietly lies, and the natural read is "the tap
 * didn't work", so you tap again.
 *
 * Caught by the conflict E2E (2026-07-27), which couldn't get an inspection into the
 * state it needed because the screen wouldn't reflect the change it had just made.
 *
 * Rule: subscribe with `observeWithColumns([...])` listing every column the view maps.
 * If a screen genuinely only cares about membership (adds/removes), opt out explicitly
 * with a `// observe-ok:` comment on the same line saying why.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const SRC = join(__dirname, '..', '..');

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(ts|tsx)$/.test(name) && !p.includes('__tests__')) out.push(p);
  }
  return out;
}

describe('WatermelonDB list subscriptions declare their columns', () => {
  it('uses observeWithColumns (or an explicit // observe-ok: opt-out)', () => {
    const offenders: string[] = [];
    for (const file of walk(SRC)) {
      readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
        const code = line.trim();
        // Skip comments — several of these files DISCUSS `.observe()` in the note
        // explaining why they don't call it, and a guard that flags its own
        // documentation trains people to delete the documentation.
        if (code.startsWith('//') || code.startsWith('*')) return;
        // `.observeCount()` is fine — it only reports set size by definition.
        if (/\.observe\(\)/.test(line) && !/observe-ok:/.test(line)) {
          offenders.push(`${relative(SRC, file)}:${i + 1}`);
        }
      });
    }
    expect(offenders).toEqual([]);
  });

  it('actually scans real source (guards the guard)', () => {
    const files = walk(SRC);
    expect(files.length).toBeGreaterThan(30);
    expect(files.some((f) => f.endsWith('InspectionsScreen.tsx'))).toBe(true);
  });
});
