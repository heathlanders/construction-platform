// sync-time-entries.test.ts — batch sync protocol for time_entries.
// Covers the columns the mobile batch path relies on (Gap E):
//   POST /v1/sync/push   — created carries hourly_rate_cents + budget_line_item_id
//   GET  /v1/sync/pull    — those columns round-trip in the delta
//   POST /v1/sync/push   — stale-version update → version_conflict + server_record
//   POST /v1/sync/push   — costed rows dispatch reconciliation.field_cost_rollup (route parity)
//   POST /v1/sync/push   — field-tech self-guard (may not write another user's entries)
// Locked decisions: T-02, T-12, T-13.

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { randomUUID } from 'node:crypto';
import Fastify from 'fastify';
import jwt from 'jsonwebtoken';

// pg-boss is mocked so no real queue boots; sendJob is a spy for the rollup assertions.
vi.mock('../lib/queue.js', () => ({
  sendJob: vi.fn().mockResolvedValue(undefined),
}));

import { sendJob } from '../lib/queue.js';
import { testPool } from './setup.js';
import { syncRoutes } from '../routes/v1/sync.js';
import { registerErrorHandler } from '../plugins/error-handler.js';
import type { JWTPayload } from '../middleware/auth.js';

const tenantId = randomUUID();
const userId = randomUUID();
const techId = randomUUID();
const projectId = randomUUID();
const costCodeId = randomUUID();
const budgetLineId = randomUUID();
const entryId = randomUUID();
const slug = `synct-${tenantId.slice(0, 8)}`;
const sendJobMock = sendJob as unknown as ReturnType<typeof vi.fn>;

const app = Fastify({ logger: false });

function token(uid: string = userId, role: 'OWNER' | 'FIELD_TECH' = 'OWNER'): string {
  return jwt.sign(
    { jti: randomUUID(), user_id: uid, tenant_id: tenantId, role,
      email: `synct-${uid.slice(0, 8)}@ex.com`, preferred_language: 'en' as const } satisfies Partial<JWTPayload>,
    process.env.JWT_SECRET ?? 'dev-secret-change-in-production',
    { expiresIn: 86400 },
  );
}
const H = (uid?: string, role?: 'OWNER' | 'FIELD_TECH') =>
  ({ 'user-agent': 'test-runner/1.0', authorization: `Bearer ${token(uid, role)}`, 'content-type': 'application/json' });

beforeAll(async () => {
  registerErrorHandler(app);
  await app.register(syncRoutes, { prefix: '/v1' });
  await app.ready();

  await testPool.query(`INSERT INTO tenants (id,name,slug,tier,status) VALUES ($1,'Sync TE',$2,'professional','active')`, [tenantId, slug]);
  await testPool.query(
    `INSERT INTO users (id,tenant_id,email,password_hash,first_name,last_name,role,status)
     VALUES ($1,$2,$3,'x','S','T','owner','active')`,
    [userId, tenantId, `synct-${userId.slice(0, 8)}@ex.com`],
  );
  await testPool.query(
    `INSERT INTO users (id,tenant_id,email,password_hash,first_name,last_name,role,status)
     VALUES ($1,$2,$3,'x','F','T','field_tech','active')`,
    [techId, tenantId, `synct-${techId.slice(0, 8)}@ex.com`],
  );
  await testPool.query(`INSERT INTO projects (id,tenant_id,name,status) VALUES ($1,$2,'Sync TE Project','active')`, [projectId, tenantId]);
  await testPool.query(`INSERT INTO cost_codes (id,tenant_id,code,name) VALUES ($1,$2,'01-100','Labor')`, [costCodeId, tenantId]);
  await testPool.query(
    `INSERT INTO budget_line_items (id,tenant_id,project_id,description,budget_cents) VALUES ($1,$2,$3,'Framing labor',100000)`,
    [budgetLineId, tenantId, projectId],
  );
});

afterAll(async () => {
  await app.close();
  await testPool.query(`DELETE FROM audit_log WHERE tenant_id=$1`, [tenantId]);
  await testPool.query(`DELETE FROM inspections WHERE tenant_id=$1`, [tenantId]);
  await testPool.query(`DELETE FROM jsa_records WHERE tenant_id=$1`, [tenantId]);
  await testPool.query(`DELETE FROM electrical_circuits WHERE tenant_id=$1`, [tenantId]);
  await testPool.query(`DELETE FROM electrical_panels WHERE tenant_id=$1`, [tenantId]);
  await testPool.query(`DELETE FROM plumbing_fixtures WHERE tenant_id=$1`, [tenantId]);
  await testPool.query(`DELETE FROM plumbing_systems WHERE tenant_id=$1`, [tenantId]);
  await testPool.query(`DELETE FROM roofing_qa_records WHERE tenant_id=$1`, [tenantId]);
  await testPool.query(`DELETE FROM roofing_systems WHERE tenant_id=$1`, [tenantId]);
  await testPool.query(`DELETE FROM framing_correction_items WHERE tenant_id=$1`, [tenantId]);
  await testPool.query(`DELETE FROM framing_inspections WHERE tenant_id=$1`, [tenantId]);
  await testPool.query(`DELETE FROM concrete_test_records WHERE tenant_id=$1`, [tenantId]);
  await testPool.query(`DELETE FROM concrete_pours WHERE tenant_id=$1`, [tenantId]);
  await testPool.query(`DELETE FROM permits WHERE tenant_id=$1`, [tenantId]);
  await testPool.query(`DELETE FROM company_assets WHERE tenant_id=$1`, [tenantId]);
  await testPool.query(`DELETE FROM time_entries WHERE tenant_id=$1`, [tenantId]);
  await testPool.query(`DELETE FROM budget_line_items WHERE tenant_id=$1`, [tenantId]);
  await testPool.query(`DELETE FROM cost_codes WHERE tenant_id=$1`, [tenantId]);
  await testPool.query(`DELETE FROM projects WHERE id=$1`, [projectId]);
  await testPool.query(`DELETE FROM users WHERE tenant_id=$1`, [tenantId]);
  await testPool.query(`DELETE FROM tenants WHERE id=$1`, [tenantId]);
});

describe('batch sync — electrical circuits + plumbing fixtures', () => {
  it('accepts a status flip, parents stay read-only', async () => {
    const panelId = randomUUID(), circuitId = randomUUID();
    const sysId = randomUUID(), fixId = randomUUID();
    await testPool.query(`INSERT INTO electrical_panels (id,tenant_id,project_id,name,created_by) VALUES ($1,$2,$3,'Main',$4)`, [panelId, tenantId, projectId, userId]);
    await testPool.query(`INSERT INTO electrical_circuits (id,tenant_id,panel_id,circuit_number,status,created_by) VALUES ($1,$2,$3,4,'planned',$4)`, [circuitId, tenantId, panelId, userId]);
    await testPool.query(`INSERT INTO plumbing_systems (id,tenant_id,project_id,name,created_by) VALUES ($1,$2,$3,'Supply',$4)`, [sysId, tenantId, projectId, userId]);
    await testPool.query(`INSERT INTO plumbing_fixtures (id,tenant_id,system_id,fixture_type,status,created_by) VALUES ($1,$2,$3,'sink','planned',$4)`, [fixId, tenantId, sysId, userId]);

    const res = await app.inject({
      method: 'POST', url: '/v1/sync/push', headers: H(),
      body: JSON.stringify({
        changes: {
          electrical_circuits: { created: [], deleted: [], updated: [{ id: circuitId, version: 1, status: 'roughed_in' }] },
          plumbing_fixtures: { created: [], deleted: [], updated: [{ id: fixId, version: 1, status: 'rough_in' }] },
          electrical_panels: { created: [{ id: randomUUID(), project_id: projectId, name: 'Injected' }], updated: [], deleted: [] },
          plumbing_systems: { created: [{ id: randomUUID(), project_id: projectId, name: 'Injected' }], updated: [], deleted: [] },
        },
      }),
    });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).conflicts).toEqual([]);

    const c = await testPool.query(`SELECT status FROM electrical_circuits WHERE id=$1`, [circuitId]);
    const f = await testPool.query(`SELECT status FROM plumbing_fixtures WHERE id=$1`, [fixId]);
    expect(c.rows[0].status).toBe('roughed_in');
    expect(f.rows[0].status).toBe('rough_in');

    const p = await testPool.query(`SELECT count(*)::int AS n FROM electrical_panels WHERE tenant_id=$1`, [tenantId]);
    const sy = await testPool.query(`SELECT count(*)::int AS n FROM plumbing_systems WHERE tenant_id=$1`, [tenantId]);
    expect(p.rows[0].n).toBe(1);
    expect(sy.rows[0].n).toBe(1);
  });
});

describe('batch sync — roofing QA + framing corrections', () => {
  it('accepts a roofing check and a framing correction, parents stay read-only', async () => {
    const sysId = randomUUID(), qaId = randomUUID();
    const inspId = randomUUID(), corrId = randomUUID();
    await testPool.query(
      `INSERT INTO roofing_systems (id,tenant_id,project_id,roof_type,status,created_by) VALUES ($1,$2,$3,'asphalt_shingle','planned',$4)`,
      [sysId, tenantId, projectId, userId]);
    await testPool.query(
      `INSERT INTO framing_inspections (id,tenant_id,project_id,section,status,created_by) VALUES ($1,$2,$3,'walls','pending',$4)`,
      [inspId, tenantId, projectId, userId]);

    const res = await app.inject({
      method: 'POST', url: '/v1/sync/push', headers: H(),
      body: JSON.stringify({
        changes: {
          roofing_qa_records: {
            created: [{ id: qaId, roofing_system_id: sysId, qa_type: 'fastener_pull', result: 'pass', measured_value: 210, unit: 'lbf' }],
            updated: [], deleted: [],
          },
          framing_correction_items: {
            created: [{ id: corrId, framing_inspection_id: inspId, description: 'Missing hurricane tie', severity: 'major', status: 'open' }],
            updated: [], deleted: [],
          },
          // Parents are office records — a client push must not create one.
          roofing_systems: { created: [{ id: randomUUID(), project_id: projectId, roof_type: 'tpo', status: 'planned' }], updated: [], deleted: [] },
          framing_inspections: { created: [{ id: randomUUID(), project_id: projectId, section: 'roof', status: 'pending' }], updated: [], deleted: [] },
        },
      }),
    });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).conflicts).toEqual([]);

    const qa = await testPool.query(`SELECT qa_type, result, measured_value FROM roofing_qa_records WHERE id=$1`, [qaId]);
    expect(qa.rows[0].result).toBe('pass');
    expect(Number(qa.rows[0].measured_value)).toBe(210);

    const corr = await testPool.query(`SELECT description, severity FROM framing_correction_items WHERE id=$1`, [corrId]);
    expect(corr.rows[0].severity).toBe('major');

    const sys = await testPool.query(`SELECT count(*)::int AS n FROM roofing_systems WHERE tenant_id=$1`, [tenantId]);
    const insp = await testPool.query(`SELECT count(*)::int AS n FROM framing_inspections WHERE tenant_id=$1`, [tenantId]);
    expect(sys.rows[0].n).toBe(1);    // pushed system ignored
    expect(insp.rows[0].n).toBe(1);   // pushed inspection ignored
  });
});

describe('batch sync — concrete QA tests', () => {
  it('accepts a test measured at the pour and keeps pours read-only', async () => {
    const pourId = randomUUID();
    const testId = randomUUID();
    await testPool.query(
      `INSERT INTO concrete_pours (id,tenant_id,project_id,pour_type,status,created_by)
       VALUES ($1,$2,$3,'slab','planned',$4)`,
      [pourId, tenantId, projectId, userId],
    );

    const res = await app.inject({
      method: 'POST', url: '/v1/sync/push', headers: H(),
      body: JSON.stringify({
        changes: {
          concrete_test_records: {
            created: [{
              id: testId, pour_id: pourId, test_type: 'slump',
              test_date: '2026-07-28', measured_value: 4.5, specified_value: 4,
              unit: 'in', result: 'pending', sample_id: 'S-1',
            }],
            updated: [], deleted: [],
          },
          // A pour is scheduling, not a field capture — the client may not create one.
          concrete_pours: {
            created: [{ id: randomUUID(), project_id: projectId, pour_type: 'footing', status: 'planned' }],
            updated: [], deleted: [],
          },
        },
      }),
    });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).conflicts).toEqual([]);

    const { rows } = await testPool.query(`SELECT test_type, measured_value, unit FROM concrete_test_records WHERE id=$1`, [testId]);
    expect(rows[0].test_type).toBe('slump');
    expect(Number(rows[0].measured_value)).toBe(4.5);

    const pours = await testPool.query(`SELECT count(*)::int AS n FROM concrete_pours WHERE tenant_id=$1`, [tenantId]);
    expect(pours.rows[0].n).toBe(1);   // the pushed pour was ignored
  });
});

describe('batch sync — permits (read cache) + inspection results', () => {
  it('pulls a permit but refuses to let a client push one', async () => {
    // Permit lifecycle carries tier gates (T-55) and jurisdiction resolution (T-59) —
    // it is an office action. The client-side `push: () => ({})` is a convention; the
    // server `readOnly` flag is the boundary.
    const permitId = randomUUID();
    await testPool.query(
      `INSERT INTO permits (id,tenant_id,project_id,permit_type,building_type,state_code,status,permit_number,created_by)
       VALUES ($1,$2,$3,'electrical','residential_sf','WI','active','E-2026-1',$4)`,
      [permitId, tenantId, projectId, userId],
    );

    const push = await app.inject({
      method: 'POST', url: '/v1/sync/push', headers: H(),
      body: JSON.stringify({ changes: { permits: { created: [], updated: [{ id: permitId, version: 1, permit_number: 'HACKED' }], deleted: [] } } }),
    });
    expect(push.statusCode).toBe(200);
    const after = await testPool.query(`SELECT permit_number FROM permits WHERE id=$1`, [permitId]);
    expect(after.rows[0].permit_number).toBe('E-2026-1');

    const pull = await app.inject({ method: 'GET', url: '/v1/sync/pull?since=2020-01-01T00:00:00.000Z', headers: H() });
    const permits = JSON.parse(pull.body).changes.permits;
    expect(permits.created.concat(permits.updated).some((p: { id: string }) => p.id === permitId)).toBe(true);
  });

  it('accepts an inspection RESULT but not a re-parent', async () => {
    const permitId = randomUUID();
    const inspId = randomUUID();
    await testPool.query(
      `INSERT INTO permits (id,tenant_id,project_id,permit_type,building_type,state_code,status,created_by)
       VALUES ($1,$2,$3,'electrical','residential_sf','WI','active',$4)`,
      [permitId, tenantId, projectId, userId],
    );
    await testPool.query(
      `INSERT INTO inspections (id,tenant_id,project_id,title,status,permit_id,inspection_type,sequence_order,created_by)
       VALUES ($1,$2,$3,'Rough-In','scheduled',$4,'rough_in',2,$5)`,
      [inspId, tenantId, projectId, permitId, userId],
    );

    const res = await app.inject({
      method: 'POST', url: '/v1/sync/push', headers: H(),
      body: JSON.stringify({
        changes: {
          inspections: {
            created: [], deleted: [],
            updated: [{
              id: inspId, version: 1, result: 'pass', status: 'passed',
              inspector_name: 'AHJ Inspector', correction_notice: null,
              // A phone must not be able to move a milestone onto another permit or
              // reorder the AHJ sequence — these are pull-only.
              permit_id: randomUUID(), sequence_order: 99,
            }],
          },
        },
      }),
    });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).conflicts).toEqual([]);

    const { rows } = await testPool.query(`SELECT result, status, inspector_name, permit_id, sequence_order FROM inspections WHERE id=$1`, [inspId]);
    expect(rows[0].result).toBe('pass');
    expect(rows[0].inspector_name).toBe('AHJ Inspector');
    expect(rows[0].permit_id).toBe(permitId);   // unchanged
    expect(rows[0].sequence_order).toBe(2);     // unchanged
  });
});

describe('batch sync — jsa_records (JSONB arrays)', () => {
  it('persists attendees/hazards arrays instead of choking on them', async () => {
    // node-pg renders a JS ARRAY as a Postgres array literal (`{...}`), which jsonb
    // rejects — `daily_reports.weather` only survived because it's an object. Without
    // `jsonCols` on the table config every JSA push would fail, so the safety record
    // captured in the field would never leave the phone.
    const jsaId = randomUUID();
    const res = await app.inject({
      method: 'POST',
      url: '/v1/sync/push',
      headers: H(),
      body: JSON.stringify({
        changes: {
          jsa_records: {
            created: [{
              id: jsaId, project_id: projectId, title: 'Roof edge work',
              conducted_at: '2026-07-27T14:00:00.000Z',
              attendees: [{ name: 'Sam Foreman' }],
              hazards: [{ description: 'Unprotected leading edge', controls: 'Guardrail', severity: 'high' }],
            }],
            updated: [], deleted: [],
          },
        },
      }),
    });

    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).conflicts).toEqual([]);

    const { rows } = await testPool.query(`SELECT attendees, hazards FROM jsa_records WHERE id=$1`, [jsaId]);
    expect(rows[0].attendees).toEqual([{ name: 'Sam Foreman' }]);
    expect(rows[0].hazards[0].severity).toBe('high');
  });
});

describe('batch sync — time_entries (Gap E)', () => {
  it('push (created) persists hourly_rate_cents + budget_line_item_id', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/sync/push',
      headers: H(),
      body: JSON.stringify({
        changes: {
          time_entries: {
            created: [{
              id: entryId, project_id: projectId, user_id: userId, date: '2026-06-22',
              hours_worked: 8, hourly_rate_cents: 5500, cost_code_id: costCodeId,
              budget_line_item_id: budgetLineId, notes: 'batch create',
            }],
            updated: [], deleted: [],
          },
        },
      }),
    });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).conflicts).toEqual([]);

    const { rows } = await testPool.query(
      `SELECT hourly_rate_cents, budget_line_item_id, cost_code_id FROM time_entries WHERE id=$1`, [entryId]);
    expect(rows[0].hourly_rate_cents).toBe(5500);
    expect(rows[0].budget_line_item_id).toBe(budgetLineId);
    expect(rows[0].cost_code_id).toBe(costCodeId);
  });

  it('pull round-trips the new columns in the delta', async () => {
    const res = await app.inject({ method: 'GET', url: '/v1/sync/pull', headers: H() });
    expect(res.statusCode).toBe(200);
    const te = JSON.parse(res.body).changes.time_entries;
    const all = [...te.created, ...te.updated];
    const row = all.find((r: { id: string }) => r.id === entryId);
    expect(row).toBeTruthy();
    expect(row.hourly_rate_cents).toBe(5500);
    expect(row.budget_line_item_id).toBe(budgetLineId);
  });

  it('stale-version update returns a version_conflict with server_record (T-12/T-13)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/sync/push',
      headers: H(),
      body: JSON.stringify({
        changes: {
          time_entries: {
            created: [],
            updated: [{ id: entryId, version: 999, hours_worked: 9 }],
            deleted: [],
          },
        },
      }),
    });
    expect(res.statusCode).toBe(200);
    const { conflicts } = JSON.parse(res.body);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].table).toBe('time_entries');
    expect(conflicts[0].id).toBe(entryId);
    expect(conflicts[0].conflict_type).toBe('version_conflict');
    expect(conflicts[0].server_record.id).toBe(entryId);
  });
});

describe('batch sync — inspections (mobile offline read cache, §B1)', () => {
  it('pull carries inspector_name + trade_type for the cached row', async () => {
    const id = randomUUID();
    await testPool.query(
      `INSERT INTO inspections (id,tenant_id,project_id,title,status,inspector_name,trade_type)
       VALUES ($1,$2,$3,'Rough-in check','scheduled','A. Inspector','electrical')`,
      [id, tenantId, projectId],
    );

    const res = await app.inject({ method: 'GET', url: '/v1/sync/pull', headers: H() });
    expect(res.statusCode).toBe(200);
    const insp = JSON.parse(res.body).changes.inspections;
    const row = [...insp.created, ...insp.updated].find((r: { id: string }) => r.id === id);
    expect(row).toBeTruthy();
    expect(row.inspector_name).toBe('A. Inspector');
    expect(row.trade_type).toBe('electrical');
    expect(row.status).toBe('scheduled');
  });
});

describe('batch sync — company_assets (read-only yard cache)', () => {
  const assetId = randomUUID();

  it('pull carries the asset so the mobile QR scan can resolve it offline', async () => {
    await testPool.query(
      `INSERT INTO company_assets (id,tenant_id,asset_number,name,asset_category,ownership_type,status,requires_operator_cert,required_cert_type)
       VALUES ($1,$2,'AST-0042','Skid Steer','heavy_equipment','owned','active',TRUE,'forklift')`,
      [assetId, tenantId],
    );

    const res = await app.inject({ method: 'GET', url: '/v1/sync/pull', headers: H() });
    const ca = JSON.parse(res.body).changes.company_assets;
    const row = [...ca.created, ...ca.updated].find((r: { id: string }) => r.id === assetId);
    expect(row).toBeTruthy();
    expect(row.asset_number).toBe('AST-0042');
    // T-57 gating data must reach the field so the UI can warn before a checkout attempt.
    expect(row.requires_operator_cert).toBe(true);
    expect(row.required_cert_type).toBe('forklift');
  });

  it('IGNORES a client push — read-only tables are never client-writable', async () => {
    const res = await app.inject({
      method: 'POST', url: '/v1/sync/push', headers: H(),
      body: JSON.stringify({
        changes: {
          company_assets: {
            created: [{ id: randomUUID(), name: 'Injected', asset_number: 'AST-9999' }],
            updated: [{ id: assetId, version: 1, name: 'Renamed by client' }],
            deleted: [],
          },
        },
      }),
    });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).conflicts).toEqual([]);

    const { rows } = await testPool.query(`SELECT name FROM company_assets WHERE tenant_id=$1`, [tenantId]);
    expect(rows).toHaveLength(1);                 // no injected row
    expect(rows[0].name).toBe('Skid Steer');      // no client rename
  });
});

describe('batch sync — job + role parity with /v1/time-entries', () => {
  it('a costed create dispatches reconciliation.field_cost_rollup', async () => {
    sendJobMock.mockClear();
    const id = randomUUID();
    const res = await app.inject({
      method: 'POST', url: '/v1/sync/push', headers: H(),
      body: JSON.stringify({
        changes: {
          time_entries: {
            created: [{ id, project_id: projectId, user_id: userId, date: '2026-06-23',
              hours_worked: 6, hourly_rate_cents: 5000, budget_line_item_id: budgetLineId }],
            updated: [], deleted: [],
          },
        },
      }),
    });
    expect(res.statusCode).toBe(200);
    expect(sendJobMock).toHaveBeenCalledWith(
      'reconciliation.field_cost_rollup', tenantId,
      expect.objectContaining({ budget_line_item_id: budgetLineId, project_id: projectId }),
    );
  });

  it('an uncosted create dispatches no rollup job', async () => {
    sendJobMock.mockClear();
    const res = await app.inject({
      method: 'POST', url: '/v1/sync/push', headers: H(),
      body: JSON.stringify({
        changes: {
          time_entries: {
            created: [{ id: randomUUID(), project_id: projectId, user_id: userId, date: '2026-06-24', hours_worked: 4 }],
            updated: [], deleted: [],
          },
        },
      }),
    });
    expect(res.statusCode).toBe(200);
    expect(sendJobMock).not.toHaveBeenCalled();
  });

  it('a field tech cannot create an entry for another user — ownership is forced to the actor', async () => {
    const id = randomUUID();
    const res = await app.inject({
      method: 'POST', url: '/v1/sync/push', headers: H(techId, 'FIELD_TECH'),
      body: JSON.stringify({
        changes: {
          time_entries: {
            created: [{ id, project_id: projectId, user_id: userId, date: '2026-06-25', hours_worked: 5 }],
            updated: [], deleted: [],
          },
        },
      }),
    });
    expect(res.statusCode).toBe(200);
    const { rows } = await testPool.query(`SELECT user_id FROM time_entries WHERE id=$1`, [id]);
    expect(rows[0].user_id).toBe(techId); // NOT the owner id the client sent
  });

  it("a field tech's update of someone else's entry is rejected as forbidden", async () => {
    const { rows: cur } = await testPool.query(`SELECT version FROM time_entries WHERE id=$1`, [entryId]);
    const res = await app.inject({
      method: 'POST', url: '/v1/sync/push', headers: H(techId, 'FIELD_TECH'),
      body: JSON.stringify({
        changes: {
          time_entries: { created: [], updated: [{ id: entryId, version: cur[0].version, hours_worked: 12 }], deleted: [] },
        },
      }),
    });
    expect(res.statusCode).toBe(200);
    const { conflicts } = JSON.parse(res.body);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].conflict_type).toBe('forbidden');
    expect(conflicts[0].server_record).toBeUndefined(); // never leak another user's row
    const { rows } = await testPool.query(`SELECT hours_worked FROM time_entries WHERE id=$1`, [entryId]);
    expect(Number(rows[0].hours_worked)).toBe(8); // unchanged
  });
});
