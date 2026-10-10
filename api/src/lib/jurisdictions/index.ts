// Public surface of the jurisdiction / AHJ resolution engine.

export type {
  Trade,
  GeoLevel,
  BuildingType,
  InspectionStepDef,
  SequenceOp,
  TradeCodeOverride,
  AhjMetadata,
  JurisdictionLayer,
  NormalizedGeo,
  ResolvedTradeCode,
  ResolvedJurisdiction,
} from './types.js';
export { TRADES } from './types.js';

export { resolveJurisdiction } from './resolver.js';
export type { ResolveInput } from './resolver.js';

export { normalizeGeo, jurisdictionKey, normalizeCityName } from './geography.js';
export type { GeoInput } from './geography.js';

export { deriveCountyFromZip, repairOcrZip } from './zip-county.js';
export type { ZipCountyEntry, ZipRepairFilter } from './zip-county.js';

export { listStateJurisdictions, findLayers } from './registry.js';
export type { JurisdictionSummary } from './registry.js';

export {
  loadReferenceCache,
  refreshReferenceCache,
  isReferenceCacheLoaded,
  lookupZipCounty,
  getCachedEdition,
  getCachedLayers,
} from './reference-store.js';
export type { CachedEdition, ZipCountyRow } from './reference-store.js';
