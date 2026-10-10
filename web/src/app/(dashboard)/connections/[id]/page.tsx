'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Select, Input, Textarea, useConfirm } from '@/components/ui';
import { useTenantChannel } from '@/lib/use-tenant-channel';

interface ConnectionPermissions {
  core_events: Record<string, boolean>;
  optional_events: { daily_reports: boolean; rfi_events: boolean; submittal_events: boolean; messages: boolean };
  labor_visibility: { show_total_hours: boolean; show_crew_names: boolean; show_labor_costs: boolean };
  negotiated_at: string | null;
  accepted_by_sub: boolean;
}

interface ProposedPermissions {
  permissions: ConnectionPermissions;
  proposed_by_tenant_id: string;
  proposed_at: string;
}

interface Connection {
  id: string;
  gc_tenant_id: string;
  sub_tenant_id: string;
  gc_tenant_name: string | null;
  sub_tenant_name: string | null;
  status: 'pending' | 'active' | 'revoked' | 'rejected' | 'completed';
  scope_description: string | null;
  contract_value_cents: number | null;
  project_name: string | null;
  your_side: 'gc' | 'sub';
  my_project: { id: string; name: string; status: string } | null;
  permissions: ConnectionPermissions | null;
  proposed_permissions: ProposedPermissions | null;
  closed_reason: string | null;
  closed_at: string | null;
  invited_by: string | null;
  created_at: string;
  updated_at: string;
}

interface CloseoutChecklist { open_rfis: number; open_change_orders: number; open_lien_waivers: number; clear: boolean }

const OPTIONAL_KEYS = ['daily_reports', 'rfi_events', 'submittal_events', 'messages'] as const;
const LABOR_KEYS = ['show_total_hours', 'show_crew_names'] as const;
const REVOKE_REASONS = ['other', 'mutual_agreement', 'terminated_for_cause'] as const;

const DEFAULT_PERMS: ConnectionPermissions = {
  core_events: { task_updates: true, inspection_events: true, invoice_workflow: true, change_orders: true, lien_waivers: true },
  optional_events: { daily_reports: true, rfi_events: true, submittal_events: true, messages: true },
  labor_visibility: { show_total_hours: false, show_crew_names: false, show_labor_costs: false },
  negotiated_at: null,
  accepted_by_sub: true,
};

interface SharedEvent {
  id: string;
  connection_id: string;
  source_tenant_id: string;
  event_type: string;
  payload: Record<string, unknown>;
  created_at: string;
}

interface SharedItem {
  type: 'rfi' | 'change_order' | 'submittal' | 'invoice';
  object_id: string;
  number: number;
  title: string;
  status: string;
  extra: string; // amount ($) for CO, spec section for submittal, due date for invoice
  responses: { text: string; by: string; at: string }[];
}

interface FieldReport {
  report_id: string;
  report_date: string;
  weather: Record<string, unknown> | null;
  notes: string | null;
  updated: boolean;
  at: string;
}

interface LaborRow {
  date: string;
  total_hours: number | null;
  worker_count: number | null;
  crew: { name: string; hours?: number }[] | null;
}

interface LienWaiver {
  waiver_id: string;
  waiver_type: string;
  amount_cents: number | null;
  through_date: string | null;
  note: string | null;
  requested_at: string;
  signed: boolean;
  signed_at: string | null;
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  active: 'bg-green-100 text-green-800',
  completed: 'bg-blue-100 text-blue-800',
  revoked: 'bg-surface-alt text-muted',
  rejected: 'bg-red-100 text-red-700',
};

// Typed generic events (server enforces this whitelist — free-form publish is gone).
const GENERIC_TYPES = ['message.sent', 'note.posted', 'milestone.updated', 'schedule.updated'] as const;
type GenericType = (typeof GENERIC_TYPES)[number];

const WAIVER_TYPES = ['conditional_progress', 'unconditional_progress', 'conditional_final', 'unconditional_final'] as const;

export default function ConnectionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation('connections');
  const confirm = useConfirm();

  const [connection, setConnection] = useState<Connection | null>(null);
  const [events, setEvents] = useState<SharedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState(false);
  const [actionError, setActionError] = useState('');
  const [role, setRole] = useState('');
  const [revokeReason, setRevokeReason] = useState<(typeof REVOKE_REASONS)[number]>('other');

  // Permissions panel (Doc 07 §5)
  const [permDraft, setPermDraft] = useState<ConnectionPermissions>(DEFAULT_PERMS);
  const [permSaving, setPermSaving] = useState(false);
  const [permMsg, setPermMsg] = useState<'' | 'saved' | 'proposed' | 'error'>('');

  // Closeout (Doc 07 §8)
  const [closeout, setCloseout] = useState<CloseoutChecklist | null>(null);
  const [ackIncomplete, setAckIncomplete] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [completeError, setCompleteError] = useState('');

  // Lien waiver card (Doc 07 §5.1)
  const [waiverType, setWaiverType] = useState<(typeof WAIVER_TYPES)[number]>('conditional_progress');
  const [waiverAmount, setWaiverAmount] = useState('');
  const [waiverThrough, setWaiverThrough] = useState('');
  const [waiverNote, setWaiverNote] = useState('');
  const [waiverBusy, setWaiverBusy] = useState(false);
  const [waiverError, setWaiverError] = useState('');

  // Typed publish form
  const [eventType, setEventType] = useState<GenericType>('message.sent');
  const [noteText, setNoteText] = useState('');
  const [titleText, setTitleText] = useState('');
  const [statusText, setStatusText] = useState('');
  const [dateText, setDateText] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState('');
  const [publishSuccess, setPublishSuccess] = useState(false);

  // Response drafts keyed by "type:object_id"
  const [answerDrafts, setAnswerDrafts] = useState<Record<string, string>>({});
  const [decisionDrafts, setDecisionDrafts] = useState<Record<string, string>>({});
  const [answeringId, setAnsweringId] = useState('');

  const loadEvents = useCallback(async () => {
    const res = await fetch(`/api/connections/${id}/events?limit=50`);
    const data = await res.json() as { events?: SharedEvent[] };
    if (data.events) setEvents(data.events);
  }, [id]);

  const loadCloseout = useCallback(async () => {
    const res = await fetch(`/api/connections/${id}/closeout`);
    if (res.ok) {
      const data = await res.json() as { checklist?: CloseoutChecklist };
      if (data.checklist) setCloseout(data.checklist);
    }
  }, [id]);

  const loadConnection = useCallback(async () => {
    const res = await fetch(`/api/connections/${id}`);
    const data = await res.json() as { connection?: Connection };
    if (data.connection) {
      setConnection(data.connection);
      setPermDraft(data.connection.permissions ?? DEFAULT_PERMS);
      // Archived (revoked/completed) bridges stay readable — load history too.
      if (data.connection.status !== 'pending' && data.connection.status !== 'rejected') {
        await loadEvents();
      }
      if (data.connection.status === 'active') await loadCloseout();
    }
  }, [id, loadEvents, loadCloseout]);

  useEffect(() => {
    void loadConnection().finally(() => setLoading(false));
    void fetch('/api/auth/me').then((r) => r.json()).then((d: { role?: string }) => setRole((d.role ?? '').toLowerCase())).catch(() => {});
  }, [loadConnection]);

  // Realtime: refetch when a shared.event for THIS connection arrives (payload is a
  // notification only — the fetch re-runs membership validation server-side).
  useTenantChannel((data) => {
    if (data.connection_id === id) void loadEvents();
  });

  const myTenantId = connection ? (connection.your_side === 'gc' ? connection.gc_tenant_id : connection.sub_tenant_id) : '';
  const iAmGC = connection?.your_side === 'gc';
  const iAmSub = connection?.your_side === 'sub';

  const handleAccept = async () => {
    if (actioning) return;
    setActioning(true);
    setActionError('');
    const res = await fetch(`/api/connections/${id}/accept`, { method: 'POST' });
    if (res.ok) {
      await loadConnection();
    } else {
      const data = await res.json().catch(() => ({})) as { error?: { code?: string } };
      if (data.error?.code === 'ADDON_REQUIRED') setActionError(t('invite.error_addon'));
      else if (data.error?.code === 'PROJECT_LIMIT_REACHED') setActionError(t('detail.project_limit_error'));
      else setActionError(t('detail.action_error'));
    }
    setActioning(false);
  };

  const handleDecline = async () => {
    if (actioning) return;
    const ok = await confirm({
      title: t('detail.decline_confirm_title'),
      message: t('detail.decline_confirm_message'),
      tone: 'danger',
      confirmLabel: t('detail.decline_btn'),
    });
    if (!ok) return;
    setActioning(true);
    setActionError('');
    const res = await fetch(`/api/connections/${id}/decline`, { method: 'POST' });
    if (res.ok) await loadConnection();
    else setActionError(t('detail.action_error'));
    setActioning(false);
  };

  const handleRevoke = async () => {
    if (actioning) return;
    const ok = await confirm({
      title: t('detail.revoke_confirm_title'),
      message: t('detail.revoke_confirm_message'),
      tone: 'danger',
      confirmLabel: t('detail.revoke_btn'),
    });
    if (!ok) return;
    setActioning(true);
    setActionError('');
    const res = await fetch(`/api/connections/${id}/revoke`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason_code: revokeReason }),
    });
    if (res.ok) await loadConnection();
    else setActionError(t('detail.action_error'));
    setActioning(false);
  };

  const canManage = role === 'owner' || role === 'project_manager';

  const savePermissions = async () => {
    if (permSaving) return;
    setPermSaving(true);
    setPermMsg('');
    const res = await fetch(`/api/connections/${id}/permissions`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        core_events: DEFAULT_PERMS.core_events,
        optional_events: permDraft.optional_events,
        labor_visibility: { ...permDraft.labor_visibility, show_labor_costs: false },
      }),
    });
    if (res.ok) {
      const data = await res.json() as { applied?: boolean; proposed?: boolean };
      setPermMsg(data.proposed ? 'proposed' : 'saved');
      await loadConnection();
    } else {
      setPermMsg('error');
    }
    setPermSaving(false);
  };

  const handleConsent = async (accept: boolean) => {
    if (permSaving) return;
    setPermSaving(true);
    setPermMsg('');
    const res = await fetch(`/api/connections/${id}/permissions/consent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accept }),
    });
    if (res.ok) await loadConnection();
    else setPermMsg('error');
    setPermSaving(false);
  };

  const handleComplete = async () => {
    if (completing || !closeout) return;
    const ok = await confirm({
      title: t('closeout.complete_confirm_title'),
      message: t('closeout.complete_confirm_message'),
      confirmLabel: t('closeout.complete_btn'),
    });
    if (!ok) return;
    setCompleting(true);
    setCompleteError('');
    const res = await fetch(`/api/connections/${id}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ acknowledge_incomplete: ackIncomplete }),
    });
    if (res.ok) {
      await loadConnection();
    } else {
      const data = await res.json().catch(() => ({})) as { error?: { code?: string } };
      setCompleteError(data.error?.code === 'CLOSEOUT_INCOMPLETE' ? t('closeout.incomplete_error') : t('detail.action_error'));
      await loadCloseout();
    }
    setCompleting(false);
  };

  const handleWaiverRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (waiverBusy) return;
    setWaiverBusy(true);
    setWaiverError('');
    const amountCents = waiverAmount.trim() ? Math.round(Number(waiverAmount) * 100) : undefined;
    const res = await fetch(`/api/connections/${id}/lien-waiver-request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        waiver_type: waiverType,
        ...(amountCents !== undefined && Number.isFinite(amountCents) ? { amount_cents: amountCents } : {}),
        ...(waiverThrough ? { through_date: waiverThrough } : {}),
        ...(waiverNote.trim() ? { note: waiverNote.trim() } : {}),
      }),
    });
    if (res.ok) {
      setWaiverAmount('');
      setWaiverThrough('');
      setWaiverNote('');
      await loadEvents();
      await loadCloseout();
    } else {
      setWaiverError(t('lien_waiver.error'));
    }
    setWaiverBusy(false);
  };

  const handleWaiverSign = async (waiverId: string) => {
    if (waiverBusy) return;
    setWaiverBusy(true);
    setWaiverError('');
    const res = await fetch(`/api/connections/${id}/lien-waiver-sign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ waiver_id: waiverId }),
    });
    if (res.ok) await loadEvents();
    else setWaiverError(t('lien_waiver.error'));
    setWaiverBusy(false);
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (publishing) return;
    setPublishError('');
    setPublishSuccess(false);

    let payload: Record<string, unknown>;
    if (eventType === 'message.sent') {
      if (!noteText.trim()) return;
      payload = { message: noteText.trim() };
    } else if (eventType === 'note.posted') {
      if (!noteText.trim()) return;
      payload = { note: noteText.trim() };
    } else if (eventType === 'schedule.updated') {
      if (!noteText.trim()) return;
      payload = { note: noteText.trim(), ...(dateText ? { date: dateText } : {}) };
    } else {
      if (!titleText.trim()) return;
      payload = {
        title: titleText.trim(),
        ...(statusText.trim() ? { status: statusText.trim() } : {}),
        ...(dateText ? { date: dateText } : {}),
      };
    }

    setPublishing(true);
    const res = await fetch(`/api/connections/${id}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_type: eventType, payload }),
    });
    if (res.ok) {
      setPublishSuccess(true);
      setNoteText('');
      setTitleText('');
      setStatusText('');
      setDateText('');
      await loadEvents();
    } else {
      setPublishError(t('events.publish_error'));
    }
    setPublishing(false);
  };

  // Post a Sub response for any shared object.
  const handleRespond = async (item: SharedItem) => {
    const key = `${item.type}:${item.object_id}`;
    const note = (answerDrafts[key] ?? '').trim();
    if (answeringId) return;
    let url = '', body: Record<string, unknown> = {};
    if (item.type === 'rfi') {
      if (!note) return;
      url = `/api/connections/${id}/rfi-response`;
      body = { rfi_id: item.object_id, number: item.number, answer: note };
    } else if (item.type === 'change_order') {
      const decision = decisionDrafts[key];
      if (!decision) return;
      url = `/api/connections/${id}/change-order-response`;
      body = { co_id: item.object_id, decision, note: note || undefined };
    } else if (item.type === 'invoice') {
      const decision = decisionDrafts[key];
      if (!decision) return;
      url = `/api/connections/${id}/invoice-response`;
      body = { invoice_id: item.object_id, decision, note: note || undefined };
    } else {
      const decision = decisionDrafts[key];
      if (!decision) return;
      url = `/api/connections/${id}/submittal-response`;
      body = { submittal_id: item.object_id, number: item.number, decision, note: note || undefined };
    }
    setAnsweringId(key);
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (res.ok) {
      setAnswerDrafts(prev => ({ ...prev, [key]: '' }));
      setDecisionDrafts(prev => ({ ...prev, [key]: '' }));
      await loadEvents();
    }
    setAnsweringId('');
  };

  // Derive shared-object threads from the event log (latest header wins; responses append).
  const sharedItems = (() => {
    const map = new Map<string, SharedItem>();
    const put = (type: SharedItem['type'], oid: string, patch: Partial<SharedItem>) => {
      const key = `${type}:${oid}`;
      const cur = map.get(key) ?? { type, object_id: oid, number: 0, title: '', status: '', extra: '', responses: [] };
      map.set(key, { ...cur, ...patch, responses: cur.responses });
    };
    for (const ev of [...events].reverse()) {
      const p = ev.payload as Record<string, unknown>;
      const et = ev.event_type;
      if (et.startsWith('rfi.') && typeof p.rfi_id === 'string') {
        if (et === 'rfi.created' || et === 'rfi.updated') put('rfi', p.rfi_id, { number: Number(p.number ?? 0), title: String(p.subject ?? ''), status: String(p.status ?? '') });
        else if (et === 'rfi.answered') map.get(`rfi:${p.rfi_id}`)?.responses.push({ text: String(p.answer ?? ''), by: ev.source_tenant_id, at: ev.created_at });
      } else if (et.startsWith('change_order.') && typeof p.co_id === 'string') {
        if (et === 'change_order.created' || et === 'change_order.updated') put('change_order', p.co_id, { title: String(p.title ?? ''), status: String(p.status ?? ''), extra: `$${(Number(p.amount_cents ?? 0) / 100).toLocaleString()}` });
        else if (et === 'change_order.responded') map.get(`change_order:${p.co_id}`)?.responses.push({ text: `${p.decision}${p.note ? ` — ${p.note}` : ''}`, by: ev.source_tenant_id, at: ev.created_at });
      } else if (et.startsWith('submittal.') && typeof p.submittal_id === 'string') {
        if (et === 'submittal.created' || et === 'submittal.updated') put('submittal', p.submittal_id, { number: Number(p.number ?? 0), title: String(p.title ?? ''), status: String(p.status ?? ''), extra: p.spec_section ? String(p.spec_section) : '' });
        else if (et === 'submittal.responded') map.get(`submittal:${p.submittal_id}`)?.responses.push({ text: `${p.decision}${p.note ? ` — ${p.note}` : ''}`, by: ev.source_tenant_id, at: ev.created_at });
      } else if (et.startsWith('invoice.') && typeof p.invoice_id === 'string') {
        if (et === 'invoice.submitted') put('invoice', p.invoice_id, { title: `$${(Number(p.amount_cents ?? 0) / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, status: String(p.status ?? ''), extra: p.due_date ? `${t('invoice.due')} ${String(p.due_date).slice(0, 10)}` : '' });
        else if (et === 'invoice.approved' || et === 'invoice.paid') map.get(`invoice:${p.invoice_id}`)?.responses.push({ text: `${p.decision}${p.note ? ` — ${p.note}` : ''}`, by: ev.source_tenant_id, at: ev.created_at });
      }
    }
    return [...map.values()];
  })();

  // Field activity — daily reports (keyed by report_id, last event wins) + labor summaries.
  const fieldReports: FieldReport[] = (() => {
    const map = new Map<string, FieldReport>();
    for (const ev of [...events].reverse()) {
      const p = ev.payload as Record<string, unknown>;
      if ((ev.event_type === 'daily_report.submitted' || ev.event_type === 'daily_report.updated') && typeof p.report_id === 'string') {
        const prev = map.get(p.report_id);
        map.set(p.report_id, {
          report_id: p.report_id,
          report_date: String(p.report_date ?? '').slice(0, 10),
          weather: (p.weather as Record<string, unknown> | null) ?? null,
          notes: p.notes ? String(p.notes) : null,
          updated: ev.event_type === 'daily_report.updated' || prev?.updated === true,
          at: ev.created_at,
        });
      }
    }
    return [...map.values()].sort((a, b) => b.report_date.localeCompare(a.report_date)).slice(0, 10);
  })();

  const laborRows: LaborRow[] = events
    .filter((ev) => ev.event_type === 'labor.summary')
    .map((ev) => {
      const p = ev.payload as Record<string, unknown>;
      return {
        date: String(p.date ?? '').slice(0, 10),
        total_hours: p.total_hours == null ? null : Number(p.total_hours),
        worker_count: p.worker_count == null ? null : Number(p.worker_count),
        crew: (p.crew as LaborRow['crew']) ?? null,
      };
    })
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 14);

  // Derive lien waivers from the ledger — requested keyed by waiver_id, matched by signed.
  const lienWaivers: LienWaiver[] = (() => {
    const map = new Map<string, LienWaiver>();
    for (const ev of [...events].reverse()) {
      const p = ev.payload as Record<string, unknown>;
      if (typeof p.waiver_id !== 'string') continue;
      if (ev.event_type === 'lien_waiver.requested') {
        map.set(p.waiver_id, {
          waiver_id: p.waiver_id,
          waiver_type: String(p.waiver_type ?? ''),
          amount_cents: p.amount_cents == null ? null : Number(p.amount_cents),
          through_date: p.through_date ? String(p.through_date).slice(0, 10) : null,
          note: p.note ? String(p.note) : null,
          requested_at: ev.created_at,
          signed: false,
          signed_at: null,
        });
      } else if (ev.event_type === 'lien_waiver.signed') {
        const w = map.get(p.waiver_id);
        if (w) { w.signed = true; w.signed_at = ev.created_at; }
      }
    }
    return [...map.values()];
  })();

  if (loading) {
    return <div className="text-sm text-muted p-4">{t('list.title')}…</div>;
  }

  if (!connection) {
    return (
      <div className="max-w-2xl">
        <Link href="/connections" className="text-sm text-brand-600 hover:text-brand-700">{t('detail.back')}</Link>
        <p className="mt-4 text-sm text-muted">Connection not found.</p>
      </div>
    );
  }

  const contractDollars = connection.contract_value_cents != null
    ? `$${(connection.contract_value_cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
    : null;

  return (
    <div className="max-w-3xl space-y-6">
      <Link href="/connections" className="text-sm text-brand-600 hover:text-brand-700">{t('detail.back')}</Link>

      {/* Connection header */}
      <div className="bg-surface rounded-lg border border-line p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-3">
              <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLORS[connection.status] ?? ''}`}>
                {t(`list.status_${connection.status}`)}
              </span>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex items-center gap-2">
                <span className="w-8 text-xs font-bold text-muted uppercase">{t('list.gc_label')}</span>
                <span className="truncate font-medium text-ink">{connection.gc_tenant_name ?? connection.gc_tenant_id}</span>
                {iAmGC && <span className="text-xs text-brand-600 font-medium">({t('events.you')})</span>}
              </div>
              <div className="flex items-center gap-2">
                <span className="w-8 text-xs font-bold text-muted uppercase">{t('list.sub_label')}</span>
                <span className="truncate font-medium text-ink">{connection.sub_tenant_name ?? connection.sub_tenant_id}</span>
                {iAmSub && <span className="text-xs text-brand-600 font-medium">({t('events.you')})</span>}
              </div>
            </div>

            <div className="mt-3 space-y-0.5 text-xs text-muted">
              {connection.project_name && (
                <p><span className="font-medium">{t('detail.gc_project_label')}:</span> {connection.project_name}</p>
              )}
              {connection.scope_description && (
                <p><span className="font-medium">{t('detail.scope_label')}:</span> {connection.scope_description}</p>
              )}
              {contractDollars && (
                <p><span className="font-medium">{t('detail.contract_label')}:</span> {contractDollars}</p>
              )}
              <p>{t('detail.connected_since')}: {new Date(connection.created_at).toLocaleDateString()}</p>
              <p className="italic">{iAmGC ? t('detail.you_are_gc') : t('detail.you_are_sub')}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex shrink-0 gap-2">
            {connection.status === 'pending' && iAmSub && (
              <>
                <button
                  onClick={handleAccept}
                  disabled={actioning}
                  className="rounded-md bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                >
                  {actioning ? t('detail.accepting') : t('detail.accept_btn')}
                </button>
                <button
                  onClick={handleDecline}
                  disabled={actioning}
                  className="rounded-md border border-red-300 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  {actioning ? t('detail.declining') : t('detail.decline_btn')}
                </button>
              </>
            )}
            {(connection.status === 'active' || connection.status === 'pending') && (
              <div className="flex flex-col items-end gap-2">
                <button
                  onClick={handleRevoke}
                  disabled={actioning}
                  className="rounded-md border border-red-300 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  {actioning ? t('detail.revoking') : t('detail.revoke_btn')}
                </button>
                <select
                  value={revokeReason}
                  onChange={(e) => setRevokeReason(e.target.value as typeof revokeReason)}
                  className="rounded-md border border-line bg-surface px-2 py-1 text-xs text-muted"
                  aria-label={t('detail.revoke_reason_label')}
                >
                  {REVOKE_REASONS.map((r) => (
                    <option key={r} value={r}>{t(`detail.revoke_reason_${r}`)}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
        {actionError && <p className="mt-3 text-sm text-red-600">{actionError}</p>}
      </div>

      {/* Sub's linked mirror project */}
      {connection.my_project && (
        <div className="bg-surface rounded-lg border border-line p-4 flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase text-muted">{t('detail.my_project_label')}</p>
            <p className="truncate text-sm font-medium text-ink">{connection.my_project.name}</p>
          </div>
          <Link
            href={`/projects/${connection.my_project.id}`}
            className="ml-4 whitespace-nowrap rounded-md border border-line px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:bg-surface-alt"
          >
            {t('detail.open_my_project')}
          </Link>
        </div>
      )}

      {/* Revoked = archived, read-only */}
      {connection.status === 'revoked' && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
          {t('detail.revoked_readonly_note')}
        </div>
      )}

      {/* Completed = closed out, read-only archive (Doc 07 §8) */}
      {connection.status === 'completed' && (
        <div className="rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 dark:border-blue-500/40 dark:bg-blue-500/10 dark:text-blue-200">
          {t('detail.completed_readonly_note')}
        </div>
      )}

      {/* Pending permissions proposal — counterparty decides (Doc 07 §5 re-consent) */}
      {connection.status === 'active' && connection.proposed_permissions && (
        <div className="rounded-md border border-brand-200 bg-brand-50 px-4 py-3 text-sm dark:border-brand-500/40 dark:bg-brand-500/10">
          {connection.proposed_permissions.proposed_by_tenant_id === myTenantId ? (
            <p className="text-ink">{t('permissions.proposal_pending_mine')}</p>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-ink">{t('permissions.proposal_pending_theirs')}</p>
              {canManage && (
                <div className="flex gap-2">
                  <button
                    onClick={() => void handleConsent(true)}
                    disabled={permSaving}
                    className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    {t('permissions.approve_btn')}
                  </button>
                  <button
                    onClick={() => void handleConsent(false)}
                    disabled={permSaving}
                    className="rounded-md border border-red-300 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    {t('permissions.decline_btn')}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Sharing permissions (Doc 07 §5) */}
      {connection.status === 'active' && connection.permissions && (
        <div className="bg-surface rounded-lg border border-line p-5 space-y-4">
          <div>
            <h2 className="text-base font-semibold text-ink">{t('permissions.title')}</h2>
            <p className="text-sm text-muted">{t('permissions.subtitle')}</p>
          </div>

          <div>
            <p className="mb-1 text-xs font-semibold uppercase text-muted">{t('permissions.core_group')}</p>
            <p className="text-xs text-muted mb-2">{t('permissions.locked_on')}</p>
            <div className="flex flex-wrap gap-2">
              {Object.keys(DEFAULT_PERMS.core_events).map((k) => (
                <span key={k} className="inline-flex items-center gap-1 rounded-full bg-surface-alt px-2.5 py-1 text-xs text-muted">
                  🔒 {t(`permissions.core_${k}`)}
                </span>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase text-muted">{t('permissions.optional_group')}</p>
            <div className="space-y-1.5">
              {OPTIONAL_KEYS.map((k) => (
                <label key={k} className="flex items-center gap-2 text-sm text-ink">
                  <input
                    type="checkbox"
                    checked={permDraft.optional_events[k]}
                    disabled={!canManage}
                    onChange={(e) => setPermDraft((prev) => ({
                      ...prev,
                      optional_events: { ...prev.optional_events, [k]: e.target.checked },
                    }))}
                  />
                  {t(`permissions.opt_${k}`)}
                </label>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase text-muted">{t('permissions.labor_group')}</p>
            <div className="space-y-1.5">
              {LABOR_KEYS.map((k) => (
                <label key={k} className="flex items-center gap-2 text-sm text-ink">
                  <input
                    type="checkbox"
                    checked={permDraft.labor_visibility[k]}
                    disabled={!canManage}
                    onChange={(e) => setPermDraft((prev) => ({
                      ...prev,
                      labor_visibility: { ...prev.labor_visibility, [k]: e.target.checked },
                    }))}
                  />
                  {t(`permissions.labor_${k}`)}
                </label>
              ))}
              <label className="flex items-center gap-2 text-sm text-muted">
                <input type="checkbox" checked={false} disabled />
                {t('permissions.labor_show_labor_costs')}
                <span className="text-xs italic">({t('permissions.never_shared')})</span>
              </label>
            </div>
          </div>

          {canManage && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => void savePermissions()}
                disabled={permSaving}
                className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
              >
                {permSaving ? t('permissions.saving') : t('permissions.save_btn')}
              </button>
              {permMsg === 'saved' && <span className="text-sm text-green-600">{t('permissions.saved')}</span>}
              {permMsg === 'proposed' && <span className="text-sm text-brand-600">{t('permissions.proposed_note')}</span>}
              {permMsg === 'error' && <span className="text-sm text-red-600">{t('permissions.error')}</span>}
            </div>
          )}
        </div>
      )}

      {/* Closeout (Doc 07 §8) — GC side, active connections */}
      {connection.status === 'active' && iAmGC && closeout && (
        <div className="bg-surface rounded-lg border border-line p-5 space-y-3">
          <div>
            <h2 className="text-base font-semibold text-ink">{t('closeout.title')}</h2>
            <p className="text-sm text-muted">{t('closeout.subtitle')}</p>
          </div>
          <ul className="space-y-1 text-sm">
            <li className="flex items-center gap-2">
              <span>{closeout.open_rfis === 0 ? '✅' : '⚠️'}</span>
              <span className="text-ink">{t('closeout.open_rfis', { count: closeout.open_rfis })}</span>
            </li>
            <li className="flex items-center gap-2">
              <span>{closeout.open_change_orders === 0 ? '✅' : '⚠️'}</span>
              <span className="text-ink">{t('closeout.open_change_orders', { count: closeout.open_change_orders })}</span>
            </li>
            <li className="flex items-center gap-2">
              <span>{closeout.open_lien_waivers === 0 ? '✅' : '⚠️'}</span>
              <span className="text-ink">{t('closeout.open_lien_waivers', { count: closeout.open_lien_waivers })}</span>
            </li>
          </ul>
          {closeout.clear && <p className="text-sm text-green-600">{t('closeout.all_clear')}</p>}
          {canManage && (
            <div className="space-y-2">
              {!closeout.clear && (
                <label className="flex items-center gap-2 text-sm text-ink">
                  <input type="checkbox" checked={ackIncomplete} onChange={(e) => setAckIncomplete(e.target.checked)} />
                  {t('closeout.ack_label')}
                </label>
              )}
              {completeError && <p className="text-sm text-red-600">{completeError}</p>}
              <button
                onClick={() => void handleComplete()}
                disabled={completing || (!closeout.clear && !ackIncomplete)}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {completing ? t('closeout.completing') : t('closeout.complete_btn')}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Lien waivers (Doc 07 §5.1) — ledger-derived; GC requests, Sub signs */}
      {(connection.status === 'active' || connection.status === 'completed') && (
        <div className="bg-surface rounded-lg border border-line p-5 space-y-4">
          <div>
            <h2 className="text-base font-semibold text-ink">{t('lien_waiver.title')}</h2>
            <p className="text-sm text-muted">{t('lien_waiver.subtitle')}</p>
          </div>

          {lienWaivers.length === 0 ? (
            <p className="text-sm text-muted">{t('lien_waiver.empty')}</p>
          ) : (
            <ul className="divide-y divide-line">
              {lienWaivers.map((w) => (
                <li key={w.waiver_id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink">
                      {t(`lien_waiver.type_${w.waiver_type}`)}
                      {w.amount_cents != null && (
                        <span className="ml-2 font-normal text-muted">${(w.amount_cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      )}
                    </p>
                    <p className="text-xs text-muted">
                      {w.through_date ? `${t('lien_waiver.through_label')} ${w.through_date} · ` : ''}
                      {new Date(w.requested_at).toLocaleDateString()}
                      {w.note ? ` · ${w.note}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {w.signed ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800">
                        ✅ {t('lien_waiver.signed_badge')}
                      </span>
                    ) : (
                      <>
                        <span className="inline-flex rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-semibold text-yellow-800">
                          {t('lien_waiver.open_badge')}
                        </span>
                        {iAmSub && connection.status === 'active' && canManage && (
                          <button
                            onClick={() => void handleWaiverSign(w.waiver_id)}
                            disabled={waiverBusy}
                            className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
                          >
                            {t('lien_waiver.sign_btn')}
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}

          {iAmGC && connection.status === 'active' && canManage && (
            <form onSubmit={handleWaiverRequest} className="space-y-3 border-t border-line pt-4">
              <h3 className="text-sm font-semibold text-ink">{t('lien_waiver.request_title')}</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <Select
                  label={t('lien_waiver.type_label')}
                  value={waiverType}
                  onChange={(e) => setWaiverType(e.target.value as typeof waiverType)}
                >
                  {WAIVER_TYPES.map((wt) => (
                    <option key={wt} value={wt}>{t(`lien_waiver.type_${wt}`)}</option>
                  ))}
                </Select>
                <Input label={t('lien_waiver.amount_label')} type="number" min="0" step="0.01" value={waiverAmount} onChange={(e) => setWaiverAmount(e.target.value)} />
                <Input label={t('lien_waiver.through_label')} type="date" value={waiverThrough} onChange={(e) => setWaiverThrough(e.target.value)} />
                <Input label={t('lien_waiver.note_label')} value={waiverNote} onChange={(e) => setWaiverNote(e.target.value)} maxLength={5000} />
              </div>
              {waiverError && <p className="text-sm text-red-600">{waiverError}</p>}
              <button
                type="submit"
                disabled={waiverBusy}
                className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
              >
                {waiverBusy ? t('lien_waiver.requesting') : t('lien_waiver.request_btn')}
              </button>
            </form>
          )}
        </div>
      )}

      {/* Field activity (Doc 07 §5 — daily reports + labor summaries, read-only) */}
      {(fieldReports.length > 0 || laborRows.length > 0) && (
        <div className="bg-surface rounded-lg border border-line p-5 space-y-4">
          <div>
            <h2 className="text-base font-semibold text-ink">{t('field_activity.title')}</h2>
            <p className="text-sm text-muted">{t('field_activity.subtitle')}</p>
          </div>

          {fieldReports.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase text-muted">{t('field_activity.reports_title')}</p>
              <ul className="divide-y divide-line">
                {fieldReports.map((r) => (
                  <li key={r.report_id} className="py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-ink">{r.report_date}</span>
                      {r.updated && (
                        <span className="inline-flex rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
                          {t('field_activity.updated_badge')}
                        </span>
                      )}
                      {r.weather && Object.keys(r.weather).length > 0 && (
                        <span className="text-xs text-muted truncate">
                          {Object.entries(r.weather).slice(0, 3).map(([k, v]) => `${k}: ${String(v)}`).join(' · ')}
                        </span>
                      )}
                    </div>
                    {r.notes && <p className="mt-0.5 text-sm text-ink">{r.notes.slice(0, 140)}{r.notes.length > 140 ? '…' : ''}</p>}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {laborRows.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase text-muted">{t('field_activity.labor_title')}</p>
              <ul className="divide-y divide-line">
                {laborRows.map((l) => (
                  <li key={l.date} className="py-2.5">
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <span className="font-medium text-ink">{l.date}</span>
                      {l.total_hours != null && (
                        <span className="text-muted">{t('field_activity.hours', { count: l.total_hours })}</span>
                      )}
                      {l.worker_count != null && (
                        <span className="text-muted">{t('field_activity.workers', { count: l.worker_count })}</span>
                      )}
                    </div>
                    {l.crew && l.crew.length > 0 && (
                      <p className="mt-0.5 text-xs text-muted">
                        {t('field_activity.crew_label')}: {l.crew.map((c) => c.hours != null ? `${c.name} (${c.hours}h)` : c.name).join(', ')}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Events — active (live) or revoked/completed (archived history) */}
      {(connection.status === 'active' || connection.status === 'revoked' || connection.status === 'completed') && (
        <div className="space-y-4">
          {sharedItems.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-base font-semibold text-ink">{t('rfi.title')}</h2>
              <p className="text-sm text-muted">{t('rfi.subtitle')}</p>
              <div className="bg-surface rounded-lg border border-line divide-y divide-line">
                {sharedItems.map(item => {
                  const key = `${item.type}:${item.object_id}`;
                  const heading = item.type === 'rfi' ? `${t('rfi.type_rfi')} #${item.number}`
                    : item.type === 'change_order' ? t('rfi.type_co')
                    : item.type === 'invoice' ? t('invoice.thread_label')
                    : `${t('rfi.type_submittal')} #${item.number}`;
                  const decisions = item.type === 'invoice' ? ['approved', 'paid']
                    : item.type === 'submittal' ? ['approved', 'rejected', 'revise'] : ['approved', 'rejected'];
                  // Invoices flow sub→GC: the GC responds. Everything else flows GC→sub.
                  const canRespond = (item.type === 'invoice' ? iAmGC : iAmSub) && connection.status === 'active';
                  const decisionLabel = (d: string) => (item.type === 'invoice' ? t(`invoice.decision_${d}`) : t(`rfi.decision_${d}`));
                  return (
                    <div key={key} className="px-4 py-4">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold text-ink">
                          {heading}{item.extra ? <span className="ml-2 font-normal text-muted">{item.extra}</span> : null}
                        </span>
                        <span className="inline-flex rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">{item.status}</span>
                      </div>
                      <p className="text-sm text-ink mb-2">{item.title}</p>

                      {item.responses.map((r, i) => (
                        <div key={i} className="ml-3 mt-2 border-l-2 border-green-300 pl-3">
                          <p className="text-xs text-muted mb-0.5">
                            {t('rfi.answer_by')} {r.by === myTenantId ? t('events.you') : t('events.other_party')} · {new Date(r.at).toLocaleString()}
                          </p>
                          <p className="text-sm text-ink">{r.text}</p>
                        </div>
                      ))}

                      {canRespond && (
                        <div className="mt-3 space-y-2">
                          {item.type !== 'rfi' && (
                            <div className="flex gap-2">
                              {decisions.map(d => (
                                <button key={d} type="button"
                                  onClick={() => setDecisionDrafts(prev => ({ ...prev, [key]: d }))}
                                  className={`text-xs px-3 py-1 rounded-full border ${decisionDrafts[key] === d ? 'bg-brand-600 text-white border-brand-600' : 'border-line text-muted hover:bg-surface-alt'}`}>
                                  {decisionLabel(d)}
                                </button>
                              ))}
                            </div>
                          )}
                          <div className="flex gap-2">
                            <input type="text"
                              className="flex-1 border border-line rounded-md px-3 py-2 text-sm"
                              placeholder={item.type === 'rfi' ? t('rfi.answer_placeholder') : t('rfi.note_placeholder')}
                              value={answerDrafts[key] ?? ''}
                              onChange={e => setAnswerDrafts(prev => ({ ...prev, [key]: e.target.value }))}
                            />
                            <button
                              onClick={() => handleRespond(item)}
                              disabled={answeringId === key || (item.type === 'rfi' ? !(answerDrafts[key] ?? '').trim() : !decisionDrafts[key])}
                              className="rounded-md bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                            >
                              {answeringId === key ? t('rfi.answering') : t('rfi.answer_btn')}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <h2 className="text-base font-semibold text-ink">{t('events.title')}</h2>
          <p className="text-sm text-muted">{t('events.subtitle')}</p>

          {/* Typed publish form — active connections only */}
          {connection.status === 'active' && (
            <form onSubmit={handlePublish} className="bg-surface rounded-lg border border-line p-5 space-y-3">
              <h3 className="text-sm font-semibold text-ink">{t('events.publish_title')}</h3>
              <div className="max-w-xs">
                <Select
                  label={t('events.type_label')}
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value as GenericType)}
                >
                  <option value="message.sent">{t('events.type_message')}</option>
                  <option value="note.posted">{t('events.type_note')}</option>
                  <option value="milestone.updated">{t('events.type_milestone')}</option>
                  <option value="schedule.updated">{t('events.type_schedule')}</option>
                </Select>
              </div>

              {eventType === 'milestone.updated' ? (
                <div className="grid gap-3 sm:grid-cols-3">
                  <Input label={t('events.title_label')} value={titleText} onChange={(e) => setTitleText(e.target.value)} maxLength={200} required />
                  <Input label={t('events.status_label')} value={statusText} onChange={(e) => setStatusText(e.target.value)} maxLength={50} />
                  <Input label={t('events.date_label')} type="date" value={dateText} onChange={(e) => setDateText(e.target.value)} />
                </div>
              ) : (
                <div className="space-y-3">
                  <Textarea
                    label={t('events.note_label')}
                    rows={2}
                    maxLength={2000}
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    required
                  />
                  {eventType === 'schedule.updated' && (
                    <div className="max-w-xs">
                      <Input label={t('events.date_label')} type="date" value={dateText} onChange={(e) => setDateText(e.target.value)} />
                    </div>
                  )}
                </div>
              )}

              {publishError && <p className="text-sm text-red-600">{publishError}</p>}
              {publishSuccess && <p className="text-sm text-green-600">{t('events.publish_success')}</p>}
              <button
                type="submit"
                disabled={publishing}
                className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
              >
                {publishing ? t('events.publishing') : t('events.publish_btn')}
              </button>
            </form>
          )}

          {/* Events timeline */}
          {events.length === 0 ? (
            <div className="bg-surface rounded-lg border border-line p-6 text-center text-sm text-muted">
              {t('events.no_events')}
            </div>
          ) : (
            <div className="bg-surface rounded-lg border border-line divide-y divide-line">
              {events.map(ev => (
                <div key={ev.id} className="px-4 py-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-ink font-mono">{ev.event_type}</span>
                    <span className="text-xs text-muted">{new Date(ev.created_at).toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-muted mb-2">
                    {t('events.published_by')}: {ev.source_tenant_id === myTenantId ? t('events.you') : t('events.other_party')}
                  </p>
                  <pre className="bg-surface-alt border border-line rounded p-2 text-xs text-ink overflow-auto max-h-32">
                    {JSON.stringify(ev.payload, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
