// studio-provider-spike.ts — P0 Design Studio image-provider comparison.
//
// Runs every photo in a folder through each configured image-edit provider with the SAME deterministic
// prompt the product would send (compiled from a concrete_flatwork fixture), then writes a side-by-side
// report to judge realism, whether the house/yard is kept intact, latency, failures and cost.
//
//   npx tsx --require dotenv/config src/scripts/studio-provider-spike.ts <photosDir> \
//       [--providers openai,gemini,comfyui,replicate] [--fixture 0|1|2] [--limit 10]
//
// Needs OPENAI_API_KEY / GEMINI_API_KEY / REPLICATE_API_TOKEN, or STUDIO_COMFYUI_URL for a local ComfyUI
// (raise STUDIO_IMAGE_TIMEOUT_MS to ~900000 — a local GTX 1070 render takes minutes). Photos: jpg/png. Metadata is stripped before upload,
// exactly like production. Output: <photosDir>/spike-<timestamp>/{index.html,results.json,*.png}.

import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, extname, basename } from 'node:path';
import { concreteFlatwork } from '../lib/intake/trades/concrete_flatwork.js';
import { compilePrompt, loadSpec } from '../lib/intake/index.js';
import { IMAGE_PROVIDERS } from '../lib/studio/providers.js';
import { stripImageMetadata } from '../lib/studio/image-meta.js';

const args = process.argv.slice(2);
const dir = args.find((a) => !a.startsWith('--'));
const opt = (k: string, d: string) => { const i = args.indexOf(`--${k}`); return i >= 0 && args[i + 1] ? args[i + 1]! : d; };
if (!dir) {
  console.error('usage: studio-provider-spike.ts <photosDir> [--providers openai,gemini] [--fixture 0|1|2] [--limit 10]');
  process.exit(1);
}

// Env each provider needs to be usable (comfyui = a reachable local server URL instead of a key).
const keyFor: Record<string, string> = {
  openai: 'OPENAI_API_KEY', gemini: 'GEMINI_API_KEY', replicate: 'REPLICATE_API_TOKEN', comfyui: 'STUDIO_COMFYUI_URL', mock: '',
};
const providers = opt('providers', 'openai,gemini').split(',').map((s) => s.trim())
  .filter((p) => IMAGE_PROVIDERS[p] && (!keyFor[p] || process.env[keyFor[p]!]));
if (!providers.length) {
  console.error('No usable providers — set OPENAI_API_KEY / GEMINI_API_KEY / REPLICATE_API_TOKEN / STUDIO_COMFYUI_URL (or pass --providers mock).');
  process.exit(1);
}

const fixture = concreteFlatwork.fixtures[Number(opt('fixture', '1'))] ?? concreteFlatwork.fixtures[0]!;
const { spec } = loadSpec(concreteFlatwork, { trade_key: concreteFlatwork.trade_key, intake_version: fixture.version, values: fixture.values });
const prompt = compilePrompt(concreteFlatwork, spec.values);
const photos = readdirSync(dir).filter((f) => /\.(jpe?g|png)$/i.test(f)).slice(0, Number(opt('limit', '10')));
if (!photos.length) { console.error(`No jpg/png photos in ${dir}`); process.exit(1); }

const out = join(dir, `spike-${new Date().toISOString().replace(/[:.]/g, '-')}`);
mkdirSync(out, { recursive: true });
console.log(`prompt (${fixture.name}):\n  ${prompt}\nproviders: ${providers.join(', ')} · photos: ${photos.length} → ${out}\n`);

interface Row { photo: string; provider: string; status: string; ms: number; cost_micro_usd: number; file?: string; error?: string; model?: string }
const rows: Row[] = [];

for (const photo of photos) {
  const raw = readFileSync(join(dir, photo));
  const contentType = extname(photo).toLowerCase() === '.png' ? 'image/png' : 'image/jpeg';
  const clean = stripImageMetadata(raw);
  writeFileSync(join(out, `orig-${basename(photo)}`), clean);
  for (const p of providers) {
    const t0 = Date.now();
    const r = await IMAGE_PROVIDERS[p]!.edit({ photo: clean, contentType, prompt });
    const ms = Date.now() - t0;
    const row: Row = { photo, provider: p, status: r.status, ms, cost_micro_usd: r.status === 'ok' ? r.costMicroUsd : 0, model: r.model };
    if (r.status === 'ok') {
      row.file = `${p}-${basename(photo, extname(photo))}.${r.contentType === 'image/jpeg' ? 'jpg' : 'png'}`;
      writeFileSync(join(out, row.file), r.image);
    } else row.error = r.status === 'blocked' ? `blocked: ${r.reason}` : r.error;
    rows.push(row);
    console.log(`${photo.padEnd(28)} ${p.padEnd(7)} ${r.status.padEnd(8)} ${(ms / 1000).toFixed(1)}s ${row.error ?? ''}`);
  }
}

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
const summary = providers.map((p) => {
  const r = rows.filter((x) => x.provider === p);
  const ok = r.filter((x) => x.status === 'ok');
  const avg = ok.length ? ok.reduce((a, x) => a + x.ms, 0) / ok.length / 1000 : 0;
  const cost = r.reduce((a, x) => a + x.cost_micro_usd, 0) / 1e6;
  return `<tr><td>${p}</td><td>${ok.length}/${r.length}</td><td>${avg.toFixed(1)}s</td><td>$${cost.toFixed(3)}</td><td>$${ok.length ? (cost / ok.length).toFixed(3) : '—'}</td></tr>`;
}).join('');
const grid = photos.map((ph) => `<tr><td><img src="orig-${esc(basename(ph))}"><div>${esc(ph)} (original)</div></td>${providers.map((p) => {
  const r = rows.find((x) => x.photo === ph && x.provider === p)!;
  return `<td>${r.file ? `<img src="${esc(r.file)}">` : `<div class="err">${esc(r.error ?? r.status)}</div>`}<div>${p} · ${(r.ms / 1000).toFixed(1)}s</div></td>`;
}).join('')}</tr>`).join('');
writeFileSync(join(out, 'index.html'), `<!doctype html><meta charset="utf-8"><title>Design Studio provider spike</title>
<style>body{font:14px system-ui;margin:24px}table{border-collapse:collapse}td,th{border:1px solid #ddd;padding:6px;vertical-align:top}
img{width:320px;display:block}.err{width:320px;height:200px;display:flex;align-items:center;justify-content:center;background:#fee;color:#900}</style>
<h1>Design Studio — image provider spike</h1><p><b>Prompt</b> (${esc(fixture.name)}): ${esc(prompt)}</p>
<h2>Summary</h2><table><tr><th>provider</th><th>ok</th><th>avg latency</th><th>total est. cost</th><th>per image</th></tr>${summary}</table>
<p>Judge each result: realistic? house/yard/background unchanged? did it put the work where it belongs?</p>
<h2>Side by side</h2><table><tr><th>original</th>${providers.map((p) => `<th>${p}</th>`).join('')}</tr>${grid}</table>`);
writeFileSync(join(out, 'results.json'), JSON.stringify({ prompt, fixture: fixture.name, rows }, null, 2));
console.log(`\nreport: ${join(out, 'index.html')}`);
