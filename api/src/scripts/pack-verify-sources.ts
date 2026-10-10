// pack-verify-sources.ts — HEAD/GET every SOURCES url and report. Never fails: government sites often
// answer 403 to scripts (bot protection) — a 403 means "check by hand", a 404 means "fix the url".
// Usage: npm run pack:verify-sources
import { SOURCES } from '../lib/trades/packs/sources.js';

const UA = 'Mozilla/5.0 (X11; Linux x86_64) JobsiteSourceCheck/1.0';
for (const [id, s] of Object.entries(SOURCES)) {
  let status = 'ERR';
  try {
    const r = await fetch(s.url, { method: 'GET', redirect: 'follow', headers: { 'user-agent': UA }, signal: AbortSignal.timeout(10_000) });
    status = String(r.status);
  } catch (e) { status = `ERR ${(e as Error).name}`; }
  const flag = status === '200' ? '✓' : status === '403' ? '?' : '✗';
  console.log(`${flag} ${status.padEnd(4)} ${id.padEnd(22)} ${s.url}`);
}
