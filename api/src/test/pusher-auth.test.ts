// pusher-auth.test.ts — Pusher private-channel authorization gate (T-15/T-16, A-16).
//   valid own-channel → signed; other tenant's channel → 403; realtime disabled → 503.

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { randomUUID, createHmac } from 'node:crypto';
import Fastify, { type FastifyInstance } from 'fastify';
import jwt from 'jsonwebtoken';
import { pusherAuthRoutes } from '../routes/v1/pusher-auth.js';
import { authorizeTenantChannel, pusherEnabled } from '../lib/pusher.js';
import { registerErrorHandler } from '../plugins/error-handler.js';

const SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-in-production';
const tenant = randomUUID();
const PUSHER = { appId: 'app-123', key: 'key-123', secret: 'sk-secret', cluster: 'us2' };

let app: FastifyInstance;
const saved: Record<string, string | undefined> = {};

function tok(tid: string): string {
  return jwt.sign({ jti: randomUUID(), user_id: randomUUID(), tenant_id: tid, role: 'OWNER', email: 'o@px.test', preferred_language: 'en' }, SECRET, { expiresIn: 3600 });
}
const H = (t: string) => ({ 'user-agent': 'test/1.0', authorization: `Bearer ${t}`, 'content-type': 'application/json' });

beforeAll(async () => {
  for (const k of ['PUSHER_APP_ID', 'PUSHER_KEY', 'PUSHER_SECRET', 'PUSHER_CLUSTER']) saved[k] = process.env[k];
  process.env.PUSHER_APP_ID = PUSHER.appId;
  process.env.PUSHER_KEY = PUSHER.key;
  process.env.PUSHER_SECRET = PUSHER.secret;
  process.env.PUSHER_CLUSTER = PUSHER.cluster;

  app = Fastify({ logger: false });
  registerErrorHandler(app);
  await app.register(pusherAuthRoutes, { prefix: '/v1' });
  await app.ready();
});

afterAll(async () => {
  for (const k of Object.keys(saved)) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }
  await app.close();
});

describe('Pusher channel auth (T-15/T-16)', () => {
  it('signs the caller\'s OWN tenant channel', async () => {
    const socket = '12345.67890';
    const channel = `private-tenant-${tenant}`;
    const res = await app.inject({ method: 'POST', url: '/v1/pusher/auth', headers: H(tok(tenant)), payload: { socket_id: socket, channel_name: channel } });
    expect(res.statusCode).toBe(200);
    const expected = `${PUSHER.key}:${createHmac('sha256', PUSHER.secret).update(`${socket}:${channel}`).digest('hex')}`;
    expect(res.json().auth).toBe(expected);
  });

  it('rejects another tenant\'s channel (403 — T-16)', async () => {
    const other = randomUUID();
    const res = await app.inject({ method: 'POST', url: '/v1/pusher/auth', headers: H(tok(tenant)), payload: { socket_id: '1.2', channel_name: `private-tenant-${other}` } });
    expect(res.statusCode).toBe(403);
    expect(res.json().error.code).toBe('CHANNEL_FORBIDDEN');
  });

  it('pure authorizeTenantChannel: null on mismatch, signed on match', () => {
    expect(authorizeTenantChannel('1.2', `private-tenant-${randomUUID()}`, tenant)).toBeNull();
    expect(authorizeTenantChannel('1.2', `private-tenant-${tenant}`, tenant)).not.toBeNull();
  });

  it('returns 503 when realtime is not configured', async () => {
    const prev = process.env.PUSHER_SECRET;
    delete process.env.PUSHER_SECRET;
    expect(pusherEnabled()).toBe(false);
    const res = await app.inject({ method: 'POST', url: '/v1/pusher/auth', headers: H(tok(tenant)), payload: { socket_id: '1.2', channel_name: `private-tenant-${tenant}` } });
    expect(res.statusCode).toBe(503);
    expect(res.json().error.code).toBe('REALTIME_DISABLED');
    process.env.PUSHER_SECRET = prev;
  });
});
