// design-studio.test.ts — Design Studio route chain (P2), real DB/RLS/Redis, providers + storage mocked.
//
//   contractor: offerings (module required) → invite → review → verify → estimate → decline
//   client:     magic-link exchange → trades/intake → upload (images only) → answers → AI guide/assess
//               (suggestions only, accept with server-recorded provenance) → render job → submit
//   security:   client DTOs carry no cost data · client A can't see client B · portal gate keeps the
//               client off /v1/files/upload and /v1/studio · other tenants can't see the request.

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { randomUUID } from 'node:crypto';
import Fastify from 'fastify';
import jwt from 'jsonwebtoken';

const sendJob = vi.fn().mockResolvedValue('job-id');
vi.mock('../lib/queue.js', () => ({ sendJob: (...a: unknown[]) => sendJob(...a) }));
const putLiveObject = vi.fn().mockResolvedValue(undefined);
vi.mock('../lib/storage.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/storage.js')>();
  return {
    ...actual,
    generateUploadUrl: vi.fn(async (t: string, f: string) => ({ uploadUrl: 'https://upload.example/put', quarantinePath: `${t}/q/${f}` })),
    generateDownloadUrl: vi.fn(async (p: string) => `https://signed.example/${p}`),
    downloadLiveObject: vi.fn(async () => Buffer.from([0xff, 0xd8, 0xff, 0xd9])),
    putLiveObject: (...a: unknown[]) => putLiveObject(...a),
  };
});

import { testPool } from './setup.js';
import { registerErrorHandler } from '../plugins/error-handler.js';
import { registerPortalGate } from '../middleware/portal-gate.js';
import { studioRoutes } from '../routes/v1/studio.js';
import { clientStudioRoutes } from '../routes/v1/client-studio.js';
import { fileRoutes } from '../routes/v1/files.js';
import { generateClientStudioMagicLinkToken } from '../lib/password-reset.js';
import { setMockLlmReply } from '../lib/studio/providers.js';
import { handleStudioRender } from '../workers/studio-worker.js';

const tenantId = randomUUID();
const otherTenantId = randomUUID();
const ownerId = randomUUID();
const otherOwnerId = randomUUID();
const app = Fastify({ logger: false });
const SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-in-production';

function headers(uid: string, role: string, tenant = tenantId) {
  const token = jwt.sign({ jti: randomUUID(), user_id: uid, tenant_id: tenant, role, email: `ds-${uid.slice(0, 8)}@ex.com`, preferred_language: 'en' }, SECRET, { expiresIn: 3600 });
  return { 'user-agent': 'test-runner/1.0', authorization: `Bearer ${token}` };
}
const owner = () => headers(ownerId, 'OWNER');
const call = (method: string, url: string, h: Record<string, string>, payload?: unknown) =>
  app.inject({ method: method as 'GET', url, headers: h, payload: payload as object | undefined });

let clientToken = '';
let clientId = '';
let requestId = '';
let scopeId = '';
let photoId = '';
const clientH = () => ({ 'user-agent': 'test-runner/1.0', authorization: `Bearer ${clientToken}` });
const C = '/v1/client-portal/studio';

beforeAll(async () => {
  process.env.STUDIO_IMAGE_PROVIDER = 'mock';
  process.env.STUDIO_LLM_PROVIDER = 'mock';
  registerErrorHandler(app);
  registerPortalGate(app);
  await app.register(studioRoutes, { prefix: '/v1' });
  await app.register(clientStudioRoutes, { prefix: '/v1' });
  await app.register(fileRoutes, { prefix: '/v1' });
  await app.ready();
  for (const [id, uid, name] of [[tenantId, ownerId, 'DS Concrete Co'], [otherTenantId, otherOwnerId, 'DS Other']]) {
    await testPool.query(`INSERT INTO tenants (id,name,slug,tier,status) VALUES ($1,$2,$3,'professional','active')`, [id, name, `ds-${id.slice(0, 8)}`]);
    await testPool.query(`INSERT INTO tenant_subscriptions (tenant_id,tier,status) VALUES ($1,'professional','active')`, [id]);
    await testPool.query(
      `INSERT INTO users (id,tenant_id,email,password_hash,first_name,last_name,role,status) VALUES ($1,$2,$3,'x','Olive','Owner','owner','active')`,
      [uid, id, `ds-${uid.slice(0, 8)}@ex.com`]);
  }
});

afterAll(async () => {
  await app.close();
  const ids = [tenantId, otherTenantId];
  await testPool.query(`UPDATE design_request_scopes SET selected_render_id = NULL WHERE tenant_id = ANY($1)`, [ids]);
  await testPool.query(`UPDATE design_requests SET estimate_id = NULL WHERE tenant_id = ANY($1)`, [ids]);
  for (const t of ['design_renders', 'ai_usage_events', 'design_request_scopes', 'design_requests', 'estimate_line_items', 'estimates',
    'tenant_trade_offerings', 'files', 'notifications', 'project_members', 'audit_log', 'tenant_storage_usage', 'users', 'tenant_subscriptions']) {
    await testPool.query(`DELETE FROM ${t} WHERE tenant_id = ANY($1)`, [ids]);
  }
  await testPool.query(`DELETE FROM tenants WHERE id = ANY($1)`, [ids]);
});

async function invite(email: string, extra: Record<string, unknown> = {}) {
  return call('POST', '/v1/studio/invites', owner(), { email, first_name: 'Carla', last_name: 'Client', ...extra });
}

async function exchange(uid: string): Promise<string> {
  const token = await generateClientStudioMagicLinkToken(uid, tenantId);
  const res = await call('POST', `${C}/auth/exchange`, { 'user-agent': 'test-runner/1.0' }, { token });
  expect(res.statusCode).toBe(200);
  return res.json().token;
}

async function scopeVersion() {
  const r = await call('GET', `${C}/requests/${requestId}`, clientH());
  return r.json().scopes[0].version as number;
}

describe('contractor: offerings', () => {
  it('rejects a trade without an intake module', async () => {
    expect((await call('PUT', '/v1/studio/offerings/painting', owner(), { enabled: true })).statusCode).toBe(400);
  });

  it('enables concrete_flatwork with pricing params', async () => {
    const res = await call('PUT', '/v1/studio/offerings/concrete_flatwork', owner(), { enabled: true, settings: { labor_rate_cents: 8000 } });
    expect(res.statusCode).toBe(200);
    expect(res.json().offering.settings.labor_rate_cents).toBe(8000);
    const trades = (await call('GET', '/v1/studio/trades', owner())).json().trades;
    expect(trades.find((t: { trade_key: string }) => t.trade_key === 'concrete_flatwork').offering.enabled).toBe(true);
  });

  it('only OWNER/PM/ESTIMATOR manage the studio', async () => {
    expect((await call('GET', '/v1/studio/trades', headers(ownerId, 'FIELD_TECH'))).statusCode).toBe(403);
  });
});

describe('contractor: invite', () => {
  it('invites a new client with a trade + starting point', async () => {
    const res = await invite('carla@client.example', { trade_key: 'concrete_flatwork', entry_point_id: 'flatwork_patio', title: 'Back patio', site: { state: 'WI', city: 'Madison' } });
    expect(res.statusCode).toBe(201);
    requestId = res.json().request.id;
    clientId = res.json().client.id;
    const { rows: [u] } = await testPool.query(`SELECT role, status FROM users WHERE id = $1`, [clientId]);
    expect(u).toEqual({ role: 'client_portal', status: 'invited' });
  });

  it('refuses a trade the contractor does not offer', async () => {
    expect((await invite('x@client.example', { trade_key: 'fencing' })).statusCode).toBe(422);
  });

  it('refuses an email that belongs to a team member', async () => {
    expect((await invite(`ds-${ownerId.slice(0, 8)}@ex.com`)).statusCode).toBe(409);
  });
});

describe('client: sign-in + intake', () => {
  it('exchanges a single-use magic link for a CLIENT_PORTAL token', async () => {
    const token = await generateClientStudioMagicLinkToken(clientId, tenantId);
    const res = await call('POST', `${C}/auth/exchange`, { 'user-agent': 'test-runner/1.0' }, { token });
    expect(res.statusCode).toBe(200);
    clientToken = res.json().token;
    expect((jwt.decode(clientToken) as { role: string }).role).toBe('CLIENT_PORTAL');
    expect((await call('POST', `${C}/auth/exchange`, { 'user-agent': 'test-runner/1.0' }, { token })).statusCode).toBe(401);
    const { rows: [u] } = await testPool.query(`SELECT status FROM users WHERE id = $1`, [clientId]);
    expect(u.status).toBe('active');
  });

  it('a link raced by two concurrent exchanges mints exactly one token', async () => {
    const token = await generateClientStudioMagicLinkToken(clientId, tenantId);
    const results = await Promise.all(Array.from({ length: 5 }, () =>
      call('POST', `${C}/auth/exchange`, { 'user-agent': 'test-runner/1.0' }, { token })));
    expect(results.map((r) => r.statusCode).sort()).toEqual([200, 401, 401, 401, 401]);
  });

  it('lists offered trades in Spanish', async () => {
    const res = await call('GET', `${C}/trades?lang=es`, clientH());
    expect(res.statusCode).toBe(200);
    const t = res.json().trades[0];
    expect(t.trade_key).toBe('concrete_flatwork');
    expect(t.entry_points.map((e: { label: string }) => e.label)).toContain('Patio de concreto nuevo');
  });

  it('serves localized steps with no prompt fragments, and the features available', async () => {
    const res = await call('GET', `${C}/trades/concrete_flatwork/intake`, clientH());
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.features).toEqual({ renders: true, ai_guide: true, photo_assess: true });
    expect(JSON.stringify(body)).not.toContain('broom-finished concrete');
    expect(body.common_steps.flatMap((s: { fields: { id: string }[] }) => s.fields.map((f) => f.id))).toContain('hoa');
    expect((await call('GET', `${C}/trades/fencing/intake`, clientH())).statusCode).toBe(404);
  });

  it('shows the invited request with the preset applied', async () => {
    const list = (await call('GET', `${C}/requests`, clientH())).json().requests;
    expect(list.map((r: { id: string }) => r.id)).toEqual([requestId]);
    const d = (await call('GET', `${C}/requests/${requestId}`, clientH())).json();
    scopeId = d.scopes[0].id;
    expect(d.scopes[0].values.purpose).toBe('patio');
    expect(d.scopes[0].range).toBeNull();
    expect(d.missing_common).toEqual(expect.arrayContaining(['property_type', 'ownership', 'hoa', 'timeline']));
  });
});

describe('client: photos + answers', () => {
  it('uploads photos through the studio namespace only (jpg/png)', async () => {
    const bad = await call('POST', `${C}/requests/${requestId}/scopes/${scopeId}/uploads`, clientH(), { filename: 'plan.pdf', content_type: 'application/pdf', file_size_bytes: 1000 });
    expect(bad.statusCode).toBe(422);
    const webp = await call('POST', `${C}/requests/${requestId}/scopes/${scopeId}/uploads`, clientH(), { filename: 'yard.webp', content_type: 'image/webp', file_size_bytes: 1000 });
    expect(webp.statusCode).toBe(422);
    const res = await call('POST', `${C}/requests/${requestId}/scopes/${scopeId}/uploads`, clientH(), { filename: 'yard.jpg', content_type: 'image/jpeg', file_size_bytes: 200_000 });
    expect(res.statusCode).toBe(200);
    photoId = res.json().file_id;
    expect(sendJob).toHaveBeenCalledWith('file.scan', tenantId, expect.objectContaining({ file_id: photoId }));
    // Simulate the scan worker promoting it.
    await testPool.query(`UPDATE files SET status = 'ready' WHERE id = $1`, [photoId]);
  });

  it('the portal gate keeps the client off the general upload and the contractor studio', async () => {
    expect((await call('POST', '/v1/files/upload', clientH(), { filename: 'a.jpg', content_type: 'image/jpeg', file_size_bytes: 10 })).statusCode).toBe(403);
    expect((await call('GET', '/v1/studio/requests', clientH())).statusCode).toBe(403);
  });

  it('saves answers, strips invalid ones, and returns a range with no cost detail', async () => {
    const res = await call('PATCH', `${C}/requests/${requestId}/scopes/${scopeId}`, clientH(), {
      version: await scopeVersion(),
      values: {
        area: { shape: 'rect', length_ft: 16, width_ft: 12 }, existing_surface: 'grass_dirt', slope: 'flat', truck_access: 'yes',
        finish: 'broom', color: 'natural_gray', site_photos: [photoId], stamp_pattern: 'cobblestone', bogus: 1,
      },
    });
    expect(res.statusCode).toBe(200);
    const { scope, dropped } = res.json();
    expect(dropped.sort()).toEqual(['bogus', 'stamp_pattern']);
    expect(scope.range.low_cents).toBeGreaterThan(0);
    expect(scope.range.high_cents).toBeGreaterThan(scope.range.low_cents);
    expect(scope.missing).toEqual([]);
    const json = JSON.stringify(res.json());
    for (const leak of ['material_cents', 'labor_cents', 'markup', 'total_cents', 'assembly_code', 'unit_cost']) expect(json).not.toContain(leak);
  });

  it("refuses a photo the client didn't upload", async () => {
    const { rows: [f] } = await testPool.query(
      `INSERT INTO files (tenant_id, filename, content_type, file_size_bytes, category, quarantine_path, storage_path, status, created_by)
       VALUES ($1,'x.jpg','image/jpeg',10,'image','q','p','ready',$2) RETURNING id`, [tenantId, ownerId]);
    const res = await call('PATCH', `${C}/requests/${requestId}/scopes/${scopeId}`, clientH(), { version: await scopeVersion(), values: { site_photos: [f.id] } });
    expect(res.statusCode).toBe(422);
  });

  it('rejects a stale version', async () => {
    expect((await call('PATCH', `${C}/requests/${requestId}/scopes/${scopeId}`, clientH(), { version: 1, values: {} })).statusCode).toBe(409);
  });
});

describe('client: AI guide (suggestions only)', () => {
  it('guide returns validated suggestions; accept applies them as ai_confirmed', async () => {
    setMockLlmReply({
      suggestions: [
        { field: 'finish', value: 'stamped', confidence: 0.8, reason_en: 'Popular for patios', reason_es: 'Popular para patios' },
        { field: 'thickness', value: '9', confidence: 0.9, reason_en: 'x', reason_es: 'x' }, // invalid option → stripped
      ],
      next_field: 'color',
    });
    const g = await call('POST', `${C}/requests/${requestId}/scopes/${scopeId}/ai/guide`, clientH(), { message: 'I want it to look fancy' });
    expect(g.statusCode).toBe(200);
    // finish already answered (broom) → guide never overwrites a human answer.
    expect(g.json().suggestions).toEqual([]);

    setMockLlmReply({ suggestions: [{ field: 'sealer', value: true, confidence: 0.7, reason_en: 'Protects it', reason_es: 'Lo protege' }] });
    const g2 = await call('POST', `${C}/requests/${requestId}/scopes/${scopeId}/ai/guide`, clientH(), { message: 'Should I seal it?' });
    expect(g2.json().suggestions.map((s: { field: string }) => s.field)).toEqual(['sealer']);
    const acc = await call('POST', `${C}/requests/${requestId}/scopes/${scopeId}/suggestions/accept`, clientH(), { fields: ['sealer'] });
    expect(acc.statusCode).toBe(200);
    expect(acc.json().scope.values.sealer).toBe(true);
    expect(acc.json().scope.provenance.sealer).toBe('ai_confirmed');
  });

  it('assess suggestions become photo_estimate (unverified) when accepted', async () => {
    // Unset slope so the assistant may fill it.
    await call('PATCH', `${C}/requests/${requestId}/scopes/${scopeId}`, clientH(), { version: await scopeVersion(), values: { slope: null } });
    setMockLlmReply({ suggestions: [{ field: 'slope', value: 'gentle', confidence: 0.6, reason_en: 'Visible fall', reason_es: 'Caída visible' }] });
    const a = await call('POST', `${C}/requests/${requestId}/scopes/${scopeId}/ai/assess`, clientH(), {});
    expect(a.statusCode).toBe(200);
    const acc = await call('POST', `${C}/requests/${requestId}/scopes/${scopeId}/suggestions/accept`, clientH(), { fields: ['slope'] });
    expect(acc.json().scope.provenance.slope).toBe('photo_estimate');
  });

  it('meters every AI call', async () => {
    const { rows } = await testPool.query(`SELECT feature, status FROM ai_usage_events WHERE tenant_id = $1 AND subject_id = $2`, [tenantId, scopeId]);
    expect(rows.filter((r) => r.feature === 'studio.guide')).toHaveLength(2);
    expect(rows.filter((r) => r.feature === 'studio.assess')).toHaveLength(1);
  });

  it('caps the assistant per user, so new scopes/requests do not reset it', async () => {
    const { rows: [n] } = await testPool.query(
      `SELECT COUNT(*)::int AS n FROM ai_usage_events WHERE user_id = $1 AND feature IN ('studio.assess','studio.guide')`, [clientId]);
    process.env.STUDIO_MAX_AI_CALLS_PER_USER_DAY = String(n.n);
    try {
      const res = await call('POST', `${C}/requests/${requestId}/scopes/${scopeId}/ai/guide`, clientH(), { message: 'help' });
      expect(res.statusCode).toBe(429);
      expect(res.json().error.code).toBe('USER_AI_CAP_REACHED');
    } finally {
      delete process.env.STUDIO_MAX_AI_CALLS_PER_USER_DAY;
    }
  });

  it('parallel assistant calls cannot overshoot a cap (in-flight reservations)', async () => {
    const { rows: [n] } = await testPool.query(
      `SELECT COUNT(*)::int AS n FROM ai_usage_events WHERE subject_id = $1 AND feature IN ('studio.assess','studio.guide')`, [scopeId]);
    process.env.STUDIO_MAX_AI_CALLS_PER_SCOPE = String(n.n + 1);
    try {
      const results = await Promise.all(Array.from({ length: 5 }, () =>
        call('POST', `${C}/requests/${requestId}/scopes/${scopeId}/ai/guide`, clientH(), { message: 'what finish?' })));
      expect(results.filter((r) => r.statusCode !== 429)).toHaveLength(1);
      const { rows: [after] } = await testPool.query(
        `SELECT COUNT(*)::int AS n FROM ai_usage_events WHERE subject_id = $1 AND feature IN ('studio.assess','studio.guide')`, [scopeId]);
      expect(after.n).toBe(n.n + 1);
    } finally {
      delete process.env.STUDIO_MAX_AI_CALLS_PER_SCOPE;
    }
  });

  it('ai_usage_events is append-only for the app role', async () => {
    const { rows: [e] } = await testPool.query(`SELECT id FROM ai_usage_events WHERE tenant_id = $1 LIMIT 1`, [tenantId]);
    const { testBouncePool } = await import('./setup.js');
    const c = await testBouncePool.connect();
    try {
      await c.query('BEGIN');
      await c.query(`SELECT set_config('app.current_tenant_id', $1, true)`, [tenantId]);
      const upd = await c.query(`UPDATE ai_usage_events SET cost_micro_usd = 0 WHERE id = $1`, [e.id]);
      const del = await c.query(`DELETE FROM ai_usage_events WHERE id = $1`, [e.id]);
      expect(upd.rowCount).toBe(0);
      expect(del.rowCount).toBe(0);
      await c.query('ROLLBACK');
    } finally {
      c.release();
    }
  });
});

describe('client: renders', () => {
  let renderId = '';
  it('queues a render, the worker produces it, the client sees it', async () => {
    const res = await call('POST', `${C}/requests/${requestId}/scopes/${scopeId}/renders`, clientH(), { photo_file_id: photoId });
    expect(res.statusCode).toBe(202);
    renderId = res.json().render.id;
    expect(sendJob).toHaveBeenCalledWith('studio.render', tenantId, { render_id: renderId });
    await handleStudioRender(tenantId, { render_id: renderId });
    await handleStudioRender(tenantId, { render_id: renderId }); // idempotent — second run is a no-op
    expect(putLiveObject).toHaveBeenCalledTimes(1);
    const { rows: [r] } = await testPool.query(`SELECT status, prompt, spec_snapshot FROM design_renders WHERE id = $1`, [renderId]);
    expect(r.status).toBe('succeeded');
    expect(r.prompt).toMatch(/concrete patio/);
    expect(r.spec_snapshot.values.finish).toBe('broom');
    const d = (await call('GET', `${C}/requests/${requestId}`, clientH())).json();
    expect(d.scopes[0].renders[0]).toMatchObject({ id: renderId, status: 'succeeded' });
    expect(d.scopes[0].renders[0].url).toContain('/live/studio/renders/');
  });

  it('selects a render', async () => {
    const res = await call('PUT', `${C}/requests/${requestId}/scopes/${scopeId}/selected-render`, clientH(), { render_id: renderId });
    expect(res.json().scope.selected_render_id).toBe(renderId);
  });

  it('parallel render requests cannot overshoot a cap (queued renders count)', async () => {
    const { rows: [n] } = await testPool.query(`SELECT COUNT(*)::int AS n FROM design_renders WHERE tenant_id = $1`, [tenantId]);
    process.env.STUDIO_MAX_RENDERS_PER_TENANT_MONTH = String(n.n + 1);
    try {
      const results = await Promise.all(Array.from({ length: 4 }, () =>
        call('POST', `${C}/requests/${requestId}/scopes/${scopeId}/renders`, clientH(), { photo_file_id: photoId })));
      expect(results.map((r) => r.statusCode).sort()).toEqual([202, 429, 429, 429]);
      expect(results.find((r) => r.statusCode === 429)!.json().error.code).toBe('TENANT_RENDER_CAP_REACHED');
    } finally {
      delete process.env.STUDIO_MAX_RENDERS_PER_TENANT_MONTH;
    }
  });

  it('enforces the per-scope render cap', async () => {
    process.env.STUDIO_MAX_RENDERS_PER_SCOPE = '1';
    try {
      const res = await call('POST', `${C}/requests/${requestId}/scopes/${scopeId}/renders`, clientH(), { photo_file_id: photoId });
      expect(res.statusCode).toBe(429);
    } finally {
      delete process.env.STUDIO_MAX_RENDERS_PER_SCOPE;
    }
  });
});

describe('client: submit', () => {
  it('refuses to submit with missing common answers', async () => {
    const r = (await call('GET', `${C}/requests/${requestId}`, clientH())).json().request;
    const res = await call('POST', `${C}/requests/${requestId}/submit`, clientH(), { version: r.version });
    expect(res.statusCode).toBe(422);
    expect(res.json().error.missing.request).toContain('timeline');
  });

  it('submits once complete: snapshots frozen, contractor notified, edits locked', async () => {
    let r = (await call('GET', `${C}/requests/${requestId}`, clientH())).json().request;
    const p = await call('PATCH', `${C}/requests/${requestId}`, clientH(), {
      version: r.version, common_values: { property_type: 'house', ownership: 'own', hoa: 'yes', timeline: '1_3_months' },
    });
    expect(p.statusCode).toBe(200);
    expect(p.json().missing_common).toEqual([]);
    r = p.json().request;
    const res = await call('POST', `${C}/requests/${requestId}/submit`, clientH(), { version: r.version });
    expect(res.statusCode).toBe(200);
    expect(res.json().request.status).toBe('submitted');
    expect(res.json().request.range.low_cents).toBeGreaterThan(0);
    const { rows: [s] } = await testPool.query(`SELECT status, quantities_snapshot, summary_snapshot FROM design_request_scopes WHERE id = $1`, [scopeId]);
    expect(s.status).toBe('submitted');
    expect(s.quantities_snapshot.length).toBeGreaterThan(0);
    const { rows: n } = await testPool.query(`SELECT 1 FROM notifications WHERE tenant_id = $1 AND user_id = $2`, [tenantId, ownerId]);
    expect(n.length).toBeGreaterThan(0);
    expect((await call('PATCH', `${C}/requests/${requestId}/scopes/${scopeId}`, clientH(), { version: await scopeVersion(), values: { color: 'tan' } })).statusCode).toBe(409);
    const d = (await call('GET', `${C}/requests/${requestId}`, clientH())).json();
    expect(d.scopes[0].requirements.map((x: { id: string }) => x.id)).toEqual(expect.arrayContaining(['call_811', 'hoa_approval', 'cure_time']));
  });
});

describe('isolation', () => {
  it("another client can't see this request", async () => {
    const res = await invite('dana@client.example');
    expect(res.statusCode).toBe(201);
    const otherToken = await exchange(res.json().client.id);
    const h = { 'user-agent': 'test-runner/1.0', authorization: `Bearer ${otherToken}` };
    expect((await call('GET', `${C}/requests/${requestId}`, h)).statusCode).toBe(404);
    expect((await call('GET', `${C}/requests`, h)).json().requests.map((r: { id: string }) => r.id)).not.toContain(requestId);
  });

  it("another tenant's contractor can't see it", async () => {
    expect((await call('GET', `/v1/studio/requests/${requestId}`, headers(otherOwnerId, 'OWNER', otherTenantId))).statusCode).toBe(404);
  });
});

describe('contractor: review → estimate', () => {
  it('sees pricing detail, provenance and the render prompt', async () => {
    const res = await call('GET', `/v1/studio/requests/${requestId}`, owner());
    expect(res.statusCode).toBe(200);
    const s = res.json().scopes[0];
    expect(s.pricing.lines.length).toBeGreaterThan(0);
    expect(s.pricing.range.unverified).toBe(true);
    expect(s.provenance.slope).toBe('photo_estimate');
    expect(s.render_prompts[0].prompt).toMatch(/patio/);
    const inbox = (await call('GET', '/v1/studio/requests?status=submitted', owner())).json().requests;
    expect(inbox.map((r: { id: string }) => r.id)).toContain(requestId);
  });

  it('verifying measurements + confirming the slope narrows the range and refreezes it', async () => {
    const before = (await call('GET', `/v1/studio/requests/${requestId}`, owner())).json();
    const s = before.scopes[0];
    const res = await call('PATCH', `/v1/studio/requests/${requestId}/scopes/${scopeId}`, owner(), {
      version: s.version, measurements_verified: true, values: { slope: 'gentle' },
    });
    expect(res.statusCode).toBe(200);
    const after = res.json().scope;
    expect(after.provenance.slope).toBe('contractor');
    expect(after.pricing.range.unverified).toBe(false);
    expect(after.pricing.range.band_pct).toBe(10);
    const { rows: [r] } = await testPool.query(`SELECT range_low_cents, range_high_cents FROM design_requests WHERE id = $1`, [requestId]);
    expect(r.range_high_cents - r.range_low_cents).toBeLessThan(before.request.range_high_cents - before.request.range_low_cents);
  });

  it("a contractor can't put an internal file into the client's photos, and the client DTO only links the client's own uploads", async () => {
    const { rows: [f] } = await testPool.query(
      `INSERT INTO files (tenant_id, filename, content_type, file_size_bytes, category, quarantine_path, storage_path, status, created_by)
       VALUES ($1,'payroll.pdf','application/pdf',10,'document','q/payroll.pdf',$2,'ready',$3) RETURNING id`,
      [tenantId, `${tenantId}/live/company/payroll.pdf`, ownerId]);
    const s = (await call('GET', `/v1/studio/requests/${requestId}`, owner())).json().scopes[0];
    const res = await call('PATCH', `/v1/studio/requests/${requestId}/scopes/${scopeId}`, owner(), {
      version: s.version, values: { site_photos: [photoId, f.id] },
    });
    expect(res.statusCode).toBe(422);
    expect(res.json().error.code).toBe('PHOTOS_CLIENT_ONLY');
    // Defense in depth: even if a spec names the file (bad data), no link for it reaches the client.
    await testPool.query(
      `UPDATE design_request_scopes SET spec = jsonb_set(spec, '{values,site_photos}', $2::jsonb) WHERE id = $1`,
      [scopeId, JSON.stringify([photoId, f.id])]);
    try {
      const d = (await call('GET', `${C}/requests/${requestId}`, clientH())).json();
      expect(d.scopes[0].photos.map((p: { id: string }) => p.id)).toEqual([photoId]);
    } finally {
      await testPool.query(
        `UPDATE design_request_scopes SET spec = jsonb_set(spec, '{values,site_photos}', $2::jsonb) WHERE id = $1`,
        [scopeId, JSON.stringify([photoId])]);
    }
  });

  it('creates a draft estimate from the request (once, even when double-clicked)', async () => {
    const both = await Promise.all([1, 2].map(() => call('POST', `/v1/studio/requests/${requestId}/estimate`, owner(), {})));
    expect(both.map((r) => r.statusCode).sort()).toEqual([201, 409]);
    const res = both.find((r) => r.statusCode === 201)!;
    const { rows: ests } = await testPool.query(`SELECT 1 FROM estimates WHERE notes LIKE $1`, [`%${requestId}%`]);
    expect(ests).toHaveLength(1);
    const { rows: [e] } = await testPool.query(`SELECT labor_rate_cents, total_cents FROM estimates WHERE id = $1`, [res.json().estimate_id]);
    expect(e.labor_rate_cents).toBe(8000);
    expect(e.total_cents).toBeGreaterThan(0);
    const { rows: lines } = await testPool.query(`SELECT assembly_code FROM estimate_line_items WHERE estimate_id = $1`, [res.json().estimate_id]);
    expect(lines.map((l) => l.assembly_code)).toEqual(expect.arrayContaining(['B-FLATWORK-SF', 'B-FLAT-SEAL-SF']));
    expect((await call('POST', `/v1/studio/requests/${requestId}/estimate`, owner(), {})).statusCode).toBe(409);
    const { rows: [r] } = await testPool.query(`SELECT status FROM design_requests WHERE id = $1`, [requestId]);
    expect(r.status).toBe('reviewed');
  });

  it('declines a request', async () => {
    const inv = await invite('erin@client.example', { trade_key: 'concrete_flatwork' });
    const id = inv.json().request.id;
    expect((await call('POST', `/v1/studio/requests/${id}/decline`, owner(), { reason: 'Out of area' })).statusCode).toBe(200);
    expect((await call('POST', `/v1/studio/requests/${id}/decline`, owner(), {})).statusCode).toBe(409);
  });
});

describe('P4: proposal response + convert to project', () => {
  let estimateId = '';
  const sendProposal = async (offsetSeconds = 0) => {
    // Stand-in for POST /estimates/:id/proposal (PDF render + storage are covered in estimate-proposal.test.ts).
    await testPool.query(
      `UPDATE estimates SET status = 'sent', proposal_path = $2, proposal_generated_at = NOW() + make_interval(secs => $3) WHERE id = $1`,
      [estimateId, `${tenantId}/live/estimates/proposals/${estimateId}.pdf`, offsetSeconds]);
  };

  it('no proposal until the contractor sends one', async () => {
    const { rows: [r] } = await testPool.query(`SELECT estimate_id FROM design_requests WHERE id = $1`, [requestId]);
    estimateId = r.estimate_id;
    expect((await call('GET', `${C}/requests/${requestId}`, clientH())).json().proposal).toBeNull();
    expect((await call('POST', `${C}/requests/${requestId}/proposal/respond`, clientH(), { response: 'accepted' })).statusCode).toBe(409);
  });

  it('client sees the sent proposal (offer total + PDF link only)', async () => {
    await sendProposal();
    const p = (await call('GET', `${C}/requests/${requestId}`, clientH())).json().proposal;
    expect(p.total_cents).toBeGreaterThan(0);
    expect(p.download_url).toContain('/live/estimates/proposals/');
    expect(p.response).toBeNull();
    expect(Object.keys(p).sort()).toEqual(['download_url', 'estimate_id', 'generated_at', 'note', 'responded_at', 'response', 'total_cents']);
  });

  it('changes need a note; answering twice is refused', async () => {
    expect((await call('POST', `${C}/requests/${requestId}/proposal/respond`, clientH(), { response: 'changes_requested' })).statusCode).toBe(422);
    const res = await call('POST', `${C}/requests/${requestId}/proposal/respond`, clientH(), { response: 'changes_requested', note: 'Can we use charcoal instead?' });
    expect(res.statusCode).toBe(200);
    expect(res.json().proposal).toMatchObject({ response: 'changes_requested', note: 'Can we use charcoal instead?' });
    expect((await call('POST', `${C}/requests/${requestId}/proposal/respond`, clientH(), { response: 'accepted' })).statusCode).toBe(409);
    const owner = (await call('GET', `/v1/studio/requests/${requestId}`, headers(ownerId, 'OWNER'))).json();
    expect(owner.proposal.response).toBe('changes_requested');
  });

  it('a re-sent proposal resets the answer; the client accepts it', async () => {
    await sendProposal(2);
    expect((await call('GET', `${C}/requests/${requestId}`, clientH())).json().proposal.response).toBeNull();
    const res = await call('POST', `${C}/requests/${requestId}/proposal/respond`, clientH(), { response: 'accepted' });
    expect(res.statusCode).toBe(200);
    const { rows: n } = await testPool.query(`SELECT 1 FROM notifications WHERE tenant_id = $1 AND user_id = $2 AND title = 'Proposal accepted'`, [tenantId, ownerId]);
    expect(n.length).toBe(1);
  });

  it('only OWNER/PM convert; conversion creates the project, links estimate + client', async () => {
    expect((await call('POST', `/v1/studio/requests/${requestId}/convert`, headers(ownerId, 'ESTIMATOR'), {})).statusCode).toBe(403);
    const both = await Promise.all([1, 2].map(() =>
      call('POST', `/v1/studio/requests/${requestId}/convert`, headers(ownerId, 'OWNER'), { name: 'Carla — back patio' })));
    expect(both.map((r) => r.statusCode).sort()).toEqual([201, 409]); // double-click → one project
    const res = both.find((r) => r.statusCode === 201)!;
    const { rows: projs } = await testPool.query(`SELECT 1 FROM projects WHERE tenant_id = $1 AND name = 'Carla — back patio'`, [tenantId]);
    expect(projs).toHaveLength(1);
    const projectId = res.json().project_id;
    expect(res.json().created).toBe(true);
    const { rows: [p] } = await testPool.query(`SELECT name, city, state FROM projects WHERE id = $1`, [projectId]);
    expect(p).toEqual({ name: 'Carla — back patio', city: 'Madison', state: 'WI' });
    const { rows: [e] } = await testPool.query(`SELECT project_id FROM estimates WHERE id = $1`, [estimateId]);
    expect(e.project_id).toBe(projectId);
    const { rows: m } = await testPool.query(`SELECT 1 FROM project_members WHERE project_id = $1 AND user_id = $2`, [projectId, clientId]);
    expect(m.length).toBe(1);
    const { rows: [r] } = await testPool.query(`SELECT status FROM design_requests WHERE id = $1`, [requestId]);
    expect(r.status).toBe('converted');
    expect((await call('POST', `/v1/studio/requests/${requestId}/convert`, headers(ownerId, 'OWNER'), {})).statusCode).toBe(409);
    await testPool.query(`UPDATE estimates SET project_id = NULL WHERE id = $1`, [estimateId]); // teardown order
    await testPool.query(`UPDATE design_requests SET project_id = NULL WHERE id = $1`, [requestId]);
    await testPool.query(`DELETE FROM project_members WHERE project_id = $1`, [projectId]);
    await testPool.query(`DELETE FROM projects WHERE id = $1`, [projectId]);
  });
});

describe('usage summary', () => {
  it('reports this month\'s AI usage + caps to the contractor only', async () => {
    const res = await call('GET', '/v1/studio/usage', headers(ownerId, 'OWNER'));
    expect(res.statusCode).toBe(200);
    const u = res.json();
    const byF = Object.fromEntries(u.features.map((f: { feature: string }) => [f.feature, f]));
    expect(byF['studio.guide'].total).toBeGreaterThanOrEqual(2);
    expect(byF['studio.render'].ok).toBeGreaterThanOrEqual(1);
    expect(u.caps.rendersPerScope).toBe(6);
    expect((await call('GET', '/v1/studio/usage', clientH())).statusCode).toBe(403);
  });
});

describe('self-serve new sign-in link', () => {
  const tokensFor = async (uid: string) => {
    const { redis } = await import('../lib/redis.js');
    const keys = await redis.keys('client_studio_magic:*');
    const vals = keys.length ? await redis.mget(...keys) : [];
    return vals.filter((v) => v?.startsWith(`${uid}:`)).length;
  };
  const resend = (email: string, slug: string) =>
    call('POST', `${C}/auth/resend`, { 'user-agent': 'test-runner/1.0' }, { email, tenant_slug: slug });

  it('issues a new link for a known client; answers 202 the same for anyone; throttles', async () => {
    const { redis } = await import('../lib/redis.js');
    const slug = `ds-${tenantId.slice(0, 8)}`;
    await redis.del(`client_studio_resend:${slug}:carla@client.example`);
    const before = await tokensFor(clientId);
    expect((await resend('Carla@Client.example', slug)).statusCode).toBe(202);
    expect(await tokensFor(clientId)).toBe(before + 1);
    expect((await resend('carla@client.example', slug)).statusCode).toBe(202); // throttled
    expect(await tokensFor(clientId)).toBe(before + 1);
    expect((await resend('nobody@client.example', slug)).statusCode).toBe(202);
    expect((await resend(`ds-${ownerId.slice(0, 8)}@ex.com`, slug)).statusCode).toBe(202); // staff email: no link
    expect((await resend('carla@client.example', 'no-such-tenant')).statusCode).toBe(202);
  });
});

describe('public studio endpoints require a User-Agent (T-11)', () => {
  it('exchange and resend reject a missing User-Agent', async () => {
    for (const url of [`${C}/auth/exchange`, `${C}/auth/resend`]) {
      const res = await app.inject({ method: 'POST', url, headers: { 'user-agent': '' }, payload: { token: 'x', email: 'a@b.co', tenant_slug: 'x' } });
      expect(res.statusCode).toBe(400);
      expect(res.json().error.code).toBe('MISSING_USER_AGENT');
    }
  });
});
