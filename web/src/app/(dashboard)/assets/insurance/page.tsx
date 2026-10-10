'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  PageHeader, Button, Input, Select, Card, Badge,
  Table, THead, TBody, TR, TH, TD, SlideOver, EmptyState,
} from '@/components/ui';
import { STATUS_SOFT } from '@/lib/status';

interface InsurancePolicy {
  id: string;
  policy_type: string;
  policy_name: string;
  is_fleet_policy: boolean;
  carrier_name: string;
  policy_number: string;
  coverage_limit_cents: number | null;
  annual_premium_cents: number | null;
  effective_date: string;
  expiry_date: string;
  auto_renew: boolean;
}

interface PolicyForm {
  policy_type: string;
  policy_name: string;
  is_fleet_policy: boolean;
  carrier_name: string;
  policy_number: string;
  coverage_description: string;
  coverage_limit_cents: string;
  annual_premium_cents: string;
  deductible_cents: string;
  effective_date: string;
  expiry_date: string;
  auto_renew: boolean;
}

const EMPTY_FORM: PolicyForm = {
  policy_type: 'fleet',
  policy_name: '',
  is_fleet_policy: true,
  carrier_name: '',
  policy_number: '',
  coverage_description: '',
  coverage_limit_cents: '',
  annual_premium_cents: '',
  deductible_cents: '',
  effective_date: '',
  expiry_date: '',
  auto_renew: false,
};

function formatDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatCents(cents: number | null) {
  if (cents === null) return '—';
  return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function ExpiryBadge({ date }: { date: string }) {
  const days = Math.floor((new Date(date).getTime() - Date.now()) / 86400000);
  if (days < 0) return <Badge className={STATUS_SOFT.danger}>Expired</Badge>;
  if (days <= 30) return <Badge className={STATUS_SOFT.warning}>Expires {formatDate(date)}</Badge>;
  return <span className="text-sm text-ink">{formatDate(date)}</span>;
}

export default function AssetInsurancePage() {
  const { t } = useTranslation('assets');
  const [policies, setPolicies] = useState<InsurancePolicy[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<PolicyForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [createError, setCreateError] = useState('');

  const loadPolicies = () => {
    fetch('/api/asset-insurance-policies?limit=100')
      .then(r => r.json())
      .then(d => { if (d.policies) setPolicies(d.policies as InsurancePolicy[]); })
      .catch(() => {});
  };

  useEffect(() => { loadPolicies(); }, []);

  const createPolicy = async () => {
    if (!form.policy_name.trim() || !form.carrier_name.trim() || !form.effective_date || !form.expiry_date) return;
    setSaving(true); setCreateError('');
    try {
      const res = await fetch('/api/asset-insurance-policies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          policy_type: form.policy_type,
          policy_name: form.policy_name,
          is_fleet_policy: form.is_fleet_policy,
          carrier_name: form.carrier_name,
          policy_number: form.policy_number || null,
          coverage_description: form.coverage_description || null,
          coverage_limit_cents: form.coverage_limit_cents ? Math.round(parseFloat(form.coverage_limit_cents) * 100) : null,
          annual_premium_cents: form.annual_premium_cents ? Math.round(parseFloat(form.annual_premium_cents) * 100) : null,
          deductible_cents: form.deductible_cents ? Math.round(parseFloat(form.deductible_cents) * 100) : null,
          effective_date: form.effective_date,
          expiry_date: form.expiry_date,
          auto_renew: form.auto_renew,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setCreateError(data?.error?.message ?? t('assets.save_error')); return; }
      setShowCreate(false);
      setForm(EMPTY_FORM);
      loadPolicies();
    } catch { setCreateError(t('assets.network_error')); } finally { setSaving(false); }
  };

  return (
    <div>
      <PageHeader
        title={t('assets.insurance_title')}
        subtitle={t('assets.insurance_subtitle')}
        className="mb-6"
        actions={
          <Button onClick={() => { setShowCreate(true); setCreateError(''); setForm(EMPTY_FORM); }}>
            + {t('assets.add_policy')}
          </Button>
        }
      />

      <Card padding="none">
        <Table>
          <THead>
            <TR className="hover:bg-transparent">
              <TH>{t('assets.col_policy_name')}</TH>
              <TH>{t('assets.col_carrier')}</TH>
              <TH>{t('assets.col_type')}</TH>
              <TH>{t('assets.col_coverage')}</TH>
              <TH>{t('assets.col_premium')}</TH>
              <TH>{t('assets.col_expiry')}</TH>
            </TR>
          </THead>
          <TBody>
            {policies.length === 0 && (
              <TR className="hover:bg-transparent">
                <TD colSpan={6} className="py-8">
                  <EmptyState title={t('assets.no_policies')} />
                </TD>
              </TR>
            )}
            {policies.map(policy => (
              <TR key={policy.id}>
                <TD>
                  <p className="font-medium text-ink">{policy.policy_name}</p>
                  <p className="text-xs text-muted font-mono">{policy.policy_number}</p>
                </TD>
                <TD className="text-ink">{policy.carrier_name}</TD>
                <TD>
                  <span className="text-xs capitalize">{policy.policy_type.replace(/_/g, ' ')}</span>
                  {policy.is_fleet_policy && (
                    <Badge className={`ml-1 ${STATUS_SOFT.info}`}>Fleet</Badge>
                  )}
                </TD>
                <TD className="text-ink">{formatCents(policy.coverage_limit_cents)}</TD>
                <TD className="text-ink">{formatCents(policy.annual_premium_cents)}/yr</TD>
                <TD><ExpiryBadge date={policy.expiry_date} /></TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </Card>

      <SlideOver
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title={t('assets.add_policy')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowCreate(false)}>{t('assets.cancel')}</Button>
            <Button
              onClick={createPolicy}
              loading={saving}
              disabled={saving || !form.policy_name.trim() || !form.carrier_name.trim() || !form.effective_date || !form.expiry_date}
            >
              {t('assets.add_policy')}
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          {createError && (
            <div className="rounded border border-status-danger/40 bg-status-danger-bg p-3 text-sm text-status-danger">{createError}</div>
          )}

          <Input
            label={`${t('assets.field_policy_name')} *`}
            placeholder="e.g. 2026 Fleet Auto Policy"
            value={form.policy_name}
            onChange={e => setForm(f => ({ ...f, policy_name: e.target.value }))}
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label={t('assets.field_policy_type')}
              value={form.policy_type}
              onChange={e => setForm(f => ({ ...f, policy_type: e.target.value }))}
            >
              <option value="fleet">Fleet</option>
              <option value="individual">Individual</option>
              <option value="equipment_floater">Equipment Floater</option>
              <option value="inland_marine">Inland Marine</option>
              <option value="umbrella">Umbrella</option>
              <option value="liability">Liability</option>
            </Select>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 text-sm text-ink cursor-pointer">
                <input type="checkbox" checked={form.is_fleet_policy}
                  onChange={e => setForm(f => ({ ...f, is_fleet_policy: e.target.checked }))}
                  className="rounded border-line text-brand-600" />
                {t('assets.field_fleet_policy')}
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label={`${t('assets.field_carrier')} *`}
              value={form.carrier_name}
              onChange={e => setForm(f => ({ ...f, carrier_name: e.target.value }))}
            />
            <Input
              label={t('assets.field_policy_number')}
              value={form.policy_number}
              onChange={e => setForm(f => ({ ...f, policy_number: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label={`${t('assets.field_effective_date')} *`}
              type="date"
              value={form.effective_date}
              onChange={e => setForm(f => ({ ...f, effective_date: e.target.value }))}
            />
            <Input
              label={`${t('assets.field_expiry_date')} *`}
              type="date"
              value={form.expiry_date}
              onChange={e => setForm(f => ({ ...f, expiry_date: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label={t('assets.field_coverage_limit')}
              type="number"
              step="1000"
              min="0"
              placeholder="0.00"
              value={form.coverage_limit_cents}
              onChange={e => setForm(f => ({ ...f, coverage_limit_cents: e.target.value }))}
            />
            <Input
              label={t('assets.field_annual_premium')}
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={form.annual_premium_cents}
              onChange={e => setForm(f => ({ ...f, annual_premium_cents: e.target.value }))}
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-ink cursor-pointer">
            <input type="checkbox" checked={form.auto_renew}
              onChange={e => setForm(f => ({ ...f, auto_renew: e.target.checked }))}
              className="rounded border-line text-brand-600" />
            {t('assets.field_auto_renew')}
          </label>
        </div>
      </SlideOver>
    </div>
  );
}
