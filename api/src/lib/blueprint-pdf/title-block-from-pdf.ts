// blueprint-pdf/title-block-from-pdf.ts — extract a voted TitleBlockInfo straight from a PDF buffer.
//
// Same pipeline the analyze worker runs (extract → OCR fallback for scanned → parse → aggregate),
// reduced to just the title-block product. Used by the project-name backfill script so old
// analyses (whose stored import_metadata predates street/lot extraction) can be re-derived.

import { extractPdfText } from './extract.js';
import { ocrPdfToText, ocrYieldChars } from './ocr.js';
import { parseSheetText } from './parse-sheets.js';
import { aggregateExtractions } from './build-tasks.js';
import { EMPTY_TITLE_BLOCK, type TitleBlockInfo } from './title-block.js';

export async function titleBlockFromPdf(buffer: Buffer): Promise<TitleBlockInfo> {
  let extraction = await extractPdfText(buffer);

  // Scanned PDF (no text layer) → OCR, mirroring the worker's threshold.
  if (!extraction.metadata.is_vector) {
    const ocr = await ocrPdfToText(buffer);
    if (ocrYieldChars(ocr) >= 200) extraction = ocr;
  }

  if (extraction.pages.length === 0) return { ...EMPTY_TITLE_BLOCK };

  const perSheet = extraction.pages.map((p) =>
    parseSheetText(p.discipline, p.text, p.title_block_text),
  );
  return aggregateExtractions(perSheet).title_block;
}
