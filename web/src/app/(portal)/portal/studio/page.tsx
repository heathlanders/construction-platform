'use client';

// Design Studio — the client's requests + start a new one from the contractor's offered work.

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Button, EmptyState } from '@/components/ui';
import { apiError, money } from '@/components/studio/types';

interface Row { id: string; status: string; title: string | null; trades: string[]; range_low_cents: number | null; range_high_cents: number | null; created_at: string }
interface Trade { trade_key: string; label: string; entry_points: { id: string; label: string }[] }

const API = '/api/v1/client-portal/studio';

export default function StudioHome() {
  const { t, i18n } = useTranslation('studio');
  const router = useRouter();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [picking, setPicking] = useState(false);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const [r, tr] = await Promise.all([
      fetch(`${API}/requests`).then((x) => x.json()).catch(() => ({ requests: [] })),
      fetch(`${API}/trades?lang=${i18n.language}`).then((x) => x.json()).catch(() => ({ trades: [] })),
    ]);
    setRows(r.requests ?? []);
    setTrades(tr.trades ?? []);
  }, [i18n.language]);
  useEffect(() => { load(); }, [load]);

  async function start(tradeKey: string, entryPointId: string) {
    setBusy(entryPointId); setError('');
    const r = await fetch(`${API}/requests`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    if (!r.ok) { setError(await apiError(r, t('start.error'))); setBusy(''); return; }
    const { request } = await r.json();
    const s = await fetch(`${API}/requests/${request.id}/scopes`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ trade_key: tradeKey, entry_point_id: entryPointId }),
    });
    if (!s.ok) { setError(await apiError(s, t('start.error'))); setBusy(''); return; }
    router.push(`/portal/studio/${request.id}`);
  }

  if (!rows) return <p className="text-sm text-muted">{t('client.loading')}</p>;

  const picker = (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-ink">{t('client.what_work')}</h2>
      {trades.length === 0 ? <p className="text-sm text-muted">{t('client.no_trades')}</p> : trades.map((tr) => (
        <div key={tr.trade_key} className="grid gap-2 sm:grid-cols-2">
          {tr.entry_points.map((e) => (
            <button
              key={e.id} type="button" disabled={!!busy} onClick={() => start(tr.trade_key, e.id)}
              className="rounded-lg border border-line bg-surface p-4 text-left text-sm font-medium text-ink hover:border-brand-500 disabled:opacity-50"
            >
              {busy === e.id ? t('client.loading') : e.label}
            </button>
          ))}
        </div>
      ))}
      {error && <p className="text-sm text-status-danger">{error}</p>}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-ink">{t('client.title')}</h1>
          <p className="mt-1 text-sm text-muted">{t('client.subtitle')}</p>
        </div>
        {rows.length > 0 && !picking && <Button onClick={() => setPicking(true)}>{t('client.new_request')}</Button>}
      </div>

      {(picking || rows.length === 0) && (rows.length === 0 && !picking
        ? <EmptyState title={t('client.no_requests')} description={t('client.no_requests_desc')} action={<Button onClick={() => setPicking(true)}>{t('client.new_request')}</Button>} />
        : picker)}

      {rows.length > 0 && (
        <ul className="space-y-3">
          {rows.map((r) => (
            <li key={r.id}>
              <Link href={`/portal/studio/${r.id}`} className="flex items-center justify-between gap-3 rounded-lg border border-line bg-surface p-4 hover:border-brand-500/50">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">{r.title ?? t('client.untitled')}</p>
                  <p className="text-xs text-muted">
                    {t(`status.${r.status}`)}
                    {r.range_low_cents != null && r.range_high_cents != null && ` · ${money(r.range_low_cents, i18n.language)} – ${money(r.range_high_cents, i18n.language)}`}
                  </p>
                </div>
                <span className="text-sm text-brand-700">{t('client.open')} →</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
