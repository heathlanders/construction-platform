// routes/v1/admin-jurisdictions.ts — Super-admin curation of the codes-engine reference tables.
// Doc 16 Phase 4. Lets a platform admin edit AHJ contacts, code amendments, and inspection
// sequence_ops WITHOUT a deploy.
//
// Tables are platform-scoped reference data with NO RLS (migration 0020) — so handlers use the
// raw pgPool with NO withTenantContext (there is no tenant to scope to). Every write:
//   1. commits the row + a PLATFORM-scope audit entry on the SAME transaction client, then
//   2. awaits refreshReferenceCache() so the live engine reflects the edit.
// If the refresh throws (e.g. a bad PRE-EXISTING row), the write is already durable → we return
// 2xx with cache_refreshed:false (a 5xx would falsely imply the write failed; the engine self-heals
// on the next boot/reload). The GET .../validate route surfaces such bad rows proactively.
//
// All routes behind the SHARED requireSuperAdmin (decodes token, sets req.jwt → admin_id for audit).

import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { pgPool } from '../../lib/db.js';
import { writeAuditEntry } from '../../lib/audit-log.js';
import { requireSuperAdmin } from '../../middleware/auth.js';
import { refreshReferenceCache, normalizeLayer } from '../../lib/jurisdictions/reference-store.js';
import { ADMIN_SOURCE_TAG } from '../../lib/jurisdictions/ts-seed-source.js';

// ─── enums (mirror lib/jurisdictions/types.ts + the DB CHECKs) ───────────────────
const TRADES = ['electrical', 'plumbing', 'mechanical', 'building'] as const;
const LAYER_LEVELS = ['state', 'county', 'city'] as const;       // DB CHECK has NO 'national'
const AHJ_LEVELS = ['national', 'state', 'county', 'city'] as const;
const BUILDING_TYPES = ['residential_sf', 'residential_mf', 'commercial', 'industrial'] as const;

// ─── JSONB shape schemas (mirror types.ts) ───────────────────────────────────────
const InspectionStepDefZ = z.object({
  sequence_order: z.number().int(),
  inspection_type: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  csi_division: z.string(),
  estimated_duration_days: z.number().int(),
  required_for_building_types: z.array(z.enum(BUILDING_TYPES)).optional(),
});

const SequenceOpZ = z.discriminatedUnion('op', [
  z.object({ op: z.literal('add'), step: InspectionStepDefZ }),
  z.object({ op: z.literal('remove'), inspection_type: z.string().min(1) }),
  z.object({ op: z.literal('modify'), inspection_type: z.string().min(1), patch: InspectionStepDefZ.partial() }),
  z.object({ op: z.literal('replace_all'), steps: z.array(InspectionStepDefZ) }),
]);

const TradeCodeOverrideZ = z.object({
  code_type: z.string().optional(),
  code_edition: z.string().optional(),
  nec_edition: z.string().optional(),
  amendments_notes: z.string().optional(),
  sequence_ops: z.array(SequenceOpZ).optional(),
}).strict();

const CodesZ = z.object({
  electrical: TradeCodeOverrideZ.optional(),
  plumbing: TradeCodeOverrideZ.optional(),
  mechanical: TradeCodeOverrideZ.optional(),
  building: TradeCodeOverrideZ.optional(),
}).strict();

const AhjMetadataZ = z.object({
  ahj_name: z.string().min(1),
  ahj_level: z.enum(AHJ_LEVELS),
  permit_office: z.string().optional(),
  contact_name: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  website: z.string().optional(),
  address: z.string().optional(),
  fee_notes: z.string().optional(),
  submittal_requirements: z.array(z.string()).optional(),
}).strict();

// ─── field primitives ────────────────────────────────────────────────────────────
const stateCode = z.string().length(2).transform((s) => s.toUpperCase());
const countyFips = z.string().regex(/^\d{5}$/);
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

// ─── layer schemas ────────────────────────────────────────────────────────────────
const LayerCreateZ = z
  .object({
    level: z.enum(LAYER_LEVELS),
    state_code: stateCode.optional(),
    county_fips: countyFips.optional(),
    county_name: z.string().max(100).optional(),
    city_name: z.string().max(120).optional(),
    ahj: AhjMetadataZ.optional(),
    codes: CodesZ.optional(),
    notes: z.string().optional(),
    last_verified: isoDate.optional(),
  })
  .superRefine((d, ctx) => {
    for (const issue of perLevelKeyIssues(d)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: [issue.field], message: issue.message });
    }
  });

// PATCH: every field optional; nullable so a field can be cleared. The MERGED row is validated
// against the per-level key rules below (so e.g. nulling city_name on a city layer → 422).
const LayerPatchZ = z.object({
  level: z.enum(LAYER_LEVELS).optional(),
  state_code: stateCode.optional(),
  county_fips: countyFips.nullable().optional(),
  county_name: z.string().max(100).nullable().optional(),
  city_name: z.string().max(120).nullable().optional(),
  ahj: AhjMetadataZ.nullable().optional(),
  codes: CodesZ.nullable().optional(),
  notes: z.string().nullable().optional(),
  last_verified: isoDate.optional(),
});

const LayerListQ = z.object({
  state: z.string().length(2).optional(),
  level: z.enum(LAYER_LEVELS).optional(),
});

// ─── edition schemas ────────────────────────────────────────────────────────────────
const EditionUpsertZ = z.object({
  trade: z.enum(TRADES),
  state_code: stateCode,
  code_type: z.string().min(1),
  code_edition: z.string().optional(),
  nec_edition: z.string().optional(),
  notes: z.string().optional(),
  last_verified: isoDate.optional(),
});
const EditionPatchZ = z.object({
  trade: z.enum(TRADES).optional(),
  state_code: stateCode.optional(),
  code_type: z.string().min(1).optional(),
  code_edition: z.string().nullable().optional(),
  nec_edition: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  last_verified: isoDate.optional(),
});
const EditionListQ = z.object({
  state: z.string().length(2).optional(),
  trade: z.enum(TRADES).optional(),
});

// ─── per-level key rules (mirror reference-store.normalizeLayer's load-time throw) ──────
interface Keyish {
  level: string;
  state_code?: string | null;
  county_fips?: string | null;
  county_name?: string | null;
  city_name?: string | null;
}
function perLevelKeyIssues(d: Keyish): Array<{ field: string; message: string }> {
  const issues: Array<{ field: string; message: string }> = [];
  if (!d.state_code) issues.push({ field: 'state_code', message: 'state_code is required' });
  if (d.level === 'county' && !d.county_fips && !d.county_name) {
    issues.push({ field: 'county_fips', message: 'county_fips or county_name required for a county layer' });
  }
  if (d.level === 'city' && !d.city_name) {
    issues.push({ field: 'city_name', message: 'city_name required for a city layer' });
  }
  return issues;
}

// ─── helpers ────────────────────────────────────────────────────────────────────────
interface AdminJwt { admin_id?: string; user_id?: string }

async function audit(
  client: import('pg').PoolClient,
  req: FastifyRequest,
  action: string,
  resourceType: string,
  resourceId: string,
  payload: Record<string, unknown>,
): Promise<void> {
  const jwt = req.jwt as unknown as AdminJwt;
  await writeAuditEntry(client, {
    tenantId: 'PLATFORM',
    category: 'admin',
    action,
    actorId: jwt?.admin_id ?? jwt?.user_id,
    actorEmail: 'superadmin@platform',
    actorRole: 'SUPER_ADMIN',
    resourceType,
    resourceId,
    payload,
    ipAddress: req.ip,
  });
}

async function safeRefresh(app: FastifyInstance): Promise<boolean> {
  try {
    await refreshReferenceCache();
    return true;
  } catch (e) {
    app.log.error(e, 'refreshReferenceCache failed after super-admin reference write');
    return false;
  }
}

// Map a PG constraint error to a structured reply; returns true if handled.
function handlePgError(e: unknown, reply: FastifyReply): boolean {
  const code = (e as { code?: string })?.code;
  if (code === '23505') {
    reply.status(409).send({ error: { code: 'CONFLICT', message: 'A row with these keys already exists' } });
    return true;
  }
  if (code === '23514') {
    reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: 'Value violates a column constraint' } });
    return true;
  }
  return false;
}

function notFound(reply: FastifyReply, message = 'Not found'): void {
  reply.status(404).send({ error: { code: 'NOT_FOUND', message } });
}

const PRE = { preHandler: requireSuperAdmin };

export async function adminJurisdictionRoutes(app: FastifyInstance): Promise<void> {

  // ════════════════ jurisdiction_layers ════════════════

  // ── GET list ───────────────────────────────────────────────────────────────────
  app.get('/admin/jurisdiction-layers', PRE, async (req, reply) => {
    const q = LayerListQ.parse(req.query ?? {});
    const res = await pgPool.query(
      `SELECT * FROM jurisdiction_layers
        WHERE ($1::text IS NULL OR state_code = $1)
          AND ($2::text IS NULL OR level = $2)
        ORDER BY state_code NULLS FIRST, level, county_fips NULLS FIRST, city_name NULLS FIRST`,
      [q.state ? q.state.toUpperCase() : null, q.level ?? null],
    );
    return reply.send({ layers: res.rows });
  });

  // ── GET validate (dry-run normalizeLayer over every row) ─────────────────────────
  // Registered before /:id (static beats parametric in Fastify regardless, but explicit).
  app.get('/admin/jurisdiction-layers/validate', PRE, async (_req, reply) => {
    const res = await pgPool.query(`SELECT * FROM jurisdiction_layers`);
    const badRows: Array<{ id: string; error: string }> = [];
    for (const r of res.rows) {
      try {
        normalizeLayer({
          level: r.level,
          state_code: r.state_code ?? undefined,
          county_fips: r.county_fips ?? undefined,
          county_name: r.county_name ?? undefined,
          city_name: r.city_name ?? undefined,
          ahj: r.ahj ?? undefined,
          codes: r.codes ?? undefined,
          notes: r.notes ?? undefined,
        });
      } catch (e) {
        badRows.push({ id: r.id, error: (e as Error).message });
      }
    }
    return reply.send({ ok: badRows.length === 0, checked: res.rows.length, bad_rows: badRows });
  });

  // ── GET one ──────────────────────────────────────────────────────────────────────
  app.get('/admin/jurisdiction-layers/:id', PRE, async (req, reply) => {
    const { id } = req.params as { id: string };
    const res = await pgPool.query(`SELECT * FROM jurisdiction_layers WHERE id = $1`, [id]);
    if (res.rows.length === 0) return notFound(reply, 'Jurisdiction layer not found');
    return reply.send({ layer: res.rows[0] });
  });

  // ── POST create ────────────────────────────────────────────────────────────────────
  app.post('/admin/jurisdiction-layers', PRE, async (req, reply) => {
    const d = LayerCreateZ.parse(req.body ?? {});
    const client = await pgPool.connect();
    try {
      await client.query('BEGIN');
      // The reference tables are no-RLS, but audit_log has FORCE RLS whose WITH CHECK passes only
      // when app.current_tenant_id matches the row OR equals the 'PLATFORM' sentinel. Set it so the
      // platform-scope audit insert below is allowed. SET LOCAL is scoped to this txn.
      await client.query(`SET LOCAL app.current_tenant_id = 'PLATFORM'`);
      const res = await client.query(
        `INSERT INTO jurisdiction_layers
           (level, state_code, county_fips, county_name, city_name, ahj, codes, notes, source, last_verified)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9, COALESCE($10::date, CURRENT_DATE))
         RETURNING *`,
        [
          d.level, d.state_code ?? null, d.county_fips ?? null, d.county_name ?? null, d.city_name ?? null,
          d.ahj ? JSON.stringify(d.ahj) : null, d.codes ? JSON.stringify(d.codes) : null, d.notes ?? null,
          ADMIN_SOURCE_TAG, d.last_verified ?? null,
        ],
      );
      const row = res.rows[0];
      await audit(client, req, 'jurisdiction_layer.created', 'jurisdiction_layer', row.id, { after: row });
      await client.query('COMMIT');
      const cache_refreshed = await safeRefresh(app);
      return reply.status(201).send({ layer: row, cache_refreshed });
    } catch (e) {
      await client.query('ROLLBACK');
      if (handlePgError(e, reply)) return;
      throw e;
    } finally {
      client.release();
    }
  });

  // ── PATCH update ─────────────────────────────────────────────────────────────────────
  app.patch('/admin/jurisdiction-layers/:id', PRE, async (req, reply) => {
    const { id } = req.params as { id: string };
    const patch = LayerPatchZ.parse(req.body ?? {});
    const client = await pgPool.connect();
    try {
      await client.query('BEGIN');
      // The reference tables are no-RLS, but audit_log has FORCE RLS whose WITH CHECK passes only
      // when app.current_tenant_id matches the row OR equals the 'PLATFORM' sentinel. Set it so the
      // platform-scope audit insert below is allowed. SET LOCAL is scoped to this txn.
      await client.query(`SET LOCAL app.current_tenant_id = 'PLATFORM'`);
      const cur = await client.query(`SELECT * FROM jurisdiction_layers WHERE id = $1`, [id]);
      if (cur.rows.length === 0) {
        await client.query('ROLLBACK');
        return notFound(reply, 'Jurisdiction layer not found');
      }
      const before = cur.rows[0];
      const m = {
        level: patch.level ?? before.level,
        state_code: patch.state_code ?? before.state_code,
        county_fips: patch.county_fips !== undefined ? patch.county_fips : before.county_fips,
        county_name: patch.county_name !== undefined ? patch.county_name : before.county_name,
        city_name: patch.city_name !== undefined ? patch.city_name : before.city_name,
        ahj: patch.ahj !== undefined ? patch.ahj : before.ahj,
        codes: patch.codes !== undefined ? patch.codes : before.codes,
        notes: patch.notes !== undefined ? patch.notes : before.notes,
      };
      const issues = perLevelKeyIssues(m);
      if (issues.length > 0) {
        await client.query('ROLLBACK');
        return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: 'Merged layer fails per-level key rules', fields: issues } });
      }
      const res = await client.query(
        `UPDATE jurisdiction_layers SET
           level = $2, state_code = $3, county_fips = $4, county_name = $5, city_name = $6,
           ahj = $7, codes = $8, notes = $9, source = $10,
           last_verified = COALESCE($11::date, CURRENT_DATE), updated_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [
          id, m.level, m.state_code, m.county_fips ?? null, m.county_name ?? null, m.city_name ?? null,
          m.ahj ? JSON.stringify(m.ahj) : null, m.codes ? JSON.stringify(m.codes) : null, m.notes ?? null,
          ADMIN_SOURCE_TAG, patch.last_verified ?? null,
        ],
      );
      const row = res.rows[0];
      await audit(client, req, 'jurisdiction_layer.updated', 'jurisdiction_layer', id, { before, after: row });
      await client.query('COMMIT');
      const cache_refreshed = await safeRefresh(app);
      return reply.send({ layer: row, cache_refreshed });
    } catch (e) {
      await client.query('ROLLBACK');
      if (handlePgError(e, reply)) return;
      throw e;
    } finally {
      client.release();
    }
  });

  // ── DELETE (hard — no deleted_at) ────────────────────────────────────────────────────
  app.delete('/admin/jurisdiction-layers/:id', PRE, async (req, reply) => {
    const { id } = req.params as { id: string };
    const client = await pgPool.connect();
    try {
      await client.query('BEGIN');
      // The reference tables are no-RLS, but audit_log has FORCE RLS whose WITH CHECK passes only
      // when app.current_tenant_id matches the row OR equals the 'PLATFORM' sentinel. Set it so the
      // platform-scope audit insert below is allowed. SET LOCAL is scoped to this txn.
      await client.query(`SET LOCAL app.current_tenant_id = 'PLATFORM'`);
      const res = await client.query(`DELETE FROM jurisdiction_layers WHERE id = $1 RETURNING *`, [id]);
      if (res.rows.length === 0) {
        await client.query('ROLLBACK');
        return notFound(reply, 'Jurisdiction layer not found');
      }
      await audit(client, req, 'jurisdiction_layer.deleted', 'jurisdiction_layer', id, { before: res.rows[0] });
      await client.query('COMMIT');
      const cache_refreshed = await safeRefresh(app);
      return reply.send({ deleted: true, cache_refreshed });
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  });

  // ════════════════ code_editions ════════════════

  // ── GET list ───────────────────────────────────────────────────────────────────────
  app.get('/admin/code-editions', PRE, async (req, reply) => {
    const q = EditionListQ.parse(req.query ?? {});
    const res = await pgPool.query(
      `SELECT * FROM code_editions
        WHERE ($1::text IS NULL OR state_code = $1)
          AND ($2::text IS NULL OR trade = $2)
        ORDER BY state_code, trade`,
      [q.state ? q.state.toUpperCase() : null, q.trade ?? null],
    );
    return reply.send({ editions: res.rows });
  });

  // ── PUT upsert (keyed on UNIQUE (trade, state_code)) ─────────────────────────────────
  app.put('/admin/code-editions', PRE, async (req, reply) => {
    const d = EditionUpsertZ.parse(req.body ?? {});
    const client = await pgPool.connect();
    try {
      await client.query('BEGIN');
      // The reference tables are no-RLS, but audit_log has FORCE RLS whose WITH CHECK passes only
      // when app.current_tenant_id matches the row OR equals the 'PLATFORM' sentinel. Set it so the
      // platform-scope audit insert below is allowed. SET LOCAL is scoped to this txn.
      await client.query(`SET LOCAL app.current_tenant_id = 'PLATFORM'`);
      const res = await client.query(
        `INSERT INTO code_editions
           (trade, state_code, code_type, code_edition, nec_edition, notes, source, last_verified)
         VALUES ($1,$2,$3,$4,$5,$6,$7, COALESCE($8::date, CURRENT_DATE))
         ON CONFLICT (trade, state_code) DO UPDATE SET
           code_type = EXCLUDED.code_type, code_edition = EXCLUDED.code_edition,
           nec_edition = EXCLUDED.nec_edition, notes = EXCLUDED.notes,
           source = EXCLUDED.source, last_verified = EXCLUDED.last_verified, updated_at = NOW()
         RETURNING *`,
        [d.trade, d.state_code, d.code_type, d.code_edition ?? null, d.nec_edition ?? null,
         d.notes ?? null, ADMIN_SOURCE_TAG, d.last_verified ?? null],
      );
      const row = res.rows[0];
      await audit(client, req, 'code_edition.upserted', 'code_edition', row.id, { after: row });
      await client.query('COMMIT');
      const cache_refreshed = await safeRefresh(app);
      return reply.send({ edition: row, cache_refreshed });
    } catch (e) {
      await client.query('ROLLBACK');
      if (handlePgError(e, reply)) return;
      throw e;
    } finally {
      client.release();
    }
  });

  // ── PATCH by id ────────────────────────────────────────────────────────────────────
  app.patch('/admin/code-editions/:id', PRE, async (req, reply) => {
    const { id } = req.params as { id: string };
    const patch = EditionPatchZ.parse(req.body ?? {});
    const client = await pgPool.connect();
    try {
      await client.query('BEGIN');
      // The reference tables are no-RLS, but audit_log has FORCE RLS whose WITH CHECK passes only
      // when app.current_tenant_id matches the row OR equals the 'PLATFORM' sentinel. Set it so the
      // platform-scope audit insert below is allowed. SET LOCAL is scoped to this txn.
      await client.query(`SET LOCAL app.current_tenant_id = 'PLATFORM'`);
      const cur = await client.query(`SELECT * FROM code_editions WHERE id = $1`, [id]);
      if (cur.rows.length === 0) {
        await client.query('ROLLBACK');
        return notFound(reply, 'Code edition not found');
      }
      const before = cur.rows[0];
      const m = {
        trade: patch.trade ?? before.trade,
        state_code: patch.state_code ?? before.state_code,
        code_type: patch.code_type ?? before.code_type,
        code_edition: patch.code_edition !== undefined ? patch.code_edition : before.code_edition,
        nec_edition: patch.nec_edition !== undefined ? patch.nec_edition : before.nec_edition,
        notes: patch.notes !== undefined ? patch.notes : before.notes,
      };
      const res = await client.query(
        `UPDATE code_editions SET
           trade = $2, state_code = $3, code_type = $4, code_edition = $5, nec_edition = $6,
           notes = $7, source = $8, last_verified = COALESCE($9::date, CURRENT_DATE), updated_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [id, m.trade, m.state_code, m.code_type, m.code_edition ?? null, m.nec_edition ?? null,
         m.notes ?? null, ADMIN_SOURCE_TAG, patch.last_verified ?? null],
      );
      const row = res.rows[0];
      await audit(client, req, 'code_edition.updated', 'code_edition', id, { before, after: row });
      await client.query('COMMIT');
      const cache_refreshed = await safeRefresh(app);
      return reply.send({ edition: row, cache_refreshed });
    } catch (e) {
      await client.query('ROLLBACK');
      if (handlePgError(e, reply)) return;
      throw e;
    } finally {
      client.release();
    }
  });

  // ── DELETE by id ─────────────────────────────────────────────────────────────────────
  app.delete('/admin/code-editions/:id', PRE, async (req, reply) => {
    const { id } = req.params as { id: string };
    const client = await pgPool.connect();
    try {
      await client.query('BEGIN');
      // The reference tables are no-RLS, but audit_log has FORCE RLS whose WITH CHECK passes only
      // when app.current_tenant_id matches the row OR equals the 'PLATFORM' sentinel. Set it so the
      // platform-scope audit insert below is allowed. SET LOCAL is scoped to this txn.
      await client.query(`SET LOCAL app.current_tenant_id = 'PLATFORM'`);
      const res = await client.query(`DELETE FROM code_editions WHERE id = $1 RETURNING *`, [id]);
      if (res.rows.length === 0) {
        await client.query('ROLLBACK');
        return notFound(reply, 'Code edition not found');
      }
      await audit(client, req, 'code_edition.deleted', 'code_edition', id, { before: res.rows[0] });
      await client.query('COMMIT');
      const cache_refreshed = await safeRefresh(app);
      return reply.send({ deleted: true, cache_refreshed });
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  });
}
