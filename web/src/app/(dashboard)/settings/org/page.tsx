'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader, Card, Button, Spinner } from '@/components/ui';

interface OrgSettings {
  time_tracking_mode: 'manual' | 'clock_in_out';
  version: number;
  updated_at: string | null;
}

export default function OrgSettingsPage() {
  const { t } = useTranslation('field');
  const [settings, setSettings] = useState<OrgSettings | null>(null);
  const [mode, setMode] = useState<'manual' | 'clock_in_out'>('manual');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    // Load current settings and user role in parallel
    Promise.all([
      fetch('/api/settings/org').then((r) => r.json()),
      fetch('/api/users/me').then((r) => r.json()),
    ])
      .then(([settingsData, userData]) => {
        const s: OrgSettings = settingsData.settings ?? { time_tracking_mode: 'manual', version: 0, updated_at: null };
        setSettings(s);
        setMode(s.time_tracking_mode);
        const role = userData?.user?.role ?? userData?.role ?? '';
        setIsOwner(role === 'owner' || role === 'OWNER');
      })
      .catch(() => setError('Failed to load settings.'))
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    if (!settings) return;
    setSaving(true); setError(''); setSuccess('');
    try {
      const res = await fetch('/api/settings/org', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ time_tracking_mode: mode, version: settings.version }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 409) {
          setError('Settings were modified by another user. Please refresh and try again.');
        } else {
          setError(data?.error?.message ?? 'Save failed.');
        }
        return;
      }
      const s: OrgSettings = data.settings;
      setSettings(s);
      setMode(s.time_tracking_mode);
      setSuccess(t('org_settings.mode_saved'));
      setTimeout(() => setSuccess(''), 3000);
    } catch { setError('Network error.'); } finally { setSaving(false); }
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
        <a href="/settings" className="text-sm text-muted hover:text-ink">← Settings</a>
        <PageHeader title={t('org_settings.time_tracking')} className="mt-2" />
      </div>

      <div className="max-w-xl">
        <Card padding="lg">
          <h2 className="text-sm font-semibold text-ink uppercase tracking-wide mb-4">
            {t('org_settings.time_tracking_mode')}
          </h2>

          {error && (
            <div className="mb-4 rounded-md border border-status-danger/40 bg-status-danger-bg px-4 py-3 text-sm text-status-danger">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 rounded-md border border-status-success/40 bg-status-success-bg px-4 py-3 text-sm text-status-success">
              {success}
            </div>
          )}

          {!isOwner && (
            <div className="mb-4 rounded-md border border-status-warning/40 bg-status-warning-bg px-4 py-3 text-sm text-status-warning">
              {t('org_settings.owner_only')}
            </div>
          )}

          <div className="space-y-3">
            {/* Manual entry option */}
            <label className={`flex items-start gap-3 rounded-lg border p-4 cursor-pointer transition-colors ${
              mode === 'manual' ? 'border-brand-500 bg-brand-50' : 'border-line hover:border-muted'
            } ${!isOwner ? 'cursor-default' : ''}`}>
              <input
                type="radio"
                name="tracking_mode"
                value="manual"
                checked={mode === 'manual'}
                onChange={() => isOwner && setMode('manual')}
                disabled={!isOwner}
                className="mt-0.5"
              />
              <div>
                <p className="text-sm font-medium text-ink">{t('org_settings.manual')}</p>
                <p className="text-xs text-muted mt-0.5">{t('org_settings.manual_desc')}</p>
              </div>
            </label>

            {/* Clock in/out option */}
            <label className={`flex items-start gap-3 rounded-lg border p-4 cursor-pointer transition-colors ${
              mode === 'clock_in_out' ? 'border-brand-500 bg-brand-50' : 'border-line hover:border-muted'
            } ${!isOwner ? 'cursor-default' : ''}`}>
              <input
                type="radio"
                name="tracking_mode"
                value="clock_in_out"
                checked={mode === 'clock_in_out'}
                onChange={() => isOwner && setMode('clock_in_out')}
                disabled={!isOwner}
                className="mt-0.5"
              />
              <div>
                <p className="text-sm font-medium text-ink">{t('org_settings.clock_in_out')}</p>
                <p className="text-xs text-muted mt-0.5">{t('org_settings.clock_in_out_desc')}</p>
              </div>
            </label>
          </div>

          {isOwner && (
            <div className="mt-5">
              <Button
                onClick={save}
                loading={saving}
                disabled={saving || mode === settings?.time_tracking_mode}
                size="lg"
              >
                {saving ? t('org_settings.saving') : t('org_settings.save')}
              </Button>
            </div>
          )}
        </Card>

        {settings?.updated_at && (
          <p className="text-xs text-muted mt-3">
            Last updated {new Date(settings.updated_at).toLocaleString()}
          </p>
        )}
      </div>
    </div>
  );
}
