// routes/v1/webhooks/docusign.ts — DocuSign inbound webhook handler
// Locked decisions: T-18, T-19, T-20
// No auth — validated by HMAC signature only (T-18)
// Returns 200 immediately after Redis dedup (T-19)
// Deduplicates per envelope+event via Redis (T-20)

import { createHmac } from 'node:crypto';
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { redis } from '../../../lib/redis.js';
import { sendJob } from '../../../lib/queue.js';

interface DocuSignWebhookBody {
  event: string;  // 'envelope-completed', 'envelope-voided', 'envelope-declined', 'envelope-sent'
  data: {
    accountId: string;
    envelopeSummary: {
      envelopeId: string;
      status: string;
      customFields?: {
        textCustomFields?: Array<{ name: string; value: string }>;
      };
    };
  };
}

const EVENT_JOB_MAP: Record<string, string> = {
  'envelope-completed': 'docusign.envelope_completed',
  'envelope-voided':    'docusign.envelope_voided',
  'envelope-declined':  'docusign.envelope_declined',
  'envelope-sent':      'docusign.envelope_sent',
};

export async function docusignWebhookRoutes(app: FastifyInstance): Promise<void> {
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
    '/webhooks/docusign',
    async (req: FastifyRequest, reply: FastifyReply) => {
      const rawBody = (req as FastifyRequest & { rawBody?: string }).rawBody;
      const signature = req.headers['x-docusign-signature-1'];
      const secret = process.env.DOCUSIGN_HMAC_KEY;

      // T-18: validate signature FIRST — reject with 403, no body
      if (!signature || typeof signature !== 'string' || !rawBody || !secret) {
        return reply.status(403).send();
      }

      const expected = createHmac('sha256', secret).update(rawBody).digest('base64');
      if (signature !== expected) {
        return reply.status(403).send();
      }

      const body = req.body as DocuSignWebhookBody;
      const envelopeId = body.data?.envelopeSummary?.envelopeId;
      const event = body.event;

      // T-19: return 200 immediately
      reply.status(200).send({ received: true });

      // T-20: deduplicate per envelope+event
      const dedupKey = `webhook:docusign:${envelopeId}:${event}`;
      const alreadyProcessed = await redis.get(dedupKey);
      if (alreadyProcessed) return;
      await redis.set(dedupKey, '1', 'EX', 86400);

      // Extract tenant_id from envelope custom fields
      const tenantId = body.data?.envelopeSummary?.customFields?.textCustomFields
        ?.find((f) => f.name === 'tenant_id')?.value;

      if (!tenantId) {
        // DocuSign may fire before tenant_id is stamped on the envelope — skip silently
        app.log.warn({ envelopeId, event }, 'docusign: no tenant_id in envelope custom fields — skipping');
        return;
      }

      const jobType = EVENT_JOB_MAP[event] ?? 'docusign.event';
      await sendJob(jobType, tenantId, {
        envelopeId,
        event,
        accountId: body.data?.accountId,
        status: body.data?.envelopeSummary?.status,
      });
    }
  );
}
