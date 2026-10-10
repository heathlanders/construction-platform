// City of Madison, WI — municipal AHJ. Codes are state-administered (wi-state.ts); this layer
// carries AHJ identity + a Madison-specific erosion-control inspection that the city requires
// on building work (demonstrates a city-level sequence_op layered onto the state code).

import type { JurisdictionLayer } from '../types.js';

export const wiMadison: JurisdictionLayer = {
  level: 'city',
  state_code: 'WI',
  county_fips: '55025',
  city_name: 'madison',
  ahj: {
    ahj_name: 'City of Madison',
    ahj_level: 'city',
    permit_office: 'Building Inspection Division',
    phone: '608-266-4551',
    email: 'building@cityofmadison.com',
    website: 'https://www.cityofmadison.com/dpced/bi/',
    address: '215 Martin Luther King Jr Blvd, Suite 017, Madison, WI 53703',
    fee_notes: 'Permit fees per City of Madison fee schedule; plan review required for commercial.',
    submittal_requirements: [
      'Completed permit application',
      'Two sets of plans (or electronic via the Madison Permits & Licenses portal)',
      'Erosion control plan for ground-disturbing work',
      'Contractor credential / WI DSPS license on file',
    ],
  },
  codes: {
    building: {
      sequence_ops: [
        {
          op: 'add',
          step: {
            sequence_order: 0, // pre-construction; renumbered into position by the resolver
            inspection_type: 'erosion_control',
            title: 'Erosion Control Inspection',
            description:
              'City of Madison requires an approved erosion-control inspection before site disturbance (MGO Ch. 37).',
            csi_division: '31 25 00',
            estimated_duration_days: 1,
          },
        },
      ],
    },
  },
};
