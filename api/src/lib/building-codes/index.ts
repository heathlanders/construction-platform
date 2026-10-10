export type {
  BuildingCodeFamily,
  BuildingCodeEdition,
  BuildingInspectionType,
  BuildingType,
  BuildingJurisdictionInfo,
  BuildingInspectionStep,
} from './types.js';

export {
  buildingCodeFamily,
  BUILDING_INSPECTION_TYPE_LABELS,
  BUILDING_CODE_FAMILY_LABELS,
  BUILDING_TYPE_LABELS,
} from './types.js';

export { BUILDING_JURISDICTIONS } from './code-editions.js';
export { getBuildingInspectionSequence } from './inspection-sequences.js';

import { BUILDING_JURISDICTIONS } from './code-editions.js';
import type { BuildingJurisdictionInfo } from './types.js';

const JURISDICTION_MAP = new Map<string, BuildingJurisdictionInfo>(
  BUILDING_JURISDICTIONS.map((j) => [j.state_code.toUpperCase(), j])
);

export function getBuildingJurisdiction(stateCode: string): BuildingJurisdictionInfo | null {
  return JURISDICTION_MAP.get(stateCode.toUpperCase()) ?? null;
}

export function isValidBuildingStateCode(stateCode: string): boolean {
  return JURISDICTION_MAP.has(stateCode.toUpperCase());
}

export const ALL_BUILDING_JURISDICTIONS: BuildingJurisdictionInfo[] = BUILDING_JURISDICTIONS;
