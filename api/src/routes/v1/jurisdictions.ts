// routes/v1/jurisdictions.ts — Read-only reference data for the jurisdiction/AHJ engine.
// Serves the deterministic resolver (api/src/lib/jurisdictions/) — no DB, no withTenantContext.
// All endpoints require JWT auth (arch rule). Not audited — reference reads aren't an audit category.
//
// Powers the web permit-create jurisdiction preview + AHJ autofill, and location pickers.

import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { authenticate } from '../../plugins/auth-plugin.js';
import { resolveJurisdiction, listStateJurisdictions } from '../../lib/jurisdictions/index.js';
import type { BuildingType } from '../../lib/jurisdictions/index.js';

const BUILDING_TYPES = ['residential_sf', 'residential_mf', 'commercial', 'industrial'] as const;

const ResolveQ = z.object({
  state: z.string().length(2),
  county_fips: z.string().regex(/^\d{5}$/).optional(),
  county_name: z.string().max(100).optional(),
  city: z.string().max(120).optional(),
  building_type: z.enum(BUILDING_TYPES).default('residential_sf'),
});

const StateQ = z.object({ state: z.string().length(2) });

const AhjQ = z.object({
  state: z.string().length(2),
  county_fips: z.string().regex(/^\d{5}$/).optional(),
  county_name: z.string().max(100).optional(),
  city: z.string().max(120).optional(),
});

export async function jurisdictionRoutes(app: FastifyInstance): Promise<void> {

  // ─── GET /jurisdictions/resolve ───────────────────────────────────────────
  // Full resolved jurisdiction (all 4 trades + AHJ + matched_levels) for a location.
  app.get('/jurisdictions/resolve', { preHandler: [authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const q = ResolveQ.safeParse(req.query);
      if (!q.success) return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: 'Invalid query', fields: q.error.errors.map((e) => ({ field: e.path.join('.'), message: e.message })) } });
      const { state, county_fips, county_name, city, building_type } = q.data;
      const resolved = resolveJurisdiction({
        state, county_fips: county_fips ?? null, county_name: county_name ?? null,
        city: city ?? null, building_type: building_type as BuildingType,
      });
      return reply.status(200).send({ resolved });
    }
  );

  // ─── GET /jurisdictions ───────────────────────────────────────────────────
  // Seeded override layers for a state (which counties/cities have AHJ entries).
  app.get('/jurisdictions', { preHandler: [authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const q = StateQ.safeParse(req.query);
      if (!q.success) return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: 'state (2-letter) required' } });
      return reply.status(200).send({ state: q.data.state.toUpperCase(), jurisdictions: listStateJurisdictions(q.data.state) });
    }
  );

  // ─── GET /jurisdictions/ahj ───────────────────────────────────────────────
  // Just the matched AHJ identity block (lighter call for permit AHJ autofill).
  // AHJ is building-type-independent — resolve with a fixed building_type internally.
  app.get('/jurisdictions/ahj', { preHandler: [authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const q = AhjQ.safeParse(req.query);
      if (!q.success) return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: 'Invalid query' } });
      const { state, county_fips, county_name, city } = q.data;
      const resolved = resolveJurisdiction({
        state, county_fips: county_fips ?? null, county_name: county_name ?? null,
        city: city ?? null, building_type: 'commercial',
      });
      return reply.status(200).send({ ahj: resolved.ahj, jurisdiction_key: resolved.jurisdiction_key, matched_levels: resolved.matched_levels });
    }
  );
}
