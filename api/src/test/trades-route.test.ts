// trades-route.test.ts — GET /v1/trades reference API (T-64). No DB rows needed (static data),
// but auth is required, so we mint a JWT like the other route tests.

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { randomUUID } from 'node:crypto';
import Fastify from 'fastify';
import jwt from 'jsonwebtoken';

import { tradeRoutes } from '../routes/v1/trades.js';
import { registerErrorHandler } from '../plugins/error-handler.js';
import { TRADE_TAXONOMY } from '../lib/trades/taxonomy.js';

const app = Fastify({ logger: false });

function token(): string {
  return jwt.sign(
    { jti: randomUUID(), user_id: randomUUID(), tenant_id: randomUUID(), role: 'FIELD_TECH', email: 'ft@tr.test', preferred_language: 'en' },
    process.env.JWT_SECRET ?? 'dev-secret-change-in-production',
    { expiresIn: 86400 }
  );
}
const H = () => ({ 'user-agent': 'test-runner/1.0', authorization: `Bearer ${token()}` });

beforeAll(async () => {
  registerErrorHandler(app);
  await app.register(tradeRoutes, { prefix: '/v1' });
  await app.ready();
});

afterAll(async () => { await app.close(); });

describe('GET /v1/trades', () => {
  it('requires auth', async () => {
    const res = await app.inject({ method: 'GET', url: '/v1/trades', headers: { 'user-agent': 'test-runner/1.0' } });
    expect(res.statusCode).toBe(401);
  });

  it('returns the full taxonomy for any authed role', async () => {
    const res = await app.inject({ method: 'GET', url: '/v1/trades', headers: H() });
    expect(res.statusCode).toBe(200);
    const { trades } = res.json();
    expect(trades).toHaveLength(TRADE_TAXONOMY.length);
    expect(trades[0]).toHaveProperty('key');
    expect(trades[0]).toHaveProperty('permit_trade');
    expect(String(trades[0].label_es ?? '').length).toBeGreaterThan(0);
  });

  it('filters by category and permit_trade', async () => {
    const cat = await app.inject({ method: 'GET', url: '/v1/trades?category=interior', headers: H() });
    expect(cat.json().trades.every((t: any) => t.category === 'interior')).toBe(true);
    expect(cat.json().trades.length).toBeGreaterThan(5);

    const pt = await app.inject({ method: 'GET', url: '/v1/trades?permit_trade=mechanical', headers: H() });
    expect(pt.json().trades.every((t: any) => t.permit_trade === 'mechanical')).toBe(true);
  });
});

describe('GET /v1/trades/:key', () => {
  it('resolves by key and by alias', async () => {
    const byKey = await app.inject({ method: 'GET', url: '/v1/trades/asphalt_paving', headers: H() });
    expect(byKey.statusCode).toBe(200);
    expect(byKey.json().trade.key).toBe('asphalt_paving');

    const byAlias = await app.inject({ method: 'GET', url: '/v1/trades/striping', headers: H() });
    expect(byAlias.statusCode).toBe(200);
    expect(byAlias.json().trade.key).toBe('pavement_marking');
  });

  it('404s on an unknown trade', async () => {
    const res = await app.inject({ method: 'GET', url: '/v1/trades/underwater_basket_weaving', headers: H() });
    expect(res.statusCode).toBe(404);
  });
});
