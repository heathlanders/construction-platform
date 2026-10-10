// queue.ts — pg-boss job queue initialization + sendJob helper
// Locked decisions: A-14, T-10
//
// Stage 1–2 (DigitalOcean): pg-boss — PostgreSQL-backed, zero extra infra
// Stage 3+ (AWS, 300+ tenants): swap to SQS via environment variable
// Same envelope + same worker interface both stages (A-14)

import PgBoss from 'pg-boss';
import { randomUUID } from 'node:crypto';

// T-10: Every job MUST carry tenant_id. Workers dead-letter jobs missing it.
export interface JobEnvelope {
  tenant_id: string;       // ALWAYS required — dead-letter if missing (T-10)
  job_type: string;
  job_id: string;          // UUID v4
  created_at: string;      // ISO 8601
  payload: Record<string, unknown>;
}

// pg-boss uses direct DATABASE_URL (not PgBouncer) for its internal schema
let _boss: PgBoss | null = null;

export async function getQueue(): Promise<PgBoss> {
  if (_boss) return _boss;

  _boss = new PgBoss({
    connectionString: process.env.DATABASE_URL!,
    // Retry failed jobs 3 times with exponential backoff before DLQ (T-21)
    retryLimit: 3,
    retryDelay: 30,
    retryBackoff: true,
  });

  _boss.on('error', (err) => {
    console.error('pg-boss error:', err);
  });

  await _boss.start();
  return _boss;
}

/**
 * Job types with their OWN queue + consumer instead of the shared 'jobs' switch. The 'jobs' consumer
 * runs one job at a time (pg-boss v9 teamSize 1), so a slow job type would stall file scans, pushes,
 * payroll and geocoding for every tenant. Long external calls go here. Same envelope (T-10).
 */
export const DEDICATED_QUEUES: Record<string, string> = {
  'studio.render': 'studio.render', // image providers: up to STUDIO_IMAGE_TIMEOUT_MS (~15 min local)
};

/**
 * Send a background job.
 * T-10: tenant_id is required — throws if missing so the bug surfaces at call site.
 */
export async function sendJob(
  jobType: string,
  tenantId: string,
  payload: Record<string, unknown>
): Promise<void> {
  if (!tenantId) {
    throw new Error('sendJob: tenant_id is required (T-10)');
  }

  const queue = await getQueue();
  await queue.send(
    DEDICATED_QUEUES[jobType] ?? 'jobs',
    {
      tenant_id: tenantId,
      job_type: jobType,
      job_id: randomUUID(),
      created_at: new Date().toISOString(),
      payload,
    } satisfies JobEnvelope,
    // Blueprint OCR of large multi-page scans can run many minutes — pg-boss's
    // default ~15-min expiration would expire the in-flight job and retry it,
    // causing a re-OCR storm. Allow up to 1 hour before a job is considered expired.
    { expireInSeconds: 3600 },
  );
}

/**
 * Graceful shutdown — called on SIGTERM/SIGINT.
 * Stops accepting new jobs and waits for in-flight workers to finish.
 */
export async function stopQueue(): Promise<void> {
  if (_boss) {
    await _boss.stop();
    _boss = null;
  }
}
