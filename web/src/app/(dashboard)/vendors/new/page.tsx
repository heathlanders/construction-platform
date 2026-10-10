'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Button, Input, Select, Card, PageHeader } from '@/components/ui';
import { TradeSelect } from '@/components/vendors/trade-select';

export default function NewVendorPage() {
  const router = useRouter();
  const { t } = useTranslation('financial');

  const [form, setForm] = useState({
    name: '',
    vendor_type: 'subcontractor',
    trade_type: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    is_preferred: false,
    is_prequalified: false,
  });
  const [error, setError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    setError('');

    if (!form.name.trim()) {
      setError(t('vendors.company_name_required'));
      return;
    }

    const { name, vendor_type, trade_type, contact_name, contact_email, contact_phone, is_preferred, is_prequalified } = form;

    setLoading(true);
    try {
      const res = await fetch('/api/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          vendor_type,
          trade_type: trade_type || undefined,
          contact_name: contact_name || undefined,
          contact_email: contact_email || undefined,
          contact_phone: contact_phone || undefined,
          is_preferred,
          is_prequalified,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setSubmitError(data?.error?.message ?? t('vendors.failed_to_add'));
        setLoading(false);
        return;
      }

      router.push('/vendors');
    } catch {
      setSubmitError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <Link href="/vendors" className="text-sm text-muted hover:text-ink">
        {t('vendors.back_to_vendors')}
      </Link>
      <PageHeader title={t('vendors.add_vendor')} />

      <Card padding="lg">
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label={t('vendors.company_name')}
            value={form.name}
            onChange={set('name')}
            placeholder={t('vendors.company_name_placeholder')}
            error={error || undefined}
            required
          />

          <Select label={t('vendors.vendor_type_label')} value={form.vendor_type} onChange={set('vendor_type')}>
            <option value="subcontractor">{t('vendors.vendor_types.subcontractor')}</option>
            <option value="supplier">{t('vendors.vendor_types.supplier')}</option>
            <option value="equipment">{t('vendors.vendor_types.equipment')}</option>
            <option value="other">{t('vendors.vendor_types.other')}</option>
          </Select>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-ink">{t('vendors.trade_type_label')}</label>
            <TradeSelect
              value={form.trade_type}
              onChange={(trade) => setForm((f) => ({ ...f, trade_type: trade }))}
              className="block w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <Input
            label={t('vendors.contact_name_label')}
            value={form.contact_name}
            onChange={set('contact_name')}
          />

          <Input
            label={t('vendors.contact_email_label')}
            type="email"
            value={form.contact_email}
            onChange={set('contact_email')}
          />

          <Input
            label={t('vendors.contact_phone_label')}
            value={form.contact_phone}
            onChange={set('contact_phone')}
          />

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                checked={form.is_preferred}
                onChange={(e) => setForm((f) => ({ ...f, is_preferred: e.target.checked }))}
                className="rounded border-line text-brand-600"
              />
              <span>{t('vendors.preferred_label')}</span>
            </label>
            <label className="flex items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                checked={form.is_prequalified}
                onChange={(e) => setForm((f) => ({ ...f, is_prequalified: e.target.checked }))}
                className="rounded border-line text-brand-600"
              />
              <span>{t('vendors.prequalified_label')}</span>
            </label>
          </div>

          {submitError && (
            <div className="rounded-md border border-status-danger/40 bg-status-danger-bg p-3">
              <p className="text-sm text-status-danger">{submitError}</p>
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" loading={loading}>
              {loading ? t('vendors.adding') : t('vendors.add_vendor')}
            </Button>
            <Button type="button" variant="secondary" onClick={() => router.push('/vendors')}>
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
