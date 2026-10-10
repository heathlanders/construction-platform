'use client';

// Design Studio settings — which trade modules clients can request, and the pricing params used for
// the budget ranges clients see. Only trades with a registered intake module are listed (the API
// refuses others), so adding a trade module makes it appear here automatically.

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Card, Input, PageHeader, useToast } from '@/components/ui';
import { apiError } from '@/components/studio/types';

interface Settings { labor_rate_cents: number; overhead_pct: number; profit_pct: number; tax_pct: number; contingency_pct: number; renders_enabled: boolean }
interface Trade {
  trade_key: string; label: string; label_es: string;
  entry_points: { id: string; label: { en: string; es: string } }[];
  offering: { enabled: boolean; settings: Settings } | null;
}

const DEFAULTS: Settings = { labor_rate_cents: 7500, overhead_pct: 10, profit_pct: 10, tax_pct: 0, contingency_pct: 5, renders_enabled: true };
const PCTS = ['overhead_pct', 'profit_pct', 'tax_pct', 'contingency_pct'] as const;

function TradeCard({ trade, onSaved }: { trade: Trade; onSaved: () => void }) {
  const { t, i18n } = useTranslation('studio');
  const toast = useToast();
  const lang = i18n.language === 'es' ? 'es' : 'en';
  const [enabled, setEnabled] = useState(trade.offering?.enabled ?? false);
  const [s, setS] = useState<Settings>({ ...DEFAULTS, ...(trade.offering?.settings ?? {}) });
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    const res = await fetch(`/api/v1/studio/offerings/${trade.trade_key}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ enabled, settings: s }),
    });
    setBusy(false);
    if (!res.ok) { toast.error(await apiError(res, t('start.error'))); return; }
    toast.success(t('settings.saved'));
    onSaved();
  }

  return (
    <Card padding="lg" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-ink">{lang === 'es' ? trade.label_es : trade.label}</h2>
          <p className="text-xs text-muted">{t('settings.entry_points')}: {trade.entry_points.map((e) => e.label[lang]).join(', ')}</p>
        </div>
        <label className="flex items-center gap-2 text-sm font-medium text-ink">
          <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
          {t('settings.enabled')}
        </label>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Input
          label={t('settings.labor_rate')} type="number" min={0} step="0.01"
          value={s.labor_rate_cents / 100} onChange={(e) => setS({ ...s, labor_rate_cents: Math.round(Number(e.target.value) * 100) })}
        />
        {PCTS.map((k) => (
          <Input key={k} label={t(`settings.${k}`)} type="number" min={0} max={100} step="0.5"
            value={s[k]} onChange={(e) => setS({ ...s, [k]: Number(e.target.value) })} />
        ))}
      </div>
      <label className="flex items-center gap-2 text-sm text-ink">
        <input type="checkbox" checked={s.renders_enabled} onChange={(e) => setS({ ...s, renders_enabled: e.target.checked })} />
        {t('settings.renders_enabled')}
      </label>
      <div className="flex justify-end"><Button loading={busy} onClick={save}>{t('settings.save')}</Button></div>
    </Card>
  );
}

interface Usage {
  features: { feature: string; total: number; ok: number; failed: number; blocked: number; cost_micro_usd: number }[];
  total_cost_micro_usd: number;
  caps: { rendersPerScope: number; aiCallsPerScope: number; rendersPerTenantMonth: number };
}

function UsageCard() {
  const { t, i18n } = useTranslation('studio');
  const [u, setU] = useState<Usage | null>(null);
  useEffect(() => { fetch('/api/v1/studio/usage').then((r) => (r.ok ? r.json() : null)).then(setU).catch(() => undefined); }, []);
  if (!u) return null;
  const usd = (micro: number) => new Intl.NumberFormat(i18n.language === 'es' ? 'es-US' : 'en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(micro / 1e6);
  return (
    <Card padding="lg" className="space-y-3">
      <h2 className="text-base font-semibold text-ink">{t('settings.usage_title')}</h2>
      <div className="grid gap-3 sm:grid-cols-4">
        {u.features.map((f) => (
          <div key={f.feature} className="rounded-md border border-line p-3">
            <p className="text-xs text-muted">{t(`settings.usage_feature_${f.feature.replace('.', '_')}`)}</p>
            <p className="text-xl font-semibold text-ink">{f.total}</p>
            <p className="text-xs text-muted">{t('settings.usage_ok', { ok: f.ok })}{f.failed + f.blocked > 0 && ` · ${t('settings.usage_issues', { n: f.failed + f.blocked })}`}</p>
          </div>
        ))}
        <div className="rounded-md border border-line p-3">
          <p className="text-xs text-muted">{t('settings.usage_cost')}</p>
          <p className="text-xl font-semibold text-ink">{usd(u.total_cost_micro_usd)}</p>
        </div>
      </div>
      <p className="text-xs text-muted">{t('settings.usage_caps', { renders: u.caps.rendersPerScope, ai: u.caps.aiCallsPerScope, month: u.caps.rendersPerTenantMonth })}</p>
    </Card>
  );
}

export default function StudioSettingsPage() {
  const { t } = useTranslation('studio');
  const [trades, setTrades] = useState<Trade[] | null>(null);
  const load = () => fetch('/api/v1/studio/trades').then((r) => r.json()).then((d) => setTrades(d.trades ?? [])).catch(() => setTrades([]));
  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-6">
      <PageHeader title={t('settings.title')} subtitle={t('settings.subtitle')} />
      <UsageCard />
      {!trades ? <p className="text-sm text-muted">{t('client.loading')}</p>
        : trades.length === 0 ? <p className="text-sm text-muted">{t('settings.no_modules')}</p>
        : trades.map((tr) => <TradeCard key={tr.trade_key} trade={tr} onSaved={load} />)}
    </div>
  );
}
