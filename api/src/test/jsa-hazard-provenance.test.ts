// jsa-hazard-provenance.test.ts — a JSA hazard picked from a Trade Knowledge Pack suggestion keeps its
// provenance (osha_ref, hazard_id, pack_version, source) through POST /v1/jsa-records (Wave S1).

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Fastify from 'fastify';
import { testPool } from './setup.js';
import { createTestFixture } from './helpers/tenant.js';
import { jsaRecordRoutes } from '../routes/v1/jsa-records.js';
import { registerErrorHandler } from '../plugins/error-handler.js';

const app = Fastify({ logger: false });
let fx: Awaited<ReturnType<typeof createTestFixture>>;
let projectId: string;

beforeAll(async () => {
  registerErrorHandler(app);
  await app.register(jsaRecordRoutes, { prefix: '/v1' });
  await app.ready();
  fx = await createTestFixture({ role: 'safety_officer' });
  const { rows } = await testPool.query(
    `INSERT INTO projects (tenant_id, name, status, created_by) VALUES ($1,'JSA Project','active',$2) RETURNING id`,
    [fx.tenant.id, fx.user.id]);
  projectId = rows[0].id;
});

afterAll(async () => {
  await testPool.query(`DELETE FROM jsa_records WHERE tenant_id=$1`, [fx.tenant.id]);
  await fx.cleanup();
  await app.close();
});

describe('POST /v1/jsa-records — pack hazard provenance', () => {
  it('stores osha_ref / hazard_id / pack_version / source / ppe for a suggested hazard', async () => {
    const res = await app.inject({
      method: 'POST', url: '/v1/jsa-records',
      headers: { authorization: `Bearer ${fx.token}`, 'user-agent': 'test/1.0' },
      payload: {
        project_id: projectId, title: 'Deck framing JSA', conducted_at: new Date().toISOString(),
        hazards: [
          { description: 'Fall from the deck edge', controls: 'Guardrails or PFAS at 6 ft', severity: 'critical',
            osha_ref: '1926.501(b)(13)', hazard_id: 'decks.fall_edge', pack_version: '1.0.0', source: 'pack', ppe: ['harness'] },
          { description: 'Wet floor at entry', severity: 'low', source: 'manual' },
        ],
      },
    });
    expect(res.statusCode).toBe(201);
    const { rows } = await testPool.query(`SELECT hazards FROM jsa_records WHERE id=$1`, [res.json().jsa_record.id]);
    expect(rows[0].hazards[0]).toMatchObject({ osha_ref: '1926.501(b)(13)', hazard_id: 'decks.fall_edge', pack_version: '1.0.0', source: 'pack', ppe: ['harness'] });
    expect(rows[0].hazards[1]).toMatchObject({ description: 'Wet floor at entry', source: 'manual' });
  });

  it('still rejects an unknown source value', async () => {
    const res = await app.inject({
      method: 'POST', url: '/v1/jsa-records',
      headers: { authorization: `Bearer ${fx.token}`, 'user-agent': 'test/1.0' },
      payload: { project_id: projectId, title: 'x', conducted_at: new Date().toISOString(), hazards: [{ description: 'x', source: 'ai' }] },
    });
    expect(res.statusCode).toBe(422);
  });
});
