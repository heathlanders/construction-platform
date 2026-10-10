'use client';

// Design Studio — contractor inbox of client requests + invite a client.

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Badge, Button, EmptyState, Input, Modal, PageHeader, Select, Table, THead, TBody, TR, TH, TD, useToast } from '@/components/ui';
import { apiError, money } from '@/components/studio/types';

interface Row {
  id: string; status: string; title: string | null; trades: string[]; first_name: string; last_name: string; email: string;
  range_low_cents: number | null; range_high_cents: number | null; created_at: string;
}
interface Trade { trade_key: string; label: string; label_es: string; entry_points: { id: string; label: { en: string; es: string } }[]; offering: { enabled: boolean } | null }

const STATUS_TONE: Record<string, string> = { draft: 'draft', submitted: 'submitted', reviewed: 'in_progress', converted: 'completed', declined: 'declined' };
const FILTERS = ['', 'submitted', 'reviewed', 'draft', 'declined'] as const;

export default function ClientRequestsPage() {
  const { t, i18n } = useTranslation('studio');
  const toast = useToast();
  const lang = i18n.language === 'es' ? 'es' : 'en';
  const [rows, setRows] = useState<Row[] | null>(null);
  const [status, setStatus] = useState<string>('');
  const [trades, setTrades] = useState<Trade[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', language: lang, trade_key: '', entry_point_id: '', title: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const q = status ? `?status=${status}` : '';
    const [r, tr] = await Promise.all([
      fetch(`/api/v1/studio/requests${q}`).then((x) => x.json()).catch(() => ({ requests: [] })),
      fetch('/api/v1/studio/trades').then((x) => x.json()).catch(() => ({ trades: [] })),
    ]);
    setRows(r.requests ?? []);
    setTrades(tr.trades ?? []);
  }, [status]);
  useEffect(() => { load(); }, [load]);

  const offered = trades.filter((x) => x.offering?.enabled);
  const selectedTrade = offered.find((x) => x.trade_key === form.trade_key);
  const tradeLabel = (k: string) => {
    const tr = trades.find((x) => x.trade_key === k);
    return tr ? (lang === 'es' ? tr.label_es : tr.label) : k;
  };

  async function sendInvite(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError('');
    const payload: Record<string, unknown> = { first_name: form.first_name, last_name: form.last_name, email: form.email, language: form.language };
    if (form.trade_key) payload.trade_key = form.trade_key;
    if (form.entry_point_id) payload.entry_point_id = form.entry_point_id;
    if (form.title) payload.title = form.title;
    const res = await fetch('/api/v1/studio/invites', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    setBusy(false);
    if (!res.ok) { setError(await apiError(res, t('start.error'))); return; }
    toast.success(t('contractor.invite_sent'));
    setOpen(false);
    setForm({ first_name: '', last_name: '', email: '', language: lang, trade_key: '', entry_point_id: '', title: '' });
    load();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('contractor.title')}
        subtitle={t('contractor.subtitle')}
        actions={(
          <>
            <Link href="/settings/studio" className="text-sm text-brand-700 hover:underline">{t('contractor.settings_link')}</Link>
            <Button onClick={() => setOpen(true)}>{t('contractor.invite')}</Button>
          </>
        )}
      />

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f || 'all'} type="button" onClick={() => setStatus(f)} aria-pressed={status === f}
            className={`rounded-full border px-3 py-1 text-sm ${status === f ? 'border-brand-600 bg-brand-600 text-white' : 'border-line bg-surface text-ink'}`}
          >
            {f ? t(`status.${f}`) : t('contractor.filter_all')}
          </button>
        ))}
      </div>

      {!rows ? <p className="text-sm text-muted">{t('client.loading')}</p> : rows.length === 0 ? (
        <EmptyState title={t('contractor.empty')} description={t('contractor.empty_desc')} action={<Button onClick={() => setOpen(true)}>{t('contractor.invite')}</Button>} />
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <THead>
              <TR>
                <TH>{t('contractor.col_client')}</TH><TH>{t('contractor.col_work')}</TH><TH>{t('contractor.col_status')}</TH>
                <TH>{t('contractor.col_range')}</TH><TH>{t('contractor.col_created')}</TH>
              </TR>
            </THead>
            <TBody>
              {rows.map((r) => (
                <TR key={r.id}>
                  <TD>
                    <Link href={`/client-requests/${r.id}`} className="font-medium text-brand-700 hover:underline">{r.first_name} {r.last_name}</Link>
                    <div className="text-xs text-muted">{r.title ?? r.email}</div>
                  </TD>
                  <TD>{r.trades.map(tradeLabel).join(', ') || '—'}</TD>
                  <TD><Badge status={STATUS_TONE[r.status] ?? 'draft'}>{t(`status.${r.status}`)}</Badge></TD>
                  <TD>{r.range_low_cents != null && r.range_high_cents != null ? `${money(r.range_low_cents, lang)} – ${money(r.range_high_cents, lang)}` : '—'}</TD>
                  <TD>{new Date(r.created_at).toLocaleDateString(lang === 'es' ? 'es-US' : 'en-US')}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={t('contractor.invite_title')}>
        {offered.length === 0 && (
          <p className="mb-4 rounded-md bg-status-warning-bg p-3 text-sm text-status-warning">
            {t('contractor.no_trades')} <Link href="/settings/studio" className="underline">{t('contractor.settings_link')}</Link>
          </p>
        )}
        <form className="space-y-4" onSubmit={sendInvite}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label={t('contractor.first_name')} required value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
            <Input label={t('contractor.last_name')} required value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
          </div>
          <Input label={t('contractor.email')} type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Select label={t('contractor.language')} value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value as 'en' | 'es' })}>
            <option value="en">{t('contractor.lang_en')}</option>
            <option value="es">{t('contractor.lang_es')}</option>
          </Select>
          <Select label={t('contractor.trade')} value={form.trade_key} onChange={(e) => setForm({ ...form, trade_key: e.target.value, entry_point_id: '' })}>
            <option value="">{t('contractor.trade_any')}</option>
            {offered.map((x) => <option key={x.trade_key} value={x.trade_key}>{lang === 'es' ? x.label_es : x.label}</option>)}
          </Select>
          {selectedTrade && (
            <Select label={t('contractor.entry_point')} value={form.entry_point_id} onChange={(e) => setForm({ ...form, entry_point_id: e.target.value })}>
              <option value="">—</option>
              {selectedTrade.entry_points.map((ep) => <option key={ep.id} value={ep.id}>{ep.label[lang]}</option>)}
            </Select>
          )}
          <Input label={t('contractor.request_title')} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          {error && <p className="text-sm text-status-danger">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>{t('wizard.back')}</Button>
            <Button type="submit" loading={busy}>{t('contractor.send_invite')}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
