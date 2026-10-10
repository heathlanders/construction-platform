// intake/scale.ts — deterministic size wording for the image prompt.
//
// Image models can't measure, and a bare "new concrete patio" gets painted across the whole yard. Clients
// shouldn't have to know that, so the framework turns the measured answers into words an image model can
// picture: real dimensions + an everyday object of the same size (a parking space, a one-car garage …).
// Any trade gets this by listing its area / linear field in `prompt.order`. Pure, no I/O.

import type { AreaValue } from './types.js';

/** Which everyday objects to compare against — a driveway and a bedroom floor need different yardsticks. */
export type ScaleRef = 'outdoor' | 'indoor';

/** Ascending bands: first band whose `max_sf` ≥ the area wins. Keep phrases short and concrete. */
const AREA_BANDS: Record<ScaleRef, readonly { max_sf: number; like: string }[]> = {
  outdoor: [
    { max_sf: 40, like: 'about the size of a doormat to a small rug, a small spot' },
    { max_sf: 100, like: 'about the size of a large area rug, a small spot' },
    { max_sf: 200, like: 'about the size of one parking space' },
    { max_sf: 330, like: 'about the size of a one-car garage floor' },
    { max_sf: 650, like: 'about the size of a two-car garage floor' },
    { max_sf: 1200, like: 'about the size of a three-car garage floor' },
    { max_sf: 3000, like: 'a large area, about the size of four to eight parking spaces' },
    { max_sf: Infinity, like: 'a very large area, about the size of a small parking lot' },
  ],
  indoor: [
    { max_sf: 40, like: 'about the size of a closet floor' },
    { max_sf: 80, like: 'about the size of a bathroom floor' },
    { max_sf: 180, like: 'about the size of a bedroom floor' },
    { max_sf: 400, like: 'about the size of a large living room floor' },
    { max_sf: Infinity, like: 'a large open floor area' },
  ],
};

/** Below this the slab is a minority of a typical yard photo — say so, or the model paves everything. */
const PARTIAL_COVERAGE_MAX_SF = 650;

const ft = (n: number) => String(Math.round(n * 10) / 10);

export function areaComparison(sf: number, ref: ScaleRef = 'outdoor'): string {
  return AREA_BANDS[ref].find((b) => sf <= b.max_sf)!.like;
}

/** e.g. "roughly 12 by 16 feet (about 190 square feet, about the size of one parking space), covering only part of the ground" */
export function describeArea(v: AreaValue, sf: number, ref: ScaleRef = 'outdoor'): string | null {
  if (!(sf > 0)) return null;
  const total = `about ${Math.round(sf / 10) * 10 || Math.round(sf)} square feet`;
  let dims: string;
  switch (v.shape) {
    case 'rect': {
      const short = Math.min(v.width_ft, v.length_ft);
      const long = Math.max(v.width_ft, v.length_ft);
      // A 4×45 walk is the same area as a parking space but looks nothing like one — describe the strip.
      if (long >= 3 * short) {
        const strip = `a long narrow strip roughly ${ft(short)} feet wide and ${ft(long)} feet long (${total})`;
        return ref === 'outdoor' && sf <= PARTIAL_COVERAGE_MAX_SF ? `${strip}, covering only part of the open ground` : strip;
      }
      dims = `roughly ${ft(short)} by ${ft(long)} feet`;
      break;
    }
    case 'circle': dims = `round, roughly ${ft(v.diameter_ft)} feet across`; break;
    case 'l_shape': dims = `L-shaped, roughly ${ft(v.a_length_ft)} by ${ft(v.a_width_ft + v.b_width_ft)} feet overall`; break;
    default: dims = '';
  }
  const size = dims ? `${dims} (${total}, ${areaComparison(sf, ref)})` : `${total} (${areaComparison(sf, ref)})`;
  return ref === 'outdoor' && sf <= PARTIAL_COVERAGE_MAX_SF ? `${size}, covering only part of the open ground` : size;
}

/** e.g. "about 40 feet long (about the length of two cars parked end to end)" */
export function describeLength(lf: number): string | null {
  if (!(lf > 0)) return null;
  const like =
    lf <= 8 ? 'about the width of a doorway or two'
      : lf <= 20 ? 'about the length of one car'
        : lf <= 45 ? 'about the length of two cars parked end to end'
          : lf <= 100 ? 'about the length of a typical house'
            : 'longer than a typical house';
  return `about ${Math.round(lf)} feet long (${like})`;
}
