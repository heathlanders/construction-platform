// routes/v1/permits.ts — Electrical permit lifecycle + AHJ inspection milestone auto-generation
// Locked decisions: T-12 (optimistic locking), T-42 (withTenantContext)
// Tier gate: POST /permits auto-gen = SOFT (Professional+ only, Starter gets permit but no milestones)
//            POST /permits/:id/generate-milestones = HARD 402 (explicit power-user action)

import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { withTenantContext } from '../../lib/tenant-context.js';
import { writeAuditEntry } from '../../lib/audit-log.js';
import { authenticate, requireRole } from '../../plugins/auth-plugin.js';
import { assertTier, TierEnforcementError } from '../../services/tier-enforcement.js';
import type { BuildingType } from '../../lib/electrical-codes/index.js';
import { resolveJurisdiction, deriveCountyFromZip } from '../../lib/jurisdictions/index.js';
import type { AhjMetadata } from '../../lib/jurisdictions/index.js';

const VALID_BUILDING_TYPES: BuildingType[] = ['residential_sf', 'residential_mf', 'commercial', 'industrial'];

const VALID_PERMIT_TYPES = ['electrical', 'plumbing', 'mechanical', 'building'] as const;
type PermitType = (typeof VALID_PERMIT_TYPES)[number];

// A milestone step in trade-neutral form — both code libraries expose these fields.
interface ResolvedStep {
  sequence_order: number;
  inspection_type: string;
  title: string;
}

interface ResolvedPermitCode {
  code_type: string;            // 'NEC' | 'IPC' | 'UPC' | 'IMC' | 'UMC' | 'IRC' | 'IBC'
  code_edition: string | null;  // edition/year string
  nec_edition: string | null;   // electrical-only (kept for backward compat); NULL for plumbing
  jurisdiction_notes: string | null;
  steps: ResolvedStep[];
  // Jurisdiction-engine additions (frozen onto the permit at create):
  ahj: AhjMetadata | null;      // matched Authority Having Jurisdiction; null → model default
  jurisdiction_key: string;     // canonical key, e.g. 'WI/55025/madison'
  ahj_level: string | null;     // 'state' | 'county' | 'city'
}

// Location a permit resolves against. county/city are nullable — the engine falls back to
// state + national-default layers when they are absent (never blocks permit creation).
interface PermitGeo {
  state_code: string;
  county_fips: string | null;
  county_name: string | null;
  city_name: string | null;
}

// Resolve the governing model code + inspection sequence + AHJ for a permit. Thin delegate over
// the deterministic jurisdiction engine (api/src/lib/jurisdictions/) — the engine's default layer
// is the same 4 trade libs that previously lived inline here, so behavior outside seeded
// jurisdictions is unchanged.
function resolvePermitCode(
  permitType: PermitType,
  buildingType: BuildingType,
  geo: PermitGeo,
): ResolvedPermitCode {
  const rj = resolveJurisdiction({
    state: geo.state_code,
    county_fips: geo.county_fips,
    county_name: geo.county_name,
    city: geo.city_name,
    building_type: buildingType,
  });
  const t = rj.trades[permitType];
  return {
    code_type:          t.code_type,
    code_edition:       t.code_edition,
    nec_edition:        t.nec_edition,
    jurisdiction_notes: t.jurisdiction_notes,
    steps:              t.steps.map((s) => ({
      sequence_order: s.sequence_order,
      inspection_type: s.inspection_type,
      title: s.title,
    })),
    ahj:                rj.ahj,
    jurisdiction_key:   rj.jurisdiction_key,
    ahj_level:          rj.ahj?.ahj_level ?? null,
  };
}

const VALID_STATUSES = ['draft', 'submitted', 'approved', 'active', 'failed_inspection', 'closed', 'voided'] as const;

// Status transition rules: maps current status → allowed next statuses
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  draft:             ['submitted', 'voided'],
  submitted:         ['approved', 'voided'],
  approved:          ['active', 'voided'],
  active:            ['failed_inspection', 'closed', 'voided'],
  failed_inspection: ['active', 'voided'],
  closed:            [],  // terminal — no transitions allowed
  voided:            [],  // terminal — no transitions allowed
};

const WO = ['OWNER', 'PROJECT_MANAGER'] as const;
const W  = ['OWNER', 'PROJECT_MANAGER', 'FOREMAN'] as const;

const CreateSchema = z.object({
  project_id:                 z.string().uuid(),
  permit_type:                z.enum(VALID_PERMIT_TYPES).default('electrical'),
  building_type:              z.enum(['residential_sf', 'residential_mf', 'commercial', 'industrial']),
  permit_number:              z.string().max(100).optional(),
  ahj_name:                   z.string().max(300).optional(),
  ahj_address:                z.string().max(500).optional(),
  ahj_phone:                  z.string().max(50).optional(),
  ahj_contact_name:           z.string().max(200).optional(),
  applied_date:               z.string().date().optional(),
  notes:                      z.string().optional(),
  auto_generate_milestones:   z.boolean().default(true),
});

const UpdateSchema = z.object({
  permit_number:    z.string().max(100).optional().nullable(),
  ahj_name:         z.string().max(300).optional().nullable(),
  ahj_address:      z.string().max(500).optional().nullable(),
  ahj_phone:        z.string().max(50).optional().nullable(),
  ahj_contact_name: z.string().max(200).optional().nullable(),
  applied_date:     z.string().date().optional().nullable(),
  approved_date:    z.string().date().optional().nullable(),
  expiry_date:      z.string().date().optional().nullable(),
  status:           z.enum(VALID_STATUSES).optional(),
  notes:            z.string().optional().nullable(),
  version:          z.number().int().min(1),
});

const ListQ = z.object({
  project_id:  z.string().uuid(),
  cursor:      z.string().uuid().optional(),
  limit:       z.coerce.number().int().min(1).max(100).default(20),
  status:      z.enum(VALID_STATUSES).optional(),
  permit_type: z.enum(VALID_PERMIT_TYPES).optional(),
});

export async function permitRoutes(app: FastifyInstance): Promise<void> {

  // ─── POST /permits ────────────────────────────────────────────────────────
  app.post('/permits', { preHandler: [authenticate, requireRole(...WO)] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const body = CreateSchema.safeParse(req.body);
      if (!body.success) return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: 'Validation failed', fields: body.error.errors.map(e => ({ field: e.path.join('.'), message: e.message })) } });

      const { tenant_id, user_id, email, role } = req.jwt;
      const { project_id, permit_type, building_type, permit_number, ahj_name, ahj_address, ahj_phone, ahj_contact_name, applied_date, notes, auto_generate_milestones } = body.data;

      // Tier check — SOFT: Professional+ gets auto-gen, Starter gets permit only
      let canAutoGen = false;
      if (auto_generate_milestones) {
        try {
          await assertTier(tenant_id, 'PROFESSIONAL');
          canAutoGen = true;
        } catch (err) {
          if (!(err instanceof TierEnforcementError)) throw err;
          // Starter — permit created, milestones skipped
        }
      }

      const result = await withTenantContext(tenant_id, async (client) => {
        // Look up project location to resolve jurisdiction (state + county + city).
        const projectRes = await client.query<{ state: string; city: string | null; zip: string | null; county_fips: string | null; county_name: string | null }>(
          `SELECT state, city, zip, county_fips, county_name FROM projects WHERE id=$1 AND deleted_at IS NULL`, [project_id]
        );
        if (projectRes.rows.length === 0) return null;

        const proj = projectRes.rows[0];
        const stateCode = proj.state?.toUpperCase() ?? '';

        // County acquisition cascade: explicit project county → ZIP lookup → null (state-only).
        const zipEntry = await deriveCountyFromZip(proj.zip);
        const countyFips = proj.county_fips ?? zipEntry?.county_fips ?? null;
        const countyName = proj.county_name ?? zipEntry?.county_name ?? null;
        // City for AHJ matching comes from the project; fall back to the ZIP's primary city.
        const cityName = proj.city ?? zipEntry?.primary_city ?? null;

        const geo: PermitGeo = { state_code: stateCode, county_fips: countyFips, county_name: countyName, city_name: cityName };
        const resolved = resolvePermitCode(permit_type, building_type as BuildingType, geo);

        // Pre-fill AHJ identity from the resolved jurisdiction when the user left it blank.
        const ahj = resolved.ahj;
        const ahjNameFinal    = ahj_name        ?? ahj?.ahj_name ?? null;
        const ahjAddressFinal = ahj_address     ?? ahj?.address ?? null;
        const ahjPhoneFinal   = ahj_phone       ?? ahj?.phone ?? null;
        const ahjContactFinal = ahj_contact_name ?? ahj?.contact_name ?? null;

        // Create permit (freeze resolved geography + AHJ level as a snapshot).
        const { rows } = await client.query(
          `INSERT INTO permits
             (tenant_id, project_id, permit_type, building_type, state_code,
              county_fips, county_name, city_name, jurisdiction_key, ahj_level,
              nec_edition, code_type, code_edition, jurisdiction_notes,
              permit_number, ahj_name, ahj_address, ahj_phone, ahj_contact_name,
              applied_date, notes, created_by)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22)
           RETURNING *`,
          [tenant_id, project_id, permit_type, building_type, stateCode || null,
           countyFips, countyName, cityName, resolved.jurisdiction_key, resolved.ahj_level,
           resolved.nec_edition, resolved.code_type, resolved.code_edition, resolved.jurisdiction_notes,
           permit_number ?? null, ahjNameFinal, ahjAddressFinal,
           ahjPhoneFinal, ahjContactFinal,
           applied_date ?? null, notes ?? null, user_id]
        );
        const permit = rows[0];

        await writeAuditEntry(client, { tenantId: tenant_id, category: 'data', action: 'permit.created', actorId: user_id, actorEmail: email, actorRole: role, resourceType: 'permit', resourceId: permit.id, payload: { project_id, permit_type, building_type, code_type: resolved.code_type, code_edition: resolved.code_edition }, ipAddress: req.ip });

        // Auto-generate inspection milestones (trade_type follows the permit type)
        let generatedCount = 0;
        if (canAutoGen) {
          for (const step of resolved.steps) {
            await client.query(
              `INSERT INTO inspections
                 (tenant_id, project_id, permit_id, trade_type, inspection_type,
                  sequence_order, title, status, created_by)
               VALUES ($1,$2,$3,$4,$5,$6,$7,'scheduled',$8)`,
              [tenant_id, project_id, permit.id, permit_type, step.inspection_type,
               step.sequence_order, step.title, user_id]
            );
            generatedCount++;
          }

          await writeAuditEntry(client, { tenantId: tenant_id, category: 'data', action: 'permit.milestones_generated', actorId: user_id, actorEmail: email, actorRole: role, resourceType: 'permit', resourceId: permit.id, payload: { generated_count: generatedCount, permit_type, building_type }, ipAddress: req.ip });
        }

        return { permit, generatedCount };
      });

      if (!result) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Project not found' } });

      const response: Record<string, unknown> = { permit: result.permit, generated_inspection_count: result.generatedCount };
      if (auto_generate_milestones && !canAutoGen) {
        response.tier_note = 'Upgrade to Professional to auto-generate inspection milestones.';
      }
      return reply.status(201).send(response);
    }
  );

  // ─── GET /permits ─────────────────────────────────────────────────────────
  app.get('/permits', { preHandler: [authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const q = ListQ.safeParse(req.query);
      if (!q.success) return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: 'project_id required' } });

      const { tenant_id } = req.jwt;
      const { project_id, cursor, limit, status, permit_type } = q.data;

      const items = await withTenantContext(tenant_id, async (client) => {
        const params: unknown[] = [limit + 1, project_id];
        const conds = ['deleted_at IS NULL', 'project_id=$2'];
        let idx = 3;
        if (status) { conds.push(`status=$${idx++}`); params.push(status); }
        if (permit_type) { conds.push(`permit_type=$${idx++}`); params.push(permit_type); }
        if (cursor) { conds.push(`(created_at,id)<(SELECT created_at,id FROM permits WHERE id=$${idx++})`); params.push(cursor); }
        const { rows } = await client.query(
          `SELECT * FROM permits WHERE ${conds.join(' AND ')} ORDER BY created_at DESC LIMIT $1`, params
        );
        return rows;
      });

      const hasMore = items.length > limit;
      const data = hasMore ? items.slice(0, limit) : items;
      return reply.status(200).send({ permits: data, pagination: { has_more: hasMore, next_cursor: hasMore ? data[data.length - 1].id : null } });
    }
  );

  // ─── GET /permits/:id ─────────────────────────────────────────────────────
  // Returns permit + all linked inspections ordered by sequence_order
  app.get('/permits/:id', { preHandler: [authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as { id: string };
      const { tenant_id } = req.jwt;

      const result = await withTenantContext(tenant_id, async (client) => {
        const { rows: permits } = await client.query(
          `SELECT * FROM permits WHERE id=$1 AND deleted_at IS NULL`, [id]
        );
        if (permits.length === 0) return null;

        const { rows: inspections } = await client.query(
          `SELECT * FROM inspections
           WHERE permit_id=$1 AND deleted_at IS NULL
           ORDER BY sequence_order ASC NULLS LAST, created_at ASC`,
          [id]
        );
        return { permit: permits[0], inspections };
      });

      if (!result) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Permit not found' } });
      return reply.status(200).send(result);
    }
  );

  // ─── PATCH /permits/:id ───────────────────────────────────────────────────
  app.patch('/permits/:id', { preHandler: [authenticate, requireRole(...W)] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as { id: string };
      const body = UpdateSchema.safeParse(req.body);
      if (!body.success) return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: 'Validation failed', fields: body.error.errors.map(e => ({ field: e.path.join('.'), message: e.message })) } });

      const { tenant_id, user_id, email, role } = req.jwt;
      const { permit_number, ahj_name, ahj_address, ahj_phone, ahj_contact_name, applied_date, approved_date, expiry_date, status, notes, version } = body.data;

      const result = await withTenantContext(tenant_id, async (client) => {
        // Fetch current permit for status transition validation
        const { rows: current } = await client.query(
          `SELECT id, status, version FROM permits WHERE id=$1 AND deleted_at IS NULL`, [id]
        );
        if (current.length === 0) return { row: null, status: 'not_found' as const };

        // Enforce status transitions
        if (status && status !== current[0].status) {
          const allowed = ALLOWED_TRANSITIONS[current[0].status] ?? [];
          if (!allowed.includes(status)) {
            return { row: null, status: 'invalid_transition' as const };
          }
          // voided transition requires OWNER role
          if (status === 'voided' && role !== 'OWNER') {
            return { row: null, status: 'forbidden' as const };
          }
        }

        const sets = ['version=version+1', 'updated_at=NOW()'];
        const params: unknown[] = [];
        let idx = 1;

        if (permit_number   !== undefined) { params.push(permit_number);   sets.push(`permit_number=$${idx++}`); }
        if (ahj_name        !== undefined) { params.push(ahj_name);        sets.push(`ahj_name=$${idx++}`); }
        if (ahj_address     !== undefined) { params.push(ahj_address);     sets.push(`ahj_address=$${idx++}`); }
        if (ahj_phone       !== undefined) { params.push(ahj_phone);       sets.push(`ahj_phone=$${idx++}`); }
        if (ahj_contact_name !== undefined) { params.push(ahj_contact_name); sets.push(`ahj_contact_name=$${idx++}`); }
        if (applied_date    !== undefined) { params.push(applied_date);    sets.push(`applied_date=$${idx++}`); }
        if (approved_date   !== undefined) { params.push(approved_date);   sets.push(`approved_date=$${idx++}`); }
        if (expiry_date     !== undefined) { params.push(expiry_date);     sets.push(`expiry_date=$${idx++}`); }
        if (status          !== undefined) { params.push(status);          sets.push(`status=$${idx++}`); }
        if (notes           !== undefined) { params.push(notes);           sets.push(`notes=$${idx++}`); }

        params.push(id, version);
        const { rows } = await client.query(
          `UPDATE permits SET ${sets.join(',')} WHERE id=$${idx} AND version=$${idx + 1} AND deleted_at IS NULL RETURNING *`,
          params
        );
        if (rows.length > 0) {
          await writeAuditEntry(client, { tenantId: tenant_id, category: 'data', action: 'permit.updated', actorId: user_id, actorEmail: email, actorRole: role, resourceType: 'permit', resourceId: id, payload: body.data, ipAddress: req.ip });
          return { row: rows[0], status: 'ok' as const };
        }
        return { row: null, status: 'conflict' as const };
      });

      if (result.status === 'not_found')         return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Permit not found' } });
      if (result.status === 'conflict')          return reply.status(409).send({ error: { code: 'VERSION_CONFLICT', message: 'Version conflict' } });
      if (result.status === 'invalid_transition') return reply.status(400).send({ error: { code: 'INVALID_STATUS_TRANSITION', message: 'That status transition is not allowed' } });
      if (result.status === 'forbidden')         return reply.status(403).send({ error: { code: 'FORBIDDEN', message: 'Only an Owner can void a permit' } });
      return reply.status(200).send({ permit: result.row });
    }
  );

  // ─── DELETE /permits/:id ──────────────────────────────────────────────────
  // Soft-deletes the permit AND any untouched auto-generated milestone inspections
  // (status='scheduled' AND inspection_date IS NULL). Scheduled/completed inspections kept.
  app.delete('/permits/:id', { preHandler: [authenticate, requireRole(...WO)] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as { id: string };
      const { tenant_id, user_id, email, role } = req.jwt;

      const deleted = await withTenantContext(tenant_id, async (client) => {
        const { rows } = await client.query(
          `UPDATE permits SET deleted_at=NOW() WHERE id=$1 AND deleted_at IS NULL RETURNING id`, [id]
        );
        if (rows.length === 0) return null;

        // Cascade soft-delete untouched milestone inspections only
        await client.query(
          `UPDATE inspections
           SET deleted_at=NOW()
           WHERE permit_id=$1 AND deleted_at IS NULL
             AND status='scheduled' AND inspection_date IS NULL`,
          [id]
        );

        await writeAuditEntry(client, { tenantId: tenant_id, category: 'data', action: 'permit.deleted', actorId: user_id, actorEmail: email, actorRole: role, resourceType: 'permit', resourceId: id, payload: {}, ipAddress: req.ip });
        return rows[0];
      });

      if (!deleted) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Permit not found' } });
      return reply.status(204).send();
    }
  );

  // ─── POST /permits/:id/generate-milestones ────────────────────────────────
  // HARD Professional+ gate. Clears untouched auto-gen inspections and regenerates.
  app.post('/permits/:id/generate-milestones', { preHandler: [authenticate, requireRole(...WO)] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as { id: string };
      const { tenant_id, user_id, email, role } = req.jwt;

      // Hard tier gate — throws TierEnforcementError → 402 if Starter
      await assertTier(tenant_id, 'PROFESSIONAL');

      const result = await withTenantContext(tenant_id, async (client) => {
        const { rows: permits } = await client.query(
          `SELECT * FROM permits WHERE id=$1 AND deleted_at IS NULL`, [id]
        );
        if (permits.length === 0) return null;
        const permit = permits[0];

        // Remove untouched auto-gen milestones (scheduled, no date set)
        await client.query(
          `UPDATE inspections SET deleted_at=NOW()
           WHERE permit_id=$1 AND deleted_at IS NULL
             AND status='scheduled' AND inspection_date IS NULL`,
          [id]
        );

        // Regenerate from current static library (branch by the permit's trade).
        // Use the permit's actual stored permit_type for ALL trades — resolvePermitCode
        // handles electrical/plumbing/mechanical/building. Must stay in parity with the
        // CREATE path; collapsing to electrical here silently mis-generates HVAC/building
        // milestones. permit_type is constrained by the DB CHECK to VALID_PERMIT_TYPES.
        const permitType: PermitType = (VALID_PERMIT_TYPES as readonly string[]).includes(permit.permit_type)
          ? (permit.permit_type as PermitType)
          : 'electrical';
        // Re-resolve from the permit's STORED geography snapshot (not the project), so
        // regeneration is stable even if the project later moves or seed data changes.
        const resolved = resolvePermitCode(permitType, permit.building_type as BuildingType, {
          state_code: permit.state_code ?? '',
          county_fips: permit.county_fips ?? null,
          county_name: permit.county_name ?? null,
          city_name: permit.city_name ?? null,
        });
        for (const step of resolved.steps) {
          await client.query(
            `INSERT INTO inspections
               (tenant_id, project_id, permit_id, trade_type, inspection_type,
                sequence_order, title, status, created_by)
             VALUES ($1,$2,$3,$4,$5,$6,$7,'scheduled',$8)`,
            [tenant_id, permit.project_id, id, permitType, step.inspection_type,
             step.sequence_order, step.title, user_id]
          );
        }

        await writeAuditEntry(client, { tenantId: tenant_id, category: 'data', action: 'permit.milestones_regenerated', actorId: user_id, actorEmail: email, actorRole: role, resourceType: 'permit', resourceId: id, payload: { permit_type: permitType, building_type: permit.building_type, generated_count: resolved.steps.length }, ipAddress: req.ip });
        return { generated_inspection_count: resolved.steps.length };
      });

      if (!result) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Permit not found' } });
      return reply.status(200).send(result);
    }
  );
}
