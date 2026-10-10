// estimate-proposal.test.ts — proposal PDF: pure renderer + route chain.
//   renderProposalPdf → %PDF buffer (with/without breakdown); POST /proposal generates + persists
//   proposal_path; send=true flips status→sent (SendGrid unset → graceful, no throw); GET /proposal
//   returns a fresh URL, 404 before generate; role gate (field_tech → 403). Storage mocked (no S3).

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { randomUUID } from 'node:crypto';
import Fastify from 'fastify';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

vi.mock('../lib/queue.js', () => ({
  sendJob: vi.fn().mockResolvedValue(undefined),
  getQueue: vi.fn(),
  stopQueue: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('../lib/storage.js', () => ({
  storageClient: { send: vi.fn().mockResolvedValue({}) },
  generateDownloadUrl: vi.fn().mockResolvedValue('https://signed.example/proposal.pdf'),
}));

import { testPool } from './setup.js';
import { estimateRoutes } from '../routes/v1/estimates.js';
import { registerErrorHandler } from '../plugins/error-handler.js';
import { renderProposalPdf, type RenderProposalInput } from '../lib/estimate-pdf.js';

const tenantId = randomUUID();
const ownerId = randomUUID();
const fieldId = randomUUID();
const projectId = randomUUID();
const slug = `prop-${tenantId.slice(0, 8)}`;

const app = Fastify({ logger: false });

function token(role: string, userId: string): string {
  return jwt.sign(
    { jti: randomUUID(), user_id: userId, tenant_id: tenantId, role, email: `${role}@prop.test`, preferred_language: 'en' },
    process.env.JWT_SECRET ?? 'dev-secret-change-in-production',
    { expiresIn: 86400 },
  );
}
const H = (t: string) => ({ 'user-agent': 'test-runner/1.0', authorization: `Bearer ${t}`, 'content-type': 'application/json' });

const fakeInput = (breakdown: boolean): RenderProposalInput => ({
  tenantName: 'Acme Electric',
  projectName: 'Lot 25 — 437 Maple St',
  estimate: {
    id: randomUUID(), name: 'Whole-house bid', trade: 'electrical', building_type: 'residential_sf', status: 'draft',
    material_cents: 2400000, labor_cents: 1000000, equipment_cents: 0, subtotal_cents: 3400000,
    markup_cents: 600000, total_cents: 4000000, overhead_pct: 10, profit_pct: 8, tax_pct: 5, contingency_pct: 3,
  },
  lineItems: [
    { description: 'Electrical rough-in (parametric $/SF)', trade: 'electrical', unit: 'SF', quantity: 2000,
      material_cents: 2400000, labor_cents: 1000000, equipment_cents: 0, extended_cents: 3400000,
      assumptions: ['Parametric $/SF basis — confirm against takeoff.', '200A service assumed.'] },
  ],
  includeCostBreakdown: breakdown,
  generatedOn: '2026-07-13',
});

describe('renderProposalPdf (pure)', () => {
  it('produces a %PDF buffer with cost breakdown', async () => {
    const buf = await renderProposalPdf(fakeInput(true));
    expect(Buffer.isBuffer(buf)).toBe(true);
    expect(buf.subarray(0, 5).toString()).toBe('%PDF-');
    expect(buf.length).toBeGreaterThan(1000);
  });
  it('produces a %PDF buffer without cost breakdown', async () => {
    const buf = await renderProposalPdf(fakeInput(false));
    expect(buf.subarray(0, 5).toString()).toBe('%PDF-');
    expect(buf.length).toBeGreaterThan(800);
  });
});

beforeAll(async () => {
  registerErrorHandler(app);
  await app.register(estimateRoutes, { prefix: '/v1' });
  await app.ready();

  await testPool.query(`INSERT INTO tenants (id,name,slug,tier,status) VALUES ($1,'Prop Tenant',$2,'professional','active')`, [tenantId, slug]);
  const pw = await bcrypt.hash('x', 10);
  await testPool.query(
    `INSERT INTO users (id,tenant_id,email,password_hash,first_name,last_name,role,status) VALUES
       ($1,$2,'owner@prop.test',$4,'O','W','owner','active'),
       ($3,$2,'field@prop.test',$4,'F','T','field_tech','active')`,
    [ownerId, tenantId, fieldId, pw],
  );
  await testPool.query(`INSERT INTO projects (id,tenant_id,name,status,state) VALUES ($1,$2,'Prop Project','active','WI')`, [projectId, tenantId]);
});

afterAll(async () => {
  await testPool.query(`DELETE FROM estimate_line_items WHERE tenant_id=$1`, [tenantId]);
  await testPool.query(`DELETE FROM estimates WHERE tenant_id=$1`, [tenantId]);
  await testPool.query(`DELETE FROM audit_log WHERE tenant_id=$1`, [tenantId]);
  await testPool.query(`DELETE FROM projects WHERE tenant_id=$1`, [tenantId]);
  await testPool.query(`DELETE FROM users WHERE tenant_id=$1`, [tenantId]);
  await testPool.query(`DELETE FROM tenants WHERE id=$1`, [tenantId]);
  await app.close();
});

let estimateId = '';

describe('proposal routes', () => {
  it('sets up a generated parametric estimate', async () => {
    const create = await app.inject({
      method: 'POST', url: '/v1/estimates', headers: H(token('OWNER', ownerId)),
      payload: { name: 'Proposal bid', project_id: projectId, mode: 'parametric', labor_rate_cents: 8500, overhead_pct: 10, profit_pct: 8, tax_pct: 5 },
    });
    estimateId = create.json().estimate.id;
    const gen = await app.inject({ method: 'POST', url: `/v1/estimates/${estimateId}/generate`, headers: H(token('OWNER', ownerId)), payload: { building_sf: 1500 } });
    expect(gen.statusCode).toBe(200);
    expect(gen.json().line_count).toBeGreaterThan(0);
  });

  it('GET /proposal before generation → 404 PROPOSAL_NOT_GENERATED', async () => {
    const res = await app.inject({ method: 'GET', url: `/v1/estimates/${estimateId}/proposal`, headers: H(token('OWNER', ownerId)) });
    expect(res.statusCode).toBe(404);
    expect(res.json().error.code).toBe('PROPOSAL_NOT_GENERATED');
  });

  it('role gate: field_tech cannot generate a proposal', async () => {
    const res = await app.inject({ method: 'POST', url: `/v1/estimates/${estimateId}/proposal`, headers: H(token('FIELD_TECH', fieldId)), payload: {} });
    expect(res.statusCode).toBe(403);
  });

  it('POST /proposal generates + persists proposal_path (no send)', async () => {
    const res = await app.inject({ method: 'POST', url: `/v1/estimates/${estimateId}/proposal`, headers: H(token('OWNER', ownerId)), payload: { include_cost_breakdown: true } });
    expect(res.statusCode).toBe(200);
    expect(res.json().download_url).toContain('signed.example');
    expect(res.json().sent).toBe(false);
    expect(res.json().estimate.proposal_path).toBe(`${tenantId}/live/estimates/proposals/${estimateId}.pdf`);
    expect(res.json().estimate.status).toBe('draft'); // no send → status unchanged
  });

  it('GET /proposal after generation → fresh download url', async () => {
    const res = await app.inject({ method: 'GET', url: `/v1/estimates/${estimateId}/proposal`, headers: H(token('OWNER', ownerId)) });
    expect(res.statusCode).toBe(200);
    expect(res.json().download_url).toContain('signed.example');
    expect(res.json().generated_at).toBeTruthy();
  });

  it('send=true requires a recipient (422)', async () => {
    const res = await app.inject({ method: 'POST', url: `/v1/estimates/${estimateId}/proposal`, headers: H(token('OWNER', ownerId)), payload: { send: true } });
    expect(res.statusCode).toBe(422);
    expect(res.json().error.code).toBe('RECIPIENT_REQUIRED');
  });

  it('send=true flips status→sent (SendGrid unset → graceful, no throw)', async () => {
    delete process.env.SENDGRID_API_KEY;
    const res = await app.inject({
      method: 'POST', url: `/v1/estimates/${estimateId}/proposal`, headers: H(token('OWNER', ownerId)),
      payload: { send: true, recipient_email: 'buyer@example.com', recipient_name: 'Jane Buyer' },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().estimate.status).toBe('sent');
    expect(res.json().sent).toBe(false); // no SendGrid key → email skipped, but status still advanced
  });
});
