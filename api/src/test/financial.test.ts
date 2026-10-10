// financial.test.ts — Invoice + change order CRUD integration tests
// Routes: POST /v1/invoices, GET /v1/invoices, PATCH /v1/invoices/:id
//         POST /v1/change-orders, PATCH /v1/change-orders/:id (approve/reject)
// Locked decisions: T-02 (amounts in cents), T-12 (optimistic locking), A-03

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { randomUUID } from 'node:crypto';
import Fastify from 'fastify';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { testPool } from './setup.js';
import { invoiceRoutes } from '../routes/v1/invoices.js';
import { changeOrderRoutes } from '../routes/v1/change-orders.js';
import { registerErrorHandler } from '../plugins/error-handler.js';
import type { JWTPayload } from '../middleware/auth.js';

// ─── Test fixtures ────────────────────────────────────────────────────────────

const tenantId = randomUUID();
const ownerId = randomUUID();
const projectId = randomUUID();
const tenantSlug = `financial-test-${tenantId.slice(0, 8)}`;
const ownerEmail = `fin-owner-${ownerId.slice(0, 8)}@example.com`;

// ─── Test app ─────────────────────────────────────────────────────────────────

const app = Fastify({ logger: false });

// ─── Token helper ─────────────────────────────────────────────────────────────

function makeToken(overrides: Partial<JWTPayload> = {}): string {
  return jwt.sign(
    {
      jti: randomUUID(),
      user_id: ownerId,
      tenant_id: tenantId,
      role: 'OWNER' as const,
      email: ownerEmail,
      preferred_language: 'en' as const,
      ...overrides,
    },
    process.env.JWT_SECRET ?? 'dev-secret-change-in-production',
    { expiresIn: 86400 }
  );
}

// ─── Setup / teardown ────────────────────────────────────────────────────────

beforeAll(async () => {
  registerErrorHandler(app);
  await app.register(invoiceRoutes, { prefix: '/v1' });
  await app.register(changeOrderRoutes, { prefix: '/v1' });
  await app.ready();

  await testPool.query(
    `INSERT INTO tenants (id, name, slug, tier, status)
     VALUES ($1, 'Financial Test Tenant', $2, 'professional', 'active')`,
    [tenantId, tenantSlug]
  );

  const pwHash = await bcrypt.hash('test-password-123', 10);
  await testPool.query(
    `INSERT INTO users (id, tenant_id, email, password_hash, first_name, last_name, role, status)
     VALUES ($1, $2, $3, $4, 'Test', 'Owner', 'owner', 'active')`,
    [ownerId, tenantId, ownerEmail, pwHash]
  );

  await testPool.query(
    `INSERT INTO projects (id, tenant_id, name, status) VALUES ($1, $2, 'Finance Project', 'active')`,
    [projectId, tenantId]
  );
});

afterAll(async () => {
  await app.close();
  await testPool.query(`DELETE FROM change_orders WHERE tenant_id = $1`, [tenantId]);
  await testPool.query(`DELETE FROM invoices WHERE tenant_id = $1`, [tenantId]);
  await testPool.query(`DELETE FROM projects WHERE id = $1`, [projectId]);
  await testPool.query(`DELETE FROM users WHERE id = $1`, [ownerId]);
  await testPool.query(`DELETE FROM tenants WHERE id = $1`, [tenantId]);
});

// ─── Invoice tests ────────────────────────────────────────────────────────────

describe('POST /v1/invoices', () => {
  it('creates an invoice with amount in cents (T-02)', async () => {
    const token = makeToken();
    const res = await app.inject({
      method: 'POST',
      url: '/v1/invoices',
      headers: { 'user-agent': 'test-runner/1.0', authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        project_id: projectId,
        amount_cents: 150000,   // $1,500.00 in cents (T-02)
        status: 'draft',
      }),
    });

    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.body);
    expect(body.invoice).toBeDefined();
    expect(body.invoice.amount_cents).toBe(150000);
    expect(body.invoice.status).toBe('draft');
    expect(body.invoice.tenant_id).toBe(tenantId);
  });

  it('returns 403 for FIELD_TECH (insufficient role)', async () => {
    const token = makeToken({ role: 'FIELD_TECH' });
    const res = await app.inject({
      method: 'POST',
      url: '/v1/invoices',
      headers: { 'user-agent': 'test-runner/1.0', authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ project_id: projectId, amount_cents: 10000 }),
    });
    expect(res.statusCode).toBe(403);
  });

  it('returns 422 for float amount (T-02 — integers only)', async () => {
    const token = makeToken();
    const res = await app.inject({
      method: 'POST',
      url: '/v1/invoices',
      headers: { 'user-agent': 'test-runner/1.0', authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ project_id: projectId, amount_cents: 15.99 }),
    });
    expect(res.statusCode).toBe(422);
  });
});

describe('GET /v1/invoices', () => {
  it('returns invoices for a project (RLS-filtered)', async () => {
    const token = makeToken();
    const res = await app.inject({
      method: 'GET',
      url: `/v1/invoices?project_id=${projectId}`,
      headers: { 'user-agent': 'test-runner/1.0', authorization: `Bearer ${token}` },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(Array.isArray(body.invoices)).toBe(true);
    // All returned invoices belong to this tenant
    for (const inv of body.invoices as Array<{ tenant_id: string }>) {
      expect(inv.tenant_id).toBe(tenantId);
    }
  });
});

describe('PATCH /v1/invoices/:id — optimistic locking (T-12)', () => {
  it('updates invoice status and bumps version', async () => {
    // Create an invoice
    const token = makeToken();
    const createRes = await app.inject({
      method: 'POST',
      url: '/v1/invoices',
      headers: { 'user-agent': 'test-runner/1.0', authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ project_id: projectId, amount_cents: 50000, status: 'draft' }),
    });
    const { invoice } = JSON.parse(createRes.body);

    // Update with correct version
    const updateRes = await app.inject({
      method: 'PATCH',
      url: `/v1/invoices/${invoice.id}`,
      headers: { 'user-agent': 'test-runner/1.0', authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ status: 'sent', version: invoice.version }),
    });
    expect(updateRes.statusCode).toBe(200);
    const updated = JSON.parse(updateRes.body).invoice;
    expect(updated.status).toBe('sent');
    expect(updated.version).toBe(invoice.version + 1);
  });

  it('returns 409 on version conflict (T-12)', async () => {
    // Create an invoice
    const token = makeToken();
    const createRes = await app.inject({
      method: 'POST',
      url: '/v1/invoices',
      headers: { 'user-agent': 'test-runner/1.0', authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ project_id: projectId, amount_cents: 25000, status: 'draft' }),
    });
    const { invoice } = JSON.parse(createRes.body);

    // Send stale version
    const conflictRes = await app.inject({
      method: 'PATCH',
      url: `/v1/invoices/${invoice.id}`,
      headers: { 'user-agent': 'test-runner/1.0', authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ status: 'paid', version: invoice.version - 1 }),
    });
    expect(conflictRes.statusCode).toBe(409);
    const body = JSON.parse(conflictRes.body);
    expect(body.error.code).toBe('VERSION_CONFLICT');
  });
});

// ─── Change order tests ───────────────────────────────────────────────────────

describe('POST /v1/change-orders', () => {
  it('creates a change order (201)', async () => {
    const token = makeToken();
    const res = await app.inject({
      method: 'POST',
      url: '/v1/change-orders',
      headers: { 'user-agent': 'test-runner/1.0', authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        project_id: projectId,
        title: 'Additional scope',
        amount_cents: 500000,
        status: 'pending',
      }),
    });

    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.body);
    expect(body.change_order).toBeDefined();
    expect(body.change_order.amount_cents).toBe(500000);
    expect(body.change_order.status).toBe('pending');
  });
});

describe('PATCH /v1/change-orders/:id — approve/reject status transitions', () => {
  it('approves a pending change order', async () => {
    const token = makeToken();

    // Create a pending CO
    const createRes = await app.inject({
      method: 'POST',
      url: '/v1/change-orders',
      headers: { 'user-agent': 'test-runner/1.0', authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ project_id: projectId, title: 'To Approve', amount_cents: 200000 }),
    });
    const co = JSON.parse(createRes.body).change_order;

    // Approve
    const approveRes = await app.inject({
      method: 'PATCH',
      url: `/v1/change-orders/${co.id}`,
      headers: { 'user-agent': 'test-runner/1.0', authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ status: 'approved', version: co.version }),
    });
    expect(approveRes.statusCode).toBe(200);
    expect(JSON.parse(approveRes.body).change_order.status).toBe('approved');
  });

  it('rejects a pending change order', async () => {
    const token = makeToken();

    const createRes = await app.inject({
      method: 'POST',
      url: '/v1/change-orders',
      headers: { 'user-agent': 'test-runner/1.0', authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ project_id: projectId, title: 'To Reject', amount_cents: 100000 }),
    });
    const co = JSON.parse(createRes.body).change_order;

    const rejectRes = await app.inject({
      method: 'PATCH',
      url: `/v1/change-orders/${co.id}`,
      headers: { 'user-agent': 'test-runner/1.0', authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ status: 'rejected', version: co.version }),
    });
    expect(rejectRes.statusCode).toBe(200);
    expect(JSON.parse(rejectRes.body).change_order.status).toBe('rejected');
  });

  it('returns 409 on stale version for change order (T-12)', async () => {
    const token = makeToken();

    const createRes = await app.inject({
      method: 'POST',
      url: '/v1/change-orders',
      headers: { 'user-agent': 'test-runner/1.0', authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ project_id: projectId, title: 'Conflict CO', amount_cents: 75000 }),
    });
    const co = JSON.parse(createRes.body).change_order;

    const conflictRes = await app.inject({
      method: 'PATCH',
      url: `/v1/change-orders/${co.id}`,
      headers: { 'user-agent': 'test-runner/1.0', authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ status: 'approved', version: 999 }),
    });
    expect(conflictRes.statusCode).toBe(409);
    expect(JSON.parse(conflictRes.body).error.code).toBe('VERSION_CONFLICT');
  });
});
