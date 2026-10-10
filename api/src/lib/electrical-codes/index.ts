export type {
  NecEdition,
  ElectricalInspectionType,
  BuildingType,
  JurisdictionInfo,
  InspectionStep,
} from './types.js';

export {
  ELECTRICAL_INSPECTION_TYPE_LABELS,
  NEC_EDITION_LABELS,
  BUILDING_TYPE_LABELS,
} from './types.js';

export { NEC_JURISDICTIONS } from './nec-editions.js';
export { getInspectionSequence } from './inspection-sequences.js';

import { NEC_JURISDICTIONS } from './nec-editions.js';
import type { JurisdictionInfo } from './types.js';

const JURISDICTION_MAP = new Map<string, JurisdictionInfo>(
  NEC_JURISDICTIONS.map((j) => [j.state_code.toUpperCase(), j])
);

export function getJurisdiction(stateCode: string): JurisdictionInfo | null {
  return JURISDICTION_MAP.get(stateCode.toUpperCase()) ?? null;
}

export function isValidStateCode(stateCode: string): boolean {
  return JURISDICTION_MAP.has(stateCode.toUpperCase());
}

export const ALL_JURISDICTIONS: JurisdictionInfo[] = NEC_JURISDICTIONS;
