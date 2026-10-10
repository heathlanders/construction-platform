/**
 * Every list endpoint caps `limit` (T-01: max 100 per page, a few routes allow 200).
 * Ask for more and Zod rejects the whole request with 422 — and the callers that got
 * this wrong all wrapped the fetch in a `.catch(() => ({ items: [] }))` or an
 * `if (d.items)` guard, so the screen just rendered EMPTY. Forever. No error, no log.
 *
 * That's how `limit=200` on the mobile Time hub made every worker's week grid and
 * "Today's Entries" permanently blank, and how the web certifications page shipped
 * with an empty user dropdown. Found by the Maestro offline-sync E2E (2026-07-27),
 * not by a human, because nothing about the UI said it was broken.
 *
 * This test is the reason it can't come back: it parses each route's own Zod ceiling
 * and asserts no caller in web/ or mobile/ exceeds it. Raising a route's max here is
 * fine; asking for more than the route allows is not.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const REPO = new URL('../../../', import.meta.url).pathname;
const ROUTES_DIR = join(REPO, 'api/src/routes/v1');
const CALLER_DIRS = [join(REPO, 'web/src'), join(REPO, 'mobile/src')];

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(ts|tsx)$/.test(name)) out.push(p);
  }
  return out;
}

/** resource segment (`time-entries`) → the smallest `limit` max any of its list schemas allows */
function routeLimits(): Map<string, number> {
  const limits = new Map<string, number>();
  for (const f of readdirSync(ROUTES_DIR).filter((n) => n.endsWith('.ts'))) {
    const src = readFileSync(join(ROUTES_DIR, f), 'utf8');
    const found = [...src.matchAll(/limit\s*:\s*z\.coerce\.number\(\)[^,\n]*?max\((\d+)\)/g)]
      .map((m) => Number(m[1]));
    if (found.length) limits.set(f.replace(/\.ts$/, ''), Math.min(...found));
  }
  return limits;
}

describe('list `limit=` callers stay within the route ceiling', () => {
  const limits = routeLimits();

  it('parses a ceiling out of the route files at all', () => {
    // Guards the guard: a refactor of the query schemas that breaks this regex would
    // otherwise make the whole test vacuously pass.
    expect(limits.size).toBeGreaterThan(20);
    expect(limits.get('time-entries')).toBe(100);
  });

  it('has no caller requesting more than its route allows', () => {
    const offenders: string[] = [];
    for (const dir of CALLER_DIRS) {
      for (const file of walk(dir)) {
        const lines = readFileSync(file, 'utf8').split('\n');
        lines.forEach((line, i) => {
          for (const m of line.matchAll(/[`'"/]([a-z0-9-]+)\?[^`'"]*limit=(\d+)/g)) {
            const max = limits.get(m[1]);
            if (max !== undefined && Number(m[2]) > max) {
              offenders.push(`${relative(REPO, file)}:${i + 1} → ${m[1]} limit=${m[2]} (max ${max})`);
            }
          }
        });
      }
    }
    expect(offenders).toEqual([]);
  });
});
