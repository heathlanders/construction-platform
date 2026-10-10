export type {
  MechanicalCodeFamily,
  MechanicalCodeEdition,
  MechanicalInspectionType,
  BuildingType,
  MechanicalJurisdictionInfo,
  MechanicalInspectionStep,
} from './types.js';

export {
  MECHANICAL_INSPECTION_TYPE_LABELS,
  MECHANICAL_CODE_FAMILY_LABELS,
  BUILDING_TYPE_LABELS,
} from './types.js';

export { MECHANICAL_JURISDICTIONS } from './code-editions.js';
export { getMechanicalInspectionSequence } from './inspection-sequences.js';

import { MECHANICAL_JURISDICTIONS } from './code-editions.js';
import type { MechanicalJurisdictionInfo } from './types.js';

const JURISDICTION_MAP = new Map<string, MechanicalJurisdictionInfo>(
  MECHANICAL_JURISDICTIONS.map((j) => [j.state_code.toUpperCase(), j])
);

export function getMechanicalJurisdiction(stateCode: string): MechanicalJurisdictionInfo | null {
  return JURISDICTION_MAP.get(stateCode.toUpperCase()) ?? null;
}

export function isValidMechanicalStateCode(stateCode: string): boolean {
  return JURISDICTION_MAP.has(stateCode.toUpperCase());
}

export const ALL_MECHANICAL_JURISDICTIONS: MechanicalJurisdictionInfo[] = MECHANICAL_JURISDICTIONS;
