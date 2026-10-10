// routes/v1/building-codes.ts — Read-only reference data for general building code lookups
// Serves the static ICC (IRC/IBC) jurisdiction library — no DB writes, no withTenantContext.
// All endpoints require JWT auth. Not audited — reference data reads are not audit events.

import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { authenticate } from '../../plugins/auth-plugin.js';
import {
  ALL_BUILDING_JURISDICTIONS,
  getBuildingJurisdiction,
  getBuildingInspectionSequence,
  isValidBuildingStateCode,
  buildingCodeFamily,
  BUILDING_CODE_FAMILY_LABELS,
  BUILDING_TYPE_LABELS,
} from '../../lib/building-codes/index.js';
import type { BuildingType } from '../../lib/building-codes/index.js';

const VALID_BUILDING_TYPES: BuildingType[] = ['residential_sf', 'residential_mf', 'commercial', 'industrial'];

export async function buildingCodeRoutes(app: FastifyInstance): Promise<void> {

  // ─── GET /building-codes/jurisdictions ────────────────────────────────────
  // Returns all 51 jurisdictions (50 states + DC) with the adopted ICC edition.
  // Note: code family (IRC vs IBC) depends on occupancy, not the state — see the
  // inspection-sequence endpoint, which resolves it from building_type.
  app.get('/building-codes/jurisdictions', { preHandler: [authenticate] },
    async (_req: FastifyRequest, reply: FastifyReply) => {
      const jurisdictions = ALL_BUILDING_JURISDICTIONS.map((j) => ({
        state_code:    j.state_code,
        state_name:    j.state_name,
        edition:       j.edition,
        notes:         j.notes ?? null,
        has_amendment: !!j.notes,
      }));
      return reply.status(200).send({ jurisdictions });
    }
  );

  // ─── GET /building-codes/jurisdiction/:state_code ─────────────────────────
  app.get('/building-codes/jurisdiction/:state_code', { preHandler: [authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { state_code } = req.params as { state_code: string };

      if (!isValidBuildingStateCode(state_code)) {
        return reply.status(404).send({ error: { code: 'NOT_FOUND', message: `Unknown state code: ${state_code}` } });
      }

      const j = getBuildingJurisdiction(state_code)!;
      return reply.status(200).send({
        jurisdiction: {
          state_code:    j.state_code,
          state_name:    j.state_name,
          edition:       j.edition,
          notes:         j.notes ?? null,
          has_amendment: !!j.notes,
        },
      });
    }
  );

  // ─── GET /building-codes/inspection-sequence/:building_type ───────────────
  // Resolves the ICC family (IRC/IBC) from occupancy and returns the ordered sequence.
  app.get('/building-codes/inspection-sequence/:building_type', { preHandler: [authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { building_type } = req.params as { building_type: string };

      if (!VALID_BUILDING_TYPES.includes(building_type as BuildingType)) {
        return reply.status(400).send({ error: { code: 'INVALID_BUILDING_TYPE', message: `building_type must be one of: ${VALID_BUILDING_TYPES.join(', ')}` } });
      }

      const family = buildingCodeFamily(building_type as BuildingType);
      const steps = getBuildingInspectionSequence(building_type as BuildingType);
      return reply.status(200).send({
        building_type,
        building_type_label: BUILDING_TYPE_LABELS[building_type as BuildingType],
        code_family:         family,
        code_family_label:   BUILDING_CODE_FAMILY_LABELS[family],
        steps,
      });
    }
  );
}
