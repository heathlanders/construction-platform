'use client';

import { useState, FormEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Button, Input, Select, Card } from '@/components/ui';

export default function NewContractPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation('financial');

  const [contract_type, setContractType] = useState('subcontract');
  const [original_value, setOriginalValue] = useState('');
  const [retainage_pct, setRetainagePct] = useState('10');
  const [status, setStatus] = useState('draft');

  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    if (!original_value || parseFloat(original_value) <= 0) {
      setSubmitError(t('contracts.value_error', { defaultValue: 'Original contract value must be greater than 0' }));
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: id,
          contract_type,
          original_value_cents: Math.round(parseFloat(original_value || '0') * 100),
          retainage_pct: parseFloat(retainage_pct) || 0,
          status,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setSubmitError(data?.error?.message ?? t('contracts.create_failed', { defaultValue: 'Failed to create contract' }));
        setLoading(false);
        return;
      }

      router.push(`/projects/${id}/contracts`);
    } catch {
      setSubmitError(t('contracts.error_retry', { defaultValue: 'An error occurred. Please try again.' }));
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-6 flex items-center gap-3">
        <Link href={`/projects/${id}/contracts`} className="text-sm text-muted hover:text-ink">
          ← {t('contracts.title')}
        </Link>
        <span className="text-line">/</span>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">{t('contracts.new_contract', { defaultValue: 'New Contract' })}</h1>
      </div>

      <Card padding="lg">
        <form onSubmit={handleSubmit} className="space-y-5">
          <Select label={t('contracts.type')} value={contract_type} onChange={(e) => setContractType(e.target.value)}>
            <option value="prime_contract">{t('contracts.contract_type.prime_contract', { defaultValue: 'Prime Contract' })}</option>
            <option value="subcontract">{t('contracts.contract_type.subcontract', { defaultValue: 'Subcontract' })}</option>
            <option value="purchase_order">{t('contracts.contract_type.purchase_order', { defaultValue: 'Purchase Order' })}</option>
          </Select>

          <Input
            label={t('contracts.original_value_label', { defaultValue: 'Original Contract Value ($) *' })}
            type="number"
            value={original_value}
            onChange={(e) => setOriginalValue(e.target.value)}
            min={0}
            step={0.01}
            placeholder="0.00"
            required
          />

          <Input
            label={t('contracts.retainage_pct', { defaultValue: 'Retainage %' })}
            type="number"
            value={retainage_pct}
            onChange={(e) => setRetainagePct(e.target.value)}
            min={0}
            max={100}
            step={0.5}
            placeholder="10"
          />

          <Select label={t('contracts.status')} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="draft">{t('contracts.contract_status.draft', { defaultValue: 'Draft' })}</option>
            <option value="pending_signature">{t('contracts.contract_status.pending_signature', { defaultValue: 'Pending Signature' })}</option>
            <option value="executed">{t('contracts.contract_status.executed', { defaultValue: 'Executed' })}</option>
          </Select>

          {submitError && (
            <div className="rounded-md border border-status-danger/40 bg-status-danger-bg p-3">
              <p className="text-sm text-status-danger">{submitError}</p>
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" loading={loading}>
              {loading ? t('contracts.creating', { defaultValue: 'Creating...' }) : t('contracts.create_contract', { defaultValue: 'Create Contract' })}
            </Button>
            <Button type="button" variant="secondary" onClick={() => router.push(`/projects/${id}/contracts`)}>
              {t('contracts.cancel', { defaultValue: 'Cancel' })}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
