// map-layers.test.ts — Doc 20 Phase 5 layer endpoints.
//   GET /v1/assets/map — asset positions from active project assignments (Business+ gate, T-56).
//   GET /v1/crew/map — degraded crew layer: projects with open punches + counts.

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { randomUUID } from 'node:crypto';
import Fastify from 'fastify';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import { testPool } from './setup.js';
import { mapLayerRoutes } from '../routes/v1/map-layers.js';
import { registerErrorHandler } from '../plugins/error-handler.js';

const bizTenant = randomUUID();
const starterTenant = randomUUID();
const bizOwner = randomUUID();
const starterOwner = randomUUID();
const workerId = randomUUID();
const projectId = randomUUID();
const assetId = randomUUID();

const app = Fastify({ logger: false });

function token(tenantId: string, userId: string): string {
  return jwt.sign(
    { jti: randomUUID(), user_id: userId, tenant_id: tenantId, role: 'OWNER', email: 'o@ml.test', preferred_language: 'en' },
    process.env.JWT_SECRET ?? 'dev-secret-change-in-production',
    { expiresIn: 86400 }
  );
}
const H = (tenantId: string, userId: string) => ({ 'user-agent': 'test-runner/1.0', authorization: `Bearer ${token(tenantId, userId)}` });

beforeAll(async () => {
  registerErrorHandler(app);
  await app.register(mapLayerRoutes, { prefix: '/v1' });
  await app.ready();

  const pw = await bcrypt.hash('x', 10);
  await testPool.query(
    `INSERT INTO tenants (id, name, slug, tier, status)
     VALUES ($1,'ML Biz','ml-biz-${bizTenant.slice(0, 8)}','business','active'),
            ($2,'ML Starter','ml-st-${starterTenant.slice(0, 8)}','starter','active')`,
    [bizTenant, starterTenant]
  );
  await testPool.query(
    `INSERT INTO users (id, tenant_id, email, password_hash, first_name, last_name, role, status)
     VALUES ($1,$2,'o@mlbiz.test',$5,'O','Biz','owner','active'),
            ($3,$2,'w@mlbiz.test',$5,'W','Worker','field_tech','active'),
            ($4,$6,'o@mlst.test',$5,'O','Starter','owner','active')`,
    [bizOwner, bizTenant, workerId, starterOwner, pw, starterTenant]
  );
  await testPool.query(
    `INSERT INTO projects (id, tenant_id, name, status, state, latitude, longitude, geocode_status)
     VALUES ($1,$2,'ML Site','active','WI',43.0731,-89.4012,'exact')`,
    [projectId, bizTenant]
  );
  await testPool.query(
    `INSERT INTO company_assets (id, tenant_id, asset_number, name, asset_category, ownership_type, status, created_by)
     VALUES ($1,$2,'AST-0001','Excavator','heavy_equipment','owned','active',$3)`,
    [assetId, bizTenant, bizOwner]
  );
  await testPool.query(
    `INSERT INTO asset_project_assignments (tenant_id, asset_id, project_id, assigned_by)
     VALUES ($1,$2,$3,$4)`,
    [bizTenant, assetId, projectId, bizOwner]
  );
  await testPool.query(
    `INSERT INTO time_punches (tenant_id, user_id, project_id, clock_in_at, created_by)
     VALUES ($1,$2,$3,NOW(),$2)`,
    [bizTenant, workerId, projectId]
  );
});

afterAll(async () => {
  await app.close();
  for (const tid of [bizTenant, starterTenant]) {
    await testPool.query(`DELETE FROM time_punches WHERE tenant_id = $1`, [tid]);
    await testPool.query(`DELETE FROM asset_project_assignments WHERE tenant_id = $1`, [tid]);
    await testPool.query(`DELETE FROM company_assets WHERE tenant_id = $1`, [tid]);
    await testPool.query(`DELETE FROM projects WHERE tenant_id = $1`, [tid]);
    await testPool.query(`DELETE FROM users WHERE tenant_id = $1`, [tid]);
    await testPool.query(`DELETE FROM tenants WHERE id = $1`, [tid]);
  }
});

describe('GET /v1/assets/map', () => {
  it('returns actively-assigned assets at their project coords (Business+)', async () => {
    const res = await app.inject({ method: 'GET', url: '/v1/assets/map', headers: H(bizTenant, bizOwner) });
    expect(res.statusCode).toBe(200);
    const { assets } = res.json();
    expect(assets).toHaveLength(1);
    expect(assets[0]).toMatchObject({
      asset_number: 'AST-0001', project_id: projectId, latitude: 43.0731, longitude: -89.4012,
    });
  });

  it('402s for a Starter tenant (T-56)', async () => {
    const res = await app.inject({ method: 'GET', url: '/v1/assets/map', headers: H(starterTenant, starterOwner) });
    expect(res.statusCode).toBe(402);
    expect(res.json().error.upgrade_to).toBe('BUSINESS');
  });
});

describe('GET /v1/crew/map', () => {
  it('returns projects with open punches + on-the-clock counts (degraded crew layer)', async () => {
    const res = await app.inject({ method: 'GET', url: '/v1/crew/map', headers: H(bizTenant, bizOwner) });
    expect(res.statusCode).toBe(200);
    const { sites, workers } = res.json();
    expect(sites).toHaveLength(1);
    expect(sites[0]).toMatchObject({ project_id: projectId, clocked_in_count: 1 });
    expect(sites[0].workers).toEqual(['W Worker']);
    // No GPS captured on this punch → no precise workers.
    expect(workers).toHaveLength(0);
  });

  it('returns precise workers for punches that captured GPS (Phase 6a)', async () => {
    await testPool.query(
      `UPDATE time_punches SET clock_in_lat = 43.0800, clock_in_lng = -89.4100 WHERE tenant_id = $1`,
      [bizTenant],
    );
    const res = await app.inject({ method: 'GET', url: '/v1/crew/map', headers: H(bizTenant, bizOwner) });
    const { workers } = res.json();
    expect(workers).toHaveLength(1);
    expect(workers[0]).toMatchObject({
      worker: 'W Worker', latitude: 43.08, longitude: -89.41, project_id: projectId,
    });
  });

  it('is empty once the punch is closed', async () => {
    await testPool.query(`UPDATE time_punches SET clock_out_at = NOW() WHERE tenant_id = $1`, [bizTenant]);
    const res = await app.inject({ method: 'GET', url: '/v1/crew/map', headers: H(bizTenant, bizOwner) });
    expect(res.json().sites).toHaveLength(0);
    expect(res.json().workers).toHaveLength(0);
  });
});
