// lib/pusher.ts — Pusher realtime (Stage 1–2, A-16). Env-gated + dependency-free.
//
// T-15/16: one private channel per tenant — `private-tenant-{tenant_id}`. The channel-auth
// endpoint (routes/v1/pusher-auth.ts) is the ONLY security gate: it signs a private-channel
// subscription ONLY when the requested channel matches the caller's own JWT tenant_id.
// T-17: server fan-out publishes a SCOPED payload to each party's own channel independently
// (see bridge.fanOutSharedEvent) — a source tenant's internals never enter the other's channel.
//
// No `pusher` npm dependency: the private-channel auth signature and the REST trigger are both
// plain HMAC-SHA256 (Pusher's documented scheme), computed with node:crypto + fetch. When the
// PUSHER_* env is unset (or still the placeholder), everything no-ops so the platform runs fine
// without realtime — the feature lights up the moment real credentials land.

import { createHash, createHmac } from 'node:crypto';

interface PusherConfig {
  appId: string;
  key: string;
  secret: string;
  cluster: string;
}

function config(): PusherConfig | null {
  const appId = process.env.PUSHER_APP_ID;
  const key = process.env.PUSHER_KEY;
  const secret = process.env.PUSHER_SECRET;
  const cluster = process.env.PUSHER_CLUSTER;
  if (!appId || !key || !secret || !cluster) return null;
  // Treat the shipped `.env` placeholders as "not configured".
  if ([appId, key, secret].some((v) => v.startsWith('your-pusher'))) return null;
  return { appId, key, secret, cluster };
}

export function pusherEnabled(): boolean {
  return config() !== null;
}

export function tenantChannel(tenantId: string): string {
  return `private-tenant-${tenantId}`;
}

/**
 * Sign a private-channel subscription (T-16). Returns `{ auth }` ONLY when realtime is enabled
 * AND `channel` is exactly the caller's own tenant channel; otherwise null (caller → 403/503).
 * Never signs another tenant's channel — the channel name is checked against the JWT tenant_id.
 */
export function authorizeTenantChannel(socketId: string, channel: string, tenantId: string): { auth: string } | null {
  const cfg = config();
  if (!cfg) return null;
  if (channel !== tenantChannel(tenantId)) return null;
  const signature = createHmac('sha256', cfg.secret).update(`${socketId}:${channel}`).digest('hex');
  return { auth: `${cfg.key}:${signature}` };
}

/**
 * Publish an event to a tenant's private channel via the Pusher REST API. Best-effort:
 * no-ops when disabled, never throws (realtime is a delivery-fallback layer, not the source
 * of truth — the event is already durably in shared_project_events + notifications).
 */
export async function triggerToTenant(tenantId: string, event: string, data: Record<string, unknown>): Promise<void> {
  const cfg = config();
  if (!cfg) return;
  try {
    const path = `/apps/${cfg.appId}/events`;
    const body = JSON.stringify({ name: event, channels: [tenantChannel(tenantId)], data: JSON.stringify(data) });
    const bodyMd5 = createHash('md5').update(body).digest('hex');
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const params = new URLSearchParams({
      auth_key: cfg.key,
      auth_timestamp: timestamp,
      auth_version: '1.0',
      body_md5: bodyMd5,
    });
    // Pusher requires the params sorted for the signature.
    const sortedQs = [...params.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${k}=${v}`).join('&');
    const signature = createHmac('sha256', cfg.secret).update(`POST\n${path}\n${sortedQs}`).digest('hex');
    const url = `https://api-${cfg.cluster}.pusher.com${path}?${sortedQs}&auth_signature=${signature}`;
    await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
  } catch {
    // swallow — realtime is best-effort
  }
}
