// Dane County, WI (FIPS 55025). County-level AHJ — governs unincorporated areas and towns
// that contract inspection to the county. Incorporated cities/villages (Madison, Stoughton,
// Windsor) have their own AHJ layers that take precedence. No code overrides — WI codes are
// state-administered (see wi-state.ts).

import type { JurisdictionLayer } from '../types.js';

export const wiDaneCounty: JurisdictionLayer = {
  level: 'county',
  state_code: 'WI',
  county_fips: '55025',
  county_name: 'Dane',
  ahj: {
    ahj_name: 'Dane County',
    ahj_level: 'county',
    permit_office: 'Dane County Planning & Development — Building Inspection',
    phone: '608-266-4266',
    website: 'https://plandev.countyofdane.com/',
    address: '210 Martin Luther King Jr Blvd, Madison, WI 53703',
    fee_notes: 'County inspection applies to unincorporated towns; incorporated municipalities issue their own permits.',
  },
};
