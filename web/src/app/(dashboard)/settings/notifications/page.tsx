'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { PageHeader, Card, Table, THead, TBody, TR, TH, TD, Spinner } from '@/components/ui';

const CATEGORIES = ['safety', 'financial', 'project', 'system', 'cross_tenant'] as const;
const CHANNELS = ['push', 'email', 'sms'] as const;

type Category = typeof CATEGORIES[number];
type Channel = typeof CHANNELS[number];

interface Pref {
  category: Category;
  channel: Channel;
  enabled: boolean;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
}

type PrefMap = Record<string, Record<string, Pref>>;

export default function NotificationPreferencesPage() {
  const { t } = useTranslation('common');
  const [prefMap, setPrefMap] = useState<PrefMap>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  function categoryLabel(c: Category): string {
    const labels: Record<Category, string> = {
      safety: t('notifications_page.category.safety'),
      financial: t('notifications_page.category.financial'),
      project: t('notifications_page.category.project'),
      system: t('notifications_page.category.system'),
      cross_tenant: t('notifications_page.category.cross_tenant'),
    };
    return labels[c];
  }

  function channelLabel(ch: Channel): string {
    const labels: Record<Channel, string> = {
      push: t('notifications_page.channel.push'),
      email: t('notifications_page.channel.email'),
      sms: t('notifications_page.channel.sms'),
    };
    return labels[ch];
  }

  useEffect(() => {
    fetch('/api/notifications/preferences')
      .then((r) => r.json())
      .then((data) => {
        const map: PrefMap = {};
        for (const pref of data.preferences ?? []) {
          if (!map[pref.category]) map[pref.category] = {};
          map[pref.category][pref.channel] = pref;
        }
        setPrefMap(map);
      })
      .catch(() => setError(t('notifications_page.load_error')))
      .finally(() => setLoading(false));
  }, [t]);

  function getPref(category: Category, channel: Channel): boolean {
    return prefMap[category]?.[channel]?.enabled ?? true;
  }

  async function toggle(category: Category, channel: Channel) {
    if (category === 'safety') return; // Safety cannot be disabled (T-40)
    const key = `${category}:${channel}`;
    setSaving(key);
    setError(null);
    setSuccessMsg(null);
    const currentEnabled = getPref(category, channel);
    try {
      const res = await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, channel, enabled: !currentEnabled }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error?.message ?? t('notifications_page.update_error'));
        return;
      }
      setPrefMap((prev) => {
        const next = { ...prev };
        if (!next[category]) next[category] = {};
        next[category] = {
          ...next[category],
          [channel]: { ...(next[category][channel] ?? { category, channel, quiet_hours_start: null, quiet_hours_end: null }), enabled: !currentEnabled },
        };
        return next;
      });
      setSuccessMsg(t('notifications_page.saved'));
      setTimeout(() => setSuccessMsg(null), 2000);
    } catch {
      setError(t('notifications_page.network_error'));
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-2 text-sm text-muted mb-6">
        <Link href="/settings" className="hover:text-ink">{t('settings.title')}</Link>
        <span>/</span>
        <span className="text-ink">{t('notifications_page.title')}</span>
      </div>

      <PageHeader title={t('notifications_page.title')} subtitle={t('notifications_page.subtitle')} className="mb-6" />

      {error && (
        <div className="mb-4 rounded-md border border-status-danger/40 bg-status-danger-bg px-4 py-3 text-sm text-status-danger">{error}</div>
      )}
      {successMsg && (
        <div className="mb-4 rounded-md border border-status-success/40 bg-status-success-bg px-4 py-3 text-sm text-status-success">{successMsg}</div>
      )}

      {loading ? (
        <Card className="flex items-center justify-center py-8">
          <Spinner className="h-6 w-6" />
        </Card>
      ) : (
        <Card padding="none" className="overflow-hidden">
          <Table>
            <THead>
              <TR className="bg-surface-alt">
                <TH>{t('notifications_page.col_category')}</TH>
                {CHANNELS.map((ch) => (
                  <TH key={ch} className="text-center w-20">{channelLabel(ch)}</TH>
                ))}
              </TR>
            </THead>
            <TBody>
              {CATEGORIES.map((cat) => (
                <TR key={cat}>
                  <TD>
                    <div className="font-medium text-ink">{categoryLabel(cat)}</div>
                    {cat === 'safety' && (
                      <div className="text-xs text-status-warning mt-0.5">{t('notifications_page.safety_required')}</div>
                    )}
                  </TD>
                  {CHANNELS.map((ch) => {
                    const enabled = getPref(cat, ch);
                    const isSafety = cat === 'safety';
                    const key = `${cat}:${ch}`;
                    return (
                      <TD key={ch} className="text-center">
                        <button
                          onClick={() => toggle(cat, ch)}
                          disabled={isSafety || saving === key}
                          title={isSafety ? t('notifications_page.safety_cannot_disable') : undefined}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
                            isSafety
                              ? 'cursor-not-allowed opacity-60 bg-status-success'
                              : enabled
                              ? 'bg-brand-600 hover:bg-brand-700'
                              : 'bg-surface-alt hover:bg-line'
                          }`}
                        >
                          <span
                            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                              enabled ? 'translate-x-4' : 'translate-x-0.5'
                            }`}
                          />
                        </button>
                      </TD>
                    );
                  })}
                </TR>
              ))}
            </TBody>
          </Table>

          <div className="px-4 py-3 bg-surface-alt border-t border-line">
            <p className="text-xs text-muted">
              {t('notifications_page.sms_note')}
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
