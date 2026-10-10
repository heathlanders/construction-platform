// resolveJurisdiction() — the cascade + merge core. Deterministic, no I/O, no AI.
//
//   1. Synthesize the national default per trade from the 4 trade libs (default-layer.ts).
//   2. Gather matching override layers (registry), most-general → most-local.
//   3. Per trade, fold each layer's overrides onto the default (code fields + amendment notes
//      + sequence ops), then renumber the merged sequence.
//   4. AHJ = the most-local layer that sets one, else null (callers fall back to model default).

import { TRADES } from './types.js';
import type {
  Trade,
  BuildingType,
  ResolvedJurisdiction,
  ResolvedTradeCode,
  AhjMetadata,
} from './types.js';
import { normalizeGeo, jurisdictionKey, type GeoInput } from './geography.js';
import { resolveDefaultTradeCode } from './default-layer.js';
import { findLayers } from './registry.js';
import { applyTradeOverride, appendNote, renumber } from './merge.js';

export interface ResolveInput extends GeoInput {
  building_type: BuildingType;
}

export function resolveJurisdiction(input: ResolveInput): ResolvedJurisdiction {
  const geo = normalizeGeo(input);
  const buildingType = input.building_type;
  const layers = findLayers(geo); // general → local

  const trades = {} as Record<Trade, ResolvedTradeCode>;
  for (const trade of TRADES) {
    let acc = resolveDefaultTradeCode(trade, geo.state_code, buildingType);
    for (const layer of layers) {
      acc = applyTradeOverride(acc, layer.codes?.[trade]);
      // General per-layer note (all trades) folds in too.
      if (layer.notes) acc = { ...acc, jurisdiction_notes: appendNote(acc.jurisdiction_notes, layer.notes) };
    }
    acc = { ...acc, steps: renumber(acc.steps) };
    trades[trade] = acc;
  }

  // Most-local AHJ wins (layers are general → local, so last one with an ahj).
  let ahj: AhjMetadata | null = null;
  for (const layer of layers) if (layer.ahj) ahj = layer.ahj;

  return {
    geo,
    jurisdiction_key: jurisdictionKey(geo),
    matched_levels: layers.map((l) => l.level),
    ahj,
    trades,
  };
}
