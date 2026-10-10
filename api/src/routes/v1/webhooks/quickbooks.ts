// routes/v1/webhooks/quickbooks.ts — QuickBooks inbound webhook handler
// Locked decisions: T-18, T-19, T-20
// No auth — validated by HMAC signature only (T-18)
// Returns 200 immediately after Redis dedup (T-19)
// Deduplicates per entity event via Redis (T-20)

import { createHmac } from 'node:crypto';
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { redis } from '../../../lib/redis.js';
import { sendJob } from '../../../lib/queue.js';

interface QBEntity {
  name: string;       // 'Invoice', 'Payment', 'Vendor', etc.
  id: string;
  operation: string;  // 'Create', 'Update', 'Delete', 'Merge', 'Void', 'Emailed'
  lastUpdated: string;
}

interface QBWebhookBody {
  eventNotifications: Array<{
    realmId: string;
    dataChangeEvent: {
      entities: QBEntity[];
    };
  }>;
}

export async function quickbooksWebhookRoutes(app: FastifyInstance): Promise<void> {
  // Capture raw body as string for HMAC signature validation (T-18).
  // Plugin encapsulation limits this content type parser to this plugin scope only.
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

  app.post(
    '/webhooks/quickbooks',
    async (req: FastifyRequest, reply: FastifyReply) => {
      const rawBody = (req as FastifyRequest & { rawBody?: string }).rawBody;
      const signature = req.headers['intuit-signature'];
      const secret = process.env.QB_WEBHOOK_VERIFIER_TOKEN;

      // T-18: validate signature FIRST — reject with 403, no body, before any DB write
      if (!signature || typeof signature !== 'string' || !rawBody || !secret) {
        return reply.status(403).send();
      }

      const expected = createHmac('sha256', secret).update(rawBody).digest('base64');
      if (signature !== expected) {
        return reply.status(403).send();
      }

      const body = req.body as QBWebhookBody;

      // T-19: return 200 immediately — all processing is async
      reply.status(200).send({ received: true });

      // Process each notification after responding
      for (const notification of body.eventNotifications ?? []) {
        const { realmId } = notification;
        const entities = notification.dataChangeEvent?.entities ?? [];

        for (const entity of entities) {
          // T-20: deduplicate per entity event — 24hr TTL
          const dedupKey = `webhook:quickbooks:${realmId}:${entity.name}:${entity.id}:${entity.operation}:${entity.lastUpdated}`;
          const alreadyProcessed = await redis.get(dedupKey);
          if (alreadyProcessed) continue;

          await redis.set(dedupKey, '1', 'EX', 86400);

          // realmId used as tenantId in envelope.
          // Worker resolves actual tenant via tenant_subscriptions WHERE quickbooks_realm_id = realmId.
          await sendJob('quickbooks.entity_changed', realmId, {
            realmId,
            entityName: entity.name,
            entityId: entity.id,
            operation: entity.operation,
            lastUpdated: entity.lastUpdated,
          });
        }
      }
    }
  );
}
