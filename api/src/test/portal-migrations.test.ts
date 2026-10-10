// portal-migrations.test.ts — super-admin portal-user → own-tenant migration (T-46, T-47).
//   initiate → duplicate 409 → same-admin approve 403 → different-admin approve executes
//   (new uuid in target + source soft-deleted) → non-portal-user 422 → non-admin 403.

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { randomUUID } from 'node:crypto';
import Fastify, { type FastifyInstance } from 'fastify';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { testPool } from './setup.js';
import { portalMigrationRoutes } from '../routes/v1/portal-migrations.js';
import { registerErrorHandler } from '../plugins/error-handler.js';

const SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-in-production';
const UA = 'ConstructionPlatform-Test/1.0';

const sourceTenant = randomUUID();
const targetTenant = randomUUID();
const portalUser = randomUUID();
const ownerUser = randomUUID();
const targetOwner = randomUUID();
const srcProject = randomUUID();
const srcDocument = randomUUID();
const adminA = randomUUID();
const adminB = randomUUID();

let app: FastifyInstance;

function adminTok(adminId: string): string {
  return jwt.sign({ jti: randomUUID(), admin_id: adminId, role: 'SUPER_ADMIN', tenant_id: 'PLATFORM' }, SECRET, { expiresIn: 3600 });
}
function tenantTok(): string {
  return jwt.sign({ jti: randomUUID(), user_id: randomUUID(), tenant_id: randomUUID(), role: 'OWNER', email: 'o@x.test', preferred_language: 'en' }, SECRET, { expiresIn: 3600 });
}
const H = (t: string) => ({ 'user-agent': UA, authorization: `Bearer ${t}`, 'content-type': 'application/json' });

beforeAll(async () => {
  app = Fastify({ logger: false });
  registerErrorHandler(app);
  await app.register(portalMigrationRoutes, { prefix: '/v1' });
  await app.ready();

  await testPool.query(
    `INSERT INTO tenants (id,name,slug,tier,status) VALUES ($1,'Source GC',$3,'professional','active'),($2,'Target Sub',$4,'starter','active')`,
    [sourceTenant, targetTenant, `pm-src-${sourceTenant.slice(0, 8)}`, `pm-tgt-${targetTenant.slice(0, 8)}`],
  );
  const pw = await bcrypt.hash('x', 10);
  await testPool.query(
    `INSERT INTO users (id,tenant_id,email,password_hash,first_name,last_name,role,status) VALUES
       ($1,$3,'portal@ct.test',$5,'Portal','Sub','sub_portal','active'),
       ($2,$3,'owner@ct.test',$5,'Own','Er','owner','active'),
       ($4,$6,'towner@ct.test',$5,'Tgt','Own','owner','active')`,
    [portalUser, ownerUser, sourceTenant, targetOwner, pw, targetTenant],
  );
  // The sub is a member of one GC project that has one document — Phase 7 copies both.
  await testPool.query(
    `INSERT INTO projects (id,tenant_id,name,status,state) VALUES ($1,$2,'Shared Job','active','WI')`,
    [srcProject, sourceTenant],
  );
  await testPool.query(
    `INSERT INTO project_members (tenant_id,project_id,user_id,role) VALUES ($1,$2,$3,'sub_portal')`,
    [sourceTenant, srcProject, portalUser],
  );
  await testPool.query(
    `INSERT INTO documents (id,tenant_id,project_id,doc_type,title,storage_path,status) VALUES ($1,$2,$3,'plan','Site Plan','x/live/p','ready')`,
    [srcDocument, sourceTenant, srcProject],
  );
});

afterAll(async () => {
  const tenants = [sourceTenant, targetTenant];
  await testPool.query(`DELETE FROM audit_log WHERE tenant_id = 'PLATFORM' AND resource_type = 'portal_migration'`);
  await testPool.query(`DELETE FROM portal_migration_records WHERE source_tenant_id = $1`, [sourceTenant]);
  await testPool.query(`DELETE FROM portal_migrations WHERE source_tenant_id = $1`, [sourceTenant]);
  await testPool.query(`DELETE FROM notifications WHERE tenant_id = ANY($1)`, [tenants]);
  await testPool.query(`DELETE FROM documents WHERE tenant_id = ANY($1)`, [tenants]);
  await testPool.query(`DELETE FROM project_members WHERE tenant_id = ANY($1)`, [tenants]);
  await testPool.query(`DELETE FROM projects WHERE tenant_id = ANY($1)`, [tenants]);
  await testPool.query(`DELETE FROM users WHERE tenant_id = ANY($1)`, [tenants]);
  await testPool.query(`DELETE FROM tenants WHERE id = ANY($1)`, [tenants]);
  await app.close();
});

describe('portal migrations (T-46/T-47)', () => {
  let migrationId = '';

  it('rejects a non-super-admin (403)', async () => {
    const res = await app.inject({ method: 'GET', url: '/v1/admin/portal-migrations', headers: H(tenantTok()) });
    expect(res.statusCode).toBe(403);
  });

  it('rejects migrating a non-portal user (422)', async () => {
    const res = await app.inject({
      method: 'POST', url: '/v1/admin/portal-migrations', headers: H(adminTok(adminA)),
      payload: { user_id: ownerUser, source_tenant_id: sourceTenant, target_tenant_id: targetTenant },
    });
    expect(res.statusCode).toBe(422);
    expect(res.json().error.code).toBe('NOT_PORTAL_USER');
  });

  it('admin A initiates a migration (201 pending)', async () => {
    const res = await app.inject({
      method: 'POST', url: '/v1/admin/portal-migrations', headers: H(adminTok(adminA)),
      payload: { user_id: portalUser, source_tenant_id: sourceTenant, target_tenant_id: targetTenant, note: 'sub going independent' },
    });
    expect(res.statusCode).toBe(201);
    const m = res.json().migration;
    expect(m.status).toBe('pending');
    expect(m.initiated_by).toBe(adminA);
    migrationId = m.id;
  });

  it('rejects a duplicate active migration (409)', async () => {
    const res = await app.inject({
      method: 'POST', url: '/v1/admin/portal-migrations', headers: H(adminTok(adminA)),
      payload: { user_id: portalUser, source_tenant_id: sourceTenant, target_tenant_id: targetTenant },
    });
    expect(res.statusCode).toBe(409);
    expect(res.json().error.code).toBe('MIGRATION_EXISTS');
  });

  it('blocks the initiator from self-approving (403 SAME_ADMIN — T-47)', async () => {
    const res = await app.inject({ method: 'POST', url: `/v1/admin/portal-migrations/${migrationId}/approve`, headers: H(adminTok(adminA)), payload: {} });
    expect(res.statusCode).toBe(403);
    expect(res.json().error.code).toBe('SAME_ADMIN');
  });

  it('admin B approves → executes copy + soft-delete (T-46)', async () => {
    const res = await app.inject({ method: 'POST', url: `/v1/admin/portal-migrations/${migrationId}/approve`, headers: H(adminTok(adminB)), payload: {} });
    expect(res.statusCode).toBe(200);
    const m = res.json().migration;
    expect(m.status).toBe('complete');
    expect(m.approved_by).toBe(adminB);
    expect(m.new_user_id).toBeTruthy();
    expect(m.new_user_id).not.toBe(portalUser); // new uuid, never re-stamped

    // Original soft-deleted in source tenant
    const orig = await testPool.query(`SELECT deleted_at FROM users WHERE id = $1`, [portalUser]);
    expect(orig.rows[0].deleted_at).not.toBeNull();

    // Copy present in target tenant with a fresh id + same email + role
    const copy = await testPool.query(`SELECT tenant_id, email, role, deleted_at FROM users WHERE id = $1`, [m.new_user_id]);
    expect(copy.rows[0].tenant_id).toBe(targetTenant);
    expect(copy.rows[0].email).toBe('portal@ct.test');
    expect(copy.rows[0].role).toBe('sub_portal');
    expect(copy.rows[0].deleted_at).toBeNull();

    // Phase 7 — associated data copied
    expect(res.json().copied).toEqual({ projects: 1, documents: 1 });

    // Project copied into the target tenant with a NEW uuid (never the source id)
    const tgtProj = await testPool.query(`SELECT id FROM projects WHERE tenant_id = $1 AND name = 'Shared Job' AND deleted_at IS NULL`, [targetTenant]);
    expect(tgtProj.rows).toHaveLength(1);
    expect(tgtProj.rows[0].id).not.toBe(srcProject);
    const tgtPid = tgtProj.rows[0].id;

    // Document copied, FK-remapped to the copied project
    const tgtDoc = await testPool.query(`SELECT id, project_id FROM documents WHERE tenant_id = $1 AND title = 'Site Plan' AND deleted_at IS NULL`, [targetTenant]);
    expect(tgtDoc.rows).toHaveLength(1);
    expect(tgtDoc.rows[0].id).not.toBe(srcDocument);
    expect(tgtDoc.rows[0].project_id).toBe(tgtPid);

    // Chain-of-custody map (T-58) — one row per copied record
    const recs = await testPool.query(`SELECT source_table FROM portal_migration_records WHERE migration_id = $1 ORDER BY source_table`, [migrationId]);
    expect(recs.rows.map((r) => r.source_table)).toEqual(['documents', 'projects']);

    // The GC's original project is UNTOUCHED; only the sub's membership footprint is removed
    const srcStill = await testPool.query(`SELECT deleted_at FROM projects WHERE id = $1`, [srcProject]);
    expect(srcStill.rows[0].deleted_at).toBeNull();
    const pm = await testPool.query(`SELECT 1 FROM project_members WHERE user_id = $1`, [portalUser]);
    expect(pm.rows).toHaveLength(0);

    // Both tenants' owners notified (T-47 step 4)
    const notifs = await testPool.query(`SELECT tenant_id FROM notifications WHERE tenant_id = ANY($1) AND category = 'system'`, [[sourceTenant, targetTenant]]);
    expect(notifs.rows.length).toBeGreaterThanOrEqual(2);
  });

  it('re-approving a completed migration is rejected (409)', async () => {
    const res = await app.inject({ method: 'POST', url: `/v1/admin/portal-migrations/${migrationId}/approve`, headers: H(adminTok(adminB)), payload: {} });
    expect(res.statusCode).toBe(409);
  });
});
