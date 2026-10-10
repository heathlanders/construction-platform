// trades/packs/catalog-scan.ts — read seeded system assembly codes out of the migration SQL.
// Tooling/test only (file I/O) — engines never import this.

import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../../../..');
export const MIGRATIONS_DIR = join(REPO_ROOT, 'prisma', 'migrations');

const CODE_RE = /'((?:E|P|M|B|G|HC|EQUIP|PARAM)-[A-Z0-9][A-Z0-9-]*)'/g;

/** code → first migration that inserts it (only migrations that touch estimate_assemblies). */
export function seededCatalogCodes(): Map<string, string> {
  const out = new Map<string, string>();
  if (!existsSync(MIGRATIONS_DIR)) return out;
  for (const dir of readdirSync(MIGRATIONS_DIR).sort()) {
    const f = join(MIGRATIONS_DIR, dir, 'migration.sql');
    if (!existsSync(f)) continue;
    const sql = readFileSync(f, 'utf8');
    if (!/estimate_assemblies/i.test(sql)) continue;
    for (const m of sql.matchAll(CODE_RE)) if (!out.has(m[1])) out.set(m[1], dir);
  }
  return out;
}

/** Next free migration number, zero-padded (e.g. '0048'). */
export function nextMigrationNumber(): string {
  const nums = existsSync(MIGRATIONS_DIR)
    ? readdirSync(MIGRATIONS_DIR).map((d) => parseInt(d.slice(0, 4), 10)).filter((n) => !Number.isNaN(n))
    : [];
  return String((nums.length ? Math.max(...nums) : 0) + 1).padStart(4, '0');
}
