// webhooks.test.ts — Stripe webhook signature validation + idempotency
// Tests T-18 (signature first), T-19 (200 immediately), T-20 (deduplicate by event_id)
// Locked decisions: T-18, T-19, T-20

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createHmac } from 'node:crypto';
import Fastify from 'fastify';
import { stripeWebhookRoutes } from '../routes/v1/webhooks/stripe.js';
import { redis } from '../lib/redis.js';

// ─── Test app ─────────────────────────────────────────────────────────────────

const app = Fastify({ logger: false });

// ─── Stripe signature helper ──────────────────────────────────────────────────

const TEST_WEBHOOK_SECRET = 'whsec_test_secret_for_testing_only';

function buildStripeSignature(rawBody: string, timestampOverride?: number): string {
  const timestamp = timestampOverride ?? Math.floor(Date.now() / 1000);
  const payload = `${timestamp}.${rawBody}`;
  const sig = createHmac('sha256', TEST_WEBHOOK_SECRET).update(payload).digest('hex');
  return `t=${timestamp},v1=${sig}`;
}

function buildStripeEvent(eventId: string, type = 'customer.subscription.updated') {
  return {
    id: eventId,
    type,
    data: {
      object: {
        metadata: {
          tenant_id: 'test-tenant-id-not-real',
        },
      },
    },
  };
}

// ─── Setup / teardown ────────────────────────────────────────────────────────

beforeAll(async () => {
  process.env.STRIPE_WEBHOOK_SECRET = TEST_WEBHOOK_SECRET;
  await app.register(stripeWebhookRoutes, { prefix: '/v1' });
  await app.ready();
});

afterAll(async () => {
  await app.close();
  delete process.env.STRIPE_WEBHOOK_SECRET;
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('POST /v1/webhooks/stripe — signature validation (T-18)', () => {
  /**
   * T-18: Signature is the FIRST operation. Invalid sig → 403 with no body.
   */
  it('returns 403 when stripe-signature header is missing', async () => {
    const rawBody = JSON.stringify(buildStripeEvent('evt_missing_sig'));
    const res = await app.inject({
      method: 'POST',
      url: '/v1/webhooks/stripe',
      headers: { 'content-type': 'application/json' },
      body: rawBody,
    });
    expect(res.statusCode).toBe(403);
    expect(res.body).toBe(''); // no body per T-18
  });

  it('returns 403 for a tampered/invalid signature', async () => {
    const rawBody = JSON.stringify(buildStripeEvent('evt_bad_sig'));
    const res = await app.inject({
      method: 'POST',
      url: '/v1/webhooks/stripe',
      headers: {
        'content-type': 'application/json',
        'stripe-signature': 't=9999999999,v1=invalidsignaturehexhere0000000000000000000000000000000000000000',
      },
      body: rawBody,
    });
    expect(res.statusCode).toBe(403);
    expect(res.body).toBe('');
  });

  it('returns 403 for a replayed event (timestamp > 5 minutes old)', async () => {
    const staleTimestamp = Math.floor(Date.now() / 1000) - 400; // 6+ minutes ago
    const rawBody = JSON.stringify(buildStripeEvent('evt_replay'));
    const staleSig = buildStripeSignature(rawBody, staleTimestamp);

    const res = await app.inject({
      method: 'POST',
      url: '/v1/webhooks/stripe',
      headers: {
        'content-type': 'application/json',
        'stripe-signature': staleSig,
      },
      body: rawBody,
    });
    expect(res.statusCode).toBe(403);
  });

  it('returns 200 for a valid signature (T-19 — immediate acknowledgement)', async () => {
    const eventId = `evt_valid_${Date.now()}`;
    const event = buildStripeEvent(eventId);
    const rawBody = JSON.stringify(event);
    const sig = buildStripeSignature(rawBody);

    const res = await app.inject({
      method: 'POST',
      url: '/v1/webhooks/stripe',
      headers: {
        'content-type': 'application/json',
        'stripe-signature': sig,
      },
      body: rawBody,
    });

    // T-19: Return 200 immediately
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.received).toBe(true);

    // Cleanup dedup key
    await redis.del(`webhook:stripe:${eventId}`);
  });
});

describe('POST /v1/webhooks/stripe — idempotency (T-20)', () => {
  /**
   * T-20: Duplicate events with the same event_id must be deduplicated.
   * Second request returns 200 without re-processing.
   */
  it('returns 200 on duplicate event_id without re-processing', async () => {
    const eventId = `evt_dedup_${Date.now()}`;
    // Pre-seed the dedup key in Redis to simulate a previously processed event
    await redis.set(`webhook:stripe:${eventId}`, '1', 'EX', 86400);

    const event = buildStripeEvent(eventId);
    const rawBody = JSON.stringify(event);
    const sig = buildStripeSignature(rawBody);

    const res = await app.inject({
      method: 'POST',
      url: '/v1/webhooks/stripe',
      headers: {
        'content-type': 'application/json',
        'stripe-signature': sig,
      },
      body: rawBody,
    });

    // T-20: Duplicate is acknowledged but NOT re-processed
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.received).toBe(true);

    // Cleanup
    await redis.del(`webhook:stripe:${eventId}`);
  });

  it('dedup key is set in Redis after first valid event (prevents future duplicates)', async () => {
    const eventId = `evt_dedup_check_${Date.now()}`;
    const event = buildStripeEvent(eventId, 'invoice.payment_succeeded');
    const rawBody = JSON.stringify(event);
    const sig = buildStripeSignature(rawBody);

    // Verify key doesn't exist before
    const before = await redis.get(`webhook:stripe:${eventId}`);
    expect(before).toBeNull();

    await app.inject({
      method: 'POST',
      url: '/v1/webhooks/stripe',
      headers: {
        'content-type': 'application/json',
        'stripe-signature': sig,
      },
      body: rawBody,
    });

    // Key must now exist in Redis (T-20 — 24hr TTL)
    const after = await redis.get(`webhook:stripe:${eventId}`);
    expect(after).toBe('1');

    // Cleanup
    await redis.del(`webhook:stripe:${eventId}`);
  });
});
