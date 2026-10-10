// Wisconsin state layer. WI administers its codes statewide through DSPS chapters, so the
// state — not the municipality — is where code facts are set. Cities below carry AHJ identity
// only. Editions inherit from the per-trade libs (already WI-specific); this layer attaches the
// authoritative DSPS chapter references as amendment notes.
//
// NOTE: DSPS-adopted editions move on their own cycle. Confirm the current adopted edition
// against the live DSPS chapters before relying on these for submittal; the amendment notes
// point a PM at the governing chapter regardless of edition drift.

import type { JurisdictionLayer } from '../types.js';

export const wiState: JurisdictionLayer = {
  level: 'state',
  state_code: 'WI',
  notes:
    'Wisconsin codes are state-administered by the Dept. of Safety & Professional Services (DSPS). ' +
    'Local municipalities act as the AHJ for permitting and inspection.',
  codes: {
    building: {
      // ICC family (IRC/IBC) is occupancy-derived in the default layer; in WI 1-2 family
      // dwellings are governed by the state Uniform Dwelling Code, not the IRC directly.
      amendments_notes:
        'WI: 1-2 family dwellings governed by the Uniform Dwelling Code (DSPS SPS 320-325). ' +
        'Commercial/multifamily governed by the WI Commercial Building Code (DSPS SPS 361-366, IBC-based with state amendments).',
    },
    electrical: {
      amendments_notes:
        'WI: Electrical work governed by DSPS SPS 316 (NEC adopted with Wisconsin amendments). Residential electrical is folded into the Uniform Dwelling Code.',
    },
    plumbing: {
      amendments_notes:
        'WI: Plumbing governed by the Wisconsin Plumbing Code (DSPS SPS 382-387), a state code historically UPC-derived. Verify fixture/venting specifics against SPS 382.',
    },
    mechanical: {
      amendments_notes:
        'WI: HVAC/mechanical governed under the Commercial Building Code (DSPS SPS 341, IMC-based) for commercial; residential mechanical folded into the Uniform Dwelling Code.',
    },
  },
};
