'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import {
  Button, Input, Select, Textarea, KpiTile, Card,
  Table, THead, TBody, TR, TH, TD, SlideOver, EmptyState, SkeletonRows, useToast, useConfirm,
} from '@/components/ui';

interface Project { id: string; name: string }
interface User { id: string; first_name: string; last_name: string; }
interface CostCode { id: string; code: string; name: string; }
interface TimeEntry {
  id: string;
  date: string;
  user_id: string;
  hours_worked: number;
  cost_code_id: string | null;
  notes: string | null;
  budget_line_item_id: string | null;
  hourly_rate_cents: number | null;
  version: number;
  created_at: string;
}

function formatDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatHours(h: number) {
  return h.toFixed(2) + ' hrs';
}

function formatCents(c: number) {
  return (c / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

function truncate(text: string | null, max: number) {
  if (!text) return '—';
  return text.length > max ? text.slice(0, max) + '…' : text;
}

function TimeEntrySlideOver({ entry, userMap, costCodes, onClose, onSaved, onDeleted }: {
  entry: TimeEntry; userMap: Record<string, User>; costCodes: CostCode[];
  onClose: () => void; onSaved: (e: TimeEntry) => void; onDeleted: (id: string) => void;
}) {
  const { t } = useTranslation('field');
  const toast = useToast();
  const confirm = useConfirm();
  const [form, setForm] = useState({
    date: entry.date ? entry.date.slice(0, 10) : '',
    hours_worked: String(entry.hours_worked),
    notes: entry.notes ?? '',
    cost_code_id: entry.cost_code_id ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const save = async () => {
    setSaving(true); setError('');
    try {
      const res = await fetch(`/api/time-entries/${entry.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: form.date || null,
          hours_worked: parseFloat(form.hours_worked) || 0,
          notes: form.notes || null,
          cost_code_id: form.cost_code_id || null,
          version: entry.version,
        }),
      });
      const data = await res.json();
      if (res.status === 409) { setError(t('time_entries.conflict', { defaultValue: 'Entry was updated by someone else — reload.' })); return; }
      if (!res.ok) { setError(data?.error?.message ?? t('time_entries.save_failed', { defaultValue: 'Save failed' })); return; }
      toast.success(t('time_entries.saved', { defaultValue: 'Saved' }));
      onSaved(data.time_entry);
    } catch { setError(t('time_entries.network_error', { defaultValue: 'Network error' })); } finally { setSaving(false); }
  };

  const del = async () => {
    const ok = await confirm({
      title: t('time_entries.delete_title', { defaultValue: 'Delete this time entry?' }),
      tone: 'danger',
      confirmLabel: t('time_entries.delete', { defaultValue: 'Delete' }),
    });
    if (!ok) return;
    setDeleting(true);
    try {
      await fetch(`/api/time-entries/${entry.id}`, { method: 'DELETE' });
      toast.success(t('time_entries.deleted', { defaultValue: 'Deleted' }));
      onDeleted(entry.id);
    } finally { setDeleting(false); }
  };

  const worker = userMap[entry.user_id];
  const workerName = worker ? `${worker.first_name} ${worker.last_name}` : '—';

  return (
    <SlideOver
      open
      onClose={onClose}
      width="max-w-[420px]"
      title={
        <div>
          <span className="text-base font-semibold text-ink">{t('time_entries.time_entry', { defaultValue: 'Time Entry' })}</span>
          <p className="text-xs text-muted">{workerName}</p>
        </div>
      }
      footer={
        <div className="flex w-full items-center justify-between">
          <Button variant="ghost" size="sm" onClick={del} disabled={deleting} className="text-status-danger hover:bg-status-danger-bg">
            {deleting ? '…' : t('time_entries.delete', { defaultValue: 'Delete' })}
          </Button>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={onClose}>{t('time_entries.cancel', { defaultValue: 'Cancel' })}</Button>
            <Button size="sm" onClick={save} loading={saving} disabled={!form.hours_worked || parseFloat(form.hours_worked) <= 0}>{t('time_entries.save', { defaultValue: 'Save' })}</Button>
          </div>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        {error && <div className="rounded-md border border-status-danger/40 bg-status-danger-bg p-3 text-sm text-status-danger">{error}</div>}

        <div className="grid grid-cols-2 gap-3">
          <Input type="date" label={t('time_entries.date')} value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
          <Input type="number" min="0" max="24" step="0.25" label={t('time_entries.hours')}
            value={form.hours_worked} onChange={e => setForm(f => ({ ...f, hours_worked: e.target.value }))} />
        </div>

        <Select label={t('time_entries.cost_code_label')} value={form.cost_code_id} onChange={e => setForm(f => ({ ...f, cost_code_id: e.target.value }))}>
          <option value="">{t('time_entries.no_cost_code')}</option>
          {costCodes.map(cc => <option key={cc.id} value={cc.id}>{cc.code} — {cc.name}</option>)}
        </Select>

        <Textarea label={t('time_entries.notes')} rows={4} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder={t('time_entries.notes_placeholder')} />

        {entry.hourly_rate_cents != null && (
          <div className="rounded-md bg-surface-alt p-3 text-sm">
            <p className="text-muted">{t('time_entries.rate_at_entry', { defaultValue: 'Rate at time of entry:' })} <span className="font-medium text-ink">{formatCents(entry.hourly_rate_cents)}/hr</span></p>
          </div>
        )}

        <p className="border-t border-line pt-2 text-xs text-muted">{t('time_entries.created', { defaultValue: 'Created' })} {formatDate(entry.created_at)}</p>
      </div>
    </SlideOver>
  );
}

export default function TimeEntriesPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation('field');

  const [project, setProject] = useState<Project | null>(null);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[] | null>(null);
  const [userMap, setUserMap] = useState<Record<string, User>>({});
  const [costCodes, setCostCodes] = useState<CostCode[]>([]);
  const [selected, setSelected] = useState<TimeEntry | null>(null);

  const load = useCallback(() => {
    void Promise.allSettled([
      fetch(`/api/projects/${id}`).then(r => r.json()).then(d => { if (d.project) setProject(d.project as Project); }),
      fetch(`/api/time-entries?project_id=${id}&limit=50`).then(r => r.json()).then(d => setTimeEntries(d.time_entries ?? [])),
      fetch('/api/users?limit=100').then(r => r.json()).then(d => {
        if (d.users) setUserMap(Object.fromEntries((d.users as User[]).map(u => [u.id, u])));
      }),
      fetch(`/api/cost-codes?project_id=${id}&limit=100`).then(r => r.json()).then(d => { if (d.cost_codes) setCostCodes(d.cost_codes as CostCode[]); }),
    ]);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const list = timeEntries ?? [];
  const totalHours = list.reduce((sum, e) => sum + e.hours_worked, 0);
  const totalCostCents = list.reduce((sum, e) => {
    if (e.hourly_rate_cents == null) return sum;
    return sum + Math.floor(e.hours_worked * e.hourly_rate_cents);
  }, 0);

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <div className="mb-1 flex items-center gap-2 text-sm text-muted">
          <Link href="/projects" className="hover:text-ink">Projects</Link>
          <span>/</span>
          <Link href={`/projects/${id}`} className="hover:text-ink">{project?.name ?? '…'}</Link>
          <span>/</span>
          <span className="text-ink">{t('time_entries.title')}</span>
        </div>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight text-ink">{t('time_entries.title')}</h1>
          <Link href={`/projects/${id}/time-entries/new`}><Button>+ {t('time_entries.new')}</Button></Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <KpiTile
          label={t('time_entries.total_hours')}
          value={formatHours(totalHours)}
          hint={`${list.length} entr${list.length !== 1 ? 'ies' : 'y'}`}
        />
        <KpiTile
          label={t('time_entries.total_cost')}
          value={formatCents(totalCostCents)}
          hint={t('time_entries.entries_with_rate')}
        />
      </div>

      {timeEntries === null ? (
        <SkeletonRows rows={5} />
      ) : timeEntries.length === 0 ? (
        <EmptyState title={t('time_entries.no_entries')} />
      ) : (
        <Card padding="none" className="overflow-hidden">
          <Table>
            <THead>
              <TR>
                <TH>{t('time_entries.date')}</TH>
                <TH>{t('time_entries.worker')}</TH>
                <TH>{t('time_entries.hours')}</TH>
                <TH>{t('time_entries.rate')}</TH>
                <TH>{t('time_entries.notes')}</TH>
              </TR>
            </THead>
            <TBody>
              {timeEntries.map(entry => (
                <TR key={entry.id} onClick={() => setSelected(entry)} className="cursor-pointer">
                  <TD className="whitespace-nowrap text-muted">{formatDate(entry.date)}</TD>
                  <TD>
                    {userMap[entry.user_id]
                      ? `${userMap[entry.user_id].first_name} ${userMap[entry.user_id].last_name}`
                      : entry.user_id.slice(0, 8) + '…'}
                  </TD>
                  <TD>{formatHours(entry.hours_worked)}</TD>
                  <TD className="text-muted">
                    {entry.hourly_rate_cents != null ? formatCents(entry.hourly_rate_cents) + '/hr' : '—'}
                  </TD>
                  <TD className="text-muted">{truncate(entry.notes, 60)}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </Card>
      )}

      {selected && (
        <TimeEntrySlideOver
          entry={selected}
          userMap={userMap}
          costCodes={costCodes}
          onClose={() => setSelected(null)}
          onSaved={updated => { setTimeEntries(prev => (prev ?? []).map(e => e.id === updated.id ? updated : e)); setSelected(null); }}
          onDeleted={deletedId => { setTimeEntries(prev => (prev ?? []).filter(e => e.id !== deletedId)); setSelected(null); }}
        />
      )}
    </div>
  );
}
