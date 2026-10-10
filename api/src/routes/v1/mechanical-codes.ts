// routes/v1/mechanical-codes.ts — Read-only reference data for mechanical (HVAC) code lookups
// Serves the static IMC/UMC jurisdiction library — no DB writes, no withTenantContext needed.
// All endpoints still require JWT auth (all routes require auth per arch rules).
// Not audited — reference data reads are not in the 6 audit categories.

import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { authenticate } from '../../plugins/auth-plugin.js';
import {
  ALL_MECHANICAL_JURISDICTIONS,
  getMechanicalJurisdiction,
  getMechanicalInspectionSequence,
  isValidMechanicalStateCode,
  MECHANICAL_CODE_FAMILY_LABELS,
  BUILDING_TYPE_LABELS,
} from '../../lib/mechanical-codes/index.js';
import type { BuildingType } from '../../lib/mechanical-codes/index.js';

const VALID_BUILDING_TYPES: BuildingType[] = ['residential_sf', 'residential_mf', 'commercial', 'industrial'];

export async function mechanicalCodeRoutes(app: FastifyInstance): Promise<void> {

  // ─── GET /mechanical-codes/jurisdictions ──────────────────────────────────
  // Returns all 51 jurisdictions (50 states + DC) with IMC/UMC family + edition info.
  app.get('/mechanical-codes/jurisdictions', { preHandler: [authenticate] },
    async (_req: FastifyRequest, reply: FastifyReply) => {
      const jurisdictions = ALL_MECHANICAL_JURISDICTIONS.map((j) => ({
        state_code:        j.state_code,
        state_name:        j.state_name,
        code_family:       j.code_family,
        code_family_label: MECHANICAL_CODE_FAMILY_LABELS[j.code_family],
        edition:           j.edition,
        notes:             j.notes ?? null,
        has_amendment:     !!j.notes,
      }));
      return reply.status(200).send({ jurisdictions });
    }
  );

  // ─── GET /mechanical-codes/jurisdiction/:state_code ───────────────────────
  // Returns governing model code (IMC/UMC) and edition for a single state.
  app.get('/mechanical-codes/jurisdiction/:state_code', { preHandler: [authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { state_code } = req.params as { state_code: string };

      if (!isValidMechanicalStateCode(state_code)) {
        return reply.status(404).send({ error: { code: 'NOT_FOUND', message: `Unknown state code: ${state_code}` } });
      }

      const j = getMechanicalJurisdiction(state_code)!;
      return reply.status(200).send({
        jurisdiction: {
          state_code:        j.state_code,
          state_name:        j.state_name,
          code_family:       j.code_family,
          code_family_label: MECHANICAL_CODE_FAMILY_LABELS[j.code_family],
          edition:           j.edition,
          notes:             j.notes ?? null,
          has_amendment:     !!j.notes,
        },
      });
    }
  );

  // ─── GET /mechanical-codes/inspection-sequence/:building_type ─────────────
  // Returns the ordered mechanical inspection milestone sequence for a building type.
  app.get('/mechanical-codes/inspection-sequence/:building_type', { preHandler: [authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { building_type } = req.params as { building_type: string };

      if (!VALID_BUILDING_TYPES.includes(building_type as BuildingType)) {
        return reply.status(400).send({ error: { code: 'INVALID_BUILDING_TYPE', message: `building_type must be one of: ${VALID_BUILDING_TYPES.join(', ')}` } });
      }

      const steps = getMechanicalInspectionSequence(building_type as BuildingType);
      return reply.status(200).send({
        building_type,
        building_type_label: BUILDING_TYPE_LABELS[building_type as BuildingType],
        steps,
      });
    }
  );
}
