/**
 * Plumbing model-code adoption by state — all 50 states + DC
 *
 * Last verified: 2026-06-12
 * Sources: ICC Code Adoption maps + IAPMO UPC adoption data.
 *
 * ⚠️ ACCURACY NOTE — plumbing code adoption is materially messier than the NEC:
 *   • The US is split between TWO model codes: IPC (ICC) and UPC (IAPMO).
 *   • Many states adopt at the LOCAL level (home rule), so a statewide value is an
 *     approximation. Always confirm the governing code + edition with the local AHJ.
 *   • Several large jurisdictions run their own derived code (NYC, Chicago, MA, WI).
 *   • A few states (e.g. TX) formally recognize BOTH model codes — the value below is
 *     the more common default and the `notes` field flags the ambiguity.
 *
 * code_family:
 *   'UPC' — Uniform Plumbing Code (IAPMO), predominantly western + a few others
 *   'IPC' — International Plumbing Code (ICC), predominant nationally
 *
 * UPDATE INSTRUCTIONS: When a state changes adoption, update the entry and bump the
 * "Last verified" date above.
 */

import type { PlumbingJurisdictionInfo } from './types.js';

export const PLUMBING_JURISDICTIONS: PlumbingJurisdictionInfo[] = [
  { state_code: 'AL', state_name: 'Alabama',              code_family: 'IPC', edition: '2021' },
  { state_code: 'AK', state_name: 'Alaska',               code_family: 'UPC', edition: '2021' },
  { state_code: 'AZ', state_name: 'Arizona',              code_family: 'UPC', edition: '2018',
    notes: 'Adoption is largely at the municipal level in Arizona — confirm the governing code and edition with your local AHJ.' },
  { state_code: 'AR', state_name: 'Arkansas',             code_family: 'UPC', edition: '2021',
    notes: 'Arkansas Plumbing Code is a UPC derivative. Confirm amendments with your local AHJ.' },
  { state_code: 'CA', state_name: 'California',           code_family: 'UPC', edition: '2021',
    notes: 'California Plumbing Code (CPC, Title 24 Part 5) is an amended UPC. Verify requirements with your local AHJ.' },
  { state_code: 'CO', state_name: 'Colorado',            code_family: 'IPC', edition: '2021',
    notes: 'Colorado is home-rule — many jurisdictions adopt their own edition. Confirm with your local AHJ.' },
  { state_code: 'CT', state_name: 'Connecticut',         code_family: 'IPC', edition: '2021' },
  { state_code: 'DE', state_name: 'Delaware',            code_family: 'IPC', edition: '2018' },
  { state_code: 'DC', state_name: 'District of Columbia', code_family: 'IPC', edition: '2021' },
  { state_code: 'FL', state_name: 'Florida',             code_family: 'IPC', edition: '2021',
    notes: 'Florida Building Code — Plumbing is IPC-based with Florida amendments.' },
  { state_code: 'GA', state_name: 'Georgia',             code_family: 'IPC', edition: '2018' },
  { state_code: 'HI', state_name: 'Hawaii',              code_family: 'UPC', edition: '2018',
    notes: 'Adopted by county in Hawaii — confirm the governing edition with your local AHJ.' },
  { state_code: 'ID', state_name: 'Idaho',               code_family: 'UPC', edition: '2021' },
  { state_code: 'IL', state_name: 'Illinois',            code_family: 'IPC', edition: '2014',
    notes: 'Illinois State Plumbing Code is its own code (IDPH). Chicago runs a separate municipal plumbing code. Verify with your local AHJ.' },
  { state_code: 'IN', state_name: 'Indiana',             code_family: 'UPC', edition: '2018',
    notes: 'Indiana Plumbing Code is a UPC derivative with state amendments.' },
  { state_code: 'IA', state_name: 'Iowa',                code_family: 'UPC', edition: '2021' },
  { state_code: 'KS', state_name: 'Kansas',              code_family: 'IPC', edition: '2021',
    notes: 'No statewide plumbing code in Kansas — adoption is local. Confirm with your local AHJ.' },
  { state_code: 'KY', state_name: 'Kentucky',            code_family: 'UPC', edition: '2018',
    notes: 'Kentucky State Plumbing Code is a UPC derivative.' },
  { state_code: 'LA', state_name: 'Louisiana',           code_family: 'UPC', edition: '2018',
    notes: 'Louisiana State Plumbing Code (Part XIV) is UPC-derived.' },
  { state_code: 'ME', state_name: 'Maine',               code_family: 'UPC', edition: '2021',
    notes: 'Maine Uniform Plumbing Code is UPC-based.' },
  { state_code: 'MD', state_name: 'Maryland',            code_family: 'IPC', edition: '2021',
    notes: 'Maryland uses the National Standard Plumbing Code historically; many counties now reference IPC. Confirm with your local AHJ.' },
  { state_code: 'MA', state_name: 'Massachusetts',       code_family: 'UPC', edition: '2021',
    notes: 'Massachusetts runs its own plumbing code (248 CMR), a UPC-influenced state code. Verify with the state board / local AHJ.' },
  { state_code: 'MI', state_name: 'Michigan',            code_family: 'IPC', edition: '2021' },
  { state_code: 'MN', state_name: 'Minnesota',           code_family: 'UPC', edition: '2020',
    notes: 'Minnesota Plumbing Code (4714) is a UPC derivative with a state-specific edition year.' },
  { state_code: 'MS', state_name: 'Mississippi',         code_family: 'IPC', edition: '2018' },
  { state_code: 'MO', state_name: 'Missouri',            code_family: 'IPC', edition: '2018',
    notes: 'No statewide plumbing code in Missouri — adoption is local. Confirm with your local AHJ.' },
  { state_code: 'MT', state_name: 'Montana',             code_family: 'UPC', edition: '2021' },
  { state_code: 'NE', state_name: 'Nebraska',            code_family: 'IPC', edition: '2018',
    notes: 'Adoption is largely local in Nebraska. Confirm with your local AHJ.' },
  { state_code: 'NV', state_name: 'Nevada',              code_family: 'UPC', edition: '2021',
    notes: 'Adopted by county/municipality in Nevada — confirm the governing edition with your local AHJ.' },
  { state_code: 'NH', state_name: 'New Hampshire',       code_family: 'IPC', edition: '2018' },
  { state_code: 'NJ', state_name: 'New Jersey',          code_family: 'IPC', edition: '2021',
    notes: 'New Jersey adopts the National Standard Plumbing Code / IPC under the state UCC. Confirm with your local AHJ.' },
  { state_code: 'NM', state_name: 'New Mexico',          code_family: 'UPC', edition: '2021' },
  { state_code: 'NY', state_name: 'New York',            code_family: 'IPC', edition: '2020',
    notes: 'New York City uses its own NYC Plumbing Code. The rest of the state follows the NYS (IPC-based) Plumbing Code. Verify with your local AHJ.' },
  { state_code: 'NC', state_name: 'North Carolina',      code_family: 'IPC', edition: '2018' },
  { state_code: 'ND', state_name: 'North Dakota',        code_family: 'UPC', edition: '2021' },
  { state_code: 'OH', state_name: 'Ohio',                code_family: 'IPC', edition: '2017' },
  { state_code: 'OK', state_name: 'Oklahoma',            code_family: 'IPC', edition: '2018' },
  { state_code: 'OR', state_name: 'Oregon',              code_family: 'UPC', edition: '2021',
    notes: 'Oregon Plumbing Specialty Code (OPSC) is a UPC derivative with Oregon amendments.' },
  { state_code: 'PA', state_name: 'Pennsylvania',        code_family: 'IPC', edition: '2018',
    notes: 'Pennsylvania UCC adopts the IPC, but home-rule municipalities (e.g. Philadelphia) run their own code. Confirm with your local AHJ.' },
  { state_code: 'RI', state_name: 'Rhode Island',        code_family: 'IPC', edition: '2021' },
  { state_code: 'SC', state_name: 'South Carolina',      code_family: 'IPC', edition: '2021' },
  { state_code: 'SD', state_name: 'South Dakota',        code_family: 'UPC', edition: '2018',
    notes: 'No statewide plumbing code in South Dakota — adoption is local. Confirm with your local AHJ.' },
  { state_code: 'TN', state_name: 'Tennessee',           code_family: 'IPC', edition: '2018' },
  { state_code: 'TX', state_name: 'Texas',               code_family: 'IPC', edition: '2021',
    notes: 'Texas recognizes BOTH the IPC and the UPC at the state level; municipalities choose. Confirm which model code your AHJ enforces.' },
  { state_code: 'UT', state_name: 'Utah',                code_family: 'IPC', edition: '2021' },
  { state_code: 'VT', state_name: 'Vermont',             code_family: 'IPC', edition: '2015',
    notes: 'Vermont plumbing rules are administered by the state — confirm the governing edition with your local AHJ.' },
  { state_code: 'VA', state_name: 'Virginia',            code_family: 'IPC', edition: '2021' },
  { state_code: 'WA', state_name: 'Washington',          code_family: 'UPC', edition: '2021',
    notes: 'Washington adopts the UPC with state amendments (WAC 51-56).' },
  { state_code: 'WV', state_name: 'West Virginia',       code_family: 'IPC', edition: '2015' },
  { state_code: 'WI', state_name: 'Wisconsin',           code_family: 'UPC', edition: '2021',
    notes: 'Wisconsin runs its own plumbing code (SPS 382-387), historically UPC-derived. Verify with your local AHJ.' },
  { state_code: 'WY', state_name: 'Wyoming',             code_family: 'IPC', edition: '2018',
    notes: 'Adoption is largely local in Wyoming. Confirm with your local AHJ.' },
];
