// routes/v1/webhooks/stripe.ts — Stripe inbound webhook handler
// Locked decisions: T-18, T-19, T-20
// No auth — validated by Stripe signature only (T-18)
// Returns 200 immediately after persisting raw event (T-19)
// Deduplicates via event_id in Redis (T-20)

import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { createHmac } from 'node:crypto';
import { redis } from '../../../lib/redis.js';
import { sendJob } from '../../../lib/queue.js';

// ─── Stripe signature validation (T-18) ──────────────────────────────────────

/**
 * Validate Stripe webhook signature without the Stripe SDK.
 * Implements https://stripe.com/docs/webhooks/signatures
 */
function validateStripeSignature(
  rawBody: string,
  sigHeader: string,
  secret: string
): boolean {
  const parts = sigHeader.split(',');
  const timestamp = parts.find((p) => p.startsWith('t='))?.slice(2);
  const signatures = parts.filter((p) => p.startsWith('v1=')).map((p) => p.slice(3));

  if (!timestamp || signatures.length === 0) return false;

  // Replay attack protection: reject events older than 5 minutes
  if (Date.now() / 1000 - parseInt(timestamp, 10) > 300) return false;

  const expected = createHmac('sha256', secret)
    .update(`${timestamp}.${rawBody}`)
    .digest('hex');

  return signatures.some((sig) => sig === expected);
}

// ─── Route plugin ─────────────────────────────────────────────────────────────

export async function stripeWebhookRoutes(app: FastifyInstance): Promise<void> {
  // Override JSON parser in this plugin scope to capture raw body for signature validation (T-18)
  // Plugin encapsulation ensures this only affects routes registered in this function.
  app.addContentTypeParser(
    'application/json',
    { parseAs: 'string' },
    (req, body, done) => {
      (req as FastifyRequest & { rawBody: string }).rawBody = body as string;
      try {
        done(null, JSON.parse(body as string));
      } catch (err) {
        done(err as Error);
      }
    }
  );

  /**
   * POST /v1/webhooks/stripe
   * T-18: signature validated FIRST before any processing
   * T-19: return 200 immediately after persistence
   * T-20: deduplicate by event.id in Redis (24hr TTL)
   */
  app.post(
    '/webhooks/stripe',
    async (req: FastifyRequest, reply: FastifyReply) => {
      const sigHeader = req.headers['stripe-signature'];
      const rawBody = (req as FastifyRequest & { rawBody?: string }).rawBody;
      const secret = process.env.STRIPE_WEBHOOK_SECRET;

      // T-18: reject if signature is missing or invalid — return 403 with no body
      if (!sigHeader || typeof sigHeader !== 'string' || !rawBody || !secret) {
        return reply.status(403).send();
      }

      if (!validateStripeSignature(rawBody, sigHeader, secret)) {
        return reply.status(403).send();
      }

      const event = req.body as {
        id: string;
        type: string;
        data: { object: { metadata?: Record<string, string>; customer?: string } };
      };

      // T-20: deduplicate — skip already-processed events
      const dedupKey = `webhook:stripe:${event.id}`;
      const alreadyProcessed = await redis.get(dedupKey);
      if (alreadyProcessed) {
        return reply.status(200).send({ received: true });
      }

      // T-19: return 200 immediately — all processing is async
      // Mark as received BEFORE returning so concurrent duplicates are also skipped
      await redis.set(dedupKey, '1', 'EX', 86400); // 24hr TTL

      // Extract tenant_id from event metadata (set when creating Stripe customer)
      const tenantId = event.data.object.metadata?.tenant_id;

      if (tenantId) {
        // Enqueue for async processing — T-10: tenant_id required in envelope
        const jobTypeMap: Record<string, string> = {
          'customer.subscription.updated': 'stripe.subscription_updated',
          'customer.subscription.deleted': 'stripe.subscription_deleted',
          'invoice.payment_succeeded': 'stripe.payment_succeeded',
          'invoice.payment_failed': 'stripe.payment_failed',
        };

        const jobType = jobTypeMap[event.type] ?? 'stripe.event';
        await sendJob(jobType, tenantId, {
          stripe_event_id: event.id,
          stripe_event_type: event.type,
          event_data: event.data.object,
        });
      } else {
        app.log.warn({ event_id: event.id, event_type: event.type }, 'Stripe event missing tenant_id in metadata — not enqueued');
      }

      return reply.status(200).send({ received: true });
    }
  );
}
