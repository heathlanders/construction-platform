/**
 * Mechanical model-code adoption by state — all 50 states + DC
 *
 * Last verified: 2026-06-12
 * Sources: ICC Code Adoption maps + IAPMO UMC adoption data.
 *
 * ⚠️ ACCURACY NOTE — like plumbing, mechanical code adoption is messy:
 *   • Two competing model codes: IMC (ICC) and UMC (IAPMO).
 *   • The IMC/UMC geography closely tracks the IPC/UPC plumbing split — IAPMO (UMC) states
 *     are predominantly western + a handful of state-derived codes; ICC (IMC) elsewhere.
 *   • Many states adopt locally (home rule); a statewide value is an approximation.
 *   • Always confirm the governing model code + edition with the local AHJ.
 *
 * code_family:
 *   'UMC' — Uniform Mechanical Code (IAPMO)
 *   'IMC' — International Mechanical Code (ICC)
 *
 * UPDATE INSTRUCTIONS: When a state changes adoption, update the entry and bump the
 * "Last verified" date above.
 */

import type { MechanicalJurisdictionInfo } from './types.js';

export const MECHANICAL_JURISDICTIONS: MechanicalJurisdictionInfo[] = [
  { state_code: 'AL', state_name: 'Alabama',              code_family: 'IMC', edition: '2021' },
  { state_code: 'AK', state_name: 'Alaska',               code_family: 'UMC', edition: '2021' },
  { state_code: 'AZ', state_name: 'Arizona',              code_family: 'UMC', edition: '2018',
    notes: 'Adoption is largely municipal in Arizona — confirm the governing code and edition with your local AHJ.' },
  { state_code: 'AR', state_name: 'Arkansas',             code_family: 'UMC', edition: '2021',
    notes: 'Arkansas mechanical rules track the UMC. Confirm amendments with your local AHJ.' },
  { state_code: 'CA', state_name: 'California',           code_family: 'UMC', edition: '2021',
    notes: 'California Mechanical Code (Title 24 Part 4) is an amended UMC. Verify with your local AHJ.' },
  { state_code: 'CO', state_name: 'Colorado',            code_family: 'IMC', edition: '2021',
    notes: 'Colorado is home-rule — many jurisdictions adopt their own edition. Confirm with your local AHJ.' },
  { state_code: 'CT', state_name: 'Connecticut',         code_family: 'IMC', edition: '2021' },
  { state_code: 'DE', state_name: 'Delaware',            code_family: 'IMC', edition: '2018' },
  { state_code: 'DC', state_name: 'District of Columbia', code_family: 'IMC', edition: '2021' },
  { state_code: 'FL', state_name: 'Florida',             code_family: 'IMC', edition: '2021',
    notes: 'Florida Building Code — Mechanical is IMC-based with Florida amendments.' },
  { state_code: 'GA', state_name: 'Georgia',             code_family: 'IMC', edition: '2018' },
  { state_code: 'HI', state_name: 'Hawaii',              code_family: 'UMC', edition: '2018',
    notes: 'Adopted by county in Hawaii — confirm the governing edition with your local AHJ.' },
  { state_code: 'ID', state_name: 'Idaho',               code_family: 'UMC', edition: '2021' },
  { state_code: 'IL', state_name: 'Illinois',            code_family: 'IMC', edition: '2018',
    notes: 'No uniform statewide mechanical code in Illinois; Chicago runs its own. Verify with your local AHJ.' },
  { state_code: 'IN', state_name: 'Indiana',             code_family: 'IMC', edition: '2018',
    notes: 'Indiana Mechanical Code is IMC-derived with state amendments.' },
  { state_code: 'IA', state_name: 'Iowa',                code_family: 'IMC', edition: '2021' },
  { state_code: 'KS', state_name: 'Kansas',              code_family: 'IMC', edition: '2021',
    notes: 'No statewide mechanical code in Kansas — adoption is local. Confirm with your local AHJ.' },
  { state_code: 'KY', state_name: 'Kentucky',            code_family: 'IMC', edition: '2018' },
  { state_code: 'LA', state_name: 'Louisiana',           code_family: 'IMC', edition: '2021' },
  { state_code: 'ME', state_name: 'Maine',               code_family: 'IMC', edition: '2021' },
  { state_code: 'MD', state_name: 'Maryland',            code_family: 'IMC', edition: '2021' },
  { state_code: 'MA', state_name: 'Massachusetts',       code_family: 'IMC', edition: '2021',
    notes: 'Massachusetts adopts the IMC under 780 CMR with state amendments. Verify with your local AHJ.' },
  { state_code: 'MI', state_name: 'Michigan',            code_family: 'IMC', edition: '2021' },
  { state_code: 'MN', state_name: 'Minnesota',           code_family: 'IMC', edition: '2020',
    notes: 'Minnesota Mechanical Code is IMC-based with a state-specific edition year.' },
  { state_code: 'MS', state_name: 'Mississippi',         code_family: 'IMC', edition: '2018' },
  { state_code: 'MO', state_name: 'Missouri',            code_family: 'IMC', edition: '2018',
    notes: 'No statewide mechanical code in Missouri — adoption is local. Confirm with your local AHJ.' },
  { state_code: 'MT', state_name: 'Montana',             code_family: 'UMC', edition: '2021' },
  { state_code: 'NE', state_name: 'Nebraska',            code_family: 'IMC', edition: '2018',
    notes: 'Adoption is largely local in Nebraska. Confirm with your local AHJ.' },
  { state_code: 'NV', state_name: 'Nevada',              code_family: 'UMC', edition: '2021',
    notes: 'Adopted by county/municipality in Nevada — confirm the governing edition with your local AHJ.' },
  { state_code: 'NH', state_name: 'New Hampshire',       code_family: 'IMC', edition: '2018' },
  { state_code: 'NJ', state_name: 'New Jersey',          code_family: 'IMC', edition: '2021',
    notes: 'New Jersey adopts the IMC under the state UCC.' },
  { state_code: 'NM', state_name: 'New Mexico',          code_family: 'UMC', edition: '2021' },
  { state_code: 'NY', state_name: 'New York',            code_family: 'IMC', edition: '2020',
    notes: 'New York City uses its own NYC Mechanical Code. The rest of the state follows the NYS (IMC-based) code. Verify with your local AHJ.' },
  { state_code: 'NC', state_name: 'North Carolina',      code_family: 'IMC', edition: '2018' },
  { state_code: 'ND', state_name: 'North Dakota',        code_family: 'UMC', edition: '2021' },
  { state_code: 'OH', state_name: 'Ohio',                code_family: 'IMC', edition: '2017' },
  { state_code: 'OK', state_name: 'Oklahoma',            code_family: 'IMC', edition: '2018' },
  { state_code: 'OR', state_name: 'Oregon',              code_family: 'UMC', edition: '2021',
    notes: 'Oregon Mechanical Specialty Code (OMSC) is a UMC derivative with Oregon amendments.' },
  { state_code: 'PA', state_name: 'Pennsylvania',        code_family: 'IMC', edition: '2018',
    notes: 'Pennsylvania UCC adopts the IMC, but home-rule municipalities (e.g. Philadelphia) run their own code. Confirm with your local AHJ.' },
  { state_code: 'RI', state_name: 'Rhode Island',        code_family: 'IMC', edition: '2021' },
  { state_code: 'SC', state_name: 'South Carolina',      code_family: 'IMC', edition: '2021' },
  { state_code: 'SD', state_name: 'South Dakota',        code_family: 'UMC', edition: '2018',
    notes: 'No statewide mechanical code in South Dakota — adoption is local. Confirm with your local AHJ.' },
  { state_code: 'TN', state_name: 'Tennessee',           code_family: 'IMC', edition: '2018' },
  { state_code: 'TX', state_name: 'Texas',               code_family: 'IMC', edition: '2021',
    notes: 'Texas adopts the IMC at the state level for many jurisdictions; municipalities may amend. Confirm with your AHJ.' },
  { state_code: 'UT', state_name: 'Utah',                code_family: 'IMC', edition: '2021' },
  { state_code: 'VT', state_name: 'Vermont',             code_family: 'IMC', edition: '2015',
    notes: 'Vermont mechanical rules are administered by the state — confirm the governing edition with your local AHJ.' },
  { state_code: 'VA', state_name: 'Virginia',            code_family: 'IMC', edition: '2021' },
  { state_code: 'WA', state_name: 'Washington',          code_family: 'UMC', edition: '2021',
    notes: 'Washington adopts the UMC (IMC for commercial in some scopes) with state amendments — confirm with your local AHJ.' },
  { state_code: 'WV', state_name: 'West Virginia',       code_family: 'IMC', edition: '2015' },
  { state_code: 'WI', state_name: 'Wisconsin',           code_family: 'IMC', edition: '2015',
    notes: 'Wisconsin runs its own HVAC rules (SPS 364, IMC-based). Verify with your local AHJ.' },
  { state_code: 'WY', state_name: 'Wyoming',             code_family: 'IMC', edition: '2018',
    notes: 'Adoption is largely local in Wyoming. Confirm with your local AHJ.' },
];
