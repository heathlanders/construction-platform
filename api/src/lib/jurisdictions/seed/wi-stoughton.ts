// City of Stoughton, WI — municipal AHJ. State-administered codes (wi-state.ts); AHJ identity only.

import type { JurisdictionLayer } from '../types.js';

export const wiStoughton: JurisdictionLayer = {
  level: 'city',
  state_code: 'WI',
  county_fips: '55025',
  city_name: 'stoughton',
  ahj: {
    ahj_name: 'City of Stoughton',
    ahj_level: 'city',
    permit_office: 'Stoughton Building Inspection Department',
    phone: '608-873-6677',
    website: 'https://www.ci.stoughton.wi.us/building-inspection',
    address: '381 E Main St, Stoughton, WI 53589',
    fee_notes: 'Permit fees per City of Stoughton fee schedule.',
    submittal_requirements: [
      'Completed permit application',
      'Site plan and construction drawings',
      'Contractor WI DSPS credential on file',
    ],
  },
};
