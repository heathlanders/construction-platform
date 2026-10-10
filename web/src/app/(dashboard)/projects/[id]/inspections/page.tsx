'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import {
  Button, Input, Select, Textarea, StatusPill, Card,
  Table, THead, TBody, TR, TH, TD, SlideOver, EmptyState, SkeletonRows, useToast,
} from '@/components/ui';

interface Project { id: string; name: string }
interface Inspection {
  id: string;
  title: string;
  inspection_date: string | null;
  status: string;
  notes: string | null;
  version: number;
  created_at: string;
}

function formatDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function truncate(text: string | null, max: number) {
  if (!text) return '—';
  return text.length > max ? text.slice(0, max) + '…' : text;
}

function InspectionSlideOver({ inspection, onClose, onSaved }: {
  inspection: Inspection; onClose: () => void; onSaved: (i: Inspection) => void;
}) {
  const { t } = useTranslation('field');
  const toast = useToast();
  const [form, setForm] = useState({
    title: inspection.title,
    status: inspection.status,
    notes: inspection.notes ?? '',
    inspection_date: inspection.inspection_date ? inspection.inspection_date.slice(0, 10) : '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const save = async () => {
    setSaving(true); setError('');
    try {
      const res = await fetch(`/api/inspections/${inspection.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title, status: form.status,
          notes: form.notes || null,
          inspection_date: form.inspection_date ? new Date(form.inspection_date).toISOString() : null,
          version: inspection.version,
        }),
      });
      const data = await res.json();
      if (res.status === 409) { setError(t('inspections.conflict', { defaultValue: 'Inspection was updated by someone else — reload.' })); return; }
      if (!res.ok) { setError(data?.error?.message ?? t('inspections.save_failed', { defaultValue: 'Save failed' })); return; }
      toast.success(t('inspections.saved', { defaultValue: 'Saved' }));
      onSaved(data.inspection);
    } catch { setError(t('inspections.network_error', { defaultValue: 'Network error' })); } finally { setSaving(false); }
  };

  const STATUSES = [
    { value: 'scheduled', label: t('inspections.inspection_status.scheduled') },
    { value: 'passed', label: t('inspections.inspection_status.passed') },
    { value: 'failed', label: t('inspections.inspection_status.failed') },
    { value: 'requires_action', label: t('inspections.inspection_status.requires_action') },
  ];

  return (
    <SlideOver
      open
      onClose={onClose}
      title={t('inspections.inspection', { defaultValue: 'Inspection' })}
      width="max-w-[420px]"
      footer={
        <div className="flex w-full justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={onClose}>{t('inspections.cancel', { defaultValue: 'Cancel' })}</Button>
          <Button size="sm" onClick={save} loading={saving} disabled={!form.title.trim()}>{t('inspections.save', { defaultValue: 'Save' })}</Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        {error && <div className="rounded-md border border-status-danger/40 bg-status-danger-bg p-3 text-sm text-status-danger">{error}</div>}
        <Input label={t('inspections.inspection_title')} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
        <div className="grid grid-cols-2 gap-3">
          <Select label={t('inspections.status')} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
            {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </Select>
          <Input type="date" label={t('inspections.date')} value={form.inspection_date} onChange={e => setForm(f => ({ ...f, inspection_date: e.target.value }))} />
        </div>
        <Textarea label={t('inspections.notes')} rows={5} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder={t('inspections.notes_placeholder')} />
      </div>
    </SlideOver>
  );
}

export default function InspectionsPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation('field');

  const [project, setProject] = useState<Project | null>(null);
  const [inspections, setInspections] = useState<Inspection[] | null>(null);
  const [selected, setSelected] = useState<Inspection | null>(null);
  const [tradeFilter, setTradeFilter] = useState<'all' | 'electrical' | 'general'>('all');

  const load = useCallback(() => {
    let qs = `project_id=${id}&limit=50`;
    if (tradeFilter === 'electrical') qs += '&trade_type=electrical';
    else if (tradeFilter === 'general') qs += '&trade_type=general';
    void Promise.allSettled([
      fetch(`/api/projects/${id}`).then(r => r.json()).then(d => { if (d.project) setProject(d.project as Project); }),
      fetch(`/api/inspections?${qs}`).then(r => r.json()).then(d => setInspections(d.inspections ?? [])),
    ]);
  }, [id, tradeFilter]);

  useEffect(() => { load(); }, [load]);

  const filterLabel = (f: 'all' | 'electrical' | 'general') =>
    f === 'all'
      ? t('inspections.filter_all', { defaultValue: 'All' })
      : f === 'electrical'
        ? t('inspections.filter_electrical', { defaultValue: 'Electrical Milestones' })
        : t('inspections.filter_general', { defaultValue: 'General' });

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <div className="mb-1 flex items-center gap-2 text-sm text-muted">
          <Link href="/projects" className="hover:text-ink">Projects</Link>
          <span>/</span>
          <Link href={`/projects/${id}`} className="hover:text-ink">{project?.name ?? '…'}</Link>
          <span>/</span>
          <span className="text-ink">{t('inspections.title')}</span>
        </div>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight text-ink">{t('inspections.title')}</h1>
          <Link href={`/projects/${id}/inspections/new`}><Button>+ {t('inspections.new')}</Button></Link>
        </div>
      </div>

      {/* Trade type filter pills */}
      <div className="flex gap-2">
        {(['all', 'electrical', 'general'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setTradeFilter(f)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              tradeFilter === f
                ? 'border-brand-600 bg-brand-600 text-white'
                : 'border-line bg-surface text-muted hover:border-brand-500'
            }`}
          >
            {filterLabel(f)}
          </button>
        ))}
      </div>

      {inspections === null ? (
        <SkeletonRows rows={5} />
      ) : inspections.length === 0 ? (
        <EmptyState title={t('inspections.no_inspections')} />
      ) : (
        <Card padding="none" className="overflow-hidden">
          <Table>
            <THead>
              <TR>
                <TH>{t('inspections.inspection_title')}</TH>
                <TH>{t('inspections.date')}</TH>
                <TH>{t('inspections.status')}</TH>
                <TH>{t('inspections.notes')}</TH>
              </TR>
            </THead>
            <TBody>
              {inspections.map(inspection => (
                <TR key={inspection.id} onClick={() => setSelected(inspection)} className="cursor-pointer">
                  <TD className="font-medium">{inspection.title}</TD>
                  <TD className="whitespace-nowrap text-muted">{formatDate(inspection.inspection_date)}</TD>
                  <TD><StatusPill status={inspection.status} /></TD>
                  <TD className="text-muted">{truncate(inspection.notes, 60)}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </Card>
      )}

      {selected && (
        <InspectionSlideOver
          inspection={selected}
          onClose={() => setSelected(null)}
          onSaved={updated => { setInspections(prev => (prev ?? []).map(i => i.id === updated.id ? updated : i)); setSelected(null); }}
        />
      )}
    </div>
  );
}
