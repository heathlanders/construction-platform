/**
 * Adopted ICC building-code edition by state — all 50 states + DC
 *
 * Last verified: 2026-06-12
 * Source: ICC Code Adoption maps (IRC/IBC are adopted together on the same edition cycle).
 *
 * ⚠️ ACCURACY NOTE:
 *   • The edition below is the state's adopted ICC year; IRC (1-2 family) and IBC (all else)
 *     share that edition. Which family applies is derived from occupancy, not the state.
 *   • Many states adopt locally (home rule); a statewide value is an approximation.
 *   • Several large jurisdictions run heavily-amended or independent codes (NYC, Chicago, CA
 *     Title 24, FL Building Code, WI) — flagged in notes.
 *   • Always confirm the governing edition + local amendments with the AHJ.
 *
 * UPDATE INSTRUCTIONS: When a state adopts a new edition, update the entry and bump the
 * "Last verified" date above.
 */

import type { BuildingJurisdictionInfo } from './types.js';

export const BUILDING_JURISDICTIONS: BuildingJurisdictionInfo[] = [
  { state_code: 'AL', state_name: 'Alabama',              edition: '2021' },
  { state_code: 'AK', state_name: 'Alaska',               edition: '2018' },
  { state_code: 'AZ', state_name: 'Arizona',              edition: '2018',
    notes: 'Adoption is largely municipal in Arizona — confirm the governing edition with your local AHJ.' },
  { state_code: 'AR', state_name: 'Arkansas',             edition: '2021' },
  { state_code: 'CA', state_name: 'California',           edition: '2021',
    notes: 'California Building Code (Title 24 Part 2) is an amended IBC; CRC Part 2.5 is an amended IRC. Verify with your local AHJ.' },
  { state_code: 'CO', state_name: 'Colorado',             edition: '2021',
    notes: 'Colorado is home-rule — no statewide building code; many jurisdictions adopt their own edition. Confirm with your local AHJ.' },
  { state_code: 'CT', state_name: 'Connecticut',          edition: '2021' },
  { state_code: 'DE', state_name: 'Delaware',             edition: '2018' },
  { state_code: 'DC', state_name: 'District of Columbia', edition: '2021' },
  { state_code: 'FL', state_name: 'Florida',              edition: '2021',
    notes: 'Florida Building Code is an IBC/IRC derivative with extensive Florida amendments (HVHZ, wind). Verify with your local AHJ.' },
  { state_code: 'GA', state_name: 'Georgia',              edition: '2018' },
  { state_code: 'HI', state_name: 'Hawaii',               edition: '2018',
    notes: 'Adopted by county in Hawaii — confirm the governing edition with your local AHJ.' },
  { state_code: 'ID', state_name: 'Idaho',                edition: '2018' },
  { state_code: 'IL', state_name: 'Illinois',             edition: '2021',
    notes: 'No uniform statewide building code in Illinois; Chicago runs its own building code. Verify with your local AHJ.' },
  { state_code: 'IN', state_name: 'Indiana',              edition: '2018',
    notes: 'Indiana Building Code is an IBC derivative with state amendments.' },
  { state_code: 'IA', state_name: 'Iowa',                 edition: '2021' },
  { state_code: 'KS', state_name: 'Kansas',               edition: '2018',
    notes: 'No statewide building code in Kansas — adoption is local. Confirm with your local AHJ.' },
  { state_code: 'KY', state_name: 'Kentucky',             edition: '2018' },
  { state_code: 'LA', state_name: 'Louisiana',            edition: '2021' },
  { state_code: 'ME', state_name: 'Maine',                edition: '2015' },
  { state_code: 'MD', state_name: 'Maryland',             edition: '2021' },
  { state_code: 'MA', state_name: 'Massachusetts',        edition: '2021',
    notes: 'Massachusetts State Building Code (780 CMR) is an amended IBC/IRC. Verify with your local AHJ.' },
  { state_code: 'MI', state_name: 'Michigan',             edition: '2015' },
  { state_code: 'MN', state_name: 'Minnesota',            edition: '2020',
    notes: 'Minnesota State Building Code is an amended IBC/IRC with a state-specific edition year.' },
  { state_code: 'MS', state_name: 'Mississippi',          edition: '2018' },
  { state_code: 'MO', state_name: 'Missouri',             edition: '2018',
    notes: 'No statewide building code in Missouri — adoption is local. Confirm with your local AHJ.' },
  { state_code: 'MT', state_name: 'Montana',              edition: '2021' },
  { state_code: 'NE', state_name: 'Nebraska',             edition: '2018',
    notes: 'Adoption is largely local in Nebraska. Confirm with your local AHJ.' },
  { state_code: 'NV', state_name: 'Nevada',               edition: '2018',
    notes: 'Adopted by county/municipality in Nevada — confirm the governing edition with your local AHJ.' },
  { state_code: 'NH', state_name: 'New Hampshire',        edition: '2018' },
  { state_code: 'NJ', state_name: 'New Jersey',           edition: '2021',
    notes: 'New Jersey adopts the IBC/IRC under the state UCC with NJ amendments.' },
  { state_code: 'NM', state_name: 'New Mexico',           edition: '2018' },
  { state_code: 'NY', state_name: 'New York',             edition: '2020',
    notes: 'New York City uses its own NYC Building Code. The rest of the state follows the NYS (IBC/IRC-based) Uniform Code. Verify with your local AHJ.' },
  { state_code: 'NC', state_name: 'North Carolina',       edition: '2018' },
  { state_code: 'ND', state_name: 'North Dakota',         edition: '2021' },
  { state_code: 'OH', state_name: 'Ohio',                 edition: '2018' },
  { state_code: 'OK', state_name: 'Oklahoma',             edition: '2018' },
  { state_code: 'OR', state_name: 'Oregon',               edition: '2021',
    notes: 'Oregon Structural Specialty Code / Residential Specialty Code are amended IBC/IRC. Verify with your local AHJ.' },
  { state_code: 'PA', state_name: 'Pennsylvania',         edition: '2018',
    notes: 'Pennsylvania UCC adopts the IBC/IRC, but home-rule municipalities (e.g. Philadelphia) may run their own code. Confirm with your local AHJ.' },
  { state_code: 'RI', state_name: 'Rhode Island',         edition: '2021' },
  { state_code: 'SC', state_name: 'South Carolina',       edition: '2021' },
  { state_code: 'SD', state_name: 'South Dakota',         edition: '2015',
    notes: 'No statewide building code in South Dakota — adoption is local. Confirm with your local AHJ.' },
  { state_code: 'TN', state_name: 'Tennessee',            edition: '2018' },
  { state_code: 'TX', state_name: 'Texas',                edition: '2021',
    notes: 'Texas adopts the IRC/IBC at the municipal level; editions vary by city. Confirm with your AHJ.' },
  { state_code: 'UT', state_name: 'Utah',                 edition: '2021' },
  { state_code: 'VT', state_name: 'Vermont',              edition: '2015',
    notes: 'Vermont building rules are administered by the state — confirm the governing edition with your local AHJ.' },
  { state_code: 'VA', state_name: 'Virginia',             edition: '2021' },
  { state_code: 'WA', state_name: 'Washington',           edition: '2021',
    notes: 'Washington adopts the IBC/IRC with state amendments (WAC 51-50 / 51-51).' },
  { state_code: 'WV', state_name: 'West Virginia',        edition: '2015' },
  { state_code: 'WI', state_name: 'Wisconsin',            edition: '2015',
    notes: 'Wisconsin runs its own commercial (SPS 361-366) and dwelling (SPS 320-325) codes, IBC/IRC-based. Verify with your local AHJ.' },
  { state_code: 'WY', state_name: 'Wyoming',              edition: '2018',
    notes: 'Adoption is largely local in Wyoming. Confirm with your local AHJ.' },
];
