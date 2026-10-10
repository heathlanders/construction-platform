// scripts/smoke-vision.ts — manual smoke test of the local Ollama vision path.
// Renders one page of a PDF, calls the REAL Ollama server, prints the validated
// VisionSheetData + timing. No DB writes. Requires BLUEPRINT_VISION_ENABLED is NOT
// required here (this script bypasses the gate — it exists to test the server).
//
//   npx tsx --require dotenv/config src/scripts/smoke-vision.ts <pdf-path> [page=1]
//   e.g. npx tsx --require dotenv/config src/scripts/smoke-vision.ts test/fixtures/madison-lot25.pdf 1

import { readFileSync } from 'node:fs';
import {
  analyzeSheetPng,
  checkOllamaHealth,
  renderPageForVision,
  VISION_MAX_PX,
  VISION_PAGE_TIMEOUT_MS,
} from '../lib/blueprint-pdf/vision.js';

async function main(): Promise<void> {
  const [pdfPath, pageArg] = process.argv.slice(2);
  if (!pdfPath) {
    console.error('usage: npx tsx --require dotenv/config src/scripts/smoke-vision.ts <pdf-path> [page=1]');
    process.exit(1);
  }
  const pageNum = Math.max(1, Number(pageArg ?? 1));

  console.log(`ollama: ${process.env.OLLAMA_BASE_URL ?? 'http://127.0.0.1:11434'} model: ${process.env.OLLAMA_VISION_MODEL ?? 'qwen2.5vl:7b'}`);
  if (!(await checkOllamaHealth())) {
    console.error('ollama unreachable — is the server running? (systemctl status ollama)');
    process.exit(1);
  }
  console.log('ollama reachable ✓');

  const buffer = readFileSync(pdfPath);
  const mupdf = await import('mupdf');
  const doc = mupdf.Document.openDocument(buffer, 'application/pdf');
  const pageCount = doc.countPages();
  if (pageNum > pageCount) {
    console.error(`page ${pageNum} > page count ${pageCount}`);
    process.exit(1);
  }

  const page = doc.loadPage(pageNum - 1);
  const t0 = Date.now();
  const png = renderPageForVision(mupdf, page);
  console.log(`rendered page ${pageNum}/${pageCount} → ${Math.round(png.length / 1024)}KB PNG (max ${VISION_MAX_PX}px) in ${Date.now() - t0}ms`);

  console.log(`calling vision model (timeout ${VISION_PAGE_TIMEOUT_MS / 1000}s — a 7B VLM on an older GPU takes 1-3+ min)…`);
  const res = await analyzeSheetPng(png);
  if (!res) {
    console.error('vision analysis failed (see warn above) — check `ollama ps` / VRAM / model pulled');
    process.exit(1);
  }

  console.log(`\nmodel: ${res.model}  duration: ${(res.duration_ms / 1000).toFixed(1)}s  tokens_stripped: ${res.tokens_stripped}`);
  console.log(JSON.stringify(res.data, null, 2));
}

main().catch((err) => { console.error(err); process.exit(1); });
