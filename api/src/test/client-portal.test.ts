// client-portal.test.ts — CLIENT_PORTAL is confined to /v1/client-portal and sees only its own
// projects, with client-visible fields decided server-side.
//   GET /v1/client-portal/projects               — member projects only
//   GET /v1/client-portal/projects/:id           — milestones + show_in_client_portal tasks; non-member 403
//   GET /v1/client-portal/projects/:id/invoices  — no drafts, no cross-tenant (connection) invoices
//   general routes                               — the portal gate refuses them for a client token

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { randomUUID } from 'node:crypto';
import Fastify from 'fastify';
import jwt from 'jsonwebtoken';
import { testPool } from './setup.js';
import { clientPortalRoutes } from '../routes/v1/client-portal.js';
import { projectRoutes } from '../routes/v1/projects.js';
import { invoiceRoutes } from '../routes/v1/invoices.js';
import { registerErrorHandler } from '../plugins/error-handler.js';
import { registerPortalGate } from '../middleware/portal-gate.js';

const tenantId = randomUUID();
const otherTenantId = randomUUID();
const ownerId = randomUUID();
const clientId = randomUUID();
const projectA = randomUUID(); // client is a member
const projectB = randomUUID(); // client is NOT a member
const connectionId = randomUUID();
const app = Fastify({ logger: false });

function H(uid: string, role: string) {
  const token = jwt.sign(
    { jti: randomUUID(), user_id: uid, tenant_id: tenantId, role,
      email: `cp-${uid.slice(0, 8)}@ex.com`, preferred_language: 'en' },
    process.env.JWT_SECRET ?? 'dev-secret-change-in-production',
    { expiresIn: 3600 },
  );
  return { 'user-agent': 'test-runner/1.0', authorization: `Bearer ${token}` };
}
const get = (url: string, uid = clientId, role = 'CLIENT_PORTAL') =>
  app.inject({ method: 'GET', url, headers: H(uid, role) });

beforeAll(async () => {
  registerErrorHandler(app);
  registerPortalGate(app);
  await app.register(clientPortalRoutes, { prefix: '/v1' });
  await app.register(projectRoutes, { prefix: '/v1' });
  await app.register(invoiceRoutes, { prefix: '/v1' });
  await app.ready();

  for (const [id, name] of [[tenantId, 'CP Builder'], [otherTenantId, 'CP Other']]) {
    await testPool.query(`INSERT INTO tenants (id,name,slug,tier,status) VALUES ($1,$2,$3,'business','active')`,
      [id, name, `cp-${id.slice(0, 8)}`]);
  }
  for (const [id, role] of [[ownerId, 'owner'], [clientId, 'client_portal']]) {
    await testPool.query(
      `INSERT INTO users (id,tenant_id,email,password_hash,first_name,last_name,role,status)
       VALUES ($1,$2,$3,'x','C','P',$4,'active')`, [id, tenantId, `cp-${id.slice(0, 8)}@ex.com`, role]);
  }
  for (const [id, name] of [[projectA, 'Client House'], [projectB, 'Someone Else']]) {
    await testPool.query(`INSERT INTO projects (id,tenant_id,name,status) VALUES ($1,$2,$3,'active')`, [id, tenantId, name]);
  }
  await testPool.query(
    `INSERT INTO project_members (tenant_id,project_id,user_id,role) VALUES ($1,$2,$3,'client_portal')`,
    [tenantId, projectA, clientId]);

  for (const [pid, title, visible] of [
    [projectA, 'Framing complete', true], [projectA, 'Internal: fix rework', false], [projectB, 'B task', true],
  ] as const) {
    await testPool.query(
      `INSERT INTO schedule_tasks (tenant_id,project_id,title,description,status,show_in_client_portal)
       VALUES ($1,$2,$3,'internal notes','not_started',$4)`, [tenantId, pid, title, visible]);
  }
  await testPool.query(`INSERT INTO milestones (tenant_id,project_id,title) VALUES ($1,$2,'Close-in')`, [tenantId, projectA]);

  await testPool.query(
    `INSERT INTO tenant_connections (id,gc_tenant_id,sub_tenant_id,status) VALUES ($1,$2,$3,'active')`,
    [connectionId, otherTenantId, tenantId]);
  for (const [pid, cents, status, conn] of [
    [projectA, 100000, 'sent', null], [projectA, 200000, 'draft', null],
    [projectA, 300000, 'sent', connectionId], [projectB, 400000, 'sent', null],
  ] as const) {
    await testPool.query(
      `INSERT INTO invoices (tenant_id,project_id,amount_cents,status,connection_id,retainage_held_cents)
       VALUES ($1,$2,$3,$4,$5,5000)`, [tenantId, pid, cents, status, conn]);
  }
});

afterAll(async () => {
  await app.close();
  for (const t of ['invoices', 'milestones', 'schedule_tasks', 'project_members', 'projects', 'audit_log', 'users']) {
    await testPool.query(`DELETE FROM ${t} WHERE tenant_id=$1`, [tenantId]);
  }
  await testPool.query(`DELETE FROM tenant_connections WHERE id=$1`, [connectionId]);
  await testPool.query(`DELETE FROM tenants WHERE id = ANY($1)`, [[tenantId, otherTenantId]]);
});

describe('GET /v1/client-portal/projects', () => {
  it('lists only the projects the client is a member of', async () => {
    const res = await get('/v1/client-portal/projects');
    expect(res.statusCode).toBe(200);
    expect(res.json().projects.map((p: { id: string }) => p.id)).toEqual([projectA]);
  });

  it('refuses a non-client role (staff use the general routes)', async () => {
    expect((await get('/v1/client-portal/projects', ownerId, 'OWNER')).statusCode).toBe(403);
  });
});

describe('GET /v1/client-portal/projects/:id', () => {
  it('returns milestones and only client-visible tasks, with no internal fields', async () => {
    const res = await get(`/v1/client-portal/projects/${projectA}`);
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.project.name).toBe('Client House');
    expect(body.milestones.map((m: { title: string }) => m.title)).toEqual(['Close-in']);
    expect(body.tasks.map((t: { title: string }) => t.title)).toEqual(['Framing complete']);
    expect(body.tasks[0]).not.toHaveProperty('description');
  });

  it('403s a project the client is not on — without revealing it exists', async () => {
    const res = await get(`/v1/client-portal/projects/${projectB}`);
    expect(res.statusCode).toBe(403);
    expect((await get(`/v1/client-portal/projects/${randomUUID()}`)).statusCode).toBe(403);
    expect((await get('/v1/client-portal/projects/not-a-uuid')).statusCode).toBe(403);
  });
});

describe('GET /v1/client-portal/projects/:id/invoices', () => {
  it('hides drafts and cross-tenant invoices, and strips retainage', async () => {
    const res = await get(`/v1/client-portal/projects/${projectA}/invoices`);
    expect(res.statusCode).toBe(200);
    const { invoices } = res.json();
    expect(invoices.map((i: { amount_cents: number }) => i.amount_cents)).toEqual([100000]);
    expect(invoices[0]).not.toHaveProperty('retainage_held_cents');
  });

  it('403s another project', async () => {
    expect((await get(`/v1/client-portal/projects/${projectB}/invoices`)).statusCode).toBe(403);
  });
});

describe('general routes are closed to a client token', () => {
  it.each(['/v1/projects', `/v1/projects/${projectB}`, `/v1/invoices?project_id=${projectB}`])('%s → 403', async (url) => {
    expect((await get(url)).statusCode).toBe(403);
  });
});
