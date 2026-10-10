'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader, Card, Button, Input, Select } from '@/components/ui';

interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  language_preference: string;
  status: string;
  created_at: string;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatRole(role: string): string {
  return role
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function formatLanguage(code: string): string {
  if (code === 'en') return 'English';
  if (code === 'es') return 'Español';
  return code;
}

export default function SettingsPage() {
  const { t } = useTranslation('common');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [fetchError, setFetchError] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ first_name: '', last_name: '', email: '', language_preference: 'en' });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');

  useEffect(() => {
    fetch('/api/users/me')
      .then((r) => r.json())
      .then((data) => {
        const u = data.user ?? data;
        setProfile(u);
        setEditForm({ first_name: u.first_name ?? '', last_name: u.last_name ?? '', email: u.email ?? '', language_preference: u.language_preference ?? 'en' });
      })
      .catch(() => setFetchError(true));
  }, []);

  const saveProfile = async () => {
    setSaving(true); setSaveError(''); setSaveSuccess('');
    try {
      const res = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ first_name: editForm.first_name, last_name: editForm.last_name, language_preference: editForm.language_preference }),
      });
      const data = await res.json();
      if (!res.ok) { setSaveError(data?.error?.message ?? 'Save failed'); return; }
      const u = data.user ?? data;
      setProfile(u);
      setEditing(false);
      setSaveSuccess('Profile updated.');
      setTimeout(() => setSaveSuccess(''), 3000);
    } catch { setSaveError('Network error'); } finally { setSaving(false); }
  };

  function DetailRow({ label, value }: { label: string; value: string }) {
    return (
      <div className="flex py-3 border-b border-line last:border-0">
        <span className="w-40 flex-shrink-0 text-sm text-muted">{label}</span>
        <span className="text-sm text-ink">{value}</span>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title={t('settings.title')} className="mb-6" />

      <div className="max-w-2xl space-y-6">
        {fetchError && (
          <div className="mb-4 rounded-md border border-status-warning/40 bg-status-warning-bg px-4 py-3 text-sm text-status-warning">
            {t('settings.profile_load_error')}
          </div>
        )}

        {/* Profile section */}
        <Card padding="lg">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-ink uppercase tracking-wide">{t('settings.profile')}</h2>
            {profile && !editing && (
              <button onClick={() => setEditing(true)} className="text-sm text-brand-600 hover:text-brand-700">Edit</button>
            )}
          </div>
          {saveSuccess && <div className="mb-3 rounded border border-status-success/40 bg-status-success-bg p-2 text-sm text-status-success">{saveSuccess}</div>}
          {profile ? (
            editing ? (
              <div className="space-y-4 pt-1">
                {saveError && <div className="rounded border border-status-danger/40 bg-status-danger-bg p-3 text-sm text-status-danger">{saveError}</div>}
                <div className="grid grid-cols-2 gap-3">
                  <Input label="First Name" value={editForm.first_name} onChange={e => setEditForm(f => ({ ...f, first_name: e.target.value }))} />
                  <Input label="Last Name" value={editForm.last_name} onChange={e => setEditForm(f => ({ ...f, last_name: e.target.value }))} />
                </div>
                <div>
                  <Input label="Email" disabled value={editForm.email} />
                  <p className="text-xs text-muted mt-1">Email changes require support.</p>
                </div>
                <Select label="Language" value={editForm.language_preference} onChange={e => setEditForm(f => ({ ...f, language_preference: e.target.value }))}>
                  <option value="en">English</option>
                  <option value="es">Español</option>
                </Select>
                <div className="flex gap-3">
                  <Button onClick={saveProfile} loading={saving} disabled={saving || !editForm.first_name.trim() || !editForm.last_name.trim()}>
                    {saving ? 'Saving…' : 'Save Changes'}
                  </Button>
                  <Button variant="secondary" onClick={() => { setEditing(false); setSaveError(''); }}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <DetailRow label={t('settings.email')} value={profile.email} />
                <DetailRow label={t('settings.name')} value={`${profile.first_name} ${profile.last_name}`} />
                <DetailRow label={t('settings.role')} value={formatRole(profile.role)} />
                <DetailRow label={t('settings.language')} value={formatLanguage(profile.language_preference)} />
                <DetailRow label={t('settings.member_since')} value={formatDate(profile.created_at)} />
              </div>
            )
          ) : (
            <p className="text-sm text-muted py-2">{t('settings.profile_unavailable')}</p>
          )}
        </Card>

        {/* Account section */}
        <Card padding="lg">
          <h2 className="text-sm font-semibold text-ink uppercase tracking-wide mb-2">{t('settings.account')}</h2>
          <p className="text-sm text-muted">
            {t('settings.account_change_info')}
          </p>
        </Card>

        {/* Notifications section */}
        <Card padding="lg">
          <h2 className="text-sm font-semibold text-ink uppercase tracking-wide mb-2">{t('settings.notifications')}</h2>
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium text-ink">{t('settings.notification_preferences')}</p>
              <p className="text-xs text-muted mt-0.5">{t('settings.notification_preferences_desc')}</p>
            </div>
            <a href="/settings/notifications" className="text-sm text-brand-600 hover:text-brand-700 font-medium">
              {t('settings.manage')} →
            </a>
          </div>
        </Card>

        {/* Audit log section */}
        <Card padding="lg">
          <h2 className="text-sm font-semibold text-ink uppercase tracking-wide mb-2">{t('settings.compliance')}</h2>
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium text-ink">{t('settings.audit_log')}</p>
              <p className="text-xs text-muted mt-0.5">{t('settings.audit_log_desc')}</p>
            </div>
            <a href="/settings/audit-log" className="text-sm text-brand-600 hover:text-brand-700 font-medium">
              {t('settings.view')} →
            </a>
          </div>
        </Card>

        {/* Time Tracking section */}
        <Card padding="lg">
          <h2 className="text-sm font-semibold text-ink uppercase tracking-wide mb-2">{t('settings.time_tracking_title', { defaultValue: 'Time Tracking' })}</h2>
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium text-ink">{t('settings.time_tracking_mode', { defaultValue: 'Time Tracking Mode' })}</p>
              <p className="text-xs text-muted mt-0.5">
                {t('settings.time_tracking_mode_desc', { defaultValue: 'Switch between manual time entry and clock in / clock out for W2 employees.' })}
              </p>
            </div>
            <a href="/settings/org" className="text-sm text-brand-600 hover:text-brand-700 font-medium whitespace-nowrap">
              {t('settings.manage')} →
            </a>
          </div>
        </Card>

        {/* Cross-tenant discovery section */}
        <Card padding="lg">
          <h2 className="text-sm font-semibold text-ink uppercase tracking-wide mb-2">{t('settings.discovery_title', { defaultValue: 'Contractor Directory' })}</h2>
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium text-ink">{t('settings.discovery_card', { defaultValue: 'Discovery Profile' })}</p>
              <p className="text-xs text-muted mt-0.5">
                {t('settings.discovery_card_desc', { defaultValue: 'Opt in to let general contractors find your company by name, trade, and region. Off by default.' })}
              </p>
            </div>
            <a href="/settings/discovery" className="text-sm text-brand-600 hover:text-brand-700 font-medium whitespace-nowrap">
              {t('settings.manage')} →
            </a>
          </div>
        </Card>

        {/* Payroll & Integrations section */}
        <Card padding="lg">
          <h2 className="text-sm font-semibold text-ink uppercase tracking-wide mb-2">{t('settings.integrations')}</h2>
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium text-ink">{t('settings.payroll_integrations', { defaultValue: 'Payroll & Integrations' })}</p>
              <p className="text-xs text-muted mt-0.5">
                {t('settings.payroll_integrations_desc', { defaultValue: 'Connect QuickBooks, Gusto, or ADP. Export CSV for your accountant. Configure per-employee rates.' })}
              </p>
            </div>
            <a href="/settings/payroll" className="text-sm text-brand-600 hover:text-brand-700 font-medium whitespace-nowrap">
              {t('settings.manage')} →
            </a>
          </div>
        </Card>

        {/* Billing upgrade cards */}
        <Card padding="lg">
          <h2 className="text-sm font-semibold text-ink uppercase tracking-wide mb-4">{t('settings.upgrade_plan', { defaultValue: 'Upgrade Your Plan' })}</h2>
          <div className="space-y-3">
            {/* Professional upgrade card */}
            <div className="flex items-center justify-between rounded-lg border border-brand-100 bg-brand-50 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-brand-700">Professional — $349/mo</p>
                <p className="text-xs text-brand-600 mt-0.5">20 users, 20 projects, 2 trade modules.</p>
              </div>
              <a
                href="/settings/billing"
                className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 whitespace-nowrap"
              >
                {t('settings.upgrade', { defaultValue: 'Upgrade' })}
              </a>
            </div>

            {/* Business upgrade card */}
            <div className="flex items-center justify-between rounded-lg border border-status-action/30 bg-status-action-bg px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-status-action">Business — $749/mo</p>
                <p className="text-xs text-status-action mt-0.5">50 users, unlimited projects, 5 trade modules, cross-tenant collaboration.</p>
              </div>
              <a
                href="/settings/billing"
                className="rounded-md bg-status-action px-3 py-1.5 text-sm font-medium text-white hover:opacity-90 whitespace-nowrap"
              >
                {t('settings.upgrade', { defaultValue: 'Upgrade' })}
              </a>
            </div>

            {/* Enterprise card */}
            <div className="flex items-center justify-between rounded-lg border border-line bg-surface-alt px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-ink">Enterprise — $1,499+/mo</p>
                <p className="text-xs text-muted mt-0.5">Unlimited everything, API access, all modules, dedicated CSM.</p>
              </div>
              <a
                href="mailto:sales@constructionplatform.com"
                className="rounded-md border border-line px-3 py-1.5 text-sm font-medium text-ink hover:bg-surface-alt whitespace-nowrap"
              >
                {t('settings.contact_sales', { defaultValue: 'Contact Sales' })}
              </a>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
