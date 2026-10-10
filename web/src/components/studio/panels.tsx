'use client';

// Design Studio side panels: AI assistant (suggestions only), concept pictures, budget range and the
// "what it takes" checklist. All copy via the `studio` namespace; trade content (labels, reasons,
// requirement text) arrives bilingual from the API.

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui';
import type { FieldDef, PhotoDto, RenderDto, Requirement, Suggestion } from './types';
import { apiError, bi, money } from './types';

// ── AI assistant ───────────────────────────────────────────────────────────────

export function AiAssistant({ base, fields, suggestions, canAssess, canGuide, disabled, onScope }: {
  base: string; // …/requests/:id/scopes/:sid
  fields: FieldDef[];
  suggestions: Suggestion[];
  canAssess: boolean;
  canGuide: boolean;
  disabled?: boolean;
  onScope: (scope: unknown, acceptedFields?: string[]) => void;
}) {
  const { t, i18n } = useTranslation('studio');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState<'' | 'guide' | 'assess' | 'accept'>('');
  const [note, setNote] = useState('');
  const [list, setList] = useState<Suggestion[]>(suggestions);
  useEffect(() => setList(suggestions), [suggestions]);
  if (!canGuide && !canAssess) return null;

  const byId = new Map(fields.map((f) => [f.id, f]));
  const valueLabel = (s: Suggestion) => {
    const f = byId.get(s.field);
    if (f?.options) {
      const vals = Array.isArray(s.value) ? s.value : [s.value];
      return vals.map((v) => f.options!.find((o) => o.value === v)?.label ?? String(v)).join(', ');
    }
    if (typeof s.value === 'boolean') return s.value ? t('fields.yes') : t('fields.no');
    if (s.value && typeof s.value === 'object') {
      const a = s.value as Record<string, number>;
      if (a.length_ft && a.width_ft) return `${a.length_ft} × ${a.width_ft} ft`;
    }
    return String(s.value);
  };

  async function run(mode: 'guide' | 'assess') {
    setBusy(mode); setNote('');
    const res = await fetch(`${base}/ai/${mode}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mode === 'guide' ? { message } : {}),
    });
    setBusy('');
    if (!res.ok) { setNote(res.status === 503 ? t('ai.unavailable') : await apiError(res, t('ai.unavailable'))); return; }
    const d = await res.json();
    setList(d.suggestions);
    if (!d.suggestions.length) setNote(t('ai.no_suggestions'));
    if (mode === 'guide') setMessage('');
  }

  async function accept(fieldsToAccept: string[]) {
    setBusy('accept');
    const res = await fetch(`${base}/suggestions/accept`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fields: fieldsToAccept }),
    });
    setBusy('');
    if (res.ok) {
      const d = await res.json();
      setList((l) => l.filter((s) => !fieldsToAccept.includes(s.field)));
      onScope(d.scope, fieldsToAccept);
    }
  }

  return (
    <div className="space-y-3 rounded-lg border border-brand-500/30 bg-brand-50 p-4">
      <p className="text-sm font-semibold text-ink">{t('ai.title')}</p>
      {canGuide && (
        <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (message.trim()) run('guide'); }}>
          <input
            className="min-w-0 flex-1 rounded-md border border-line bg-surface px-3 py-2 text-sm" maxLength={1000} disabled={disabled}
            placeholder={t('ai.placeholder')} value={message} onChange={(e) => setMessage(e.target.value)}
          />
          <Button type="submit" size="sm" loading={busy === 'guide'} disabled={disabled || !message.trim()}>{t('ai.ask')}</Button>
        </form>
      )}
      {canAssess && (
        <Button type="button" variant="secondary" size="sm" loading={busy === 'assess'} disabled={disabled} onClick={() => run('assess')}>
          {busy === 'assess' ? t('ai.assessing') : t('ai.assess')}
        </Button>
      )}
      {note && <p className="text-sm text-muted">{note}</p>}
      {list.length > 0 && (
        <ul className="space-y-2">
          {list.map((s) => (
            <li key={s.field} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-line bg-surface p-3">
              <div className="min-w-0">
                <p className="text-sm text-ink"><span className="text-muted">{byId.get(s.field)?.label ?? s.field}:</span> <strong>{valueLabel(s)}</strong></p>
                {bi(s.reason, i18n.language) && <p className="text-xs text-muted">{bi(s.reason, i18n.language)}</p>}
                {s.provenance === 'photo_estimate' && <p className="text-xs text-status-warning">{t('ai.estimate_note')}</p>}
              </div>
              <Button type="button" size="sm" variant="secondary" disabled={disabled || busy === 'accept'} onClick={() => accept([s.field])}>{t('ai.accept')}</Button>
            </li>
          ))}
          {list.length > 1 && (
            <Button type="button" size="sm" disabled={disabled || busy === 'accept'} onClick={() => accept(list.map((s) => s.field))}>{t('ai.accept_all')}</Button>
          )}
        </ul>
      )}
    </div>
  );
}

// ── Concept pictures ───────────────────────────────────────────────────────────

export function RendersPanel({ base, photos, renders, selectedId, enabled, disabled, onScope, refresh }: {
  base: string;
  photos: PhotoDto[];
  renders: RenderDto[];
  selectedId: string | null;
  enabled: boolean;
  disabled?: boolean;
  onScope: (scope: unknown) => void;
  refresh: () => void;
}) {
  const { t } = useTranslation('studio');
  const ready = photos.filter((p) => p.status === 'ready' && p.url);
  const [photo, setPhoto] = useState<string>('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const pending = renders.some((r) => r.status === 'queued' || r.status === 'running');

  useEffect(() => {
    if (!pending) return;
    const id = setInterval(refresh, 3000);
    return () => clearInterval(id);
  }, [pending, refresh]);
  useEffect(() => { if (!photo && ready[0]) setPhoto(ready[0].id); }, [ready, photo]);

  if (!enabled) return <p className="text-sm text-muted">{t('renders.unavailable')}</p>;

  async function make() {
    setBusy(true); setError('');
    const res = await fetch(`${base}/renders`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ photo_file_id: photo }) });
    setBusy(false);
    if (!res.ok) { setError(await apiError(res, t('renders.failed'))); return; }
    refresh();
  }

  async function choose(id: string) {
    const res = await fetch(`${base}/selected-render`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ render_id: id }) });
    if (res.ok) onScope((await res.json()).scope);
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">{t('renders.intro')}</p>
      {ready.length === 0 ? <p className="text-sm text-muted">{t('renders.need_photo')}</p> : (
        <>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {ready.map((p) => (
              <button
                key={p.id} type="button" onClick={() => setPhoto(p.id)} aria-pressed={photo === p.id}
                className={`h-20 w-20 shrink-0 overflow-hidden rounded-md border-2 ${photo === p.id ? 'border-brand-600' : 'border-transparent'}`}
              >
                <img src={p.url!} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
          <Button type="button" loading={busy || pending} disabled={disabled || !photo} onClick={make}>
            {busy || pending ? t('renders.making') : t('renders.make')}
          </Button>
        </>
      )}
      {error && <p className="text-sm text-status-danger">{error}</p>}
      <div className="grid gap-3 sm:grid-cols-2">
        {renders.filter((r) => r.status !== 'queued' && r.status !== 'running').slice().reverse().map((r) => (
          <figure key={r.id} className={`overflow-hidden rounded-lg border ${selectedId === r.id ? 'border-brand-600 ring-2 ring-brand-600' : 'border-line'}`}>
            {r.status === 'succeeded' && r.url ? <img src={r.url} alt="" className="aspect-[4/3] w-full bg-surface-alt object-cover" /> : (
              <div className="flex aspect-[4/3] items-center justify-center bg-surface-alt p-4 text-center text-sm text-muted">
                {r.status === 'blocked' ? t('renders.blocked') : t('renders.failed')}
              </div>
            )}
            {r.status === 'succeeded' && (
              <figcaption className="flex items-center justify-between p-2">
                {selectedId === r.id
                  ? <span className="text-sm font-medium text-brand-700">{t('renders.chosen')}</span>
                  : <Button type="button" size="sm" variant="secondary" disabled={disabled} onClick={() => choose(r.id)}>{t('renders.choose')}</Button>}
              </figcaption>
            )}
          </figure>
        ))}
      </div>
      <p className="text-xs text-muted">{t('renders.disclaimer')}</p>
    </div>
  );
}

// ── Range + checklist ──────────────────────────────────────────────────────────

export function RangeCard({ range }: { range: { low_cents: number; high_cents: number } | null }) {
  const { t, i18n } = useTranslation('studio');
  return (
    <div className="rounded-lg border border-line bg-surface p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">{t('range.title')}</p>
      {range ? (
        <>
          <p className="mt-1 text-2xl font-semibold text-ink">{t('range.between', { low: money(range.low_cents, i18n.language), high: money(range.high_cents, i18n.language) })}</p>
          <p className="mt-1 text-xs text-muted">{t('range.note')}</p>
        </>
      ) : <p className="mt-1 text-sm text-muted">{t('range.pending')}</p>}
    </div>
  );
}

const LEVEL_CLS: Record<string, string> = {
  required: 'bg-status-danger-bg text-status-danger',
  likely: 'bg-status-warning-bg text-status-warning',
  info: 'bg-status-info-bg text-status-info',
};

export function RequirementsList({ items }: { items: Requirement[] }) {
  const { t, i18n } = useTranslation('studio');
  if (!items.length) return null;
  const order = { required: 0, likely: 1, info: 2 } as const;
  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-ink">{t('requirements.title')}</p>
      <ul className="space-y-2">
        {[...items].sort((a, b) => order[a.level] - order[b.level]).map((r) => (
          <li key={r.id} className="rounded-md border border-line bg-surface p-3">
            <div className="flex items-center justify-between gap-2">
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${LEVEL_CLS[r.level]}`}>{t(`requirements.level_${r.level}`)}</span>
              <span className="text-xs text-muted">{t(`requirements.owner_${r.owner}`)}</span>
            </div>
            <p className="mt-1.5 text-sm font-medium text-ink">{bi(r.title, i18n.language)}</p>
            <p className="mt-1 text-sm text-muted">{bi(r.body, i18n.language)}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Proposal (P4) ──────────────────────────────────────────────────────────────

export interface ProposalView {
  estimate_id: string; total_cents: number; generated_at: string; download_url: string | null;
  response: 'accepted' | 'changes_requested' | null; responded_at: string | null; note: string | null;
}

export function ProposalCard({ requestId, proposal, onChange }: { requestId: string; proposal: ProposalView; onChange: (p: ProposalView) => void }) {
  const { t, i18n } = useTranslation('studio');
  const [mode, setMode] = useState<'' | 'changes'>('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function respond(response: 'accepted' | 'changes_requested') {
    if (response === 'changes_requested' && !note.trim()) { setError(t('proposal.note_required')); return; }
    setBusy(true); setError('');
    const res = await fetch(`/api/v1/client-portal/studio/requests/${requestId}/proposal/respond`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(response === 'accepted' ? { response } : { response, note }),
    });
    setBusy(false);
    if (!res.ok) { setError(await apiError(res, t('start.error'))); return; }
    onChange((await res.json()).proposal);
  }

  return (
    <div className="space-y-3 rounded-lg border border-brand-500/40 bg-surface p-4">
      <p className="text-sm font-semibold text-ink">{t('proposal.title')}</p>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-sm text-muted">{t('proposal.total')}</span>
        <span className="text-2xl font-semibold text-ink">{money(proposal.total_cents, i18n.language)}</span>
      </div>
      {proposal.download_url && (
        <a href={proposal.download_url} target="_blank" rel="noreferrer" className="inline-block text-sm font-medium text-brand-700 hover:underline">{t('proposal.view_pdf')} ↗</a>
      )}
      {proposal.response === 'accepted' && <p className="rounded-md bg-status-success-bg p-3 text-sm text-status-success">{t('proposal.accepted')}</p>}
      {proposal.response === 'changes_requested' && <p className="rounded-md bg-status-info-bg p-3 text-sm text-status-info">{t('proposal.changes_sent')}</p>}
      {!proposal.response && (mode === 'changes' ? (
        <div className="space-y-2">
          <textarea className="block w-full rounded-md border border-line bg-surface px-3 py-2 text-sm" rows={3} maxLength={2000}
            placeholder={t('proposal.changes_placeholder')} value={note} onChange={(e) => setNote(e.target.value)} />
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={() => setMode('')}>{t('wizard.back')}</Button>
            <Button size="sm" loading={busy} onClick={() => respond('changes_requested')}>{t('proposal.send_changes')}</Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <Button loading={busy} onClick={() => respond('accepted')}>{t('proposal.accept')}</Button>
          <Button variant="secondary" disabled={busy} onClick={() => setMode('changes')}>{t('proposal.request_changes')}</Button>
        </div>
      ))}
      {error && <p className="text-sm text-status-danger">{error}</p>}
    </div>
  );
}
