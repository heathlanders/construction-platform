// estimate-suggestions.test.ts — learn-from-actuals suggestions endpoint (Estimating Phase 2b).
//   Seeds a synthetic tenant with the Phase-2a attribution chain populated (awarded vendor bid →
//   takeoff.assembly_code for material; costed time entry → budget.assembly_code for labor) and asserts
//   GET /v1/estimate-assemblies/suggestions aggregates per-(trade, code). Also asserts empty degrade.
//   Deterministic, tenant-scoped, advisory. Locked: T-02, A-03.

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { randomUUID } from 'node:crypto';
import Fastify from 'fastify';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import { testPool } from './setup.js';
import { estimateAssemblyRoutes } from '../routes/v1/estimate-assemblies.js';
import { registerErrorHandler } from '../plugins/error-handler.js';

const tenantId = randomUUID();
const ownerId = randomUUID();
const projectId = randomUUID();
const slug = `sug-${tenantId.slice(0, 8)}`;
const CODE = 'E-SUG-TEST';

const app = Fastify({ logger: false });
const token = () => jwt.sign(
  { jti: randomUUID(), user_id: ownerId, tenant_id: tenantId, role: 'OWNER', email: 'owner@sug.test', preferred_language: 'en' },
  process.env.JWT_SECRET ?? 'dev-secret-change-in-production', { expiresIn: 86400 });
const H = () => ({ 'user-agent': 'test-runner/1.0', authorization: `Bearer ${token()}` });

beforeAll(async () => {
  registerErrorHandler(app);
  await app.register(estimateAssemblyRoutes, { prefix: '/v1' });
  await app.ready();

  await testPool.query(`INSERT INTO tenants (id,name,slug,tier,status) VALUES ($1,'Sug Tenant',$2,'professional','active')`, [tenantId, slug]);
  const pw = await bcrypt.hash('x', 10);
  await testPool.query(`INSERT INTO users (id,tenant_id,email,password_hash,first_name,last_name,role,status) VALUES ($1,$2,'owner@sug.test',$3,'O','W','owner','active')`, [ownerId, tenantId, pw]);
  await testPool.query(`INSERT INTO projects (id,tenant_id,name,status,state) VALUES ($1,$2,'Sug Project','active','WI')`, [projectId, tenantId]);

  // Catalog assembly (current values: material 1000¢, labor 0.5 hr/unit) — resolves trade + current for the suggestion.
  await testPool.query(
    `INSERT INTO estimate_assemblies (tenant_id,trade,code,name,unit,material_cost_cents,labor_hours_per_unit,equipment_cost_cents,waste_pct,is_system,source)
     VALUES ($1,'electrical',$2,'Test receptacle','EA',1000,0.5,0,0,FALSE,'tenant')`, [tenantId, CODE]);

  // ── Material chain: awarded vendor bid line → takeoff.assembly_code ─────────
  const bpId = randomUUID(), vendorId = randomUUID(), bidId = randomUUID(), toId = randomUUID();
  await testPool.query(`INSERT INTO bid_packages (id,tenant_id,project_id,title,status,created_by) VALUES ($1,$2,$3,'BP','draft',$4)`, [bpId, tenantId, projectId, ownerId]);
  await testPool.query(`INSERT INTO takeoff_items (id,tenant_id,project_id,bid_package_id,description,quantity,unit,unit_cost_cents,assembly_code,created_by) VALUES ($1,$2,$3,$4,'recep',10,'EA',1000,$5,$6)`, [toId, tenantId, projectId, bpId, CODE, ownerId]);
  await testPool.query(`INSERT INTO vendors (id,tenant_id,name,vendor_type) VALUES ($1,$2,'Acme Electric','subcontractor')`, [vendorId, tenantId]);
  await testPool.query(`INSERT INTO vendor_bids (id,tenant_id,bid_package_id,vendor_id,status) VALUES ($1,$2,$3,$4,'awarded')`, [bidId, tenantId, bpId, vendorId]);
  // Two awarded lines: unit costs 1100 + 1300 → AVG 1200.
  await testPool.query(`INSERT INTO vendor_bid_line_items (tenant_id,vendor_bid_id,takeoff_item_id,unit_cost_cents) VALUES ($1,$2,$3,1100),($1,$2,$3,1300)`, [tenantId, bidId, toId]);

  // ── Labor chain: costed time entries → budget.assembly_code ────────────────
  const bliId = randomUUID();
  await testPool.query(`INSERT INTO budget_line_items (id,tenant_id,project_id,description,budget_cents,assembly_code,created_by) VALUES ($1,$2,$3,'recep budget',10000,$4,$5)`, [bliId, tenantId, projectId, CODE, ownerId]);
  // 5 + 3 = 8 hours over takeoff quantity 10 → 0.8 hr/unit.
  await testPool.query(`INSERT INTO time_entries (tenant_id,user_id,date,hours_worked,budget_line_item_id) VALUES ($1,$2,CURRENT_DATE,5,$3),($1,$2,CURRENT_DATE,3,$3)`, [tenantId, ownerId, bliId]);
});

afterAll(async () => {
  for (const t of ['vendor_bid_line_items','vendor_bids','vendors','takeoff_items','bid_packages','time_entries','budget_line_items','estimate_assemblies','projects','users','tenants']) {
    await testPool.query(`DELETE FROM ${t} WHERE ${t === 'tenants' ? 'id' : 'tenant_id'}=$1`, [tenantId]);
  }
  await app.close();
});

describe('estimate-assemblies suggestions (Phase 2b)', () => {
  it('aggregates material + labor actuals per (trade, code)', async () => {
    const res = await app.inject({ method: 'GET', url: '/v1/estimate-assemblies/suggestions?trade=electrical', headers: H() });
    expect(res.statusCode).toBe(200);
    const list = res.json().suggestions as any[];
    const s = list.find((x) => x.code === CODE);
    expect(s).toBeTruthy();
    expect(s.trade).toBe('electrical');
    expect(s.suggested_material_cents).toBe(1200);       // AVG(1100,1300)
    expect(s.material_sample_size).toBe(2);
    expect(s.suggested_labor_hours_per_unit).toBeCloseTo(0.8, 3); // 8 hrs / 10 qty
    expect(s.labor_sample_size).toBe(2);
    expect(s.current_material_cents).toBe(1000);
    expect(s.source).toBe('tenant_actuals');
  });

  it('degrades to empty for a trade with no history', async () => {
    const res = await app.inject({ method: 'GET', url: '/v1/estimate-assemblies/suggestions?trade=plumbing', headers: H() });
    expect(res.statusCode).toBe(200);
    expect(res.json().suggestions).toEqual([]);
  });
});
