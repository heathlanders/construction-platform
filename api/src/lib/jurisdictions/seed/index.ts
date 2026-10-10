// Aggregate of all seeded jurisdiction override layers. The national default comes from the
// 4 trade libs (default-layer.ts) and is NOT a layer here — these are sparse overrides on top.
//
// Add a jurisdiction = add a layer file and list it here. Order is irrelevant; the registry
// sorts by GeoLevel (state → county → city) at resolve time.

import type { JurisdictionLayer } from '../types.js';
import { wiState } from './wi-state.js';
import { wiDaneCounty } from './wi-dane-county.js';
import { wiMadison } from './wi-madison.js';
import { wiStoughton } from './wi-stoughton.js';
import { wiWindsor } from './wi-windsor.js';

export const SEED_LAYERS: JurisdictionLayer[] = [
  wiState,
  wiDaneCounty,
  wiMadison,
  wiStoughton,
  wiWindsor,
];
