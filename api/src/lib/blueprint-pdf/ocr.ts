// blueprint-pdf/ocr.ts — OCR fallback for scanned (image-only) PDFs.
//
// Many builder PDFs are scanned raster images with NO embedded text layer
// (extract.ts reports is_vector=false). This module rasterizes each page with
// mupdf (pure-WASM, no system deps) and runs Tesseract via tesseract.js
// (pure-WASM, no system deps) to synthesize a text layer, returning the same
// PdfExtractResult shape as extract.ts so the downstream parse/build pipeline
// is unchanged. No AI, no network at runtime (eng.traineddata is vendored).
//
// Quality note: OCR on dense construction drawings is noisy. Expect reliable
// sheet/discipline detection plus room labels and component callouts (trusses,
// footings, joists, siding, R-values) — not clean schedule tables.

import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { createWorker, type Worker } from 'tesseract.js';
import type { PdfExtractResult, ExtractedPage } from './extract.js';

// Page OCR resolution. We render the FULL sheet at high DPI for accurate data, but a 24"×36"
// sheet at 300 dpi is ~10800×16200 px — too big for one Tesseract bitmap. So we tile: split the
// page into clipped high-DPI tiles (each capped at TILE_MAX_PX per side), OCR each, concatenate.
// Tiling is adaptive — a small sheet renders as a single tile (no overhead); only large sheets
// split. Tunable via env for memory-constrained hosts.
const PAGE_DPI = Number(process.env.OCR_PAGE_DPI ?? 300);
const TILE_MAX_PX = Number(process.env.OCR_TILE_MAX_PX ?? 3000);
const TILE_OVERLAP = 0.04; // 4% tile overlap so labels spanning a seam aren't cut (dedup'd downstream)
// Page seg mode 11 = "sparse text" — best for scattered blueprint annotations.
const PSM_SPARSE = '11';

// Title-block second pass. Architect/builder/address/ZIP live in the bottom-right title
// block in glyphs too small to survive the 200-dpi full-page render (the "7" in ZIP 53527
// collapses to "1"). We re-render JUST that corner at high DPI and OCR it as a text block
// (PSM 6) so those fields read correctly. Tuned on the a Madison WI builder set.
const TITLE_BLOCK_DPI = 450;
const PSM_BLOCK = '6';
// Fraction of the page covered by the title block (right edge, bottom edge).
const TB_FRAC_X = 0.55; // right 45%
const TB_FRAC_Y = 0.78; // bottom 22%

// Resource bounds (B2.6): cap pages OCR'd, and time-box each page so one pathological sheet
// (huge tiled bitmap) can't hang the worker indefinitely. A timed-out page yields empty text
// (non-fatal); if too many pages are empty, the caller's yield gate falls back to template.
const MAX_PAGES = Number(process.env.BLUEPRINT_MAX_PAGES ?? 100);
const PAGE_TIMEOUT_MS = Number(process.env.OCR_PAGE_TIMEOUT_MS ?? 120_000);

function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolvePromise, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    p.then((v) => { clearTimeout(timer); resolvePromise(v); },
      (e) => { clearTimeout(timer); reject(e); });
  });
}

// Vendored language data (api/assets/tessdata/eng.traineddata) → no CDN at runtime.
function tessdataDir(): string {
  if (process.env.TESSDATA_PATH) return process.env.TESSDATA_PATH;
  // Resolve relative to this module so it works from src (tsx) and dist (built).
  // src/lib/blueprint-pdf → ../../../assets ; dist mirrors the same depth.
  try {
    const here = dirname(fileURLToPath(import.meta.url));
    return resolve(here, '../../../assets/tessdata');
  } catch {
    return resolve(process.cwd(), 'assets/tessdata');
  }
}

// Render a fractional sub-rectangle of a page at the given DPI. Clipped DrawDevice → only that
// region is rasterized, so high DPI stays cheap. Fractions are 0..1 of page width/height.
// Returns a grayscale PNG buffer. Exported: the vision path (blueprint-pdf/vision.ts) renders
// full pages (0,0,1,1) through the same primitive.
export function renderRegionPng(
  mupdf: typeof import('mupdf'),
  page: import('mupdf').Page,
  dpi: number,
  fx0: number, fy0: number, fx1: number, fy1: number,
): Buffer {
  const b = page.getBounds(); // [x0, y0, x1, y1] in points
  const w = b[2] - b[0];
  const h = b[3] - b[1];
  const s = dpi / 72;
  const bbox: [number, number, number, number] = [
    Math.floor((b[0] + w * fx0) * s), Math.floor((b[1] + h * fy0) * s),
    Math.ceil((b[0] + w * fx1) * s), Math.ceil((b[1] + h * fy1) * s),
  ];
  const pix = new mupdf.Pixmap(mupdf.ColorSpace.DeviceGray, bbox, false);
  pix.clear(255);
  const dev = new mupdf.DrawDevice(mupdf.Matrix.identity, pix);
  page.run(dev, mupdf.Matrix.scale(s, s));
  dev.close();
  const png = Buffer.from(pix.asPNG());
  pix.destroy();
  return png;
}

// Title-block corner at high DPI for accurate legend (ZIP/phone/firm) reads.
export function renderTitleBlockPng(mupdf: typeof import('mupdf'), page: import('mupdf').Page): Buffer {
  return renderRegionPng(mupdf, page, TITLE_BLOCK_DPI, TB_FRAC_X, TB_FRAC_Y, 1, 1);
}

// Full-page high-DPI OCR via adaptive tiling. Splits the sheet into a grid sized so each tile
// stays under TILE_MAX_PX per side, OCRs each clipped tile, and concatenates the text. Small
// sheets → 1 tile (no overhead). Tiles overlap slightly so seam-straddling labels survive.
async function ocrPageTiled(
  mupdf: typeof import('mupdf'),
  page: import('mupdf').Page,
  worker: Worker,
): Promise<string> {
  const b = page.getBounds();
  const s = PAGE_DPI / 72;
  const fullW = (b[2] - b[0]) * s;
  const fullH = (b[3] - b[1]) * s;
  const cols = Math.max(1, Math.ceil(fullW / TILE_MAX_PX));
  const rows = Math.max(1, Math.ceil(fullH / TILE_MAX_PX));

  await worker.setParameters({ tessedit_pageseg_mode: PSM_SPARSE as any });
  const parts: string[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const fx0 = Math.max(0, c / cols - TILE_OVERLAP);
      const fy0 = Math.max(0, r / rows - TILE_OVERLAP);
      const fx1 = Math.min(1, (c + 1) / cols + TILE_OVERLAP);
      const fy1 = Math.min(1, (r + 1) / rows + TILE_OVERLAP);
      const png = renderRegionPng(mupdf, page, PAGE_DPI, fx0, fy0, fx1, fy1);
      const { data } = await worker.recognize(png);
      parts.push(data.text);
    }
  }
  return parts.join('\n');
}

// Minimum recognizable-char yield for OCR to be considered worthwhile. Below this the scanned set
// is graphic-heavy (little readable text) and the worker falls back to the template baseline.
export const OCR_MIN_YIELD_CHARS = 200;

/** Total recognizable characters across all pages — gates whether OCR was worthwhile. */
export function ocrYieldChars(result: PdfExtractResult): number {
  return result.pages.reduce((sum, p) => sum + (p.text.match(/[A-Za-z0-9]/g)?.length ?? 0), 0);
}

/** Progress hook — invoked after each page finishes OCR (done = 1-based). */
export type OcrProgressFn = (done: number, total: number) => void | Promise<void>;

/**
 * OCR a scanned PDF buffer into the PdfExtractResult shape.
 * is_vector is reported false (it IS a scanned doc); the worker decides the
 * import_metadata.source ('ocr_extraction') based on which path it invoked.
 * onProgress fires after each page (OCR runs seconds-per-page — callers use it
 * to surface "sheet N of M" to the UI). Callback failures are swallowed —
 * progress reporting must never fail an extraction.
 */
export async function ocrPdfToText(buffer: Buffer, onProgress?: OcrProgressFn): Promise<PdfExtractResult> {
  // mupdf has no package.json subpath export; import the module namespace.
  const mupdf = await import('mupdf');
  const doc = mupdf.Document.openDocument(buffer, 'application/pdf');
  const totalPages = doc.countPages();
  const pageCount = Math.min(totalPages, MAX_PAGES);
  if (totalPages > pageCount) {
    console.warn({ totalPages, cap: pageCount }, 'ocr: page count over cap — truncating');
  }

  let creator: string | null = null;
  let title: string | null = null;
  try {
    creator = doc.getMetaData('info:Creator') || null;
    title = doc.getMetaData('info:Title') || null;
  } catch { /* metadata optional */ }

  const worker: Worker = await createWorker('eng', 1, {
    langPath: tessdataDir(),
    cachePath: tmpdir(),
    gzip: false,
  });

  const pages: ExtractedPage[] = [];
  try {
    for (let i = 0; i < pageCount; i++) {
      const page = doc.loadPage(i);
      const b = page.getBounds(); // [x0, y0, x1, y1] in points
      const widthPts = b[2] - b[0];
      const heightPts = b[3] - b[1];

      // Full page at high DPI via adaptive tiling (PSM_SPARSE set inside). Time-boxed so a
      // pathological sheet can't hang the worker — a timeout yields empty text for that page.
      let pageText = '';
      try {
        pageText = await withTimeout(ocrPageTiled(mupdf, page, worker), PAGE_TIMEOUT_MS, `ocr page ${i + 1}`);
      } catch (err) {
        console.warn({ page: i + 1, err: (err as Error).message }, 'ocr: page OCR failed/timed out — empty text');
      }

      // Second pass: high-DPI title-block corner so legend fields (ZIP/phone/firm) read right.
      let titleBlockText: string | undefined;
      try {
        const tbPng = renderTitleBlockPng(mupdf, page);
        await worker.setParameters({ tessedit_pageseg_mode: PSM_BLOCK as any });
        const tb = await worker.recognize(tbPng);
        titleBlockText = tb.data.text;
      } catch (err) {
        // Non-fatal: fall back to the full-page text for title-block extraction.
        console.warn({ page: i + 1, err: (err as Error).message }, 'ocr: title-block pass failed');
      }

      pages.push({
        page_number: i + 1,
        width_pts: widthPts,
        height_pts: heightPts,
        text: pageText,
        // OCR can't reliably read the title-block sheet number; downstream
        // detectContentDiscipline() infers discipline from page content.
        sheet_number: null,
        sheet_title: null,
        discipline: 'architectural',
        title_block_text: titleBlockText,
      });

      if (onProgress) {
        try {
          await onProgress(i + 1, pageCount);
        } catch (err) {
          console.warn({ page: i + 1, err: (err as Error).message }, 'ocr: progress callback failed');
        }
      }
    }
  } finally {
    await worker.terminate();
  }

  const pagesWithText = pages.filter((p) => p.text.length > 50).length;
  return {
    page_count: pageCount,
    pages,
    metadata: {
      creator, title,
      is_vector: false,  // scanned by definition (this is the OCR path)
      pages_with_text: pagesWithText,
      text_ratio: pageCount === 0 ? 0 : Math.round((pagesWithText / pageCount) * 100) / 100,
    },
  };
}
