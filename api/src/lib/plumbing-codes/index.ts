export type {
  PlumbingCodeFamily,
  PlumbingCodeEdition,
  PlumbingInspectionType,
  BuildingType,
  PlumbingJurisdictionInfo,
  PlumbingInspectionStep,
} from './types.js';

export {
  PLUMBING_INSPECTION_TYPE_LABELS,
  PLUMBING_CODE_FAMILY_LABELS,
  BUILDING_TYPE_LABELS,
} from './types.js';

export { PLUMBING_JURISDICTIONS } from './code-editions.js';
export { getPlumbingInspectionSequence } from './inspection-sequences.js';

import { PLUMBING_JURISDICTIONS } from './code-editions.js';
import type { PlumbingJurisdictionInfo } from './types.js';

const JURISDICTION_MAP = new Map<string, PlumbingJurisdictionInfo>(
  PLUMBING_JURISDICTIONS.map((j) => [j.state_code.toUpperCase(), j])
);

export function getPlumbingJurisdiction(stateCode: string): PlumbingJurisdictionInfo | null {
  return JURISDICTION_MAP.get(stateCode.toUpperCase()) ?? null;
}

export function isValidPlumbingStateCode(stateCode: string): boolean {
  return JURISDICTION_MAP.has(stateCode.toUpperCase());
}

export const ALL_PLUMBING_JURISDICTIONS: PlumbingJurisdictionInfo[] = PLUMBING_JURISDICTIONS;
