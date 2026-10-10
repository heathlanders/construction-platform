// routes/v1/billing.ts — Subscription info + Stripe customer portal
// Locked decisions: PR-01 through PR-08
// Source of truth: Stripe. DB is a read cache updated via webhook.
// Tier enforcement: see services/tier-enforcement.ts

import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { pgPool } from '../../lib/db.js';
import { invalidateSubscriptionCache } from '../../services/tier-enforcement.js';
import { authenticate, requireRole } from '../../plugins/auth-plugin.js';

const STRIPE_API = 'https://api.stripe.com/v1';

// Minimal Stripe REST call — no SDK needed for these two endpoints
async function stripePost(path: string, params: Record<string, string>): Promise<Response> {
  const body = new URLSearchParams(params).toString();
  return fetch(`${STRIPE_API}${path}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Stripe-Version': '2024-04-10',
    },
    body,
  });
}

export async function billingRoutes(app: FastifyInstance): Promise<void> {

  // GET /v1/billing/subscription
  // Returns the tenant's current subscription from DB (cached from Stripe via webhook)
  // Only OWNER and ACCOUNTANT can see billing details
  app.get('/billing/subscription', { preHandler: [authenticate, requireRole('OWNER','ACCOUNTANT')] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { tenant_id } = req.jwt;

      const client = await pgPool.connect();
      try {
        const { rows } = await client.query(
          `SELECT ts.tier, ts.status, ts.addon_gc_module, ts.addon_cross_tenant,
                  ts.current_period_end, ts.stripe_customer_id,
                  t.trial_ends_at, t.name as tenant_name
           FROM tenant_subscriptions ts
           JOIN tenants t ON t.id = ts.tenant_id
           WHERE ts.tenant_id = $1`,
          [tenant_id]
        );

        if (rows.length === 0) {
          // No subscription row yet — still in trial
          return reply.status(200).send({
            subscription: {
              tier: 'professional',
              status: 'trial',
              addons: { gc_module: false, cross_tenant: false },
              current_period_end: null,
              trial_ends_at: null,
            },
          });
        }

        const row = rows[0];
        return reply.status(200).send({
          subscription: {
            tier: row.tier,
            status: row.status,
            addons: {
              gc_module: row.addon_gc_module,
              cross_tenant: row.addon_cross_tenant,
            },
            current_period_end: row.current_period_end,
            trial_ends_at: row.trial_ends_at,
          },
        });
      } finally {
        client.release();
      }
    }
  );

  // POST /v1/billing/portal-session
  // Creates a Stripe customer portal session so the user can manage their subscription
  // Returns a one-time URL valid for 5 minutes
  app.post('/billing/portal-session', { preHandler: [authenticate, requireRole('OWNER','ACCOUNTANT')] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { tenant_id } = req.jwt;

      const client = await pgPool.connect();
      let customerId: string | null = null;
      try {
        const { rows } = await client.query(
          `SELECT stripe_customer_id FROM tenant_subscriptions WHERE tenant_id = $1`,
          [tenant_id]
        );
        customerId = rows[0]?.stripe_customer_id ?? null;
      } finally {
        client.release();
      }

      if (!customerId) {
        return reply.status(422).send({ error:{ code:'NO_STRIPE_CUSTOMER', message:'No billing account found. Please contact support.' } });
      }

      if (!process.env.STRIPE_SECRET_KEY) {
        app.log.error('STRIPE_SECRET_KEY is not set');
        return reply.status(500).send({ error:{ code:'BILLING_UNAVAILABLE', message:'Billing service is not configured' } });
      }

      const returnUrl = `${process.env.APP_URL ?? 'http://localhost:3001'}/settings/billing`;

      const stripeRes = await stripePost('/billing_portal/sessions', {
        customer: customerId,
        return_url: returnUrl,
      });

      if (!stripeRes.ok) {
        const err = await stripeRes.json() as { error?: { message?: string } };
        app.log.error({ stripeError: err }, 'Failed to create Stripe portal session');
        return reply.status(502).send({ error:{ code:'BILLING_ERROR', message:'Unable to create billing portal session' } });
      }

      const session = await stripeRes.json() as { url: string };
      return reply.status(200).send({ portal_url: session.url });
    }
  );

  // POST /v1/billing/checkout
  // Creates a Stripe Checkout Session for new subscriptions (trial → paid conversion)
  // Returns a one-time URL — frontend redirects to Stripe-hosted page
  // Roles: OWNER only
  app.post('/billing/checkout', { preHandler: [authenticate, requireRole('OWNER')] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { tenant_id } = req.jwt;

      // Validate input
      const body = req.body as Record<string, unknown>;
      const tier = body.tier as string | undefined;
      const billingPeriod = (body.billing_period as string | undefined) ?? 'monthly';

      if (!tier || !['starter', 'professional'].includes(tier)) {
        return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: 'tier must be "starter" or "professional"', field: 'tier' } });
      }
      if (!['monthly', 'annual'].includes(billingPeriod)) {
        return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: 'billing_period must be "monthly" or "annual"', field: 'billing_period' } });
      }

      if (!process.env.STRIPE_SECRET_KEY) {
        app.log.error('STRIPE_SECRET_KEY is not set');
        return reply.status(500).send({ error: { code: 'BILLING_UNAVAILABLE', message: 'Billing service is not configured' } });
      }

      // Reject if already on a paid (non-trial) subscription
      const client = await pgPool.connect();
      let customerId: string | null = null;
      try {
        const { rows } = await client.query(
          `SELECT stripe_customer_id, status FROM tenant_subscriptions WHERE tenant_id = $1`,
          [tenant_id]
        );
        if (rows.length > 0) {
          const sub = rows[0];
          if (!['trial', 'grace_period', 'cancelled', 'suspended'].includes(sub.status)) {
            return reply.status(422).send({ error: { code: 'ALREADY_SUBSCRIBED', message: 'Tenant already has an active subscription. Use the billing portal to manage it.' } });
          }
          customerId = sub.stripe_customer_id ?? null;
        }
      } finally {
        client.release();
      }

      // Resolve Stripe price ID from env
      const priceEnvKey = `STRIPE_PRICE_${tier.toUpperCase()}_${billingPeriod.toUpperCase()}`;
      const priceId = process.env[priceEnvKey];
      if (!priceId) {
        app.log.error({ priceEnvKey }, 'Stripe price ID not configured');
        return reply.status(500).send({ error: { code: 'BILLING_UNAVAILABLE', message: 'Pricing not configured for this tier' } });
      }

      const appUrl = process.env.APP_URL ?? 'http://localhost:3001';
      const successUrl = `${appUrl}/settings/billing?checkout=success`;
      const cancelUrl = `${appUrl}/settings/billing?checkout=cancelled`;

      // Build checkout session params (Stripe form encoding with bracket notation)
      const params: Record<string, string> = {
        'mode': 'subscription',
        'line_items[0][price]': priceId,
        'line_items[0][quantity]': '1',
        'success_url': successUrl,
        'cancel_url': cancelUrl,
        'subscription_data[metadata][tenant_id]': tenant_id,
        'subscription_data[metadata][tier]': tier,
      };

      if (customerId) {
        params['customer'] = customerId;
      }

      const stripeRes = await stripePost('/checkout/sessions', params);

      if (!stripeRes.ok) {
        const err = await stripeRes.json() as { error?: { message?: string } };
        app.log.error({ stripeError: err }, 'Failed to create Stripe checkout session');
        return reply.status(502).send({ error: { code: 'BILLING_ERROR', message: 'Unable to create checkout session' } });
      }

      const session = await stripeRes.json() as { url: string };
      return reply.status(200).send({ checkout_url: session.url });
    }
  );

  // POST /v1/billing/invalidate-cache (internal — called by webhook processor after subscription change)
  // Not exposed in the public API docs — used by the Stripe webhook worker
  app.post('/billing/invalidate-cache', { preHandler: [authenticate, requireRole('OWNER')] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { tenant_id } = req.jwt;
      await invalidateSubscriptionCache(tenant_id);
      return reply.status(204).send();
    }
  );
}
