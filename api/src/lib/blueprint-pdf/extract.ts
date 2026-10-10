// blueprint-pdf/extract.ts — PDF text-layer extraction for Blueprint Intelligence
// Phase 1: text-only path (no Vision API). Free, fast, vector-PDF-only.
// Phase 2 (later): combine with Claude Vision for symbol counts on rendered pages.

// Lazy-loaded pdfjs (legacy build for Node.js — no DOM).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let pdfjsCache: any = null;
async function getPdfjs(): Promise<any> {  // eslint-disable-line @typescript-eslint/no-explicit-any
  if (!pdfjsCache) {
    pdfjsCache = await import('pdfjs-dist/legacy/build/pdf.mjs');
  }
  return pdfjsCache;
}

// Max pages parsed per PDF (resource bound). Override via env for large-set tenants.
const MAX_PAGES = Number(process.env.BLUEPRINT_MAX_PAGES ?? 100);

// A page "has text" if its extracted text layer exceeds this many chars — below it the page is
// effectively blank/scanned. Used for the is_vector decision (routes to OCR vs text extraction).
const MIN_PAGE_TEXT_CHARS = 50;
// Vector-PDF threshold: fraction of pages that must carry a real text layer. Below this the set is
// treated as scanned and routed to the OCR path. Kept conservative (a few index/title-only pages
// in an otherwise-vector set shouldn't flip it to OCR).
const IS_VECTOR_TEXT_RATIO = 0.6;

export interface ExtractedPage {
  page_number: number;
  width_pts: number;
  height_pts: number;
  text: string;
  sheet_number: string | null;
  sheet_title: string | null;
  discipline: string;
  // High-DPI OCR of the title-block corner (OCR path only). Small legend glyphs (ZIP,
  // phone) collapse at full-page render DPI; this dedicated hi-res pass reads them
  // correctly (e.g. ZIP 53527 vs the full-page misread 53521). Undefined on the vector path.
  title_block_text?: string;
}

export interface PdfExtractResult {
  page_count: number;
  pages: ExtractedPage[];
  metadata: {
    creator: string | null;
    title: string | null;
    is_vector: boolean;
    // Diagnostics for the is_vector decision — surfaced so a mis-routed set (vector treated as
    // scanned or vice-versa) is inspectable in import_metadata rather than a black box.
    pages_with_text: number;
    text_ratio: number;   // pages_with_text / page_count, rounded to 2dp
  };
}

// Sheet number prefix → discipline mapping (mirrors blueprint-worker.ts)
const DISCIPLINE_BY_PREFIX: Record<string, string> = {
  A: 'architectural',
  E: 'electrical',
  P: 'plumbing',
  M: 'mechanical',
  S: 'structural',
  C: 'civil',
  L: 'civil',      // Landscape
  F: 'plumbing',   // Fire protection (piping) — default; FA (fire alarm) special-cased below
  T: 'specs',      // Technology / telecom
  Q: 'specs',      // Equipment
  G: 'general',    // General / cover / index sheets
  D: 'architectural', // Details / demolition
  I: 'architectural', // Interiors
};

// Multi-letter discipline prefixes that a single-char lookup gets wrong.
// Checked before the char-0 fallback (order matters — most specific first).
const MULTI_PREFIX_RULES: Array<{ re: RegExp; discipline: string }> = [
  { re: /^SP[-.]?\d/i, discipline: 'civil' },      // Site Plan (not Structural)
  { re: /^CS[-.]?\d/i, discipline: 'specs' },      // Cover Sheet
  { re: /^FA[-.]?\d/i, discipline: 'electrical' }, // Fire Alarm (low-voltage electrical)
  { re: /^FP[-.]?\d/i, discipline: 'plumbing' },   // Fire Protection (sprinkler piping)
  { re: /^FS[-.]?\d/i, discipline: 'plumbing' },   // Fire Suppression
  { re: /^GN?[-.]?\d/i, discipline: 'general' },   // General notes / cover
  { re: /^ID[-.]?\d/i, discipline: 'architectural' }, // Interior Design
];

export function disciplineFromSheetNumber(sheetNumber: string | null): string {
  if (!sheetNumber) return 'architectural';
  const sn = sheetNumber.trim().toUpperCase();
  for (const { re, discipline } of MULTI_PREFIX_RULES) {
    if (re.test(sn)) return discipline;
  }
  const prefix = sn.charAt(0);
  return DISCIPLINE_BY_PREFIX[prefix] ?? 'architectural';
}

// Title block sheet-number patterns:
//   A1, A-1, A.1, A2.1, E1.0, M-101, P-2.3, S1, S-2, SP-1, CS-1
// Matches uppercase letters (1-3) optionally followed by '-' or '.', then digits, optional .digits.
// The dotted separator (A.1) is common on residential sets — was previously missed.
const SHEET_NUMBER_RE = /\b([A-Z]{1,3}[-.]?\d+(?:\.\d+)?)\b/g;

// Common title words that often follow the sheet number on title blocks.
// Used as proximity hint when more than one candidate sheet number exists.
const SHEET_TITLE_KEYWORDS = [
  'PLAN', 'ELEVATION', 'SECTION', 'DETAIL', 'SCHEDULE', 'NOTES',
  'FOUNDATION', 'FRAMING', 'ELECTRICAL', 'PLUMBING', 'MECHANICAL',
  'ROOF', 'TRUSS', 'SITE', 'FLOOR', 'CONSTRUCTION', 'SPECIFICATIONS',
];

function extractSheetNumberAndTitle(text: string): { sheet_number: string | null; sheet_title: string | null } {
  if (!text) return { sheet_number: null, sheet_title: null };

  // Special case: cover sheet detection.
  // If text contains "SHEET INDEX" + "SHEET NAME" (typical cover-sheet header),
  // the FIRST sheet-number token after "SHEET NAME" is THIS sheet.
  const upper = text.toUpperCase();
  if (upper.includes('SHEET INDEX') && upper.includes('SHEET NAME')) {
    const after = text.slice(upper.indexOf('SHEET NAME') + 'SHEET NAME'.length);
    const firstMatch = after.match(SHEET_NUMBER_RE);
    if (firstMatch) {
      const num = firstMatch[0];
      // Title is whatever follows up to next sheet-number or 60 chars
      const titleStart = after.indexOf(num) + num.length;
      const titleSlice = after.slice(titleStart, titleStart + 80).toUpperCase();
      const nextNumMatch = titleSlice.match(SHEET_NUMBER_RE);
      const titleEnd = nextNumMatch ? titleSlice.indexOf(nextNumMatch[0]) : titleSlice.length;
      const title = titleSlice.slice(0, Math.min(titleEnd, 60)).trim() || null;
      return { sheet_number: num, sheet_title: title };
    }
  }

  const matches = Array.from(text.matchAll(SHEET_NUMBER_RE)).map((m) => ({
    value: m[1],
    index: m.index ?? 0,
  }));
  if (matches.length === 0) return { sheet_number: null, sheet_title: null };

  // Frequency-weighted scoring:
  //   Real sheet numbers (e.g. "A2", "SP-1") appear 1-2 times — once in the title block,
  //   maybe once more in the sheet index on cover page.
  //   Detail callouts (e.g. "SD-H", "SC-2", "S-1.2" referenced inside a circle bubble)
  //   typically repeat 5-20 times across a sheet.
  //   So: pick LOW-frequency candidates over high-frequency ones.

  const counts = new Map<string, number>();
  for (const m of matches) counts.set(m.value, (counts.get(m.value) ?? 0) + 1);

  const isLikelySheetNumber = (v: string) =>
    /^([A-Z]{1,3}[-.]\d+(\.\d+)?|[A-Z]\d+(\.\d+)?)$/.test(v);
  const isCommonSheetPrefix = (v: string) =>
    /^(SP|CS|FA|FP|FS|A|E|P|M|S|C|L|T|Q|G|D|I|MS|TS)[-.]?\d/i.test(v);

  // Score each candidate: prefer common prefixes, single-occurrence, longer numbers.
  const scored = Array.from(counts.entries()).map(([value, count]) => {
    let score = 0;
    if (isCommonSheetPrefix(value)) score += 10;
    if (isLikelySheetNumber(value)) score += 3;
    if (count === 1) score += 5;
    else if (count === 2) score += 2;
    else score -= count;     // penalize callout repetition
    if (value.length >= 4) score += 1;   // 'SP-1' beats 'A1' on tie when both appear once
    return { value, count, score, lastIndex: text.lastIndexOf(value) };
  });

  scored.sort((a, b) => b.score - a.score || b.lastIndex - a.lastIndex);
  const best = scored[0];

  // Title: scan forward up to 200 chars from the LAST occurrence (title block region)
  let title: string | null = null;
  const startIdx = best.lastIndex;
  const slice = text.slice(startIdx, startIdx + 200).toUpperCase();
  for (const kw of SHEET_TITLE_KEYWORDS) {
    if (slice.includes(kw)) {
      const kwIdx = slice.indexOf(kw);
      title = slice.slice(kwIdx, kwIdx + 60).split(/[\n\r"‘’]/)[0].trim();
      break;
    }
  }

  return { sheet_number: best.value, sheet_title: title };
}

/**
 * Extract text and metadata from a PDF buffer using pdfjs-dist.
 * No rendering, no AI calls — pure text-layer scrape.
 *
 * @param buffer Raw PDF bytes
 * @returns Per-page text + sheet numbers + metadata
 */
export async function extractPdfText(buffer: Buffer): Promise<PdfExtractResult> {
  const pdfjs = await getPdfjs();
  // pdfjs expects Uint8Array
  const data = new Uint8Array(buffer);

  // Disable worker — we run in a Node worker process, not browser
  const loadingTask = pdfjs.getDocument({
    data,
    disableWorker: true,
    isEvalSupported: false,
    useSystemFonts: false,
  });

  const doc = await loadingTask.promise;
  const totalPages: number = doc.numPages;
  // Resource bound (B2.6): cap how many pages we parse so a pathological/huge set can't run
  // unbounded. A construction set over the cap is rare; when hit we process the first N and warn.
  const pageCount = Math.min(totalPages, MAX_PAGES);
  if (totalPages > pageCount) {
    console.warn({ totalPages, cap: pageCount }, 'extract: page count over cap — truncating');
  }

  const pages: ExtractedPage[] = [];
  let pagesWithText = 0;

  for (let i = 1; i <= pageCount; i++) {
    const page = await doc.getPage(i);
    const viewport = page.getViewport({ scale: 1 });
    const content = await page.getTextContent();

    const text = (content.items as Array<{ str?: string }>)
      .map((it) => it.str ?? '')
      .join(' ')
      .replace(/[ ​]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (text.length > MIN_PAGE_TEXT_CHARS) pagesWithText++;

    const { sheet_number, sheet_title } = extractSheetNumberAndTitle(text);

    pages.push({
      page_number: i,
      width_pts: viewport.width,
      height_pts: viewport.height,
      text,
      sheet_number,
      sheet_title,
      discipline: disciplineFromSheetNumber(sheet_number),
    });

    page.cleanup();
  }

  // Document metadata (creator, title)
  let creator: string | null = null;
  let title: string | null = null;
  try {
    const meta = await doc.getMetadata();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const info = meta?.info as any;
    creator = info?.Creator ?? null;
    title = info?.Title ?? null;
  } catch {
    // metadata is best-effort
  }

  await doc.destroy();

  const textRatio = pageCount === 0 ? 0 : pagesWithText / pageCount;
  return {
    page_count: pageCount,
    pages,
    metadata: {
      creator,
      title,
      // Heuristic: vector PDF if at least IS_VECTOR_TEXT_RATIO of pages carry a real text layer.
      is_vector: pageCount === 0 ? false : textRatio >= IS_VECTOR_TEXT_RATIO,
      pages_with_text: pagesWithText,
      text_ratio: Math.round(textRatio * 100) / 100,
    },
  };
}
