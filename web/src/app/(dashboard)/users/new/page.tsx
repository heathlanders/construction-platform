'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Button, Input, Select, Card, PageHeader } from '@/components/ui';

type FormErrors = Partial<Record<'email' | 'first_name' | 'last_name', string>>;

export default function InviteUserPage() {
  const router = useRouter();
  const { t } = useTranslation('common');

  const [form, setForm] = useState({
    email: '',
    first_name: '',
    last_name: '',
    role: 'field_tech',
    language_preference: 'en',
    employment_type: 'w2',
    hourly_rate_dollars: '',
    pay_frequency: 'biweekly',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  // Only OWNER may set pay at creation (mirrors the API). Fetch the current role.
  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setIsOwner(String(d?.role ?? '').toLowerCase() === 'owner'))
      .catch(() => setIsOwner(false));
  }, []);

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setErrors((err) => ({ ...err, [field]: undefined }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    const newErrors: FormErrors = {};
    if (!form.email.trim()) newErrors.email = t('users.email_required');
    if (!form.first_name.trim()) newErrors.first_name = t('users.first_name_required');
    if (!form.last_name.trim()) newErrors.last_name = t('users.last_name_required');

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          first_name: form.first_name,
          last_name: form.last_name,
          role: form.role,
          language_preference: form.language_preference,
          // Payroll config is applied server-side only when the creator is an OWNER.
          ...(isOwner
            ? {
                employment_type: form.employment_type,
                pay_frequency: form.pay_frequency,
                ...(form.hourly_rate_dollars.trim()
                  ? { default_hourly_rate_cents: Math.round(parseFloat(form.hourly_rate_dollars) * 100) }
                  : {}),
              }
            : {}),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setSubmitError(data?.error?.message ?? t('users.failed_to_invite'));
        setLoading(false);
        return;
      }

      router.push('/users');
    } catch {
      setSubmitError(t('users.error_generic'));
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <Link href="/users" className="text-sm text-muted hover:text-ink">
        {t('users.back_to_team')}
      </Link>
      <PageHeader title={t('users.invite_title')} />

      <Card padding="lg">
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label={t('users.email_label')}
            type="email"
            value={form.email}
            onChange={set('email')}
            placeholder={t('users.email_placeholder')}
            error={errors.email}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label={t('users.first_name_label')}
              value={form.first_name}
              onChange={set('first_name')}
              error={errors.first_name}
              required
            />
            <Input
              label={t('users.last_name_label')}
              value={form.last_name}
              onChange={set('last_name')}
              error={errors.last_name}
              required
            />
          </div>

          <Select label={t('users.role_label')} value={form.role} onChange={set('role')}>
            <option value="field_tech">{t('users.roles.field_tech')}</option>
            <option value="foreman">{t('users.roles.foreman')}</option>
            <option value="project_manager">{t('users.roles.project_manager')}</option>
            <option value="estimator">{t('users.roles.estimator')}</option>
            <option value="accountant">{t('users.roles.accountant')}</option>
            <option value="safety_officer">{t('users.roles.safety_officer')}</option>
            <option value="owner">{t('users.roles.owner')}</option>
          </Select>

          <Select label={t('users.language_label')} value={form.language_preference} onChange={set('language_preference')}>
            <option value="en">{t('common.english')}</option>
            <option value="es">{t('common.spanish')}</option>
          </Select>

          {isOwner && (
            <div className="rounded-md border border-line bg-surface-alt p-4 space-y-4">
              <p className="text-sm font-semibold text-ink">{t('users.payroll_section')}</p>
              <p className="text-xs text-muted">{t('users.payroll_hint')}</p>
              <div className="grid grid-cols-2 gap-4">
                <Select label={t('users.employment_type')} value={form.employment_type} onChange={set('employment_type')}>
                  <option value="w2">{t('users.employment_w2')}</option>
                  <option value="contractor_1099">{t('users.employment_1099')}</option>
                </Select>
                <Input
                  label={t('users.hourly_rate_label')}
                  type="number"
                  value={form.hourly_rate_dollars}
                  onChange={set('hourly_rate_dollars')}
                  placeholder="45.00"
                />
              </div>
              <Select label={t('users.pay_frequency')} value={form.pay_frequency} onChange={set('pay_frequency')}>
                <option value="weekly">{t('users.pay_weekly')}</option>
                <option value="biweekly">{t('users.pay_biweekly')}</option>
                <option value="semimonthly">{t('users.pay_semimonthly')}</option>
                <option value="monthly">{t('users.pay_monthly')}</option>
              </Select>
            </div>
          )}

          {submitError && (
            <div className="rounded-md border border-status-danger/40 bg-status-danger-bg p-3">
              <p className="text-sm text-status-danger">{submitError}</p>
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" loading={loading}>
              {loading ? t('users.sending') : t('users.send_invite')}
            </Button>
            <Button type="button" variant="secondary" onClick={() => router.push('/users')}>
              {t('users.cancel')}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
