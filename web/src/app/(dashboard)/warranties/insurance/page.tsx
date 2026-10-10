'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Input,
  Select,
  Card,
  PageHeader,
  Tabs,
  StatusPill,
  Table,
  THead,
  TBody,
  TR,
  TH,
  TD,
  SlideOver,
} from '@/components/ui';

interface InsurancePolicy {
  id: string;
  policy_type: string;
  provider_name: string;
  policy_number: string;
  effective_date: string;
  expiry_date: string;
  is_portfolio_policy: boolean;
  coverage_limit_cents: number | null;
  deductible_cents: number | null;
  annual_premium_cents: number | null;
}

interface PolicyProject {
  id: string;
  project_id: string;
  project_name: string | null;
  added_date: string | null;
}

interface InsuranceClaim {
  id: string;
  incident_date: string;
  description: string;
  claim_amount_cents: number;
  approved_amount_cents: number | null;
  status: string;
}

interface CreateForm {
  policy_type: string;
  provider_name: string;
  policy_number: string;
  effective_date: string;
  expiry_date: string;
  coverage_limit: string;
  deductible: string;
  annual_premium: string;
  is_portfolio_policy: boolean;
}

const EMPTY_FORM: CreateForm = {
  policy_type: 'how',
  provider_name: '',
  policy_number: '',
  effective_date: '',
  expiry_date: '',
  coverage_limit: '',
  deductible: '',
  annual_premium: '',
  is_portfolio_policy: false,
};

// Insurance/warranty claim status → canonical status state (color via lib/status).
const CLAIM_STATUS_STATE: Record<string, string> = {
  reported: 'open',
  submitted: 'submitted',
  under_review: 'under_review',
  approved: 'approved',
  denied: 'rejected',
  paid: 'paid',
  closed: 'closed',
};
function claimStatusState(s: string): string {
  return CLAIM_STATUS_STATE[s] ?? s;
}

function formatDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatCents(cents: number | null) {
  if (cents === null) return '—';
  return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function isExpiringSoon(date: string) {
  return (new Date(date).getTime() - Date.now()) < 30 * 86400000;
}

type DetailTab = 'info' | 'projects' | 'claims';

export default function WarrantyInsurancePage() {
  const { t } = useTranslation('warranties');
  const [policies, setPolicies] = useState<InsurancePolicy[]>([]);
  const [selected, setSelected] = useState<InsurancePolicy | null>(null);
  const [detailTab, setDetailTab] = useState<DetailTab>('info');
  const [projects, setProjects] = useState<PolicyProject[]>([]);
  const [claims, setClaims] = useState<InsuranceClaim[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<CreateForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadPolicies = () => {
    fetch('/api/warranty-insurance-policies?limit=100')
      .then(r => r.json())
      .then(d => { if (d.policies) setPolicies(d.policies as InsurancePolicy[]); })
      .catch(() => {});
  };

  useEffect(() => { loadPolicies(); }, []);

  const openPolicy = (p: InsurancePolicy) => {
    setSelected(p);
    setDetailTab('info');
    fetch(`/api/warranty-insurance-policies/${p.id}/projects`)
      .then(r => r.json())
      .then(d => { if (d.projects) setProjects(d.projects as PolicyProject[]); })
      .catch(() => {});
    fetch(`/api/warranty-insurance-policies/${p.id}/claims`)
      .then(r => r.json())
      .then(d => { if (d.claims) setClaims(d.claims as InsuranceClaim[]); })
      .catch(() => {});
  };

  const removeProject = async (pid: string) => {
    if (!selected) return;
    await fetch(`/api/warranty-insurance-policies/${selected.id}/projects/${pid}`, { method: 'DELETE' });
    setProjects(prev => prev.filter(p => p.id !== pid));
  };

  const createPolicy = async () => {
    if (!form.provider_name || !form.policy_number || !form.effective_date || !form.expiry_date) return;
    setSaving(true); setError('');
    try {
      const parseCents = (v: string) => v ? Math.round(parseFloat(v) * 100) : null;
      const res = await fetch('/api/warranty-insurance-policies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          policy_type: form.policy_type,
          provider_name: form.provider_name,
          policy_number: form.policy_number,
          effective_date: form.effective_date,
          expiry_date: form.expiry_date,
          coverage_limit_cents: parseCents(form.coverage_limit),
          deductible_cents: parseCents(form.deductible),
          annual_premium_cents: parseCents(form.annual_premium),
          is_portfolio_policy: form.is_portfolio_policy,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data?.error?.message ?? t('errors.save_failed')); return; }
      setShowCreate(false);
      setForm(EMPTY_FORM);
      loadPolicies();
    } catch { setError(t('errors.network_error')); } finally { setSaving(false); }
  };

  return (
    <div>
      <PageHeader
        title={t('insurance_title')}
        className="mb-6"
        actions={
          <Button onClick={() => { setShowCreate(true); setError(''); setForm(EMPTY_FORM); }}>
            + {t('new_policy')}
          </Button>
        }
      />

      <Card padding="none" className="overflow-hidden">
        <Table>
          <THead>
            <TR className="bg-surface-alt hover:bg-surface-alt">
              <TH>{t('col.provider')}</TH>
              <TH>{t('col.policy_number')}</TH>
              <TH>{t('col.type')}</TH>
              <TH>{t('col.effective')}</TH>
              <TH>{t('col.expiry')}</TH>
              <TH>{t('col.portfolio')}</TH>
              <TH>{t('col.actions')}</TH>
            </TR>
          </THead>
          <TBody>
            {policies.length === 0 && (
              <TR><TD colSpan={7} className="px-4 py-8 text-center text-muted">{t('no_policies')}</TD></TR>
            )}
            {policies.map(p => (
              <TR key={p.id} className="cursor-pointer" onClick={() => openPolicy(p)}>
                <TD className="font-medium text-ink">{p.provider_name}</TD>
                <TD className="font-mono text-xs text-muted">{p.policy_number}</TD>
                <TD className="text-muted">{t(`policy_type.${p.policy_type}`)}</TD>
                <TD className="text-muted">{formatDate(p.effective_date)}</TD>
                <TD>
                  <span className={isExpiringSoon(p.expiry_date) ? 'text-status-danger font-medium' : 'text-muted'}>
                    {formatDate(p.expiry_date)}
                  </span>
                </TD>
                <TD>
                  {p.is_portfolio_policy ? (
                    <span className="inline-flex text-xs px-1.5 py-0.5 rounded bg-status-info-bg text-status-info">Yes</span>
                  ) : (
                    <span className="text-muted text-xs">No</span>
                  )}
                </TD>
                <TD className="text-xs text-brand-600">{t('open_detail')}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </Card>

      {/* Policy detail slide-over */}
      <SlideOver
        open={!!selected}
        onClose={() => setSelected(null)}
        width="max-w-lg"
        title={selected?.provider_name}
      >
        {selected && (
          <div className="space-y-5">
            <Tabs
              value={detailTab}
              onChange={(k) => setDetailTab(k as DetailTab)}
              items={(['info', 'projects', 'claims'] as DetailTab[]).map(tab => ({
                key: tab,
                label: <span className="capitalize">{tab}</span>,
              }))}
            />

            {detailTab === 'info' && (
              <div className="space-y-3">
                <div><p className="text-xs text-muted uppercase tracking-wide mb-0.5">{t('col.policy_number')}</p><p className="text-sm font-mono text-ink">{selected.policy_number}</p></div>
                <div><p className="text-xs text-muted uppercase tracking-wide mb-0.5">{t('col.type')}</p><p className="text-sm text-ink">{t(`policy_type.${selected.policy_type}`)}</p></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><p className="text-xs text-muted uppercase tracking-wide mb-0.5">{t('col.effective')}</p><p className="text-sm text-ink">{formatDate(selected.effective_date)}</p></div>
                  <div><p className="text-xs text-muted uppercase tracking-wide mb-0.5">{t('col.expiry')}</p>
                    <p className={`text-sm ${isExpiringSoon(selected.expiry_date) ? 'text-status-danger font-medium' : 'text-ink'}`}>{formatDate(selected.expiry_date)}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div><p className="text-xs text-muted uppercase tracking-wide mb-0.5">{t('form.coverage_limit')}</p><p className="text-sm text-ink">{formatCents(selected.coverage_limit_cents)}</p></div>
                  <div><p className="text-xs text-muted uppercase tracking-wide mb-0.5">{t('form.deductible')}</p><p className="text-sm text-ink">{formatCents(selected.deductible_cents)}</p></div>
                  <div><p className="text-xs text-muted uppercase tracking-wide mb-0.5">{t('form.annual_premium')}</p><p className="text-sm text-ink">{formatCents(selected.annual_premium_cents)}</p></div>
                </div>
              </div>
            )}

            {detailTab === 'projects' && (
              <div className="space-y-3">
                {projects.length === 0 && <p className="text-sm text-muted">{t('detail.no_projects_linked', { defaultValue: 'No projects linked.' })}</p>}
                {projects.map(proj => (
                  <div key={proj.id} className="flex items-center justify-between py-2 border-b border-line">
                    <span className="text-sm text-ink">{proj.project_name ?? proj.project_id}</span>
                    <button onClick={() => removeProject(proj.id)} className="text-xs text-status-danger hover:underline">{t('form.remove_item')}</button>
                  </div>
                ))}
              </div>
            )}

            {detailTab === 'claims' && (
              <div className="space-y-3">
                {claims.length === 0 && <p className="text-sm text-muted">{t('detail.no_insurance_claims')}</p>}
                {claims.map(c => (
                  <div key={c.id} className="p-3 rounded-md bg-surface-alt border border-line space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-ink">{formatDate(c.incident_date)}</span>
                      <StatusPill status={claimStatusState(c.status)} label={c.status} />
                    </div>
                    <p className="text-sm text-muted line-clamp-2">{c.description}</p>
                    <div className="flex gap-4 text-xs text-muted">
                      <span>{t('col.claimed')}: {formatCents(c.claim_amount_cents)}</span>
                      <span>{t('col.approved')}: {formatCents(c.approved_amount_cents)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </SlideOver>

      {/* Create policy slide-over */}
      <SlideOver
        open={showCreate}
        onClose={() => setShowCreate(false)}
        width="max-w-lg"
        title={t('new_policy')}
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setShowCreate(false)}>{t('form.cancel')}</Button>
            <Button
              size="sm"
              onClick={createPolicy}
              loading={saving}
              disabled={saving || !form.provider_name || !form.policy_number || !form.effective_date || !form.expiry_date}
            >
              {saving ? t('form.saving') : t('form.create')}
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          {error && (
            <div className="rounded-md border border-status-danger/40 bg-status-danger-bg p-3 text-sm text-status-danger">{error}</div>
          )}

          <Select label={t('form.policy_type')} value={form.policy_type} onChange={e => setForm(f => ({ ...f, policy_type: e.target.value }))}>
            <option value="how">{t('policy_type.how')}</option>
            <option value="2_10_hbw">{t('policy_type.2_10_hbw')}</option>
            <option value="other">{t('policy_type.other')}</option>
          </Select>
          <Input label={t('form.provider_name')} value={form.provider_name} onChange={e => setForm(f => ({ ...f, provider_name: e.target.value }))} />
          <Input label={t('form.policy_number')} value={form.policy_number} onChange={e => setForm(f => ({ ...f, policy_number: e.target.value }))} />
          <div className="grid grid-cols-2 gap-3">
            <Input label={t('col.effective')} type="date" value={form.effective_date} onChange={e => setForm(f => ({ ...f, effective_date: e.target.value }))} />
            <Input label={t('col.expiry')} type="date" value={form.expiry_date} onChange={e => setForm(f => ({ ...f, expiry_date: e.target.value }))} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Input label={t('form.coverage_limit')} type="number" min={0} step={0.01} value={form.coverage_limit} onChange={e => setForm(f => ({ ...f, coverage_limit: e.target.value }))} />
            <Input label={t('form.deductible')} type="number" min={0} step={0.01} value={form.deductible} onChange={e => setForm(f => ({ ...f, deductible: e.target.value }))} />
            <Input label={t('form.annual_premium')} type="number" min={0} step={0.01} value={form.annual_premium} onChange={e => setForm(f => ({ ...f, annual_premium: e.target.value }))} />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="portfolio" checked={form.is_portfolio_policy} onChange={e => setForm(f => ({ ...f, is_portfolio_policy: e.target.checked }))} className="rounded border-line text-brand-600 focus:ring-brand-500" />
            <label htmlFor="portfolio" className="text-sm text-ink">{t('form.is_portfolio_policy')}</label>
          </div>
        </div>
      </SlideOver>
    </div>
  );
}
