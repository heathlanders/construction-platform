// blueprint-pdf/title-block.ts — Title-block / legend extraction (OCR-friendly).
//
// Every sheet of a builder set repeats the same title block: the drafter/architect firm,
// the builder/owner, the build address, plus phone/email. We mine those tokens and use them
// two ways:
//   1. Metadata + review-UI display (who drew it, where it's built).
//   2. Processing hints — a recognized builder/drafter attaches a BuilderProfile (region,
//      residential bias, code family) and the parsed location seeds a jurisdiction SUGGESTION
//      (state → permit milestone defaults) without overwriting the project record.
//
// Because the block is boilerplate repeated on every page, per-sheet extraction is noisy but
// the TRUE value recurs — voteTitleBlock() picks the cross-sheet frequency winner per field,
// which is what kills OCR garbage. Tuned against the real Madison WI (Madison WI) scans.

export interface TitleBlockInfo {
  architect_name: string | null;   // drafter / architect / engineer firm
  architect_phone: string | null;
  architect_email: string | null;
  builder_name: string | null;     // builder / owner / developer
  city: string | null;             // build location city (UPPER, as printed)
  state: string | null;            // CHAR(2)
  zip: string | null;              // 5-digit
  street_address: string | null;   // build street address, Title-Cased e.g. "437 Maple St"
  lot_number: string | null;       // lot designator digits/suffix only e.g. "25", "12B"
  location_raw: string | null;     // best assembled "CITY, ST ZIP"
}

export const EMPTY_TITLE_BLOCK: TitleBlockInfo = {
  architect_name: null, architect_phone: null, architect_email: null,
  builder_name: null, city: null, state: null, zip: null,
  street_address: null, lot_number: null, location_raw: null,
};

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA',
  'ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK',
  'OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC',
];
const STATE_ALT = US_STATES.join('|');

// Words that lead disclaimer / sheet boilerplate — strip when glued to a firm name.
const LEAD_STOPWORDS = new Set([
  'THE','IN','ALL','DIMENSIONS','WHILE','EVERY','EFFORT','HAS','BEEN','MADE','TO','ENSURE',
  'ACCURACY','OF','THESE','PLANS','IT','IS','BUILDERS','RESPONSIBILITY','VERIFY','FIELD','DO',
  'NOT','SCALE','PAGE','SQ','FT','SECTION','LETTER','MOBILE','PHONE','NUMBERS','AND','OR',
  'FOUNDATION','MAIN','FLOOR','NEW','GENERAL','TYPICAL','DETAIL','SHEET','NOTE','NOTES',
]);

// Construction jargon that would otherwise glue into a fake "<jargon> CONSTRUCTION/BUILDERS".
const JARGON = new Set([
  'PORTAL','FRAME','BRACE','BRACED','PANEL','LENGTH','WALL','WOOD','STEEL','METAL','DOUBLE',
  'STUD','SHEAR','POST','BEAM','HEADER','ROOF','FLOOR','SLAB','TYPICAL','DETAIL','SECTION',
  'GENERAL','FOUNDATION','MAIN','NEW','TRUSS','RAFTER','JOIST','PIER','BLOCK','MASONRY',
]);

function flatten(text: string): string {
  return text.replace(/\s*\n\s*/g, ' ').replace(/\s{2,}/g, ' ');
}

// Strip leading stopwords from a glued cap-run, return the trailing firm name.
function trimLead(s: string): string {
  const w = s.trim().split(/\s+/);
  while (w.length > 1 && LEAD_STOPWORDS.has(w[0])) w.shift();
  return w.join(' ').trim();
}

// Pick the best candidate: most frequent, tie-break fewest words (real names are short),
// then first seen. `reject` drops jargon-led or single-word noise.
function vote(cands: string[], reject?: (s: string) => boolean): string | null {
  const counts = new Map<string, number>();
  const order: string[] = [];
  for (const raw of cands) {
    const c = raw.trim();
    if (!c) continue;
    if (reject && reject(c)) continue;
    if (!counts.has(c)) order.push(c);
    counts.set(c, (counts.get(c) ?? 0) + 1);
  }
  let best: string | null = null;
  let bestScore = -1;
  for (const c of order) {
    const n = counts.get(c)!;
    const words = c.split(/\s+/).length;
    // higher count wins; tie → fewer words; tie → earlier (order preserved)
    const score = n * 100 - words;
    if (score > bestScore) { bestScore = score; best = c; }
  }
  return best;
}

const FIRM_RE = /((?:[A-Z][A-Z.&]+\s){0,3}(?:DRAFTING|DESIGN|ARCHITECT(?:S|URE)?|ENGINEERING)(?:\s+(?:SERVICES|GROUP|STUDIO|ASSOCIATES|LLC|INC|CO))?)\b/g;
const BUILDER_RE = /((?:[A-Z][A-Z.&]+\s){0,3}(?:PROPERTIES|CONSTRUCTION|BUILDERS?|HOMES|CONTRACTING|DEVELOPMENT))\b/g;
const PHONE_RE = /\b\d{3}[.\-\s]\d{3}[.\-\s]\d{4}\b/g;
// OCR routinely turns "@" into "O" and drops the dot before "COM".
const EMAIL_RE = /\b([A-Z0-9._%+-]{3,}(?:@|O)(?:GMAIL|YAHOO|HOTMAIL|OUTLOOK|AOL|COMCAST|TDS)\.?(?:COM|NET))\b/gi;
const STATEZIP_RE = new RegExp(`\\b(${STATE_ALT})\\b[\\s\\S]{0,30}?\\b(\\d{5})\\b`, 'gi');
const CITYSTATE_RE = new RegExp(`\\b([A-Z][A-Z]+(?:\\s[A-Z]+){0,2})\\s+(?:${STATE_ALT})\\b`, 'gi');

// Street address: house number + 1-3 cap words + a street suffix. OCR caps input.
// Voting across sheets kills false hits (a recurring real address out-frequencies noise).
const STREET_SUFFIX =
  'ST|STREET|AVE|AVENUE|RD|ROAD|DR|DRIVE|LN|LANE|CT|COURT|BLVD|WAY|PL|PLACE|CIR|CIRCLE|' +
  'TER|TERRACE|TRL|TRAIL|PKWY|PARKWAY|CV|COVE|RUN|PT|POINT|LOOP|PASS|PATH|CROSSING|XING';
const STREET_RE = new RegExp(
  `\\b(\\d{1,6})\\s+([A-Z][A-Z0-9'.\\-]*(?:\\s+[A-Z][A-Z0-9'.\\-]*){0,2}?)\\s+(${STREET_SUFFIX})\\b`,
  'gi',
);
const LOT_RE = /\bLOT\s+(\d{1,4}[A-Z]?)\b/gi;

const SUFFIX_CANON: Record<string, string> = {
  STREET: 'St', AVENUE: 'Ave', ROAD: 'Rd', DRIVE: 'Dr', LANE: 'Ln', COURT: 'Ct',
  PLACE: 'Pl', CIRCLE: 'Cir', TERRACE: 'Ter', TRAIL: 'Trl', PARKWAY: 'Pkwy',
  COVE: 'Cv', POINT: 'Pt', CROSSING: 'Xing', BLVD: 'Blvd', PKWY: 'Pkwy', XING: 'Xing',
};

// "437 MAPLE ST" → "437 Maple St". Number kept; words + suffix Title-Cased / canonicalized.
function normalizeStreet(num: string, name: string, suffix: string): string {
  const words = name.trim().split(/\s+/).map((w) =>
    w.length ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w,
  );
  const suf = suffix.toUpperCase();
  const canonSuf = SUFFIX_CANON[suf] ?? (suf[0] + suf.slice(1).toLowerCase());
  return `${num} ${words.join(' ')} ${canonSuf}`;
}

function normalizeEmail(raw: string): string {
  let e = raw.toUpperCase();
  if (!e.includes('@')) {
    // turn the LAST "O" before the provider into "@": ...SERVICESOGMAIL.COM → ...SERVICES@GMAIL.COM
    e = e.replace(/O(GMAIL|YAHOO|HOTMAIL|OUTLOOK|AOL|COMCAST|TDS)/, '@$1');
  }
  e = e.replace(/(GMAIL|YAHOO|HOTMAIL|OUTLOOK|AOL|COMCAST|TDS)(COM|NET)/, '$1.$2');
  return e.toLowerCase();
}

/** Extract a TitleBlockInfo from one sheet's text (vector or OCR). All fields best-effort. */
export function extractTitleBlock(text: string): TitleBlockInfo {
  if (!text) return { ...EMPTY_TITLE_BLOCK };
  const flat = flatten(text);

  const architect = vote(
    [...flat.matchAll(FIRM_RE)].map((m) => trimLead(m[1])),
    (s) => s.split(/\s+/).length < 2 || JARGON.has(s.split(/\s+/)[0]),
  );
  const builder = vote(
    [...flat.matchAll(BUILDER_RE)].map((m) => trimLead(m[1])),
    (s) => s.split(/\s+/).length < 2 || JARGON.has(s.split(/\s+/)[0]),
  );

  const phoneM = flat.match(PHONE_RE);
  const phone = phoneM ? phoneM[0].replace(/[\s\-]/g, '.') : null;

  const emailM = [...flat.matchAll(EMAIL_RE)][0];
  const email = emailM ? normalizeEmail(emailM[1]) : null;

  // state + zip — voted (boilerplate repeats it; disclaimer noise does not)
  const szCands: string[] = [];
  for (const m of flat.matchAll(STATEZIP_RE)) {
    const st = m[1].toUpperCase();
    const zip = m[2];
    const z = parseInt(zip, 10);
    if (z >= 1000 && z <= 99950) szCands.push(`${st} ${zip}`);
  }
  const sz = vote(szCands);
  const state = sz ? sz.split(' ')[0] : null;
  const zip = sz ? sz.split(' ')[1] : null;

  const city = vote(
    [...flat.matchAll(CITYSTATE_RE)].map((m) => m[1].trim().toUpperCase()),
    (s) => LEAD_STOPWORDS.has(s.split(/\s+/)[0]) || JARGON.has(s.split(/\s+/)[0]),
  );

  // street address — voted (boilerplate repeats it; stray dimension callouts do not)
  const street = vote(
    [...flat.matchAll(STREET_RE)].map((m) => normalizeStreet(m[1], m[2], m[3])),
  );

  // lot designator — store the number/suffix only, not the word "LOT"
  const lot = vote([...flat.matchAll(LOT_RE)].map((m) => m[1].toUpperCase()));

  const location_raw = city || state || zip
    ? [city, [state, zip].filter(Boolean).join(' ')].filter(Boolean).join(', ')
    : null;

  return {
    architect_name: architect, architect_phone: phone, architect_email: email,
    builder_name: builder, city, state, zip,
    street_address: street, lot_number: lot, location_raw,
  };
}

/** Merge two title blocks, preferring `primary`'s non-null fields (the high-DPI crop pass). */
export function mergeTitleBlock(primary: TitleBlockInfo, fallback: TitleBlockInfo): TitleBlockInfo {
  const out = {} as TitleBlockInfo;
  for (const k of Object.keys(EMPTY_TITLE_BLOCK) as Array<keyof TitleBlockInfo>) {
    out[k] = primary[k] ?? fallback[k];
  }
  return out;
}

/** Cross-sheet vote: pick the frequency winner per field over all sheets' title blocks. */
export function voteTitleBlock(list: TitleBlockInfo[]): TitleBlockInfo {
  const pick = (key: keyof TitleBlockInfo): string | null =>
    vote(list.map((t) => t[key]).filter((v): v is string => !!v));
  const state = pick('state');
  const zip = pick('zip');
  const city = pick('city');
  const location_raw = city || state || zip
    ? [city, [state, zip].filter(Boolean).join(' ')].filter(Boolean).join(', ')
    : pick('location_raw');
  return {
    architect_name: pick('architect_name'),
    architect_phone: pick('architect_phone'),
    architect_email: pick('architect_email'),
    builder_name: pick('builder_name'),
    city, state, zip,
    street_address: pick('street_address'),
    lot_number: pick('lot_number'),
    location_raw,
  };
}

// ─── Builder / architect profiles (processing hints — never override user input) ─────────────

export interface BuilderProfile {
  key: string;
  label: string;
  region_state: string;              // CHAR(2) — strongest hint for jurisdiction default
  region_county_fips?: string;       // authoritative county (OCR zip is unreliable — 7→1 misreads)
  region_county_name?: string;
  building_type_hint?: string;       // residential_sf, commercial, ...
  code_family?: string;              // IRC, IBC, ...
  notes?: string;
}

// Match on the OCR'd firm name. Add a row when a new repeat-customer builder is onboarded.
// region_county_* is the trustworthy geography: a known builder works a known county, so we
// don't depend on the title-block zip (OCR misreads e.g. Cottage Grove 53527 → 53521).
export const BUILDER_PROFILES: Array<BuilderProfile & { match: RegExp }> = [
  {
    key: 'example-drafting', label: 'Example Drafting Services', match: /EXAMPLE\s+DRAFTING/i,
    region_state: 'WI', region_county_fips: '55025', region_county_name: 'Dane',
    building_type_hint: 'residential_sf', code_family: 'IRC',
    notes: 'Wisconsin Uniform Dwelling Code (DSPS SPS 320-325). Madison / Dane County area residential drafter.',
  },
  {
    key: 'example-properties', label: 'Example Properties', match: /EXAMPLE\s+PROPERT/i,
    region_state: 'WI', region_county_fips: '55025', region_county_name: 'Dane',
    building_type_hint: 'residential_sf', code_family: 'IRC',
    notes: 'Cottage Grove / Dane County WI single-family builder.',
  },
];

/** Resolve a processing profile from extracted title-block names. Null when unrecognized. */
export function resolveBuilderProfile(tb: TitleBlockInfo): BuilderProfile | null {
  const hay = `${tb.architect_name ?? ''} ${tb.builder_name ?? ''}`;
  for (const p of BUILDER_PROFILES) {
    if (p.match.test(hay)) {
      const { match: _m, ...profile } = p;
      return profile;
    }
  }
  return null;
}
