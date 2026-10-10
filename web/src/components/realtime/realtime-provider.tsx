'use client';

// realtime-provider.tsx — dashboard-wide cross-tenant realtime (T-15/16/17 client side).
//
// Mounted once in the dashboard layout INSIDE ToastProvider. Subscribes to the tenant's
// private channel via the shared use-tenant-channel singleton (one socket app-wide even
// with per-page hooks also mounted) and:
//   1. Toasts counterparty events (self-authored events are skipped via source_tenant_id).
//   2. Exposes { eventTick } so the top-nav bell can refetch its unread count live.
// Events are notifications only — pages refetch from the API; the toast shows a label, never
// payload data beyond what the whitelisted event already carries.

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/components/ui/toast';
import { useTenantChannel, type SharedEventData } from '@/lib/use-tenant-channel';

interface RealtimeContextValue {
  eventTick: number; // increments on every counterparty shared event
}

const RealtimeContext = createContext<RealtimeContextValue>({ eventTick: 0 });

export function useRealtime(): RealtimeContextValue {
  return useContext(RealtimeContext);
}

// Event family → i18n key under common.realtime.* (fallback: realtime.generic).
const FAMILY_KEYS: [prefix: string, key: string][] = [
  ['rfi.', 'rfi'],
  ['change_order.', 'change_order'],
  ['submittal.', 'submittal'],
  ['invoice.', 'invoice'],
  ['lien_waiver.', 'lien_waiver'],
  ['daily_report.', 'daily_report'],
  ['labor.', 'labor'],
  ['message.sent', 'message'],
  ['note.posted', 'message'],
  ['milestone.', 'milestone'],
  ['schedule.', 'schedule'],
  ['project.location', 'location'],
  ['connection.', 'connection'],
];

function familyKey(eventType: string): string {
  for (const [prefix, key] of FAMILY_KEYS) {
    if (eventType.startsWith(prefix)) return key;
  }
  return 'generic';
}

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation('common');
  const toast = useToast();
  const [eventTick, setEventTick] = useState(0);
  const myTenantRef = useRef<string | null>(null);

  useEffect(() => {
    void fetch('/api/auth/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { tenant_id?: string } | null) => { myTenantRef.current = d?.tenant_id ?? null; })
      .catch(() => {});
  }, []);

  useTenantChannel((data: SharedEventData) => {
    // Skip self-authored events — the author already sees their own action.
    if (data.source_tenant_id && data.source_tenant_id === myTenantRef.current) return;
    const label = t(`realtime.${familyKey(data.event_type)}`, { defaultValue: t('realtime.generic') });
    // Click-through: still a label only (never payload data) — linked to the connection
    // detail page, where the reader's own RLS/bridge-guarded fetch shows the thread.
    toast.info(
      data.connection_id ? (
        <Link href={`/connections/${data.connection_id}`} className="hover:underline">
          {label}
        </Link>
      ) : (
        label
      ),
    );
    setEventTick((n) => n + 1);
  });

  return <RealtimeContext.Provider value={{ eventTick }}>{children}</RealtimeContext.Provider>;
}
