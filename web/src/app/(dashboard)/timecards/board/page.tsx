'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import {
  PageHeader, Button, Input, Textarea, Card, Table, THead, TBody, TR, TH, TD,
  EmptyState, SlideOver, Spinner,
} from '@/components/ui';

interface ActivePunch {
  id: string;
  user_id: string;
  project_id: string | null;
  clock_in_at: string;
  elapsed_hours: number;
  first_name: string;
  last_name: string;
  email: string;
  project_name: string | null;
  cost_code_id: string | null;
  notes: string | null;
  version: number;
}

interface EditForm {
  project_id: string;
  clock_in_at: string;
  clock_out_at: string;
  notes: string;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function formatElapsedFromHours(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.floor((hours - h) * 60);
  return `${h}h ${m}m`;
}

function toLocalDatetimeInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toISOFromLocalInput(local: string): string {
  return new Date(local).toISOString();
}

export default function BoardPage() {
  const { t } = useTranslation('field');
  const [punches, setPunches] = useState<ActivePunch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Edit slide-over
  const [editing, setEditing] = useState<ActivePunch | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({ project_id: '', clock_in_at: '', clock_out_at: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await fetch('/api/time-punches/active');
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error?.message ?? 'Failed to load.');
        return;
      }
      setPunches(data.active_punches ?? []);
    } catch { setError('Network error.'); } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => void load(true), 60000);
    return () => clearInterval(interval);
  }, [load]);

  const openEdit = (punch: ActivePunch) => {
    setEditing(punch);
    setSaveError('');
    setEditForm({
      project_id: punch.project_id ?? '',
      clock_in_at: toLocalDatetimeInput(punch.clock_in_at),
      clock_out_at: '',
      notes: punch.notes ?? '',
    });
  };

  const savePunch = async () => {
    if (!editing) return;
    setSaving(true); setSaveError('');
    try {
      const body: Record<string, unknown> = { version: editing.version };
      if (editForm.project_id) body.project_id = editForm.project_id;
      if (editForm.clock_in_at) body.clock_in_at = toISOFromLocalInput(editForm.clock_in_at);
      if (editForm.clock_out_at) body.clock_out_at = toISOFromLocalInput(editForm.clock_out_at);
      if (editForm.notes !== editing.notes) body.notes = editForm.notes;

      const res = await fetch(`/api/time-punches/${editing.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setSaveError(data?.error?.message ?? 'Save failed.');
        return;
      }
      setEditing(null);
      await load(true);
    } catch { setSaveError('Network error.'); } finally { setSaving(false); }
  };

  const tabCls = (active: boolean) =>
    `-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors ${active ? 'border-brand-600 text-ink' : 'border-transparent text-muted hover:text-ink'}`;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t('timecards.title')} />

      <div className="flex gap-1 border-b border-line">
        <Link href="/timecards" className={tabCls(false)}>{t('timecards.review_title')}</Link>
        <span className={tabCls(true)}>{t('board.title')}</span>
        <Link href="/timecards/clock" className={tabCls(false)}>{t('timecards.my_timecards')}</Link>
      </div>

      {error && (
        <div className="rounded-md border border-status-danger/40 bg-status-danger-bg p-3 text-sm text-status-danger">{error}</div>
      )}

      {/* Live board header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-block h-2.5 w-2.5 animate-pulse rounded-full bg-status-success" />
          <span className="text-sm font-medium text-ink">
            {punches.length === 1
              ? t('board.employees_clocked_in_one', { count: 1 })
              : t('board.employees_clocked_in_other', { count: punches.length })}
          </span>
        </div>
        <Button variant="ghost" size="sm" onClick={() => void load(true)} loading={refreshing}>
          {t('board.refresh')}
        </Button>
      </div>

      {punches.length === 0 ? (
        <EmptyState title={t('board.no_employees')} />
      ) : (
        <Card padding="none" className="overflow-hidden">
          <Table>
            <THead>
              <TR>
                <TH>{t('board.employee')}</TH>
                <TH>{t('board.project')}</TH>
                <TH>{t('board.clocked_in_at')}</TH>
                <TH>{t('board.elapsed')}</TH>
                <TH className="text-right"> </TH>
              </TR>
            </THead>
            <TBody>
              {punches.map((p) => (
                <TR key={p.id}>
                  <TD>
                    <div className="font-medium">{p.first_name} {p.last_name}</div>
                    <div className="text-xs text-muted">{p.email}</div>
                  </TD>
                  <TD className="text-muted">
                    {p.project_name ?? <span className="text-muted">{t('board.none')}</span>}
                  </TD>
                  <TD className="text-muted">{formatTime(p.clock_in_at)}</TD>
                  <TD className="font-medium tabular-nums">{formatElapsedFromHours(Number(p.elapsed_hours ?? 0))}</TD>
                  <TD className="text-right">
                    <button onClick={() => openEdit(p)} className="text-xs font-medium text-brand-600 hover:text-brand-700">
                      {t('common.edit', { defaultValue: 'Edit' })}
                    </button>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </Card>
      )}

      {/* Punch edit slide-over */}
      <SlideOver
        open={!!editing}
        onClose={() => setEditing(null)}
        title={t('time_punches.correction_title')}
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditing(null)}>{t('common.cancel', { defaultValue: 'Cancel' })}</Button>
            <Button onClick={savePunch} loading={saving}>{t('time_punches.save')}</Button>
          </>
        }
      >
        {editing && (
          <div className="space-y-4">
            <div className="rounded-md border border-status-warning/40 bg-status-warning-bg px-4 py-3 text-xs text-status-warning">
              {t('time_punches.admin_correction_notice')}
            </div>

            {saveError && (
              <div className="rounded-md border border-status-danger/40 bg-status-danger-bg px-4 py-3 text-sm text-status-danger">{saveError}</div>
            )}

            <div>
              <p className="mb-0.5 text-sm font-medium text-ink">{editing.first_name} {editing.last_name}</p>
              <p className="text-xs text-muted">{editing.email}</p>
            </div>

            <Input
              type="datetime-local"
              label={t('time_punches.clock_in_at_label')}
              value={editForm.clock_in_at}
              onChange={(e) => setEditForm((f) => ({ ...f, clock_in_at: e.target.value }))}
            />

            <Input
              type="datetime-local"
              label={t('time_punches.clock_out_at_label')}
              value={editForm.clock_out_at}
              onChange={(e) => setEditForm((f) => ({ ...f, clock_out_at: e.target.value }))}
            />

            <Textarea
              rows={2}
              label={t('time_punches.notes_label', { defaultValue: 'Notes' })}
              value={editForm.notes}
              onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder={t('time_punches.notes_placeholder')}
            />
          </div>
        )}
      </SlideOver>
    </div>
  );
}
