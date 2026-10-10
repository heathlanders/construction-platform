// vendor-trades.test.ts — T-64 Phase 2: vendors.trade_type normalization + trade filter.
//   POST/PATCH /v1/vendors — known keys/aliases collapse to canonical taxonomy key;
//   unknown free text preserved as typed (never rejected).
//   GET /v1/vendors?trade_type= — matches canonical key + aliases (legacy rows) case-insensitively.

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { randomUUID } from 'node:crypto';
import Fastify from 'fastify';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import { testPool } from './setup.js';
import { vendorRoutes } from '../routes/v1/vendors.js';
import { registerErrorHandler } from '../plugins/error-handler.js';

const tenantId = randomUUID();
const ownerId = randomUUID();
const slug = `vtr-${tenantId.slice(0, 8)}`;

const app = Fastify({ logger: false });

function token(): string {
  return jwt.sign(
    { jti: randomUUID(), user_id: ownerId, tenant_id: tenantId, role: 'OWNER', email: 'owner@vtr.test', preferred_language: 'en' },
    process.env.JWT_SECRET ?? 'dev-secret-change-in-production',
    { expiresIn: 86400 }
  );
}
const H = () => ({ 'user-agent': 'test-runner/1.0', authorization: `Bearer ${token()}`, 'content-type': 'application/json' });

beforeAll(async () => {
  registerErrorHandler(app);
  await app.register(vendorRoutes, { prefix: '/v1' });
  await app.ready();

  await testPool.query(`INSERT INTO tenants (id, name, slug, tier, status) VALUES ($1,'VTR Tenant',$2,'professional','active')`, [tenantId, slug]);
  const pw = await bcrypt.hash('x', 10);
  await testPool.query(
    `INSERT INTO users (id, tenant_id, email, password_hash, first_name, last_name, role, status)
     VALUES ($1,$2,'owner@vtr.test',$3,'O','Owner','owner','active')`,
    [ownerId, tenantId, pw]
  );
  // Legacy row written before normalization existed — stores the alias 'mechanical'.
  await testPool.query(
    `INSERT INTO vendors (tenant_id, name, vendor_type, trade_type, created_by) VALUES ($1,'Legacy Mech Co','subcontractor','mechanical',$2)`,
    [tenantId, ownerId]
  );
});

afterAll(async () => {
  await app.close();
  await testPool.query(`DELETE FROM audit_log WHERE tenant_id = $1`, [tenantId]);
  await testPool.query(`DELETE FROM vendors WHERE tenant_id = $1`, [tenantId]);
  await testPool.query(`DELETE FROM users WHERE tenant_id = $1`, [tenantId]);
  await testPool.query(`DELETE FROM tenants WHERE id = $1`, [tenantId]);
});

async function createVendor(name: string, trade: string): Promise<any> {
  const res = await app.inject({ method: 'POST', url: '/v1/vendors', headers: H(), payload: { name, trade_type: trade } });
  expect(res.statusCode).toBe(201);
  return res.json().vendor;
}

describe('POST /v1/vendors trade normalization (T-64)', () => {
  it('collapses an alias to the canonical taxonomy key', async () => {
    const v = await createVendor('Stripe Rite LLC', 'striping');
    expect(v.trade_type).toBe('pavement_marking');
  });

  it('is case/whitespace-insensitive on known trades', async () => {
    const v = await createVendor('Cool Air Inc', '  Mechanical ');
    expect(v.trade_type).toBe('hvac');
  });

  it('preserves unknown free text as typed (never rejects)', async () => {
    const v = await createVendor('Weird Trades Co', 'underwater basket weaving');
    expect(v.trade_type).toBe('underwater basket weaving');
  });
});

describe('PATCH /v1/vendors/:id trade normalization', () => {
  it('normalizes on update and can clear to null', async () => {
    const v = await createVendor('Cabinet Bros', 'cabinet_installation');
    expect(v.trade_type).toBe('cabinetry');

    const upd = await app.inject({ method: 'PATCH', url: `/v1/vendors/${v.id}`, headers: H(), payload: { trade_type: 'blacktop', version: v.version } });
    expect(upd.statusCode).toBe(200);
    expect(upd.json().vendor.trade_type).toBe('asphalt_paving');

    const clr = await app.inject({ method: 'PATCH', url: `/v1/vendors/${v.id}`, headers: H(), payload: { trade_type: null, version: upd.json().vendor.version } });
    expect(clr.statusCode).toBe(200);
    expect(clr.json().vendor.trade_type).toBeNull();
  });
});

describe('GET /v1/vendors?trade_type=', () => {
  it('matches canonical rows AND legacy alias rows for the same trade', async () => {
    await createVendor('Modern HVAC LLC', 'hvac');
    const res = await app.inject({ method: 'GET', url: '/v1/vendors?trade_type=hvac', headers: H() });
    expect(res.statusCode).toBe(200);
    const names = res.json().vendors.map((v: any) => v.name).sort();
    // 'Cool Air Inc' (normalized to hvac), 'Modern HVAC LLC', and the pre-seeded
    // legacy 'Legacy Mech Co' (stored alias 'mechanical') all match.
    expect(names).toContain('Modern HVAC LLC');
    expect(names).toContain('Cool Air Inc');
    expect(names).toContain('Legacy Mech Co');
  });

  it('filtering by an alias hits the same set', async () => {
    const res = await app.inject({ method: 'GET', url: '/v1/vendors?trade_type=mechanical', headers: H() });
    expect(res.statusCode).toBe(200);
    expect(res.json().vendors.map((v: any) => v.name)).toContain('Modern HVAC LLC');
  });

  it('unknown free-text filter matches raw stored value only', async () => {
    const res = await app.inject({ method: 'GET', url: '/v1/vendors?trade_type=underwater basket weaving', headers: H() });
    expect(res.statusCode).toBe(200);
    const names = res.json().vendors.map((v: any) => v.name);
    expect(names).toEqual(['Weird Trades Co']);
  });
});
