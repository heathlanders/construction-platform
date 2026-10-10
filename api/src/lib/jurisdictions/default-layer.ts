// National default layer — synthesizes the per-trade model-code default for a state.
//
// This is the SINGLE SOURCE OF TRUTH for model-code defaults. The fallback editions mirror the
// values lifted from permits.ts:resolvePermitCode so the engine and the permit route can never
// diverge.
//
// Phase 2 (Doc 16): code family/edition/notes now come from the DB-backed cache
// (reference-store.ts, table code_editions) instead of the inline *-editions.ts libs. The
// national-default INSPECTION SEQUENCES still come from TS (*-codes/inspection-sequences.ts) —
// they are the baseline; local deviations ride in jurisdiction_layers.codes.<trade>.sequence_ops.

import { getInspectionSequence as getElectricalSequence } from '../electrical-codes/index.js';
import { getPlumbingInspectionSequence } from '../plumbing-codes/index.js';
import { getMechanicalInspectionSequence } from '../mechanical-codes/index.js';
import {
  getBuildingInspectionSequence,
  buildingCodeFamily,
} from '../building-codes/index.js';

import { getCachedEdition } from './reference-store.js';
import type {
  Trade,
  BuildingType,
  ResolvedTradeCode,
  InspectionStepDef,
} from './types.js';

// The libs' InspectionStep shapes are a structural superset-match for InspectionStepDef;
// this cast documents that 1:1 mapping in one place.
function asSteps(steps: ReadonlyArray<unknown>): InspectionStepDef[] {
  return steps.map((s) => ({ ...(s as InspectionStepDef) }));
}

export function resolveDefaultTradeCode(
  trade: Trade,
  stateCode: string,
  buildingType: BuildingType,
): ResolvedTradeCode {
  switch (trade) {
    case 'plumbing': {
      const e = getCachedEdition('plumbing', stateCode);
      return {
        code_type: e?.code_type ?? 'IPC',
        code_edition: e?.code_edition ?? '2021',
        nec_edition: null,
        jurisdiction_notes: e?.notes ?? null,
        steps: asSteps(getPlumbingInspectionSequence(buildingType)),
      };
    }
    case 'mechanical': {
      const e = getCachedEdition('mechanical', stateCode);
      return {
        code_type: e?.code_type ?? 'IMC',
        code_edition: e?.code_edition ?? '2021',
        nec_edition: null,
        jurisdiction_notes: e?.notes ?? null,
        steps: asSteps(getMechanicalInspectionSequence(buildingType)),
      };
    }
    case 'building': {
      const e = getCachedEdition('building', stateCode);
      return {
        // ICC family (IRC/IBC) is derived from occupancy, not the state — cached code_type is ignored.
        code_type: buildingCodeFamily(buildingType),
        code_edition: e?.code_edition ?? '2021',
        nec_edition: null,
        jurisdiction_notes: e?.notes ?? null,
        steps: asSteps(getBuildingInspectionSequence(buildingType)),
      };
    }
    case 'electrical':
    default: {
      const e = getCachedEdition('electrical', stateCode);
      const necEdition = e?.nec_edition ?? '2020';
      return {
        code_type: 'NEC',
        code_edition: necEdition,
        nec_edition: necEdition,
        jurisdiction_notes: e?.notes ?? null,
        steps: asSteps(getElectricalSequence(buildingType)),
      };
    }
  }
}
