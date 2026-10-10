// scripts/backfill-project-names.ts — rename existing projects from their blueprint build address.
//
// Fixes projects created before street/lot extraction existed (e.g. Example Builders'
// same-named lots). Re-extracts the title block from each project's latest blueprint document
// (old import_metadata lacks street/lot), composes "Lot N - street, city", and renames.
//
//   Dry-run (default):  npm run backfill:project-names
//   Apply:              npm run backfill:project-names -- --apply
//
// Idempotent: only renames when a suggestion exists AND differs from the current name.

import { pgPool } from '../lib/db.js';
import { withTenantContext } from '../lib/tenant-context.js';
import { downloadLiveObject } from '../lib/storage.js';
import { titleBlockFromPdf } from '../lib/blueprint-pdf/title-block-from-pdf.js';
import { composeProjectName } from '../lib/blueprint-pdf/project-name.js';
import { writeAuditEntry } from '../lib/audit-log.js';

interface Candidate {
  tenant_id: string;
  project_id: string;
  old_name: string;
  storage_path: string;
}

const APPLY = process.argv.includes('--apply');

async function collectCandidates(): Promise<Candidate[]> {
  const { rows: tenants } = await pgPool.query<{ id: string }>(
    `SELECT id FROM tenants WHERE deleted_at IS NULL`,
  );
  const out: Candidate[] = [];
  for (const t of tenants) {
    const rows = await withTenantContext(t.id, async (client) => {
      // Latest blueprint analysis per project that has a downloadable document.
      const res = await client.query<{ project_id: string; old_name: string; storage_path: string }>(
        `SELECT DISTINCT ON (p.id)
                p.id   AS project_id,
                p.name AS old_name,
                d.storage_path AS storage_path
         FROM projects p
         JOIN blueprint_analyses ba
           ON ba.project_id = p.id AND ba.deleted_at IS NULL AND ba.document_id IS NOT NULL
         JOIN documents d
           ON d.id = ba.document_id AND d.deleted_at IS NULL AND d.storage_path IS NOT NULL
         WHERE p.deleted_at IS NULL
         ORDER BY p.id, ba.created_at DESC`,
      );
      return res.rows;
    });
    for (const r of rows) {
      out.push({ tenant_id: t.id, project_id: r.project_id, old_name: r.old_name, storage_path: r.storage_path });
    }
  }
  return out;
}

async function run(): Promise<void> {
  console.log(`\nProject-name backfill — ${APPLY ? 'APPLY (writing)' : 'DRY-RUN (no writes)'}\n`);

  const candidates = await collectCandidates();
  console.log(`Found ${candidates.length} project(s) with a blueprint document.\n`);

  let renamed = 0;
  let skippedNoSuggestion = 0;
  let skippedSame = 0;
  let failed = 0;
  const planned: Array<{ project_id: string; from: string; to: string }> = [];

  for (const c of candidates) {
    let suggested: string | null = null;
    try {
      const buffer = await downloadLiveObject(c.storage_path);
      const tb = await titleBlockFromPdf(buffer);
      suggested = composeProjectName({
        lot_number: tb.lot_number,
        street_address: tb.street_address,
        city: tb.city,
      });
    } catch (err) {
      failed++;
      console.warn(`  ✗ ${c.project_id}  extract failed: ${(err as Error).message}`);
      continue;
    }

    if (!suggested) { skippedNoSuggestion++; continue; }
    if (suggested === c.old_name) { skippedSame++; continue; }

    planned.push({ project_id: c.project_id, from: c.old_name, to: suggested });
    console.log(`  • ${c.project_id}\n      "${c.old_name}"  →  "${suggested}"`);

    if (APPLY) {
      await withTenantContext(c.tenant_id, async (client) => {
        await client.query(
          `UPDATE projects SET name = $1, version = version + 1, updated_at = NOW()
           WHERE id = $2 AND deleted_at IS NULL`,
          [suggested, c.project_id],
        );
        await writeAuditEntry(client, {
          tenantId: c.tenant_id, category: 'data', action: 'project.renamed',
          actorEmail: 'system@backfill', actorRole: 'system',
          resourceType: 'project', resourceId: c.project_id,
          payload: { from: c.old_name, to: suggested, source: 'backfill' },
        });
      });
      renamed++;
    }
  }

  console.log(
    `\nSummary: ${planned.length} rename(s) ${APPLY ? `applied (${renamed})` : 'proposed'}, ` +
    `${skippedNoSuggestion} no-suggestion, ${skippedSame} already-named, ${failed} failed.`,
  );
  if (!APPLY && planned.length > 0) {
    console.log(`\nRe-run with --apply to commit these renames.`);
  }
}

run()
  .then(() => pgPool.end())
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('backfill failed:', err);
    void pgPool.end();
    process.exit(1);
  });
