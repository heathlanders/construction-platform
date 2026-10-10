'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Input,
  Select,
  Textarea,
  Badge,
  StatusPill,
  Card,
  PageHeader,
  Tabs,
  Table,
  THead,
  TBody,
  TR,
  TH,
  TD,
  SlideOver,
  Spinner,
} from '@/components/ui';

interface BuilderWarranty {
  id: string;
  title: string;
  status: string;
  effective_date: string;
  homeowner_name: string | null;
  homeowner_email: string | null;
  homeowner_phone: string | null;
  homeowner_address: string | null;
  project_id: string;
  project_name: string | null;
}

interface CoverageItem {
  id: string;
  coverage_tier: string;
  description: string;
  duration_months: number;
  trade_category: string | null;
  expiry_date: string | null;
}

interface WarrantyClaim {
  id: string;
  claim_number: string;
  title: string;
  trade_category: string;
  status: string;
  priority: string;
  reported_date: string;
}

interface InsuranceClaim {
  id: string;
  policy_id: string;
  provider_name: string | null;
  incident_date: string;
  claim_amount_cents: number;
  approved_amount_cents: number | null;
  status: string;
}

interface AuditEntry {
  id: string;
  claim_id: string;
  claim_title: string;
  from_status: string | null;
  to_status: string;
  changed_by_name: string | null;
  note: string | null;
  created_at: string;
}

interface AddCoverageForm {
  coverage_tier: string;
  description: string;
  duration_months: string;
  trade_category: string;
}

interface NewClaimForm {
  title: string;
  description: string;
  trade_category: string;
  coverage_item_id: string;
  priority: string;
  reported_date: string;
}

const EMPTY_COVERAGE_FORM: AddCoverageForm = { coverage_tier: 'workmanship', description: '', duration_months: '12', trade_category: '' };
const EMPTY_CLAIM_FORM: NewClaimForm = { title: '', description: '', trade_category: 'general', coverage_item_id: '', priority: 'medium', reported_date: new Date().toISOString().slice(0, 10) };

type TabKey = 'overview' | 'claims' | 'insurance' | 'audit';

// Coverage tier → canonical status state (color via lib/status).
const TIER_STATUS: Record<string, string> = {
  workmanship: 'open',      // info
  systems: 'pending',       // warning
  structural: 'active',     // success
  custom: 'draft',          // neutral
};

// Warranty + insurance claim status → canonical status state (color via lib/status).
const CLAIM_STATUS_STATE: Record<string, string> = {
  submitted: 'submitted',
  under_review: 'under_review',
  sub_notified: 'pending',
  sub_accepted: 'active',
  sub_disputed: 'rejected',
  repair_scheduled: 'requires_action',
  repair_complete: 'complete',
  closed: 'closed',
  denied: 'rejected',
  // insurance-claim statuses
  reported: 'open',
  approved: 'approved',
  paid: 'paid',
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

function isExpired(date: string | null) {
  if (!date) return false;
  return new Date(date) < new Date();
}

function isExpiringSoon(date: string | null) {
  if (!date) return false;
  const ms = new Date(date).getTime() - Date.now();
  return ms > 0 && ms < 30 * 86400000;
}

export default function WarrantyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation('warranties');
  const [warranty, setWarranty] = useState<BuilderWarranty | null>(null);
  const [coverageItems, setCoverageItems] = useState<CoverageItem[]>([]);
  const [claims, setClaims] = useState<WarrantyClaim[]>([]);
  const [insuranceClaims, setInsuranceClaims] = useState<InsuranceClaim[]>([]);
  const [auditHistory, setAuditHistory] = useState<AuditEntry[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [showAddCoverage, setShowAddCoverage] = useState(false);
  const [showNewClaim, setShowNewClaim] = useState(false);
  const [coverageForm, setCoverageForm] = useState<AddCoverageForm>(EMPTY_COVERAGE_FORM);
  const [claimForm, setClaimForm] = useState<NewClaimForm>(EMPTY_CLAIM_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const loadWarranty = () => {
    fetch(`/api/builder-warranties/${id}`)
      .then(r => r.json())
      .then(d => { if (d.warranty) setWarranty(d.warranty as BuilderWarranty); })
      .catch(() => {});
  };

  const loadCoverage = () => {
    fetch(`/api/builder-warranties/${id}/coverage-items`)
      .then(r => r.json())
      .then(d => { if (d.coverage_items) setCoverageItems(d.coverage_items as CoverageItem[]); })
      .catch(() => {});
  };

  const loadClaims = () => {
    fetch(`/api/builder-warranties/${id}/claims`)
      .then(r => r.json())
      .then(d => { if (d.claims) setClaims(d.claims as WarrantyClaim[]); })
      .catch(() => {});
  };

  const loadInsuranceClaims = () => {
    fetch(`/api/builder-warranties/${id}/insurance-claims`)
      .then(r => r.json())
      .then(d => { if (d.insurance_claims) setInsuranceClaims(d.insurance_claims as InsuranceClaim[]); })
      .catch(() => {});
  };

  const loadAuditHistory = () => {
    fetch(`/api/builder-warranties/${id}/audit-history`)
      .then(r => r.json())
      .then(d => { if (d.history) setAuditHistory(d.history as AuditEntry[]); })
      .catch(() => {});
  };

  useEffect(() => {
    loadWarranty();
    loadCoverage();
    loadClaims();
    loadInsuranceClaims();
    loadAuditHistory();
  }, [id]);

  const addCoverageItem = async () => {
    setSaving(true); setError('');
    try {
      const res = await fetch(`/api/builder-warranties/${id}/coverage-items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coverage_tier: coverageForm.coverage_tier,
          description: coverageForm.description,
          duration_months: parseInt(coverageForm.duration_months),
          trade_category: coverageForm.trade_category || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data?.error?.message ?? t('errors.save_failed')); return; }
      setCoverageItems(prev => [...prev, data.coverage_item as CoverageItem]);
      setShowAddCoverage(false);
      setCoverageForm(EMPTY_COVERAGE_FORM);
    } catch { setError(t('errors.network_error')); } finally { setSaving(false); }
  };

  const sendInvite = async () => {
    setError(''); setSuccessMsg('');
    const res = await fetch(`/api/builder-warranties/${id}/provision-homeowner`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
    if (res.ok) { setSuccessMsg(t('detail.invite_sent')); setTimeout(() => setSuccessMsg(''), 3000); }
    else { setError(t('detail.invite_error')); }
  };

  const activateWarranty = async () => {
    setError('');
    const res = await fetch(`/api/builder-warranties/${id}/activate`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
    if (res.ok) { loadWarranty(); }
    else { setError(t('detail.activate_error')); }
  };

  const createClaim = async () => {
    setSaving(true); setError('');
    try {
      const res = await fetch(`/api/builder-warranties/${id}/claims`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: claimForm.title,
          description: claimForm.description,
          trade_category: claimForm.trade_category,
          coverage_item_id: claimForm.coverage_item_id || null,
          priority: claimForm.priority,
          reported_date: claimForm.reported_date,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data?.error?.message ?? t('errors.save_failed')); return; }
      setShowNewClaim(false);
      setClaimForm(EMPTY_CLAIM_FORM);
      loadClaims();
    } catch { setError(t('errors.network_error')); } finally { setSaving(false); }
  };

  const TABS: { key: TabKey; label: string }[] = [
    { key: 'overview', label: t('detail.tab_overview') },
    { key: 'claims', label: t('detail.tab_claims') },
    { key: 'insurance', label: t('detail.tab_insurance') },
    { key: 'audit', label: t('detail.tab_audit') },
  ];

  if (!warranty) {
    return (
      <div className="flex items-center justify-center gap-2 h-48 text-muted text-sm">
        <Spinner className="h-4 w-4" />{t('homeowner.loading')}
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <Link href="/warranties" className="text-sm text-brand-600 hover:underline mb-2 inline-block">← {t('page_title')}</Link>
      <PageHeader
        className="mb-6"
        title={warranty.title}
        subtitle={
          <span className="flex items-center gap-3">
            <StatusPill status={warranty.status} label={t(`status.${warranty.status}`)} />
            {warranty.project_name && <span className="text-sm text-muted">{warranty.project_name}</span>}
          </span>
        }
        actions={
          warranty.status === 'draft' ? (
            <Button onClick={activateWarranty}>{t('form.activate')}</Button>
          ) : undefined
        }
      />

      {error && <div className="rounded-md border border-status-danger/40 bg-status-danger-bg p-3 text-sm text-status-danger mb-4">{error}</div>}
      {successMsg && <div className="rounded-md border border-status-success/40 bg-status-success-bg p-3 text-sm text-status-success mb-4">{successMsg}</div>}

      {/* Tabs */}
      <Tabs
        className="mb-6"
        value={activeTab}
        onChange={(k) => setActiveTab(k as TabKey)}
        items={TABS.map(tab => ({ key: tab.key, label: tab.label }))}
      />

      {/* Tab: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-3 gap-6">
          {/* Coverage items */}
          <div className="col-span-2">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-ink uppercase tracking-wide">{t('detail.coverage_items')}</h2>
              <button
                onClick={() => setShowAddCoverage(true)}
                className="text-xs text-brand-600 hover:underline"
              >
                + {t('detail.add_coverage_item')}
              </button>
            </div>
            <Card padding="none" className="overflow-hidden">
              <Table>
                <THead>
                  <TR className="bg-surface-alt hover:bg-surface-alt">
                    <TH>{t('col.tier')}</TH>
                    <TH>{t('col.description')}</TH>
                    <TH>{t('col.duration')}</TH>
                    <TH>{t('col.expiry_date')}</TH>
                  </TR>
                </THead>
                <TBody>
                  {coverageItems.length === 0 && (
                    <TR><TD colSpan={4} className="px-4 py-6 text-center text-muted">{t('detail.no_coverage_items')}</TD></TR>
                  )}
                  {coverageItems.map(item => (
                    <TR key={item.id}>
                      <TD>
                        <Badge status={TIER_STATUS[item.coverage_tier] ?? 'draft'}>{t(`tier.${item.coverage_tier}`)}</Badge>
                      </TD>
                      <TD className="text-ink">{item.description}</TD>
                      <TD className="text-muted">{item.duration_months}mo</TD>
                      <TD>
                        {item.expiry_date ? (
                          <span className={`text-sm ${isExpired(item.expiry_date) ? 'text-status-danger font-medium' : isExpiringSoon(item.expiry_date) ? 'text-status-warning' : 'text-ink'}`}>
                            {isExpired(item.expiry_date) ? t('detail.coverage_expired') : formatDate(item.expiry_date)}
                          </span>
                        ) : '—'}
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </Card>
          </div>

          {/* Homeowner info card */}
          <div>
            <h2 className="text-sm font-semibold text-ink uppercase tracking-wide mb-3">{t('detail.homeowner_info')}</h2>
            <Card className="space-y-3">
              {!warranty.homeowner_name && !warranty.homeowner_email ? (
                <p className="text-sm text-muted">{t('detail.homeowner_not_set')}</p>
              ) : (
                <>
                  {warranty.homeowner_name && <div><p className="text-xs text-muted uppercase tracking-wide mb-0.5">Name</p><p className="text-sm text-ink">{warranty.homeowner_name}</p></div>}
                  {warranty.homeowner_email && <div><p className="text-xs text-muted uppercase tracking-wide mb-0.5">Email</p><p className="text-sm text-ink">{warranty.homeowner_email}</p></div>}
                  {warranty.homeowner_phone && <div><p className="text-xs text-muted uppercase tracking-wide mb-0.5">Phone</p><p className="text-sm text-ink">{warranty.homeowner_phone}</p></div>}
                  {warranty.homeowner_address && <div><p className="text-xs text-muted uppercase tracking-wide mb-0.5">Address</p><p className="text-sm text-ink">{warranty.homeowner_address}</p></div>}
                </>
              )}
              {warranty.homeowner_email && (
                <Button onClick={sendInvite} className="w-full mt-2">
                  {t('form.send_invite')}
                </Button>
              )}
            </Card>

            <div className="mt-4 text-xs text-muted space-y-1">
              <p>{t('col.effective_date')}: {formatDate(warranty.effective_date)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Claims */}
      {activeTab === 'claims' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-ink uppercase tracking-wide">{t('detail.tab_claims')}</h2>
            <Button size="sm" onClick={() => setShowNewClaim(true)}>+ {t('detail.new_claim')}</Button>
          </div>
          <Card padding="none" className="overflow-hidden">
            <Table>
              <THead>
                <TR className="bg-surface-alt hover:bg-surface-alt">
                  <TH>{t('col.claim_number')}</TH>
                  <TH>{t('col.title')}</TH>
                  <TH>{t('col.trade_category')}</TH>
                  <TH>{t('col.status')}</TH>
                  <TH>{t('col.priority')}</TH>
                  <TH>{t('col.reported_date')}</TH>
                  <TH>{t('col.actions')}</TH>
                </TR>
              </THead>
              <TBody>
                {claims.length === 0 && (
                  <TR><TD colSpan={7} className="px-4 py-8 text-center text-muted">{t('detail.no_claims')}</TD></TR>
                )}
                {claims.map(c => (
                  <TR key={c.id}>
                    <TD className="font-mono text-xs text-muted">{c.claim_number}</TD>
                    <TD className="font-medium text-ink">{c.title}</TD>
                    <TD className="text-muted">{t(`trade_category.${c.trade_category}`)}</TD>
                    <TD>
                      <StatusPill status={claimStatusState(c.status)} label={t(`claim_status.${c.status}`)} />
                    </TD>
                    <TD className="capitalize text-muted">{t(`priority.${c.priority}`)}</TD>
                    <TD className="text-muted">{formatDate(c.reported_date)}</TD>
                    <TD>
                      <Link href={`/warranties/${id}/claims/${c.id}`} className="text-xs text-brand-600 hover:underline">
                        {t('open_detail')}
                      </Link>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </Card>
        </div>
      )}

      {/* Tab: Insurance */}
      {activeTab === 'insurance' && (
        <div>
          <h2 className="text-sm font-semibold text-ink uppercase tracking-wide mb-4">{t('detail.tab_insurance')}</h2>
          {insuranceClaims.length === 0 && <p className="text-sm text-muted">{t('detail.no_insurance_claims')}</p>}
          <div className="space-y-3">
            {insuranceClaims.map(ic => (
              <Card key={ic.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-ink">{ic.provider_name ?? '—'}</span>
                  <StatusPill status={claimStatusState(ic.status)} label={ic.status} />
                </div>
                <div className="flex gap-6 text-sm text-muted">
                  <span>{t('col.claimed')}: {formatCents(ic.claim_amount_cents)}</span>
                  <span>{t('col.approved')}: {formatCents(ic.approved_amount_cents)}</span>
                </div>
                <p className="text-xs text-muted">{formatDate(ic.incident_date)}</p>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Audit History */}
      {activeTab === 'audit' && (
        <div>
          <h2 className="text-sm font-semibold text-ink uppercase tracking-wide mb-4">{t('detail.tab_audit')}</h2>
          {auditHistory.length === 0 && <p className="text-sm text-muted">{t('detail.no_audit')}</p>}
          <Card padding="none" className="divide-y divide-line overflow-hidden">
            {auditHistory.map(entry => (
              <div key={entry.id} className="px-4 py-3 flex items-start gap-4">
                <span className="text-xs text-muted whitespace-nowrap mt-0.5">{formatDate(entry.created_at)}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-muted">{entry.claim_title}</span>
                    {entry.from_status && (
                      <>
                        <StatusPill status={claimStatusState(entry.from_status)} label={t(`claim_status.${entry.from_status}`)} />
                        <span className="text-muted">→</span>
                      </>
                    )}
                    <StatusPill status={claimStatusState(entry.to_status)} label={t(`claim_status.${entry.to_status}`)} />
                  </div>
                  {entry.note && <p className="text-xs text-muted mt-0.5 italic">{entry.note}</p>}
                  {entry.changed_by_name && <p className="text-xs text-muted">{entry.changed_by_name}</p>}
                </div>
              </div>
            ))}
          </Card>
        </div>
      )}

      {/* Add coverage slide-over */}
      <SlideOver
        open={showAddCoverage}
        onClose={() => setShowAddCoverage(false)}
        title={t('detail.add_coverage_item')}
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setShowAddCoverage(false)}>{t('form.cancel')}</Button>
            <Button size="sm" onClick={addCoverageItem} loading={saving} disabled={saving || !coverageForm.description}>
              {saving ? t('form.saving') : t('form.add_item')}
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          {error && <div className="rounded-md border border-status-danger/40 bg-status-danger-bg p-3 text-sm text-status-danger">{error}</div>}
          <Select label={t('form.coverage_tier')} value={coverageForm.coverage_tier} onChange={e => setCoverageForm(f => ({ ...f, coverage_tier: e.target.value }))}>
            <option value="workmanship">{t('tier.workmanship')}</option>
            <option value="systems">{t('tier.systems')}</option>
            <option value="structural">{t('tier.structural')}</option>
            <option value="custom">{t('tier.custom')}</option>
          </Select>
          <Input label={t('col.description')} value={coverageForm.description} onChange={e => setCoverageForm(f => ({ ...f, description: e.target.value }))} />
          <div className="grid grid-cols-2 gap-3">
            <Input label={t('form.duration_months')} type="number" min={1} value={coverageForm.duration_months} onChange={e => setCoverageForm(f => ({ ...f, duration_months: e.target.value }))} />
            <Select label={t('col.trade_category')} value={coverageForm.trade_category} onChange={e => setCoverageForm(f => ({ ...f, trade_category: e.target.value }))}>
              <option value="">{t('form.no_template')}</option>
              {['general','electrical','plumbing','hvac','structural','framing','roofing','other'].map(cat => <option key={cat} value={cat}>{t(`trade_category.${cat}`)}</option>)}
            </Select>
          </div>
        </div>
      </SlideOver>

      {/* New claim slide-over */}
      <SlideOver
        open={showNewClaim}
        onClose={() => setShowNewClaim(false)}
        title={t('detail.new_claim')}
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setShowNewClaim(false)}>{t('form.cancel')}</Button>
            <Button size="sm" onClick={createClaim} loading={saving} disabled={saving || !claimForm.title || !claimForm.description}>
              {saving ? t('form.saving') : t('form.create')}
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          {error && <div className="rounded-md border border-status-danger/40 bg-status-danger-bg p-3 text-sm text-status-danger">{error}</div>}
          <Input label={t('form.claim_title')} value={claimForm.title} onChange={e => setClaimForm(f => ({ ...f, title: e.target.value }))} />
          <Textarea label={t('form.claim_description')} rows={4} className="resize-none" value={claimForm.description} onChange={e => setClaimForm(f => ({ ...f, description: e.target.value }))} />
          <div className="grid grid-cols-2 gap-3">
            <Select label={t('col.trade_category')} value={claimForm.trade_category} onChange={e => setClaimForm(f => ({ ...f, trade_category: e.target.value }))}>
              {['general','electrical','plumbing','hvac','structural','framing','roofing','other'].map(cat => <option key={cat} value={cat}>{t(`trade_category.${cat}`)}</option>)}
            </Select>
            <Select label={t('col.priority')} value={claimForm.priority} onChange={e => setClaimForm(f => ({ ...f, priority: e.target.value }))}>
              <option value="low">{t('priority.low')}</option>
              <option value="medium">{t('priority.medium')}</option>
              <option value="high">{t('priority.high')}</option>
              <option value="urgent">{t('priority.urgent')}</option>
            </Select>
          </div>
          <Select label={t('form.coverage_item')} value={claimForm.coverage_item_id} onChange={e => setClaimForm(f => ({ ...f, coverage_item_id: e.target.value }))}>
            <option value="">{t('form.no_coverage_item')}</option>
            {coverageItems.map(ci => <option key={ci.id} value={ci.id}>{ci.description}</option>)}
          </Select>
          <Input label={t('form.reported_date')} type="date" value={claimForm.reported_date} onChange={e => setClaimForm(f => ({ ...f, reported_date: e.target.value }))} />
        </div>
      </SlideOver>
    </div>
  );
}
