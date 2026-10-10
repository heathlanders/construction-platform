// estimates-routes.test.ts — integration tests for the estimating routes.
//   create → generate (parametric) → detail → manual line → optimistic-lock edit → catalog cascade
//   (system read + tenant override + system-readonly 403 + duplicate 409) → to-bid-package → award
//   (budget seed + lock). No tier gate. Locked decisions: T-02, T-12, A-03.

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
import { estimateRoutes } from '../routes/v1/estimates.js';
import { estimateAssemblyRoutes } from '../routes/v1/estimate-assemblies.js';
import { registerErrorHandler } from '../plugins/error-handler.js';

const tenantId = randomUUID();
const ownerId = randomUUID();
const fieldId = randomUUID();
const projectId = randomUUID();
const slug = `est-${tenantId.slice(0, 8)}`;

const app = Fastify({ logger: false });

function token(role: string, userId: string): string {
  return jwt.sign(
    { jti: randomUUID(), user_id: userId, tenant_id: tenantId, role, email: `${role}@est.test`, preferred_language: 'en' },
    process.env.JWT_SECRET ?? 'dev-secret-change-in-production',
    { expiresIn: 86400 },
  );
}
const H = (t: string) => ({ 'user-agent': 'test-runner/1.0', authorization: `Bearer ${t}`, 'content-type': 'application/json' });

beforeAll(async () => {
  registerErrorHandler(app);
  await app.register(estimateRoutes, { prefix: '/v1' });
  await app.register(estimateAssemblyRoutes, { prefix: '/v1' });
  await app.ready();

  await testPool.query(`INSERT INTO tenants (id,name,slug,tier,status) VALUES ($1,'Est Tenant',$2,'professional','active')`, [tenantId, slug]);
  const pw = await bcrypt.hash('x', 10);
  await testPool.query(
    `INSERT INTO users (id,tenant_id,email,password_hash,first_name,last_name,role,status) VALUES
       ($1,$2,'owner@est.test',$4,'O','W','owner','active'),
       ($3,$2,'field@est.test',$4,'F','T','field_tech','active')`,
    [ownerId, tenantId, fieldId, pw],
  );
  await testPool.query(`INSERT INTO projects (id,tenant_id,name,status,state) VALUES ($1,$2,'Est Project','active','WI')`, [projectId, tenantId]);
});

afterAll(async () => {
  await testPool.query(`DELETE FROM estimate_line_items WHERE tenant_id=$1`, [tenantId]);
  await testPool.query(`DELETE FROM task_steps WHERE tenant_id=$1`, [tenantId]);
  await testPool.query(`DELETE FROM schedule_tasks WHERE tenant_id=$1`, [tenantId]);
  await testPool.query(`DELETE FROM estimates WHERE tenant_id=$1`, [tenantId]);
  await testPool.query(`DELETE FROM estimate_assemblies WHERE tenant_id=$1`, [tenantId]);
  await testPool.query(`DELETE FROM takeoff_items WHERE tenant_id=$1`, [tenantId]);
  await testPool.query(`DELETE FROM bid_packages WHERE tenant_id=$1`, [tenantId]);
  await testPool.query(`DELETE FROM budget_line_items WHERE tenant_id=$1`, [tenantId]);
  await testPool.query(`DELETE FROM audit_log WHERE tenant_id=$1`, [tenantId]);
  await testPool.query(`DELETE FROM projects WHERE tenant_id=$1`, [tenantId]);
  await testPool.query(`DELETE FROM users WHERE tenant_id=$1`, [tenantId]);
  await testPool.query(`DELETE FROM tenants WHERE id=$1`, [tenantId]);
  await app.close();
});

let estimateId = '';

describe('estimate lifecycle', () => {
  it('role gate: field_tech cannot create an estimate', async () => {
    const res = await app.inject({ method: 'POST', url: '/v1/estimates', headers: H(token('FIELD_TECH', fieldId)), payload: { name: 'x' } });
    expect(res.statusCode).toBe(403);
  });

  it('creates a parametric estimate with markups', async () => {
    const res = await app.inject({
      method: 'POST', url: '/v1/estimates', headers: H(token('OWNER', ownerId)),
      payload: { name: 'Whole-house bid', project_id: projectId, mode: 'parametric', labor_rate_cents: 8500, overhead_pct: 10, profit_pct: 10, tax_pct: 5 },
    });
    expect(res.statusCode).toBe(201);
    estimateId = res.json().estimate.id;
    expect(res.json().estimate.status).toBe('draft');
  });

  it('generates parametric lines (SF × trade $/SF) and rolls up totals', async () => {
    const res = await app.inject({ method: 'POST', url: `/v1/estimates/${estimateId}/generate`, headers: H(token('OWNER', ownerId)), payload: { building_sf: 2000 } });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    // trade unset → all non-general trades: electrical, plumbing, mechanical, building = 4 PARAM lines.
    expect(body.line_count).toBe(4);
    expect(body.estimate.subtotal_cents).toBeGreaterThan(0);
    // electrical PARAM = $12/SF × 2000 = 24000_00 material cents.
    const elec = body.line_items.find((l: { assembly_code: string }) => l.assembly_code === 'PARAM-ELECTRICAL');
    expect(elec.material_cents).toBe(2000 * 1200);
    // markup present.
    expect(body.estimate.markup_cents).toBeGreaterThan(0);
    expect(body.estimate.total_cents).toBe(body.estimate.subtotal_cents + body.estimate.markup_cents);
  });

  it('catalog: lists system assemblies for a trade', async () => {
    const res = await app.inject({ method: 'GET', url: '/v1/estimate-assemblies?trade=electrical', headers: H(token('OWNER', ownerId)) });
    expect(res.statusCode).toBe(200);
    const codes = res.json().assemblies.map((a: { code: string }) => a.code);
    expect(codes).toContain('PARAM-ELECTRICAL');
    expect(codes).toContain('E-RECEP-DUP');
  });

  it('catalog: system assembly is read-only (403)', async () => {
    const list = await app.inject({ method: 'GET', url: '/v1/estimate-assemblies?trade=electrical', headers: H(token('OWNER', ownerId)) });
    const sys = list.json().assemblies.find((a: { code: string; is_system: boolean }) => a.code === 'E-RECEP-DUP');
    const res = await app.inject({ method: 'PATCH', url: `/v1/estimate-assemblies/${sys.id}`, headers: H(token('OWNER', ownerId)), payload: { material_cost_cents: 999, version: 1 } });
    expect(res.statusCode).toBe(403);
    expect(res.json().error.code).toBe('SYSTEM_ASSEMBLY_READONLY');
  });

  it('catalog: tenant override + duplicate 409, and cascade wins on regenerate', async () => {
    // Create a tenant override for PARAM-ELECTRICAL at a higher $/SF.
    const create = await app.inject({
      method: 'POST', url: '/v1/estimate-assemblies', headers: H(token('OWNER', ownerId)),
      payload: { trade: 'electrical', code: 'PARAM-ELECTRICAL', name: 'Electrical premium $/SF', unit: 'SF', material_cost_cents: 1500 },
    });
    expect(create.statusCode).toBe(201);
    // Duplicate → 409.
    const dup = await app.inject({
      method: 'POST', url: '/v1/estimate-assemblies', headers: H(token('OWNER', ownerId)),
      payload: { trade: 'electrical', code: 'PARAM-ELECTRICAL', name: 'dup', unit: 'SF', material_cost_cents: 1 },
    });
    expect(dup.statusCode).toBe(409);
    // Regenerate → tenant override (1500) beats system (1200).
    const gen = await app.inject({ method: 'POST', url: `/v1/estimates/${estimateId}/generate`, headers: H(token('OWNER', ownerId)), payload: { building_sf: 2000 } });
    const elec = gen.json().line_items.find((l: { assembly_code: string }) => l.assembly_code === 'PARAM-ELECTRICAL');
    expect(elec.material_cents).toBe(2000 * 1500);
  });

  let manualLineId = '';
  let manualVersion = 1;
  it('adds a manual line and recomputes header', async () => {
    const before = (await app.inject({ method: 'GET', url: `/v1/estimates/${estimateId}`, headers: H(token('OWNER', ownerId)) })).json().estimate.total_cents;
    const res = await app.inject({
      method: 'POST', url: `/v1/estimates/${estimateId}/line-items`, headers: H(token('OWNER', ownerId)),
      payload: { description: 'Permit fees', quantity: 1, material_unit_cents: 50000 },
    });
    expect(res.statusCode).toBe(201);
    manualLineId = res.json().line_item.id;
    manualVersion = res.json().line_item.version;
    expect(res.json().line_item.source).toBe('manual');
    const after = (await app.inject({ method: 'GET', url: `/v1/estimates/${estimateId}`, headers: H(token('OWNER', ownerId)) })).json().estimate.total_cents;
    expect(after).toBeGreaterThan(before);
  });

  it('line edit is optimistic-locked (409 on stale version)', async () => {
    const stale = await app.inject({ method: 'PATCH', url: `/v1/estimates/${estimateId}/line-items/${manualLineId}`, headers: H(token('OWNER', ownerId)), payload: { quantity: 2, version: 999 } });
    expect(stale.statusCode).toBe(409);
    const ok = await app.inject({ method: 'PATCH', url: `/v1/estimates/${estimateId}/line-items/${manualLineId}`, headers: H(token('OWNER', ownerId)), payload: { quantity: 2, version: manualVersion } });
    expect(ok.statusCode).toBe(200);
    expect(ok.json().line_item.material_cents).toBe(2 * 50000);
  });

  it('regenerate preserves the manual line', async () => {
    const gen = await app.inject({ method: 'POST', url: `/v1/estimates/${estimateId}/generate`, headers: H(token('OWNER', ownerId)), payload: { building_sf: 2000 } });
    const manual = gen.json().line_items.find((l: { id: string }) => l.id === manualLineId);
    expect(manual).toBeTruthy();
    expect(manual.source).toBe('manual');
  });

  it('converts to a bid package + takeoff items', async () => {
    const res = await app.inject({ method: 'POST', url: `/v1/estimates/${estimateId}/to-bid-package`, headers: H(token('OWNER', ownerId)), payload: {} });
    expect(res.statusCode).toBe(201);
    expect(res.json().takeoff_count).toBe(5); // 4 parametric + 1 manual
    // Phase 2a: parametric lines carry assembly_code → attribution link on takeoff_items.
    const attr = await testPool.query(
      `SELECT COUNT(*)::int AS n FROM takeoff_items WHERE tenant_id=$1 AND assembly_code IS NOT NULL`, [tenantId]);
    expect(attr.rows[0].n).toBeGreaterThanOrEqual(4);
  });

  it('awards → seeds budget line items and locks the estimate', async () => {
    const res = await app.inject({ method: 'POST', url: `/v1/estimates/${estimateId}/award`, headers: H(token('OWNER', ownerId)), payload: {} });
    expect(res.statusCode).toBe(200);
    expect(res.json().estimate.status).toBe('awarded');
    expect(res.json().budget_lines_seeded).toBe(5);
    // Phase 2a: seeded budget lines carry assembly_code → attribution link for learn-from-actuals.
    const attr = await testPool.query(
      `SELECT COUNT(*)::int AS n FROM budget_line_items WHERE tenant_id=$1 AND assembly_code IS NOT NULL`, [tenantId]);
    expect(attr.rows[0].n).toBeGreaterThanOrEqual(4);
    // Awarded estimate is locked.
    const patch = await app.inject({ method: 'PATCH', url: `/v1/estimates/${estimateId}`, headers: H(token('OWNER', ownerId)), payload: { name: 'x', version: 2 } });
    expect(patch.statusCode).toBe(409);
    expect(patch.json().error.code).toBe('ESTIMATE_AWARDED');
    const regen = await app.inject({ method: 'POST', url: `/v1/estimates/${estimateId}/generate`, headers: H(token('OWNER', ownerId)), payload: { building_sf: 2000 } });
    expect(regen.statusCode).toBe(409);
  });
});

describe('equipment cost (Phase 3)', () => {
  it('include_equipment seeds EQUIP DAY lines from the project task-step recommendations', async () => {
    // Seed a task whose steps recommend an excavator (as the Task Build-Out Engine would).
    const taskId = randomUUID();
    await testPool.query(
      `INSERT INTO schedule_tasks (id,tenant_id,project_id,title,status,version,created_by)
       VALUES ($1,$2,$3,'Excavate footings','not_started',1,$4)`,
      [taskId, tenantId, projectId, ownerId],
    );
    await testPool.query(
      `INSERT INTO task_steps (tenant_id,task_id,step_order,title,instruction,equipment,source)
       VALUES ($1,$2,1,'Dig footings','Excavate to bearing',
               '[{"type":"excavator","category":"heavy_equipment","reason":"dig"}]'::jsonb,'rule_engine')`,
      [tenantId, taskId],
    );

    const create = await app.inject({
      method: 'POST', url: '/v1/estimates', headers: H(token('OWNER', ownerId)),
      payload: { name: 'Equip bid', project_id: projectId, mode: 'assembly', labor_rate_cents: 8500 },
    });
    const eid = create.json().estimate.id;
    const gen = await app.inject({
      method: 'POST', url: `/v1/estimates/${eid}/generate`, headers: H(token('OWNER', ownerId)),
      payload: { include_equipment: true },
    });
    expect(gen.statusCode).toBe(200);
    const eq = gen.json().line_items.find((l: { assembly_code: string }) => l.assembly_code === 'EQUIP-EXCAVATOR');
    expect(eq).toBeTruthy();
    expect(Number(eq.quantity)).toBe(1);          // one task requires it → ≈1 day
    expect(eq.equipment_cents).toBe(60000);       // seeded excavator day rate × 1
    expect(gen.json().estimate.equipment_cents).toBeGreaterThanOrEqual(60000);
  });
});
