// security-hardening.test.ts — regressions for the 2026-09-27 gap-analysis security fixes.
//   isTenantLivePath                  — the one check every client-supplied storage path must pass
//   POST /v1/documents                — a foreign / non-live storage_path is refused (was: stored,
//                                       then presigned → cross-tenant file read)
//   GET  /v1/documents/:id/download   — a legacy row holding a foreign path is refused
//   POST /v1/sync/push                — projects + safety_certifications are pull-only (was: any
//                                       role could self-certify on equipment, bypassing T-57)

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { randomUUID } from 'node:crypto';
import Fastify from 'fastify';
import jwt from 'jsonwebtoken';

vi.mock('../lib/queue.js', () => ({ sendJob: vi.fn().mockResolvedValue(undefined) }));
vi.mock('../lib/storage.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/storage.js')>();
  return { ...actual, generateDownloadUrl: vi.fn(async (p: string) => `https://signed.example/${p}`) };
});

import { testPool } from './setup.js';
import { isTenantLivePath } from '../lib/storage.js';
import { documentRoutes } from '../routes/v1/documents.js';
import { syncRoutes } from '../routes/v1/sync.js';
import { registerErrorHandler } from '../plugins/error-handler.js';

const tenantId = randomUUID();
const otherTenantId = randomUUID();
const ownerId = randomUUID();
const techId = randomUUID();
const projectId = randomUUID();

const app = Fastify({ logger: false });

function H(uid: string, role: string) {
  const token = jwt.sign(
    { jti: randomUUID(), user_id: uid, tenant_id: tenantId, role,
      email: `sec-${uid.slice(0, 8)}@ex.com`, preferred_language: 'en' },
    process.env.JWT_SECRET ?? 'dev-secret-change-in-production',
    { expiresIn: 3600 },
  );
  return { 'user-agent': 'test-runner/1.0', authorization: `Bearer ${token}`, 'content-type': 'application/json' };
}

beforeAll(async () => {
  registerErrorHandler(app);
  await app.register(documentRoutes, { prefix: '/v1' });
  await app.register(syncRoutes, { prefix: '/v1' });
  await app.ready();
  await testPool.query(`INSERT INTO tenants (id,name,slug,tier,status) VALUES ($1,'Sec',$2,'professional','active')`,
    [tenantId, `sec-${tenantId.slice(0, 8)}`]);
  for (const [id, role] of [[ownerId, 'owner'], [techId, 'field_tech']]) {
    await testPool.query(
      `INSERT INTO users (id,tenant_id,email,password_hash,first_name,last_name,role,status)
       VALUES ($1,$2,$3,'x','S','T',$4,'active')`, [id, tenantId, `sec-${id.slice(0, 8)}@ex.com`, role]);
  }
  await testPool.query(`INSERT INTO projects (id,tenant_id,name,status) VALUES ($1,$2,'Sec Project','active')`, [projectId, tenantId]);
});

afterAll(async () => {
  await app.close();
  for (const t of ['audit_log', 'documents', 'safety_certifications', 'projects', 'users']) {
    await testPool.query(`DELETE FROM ${t} WHERE tenant_id=$1`, [tenantId]);
  }
  await testPool.query(`DELETE FROM tenants WHERE id=$1`, [tenantId]);
});

describe('isTenantLivePath', () => {
  it('accepts only keys under {tenant}/live/', () => {
    expect(isTenantLivePath(tenantId, `${tenantId}/live/projects/p/plans/a.pdf`)).toBe(true);
    expect(isTenantLivePath(tenantId, `${otherTenantId}/live/projects/p/plans/a.pdf`)).toBe(false);
    expect(isTenantLivePath(tenantId, `${tenantId}/abc/a.pdf`)).toBe(false); // quarantine-shaped
    expect(isTenantLivePath(tenantId, `${tenantId}/live/../x/a.pdf`)).toBe(false);
    expect(isTenantLivePath(tenantId, `${tenantId}/live//a.pdf`)).toBe(false);
    expect(isTenantLivePath(tenantId, '')).toBe(false);
    expect(isTenantLivePath(tenantId, null)).toBe(false);
  });
});

describe('documents — storage_path must belong to the caller', () => {
  const doc = (storage_path: string) =>
    JSON.stringify({ project_id: projectId, doc_type: 'plan', title: 'Plans', storage_path });

  it('refuses another tenant’s key', async () => {
    const res = await app.inject({ method: 'POST', url: '/v1/documents', headers: H(ownerId, 'OWNER'),
      payload: doc(`${otherTenantId}/live/projects/x/plans/secret.pdf`) });
    expect(res.statusCode).toBe(422);
    expect(res.json().error.code).toBe('INVALID_STORAGE_PATH');
  });

  it('accepts its own live key and presigns it', async () => {
    const path = `${tenantId}/live/projects/${projectId}/plans/a.pdf`;
    const res = await app.inject({ method: 'POST', url: '/v1/documents', headers: H(ownerId, 'OWNER'), payload: doc(path) });
    expect(res.statusCode).toBe(201);
    const dl = await app.inject({ method: 'GET', url: `/v1/documents/${res.json().document.id}/download`, headers: H(ownerId, 'OWNER') });
    expect(dl.statusCode).toBe(200);
    expect(dl.json().download_url).toContain(path);
  });

  it('refuses to presign a legacy row holding a foreign key', async () => {
    const id = randomUUID();
    await testPool.query(
      `INSERT INTO documents (id,tenant_id,project_id,doc_type,title,storage_path,status)
       VALUES ($1,$2,$3,'plan','Legacy',$4,'active')`,
      [id, tenantId, projectId, `${otherTenantId}/live/projects/x/plans/secret.pdf`]);
    const dl = await app.inject({ method: 'GET', url: `/v1/documents/${id}/download`, headers: H(ownerId, 'OWNER') });
    expect(dl.statusCode).toBe(403);
  });
});

describe('batch sync — projects + certifications are pull-only', () => {
  it('ignores a pushed certification (no self-certification)', async () => {
    const certId = randomUUID();
    const res = await app.inject({ method: 'POST', url: '/v1/sync/push', headers: H(techId, 'FIELD_TECH'),
      payload: JSON.stringify({ changes: { safety_certifications: { created: [
        { id: certId, user_id: techId, cert_type: 'forklift', document_path: `${otherTenantId}/live/x.pdf` },
      ], updated: [], deleted: [] } } }) });
    expect(res.statusCode).toBe(200);
    const { rows } = await testPool.query(`SELECT 1 FROM safety_certifications WHERE id=$1`, [certId]);
    expect(rows).toHaveLength(0);
  });

  it('ignores a pushed project (no tier-cap / role-gate bypass)', async () => {
    const id = randomUUID();
    const res = await app.inject({ method: 'POST', url: '/v1/sync/push', headers: H(techId, 'FIELD_TECH'),
      payload: JSON.stringify({ changes: { projects: { created: [{ id, name: 'Sneaky' }], updated: [], deleted: [] } } }) });
    expect(res.statusCode).toBe(200);
    const { rows } = await testPool.query(`SELECT 1 FROM projects WHERE id=$1`, [id]);
    expect(rows).toHaveLength(0);
  });
});

import { portalRequestAllowed } from '../middleware/portal-gate.js';

describe('portal gate — external tokens are confined', () => {
  it('passes non-portal roles and unauthenticated requests through', () => {
    expect(portalRequestAllowed(undefined, 'GET', '/v1/sync/pull')).toBe(true);
    expect(portalRequestAllowed('OWNER', 'POST', '/v1/sync/push')).toBe(true);
  });

  it('confines SUB_PORTAL to /v1/sub-portal', () => {
    expect(portalRequestAllowed('SUB_PORTAL', 'GET', '/v1/sub-portal/projects')).toBe(true);
    expect(portalRequestAllowed('SUB_PORTAL', 'GET', '/v1/projects')).toBe(false);
  });

  it('confines HOMEOWNER_PORTAL to the warranty namespace', () => {
    expect(portalRequestAllowed('HOMEOWNER_PORTAL', 'GET', '/v1/homeowner/warranties')).toBe(true);
    expect(portalRequestAllowed('HOMEOWNER_PORTAL', 'POST', '/v1/homeowner/warranties/x/claims')).toBe(true);
    for (const url of ['/v1/sync/pull', '/v1/invoices', '/v1/files/download?path=x', '/v1/pusher/auth', '/v1/projects']) {
      expect(portalRequestAllowed('HOMEOWNER_PORTAL', 'GET', url)).toBe(false);
    }
  });

  it('confines CLIENT_PORTAL to its own read-only namespace', () => {
    expect(portalRequestAllowed('CLIENT_PORTAL', 'GET', '/v1/client-portal/projects')).toBe(true);
    expect(portalRequestAllowed('CLIENT_PORTAL', 'GET', '/v1/client-portal/projects/abc/invoices')).toBe(true);
    expect(portalRequestAllowed('CLIENT_PORTAL', 'GET', '/v1/users/me')).toBe(true);
    expect(portalRequestAllowed('CLIENT_PORTAL', 'POST', '/v1/client-portal/projects')).toBe(false);
    expect(portalRequestAllowed('CLIENT_PORTAL', 'GET', '/v1/client-portalX')).toBe(false); // prefix, not substring
    // The tenant-wide general routes it used to reach (filtering lived in the web proxy).
    for (const url of ['/v1/projects?limit=20', '/v1/projects/abc', '/v1/invoices?project_id=abc',
      '/v1/milestones?project_id=abc', '/v1/schedule-tasks?project_id=abc', '/v1/sync/pull',
      '/v1/files/download', '/v1/contracts', '/v1/pusher/auth', '/v1/users']) {
      expect(portalRequestAllowed('CLIENT_PORTAL', 'GET', url)).toBe(false);
    }
  });

  it('lets every portal token log out', () => {
    expect(portalRequestAllowed('CLIENT_PORTAL', 'POST', '/v1/auth/logout')).toBe(true);
    expect(portalRequestAllowed('SUB_PORTAL', 'POST', '/v1/auth/logout')).toBe(true);
  });
});
