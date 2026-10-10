// smoke-studio.ts — drive one Design Studio render through the REAL running stack, the way a client would.
//
//   contractor login → enable concrete_flatwork → invite client → magic link → client fills the patio
//   answers → uploads a photo (presigned PUT → file.scan) → asks for a render → studio.render job runs
//   on whatever STUDIO_IMAGE_PROVIDER the api container has → render shows in the client's request
//   and on the contractor's request page → ai_usage_events row written.
//
// Dev/owner tool, not a test: needs the docker stack up and the e2e tenant seeded
// (`npx tsx --require dotenv/config src/scripts/seed-e2e-tenant.ts`). The magic-link token is read from
// the platform_redis container (the invite email can't be opened from here).
//
//   npx tsx --require dotenv/config src/scripts/smoke-studio.ts <photo.jpg> [--api http://127.0.0.1:13000]
//       [--placement beside_building] [--timeout-min 30]

import { execFileSync } from 'node:child_process';
import { readFileSync, statSync, writeFileSync } from 'node:fs';
import { basename, extname } from 'node:path';

const args = process.argv.slice(2);
const opt = (k: string, d: string) => { const i = args.indexOf(`--${k}`); return i >= 0 ? args[i + 1]! : d; };
const photo = args.find((a) => !a.startsWith('--') && !args[args.indexOf(a) - 1]?.startsWith('--'));
if (!photo) { console.error('usage: smoke-studio.ts <photo.jpg|png> [--api URL] [--placement KEY] [--timeout-min N]'); process.exit(2); }

const API = opt('api', 'http://127.0.0.1:13000').replace(/\/$/, '');
const TIMEOUT_MS = Number(opt('timeout-min', '30')) * 60_000;
const UA = { 'user-agent': 'smoke-studio/1.0' };
const t0 = Date.now();
const log = (m: string) => console.log(`[${((Date.now() - t0) / 1000).toFixed(0).padStart(4)}s] ${m}`);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function call<T = Record<string, unknown>>(method: string, path: string, token: string | null, body?: unknown): Promise<T> {
  const res = await fetch(`${API}/v1${path}`, {
    method,
    headers: { ...UA, ...(token ? { authorization: `Bearer ${token}` } : {}), ...(body !== undefined ? { 'content-type': 'application/json' } : {}) },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status} ${text.slice(0, 300)}`);
  return (text ? JSON.parse(text) : {}) as T;
}

function magicTokenFor(userId: string): string {
  const keys = execFileSync('docker', ['exec', 'platform_redis', 'redis-cli', '--scan', '--pattern', 'client_studio_magic:*'], { encoding: 'utf8' })
    .split('\n').filter(Boolean);
  for (const k of keys) {
    const v = execFileSync('docker', ['exec', 'platform_redis', 'redis-cli', 'GET', k], { encoding: 'utf8' }).trim();
    if (v.startsWith(`${userId}:`)) return k.slice('client_studio_magic:'.length);
  }
  throw new Error(`no magic-link token in redis for client ${userId}`);
}

function usageRows(renderId: string): string {
  return execFileSync('docker', ['exec', 'platform_postgres', 'psql', '-U', 'postgres',
    '-d', 'platform_dev', '-At', '-c',
    `SELECT feature||' '||provider||' '||model||' '||status||' '||cost_micro_usd FROM ai_usage_events WHERE subject_id = '${renderId}'`],
  { encoding: 'utf8' }).trim();
}

async function main() {
  const bytes = readFileSync(photo!);
  const contentType = extname(photo!).toLowerCase() === '.png' ? 'image/png' : 'image/jpeg';

  // 1. Contractor (e2e tenant owner) signs in and offers flatwork.
  const owner = await call<{ token: string }>('POST', '/auth/login', null,
    { email: 'owner@e2e.thejobsite.test', password: process.env.E2E_PASSWORD, tenant_slug: 'e2e-test', platform: 'web' });
  await call('PUT', '/studio/offerings/concrete_flatwork', owner.token, { enabled: true });
  const email = `smoke-${Date.now()}@client.example`;
  const inv = await call<{ request: { id: string }; client: { id: string } }>('POST', '/studio/invites', owner.token,
    { email, first_name: 'Smoke', last_name: 'Client', trade_key: 'concrete_flatwork', entry_point_id: 'flatwork_patio',
      title: 'Smoke — back patio', site: { state: 'WI', city: 'Madison' } });
  const requestId = inv.request.id;
  log(`contractor invited ${email} → request ${requestId}`);

  // 2. Client opens the magic link.
  const client = (await call<{ token: string }>('POST', '/client-portal/studio/auth/exchange', null, { token: magicTokenFor(inv.client.id) })).token;
  const C = `/client-portal/studio/requests/${requestId}`;
  type Detail = { scopes: { id: string; version: number; photos?: { id: string; status: string }[];
    renders: { id: string; status: string; url: string | null; error?: string | null }[] }[] };
  let detail = await call<Detail>('GET', C, client);
  const scopeId = detail.scopes[0]!.id;
  log(`client signed in, scope ${scopeId}`);

  // 3. Photo: presigned PUT → scan.
  const up = await call<{ file_id: string; upload_url: string }>('POST', `${C}/scopes/${scopeId}/uploads`, client,
    { filename: basename(photo!), content_type: contentType, file_size_bytes: statSync(photo!).size });
  const put = await fetch(up.upload_url, { method: 'PUT', headers: { 'content-type': contentType }, body: bytes });
  if (!put.ok) throw new Error(`photo PUT → ${put.status}`);
  log(`photo uploaded (${up.file_id}), waiting for the scan`);

  // 4. Answers (incl. the photo) — retried until the scan marks the photo ready.
  const values = {
    area: { shape: 'rect', length_ft: 16, width_ft: 12 }, placement: opt('placement', 'beside_building'),
    existing_surface: 'grass_dirt', slope: 'flat', truck_access: 'yes', finish: 'broom', color: 'natural_gray',
    site_photos: [up.file_id],
  };
  for (let i = 0; ; i++) {
    detail = await call<Detail>('GET', C, client);
    try {
      await call('PATCH', `${C}/scopes/${scopeId}`, client, { version: detail.scopes[0]!.version, values });
      break;
    } catch (e) {
      if (i > 60) throw e;
      await sleep(3000);
    }
  }
  log('answers saved');

  // 5. Render.
  // The answers save before the virus scan clears the photo; a render needs it cleared (409 PHOTO_NOT_READY).
  let r: { render: { id: string } };
  for (let i = 0; ; i++) {
    try { r = await call<{ render: { id: string } }>('POST', `${C}/scopes/${scopeId}/renders`, client, { photo_file_id: up.file_id }); break; }
    catch (e) {
      if (!String(e).includes('PHOTO_NOT_READY') || i > 60) throw e;
      if (i === 0) log('photo still being scanned…');
      await sleep(3000);
    }
  }
  const renderId = r.render.id;
  log(`render ${renderId} queued`);
  let last = '';
  for (;;) {
    if (Date.now() - t0 > TIMEOUT_MS) throw new Error('timed out waiting for the render');
    detail = await call<Detail>('GET', C, client);
    const rr = detail.scopes[0]!.renders.find((x) => x.id === renderId);
    if (rr && rr.status !== last) { last = rr.status; log(`render ${rr.status}${rr.error ? ` (${rr.error})` : ''}`); }
    if (rr && ['succeeded', 'failed', 'blocked'].includes(rr.status)) {
      if (rr.status !== 'succeeded') throw new Error(`render ${rr.status}`);
      const img = await fetch(rr.url!.replace(/^https?:\/\/[^/]+/, process.env.SMOKE_STORAGE_ORIGIN ?? 'http://localhost:19000'));
      const out = `/tmp/smoke-studio-${renderId}.png`;
      writeFileSync(out, Buffer.from(await img.arrayBuffer()));
      log(`client gallery shows it → saved ${out}`);
      break;
    }
    await sleep(10_000);
  }

  // 6. Contractor sees it; metering row exists.
  const cd = await call<{ scopes: { renders: { id: string; status: string; prompt?: string }[] }[] }>('GET', `/studio/requests/${requestId}`, owner.token);
  const cr = cd.scopes[0]!.renders.find((x) => x.id === renderId);
  log(`contractor request page: render ${cr?.status}`);
  if (cr?.prompt) log(`prompt: ${cr.prompt}`);
  log(`ai_usage_events: ${usageRows(renderId) || '(none!)'}`);
}

main().catch((e) => { console.error(`FAILED: ${(e as Error).message}`); process.exit(1); });
