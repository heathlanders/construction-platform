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
  Spinner,
} from '@/components/ui';

interface WarrantyClaim {
  id: string;
  claim_number: string;
  title: string;
  description: string;
  trade_category: string;
  status: string;
  priority: string;
  reported_date: string;
  coverage_item_id: string | null;
  vendor_id: string | null;
  vendor_name: string | null;
  contract_id: string | null;
  insurance_claim_id: string | null;
  sub_labor_cents: number | null;
  sub_materials_cents: number | null;
  gc_labor_cents: number | null;
  gc_materials_cents: number | null;
  target_resolution_date: string | null;
  resolved_date: string | null;
  resolution_notes: string | null;
}

interface StatusHistoryEntry {
  id: string;
  from_status: string | null;
  to_status: string;
  changed_by_name: string | null;
  note: string | null;
  created_at: string;
}

interface Attachment {
  id: string;
  file_name: string;
  url: string;
  created_at: string;
}

interface Vendor {
  id: string;
  name: string;
  trade_type: string | null;
}

// Claim status → canonical status state (color via lib/status).
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
};
function claimStatusState(s: string): string {
  return CLAIM_STATUS_STATE[s] ?? s;
}

// Priority → canonical status state (color via lib/status).
const PRIORITY_STATE: Record<string, string> = {
  low: 'draft',       // neutral
  medium: 'open',     // info
  high: 'pending',    // warning
  urgent: 'overdue',  // danger
};

const ALL_STATUSES = ['submitted','under_review','sub_notified','sub_accepted','sub_disputed','repair_scheduled','repair_complete','closed','denied'];

function formatDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatCents(cents: number | null) {
  if (cents === null) return '—';
  return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function ClaimDetailPage() {
  const { id, claimId } = useParams<{ id: string; claimId: string }>();
  const { t } = useTranslation('warranties');
  const [claim, setClaim] = useState<WarrantyClaim | null>(null);
  const [history, setHistory] = useState<StatusHistoryEntry[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);

  // Status transition
  const [selectedStatus, setSelectedStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusError, setStatusError] = useState('');

  // Route to sub
  const [selectedVendorId, setSelectedVendorId] = useState('');
  const [routingToSub, setRoutingToSub] = useState(false);
  const [routeError, setRouteError] = useState('');
  const [routeSuccess, setRouteSuccess] = useState('');

  // Resolution editing
  const [editResolution, setEditResolution] = useState(false);
  const [resolutionForm, setResolutionForm] = useState({ target_resolution_date: '', resolved_date: '', resolution_notes: '' });
  const [savingResolution, setSavingResolution] = useState(false);

  const loadClaim = () => {
    fetch(`/api/builder-warranties/${id}/claims/${claimId}`)
      .then(r => r.json())
      .then(d => {
        if (d.claim) {
          const c = d.claim as WarrantyClaim;
          setClaim(c);
          setResolutionForm({
            target_resolution_date: c.target_resolution_date?.slice(0, 10) ?? '',
            resolved_date: c.resolved_date?.slice(0, 10) ?? '',
            resolution_notes: c.resolution_notes ?? '',
          });
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadClaim();
    fetch(`/api/builder-warranties/${id}/claims/${claimId}/status-history`)
      .then(r => r.json())
      .then(d => { if (d.history) setHistory(d.history as StatusHistoryEntry[]); })
      .catch(() => {});
    fetch(`/api/builder-warranties/${id}/claims/${claimId}/attachments`)
      .then(r => r.json())
      .then(d => { if (d.attachments) setAttachments(d.attachments as Attachment[]); })
      .catch(() => {});
    fetch('/api/vendors?limit=100')
      .then(r => r.json())
      .then(d => { if (d.vendors) setVendors(d.vendors as Vendor[]); })
      .catch(() => {});
  }, [id, claimId]);

  const updateStatus = async () => {
    if (!selectedStatus) return;
    setUpdatingStatus(true); setStatusError('');
    try {
      const res = await fetch(`/api/builder-warranties/${id}/claims/${claimId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: selectedStatus, status_note: statusNote || null }),
      });
      const data = await res.json();
      if (!res.ok) { setStatusError(data?.error?.message ?? t('errors.save_failed')); return; }
      setClaim(data.claim as WarrantyClaim);
      setSelectedStatus(''); setStatusNote('');
      // Reload history
      fetch(`/api/builder-warranties/${id}/claims/${claimId}/status-history`)
        .then(r => r.json())
        .then(d => { if (d.history) setHistory(d.history as StatusHistoryEntry[]); })
        .catch(() => {});
    } catch { setStatusError(t('errors.network_error')); } finally { setUpdatingStatus(false); }
  };

  const routeToSub = async () => {
    if (!selectedVendorId) return;
    setRoutingToSub(true); setRouteError(''); setRouteSuccess('');
    try {
      const res = await fetch(`/api/builder-warranties/${id}/claims/${claimId}/route-to-sub`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vendor_id: selectedVendorId }),
      });
      if (!res.ok) { setRouteError(t('claim_detail.route_error')); return; }
      setRouteSuccess(t('claim_detail.route_success'));
      loadClaim();
    } catch { setRouteError(t('errors.network_error')); } finally { setRoutingToSub(false); }
  };

  const saveResolution = async () => {
    setSavingResolution(true);
    try {
      const res = await fetch(`/api/builder-warranties/${id}/claims/${claimId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_resolution_date: resolutionForm.target_resolution_date || null,
          resolved_date: resolutionForm.resolved_date || null,
          resolution_notes: resolutionForm.resolution_notes || null,
        }),
      });
      if (res.ok) { loadClaim(); setEditResolution(false); }
    } catch {} finally { setSavingResolution(false); }
  };

  const filteredVendors = vendors.filter(v => !claim?.trade_category || !v.trade_type || v.trade_type === claim.trade_category || claim.trade_category === 'general');

  if (!claim) {
    return (
      <div className="flex items-center justify-center gap-2 h-48 text-muted text-sm">
        <Spinner className="h-4 w-4" />{t('homeowner.loading')}
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Link href={`/warranties/${id}`} className="text-sm text-brand-600 hover:underline mb-2 inline-block">
          ← {t('detail.tab_claims')}
        </Link>
        <p className="text-xs font-mono text-muted mb-1">{claim.claim_number}</p>
        <PageHeader
          title={claim.title}
          subtitle={
            <span className="flex flex-wrap items-center gap-2">
              <StatusPill status={claimStatusState(claim.status)} label={t(`claim_status.${claim.status}`)} />
              <Badge status={PRIORITY_STATE[claim.priority] ?? 'draft'}>{t(`priority.${claim.priority}`)}</Badge>
              <span className="text-xs text-muted">{t(`trade_category.${claim.trade_category}`)}</span>
            </span>
          }
        />
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left column — main content */}
        <div className="col-span-2 space-y-6">
          {/* Description */}
          <Card padding="lg">
            <p className="text-xs text-muted uppercase tracking-wide mb-2">{t('col.description')}</p>
            <p className="text-sm text-ink whitespace-pre-wrap">{claim.description}</p>
            <p className="text-xs text-muted mt-3">{t('col.reported_date')}: {formatDate(claim.reported_date)}</p>
          </Card>

          {/* Status timeline */}
          <Card padding="lg">
            <h2 className="text-sm font-semibold text-ink uppercase tracking-wide mb-4">{t('claim_detail.status_history')}</h2>
            {history.length === 0 && <p className="text-sm text-muted">{t('claim_detail.no_history', { defaultValue: 'No history yet.' })}</p>}
            <ol className="relative border-l border-line space-y-4 pl-5">
              {history.map(entry => (
                <li key={entry.id}>
                  <div className="absolute -left-1.5 mt-1 w-3 h-3 rounded-full bg-brand-500 border-2 border-surface" />
                  <div>
                    <p className="text-xs text-muted">{formatDate(entry.created_at)}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-0.5">
                      {entry.from_status && (
                        <>
                          <StatusPill status={claimStatusState(entry.from_status)} label={t(`claim_status.${entry.from_status}`)} />
                          <span className="text-muted">→</span>
                        </>
                      )}
                      <StatusPill status={claimStatusState(entry.to_status)} label={t(`claim_status.${entry.to_status}`)} />
                    </div>
                    {entry.note && <p className="text-xs text-muted italic mt-0.5">{entry.note}</p>}
                    {entry.changed_by_name && <p className="text-xs text-muted">{entry.changed_by_name}</p>}
                  </div>
                </li>
              ))}
            </ol>
          </Card>

          {/* Attachments */}
          <Card padding="lg">
            <h2 className="text-sm font-semibold text-ink uppercase tracking-wide mb-3">{t('claim_detail.attachments')}</h2>
            {attachments.length === 0 && <p className="text-sm text-muted mb-3">{t('claim_detail.no_attachments')}</p>}
            <div className="grid grid-cols-3 gap-3 mb-3">
              {attachments.map(att => (
                <a key={att.id} href={att.url} target="_blank" rel="noreferrer" className="block rounded-md bg-surface-alt aspect-square overflow-hidden hover:opacity-80">
                  {att.url.match(/\.(jpg|jpeg|png|gif|webp)/i) ? (
                    <img src={att.url} alt={att.file_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex items-center justify-center h-full text-xs text-muted p-2 text-center">{att.file_name}</div>
                  )}
                </a>
              ))}
            </div>
            <button className="text-xs text-brand-600 hover:underline">{t('claim_detail.upload_photo')}</button>
          </Card>
        </div>

        {/* Right column — actions and metadata */}
        <div className="space-y-5">
          {/* Sub liability */}
          <Card className="space-y-3">
            <h2 className="text-sm font-semibold text-ink uppercase tracking-wide">{t('claim_detail.sub_liability')}</h2>
            {!claim.vendor_id ? (
              <div className="space-y-2">
                <p className="text-sm text-muted">{t('claim_detail.no_sub_assigned')}</p>
                <Select value={selectedVendorId} onChange={e => setSelectedVendorId(e.target.value)}>
                  <option value="">{t('form.select_vendor')}</option>
                  {filteredVendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                </Select>
                {routeError && <p className="text-xs text-status-danger">{routeError}</p>}
                {routeSuccess && <p className="text-xs text-status-success">{routeSuccess}</p>}
                <Button
                  onClick={routeToSub}
                  loading={routingToSub}
                  disabled={routingToSub || !selectedVendorId}
                  className="w-full"
                >
                  {routingToSub ? t('form.saving') : t('claim_detail.assign_sub')}
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <div><p className="text-xs text-muted uppercase tracking-wide mb-0.5">{t('claim_detail.sub_name')}</p><p className="text-sm text-ink font-medium">{claim.vendor_name}</p></div>
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <div>
                    <p className="text-xs text-muted uppercase tracking-wide mb-0.5">{t('claim_detail.sub_costs')}</p>
                    <p className="text-xs text-ink">{t('claim_detail.labor')}: {formatCents(claim.sub_labor_cents)}</p>
                    <p className="text-xs text-ink">{t('claim_detail.materials')}: {formatCents(claim.sub_materials_cents)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted uppercase tracking-wide mb-0.5">{t('claim_detail.gc_costs')}</p>
                    <p className="text-xs text-ink">{t('claim_detail.labor')}: {formatCents(claim.gc_labor_cents)}</p>
                    <p className="text-xs text-ink">{t('claim_detail.materials')}: {formatCents(claim.gc_materials_cents)}</p>
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* Insurance */}
          <Card className="space-y-2">
            <h2 className="text-sm font-semibold text-ink uppercase tracking-wide">{t('claim_detail.insurance_section')}</h2>
            {!claim.insurance_claim_id ? (
              <div className="space-y-2">
                <p className="text-sm text-muted">{t('claim_detail.no_insurance_filed')}</p>
                <Button variant="secondary" className="w-full">
                  {t('claim_detail.file_insurance')}
                </Button>
              </div>
            ) : (
              <p className="text-xs text-status-success">{t('claim_detail.insurance_filed', { defaultValue: 'Insurance claim filed' })} (ID: {claim.insurance_claim_id.slice(0, 8)}…)</p>
            )}
          </Card>

          {/* Resolution */}
          <Card className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-ink uppercase tracking-wide">{t('claim_detail.resolution')}</h2>
              {!editResolution && (
                <button onClick={() => setEditResolution(true)} className="text-xs text-brand-600 hover:underline">{t('form.edit', { defaultValue: 'Edit' })}</button>
              )}
            </div>
            {!editResolution ? (
              <div className="space-y-2">
                <div><p className="text-xs text-muted">{t('claim_detail.target_date')}</p><p className="text-sm text-ink">{formatDate(claim.target_resolution_date)}</p></div>
                <div><p className="text-xs text-muted">{t('claim_detail.resolved_date')}</p><p className="text-sm text-ink">{formatDate(claim.resolved_date)}</p></div>
                {claim.resolution_notes && <div><p className="text-xs text-muted">{t('claim_detail.resolution_notes')}</p><p className="text-sm text-ink">{claim.resolution_notes}</p></div>}
              </div>
            ) : (
              <div className="space-y-2">
                <Input label={t('claim_detail.target_date')} type="date" value={resolutionForm.target_resolution_date} onChange={e => setResolutionForm(f => ({ ...f, target_resolution_date: e.target.value }))} />
                <Input label={t('claim_detail.resolved_date')} type="date" value={resolutionForm.resolved_date} onChange={e => setResolutionForm(f => ({ ...f, resolved_date: e.target.value }))} />
                <Textarea label={t('claim_detail.resolution_notes')} rows={3} className="resize-none" value={resolutionForm.resolution_notes} onChange={e => setResolutionForm(f => ({ ...f, resolution_notes: e.target.value }))} />
                <div className="flex gap-2">
                  <Button size="sm" onClick={saveResolution} loading={savingResolution} disabled={savingResolution}>
                    {savingResolution ? t('form.saving') : t('claim_detail.save_resolution')}
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => setEditResolution(false)}>{t('form.cancel')}</Button>
                </div>
              </div>
            )}
          </Card>

          {/* Status actions */}
          <Card className="space-y-3">
            <h2 className="text-sm font-semibold text-ink uppercase tracking-wide">{t('claim_detail.status_actions')}</h2>
            {statusError && <p className="text-xs text-status-danger">{statusError}</p>}
            <Select value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)}>
              <option value="">{t('claim_detail.select_status')}</option>
              {ALL_STATUSES.filter(s => s !== claim.status).map(s => (
                <option key={s} value={s}>{t(`claim_status.${s}`)}</option>
              ))}
            </Select>
            <Textarea
              rows={2}
              placeholder={t('form.transition_note')}
              className="resize-none"
              value={statusNote}
              onChange={e => setStatusNote(e.target.value)}
            />
            <Button
              onClick={updateStatus}
              loading={updatingStatus}
              disabled={updatingStatus || !selectedStatus}
              className="w-full"
            >
              {updatingStatus ? t('claim_detail.updating') : t('claim_detail.update')}
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
