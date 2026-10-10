// sub-portal.test.ts — Sub Portal invite funnel + scoped surface (P-04)
//   invite → magic-link accept (single-use) → scoped reads → RFI respond.
//   SECURITY: proves a sub_portal token cannot read another project OR any general/financial
//   route (the global containment gate) — the whole point of the phase.
// Locked decisions: P-04, A-15, T-12, T-44/45 boundary.

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

import { testPool } from './setup.js';
import { subPortalRoutes } from '../routes/v1/sub-portal.js';
import { projectRoutes } from '../routes/v1/projects.js';
import { invoiceRoutes } from '../routes/v1/invoices.js';
import { generateSubPortalMagicLinkToken } from '../lib/password-reset.js';
import { registerErrorHandler } from '../plugins/error-handler.js';
import { registerPortalGate } from '../middleware/portal-gate.js';

const gcTenant = randomUUID();
const gcOwner = randomUUID();
const gcField = randomUUID();
const projectA = randomUUID();
const projectB = randomUUID();

const app = Fastify({ logger: false });

function token(role: string, userId: string, tenantId: string): string {
  return jwt.sign(
    { jti: randomUUID(), user_id: userId, tenant_id: tenantId, role, email: `${role}@sp.test`, preferred_language: 'en' },
    process.env.JWT_SECRET ?? 'dev-secret-change-in-production',
    { expiresIn: 86400 },
  );
}
const H = (t: string) => ({ 'user-agent': 'test-runner/1.0', authorization: `Bearer ${t}`, 'content-type': 'application/json' });
const ownerTok = () => token('OWNER', gcOwner, gcTenant);
const fieldTok = () => token('FIELD_TECH', gcField, gcTenant);

beforeAll(async () => {
  registerErrorHandler(app);

  // The production containment gate (index.ts) — same function, not a copy.
  registerPortalGate(app);

  await app.register(subPortalRoutes, { prefix: '/v1' });
  await app.register(projectRoutes, { prefix: '/v1' });
  await app.register(invoiceRoutes, { prefix: '/v1' });
  await app.ready();

  await testPool.query(
    `INSERT INTO tenants (id,name,slug,tier,status) VALUES ($1,'GC Co',$2,'professional','active')`,
    [gcTenant, `gc-${gcTenant.slice(0, 8)}`],
  );
  const pw = await bcrypt.hash('x', 10);
  await testPool.query(
    `INSERT INTO users (id,tenant_id,email,password_hash,first_name,last_name,role,status) VALUES
       ($1,$2,'owner@sp.test',$5,'O','W','owner','active'),
       ($3,$4,'field@sp.test',$5,'F','T','field_tech','active')`,
    [gcOwner, gcTenant, gcField, gcTenant, pw],
  );
  await testPool.query(
    `INSERT INTO projects (id,tenant_id,name,status,state) VALUES ($1,$3,'Project A','active','WI'),($2,$3,'Project B','active','WI')`,
    [projectA, projectB, gcTenant],
  );
  await testPool.query(
    `INSERT INTO invoices (id,tenant_id,project_id,amount_cents,status) VALUES ($1,$2,$3,150000,'draft')`,
    [randomUUID(), gcTenant, projectA],
  );
});

afterAll(async () => {
  await testPool.query(`DELETE FROM audit_log WHERE tenant_id = $1`, [gcTenant]);
  await testPool.query(`DELETE FROM rfis WHERE tenant_id = $1`, [gcTenant]);
  await testPool.query(`DELETE FROM invoices WHERE tenant_id = $1`, [gcTenant]);
  await testPool.query(`DELETE FROM project_members WHERE tenant_id = $1`, [gcTenant]);
  await testPool.query(`DELETE FROM projects WHERE tenant_id = $1`, [gcTenant]);
  await testPool.query(`DELETE FROM users WHERE tenant_id = $1`, [gcTenant]);
  await testPool.query(`DELETE FROM tenants WHERE id = $1`, [gcTenant]);
  await app.close();
});

describe('Sub Portal — invite funnel', () => {
  let subUserId = '';
  let subToken = '';

  it('OWNER invites a sub → creates invited sub_portal user + project membership', async () => {
    const res = await app.inject({
      method: 'POST', url: '/v1/sub-portal/invite', headers: H(ownerTok()),
      payload: { email: 'sub@vendor.test', first_name: 'Sam', last_name: 'Sub', project_id: projectA },
    });
    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.user.role).toBe('sub_portal');
    expect(body.user.status).toBe('invited');
    subUserId = body.user.id;

    const pm = await testPool.query(`SELECT project_id, role FROM project_members WHERE user_id = $1`, [subUserId]);
    expect(pm.rows).toHaveLength(1);
    expect(pm.rows[0].project_id).toBe(projectA);
    expect(pm.rows[0].role).toBe('sub_portal');
  });

  it('non-OWNER/PM cannot invite (403)', async () => {
    const res = await app.inject({
      method: 'POST', url: '/v1/sub-portal/invite', headers: H(fieldTok()),
      payload: { email: 'x@vendor.test', first_name: 'X', last_name: 'Y', project_id: projectA },
    });
    expect(res.statusCode).toBe(403);
  });

  it('magic-link accept sets password, activates, returns a SUB_PORTAL JWT — single use', async () => {
    const magic = await generateSubPortalMagicLinkToken(subUserId, gcTenant);
    const res = await app.inject({
      method: 'POST', url: '/v1/sub-portal/auth/accept', headers: { 'user-agent': 't/1', 'content-type': 'application/json' },
      payload: { token: magic, password: 'sub-pass-123' },
    });
    expect(res.statusCode).toBe(200);
    subToken = res.json().token;
    expect(jwt.decode(subToken)).toMatchObject({ role: 'SUB_PORTAL', tenant_id: gcTenant, user_id: subUserId });

    const u = await testPool.query(`SELECT status FROM users WHERE id = $1`, [subUserId]);
    expect(u.rows[0].status).toBe('active');

    // Token is single-use — a replay fails.
    const replay = await app.inject({
      method: 'POST', url: '/v1/sub-portal/auth/accept', headers: { 'user-agent': 't/1', 'content-type': 'application/json' },
      payload: { token: magic, password: 'again-123' },
    });
    expect(replay.statusCode).toBe(401);
  });

  it('scoped: sub sees ONLY its member project', async () => {
    const res = await app.inject({ method: 'GET', url: '/v1/sub-portal/projects', headers: H(subToken) });
    expect(res.statusCode).toBe(200);
    const ids = res.json().projects.map((p: any) => p.id);
    expect(ids).toEqual([projectA]);
    expect(ids).not.toContain(projectB);
  });

  it('scoped: project detail bundle for a member project', async () => {
    const res = await app.inject({ method: 'GET', url: `/v1/sub-portal/projects/${projectA}`, headers: H(subToken) });
    expect(res.statusCode).toBe(200);
    const b = res.json();
    expect(b.project.id).toBe(projectA);
    expect(Array.isArray(b.tasks)).toBe(true);
    expect(Array.isArray(b.documents)).toBe(true);
    expect(Array.isArray(b.rfis)).toBe(true);
  });

  it('LEAK GUARD: sub cannot read a project it is not a member of (403)', async () => {
    const res = await app.inject({ method: 'GET', url: `/v1/sub-portal/projects/${projectB}`, headers: H(subToken) });
    expect(res.statusCode).toBe(403);
  });

  it('CONTAINMENT: sub_portal token is rejected on a general route (403)', async () => {
    const res = await app.inject({ method: 'GET', url: '/v1/projects', headers: H(subToken) });
    expect(res.statusCode).toBe(403);
  });

  it('CONTAINMENT: sub_portal token cannot read financials (403)', async () => {
    const res = await app.inject({ method: 'GET', url: `/v1/invoices?project_id=${projectA}`, headers: H(subToken) });
    expect(res.statusCode).toBe(403);
  });

  it('RFI respond: sub answers an RFI directed to it; 403 on one that is not', async () => {
    const mineId = randomUUID();
    const othersId = randomUUID();
    await testPool.query(
      `INSERT INTO rfis (id,tenant_id,project_id,number,subject,status,assignee_id) VALUES
         ($1,$3,$4,1,'To sub','open',$6),
         ($2,$3,$4,2,'To owner','open',$5)`,
      [mineId, othersId, gcTenant, projectA, gcOwner, subUserId],
    );

    const ok = await app.inject({ method: 'POST', url: `/v1/sub-portal/rfis/${mineId}/respond`, headers: H(subToken), payload: { note: 'Done' } });
    expect(ok.statusCode).toBe(200);
    expect(ok.json().rfi.status).toBe('answered');

    const denied = await app.inject({ method: 'POST', url: `/v1/sub-portal/rfis/${othersId}/respond`, headers: H(subToken), payload: {} });
    expect(denied.statusCode).toBe(403);
  });

  it('re-invite an existing sub to another project adds membership (idempotent funnel)', async () => {
    // Add the sub to projectB via a fresh invite → 201, membership B added, no dup user.
    const res = await app.inject({
      method: 'POST', url: '/v1/sub-portal/invite', headers: H(ownerTok()),
      payload: { email: 'sub@vendor.test', first_name: 'Sam', last_name: 'Sub', project_id: projectB },
    });
    expect(res.statusCode).toBe(201);
    expect(res.json().user.id).toBe(subUserId); // same user, not a duplicate
    const pm = await testPool.query(`SELECT project_id FROM project_members WHERE user_id = $1 ORDER BY project_id`, [subUserId]);
    expect(pm.rows.map((r) => r.project_id).sort()).toEqual([projectA, projectB].sort());
  });
});
