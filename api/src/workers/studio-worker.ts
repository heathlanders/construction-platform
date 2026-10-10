// workers/studio-worker.ts — Design Studio render job (`studio.render`, T-10 envelope carries tenant_id).
//
// Claims a queued render, sends the client's (metadata-stripped) photo + the deterministic prompt to
// the image provider, stores the result in live storage, and meters the call. The provider call runs
// OUTSIDE any DB transaction. Never rethrows: a failed render is a row the client can retry, not a
// pg-boss retry storm that re-bills the provider.

import type { PoolClient } from 'pg';
import { getQueue, type JobEnvelope } from '../lib/queue.js';
import { withTenantContext } from '../lib/tenant-context.js';
import { downloadLiveObject, putLiveObject } from '../lib/storage.js';
import { getImageProvider } from '../lib/studio/providers.js';
import { stripImageMetadata } from '../lib/studio/image-meta.js';
import { recordUsage } from '../lib/studio/metering.js';
import { circuitOpen, recordProviderResult } from '../lib/studio/circuit.js';

async function finish(tenantId: string, renderId: string, fields: { status: string; storage_path?: string | null; error?: string | null; usage?: Parameters<typeof recordUsage>[1] }) {
  await withTenantContext(tenantId, async (c: PoolClient) => {
    const usageId = fields.usage ? await recordUsage(c, fields.usage) : null;
    await c.query(
      `UPDATE design_renders SET status = $2, storage_path = COALESCE($3, storage_path), error = $4, usage_event_id = COALESCE($5, usage_event_id)
        WHERE id = $1`,
      [renderId, fields.status, fields.storage_path ?? null, fields.error ?? null, usageId]);
  });
}

export async function handleStudioRender(tenantId: string, payload: Record<string, unknown>): Promise<void> {
  const renderId = String(payload.render_id ?? '');
  if (!/^[0-9a-f-]{36}$/i.test(renderId)) return;

  // Claim (idempotent: only a queued render runs).
  const claim = await withTenantContext(tenantId, async (c) => {
    const { rows } = await c.query(
      `UPDATE design_renders r SET status = 'running' FROM files f
        WHERE r.id = $1 AND r.status = 'queued' AND r.deleted_at IS NULL AND f.id = r.source_file_id
        RETURNING r.id, r.prompt, r.created_by, r.scope_id, f.storage_path, f.content_type, f.status AS file_status`, [renderId]);
    return rows[0] as { prompt: string; created_by: string; scope_id: string; storage_path: string; content_type: string; file_status: string } | undefined;
  });
  if (!claim) return;

  const provider = getImageProvider();
  if (!provider || claim.file_status !== 'ready') {
    await finish(tenantId, renderId, { status: 'failed', error: provider ? 'photo not ready' : 'provider unavailable' });
    return;
  }
  if (await circuitOpen(provider.name)) {
    await finish(tenantId, renderId, { status: 'failed', error: 'provider temporarily unavailable' });
    return;
  }

  const usageBase = {
    tenantId, userId: claim.created_by, feature: 'studio.render' as const, provider: provider.name,
    unitKind: 'image' as const, subjectType: 'design_render', subjectId: renderId,
  };
  let photo: Buffer;
  try {
    // Metadata strip fails closed (UnsafeImageError) — an unreadable photo is the client's problem,
    // not the provider's, so it must not trip the provider's circuit breaker or meter a call.
    photo = stripImageMetadata(await downloadLiveObject(claim.storage_path));
  } catch (err) {
    await finish(tenantId, renderId, { status: 'failed', error: `photo could not be read: ${(err as Error).message}`.slice(0, 500) });
    return;
  }
  try {
    const result = await provider.edit({ photo, contentType: claim.content_type, prompt: claim.prompt });
    await recordProviderResult(provider.name, result.status !== 'failed');
    if (result.status === 'ok') {
      const ext = result.contentType === 'image/jpeg' ? 'jpg' : 'png';
      const path = `${tenantId}/live/studio/renders/${renderId}.${ext}`;
      await putLiveObject(path, stripImageMetadata(result.image, { passUnknown: true }), result.contentType);
      await finish(tenantId, renderId, { status: 'succeeded', storage_path: path,
        usage: { ...usageBase, model: result.model, costMicroUsd: result.costMicroUsd, status: 'ok' } });
    } else if (result.status === 'blocked') {
      await finish(tenantId, renderId, { status: 'blocked', error: result.reason, usage: { ...usageBase, model: result.model, status: 'blocked' } });
    } else {
      await finish(tenantId, renderId, { status: 'failed', error: result.error.slice(0, 500), usage: { ...usageBase, model: result.model, status: 'failed' } });
    }
  } catch (err) {
    await recordProviderResult(provider.name, false);
    await finish(tenantId, renderId, { status: 'failed', error: (err as Error).message.slice(0, 500),
      usage: { ...usageBase, status: 'failed' } }).catch((e) => console.warn({ e, renderId }, 'studio-worker: could not record failure'));
  }
}

/**
 * Dedicated consumer for the `studio.render` queue (see DEDICATED_QUEUES). Renders are long external
 * calls; on the shared 'jobs' queue (one job at a time) they would stall every other job type.
 * STUDIO_RENDER_CONCURRENCY (default 2) caps parallel provider calls — keep it at 1 for a local GPU.
 */
export async function startStudioRenderWorker(): Promise<void> {
  const boss = await getQueue();
  const n = Number(process.env.STUDIO_RENDER_CONCURRENCY);
  const teamSize = Number.isInteger(n) && n > 0 ? n : 2;
  await boss.work<JobEnvelope>('studio.render', { teamSize, teamConcurrency: teamSize }, async (job) => {
    const { tenant_id, payload } = job.data;
    if (!tenant_id) throw new Error('studio-worker: missing tenant_id in job envelope — dead-lettering'); // T-10
    await handleStudioRender(tenant_id, payload);
  });
  console.info({ teamSize }, 'studio-worker: registered studio.render worker');
}
