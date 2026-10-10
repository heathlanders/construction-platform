// routes/v1/electrical-codes.ts — Read-only reference data for electrical code lookups
// Serves the static NEC jurisdiction library — no DB writes, no withTenantContext needed.
// All endpoints still require JWT auth (all routes require auth per arch rules).
// Not audited — reference data reads are not in the 6 audit categories.

import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { authenticate } from '../../plugins/auth-plugin.js';
import {
  ALL_JURISDICTIONS,
  getJurisdiction,
  getInspectionSequence,
  isValidStateCode,
  BUILDING_TYPE_LABELS,
  NEC_EDITION_LABELS,
} from '../../lib/electrical-codes/index.js';
import type { BuildingType } from '../../lib/electrical-codes/index.js';

const VALID_BUILDING_TYPES: BuildingType[] = ['residential_sf', 'residential_mf', 'commercial', 'industrial'];

export async function electricalCodeRoutes(app: FastifyInstance): Promise<void> {

  // ─── GET /electrical-codes/jurisdictions ──────────────────────────────────
  // Returns all 51 jurisdictions (50 states + DC) with NEC edition info.
  // Used to populate jurisdiction dropdowns or display code info.
  app.get('/electrical-codes/jurisdictions', { preHandler: [authenticate] },
    async (_req: FastifyRequest, reply: FastifyReply) => {
      const jurisdictions = ALL_JURISDICTIONS.map((j) => ({
        state_code:    j.state_code,
        state_name:    j.state_name,
        nec_edition:   j.nec_edition,
        nec_label:     NEC_EDITION_LABELS[j.nec_edition],
        notes:         j.notes ?? null,
        has_amendment: !!j.notes,
      }));
      return reply.status(200).send({ jurisdictions });
    }
  );

  // ─── GET /electrical-codes/jurisdiction/:state_code ───────────────────────
  // Returns NEC edition and notes for a single state (e.g., /jurisdiction/WI → NEC 2020)
  app.get('/electrical-codes/jurisdiction/:state_code', { preHandler: [authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { state_code } = req.params as { state_code: string };

      if (!isValidStateCode(state_code)) {
        return reply.status(404).send({ error: { code: 'NOT_FOUND', message: `Unknown state code: ${state_code}` } });
      }

      const j = getJurisdiction(state_code)!;
      return reply.status(200).send({
        jurisdiction: {
          state_code:    j.state_code,
          state_name:    j.state_name,
          nec_edition:   j.nec_edition,
          nec_label:     NEC_EDITION_LABELS[j.nec_edition],
          notes:         j.notes ?? null,
          has_amendment: !!j.notes,
        },
      });
    }
  );

  // ─── GET /electrical-codes/inspection-sequence/:building_type ─────────────
  // Returns the ordered inspection milestone sequence for a building type.
  app.get('/electrical-codes/inspection-sequence/:building_type', { preHandler: [authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { building_type } = req.params as { building_type: string };

      if (!VALID_BUILDING_TYPES.includes(building_type as BuildingType)) {
        return reply.status(400).send({ error: { code: 'INVALID_BUILDING_TYPE', message: `building_type must be one of: ${VALID_BUILDING_TYPES.join(', ')}` } });
      }

      const steps = getInspectionSequence(building_type as BuildingType);
      return reply.status(200).send({
        building_type,
        building_type_label: BUILDING_TYPE_LABELS[building_type as BuildingType],
        steps,
      });
    }
  );
}
