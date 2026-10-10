# Background Jobs Skill
**Locked decisions: T-10, T-18, T-19, T-20, T-21, T-22, T-23, A-14**

## Job queue by infrastructure stage (A-14)
- **Stage 1–2 (DigitalOcean):** pg-boss — PostgreSQL-backed job queue, zero extra infra
- **Stage 3+ (AWS, 300+ tenants):** AWS SQS — swap via environment variable, no code change

Both stages use the **same message envelope** and **same worker pattern** — the queue provider
is abstracted behind a thin interface. See the stage-specific sections below.

## Message envelope (required at all stages) (T-10)
Every job MUST include `tenant_id` in the envelope. Workers missing `tenant_id` must
be dead-lettered — never processed.

```typescript
interface JobEnvelope {
  tenant_id: string;      // ALWAYS present — dead-letter if missing
  job_type: string;
  job_id: string;         // UUID v4
  created_at: string;     // ISO 8601
  payload: Record<string, unknown>;
}
```

## Stage 1–2: pg-boss pattern (A-14)

```typescript
import PgBoss from 'pg-boss';

const boss = new PgBoss(process.env.DATABASE_URL);
await boss.start();

// Sending a job
await boss.send('job-queue', {
  tenant_id: tenantId,
  job_type: 'sync_quickbooks',
  job_id: crypto.randomUUID(),
  created_at: new Date().toISOString(),
  payload: { ... }
} satisfies JobEnvelope);

// Processing a job
await boss.work('job-queue', async (job) => {
  const { tenant_id, job_type, payload } = job.data as JobEnvelope;

  if (!tenant_id) {
    throw new Error('Missing tenant_id — job will dead-letter');
  }

  await withTenantContext(tenant_id, async (client) => {
    await processJob(job_type, payload, client);
  });
});

// Dead-letter: pg-boss moves failed jobs to {queue}__failed after max retries
// Monitor via: SELECT * FROM pgboss.job WHERE state = 'failed';
```

## Stage 3+: SQS pattern (A-14)

```typescript
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';

const sqs = new SQSClient({ region: process.env.AWS_REGION });

// Sending a job
await sqs.send(new SendMessageCommand({
  QueueUrl: process.env.JOB_QUEUE_URL,
  MessageBody: JSON.stringify({
    tenant_id: tenantId,
    job_type: 'sync_quickbooks',
    job_id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
    payload: { ... }
  } satisfies JobEnvelope),
}));

// Processing a job
const worker = async (message: { Body: string }) => {
  const envelope = JSON.parse(message.Body) as JobEnvelope;

  if (!envelope.tenant_id) {
    // Dead-letter — do not process
    throw new Error('Missing tenant_id in job envelope');
  }

  await withTenantContext(envelope.tenant_id, async (client) => {
    await processJob(envelope.job_type, envelope.payload, client);
  });
};
```

## Dead-letter queue (DLQ)
- **pg-boss:** Failed jobs land in `pgboss.job` with `state = 'failed'` after max retries
- **SQS:** Every queue has a paired DLQ; messages arrive after 3 failed attempts
- Alert fires when DLQ depth > 0 (CloudWatch for SQS, pg-boss failed job count for Stage 1–2)
- Super admin can inspect and replay DLQ messages

## Inbound webhooks (T-18, T-19, T-20)
One endpoint per provider. Async processing.
```typescript
// Webhook handler pattern
POST /v1/webhooks/quickbooks
POST /v1/webhooks/stripe
POST /v1/webhooks/docusign

// 1. Validate signature FIRST (reject invalid — don't process)
// 2. Return 200 immediately (async processing)
// 3. Enqueue message with event_id for deduplication
// 4. Worker processes — deduplicate by event_id before acting
```

## Event ID deduplication (T-19)
```typescript
// Before processing any webhook event
const alreadyProcessed = await redis.get(`webhook:${event_id}`);
if (alreadyProcessed) return; // idempotent — safe to skip

// Process...
await redis.set(`webhook:${event_id}`, '1', 'EX', 86400); // 24hr TTL
```

## External integration resilience (T-21, T-22, T-23)
Exponential backoff with jitter:
```typescript
const delay = Math.min(1000 * 2 ** attempt, 30000) + Math.random() * 1000;
```

Per-integration circuit breaker:
- Open after 5 consecutive failures
- Half-open after 60s cooldown
- Close after 2 successful requests

When a circuit is open:
- Queue operations for later (don't drop them)
- Proactively notify affected tenants
