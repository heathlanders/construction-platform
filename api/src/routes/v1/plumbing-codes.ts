// routes/v1/plumbing-codes.ts — Read-only reference data for plumbing code lookups
// Serves the static IPC/UPC jurisdiction library — no DB writes, no withTenantContext needed.
// All endpoints still require JWT auth (all routes require auth per arch rules).
// Not audited — reference data reads are not in the 6 audit categories.

import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { authenticate } from '../../plugins/auth-plugin.js';
import {
  ALL_PLUMBING_JURISDICTIONS,
  getPlumbingJurisdiction,
  getPlumbingInspectionSequence,
  isValidPlumbingStateCode,
  PLUMBING_CODE_FAMILY_LABELS,
  BUILDING_TYPE_LABELS,
} from '../../lib/plumbing-codes/index.js';
import type { BuildingType } from '../../lib/plumbing-codes/index.js';

const VALID_BUILDING_TYPES: BuildingType[] = ['residential_sf', 'residential_mf', 'commercial', 'industrial'];

export async function plumbingCodeRoutes(app: FastifyInstance): Promise<void> {

  // ─── GET /plumbing-codes/jurisdictions ────────────────────────────────────
  // Returns all 51 jurisdictions (50 states + DC) with IPC/UPC family + edition info.
  app.get('/plumbing-codes/jurisdictions', { preHandler: [authenticate] },
    async (_req: FastifyRequest, reply: FastifyReply) => {
      const jurisdictions = ALL_PLUMBING_JURISDICTIONS.map((j) => ({
        state_code:        j.state_code,
        state_name:        j.state_name,
        code_family:       j.code_family,
        code_family_label: PLUMBING_CODE_FAMILY_LABELS[j.code_family],
        edition:           j.edition,
        notes:             j.notes ?? null,
        has_amendment:     !!j.notes,
      }));
      return reply.status(200).send({ jurisdictions });
    }
  );

  // ─── GET /plumbing-codes/jurisdiction/:state_code ─────────────────────────
  // Returns governing model code (IPC/UPC) and edition for a single state.
  app.get('/plumbing-codes/jurisdiction/:state_code', { preHandler: [authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { state_code } = req.params as { state_code: string };

      if (!isValidPlumbingStateCode(state_code)) {
        return reply.status(404).send({ error: { code: 'NOT_FOUND', message: `Unknown state code: ${state_code}` } });
      }

      const j = getPlumbingJurisdiction(state_code)!;
      return reply.status(200).send({
        jurisdiction: {
          state_code:        j.state_code,
          state_name:        j.state_name,
          code_family:       j.code_family,
          code_family_label: PLUMBING_CODE_FAMILY_LABELS[j.code_family],
          edition:           j.edition,
          notes:             j.notes ?? null,
          has_amendment:     !!j.notes,
        },
      });
    }
  );

  // ─── GET /plumbing-codes/inspection-sequence/:building_type ───────────────
  // Returns the ordered plumbing inspection milestone sequence for a building type.
  app.get('/plumbing-codes/inspection-sequence/:building_type', { preHandler: [authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { building_type } = req.params as { building_type: string };

      if (!VALID_BUILDING_TYPES.includes(building_type as BuildingType)) {
        return reply.status(400).send({ error: { code: 'INVALID_BUILDING_TYPE', message: `building_type must be one of: ${VALID_BUILDING_TYPES.join(', ')}` } });
      }

      const steps = getPlumbingInspectionSequence(building_type as BuildingType);
      return reply.status(200).send({
        building_type,
        building_type_label: BUILDING_TYPE_LABELS[building_type as BuildingType],
        steps,
      });
    }
  );
}
