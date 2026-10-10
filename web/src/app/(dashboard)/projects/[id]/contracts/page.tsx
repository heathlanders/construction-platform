'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import {
  Button, Select, Input, StatusPill, KpiTile, Card,
  Table, THead, TBody, TR, TH, TD, SlideOver, EmptyState, SkeletonRows, useToast,
} from '@/components/ui';

interface Project { id: string; name: string }
interface Vendor { id: string; name: string }
interface Contract {
  id: string;
  contract_type: string;
  vendor_id: string | null;
  original_value_cents: number;
  approved_co_value_cents: number;
  current_value_cents: number;
  status: string;
  retainage_pct: number;
  executed_at: string | null;
  version: number;
  created_at: string;
}

function formatDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatCents(c: number) {
  return (c / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

function formatContractType(type: string) {
  return type.replace(/_/g, ' ').replace(/\b\w/g, ch => ch.toUpperCase());
}

function ContractSlideOver({ contract, vendorMap, onClose, onSaved }: {
  contract: Contract; vendorMap: Record<string, string>;
  onClose: () => void; onSaved: (c: Contract) => void;
}) {
  const { t } = useTranslation('financial');
  const toast = useToast();
  const [form, setForm] = useState({
    status: contract.status,
    retainage_pct: String(contract.retainage_pct),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const CONTRACT_STATUSES = [
    { value: 'draft', label: t('contracts.contract_status.draft', { defaultValue: 'Draft' }) },
    { value: 'pending_signature', label: t('contracts.contract_status.pending_signature', { defaultValue: 'Pending Signature' }) },
    { value: 'executed', label: t('contracts.contract_status.executed', { defaultValue: 'Executed' }) },
    { value: 'complete', label: t('contracts.contract_status.complete', { defaultValue: 'Complete' }) },
    { value: 'terminated', label: t('contracts.contract_status.terminated', { defaultValue: 'Terminated' }) },
  ];

  const save = async () => {
    setSaving(true); setError('');
    try {
      const res = await fetch(`/api/contracts/${contract.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: form.status,
          retainage_pct: parseFloat(form.retainage_pct) || 0,
          version: contract.version,
        }),
      });
      const data = await res.json();
      if (res.status === 409) { setError(t('contracts.conflict', { defaultValue: 'Contract was updated by someone else — reload.' })); return; }
      if (!res.ok) { setError(data?.error?.message ?? t('contracts.save_failed', { defaultValue: 'Save failed' })); return; }
      toast.success(t('contracts.saved', { defaultValue: 'Saved' }));
      onSaved(data.contract);
    } catch { setError(t('contracts.network_error', { defaultValue: 'Network error' })); } finally { setSaving(false); }
  };

  const vendorName = contract.vendor_id ? (vendorMap[contract.vendor_id] ?? t('contracts.unknown_vendor', { defaultValue: 'Unknown Vendor' })) : t('contracts.owner_prime');

  return (
    <SlideOver
      open
      onClose={onClose}
      width="max-w-[440px]"
      title={
        <div>
          <span className="text-base font-semibold text-ink">{formatContractType(contract.contract_type)}</span>
          <p className="text-xs text-muted">{vendorName}</p>
        </div>
      }
      footer={
        <div className="flex w-full justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={onClose}>{t('contracts.cancel', { defaultValue: 'Cancel' })}</Button>
          <Button size="sm" onClick={save} loading={saving}>{t('contracts.save', { defaultValue: 'Save' })}</Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        {error && <div className="rounded-md border border-status-danger/40 bg-status-danger-bg p-3 text-sm text-status-danger">{error}</div>}

        {/* Read-only financials */}
        <div className="space-y-2 rounded-md bg-surface-alt p-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted">{t('contracts.original_value')}</span>
            <span className="font-medium text-ink">{formatCents(contract.original_value_cents)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted">{t('contracts.co_adjustments')}</span>
            <span className="font-medium text-ink">{formatCents(contract.approved_co_value_cents)}</span>
          </div>
          <div className="flex justify-between border-t border-line pt-2 text-sm">
            <span className="font-medium text-ink">{t('contracts.current_value')}</span>
            <span className="font-bold text-ink">{formatCents(contract.current_value_cents)}</span>
          </div>
          {contract.executed_at && (
            <div className="flex justify-between text-sm">
              <span className="text-muted">{t('contracts.executed', { defaultValue: 'Executed' })}</span>
              <span className="text-ink">{formatDate(contract.executed_at)}</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Select label={t('contracts.status')} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
            {CONTRACT_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </Select>
          <Input type="number" min="0" max="100" step="0.5" label={t('contracts.retainage_pct', { defaultValue: 'Retainage %' })}
            value={form.retainage_pct} onChange={e => setForm(f => ({ ...f, retainage_pct: e.target.value }))} />
        </div>

        <div className="border-t border-line pt-2">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">{t('contracts.quick_transitions', { defaultValue: 'Quick Transitions' })}</p>
          <div className="flex flex-wrap gap-2">
            {form.status === 'draft' && (
              <button onClick={() => setForm(f => ({ ...f, status: 'pending_signature' }))}
                className="rounded-full bg-status-warning-bg px-3 py-1 text-xs text-status-warning hover:opacity-80">
                {t('contracts.send_for_signature', { defaultValue: 'Send for Signature' })}
              </button>
            )}
            {form.status === 'pending_signature' && (
              <button onClick={() => setForm(f => ({ ...f, status: 'executed' }))}
                className="rounded-full bg-status-success-bg px-3 py-1 text-xs text-status-success hover:opacity-80">
                {t('contracts.mark_executed', { defaultValue: 'Mark Executed' })}
              </button>
            )}
            {form.status === 'executed' && (
              <button onClick={() => setForm(f => ({ ...f, status: 'complete' }))}
                className="rounded-full bg-status-info-bg px-3 py-1 text-xs text-status-info hover:opacity-80">
                {t('contracts.mark_complete', { defaultValue: 'Mark Complete' })}
              </button>
            )}
          </div>
        </div>

        <p className="border-t border-line pt-2 text-xs text-muted">{t('contracts.created', { defaultValue: 'Created' })} {formatDate(contract.created_at)}</p>
      </div>
    </SlideOver>
  );
}

export default function ContractsPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation('financial');

  const [project, setProject] = useState<Project | null>(null);
  const [contracts, setContracts] = useState<Contract[] | null>(null);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [selected, setSelected] = useState<Contract | null>(null);

  const load = useCallback(() => {
    void Promise.allSettled([
      fetch(`/api/projects/${id}`).then(r => r.json()).then(d => { if (d.project) setProject(d.project as Project); }),
      fetch(`/api/contracts?project_id=${id}&limit=100`).then(r => r.json()).then(d => setContracts(d.contracts ?? [])),
      fetch('/api/vendors?limit=100').then(r => r.json()).then(d => { if (d.vendors) setVendors(d.vendors as Vendor[]); }),
    ]);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const list = contracts ?? [];
  const vendorMap = Object.fromEntries(vendors.map(v => [v.id, v.name]));
  const totalValue = list.reduce((sum, c) => sum + c.current_value_cents, 0);

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <div className="mb-1 flex items-center gap-2 text-sm text-muted">
          <Link href="/projects" className="hover:text-ink">Projects</Link>
          <span>/</span>
          <Link href={`/projects/${id}`} className="hover:text-ink">{project?.name ?? '…'}</Link>
          <span>/</span>
          <span className="text-ink">{t('contracts.title')}</span>
        </div>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight text-ink">{t('contracts.title')}</h1>
          <Link href={`/projects/${id}/contracts/new`}><Button>+ {t('contracts.new')}</Button></Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <KpiTile label={t('contracts.total_contract_value')} value={formatCents(totalValue)} />
        <KpiTile label={t('contracts.contracts_count')} value={list.length} />
      </div>

      {contracts === null ? (
        <SkeletonRows rows={5} />
      ) : contracts.length === 0 ? (
        <EmptyState title={t('contracts.no_contracts')} />
      ) : (
        <Card padding="none" className="overflow-hidden">
          <Table>
            <THead>
              <TR>
                <TH>{t('contracts.type')}</TH>
                <TH>{t('contracts.vendor')}</TH>
                <TH>{t('contracts.original_value')}</TH>
                <TH>{t('contracts.co_adjustments')}</TH>
                <TH>{t('contracts.current_value')}</TH>
                <TH>{t('contracts.status')}</TH>
              </TR>
            </THead>
            <TBody>
              {contracts.map(contract => (
                <TR key={contract.id} onClick={() => setSelected(contract)} className="cursor-pointer">
                  <TD className="font-medium">{formatContractType(contract.contract_type)}</TD>
                  <TD className="text-muted">
                    {contract.vendor_id ? (vendorMap[contract.vendor_id] ?? '—') : t('contracts.owner_prime')}
                  </TD>
                  <TD>{formatCents(contract.original_value_cents)}</TD>
                  <TD>{formatCents(contract.approved_co_value_cents)}</TD>
                  <TD className="font-medium">{formatCents(contract.current_value_cents)}</TD>
                  <TD><StatusPill status={contract.status} /></TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </Card>
      )}

      {selected && (
        <ContractSlideOver
          contract={selected}
          vendorMap={vendorMap}
          onClose={() => setSelected(null)}
          onSaved={updated => { setContracts(prev => (prev ?? []).map(c => c.id === updated.id ? updated : c)); setSelected(null); }}
        />
      )}
    </div>
  );
}
