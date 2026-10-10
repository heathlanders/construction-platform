/**
 * NEC Edition adoption by state — all 50 states + DC
 *
 * Last verified: 2026-03-25
 * Source: NFPA State Adoption Data (https://www.nfpa.org/codes-and-standards/resources/nfpa-state-info-pages)
 *
 * States most likely to need updates (currently on older editions):
 *   MS  — 2014 (significant outlier)
 *   NH, NJ, OH, PA, TN, AZ — 2017
 *
 * Jurisdiction exceptions (code is NOT plain NEC — always show notes in UI):
 *   CA — California Electrical Code (CEC 2022, Title 24 Part 3) = amended NEC 2020 base
 *   OR — Oregon Electrical Specialty Code (OESC) = based on NEC 2020
 *   NY — New York City uses NYCEC, not state NEC
 *   IL — Chicago has its own local electrical code
 *
 * UPDATE INSTRUCTIONS: When a state adopts a new edition, update the entry below
 * and update the "Last verified" date above.
 */

import type { JurisdictionInfo } from './types.js';

export const NEC_JURISDICTIONS: JurisdictionInfo[] = [
  { state_code: 'AL', state_name: 'Alabama',              nec_edition: '2020' },
  { state_code: 'AK', state_name: 'Alaska',               nec_edition: '2020' },
  { state_code: 'AZ', state_name: 'Arizona',              nec_edition: '2017' },
  { state_code: 'AR', state_name: 'Arkansas',             nec_edition: '2020' },
  {
    state_code: 'CA', state_name: 'California',           nec_edition: '2020',
    notes: 'California uses CEC 2022 (Title 24 Part 3), an amended NEC 2020 derivative. Verify requirements with your local AHJ.',
  },
  { state_code: 'CO', state_name: 'Colorado',             nec_edition: '2020' },
  { state_code: 'CT', state_name: 'Connecticut',          nec_edition: '2020' },
  { state_code: 'DE', state_name: 'Delaware',             nec_edition: '2020' },
  { state_code: 'DC', state_name: 'District of Columbia', nec_edition: '2020' },
  { state_code: 'FL', state_name: 'Florida',              nec_edition: '2020',
    notes: 'Florida Building Code Electrical (FBCE) = NEC 2020 with Florida amendments.' },
  { state_code: 'GA', state_name: 'Georgia',              nec_edition: '2020' },
  { state_code: 'HI', state_name: 'Hawaii',               nec_edition: '2020' },
  { state_code: 'ID', state_name: 'Idaho',                nec_edition: '2017' },
  {
    state_code: 'IL', state_name: 'Illinois',             nec_edition: '2020',
    notes: 'Chicago has its own local electrical code — not state NEC. Verify requirements with your local AHJ.',
  },
  { state_code: 'IN', state_name: 'Indiana',              nec_edition: '2020' },
  { state_code: 'IA', state_name: 'Iowa',                 nec_edition: '2023' },
  { state_code: 'KS', state_name: 'Kansas',               nec_edition: '2020' },
  { state_code: 'KY', state_name: 'Kentucky',             nec_edition: '2020' },
  { state_code: 'LA', state_name: 'Louisiana',            nec_edition: '2020' },
  { state_code: 'ME', state_name: 'Maine',                nec_edition: '2020' },
  { state_code: 'MD', state_name: 'Maryland',             nec_edition: '2020' },
  { state_code: 'MA', state_name: 'Massachusetts',        nec_edition: '2020' },
  { state_code: 'MI', state_name: 'Michigan',             nec_edition: '2020' },
  { state_code: 'MN', state_name: 'Minnesota',            nec_edition: '2020' },
  { state_code: 'MS', state_name: 'Mississippi',          nec_edition: '2014' },
  { state_code: 'MO', state_name: 'Missouri',             nec_edition: '2020' },
  { state_code: 'MT', state_name: 'Montana',              nec_edition: '2020' },
  { state_code: 'NE', state_name: 'Nebraska',             nec_edition: '2020' },
  { state_code: 'NV', state_name: 'Nevada',               nec_edition: '2020' },
  { state_code: 'NH', state_name: 'New Hampshire',        nec_edition: '2017' },
  { state_code: 'NJ', state_name: 'New Jersey',           nec_edition: '2017' },
  { state_code: 'NM', state_name: 'New Mexico',           nec_edition: '2020' },
  {
    state_code: 'NY', state_name: 'New York',             nec_edition: '2020',
    notes: 'New York City uses the New York City Electrical Code (NYCEC), not state NEC. Verify requirements with your local AHJ.',
  },
  { state_code: 'NC', state_name: 'North Carolina',       nec_edition: '2020' },
  { state_code: 'ND', state_name: 'North Dakota',         nec_edition: '2020' },
  { state_code: 'OH', state_name: 'Ohio',                 nec_edition: '2017' },
  { state_code: 'OK', state_name: 'Oklahoma',             nec_edition: '2020' },
  {
    state_code: 'OR', state_name: 'Oregon',               nec_edition: '2020',
    notes: 'Oregon uses the Oregon Electrical Specialty Code (OESC), based on NEC 2020 with Oregon amendments.',
  },
  { state_code: 'PA', state_name: 'Pennsylvania',         nec_edition: '2017' },
  { state_code: 'RI', state_name: 'Rhode Island',         nec_edition: '2020' },
  { state_code: 'SC', state_name: 'South Carolina',       nec_edition: '2020' },
  { state_code: 'SD', state_name: 'South Dakota',         nec_edition: '2020' },
  { state_code: 'TN', state_name: 'Tennessee',            nec_edition: '2017' },
  { state_code: 'TX', state_name: 'Texas',                nec_edition: '2020' },
  { state_code: 'UT', state_name: 'Utah',                 nec_edition: '2020' },
  { state_code: 'VT', state_name: 'Vermont',              nec_edition: '2020' },
  { state_code: 'VA', state_name: 'Virginia',             nec_edition: '2020' },
  { state_code: 'WA', state_name: 'Washington',           nec_edition: '2023' },
  { state_code: 'WV', state_name: 'West Virginia',        nec_edition: '2020' },
  // Wisconsin: NEC 2020 adopted via Wisconsin Admin Code SPS 316
  { state_code: 'WI', state_name: 'Wisconsin',            nec_edition: '2020' },
  { state_code: 'WY', state_name: 'Wyoming',              nec_edition: '2020' },
];
