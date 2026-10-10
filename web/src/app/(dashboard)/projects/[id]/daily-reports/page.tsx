'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import {
  Button, Textarea,
  Card, Table, THead, TBody, TR, TH, TD, SlideOver, EmptyState, SkeletonRows,
} from '@/components/ui';

interface Project { id: string; name: string }
interface DailyReport {
  id: string;
  report_date: string;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  version: number;
  weather: { conditions?: string; temperature?: number; wind?: string } | null;
}

function formatDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function truncate(text: string | null, max: number) {
  if (!text) return '—';
  return text.length > max ? text.slice(0, max) + '…' : text;
}

function ReportSlideOver({ report, onClose, onSaved }: {
  report: DailyReport; onClose: () => void; onSaved: (r: DailyReport) => void;
}) {
  const [notes, setNotes] = useState(report.notes ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const save = async () => {
    setSaving(true); setError('');
    try {
      const res = await fetch(`/api/daily-reports/${report.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: notes || null, version: report.version }),
      });
      const data = await res.json();
      if (res.status === 409) { setError('Report was updated by someone else — reload.'); return; }
      if (!res.ok) { setError(data?.error?.message ?? 'Save failed'); return; }
      onSaved(data.daily_report);
    } catch { setError('Network error'); } finally { setSaving(false); }
  };

  const weather = report.weather;

  return (
    <SlideOver
      open
      onClose={onClose}
      title="Daily Report"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={save} loading={saving}>Save Notes</Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <p className="text-xs text-muted">{formatDate(report.report_date)}</p>
        {error && <div className="rounded-md border border-status-danger/40 bg-status-danger-bg p-3 text-sm text-status-danger">{error}</div>}

        {weather && (
          <div className="rounded-md border border-status-info/40 bg-status-info-bg p-3">
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-status-info">Weather</p>
            <div className="space-y-0.5 text-sm text-ink">
              {weather.conditions && <p>Conditions: {weather.conditions}</p>}
              {weather.temperature != null && <p>Temperature: {weather.temperature}°F</p>}
              {weather.wind && <p>Wind: {weather.wind}</p>}
            </div>
          </div>
        )}

        <Textarea label="Notes" rows={10} value={notes} onChange={e => setNotes(e.target.value)}
          className="resize-none" placeholder="Daily report notes…" />

        <p className="border-t border-line pt-2 text-xs text-muted">Created {formatDate(report.created_at)}</p>
      </div>
    </SlideOver>
  );
}

export default function DailyReportsPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation('field');
  const [project, setProject] = useState<Project | null>(null);
  const [dailyReports, setDailyReports] = useState<DailyReport[] | null>(null);
  const [selected, setSelected] = useState<DailyReport | null>(null);

  const load = useCallback(() => {
    void Promise.allSettled([
      fetch(`/api/projects/${id}`).then(r => r.json()).then(d => { if (d.project) setProject(d.project as Project); }),
      fetch(`/api/daily-reports?project_id=${id}&limit=50`).then(r => r.json()).then(d => setDailyReports(d.daily_reports ?? [])),
    ]);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <div className="mb-1 flex items-center gap-2 text-sm text-muted">
          <Link href="/projects" className="hover:text-ink">Projects</Link>
          <span>/</span>
          <Link href={`/projects/${id}`} className="hover:text-ink">{project?.name ?? '…'}</Link>
          <span>/</span>
          <span className="text-ink">{t('daily_reports.title')}</span>
        </div>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight text-ink">{t('daily_reports.title')}</h1>
          <Link href={`/projects/${id}/daily-reports/new`}><Button>+ {t('daily_reports.new')}</Button></Link>
        </div>
      </div>

      {dailyReports === null ? (
        <SkeletonRows rows={5} />
      ) : dailyReports.length === 0 ? (
        <EmptyState title={t('daily_reports.no_reports')} />
      ) : (
        <Card padding="none" className="overflow-hidden">
          <Table>
            <THead>
              <TR>
                <TH>{t('daily_reports.date')}</TH>
                <TH>{t('daily_reports.weather')}</TH>
                <TH>{t('daily_reports.notes')}</TH>
                <TH>{t('daily_reports.created_at')}</TH>
              </TR>
            </THead>
            <TBody>
              {dailyReports.map(report => (
                <TR key={report.id} onClick={() => setSelected(report)} className="cursor-pointer">
                  <TD className="whitespace-nowrap text-muted">{formatDate(report.report_date)}</TD>
                  <TD className="text-muted">{report.weather?.conditions ?? '—'}</TD>
                  <TD>{truncate(report.notes, 80)}</TD>
                  <TD className="whitespace-nowrap text-muted">{formatDate(report.created_at)}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </Card>
      )}

      {selected && (
        <ReportSlideOver
          report={selected}
          onClose={() => setSelected(null)}
          onSaved={updated => { setDailyReports(prev => (prev ?? []).map(r => r.id === updated.id ? updated : r)); setSelected(null); }}
        />
      )}
    </div>
  );
}
