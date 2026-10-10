'use client';

// Settings → Discovery — opt-in cross-tenant directory profile (Doc 07 §3.3).
// A sub OWNER publishes name/trade/region to the discovery directory so GCs can
// find them. Opt-in only (defaults OFF); the API is the enforcement layer
// (PUT = OWNER-only, no addon required).

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader, Card, Button, Spinner } from '@/components/ui';
import { useTradeTaxonomy, tradeDisplayLabel, groupByCategory } from '@/components/trades/use-trade-taxonomy';

interface DiscoveryProfile {
  discoverable: boolean;
  trades: string[];
  states: string[];
  service_area: string | null;
  updated_at: string | null;
}

const US_STATE = /^[A-Za-z]{2}$/;

export default function DiscoverySettingsPage() {
  const { t, i18n } = useTranslation('connections');
  const taxonomy = useTradeTaxonomy();
  const [profile, setProfile] = useState<DiscoveryProfile | null>(null);
  const [discoverable, setDiscoverable] = useState(false);
  const [trades, setTrades] = useState<string[]>([]);
  const [states, setStates] = useState<string[]>([]);
  const [stateInput, setStateInput] = useState('');
  const [serviceArea, setServiceArea] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isOwner, setIsOwner] = useState(false);
  const [tradePickerOpen, setTradePickerOpen] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('/api/connections/discovery-profile').then((r) => r.json()),
      fetch('/api/users/me').then((r) => r.json()),
    ])
      .then(([profileData, userData]) => {
        const p: DiscoveryProfile = profileData.profile ?? { discoverable: false, trades: [], states: [], service_area: null, updated_at: null };
        setProfile(p);
        setDiscoverable(p.discoverable);
        setTrades(p.trades);
        setStates(p.states);
        setServiceArea(p.service_area ?? '');
        const role = userData?.user?.role ?? userData?.role ?? '';
        setIsOwner(role.toLowerCase() === 'owner');
      })
      .catch(() => setError(t('discovery.error_load')))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addState = () => {
    const s = stateInput.trim().toUpperCase();
    if (!US_STATE.test(s) || states.includes(s) || states.length >= 10) return;
    setStates([...states, s]);
    setStateInput('');
  };

  const toggleTrade = (key: string) => {
    setTrades((cur) => (cur.includes(key) ? cur.filter((k) => k !== key) : cur.length < 20 ? [...cur, key] : cur));
  };

  const save = async () => {
    setSaving(true); setError(''); setSuccess('');
    try {
      const res = await fetch('/api/connections/discovery-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ discoverable, trades, states, service_area: serviceArea.trim() || null }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error?.message ?? t('discovery.error_save'));
        return;
      }
      setProfile((p) => ({ ...(p as DiscoveryProfile), ...data.profile }));
      setTrades(data.profile.trades ?? trades);
      setSuccess(t('discovery.saved'));
      setTimeout(() => setSuccess(''), 3000);
    } catch { setError(t('discovery.error_save')); } finally { setSaving(false); }
  };

  const labelFor = (key: string): string => {
    const def = taxonomy.find((tr) => tr.key === key);
    return def ? tradeDisplayLabel(def, i18n.language) : key;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <a href="/settings" className="text-sm text-muted hover:text-ink">← {t('discovery.back_to_settings')}</a>
        <PageHeader title={t('discovery.settings_title')} className="mt-2" />
        <p className="text-sm text-muted mt-1 max-w-xl">{t('discovery.settings_subtitle')}</p>
      </div>

      <div className="max-w-xl">
        <Card padding="lg">
          {error && (
            <div className="mb-4 rounded-md border border-status-danger/40 bg-status-danger-bg px-4 py-3 text-sm text-status-danger">{error}</div>
          )}
          {success && (
            <div className="mb-4 rounded-md border border-status-success/40 bg-status-success-bg px-4 py-3 text-sm text-status-success">{success}</div>
          )}
          {!isOwner && (
            <div className="mb-4 rounded-md border border-status-warning/40 bg-status-warning-bg px-4 py-3 text-sm text-status-warning">
              {t('discovery.owner_only')}
            </div>
          )}

          {/* Opt-in toggle */}
          <label className={`flex items-start gap-3 rounded-lg border p-4 transition-colors ${
            discoverable ? 'border-brand-500 bg-brand-50' : 'border-line'
          } ${isOwner ? 'cursor-pointer hover:border-muted' : 'cursor-default'}`}>
            <input
              type="checkbox"
              checked={discoverable}
              onChange={(e) => isOwner && setDiscoverable(e.target.checked)}
              disabled={!isOwner}
              className="mt-0.5"
            />
            <div>
              <p className="text-sm font-medium text-ink">{t('discovery.optin_label')}</p>
              <p className="text-xs text-muted mt-0.5">{t('discovery.optin_desc')}</p>
            </div>
          </label>

          {/* Trades */}
          <div className="mt-5">
            <h3 className="text-sm font-semibold text-ink mb-2">{t('discovery.trades_label')}</h3>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {trades.length === 0 && <span className="text-xs text-muted">{t('discovery.no_trades')}</span>}
              {trades.map((key) => (
                <span key={key} className="inline-flex items-center gap-1 rounded-full bg-brand-50 border border-brand-500/40 px-2.5 py-0.5 text-xs text-ink">
                  {labelFor(key)}
                  {isOwner && (
                    <button type="button" onClick={() => toggleTrade(key)} className="text-muted hover:text-ink" aria-label={t('discovery.remove')}>✕</button>
                  )}
                </span>
              ))}
            </div>
            {isOwner && (
              <button type="button" onClick={() => setTradePickerOpen((o) => !o)} className="text-sm text-brand-600 hover:underline">
                {tradePickerOpen ? t('discovery.close_picker') : t('discovery.add_trade')}
              </button>
            )}
            {tradePickerOpen && (
              <div className="mt-2 max-h-64 overflow-y-auto rounded-lg border border-line p-3 space-y-3">
                {groupByCategory(taxonomy).map(({ category, trades: group }) => (
                  <div key={category}>
                    <p className="text-[11px] uppercase tracking-wide text-muted mb-1">{t(`discovery.category_${category}`, { defaultValue: category.replace(/_/g, ' ') })}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {group.map((tr) => (
                        <button
                          key={tr.key}
                          type="button"
                          onClick={() => toggleTrade(tr.key)}
                          className={`rounded-full border px-2.5 py-0.5 text-xs transition-colors ${
                            trades.includes(tr.key) ? 'border-brand-500 bg-brand-50 text-ink' : 'border-line text-muted hover:border-muted hover:text-ink'
                          }`}
                        >
                          {tradeDisplayLabel(tr, i18n.language)}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* States */}
          <div className="mt-5">
            <h3 className="text-sm font-semibold text-ink mb-2">{t('discovery.states_label')}</h3>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {states.length === 0 && <span className="text-xs text-muted">{t('discovery.no_states')}</span>}
              {states.map((s) => (
                <span key={s} className="inline-flex items-center gap-1 rounded-full bg-surface-alt border border-line px-2.5 py-0.5 text-xs text-ink">
                  {s}
                  {isOwner && (
                    <button type="button" onClick={() => setStates(states.filter((x) => x !== s))} className="text-muted hover:text-ink" aria-label={t('discovery.remove')}>✕</button>
                  )}
                </span>
              ))}
            </div>
            {isOwner && (
              <div className="flex gap-2">
                <input
                  value={stateInput}
                  onChange={(e) => setStateInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addState(); } }}
                  placeholder={t('discovery.state_placeholder')}
                  maxLength={2}
                  className="w-24 rounded-md border border-line bg-surface px-2 py-1 text-sm text-ink"
                />
                <Button variant="secondary" size="sm" onClick={addState}>{t('discovery.add_state')}</Button>
              </div>
            )}
          </div>

          {/* Service area blurb */}
          <div className="mt-5">
            <h3 className="text-sm font-semibold text-ink mb-2">{t('discovery.service_area_label')}</h3>
            <input
              value={serviceArea}
              onChange={(e) => setServiceArea(e.target.value)}
              disabled={!isOwner}
              maxLength={500}
              placeholder={t('discovery.service_area_placeholder')}
              className="w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink"
            />
          </div>

          {isOwner && (
            <div className="mt-6">
              <Button onClick={save} loading={saving} disabled={saving} size="lg">
                {saving ? t('discovery.saving') : t('discovery.save')}
              </Button>
            </div>
          )}
        </Card>

        {profile?.updated_at && (
          <p className="text-xs text-muted mt-3">{t('discovery.last_updated', { date: new Date(profile.updated_at).toLocaleString() })}</p>
        )}
      </div>
    </div>
  );
}
