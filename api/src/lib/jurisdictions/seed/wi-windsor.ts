// Village of Windsor, WI — municipal AHJ. State-administered codes (wi-state.ts); AHJ identity only.
// Windsor contracts building inspection to a third-party inspection agency (common for small WI
// villages); the contact below routes through the Village office.

import type { JurisdictionLayer } from '../types.js';

export const wiWindsor: JurisdictionLayer = {
  level: 'city',
  state_code: 'WI',
  county_fips: '55025',
  city_name: 'windsor',
  ahj: {
    ahj_name: 'Village of Windsor',
    ahj_level: 'city',
    permit_office: 'Village of Windsor — Building Inspection (contracted inspector)',
    phone: '608-846-3854',
    website: 'https://www.windsorwi.gov/',
    address: '4084 Mueller Rd, DeForest, WI 53532',
    fee_notes: 'Inspection contracted to a third-party agency; fees per Village of Windsor schedule.',
    submittal_requirements: [
      'Completed permit application',
      'Site plan and construction drawings',
      'Contractor WI DSPS credential on file',
    ],
  },
};
