'use client';

// use-tenant-channel.ts — subscribe to this tenant's private realtime channel (T-15/16).
//
// Env-gated: a graceful NO-OP unless NEXT_PUBLIC_PUSHER_KEY is set to a real key. The channel
// auth goes through /api/pusher/auth (cookie → Bearer), which signs ONLY the caller's own
// `private-tenant-{tenant_id}` channel (T-16) and returns 503 REALTIME_DISABLED when the server
// side is unconfigured — subscription errors are swallowed, existing manual refresh keeps working.
//
// Events are notifications, not data transfers: handlers should REFETCH from the API
// (auth/RLS enforced on the fetch), never trust the event payload as authoritative.
//
// SINGLETON: one Pusher socket per browser session shared by every subscriber. The app-wide
// RealtimeProvider plus per-page hooks (connections detail, map) would otherwise each open
// their own WebSocket + auth call. Handlers register in a set; the socket connects on the
// first subscriber and disconnects when the last unmounts.

import { useEffect, useRef } from 'react';

export interface SharedEventData {
  connection_id: string;
  event_type: string;
  payload: Record<string, unknown>;
  source_tenant_id?: string | null; // authoring tenant — lets clients skip self-authored toasts
}

type Handler = (data: SharedEventData) => void;

const PUSHER_KEY = process.env.NEXT_PUBLIC_PUSHER_KEY;
const PUSHER_CLUSTER = process.env.NEXT_PUBLIC_PUSHER_CLUSTER ?? 'us2';

function realtimeConfigured(): boolean {
  return !!PUSHER_KEY && !PUSHER_KEY.startsWith('your-pusher');
}

// ── Module-level shared connection ──────────────────────────────────────────
const handlers = new Set<Handler>();
let refCount = 0;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let pusher: any = null;
let connecting = false;

async function ensureConnected(): Promise<void> {
  if (pusher || connecting || !realtimeConfigured()) return;
  connecting = true;
  try {
    const meRes = await fetch('/api/auth/me');
    if (!meRes.ok) return;
    const me = (await meRes.json()) as { tenant_id?: string };
    // Bail if everyone unmounted while we awaited, or no tenant.
    if (!me.tenant_id || refCount === 0) return;

    const { default: Pusher } = await import('pusher-js');
    pusher = new Pusher(PUSHER_KEY as string, {
      cluster: PUSHER_CLUSTER,
      channelAuthorization: { endpoint: '/api/pusher/auth', transport: 'ajax' },
    });
    const channel = pusher.subscribe(`private-tenant-${me.tenant_id}`);
    // 403 CHANNEL_FORBIDDEN / 503 REALTIME_DISABLED land here — silently degrade to polling.
    channel.bind('pusher:subscription_error', () => undefined);
    channel.bind('shared.event', (data: SharedEventData) => {
      for (const h of handlers) {
        try { h(data); } catch { /* one bad handler never breaks the rest */ }
      }
    });
  } catch {
    // realtime is best-effort — never break the page
  } finally {
    connecting = false;
    // If the last subscriber left mid-connect, tear down.
    if (refCount === 0) teardown();
  }
}

function teardown(): void {
  try { pusher?.disconnect(); } catch { /* ignore */ }
  pusher = null;
}

/**
 * Subscribe to `private-tenant-{own tenant}` and invoke `onSharedEvent` for every
 * cross-tenant `shared.event`. Safe to mount app-wide (RealtimeProvider) AND per-page —
 * all subscribers share one socket.
 */
export function useTenantChannel(onSharedEvent?: (data: SharedEventData) => void): void {
  // Keep the latest handler without resubscribing on every render.
  const handlerRef = useRef(onSharedEvent);
  handlerRef.current = onSharedEvent;

  useEffect(() => {
    if (!realtimeConfigured()) return;
    const stable: Handler = (data) => handlerRef.current?.(data);
    handlers.add(stable);
    refCount++;
    void ensureConnected();
    return () => {
      handlers.delete(stable);
      refCount--;
      if (refCount === 0) teardown();
    };
  }, []);
}
